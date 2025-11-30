import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Image as ImageIcon,
  User,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { uploadLicenseImages } from '../utils/media-upload';
import { formatVNTime } from '../utils/timezone';
import { connectComplaintSocket } from '../utils/ws-client';
import type { WSClient } from '../utils/ws-client';

const PAGE_SIZE = 10;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED' | string;
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | string;

interface ComplaintMessage {
  id: string;
  complaintId?: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE';
  createdAt: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  senderType?: string;
  attachments?: string[];
}

interface ComplaintData {
  id: string;
  complaintId?: string;
  title?: string;
  description?: string;
  status: ComplaintStatus;
  priority?: Priority;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  vehicleName?: string;
  bookingId?: string;
  userId?: string;
}

const sanitizeComplaintId = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (!str) return '';
  const lower = str.toLowerCase();
  if (lower === 'undefined' || lower === 'null') return '';
  return str;
};

const normalizeComplaint = (payload: any): ComplaintData => {
  const normalizedId = sanitizeComplaintId(
    payload?.complaintId ?? payload?.id ?? payload?.complaint_id ?? ''
  );
  return {
    id: normalizedId,
    complaintId: normalizedId,
    title: payload?.title ?? payload?.subject ?? 'Khiếu nại',
    description: payload?.description ?? payload?.content ?? '',
    status: (payload?.status ?? 'OPEN').toString().toUpperCase(),
    priority: payload?.priority ? payload.priority.toString().toUpperCase() : undefined,
    category: payload?.category ?? payload?.type ?? 'Khác',
    createdAt: payload?.createdAt ?? payload?.created_at ?? payload?.createdDate,
    updatedAt: payload?.updatedAt ?? payload?.updated_at ?? payload?.updatedDate,
    vehicleName: payload?.vehicleName ?? payload?.vehicle?.name,
    bookingId: payload?.bookingId ?? payload?.bookingCode ?? payload?.booking?.id,
    userId:
      payload?.userId ??
      payload?.user_id ??
      payload?.customerId ??
      payload?.customer_id ??
      payload?.user?.id ??
      payload?.user?.userId,
  };
};

