// Lightweight WebSocket client with auto-reconnect and event dispatch

import { io, Socket } from 'socket.io-client';

type EventHandler = (data: any) => void;

export type WSClient = {
  send: (payload: any) => void;
  close: () => void;
  on: (event: string, handler: EventHandler) => () => void;
  socket?: WebSocket | Socket;
};

function isWsEnabled(): boolean {
  const flag = (import.meta.env.VITE_ENABLE_WS || 'false').toString().toLowerCase();
  return flag === 'true' || flag === '1';
}

const ensureTrailingSlash = (value: string) =>
  value.endsWith('/') ? value : `${value}/`;

function normalizeToWs(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'ws:';
    } else if (parsed.protocol === 'https:') {
      parsed.protocol = 'wss:';
    }
    return ensureTrailingSlash(parsed.toString());
  } catch {
    return ensureTrailingSlash(urlString);
  }
}

function getWsBase(): string {
  const override = import.meta.env.VITE_WS_BASE_URL;
  if (override) {
    return normalizeToWs(override);
  }

  const api = import.meta.env.VITE_API_BASE_URL || '';
  try {
    const url = new URL(api);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const basePath = url.pathname.replace(/\/?api\/?$/, '/');
    return ensureTrailingSlash(`${protocol}//${url.host}${basePath}`);
  } catch {
    const loc = typeof window !== 'undefined' ? window.location : { protocol: 'https:', host: '' } as Location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return ensureTrailingSlash(`${protocol}//${loc.host}/`);
  }
}

function buildWsUrl(path: string): string {
  const base = getWsBase();
  const full = new URL(path, base);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      full.searchParams.set('token', token);
    }
  }
  return full.toString();
}

function getSocketIoBase(): string {
  const override = import.meta.env.VITE_WS_HTTP_BASE_URL;
  const resolveBase = (value: string) => {
    try {
      const url = new URL(value);
      if (url.protocol === 'ws:') url.protocol = 'http:';
      if (url.protocol === 'wss:') url.protocol = 'https:';
      const basePath = url.pathname.replace(/\/?api\/?$/, '/');
      return ensureTrailingSlash(`${url.protocol}//${url.host}${basePath}`);
    } catch {
      return ensureTrailingSlash(value);
    }
  };

  if (override) return resolveBase(override);

  const api = import.meta.env.VITE_API_BASE_URL;
  if (api) return resolveBase(api);

  if (typeof window !== 'undefined') {
    const loc = window.location;
    return ensureTrailingSlash(`${loc.protocol}//${loc.host}/`);
  }
  return 'https://localhost/';
}

export function createWebSocket(path: string, opts?: { reconnect?: boolean; debug?: boolean }): WSClient {
  if (!isWsEnabled()) {
    return {
      send() {},
      close() {},
      on() { return () => {}; },
    };
  }

  const url = buildWsUrl(path.startsWith('/') ? path : `/${path}`);
  const reconnect = opts?.reconnect !== false;
  const debug = !!opts?.debug;

  let socket: WebSocket | undefined;
  let timer: number | undefined;
  let backoff = 1000; // start with 1s
  const handlers = new Map<string, Set<EventHandler>>();

  const log = (...args: any[]) => debug && console.debug('[WS]', ...args);

  const dispatch = (event: string, data: any) => {
    const set = handlers.get(event);
    if (set) set.forEach((h) => h(data));
  };

  const connect = () => {
    log('connecting to', url);
    socket = new WebSocket(url);

    socket.onopen = () => {
      log('open');
      backoff = 1000;
      dispatch('open', { url });
      // heartbeat
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
      }, 25000);
    };

    socket.onmessage = (ev) => {
      const text = typeof ev.data === 'string' ? ev.data : '';
      try {
        const msg = JSON.parse(text);
        // support either {event, data} or {type, data}
        const event = msg.event || msg.type || 'message';
        dispatch(event, msg.data ?? msg);
      } catch {
        dispatch('message', text);
      }
    };

    socket.onclose = (event) => {
      log('close');
      dispatch('close', { code: event.code, reason: event.reason });
      if (timer) window.clearInterval(timer);
      if (reconnect) {
        setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 15000);
      }
    };

    socket.onerror = (err) => {
      log('error', err);
      dispatch('error', err);
      // browser will trigger onclose after error
    };
  };

  connect();

  return {
    get socket() {
      return socket;
    },
    send(payload: any) {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
      socket.send(data);
    },
    close() {
      if (timer) window.clearInterval(timer);
      if (reconnect && socket) {
        (socket as any)._noReconnect = true;
      }
      socket?.close();
    },
    on(event: string, handler: EventHandler) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      return () => handlers.get(event)!.delete(handler);
    },
  };
}

// Convenience helpers
function createSocketIoClient(
  path: string,
  options?: {
    debug?: boolean;
    query?: Record<string, string | number | boolean | undefined>;
    includeToken?: boolean;
  }
) {
  if (!isWsEnabled()) {
    return createWebSocket(path, { reconnect: true, debug: options?.debug });
  }

  const base = getSocketIoBase();
  const includeToken = options?.includeToken !== false;
  const token =
    includeToken && typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;
  const authToken = token ? `Bearer ${token}` : undefined;
  const namespaceUrl = new URL(path.startsWith('/') ? path : `/${path}`, base).toString();

  const query: Record<string, string> = {};
  if (token) query.token = token;
  if (options?.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query[key] = String(value);
      }
    });
  }

  const socket: Socket = io(namespaceUrl, {
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket'],
    auth: authToken ? { token: authToken } : undefined,
    query: Object.keys(query).length ? query : undefined,
    autoConnect: true
  });

  if (options?.debug) {
    socket.onAny((event, ...args) => console.debug('[WS]', path, event, ...args));
  }

  return {
    send(payload: any) {
      socket.emit('message', payload);
    },
    close() {
      socket.disconnect();
    },
    on(event: string, handler: EventHandler) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    },
    socket
  };
}

export function connectNotificationSocket(options?: { debug?: boolean }) {
  return createSocketIoClient('/notification', options);
}

export function connectChatSocket(options?: { debug?: boolean }) {
  return createSocketIoClient('/chat', options);
}

export function connectPaymentSocket(options?: { debug?: boolean }) {
  return createSocketIoClient('/payment', options);
}

export function connectComplaintSocket(complaintId: string, options?: { debug?: boolean }) {
  const client = createSocketIoClient('/complaint', {
    debug: options?.debug,
    query: { complaintId },
  });

  // Override send to emit the correct event for complaint messages
  return {
    ...client,
    send(payload: any) {
      if (client.socket && 'emit' in client.socket && typeof (client.socket as any).emit === 'function') {
        (client.socket as any).emit('sendComplaintMessage', payload);
      } else {
        client.send(payload);
      }
    },
  };
}
