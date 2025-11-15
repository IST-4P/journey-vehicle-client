import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { connectChatSocket } from '../utils/ws-client';
import { refreshAccessToken } from '../utils/auth';
import { ComplaintModal } from './ComplaintModal';

interface ServerChatMessage {
  id?: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  fromUserId: string;
  toUserId: string;
  timestamp: Date;
  isOutgoing: boolean;
}

const SUPPORT_USER_ID =
  import.meta.env.VITE_SUPPORT_USER_ID ?? '4d991046-125d-4ed3-a5d7-b3f101768e4e';
const CHAT_PAGE_SIZE = 10;

const getStoredAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [stage, setStage] = useState<'intro' | 'chat' | 'login'>('intro');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [chatSocket, setChatSocket] =
    useState<ReturnType<typeof connectChatSocket> | null>(null);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);

  const scrollToBottom = (
    behavior: ScrollBehavior = 'smooth',
    force = false,
  ) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (!force && !shouldStickToBottomRef.current) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  const mapServerMessage = useCallback((msg: ServerChatMessage): ChatMessage => {
    const timestamp = msg.createdAt ? new Date(msg.createdAt) : new Date();
    return {
      id: msg.id || `${msg.fromUserId}-${timestamp.getTime()}`,
      content: msg.content,
      fromUserId: msg.fromUserId,
      toUserId: msg.toUserId,
      timestamp,
      isOutgoing: msg.fromUserId !== SUPPORT_USER_ID,
    };
  }, []);

  const fetchMessages = useCallback(
    async (targetPage: number, { replace }: { replace?: boolean } = {}) => {
      if (!accessToken || isFetchingRef.current) return;
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      if (!apiBase) return;

      isFetchingRef.current = true;
      if (replace) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingOlder(true);
      }

      try {
        const url = new URL(`${apiBase}/chat`);
        url.searchParams.set('toUserId', SUPPORT_USER_ID);
        url.searchParams.set('page', targetPage.toString());
        url.searchParams.set('limit', CHAT_PAGE_SIZE.toString());

        const res = await fetch(url.toString(), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch chat history (${res.status})`);
        }

        const body = await res.json();
        const chats: ServerChatMessage[] = body?.data?.chats ?? [];
        const mapped = chats.map(mapServerMessage);
        mapped.sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        );

        if (replace) {
          setMessages(mapped);
          setPage(targetPage);
          setHasMore(chats.length === CHAT_PAGE_SIZE);
          requestAnimationFrame(() => scrollToBottom('auto', true));
        } else {
          const container = scrollContainerRef.current;
          const prevScrollHeight = container?.scrollHeight ?? 0;
          const prevScrollTop = container?.scrollTop ?? 0;

          setMessages((prev) => {
            const existingIds = new Set(prev.map((msg) => msg.id));
            const merged = [
              ...mapped.filter((msg) => !existingIds.has(msg.id)),
              ...prev,
            ];
            return merged;
          });

          requestAnimationFrame(() => {
            const el = scrollContainerRef.current;
            if (!el) return;
            const newScrollHeight = el.scrollHeight;
            el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
          });

          setPage(targetPage);
          setHasMore(chats.length === CHAT_PAGE_SIZE);
        }
      } catch (error) {
        console.error('Load chat history failed:', error);
      } finally {
        isFetchingRef.current = false;
        if (replace) {
          setIsInitialLoading(false);
        } else {
          setIsLoadingOlder(false);
        }
      }
    },
    [accessToken, mapServerMessage],
  );

  const handleIncomingMessage = useCallback(
    (incoming: ServerChatMessage) => {
      const mapped = mapServerMessage(incoming);
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === mapped.id)) {
          return prev;
        }
        return [...prev, mapped];
      });
      shouldStickToBottomRef.current = true;
      requestAnimationFrame(() => scrollToBottom());
    },
    [mapServerMessage],
  );

  const handleSendMessage = (content: string) => {
    if (!content.trim() || !accessToken) return;
    const trimmed = content.trim();

    setInputValue('');
    shouldStickToBottomRef.current = true;
    requestAnimationFrame(() => scrollToBottom());

    const socket = chatSocket?.socket;
    if (socket && 'emit' in socket && typeof socket.emit === 'function') {
      socket.emit('sendChat', {
        toUserId: SUPPORT_USER_ID,
        content: trimmed,
      });
    } else {
      console.error('[ChatWidget] Socket is not available or does not support emit');
    }
  };

  const handleQuickReply = (text: string) => handleSendMessage(text);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const nearTop = container.scrollTop < 40;
    const nearBottom =
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight <
      40;
    shouldStickToBottomRef.current = nearBottom;

    if (
      nearTop &&
      hasMore &&
      !isLoadingOlder &&
      !isInitialLoading &&
      accessToken
    ) {
      fetchMessages(page + 1);
    }
  }, [
    fetchMessages,
    hasMore,
    isLoadingOlder,
    isInitialLoading,
    page,
    accessToken,
  ]);

  const handleSupportClick = useCallback(async () => {
    if (isAuthChecking) return;
    setIsAuthChecking(true);

    // FIX: Thử refresh token để lấy accessToken (cho cookie-based auth)
    const success = await refreshAccessToken();
    if (success) {
      const token = getStoredAccessToken();
      console.log('[ChatWidget] Support click - got token:', token ? 'Token exists' : 'No token');
      setAccessToken(token);
      setStage('chat');
    } else {
      console.log('[ChatWidget] Support click - no valid session, show login');
      setStage('login');
    }
    setIsAuthChecking(false);
  }, []);

  // FIX 1: Lắng nghe storage event + CustomEvent
  // Thêm delay để đảm bảo event được phát ra trước khi component mount
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        const newToken = e.newValue;
        console.log('[ChatWidget] Storage changed:', newToken ? 'Token exists' : 'Token removed');
        setAccessToken(newToken);
      }
      // FIX: Lắng nghe cookieAuth flag
      if (e.key === 'cookieAuth' && e.newValue === 'true') {
        console.log('[ChatWidget] Cookie-based auth detected');
        setAccessToken('COOKIE_AUTH'); // Special marker
      }
    };

    // FIX 2: Dùng (event as CustomEvent) để fix TypeScript
    const handleTokenChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const token = customEvent?.detail?.token ?? null;
      console.log('[ChatWidget] AccessTokenChanged event fired:', token ? 'Token exists' : 'Token removed');
      setAccessToken(token);
    };

    // Check token ngay khi component mount
    const token = getStoredAccessToken();
    const cookieAuth = localStorage.getItem('cookieAuth');

    if (cookieAuth === 'true') {
      console.log('[ChatWidget] Initial check: Cookie-based auth detected');
      setAccessToken('COOKIE_AUTH');
    } else if (token) {
      console.log('[ChatWidget] Initial token check: Token exists');
      setAccessToken(token);
    } else {
      console.log('[ChatWidget] Initial token check: No token');
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('accessTokenChanged', handleTokenChanged);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('accessTokenChanged', handleTokenChanged);
    };
  }, []);

  // Transition between stages when token state changes
  useEffect(() => {
    if (!accessToken && stage === 'chat') {
      setStage('intro');
    }
    if (accessToken && (stage === 'login' || stage === 'intro')) {
      setStage('chat');
    }
  }, [accessToken, stage]);

  // Auto connect socket when widget opens & authenticated
  useEffect(() => {
    if (!isOpen || !accessToken || stage !== 'chat') return;

    const socketClient = connectChatSocket();
    setChatSocket(socketClient);

    const offNewChat = socketClient.on('newChat', (payload: ServerChatMessage) =>
      handleIncomingMessage(payload),
    );

    return () => {
      offNewChat();
      socketClient.close();
      setChatSocket(null);
    };
  }, [isOpen, accessToken, stage, handleIncomingMessage]);

  // Load initial messages each time widget opens in chat mode
  useEffect(() => {
    if (!isOpen || !accessToken || stage !== 'chat') return;
    setPage(1);
    setHasMore(true);
    fetchMessages(1, { replace: true });
  }, [isOpen, accessToken, stage, fetchMessages]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, isOpen]);

  const isAuthenticated = stage === 'chat' && Boolean(accessToken);

  if (!isOpen) {
    return (
      <>
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
        <ComplaintModal open={isComplaintOpen} onClose={setIsComplaintOpen} />
      </>
    );
  }

  const renderMessages = () => (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
    >
      {isLoadingOlder && (
        <div className="text-center text-xs text-gray-500">Đang tải...</div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex items-end gap-2 ${
            message.isOutgoing ? 'justify-end' : 'justify-start'
          }`}
        >
          {!message.isOutgoing && (
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarFallback className="bg-blue-100">
                <Bot className="h-3 w-3 text-blue-600" />
              </AvatarFallback>
            </Avatar>
          )}
          <div className={`flex flex-col ${message.isOutgoing ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                message.isOutgoing
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div>{message.content}</div>
            </div>
            <div className="text-xs text-gray-500 mt-1 px-1">
              {formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      ))}
      <div />
    </div>
  );

  const quickReplies = [
    'Cách thuê xe?',
    'Liên hệ hỗ trợ',
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Card
          className={`w-80 border shadow-xl transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[500px]'
          } flex flex-col rounded-xl bg-white`}
        >
        <CardHeader className="flex-shrink-0 px-4 py-3 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">Trợ lý HacMieu</CardTitle>
                <p className="text-xs text-blue-100">Đang hoạt động</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 text-white hover:bg-blue-500"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setStage('intro');
                  setIsAuthChecking(false);
                  setMessages([]);
                }}
                className="h-8 w-8 p-0 text-white hover:bg-blue-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0 flex flex-col flex-1 min-h-0">
              {stage === 'intro' ? (
                <div className="flex flex-1 flex-col items-center justify-center space-y-4 px-6 text-center">
                  <p className="text-sm font-medium text-gray-800 leading-relaxed">
                    Nhấn "Tôi cần hỗ trợ" để kết nối với đội ngũ chăm sóc khách hàng.
                  </p>
                  <p className="text-xs text-gray-500">
                    Chúng tôi sẽ kiểm tra phiên đăng nhập của bạn trước khi mở chat.
                  </p>
                  <Button
                    className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                    disabled={isAuthChecking}
                    onClick={handleSupportClick}
                  >
                    {isAuthChecking ? 'Đang kiểm tra...' : 'Tôi cần hỗ trợ'}
                  </Button>
                </div>
              ) : stage === 'login' ? (
                <div className="flex flex-1 flex-col items-center justify-center space-y-4 px-6 text-center">
                  <p className="text-sm font-medium text-gray-800 leading-relaxed">
                    Bạn cần đăng nhập để trò chuyện với đội ngũ HacMieu.
                  </p>
                  <Button
                    onClick={() => (window.location.href = '/login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Đăng nhập
                  </Button>
                </div>
              ) : isInitialLoading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                  Đang tải cuộc trò chuyện...
                </div>
              ) : (
                <>
                  {renderMessages()}
                  <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Câu hỏi gợi ý:</div>
                      <div className="flex flex-wrap gap-1">
                        {quickReplies.map((reply) => (
                          <Button
                            key={reply}
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2"
                            onClick={() => handleQuickReply(reply)}
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setIsComplaintOpen(true)}
                    >
                      Mở khiếu nại / trao đổi với hỗ trợ
                    </Button>
                  </div>
                  <div className="flex-shrink-0 p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(inputValue);
                          }
                        }}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 text-sm"
                      />
                      <Button
                        className="h-8"
                        onClick={() => handleSendMessage(inputValue)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </>
        )}
        </Card>
      </div>
      <ComplaintModal open={isComplaintOpen} onClose={setIsComplaintOpen} />
    </>
  );
}