const normalizeMessage = (item: any): ComplaintMessage => {
  const type = (item?.messageType ?? item?.type ?? 'TEXT').toString().toUpperCase();
  // Keep UTC time as-is from backend, will convert to VN time when displaying
  const createdAt = item?.createdAt ?? item?.created_at ?? item?.timestamp ?? new Date().toISOString();
  const complaintId = sanitizeComplaintId(
    item?.complaintId ?? item?.complaint_id ?? item?.complaint?.id ?? item?.complaint?.complaintId
  );
  const fallbackContent =
    item?.content ?? item?.message ?? item?.text ?? item?.data?.content ?? item?.data?.message ?? '';
  const attachmentSet = new Set<string>();

  if (Array.isArray(item?.attachments)) {
    item.attachments.filter(Boolean).forEach((url: string) => attachmentSet.add(url));
  }

  if (Array.isArray(item?.metadata?.attachments)) {
    item.metadata.attachments.filter(Boolean).forEach((url: string) => attachmentSet.add(url));
  }

  if (type === 'IMAGE' && item?.content) {
    attachmentSet.add(item.content);
  }

  return {
    id: item?.id ?? `${item?.senderId ?? 'msg'}-${createdAt}`,
    complaintId,
    content: fallbackContent,
    messageType: type === 'IMAGE' ? 'IMAGE' : 'TEXT',
    createdAt,
    senderId: item?.senderId ?? item?.sender_id ?? item?.userId ?? item?.createdBy,
    senderName: item?.senderName ?? item?.sender_name ?? item?.sender?.fullName ?? item?.sender?.name,
    senderAvatar: item?.senderAvatar ?? item?.sender?.avatar ?? item?.sender?.avatarUrl,
    senderType: item?.senderType ?? item?.sender_type ?? item?.role ?? item?.sender?.role,
    attachments: attachmentSet.size ? Array.from(attachmentSet) : undefined,
  };
};

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return undefined;
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const formatTime = (timestamp?: string) => {
  return formatVNTime(timestamp, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: ComplaintStatus) => {
  switch (status) {
    case 'OPEN':
      return 'bg-emerald-100 text-emerald-700';
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-700';
    case 'CLOSED':
      return 'bg-gray-200 text-gray-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getStatusLabel = (status: ComplaintStatus) => {
  switch (status) {
    case 'OPEN':
      return 'Đang mở';
    case 'IN_PROGRESS':
      return 'Đang xử lý';
    case 'CLOSED':
      return 'Đã đóng';
    case 'RESOLVED':
      return 'Đã giải quyết';
    default:
      return status;
  }
};

export function ComplaintDetail() {
  const { id: routeIdParam } = useParams<{ id: string }>();
  const id = sanitizeComplaintId(routeIdParam);
  const location = useLocation();
  const routeState = (location.state as { complaint?: ComplaintData } | null) ?? null;
  const initialComplaint = routeState?.complaint ?? null;
  const [complaint, setComplaint] = useState<ComplaintData | null>(initialComplaint);
  const [replyContent, setReplyContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [initialMessagesLoading, setInitialMessagesLoading] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const scrollWrapperRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const shouldForceScrollBottomRef = useRef(false);
  const wsClientRef = useRef<WSClient | null>(null);

  const extractComplaintId = useCallback((payload: any) => {
    return sanitizeComplaintId(
      payload?.complaintId ??
        payload?.complaint_id ??
        payload?.data?.complaintId ??
        payload?.complaint?.id ??
        payload?.data?.complaint_id
    );
  }, []);

  const isComplaintSocketReady = useCallback(() => {
    const socket = wsClientRef.current?.socket as WebSocket | { connected?: boolean } | undefined;
    if (!socket) return false;
    if ('readyState' in socket) {
      return socket.readyState === WebSocket.OPEN;
    }
    if ('connected' in socket) {
      return Boolean(socket.connected);
    }
    return false;
  }, []);

  useEffect(() => {
    setComplaint(initialComplaint ?? null);
  }, [id, initialComplaint]);

  // Setup WebSocket connection for realtime messages
  useEffect(() => {
    if (!id) return;

    // Connect to complaint WebSocket
    const wsClient = connectComplaintSocket(id, { debug: false });
    wsClientRef.current = wsClient;

    const handleIncomingMessage = (data: any) => {
      const normalized = normalizeMessage(data);
      const messageComplaintId = normalized.complaintId ?? extractComplaintId(data);
      if (messageComplaintId && messageComplaintId !== id) return;
      const rawPayload = (data?.data ?? data) as Record<string, any>;
      const hasContent =
        Boolean(rawPayload?.content && String(rawPayload.content).trim().length > 0) ||
        Boolean(rawPayload?.message && String(rawPayload.message).trim().length > 0) ||
        Boolean(rawPayload?.text && String(rawPayload.text).trim().length > 0) ||
        Boolean(normalized.attachments?.length);
      if (!hasContent) return;

      setMessages((prev) => {
        const updated = [...prev];
        const optimisticIdx = updated.findIndex(
          (msg) =>
            msg.id.startsWith('local-') &&
            msg.messageType === normalized.messageType &&
            msg.content === normalized.content &&
            (!msg.attachments || msg.attachments.join(',') === normalized.attachments?.join(','))
        );
        if (optimisticIdx >= 0) {
          updated[optimisticIdx] = normalized;
        } else if (!updated.some((msg) => msg.id === normalized.id)) {
          updated.push(normalized);
        }
        updated.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Auto-scroll if near bottom
        shouldForceScrollBottomRef.current = true;
        return updated;
      });
    };

    const handleStatusUpdate = (data: any) => {
      const statusRaw =
        data?.status ??
        data?.complaintStatus ??
        data?.complaint_status ??
        data?.data?.status ??
        '';
      const normalizedStatus = statusRaw ? statusRaw.toString().toUpperCase() : '';
      const targetComplaintId = extractComplaintId(data);

      if (targetComplaintId && targetComplaintId !== id) return;
      if (!normalizedStatus) return;

      setComplaint((prev) => {
        if (!prev) return prev;
        return { ...prev, status: normalizedStatus };
      });
      toast.info(`Trạng thái khiếu nại đã được cập nhật: ${getStatusLabel(normalizedStatus)}`);
    };

    // Listen for new messages & status updates (support multiple event names)
    const unsubscribeMessage = wsClient.on('newMessage', handleIncomingMessage);
    const unsubscribeGeneric = wsClient.on('message', handleIncomingMessage);
    const unsubscribeComplaintMessage = wsClient.on('complaintMessage', handleIncomingMessage);
    const unsubscribeComplaintMessageKebab = wsClient.on('complaint-message', handleIncomingMessage);
    const unsubscribeNewComplaintMessage = wsClient.on('newComplaintMessage', handleIncomingMessage);
    const unsubscribeComplaint = wsClient.on('complaint', handleIncomingMessage);
    const unsubscribeStatus = wsClient.on('statusUpdate', handleStatusUpdate);
    const unsubscribeStatusAlias = wsClient.on('complaintStatus', handleStatusUpdate);

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeGeneric();
      unsubscribeComplaintMessage();
      unsubscribeComplaintMessageKebab();
      unsubscribeNewComplaintMessage();
      unsubscribeComplaint();
      unsubscribeStatus();
      unsubscribeStatusAlias();
      wsClient.close();
      wsClientRef.current = null;
    };
  }, [extractComplaintId, id]);

  const fetchMessages = useCallback(
    async (
      pageToLoad: number,
      options: { replace?: boolean; preserveScroll?: { height: number; top: number } } = {}
    ) => {
      if (!id || !API_BASE_URL) return;
      const isReplace = options.replace ?? pageToLoad === 1;

      if (isReplace) {
        setInitialMessagesLoading(true);
      } else {
        setLoadingOlderMessages(true);
      }
      setMessagesError(null);

      try {
        const url = new URL(`${API_BASE_URL}/complaint-message`);
        url.searchParams.set('limit', PAGE_SIZE.toString());
        url.searchParams.set('page', pageToLoad.toString());
        url.searchParams.set('complaintId', id);

        const res = await fetch(url.toString(), {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...getAuthHeaders(),
          },
        });

        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.message || 'Không thể tải lịch sử trò chuyện');
        }

        const payload = body?.data ?? body;
        const rawList =
          payload?.complaintMessages ??
          payload?.items ??
          payload?.messages ??
          payload?.results ??
          payload?.data ??
          [];
        const normalized = Array.isArray(rawList) ? rawList.map(normalizeMessage) : [];
        normalized.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setMessages((prev) => {
          if (isReplace) {
            return normalized;
          }

          const merged = new Map<string, ComplaintMessage>();
          normalized.forEach((item) => merged.set(item.id, item));
          prev.forEach((item) => merged.set(item.id, item));
          const result = Array.from(merged.values());
          result.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return result;
        });

        const currentPage = Number(payload?.page) || pageToLoad;
        setMessagesPage(currentPage);

        const limitFromPayload = Number(payload?.limit) || PAGE_SIZE;
        const totalPages = Number(payload?.totalPages ?? payload?.total_pages);

        if (Number.isFinite(totalPages) && totalPages > 0) {
          setHasMoreMessages(currentPage < totalPages);
        } else {
          const totalItems = Number(
            payload?.totalItems ?? payload?.total ?? payload?.count ?? payload?.total_records
          );
          if (Number.isFinite(totalItems) && totalItems >= 0) {
            const computedPages = Math.max(1, Math.ceil(totalItems / limitFromPayload));
            setHasMoreMessages(currentPage < computedPages);
          } else {
            setHasMoreMessages(normalized.length === limitFromPayload);
          }
        }

        if (isReplace) {
          shouldForceScrollBottomRef.current = true;
        } else if (options.preserveScroll) {
          requestAnimationFrame(() => {
            const viewport = viewportRef.current;
            if (!viewport) return;
            const newScrollHeight = viewport.scrollHeight;
            viewport.scrollTop =
              newScrollHeight - options.preserveScroll!.height + options.preserveScroll!.top;
          });
        }
      } catch (error) {
        console.error('Fetch messages error:', error);
        setMessagesError(
          error instanceof Error ? error.message : 'Không thể tải lịch sử trò chuyện'
        );
        setHasMoreMessages(false);
      } finally {
        if (isReplace) {
          setInitialMessagesLoading(false);
        } else {
          setLoadingOlderMessages(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id || !API_BASE_URL) {
      setMessages([]);
      setInitialMessagesLoading(false);
      return;
    }
    setMessages([]);
    setHasMoreMessages(true);
    setMessagesPage(1);
    shouldForceScrollBottomRef.current = true;
    fetchMessages(1, { replace: true });
  }, [id, fetchMessages]);

  const loadOlderMessages = useCallback(() => {
    if (!hasMoreMessages || loadingOlderMessages || initialMessagesLoading) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    fetchMessages(messagesPage + 1, {
      preserveScroll: { height: viewport.scrollHeight, top: viewport.scrollTop },
    });
  }, [
    fetchMessages,
    hasMoreMessages,
    loadingOlderMessages,
    initialMessagesLoading,
    messagesPage,
  ]);

  useEffect(() => {
    const wrapper = scrollWrapperRef.current;
    if (!wrapper) return;

    const viewport = wrapper.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLDivElement | null;

    if (!viewport) return;
    viewportRef.current = viewport;

    const handleScroll = () => {
      if (
        viewport.scrollTop < 40 &&
        hasMoreMessages &&
        !loadingOlderMessages &&
        !initialMessagesLoading
      ) {
        loadOlderMessages();
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, [loadOlderMessages, hasMoreMessages, loadingOlderMessages, initialMessagesLoading]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth', force = false) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      if (!force) {
        const distanceToBottom =
          viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
        if (distanceToBottom > 80) return;
      }
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    },
    []
  );

  useEffect(() => {
    if (!messages.length) return;
    if (!shouldForceScrollBottomRef.current) return;

    requestAnimationFrame(() => {
      scrollToBottom('auto', true);
      shouldForceScrollBottomRef.current = false;
    });
  }, [messages, scrollToBottom]);

  const sendComplaintMessage = useCallback(
    async (body: { content: string; messageType: 'TEXT' | 'IMAGE' }): Promise<ComplaintMessage | null> => {
      if (!id) {
        throw new Error('Không xác định được khiếu nại');
      }

      const payload = {
        complaintId: id,
        messageType: body.messageType,
        content: body.content,
      };

      const wsClient = wsClientRef.current;
      if (!wsClient || !isComplaintSocketReady()) {
        throw new Error('Kết nối realtime chưa sẵn sàng, vui lòng thử lại.');
      }

      try {
        wsClient.send(payload);
        // Optimistic local message so UI updates immediately; server echo will dedupe by id/content
        const optimistic = normalizeMessage({
          ...payload,
          id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
          senderId: complaint?.userId,
          senderType: 'USER',
        });
        return optimistic;
      } catch (error) {
        console.error('WebSocket gửi tin nhắn khiếu nại lỗi:', error);
        throw error instanceof Error ? error : new Error('Không thể gửi tin nhắn qua realtime');
      }

      },
    [complaint?.userId, id, isComplaintSocketReady]
  );

  const handleSendReply = async () => {
    if (sending) return;
    if (!replyContent.trim() && attachments.length === 0) {
      toast.error('Vui lòng nhập nội dung hoặc chọn ảnh đính kèm');
      return;
    }

    setSending(true);
    try {
      const newMessages: ComplaintMessage[] = [];

      if (replyContent.trim()) {
        const message = await sendComplaintMessage({
          content: replyContent.trim(),
          messageType: 'TEXT',
        });
        if (message) {
          newMessages.push(message);
        }
      }

      if (attachments.length) {
        const urls = await uploadLicenseImages(attachments);
        for (const url of urls) {
          const imageMessage = await sendComplaintMessage({
            content: url,
            messageType: 'IMAGE',
          });
          if (imageMessage) {
            newMessages.push(imageMessage);
          }
        }
      }

      if (newMessages.length) {
        shouldForceScrollBottomRef.current = true;
        setMessages((prev) => {
          const merged = new Map<string, ComplaintMessage>();
          prev.forEach((item) => merged.set(item.id, item));
          newMessages.forEach((item) => merged.set(item.id, item));
          const result = Array.from(merged.values());
          result.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return result;
        });
      }

      setReplyContent('');
      setAttachments([]);
    } catch (error) {
      console.error('Send complaint message error:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi phản hồi');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setAttachments((prev) => [...prev, ...files]);
    event.target.value = '';
  };

  const isUserMessage = (message: ComplaintMessage) => {
    if (complaint?.userId && message.senderId) {
      return complaint.userId === message.senderId;
    }
    if (message.senderType) {
      const role = message.senderType.toUpperCase();
      return role === 'USER' || role === 'CUSTOMER';
    }
    return false;
  };

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy khiếu nại</h2>
          <Link to="/profile/complaints">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = complaint.status?.toUpperCase() === 'CLOSED';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/profile/complaints">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách khiếu nại
          </Button>
        </Link>
      </div>

      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-5xl w-full">
          {previewImage && (
            <div className="flex justify-center">
              <img
                src={previewImage}
                alt="Xem ảnh đầy đủ"
                className="max-h-[80vh] w-auto object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5" />
                  <span>Cuộc trò chuyện</span>
                </div>
                <Badge className={getStatusColor(complaint.status)}>
                  {getStatusLabel(complaint.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div ref={scrollWrapperRef}>
                <ScrollArea className="h-96 p-4">
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-blue-900">{complaint.title}</h3>
                            {complaint.createdAt && (
                              <span className="text-sm text-blue-700">
                                {formatTime(complaint.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-blue-900 mt-2 whitespace-pre-line">
                            {complaint.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {messagesError && (
                      <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-md px-3 py-2">
                        {messagesError}
                      </div>
                    )}

                    {loadingOlderMessages && !initialMessagesLoading && (
                      <div className="flex justify-center items-center text-xs text-gray-500">
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Đang tải tin nhắn cũ...
                      </div>
                    )}

                    {initialMessagesLoading ? (
                      <div className="flex justify-center items-center py-6 text-gray-500">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Đang tải cuộc trò chuyện...
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-sm text-gray-500">Chưa có tin nhắn nào.</p>
                    ) : (
                      messages.map((message) => {
                        const fromUser = isUserMessage(message);
                        return (
                          <div
                            key={message.id}
                            className={`flex ${fromUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`flex items-start space-x-3 max-w-4xl ${
                                fromUser ? 'flex-row-reverse space-x-reverse' : ''
                              }`}
                            >
                              <Avatar className="h-8 w-8">
                                {message.senderAvatar ? (
                                  <AvatarImage src={message.senderAvatar} />
                                ) : (
                                  <AvatarFallback>{fromUser ? 'U' : 'A'}</AvatarFallback>
                                )}
                              </Avatar>
                              <div
                                className={`rounded-lg p-4 ${
                                  fromUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium">
                                    {message.senderName ?? (fromUser ? 'Bạn' : 'Hỗ trợ')}
                                  </span>
                                  <span
                                    className={`text-xs ${
                                      fromUser ? 'text-blue-100' : 'text-gray-500'
                                    }`}
                                  >
                                    {formatTime(message.createdAt)}
                                  </span>
                                </div>

                                {message.messageType === 'TEXT' && message.content && (
                                  <p className="text-sm leading-relaxed whitespace-pre-line">
                                    {message.content}
                                  </p>
                                )}

                                {message.attachments && message.attachments.length > 0 && (
                                  <div
                                    className={`mt-3 grid ${
                                      message.attachments.length === 1
                                        ? 'grid-cols-1'
                                        : 'grid-cols-2'
                                    } gap-2`}
                                  >
                                    {message.attachments.map((attachment, idx) => (
                                      <ImageWithFallback
                                        key={`${message.id}-${idx}`}
                                        src={attachment}
                                        alt={`Attachment ${idx + 1}`}
                                        className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                                        onClick={() => setPreviewImage(attachment)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {!isClosed && (
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-800">Phản hồi của bạn</div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-2 shadow-sm">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload" className="cursor-pointer flex-shrink-0">
                        <Paperclip className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                      </Label>
                      <Textarea
                        id="reply"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        placeholder="Nhập tin nhắn trả lời..."
                        rows={1}
                        className="flex-1 resize-none border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-1 text-sm"
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
                        onClick={handleSendReply}
                        disabled={sending || (!replyContent.trim() && attachments.length === 0)}
                        title="Gửi phản hồi"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                          >
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{file.name}</span>
                            <button
                              onClick={() =>
                                setAttachments((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="text-red-500 hover:text-red-700"
                              aria-label="Xóa file đính kèm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin khiếu nại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Mã khiếu nại</Label>
                <p className="text-sm text-gray-600 mt-1">
                  #{complaint.id || complaint.complaintId || '—'}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Trạng thái</Label>
                <Badge className={`${getStatusColor(complaint.status)} mt-1`}>
                  {getStatusLabel(complaint.status)}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium">Ngày tạo</Label>
                <p className="text-sm text-gray-600 mt-1">{formatTime(complaint.createdAt)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Cập nhật cuối</Label>
                <p className="text-sm text-gray-600 mt-1">{formatTime(complaint.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {complaint.bookingId && complaint.vehicleName && (
            <Card>
              <CardHeader>
                <CardTitle>Đơn hàng liên quan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Mã đơn hàng</Label>
                  <p className="text-sm text-gray-600 mt-1">#{complaint.bookingId}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Xe thuê</Label>
                  <p className="text-sm text-gray-600 mt-1">{complaint.vehicleName}</p>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  Xem chi tiết đơn hàng
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
