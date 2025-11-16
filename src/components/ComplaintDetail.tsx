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

const normalizeComplaint = (payload: any): ComplaintData => ({
  id: payload?.id ?? '',
  title: payload?.title ?? payload?.subject ?? 'Khiếu nại',
  description: payload?.description ?? payload?.content ?? '',
  status: (payload?.status ?? 'OPEN').toString().toUpperCase(),
  priority: payload?.priority ? payload.priority.toString().toUpperCase() : undefined,
  category: payload?.category ?? payload?.type ?? 'Khác',
  createdAt: payload?.createdAt ?? payload?.created_at ?? payload?.createdDate,
  updatedAt: payload?.updatedAt ?? payload?.updated_at ?? payload?.updatedDate,
  vehicleName: payload?.vehicleName ?? payload?.vehicle?.name,
  bookingId: payload?.bookingId ?? payload?.bookingCode ?? payload?.booking?.id,
  userId: payload?.userId ?? payload?.customerId ?? payload?.user?.id,
});

const normalizeMessage = (item: any): ComplaintMessage => {
  const type = (item?.messageType ?? item?.type ?? 'TEXT').toString().toUpperCase();
  // Keep UTC time as-is from backend, will convert to VN time when displaying
  const createdAt = item?.createdAt ?? item?.created_at ?? item?.timestamp ?? new Date().toISOString();
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
    content: item?.content ?? '',
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
  const { id } = useParams<{ id: string }>();
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

  const scrollWrapperRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const shouldForceScrollBottomRef = useRef(false);
  const wsClientRef = useRef<WSClient | null>(null);

  useEffect(() => {
    setComplaint(initialComplaint ?? null);
  }, [id, initialComplaint]);

  // Setup WebSocket connection for realtime messages
  useEffect(() => {
    if (!id) return;

    // Connect to complaint WebSocket
    const wsClient = connectComplaintSocket(id, { debug: false });
    wsClientRef.current = wsClient;

    // Listen for new messages
    const unsubscribeMessage = wsClient.on('newMessage', (data: any) => {
      const newMessage = normalizeMessage(data);
      setMessages((prev) => {
        // Check if message already exists
        const exists = prev.some((msg) => msg.id === newMessage.id);
        if (exists) return prev;

        // Add new message and sort by time
        const updated = [...prev, newMessage];
        updated.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        // Auto-scroll if near bottom
        shouldForceScrollBottomRef.current = true;
        return updated;
      });
    });

    // Listen for status updates
    const unsubscribeStatus = wsClient.on('statusUpdate', (data: any) => {
      if (data?.complaintId === id && data?.status) {
        setComplaint((prev) => {
          if (!prev) return prev;
          return { ...prev, status: data.status };
        });
        toast.info(`Trạng thái khiếu nại đã được cập nhật: ${getStatusLabel(data.status)}`);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      wsClient.close();
      wsClientRef.current = null;
    };
  }, [id]);

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
    async (body: { content: string; messageType: 'TEXT' | 'IMAGE' }) => {
      if (!id || !API_BASE_URL) {
        throw new Error('Không xác định được khiếu nại');
      }

      const res = await fetch(`${API_BASE_URL}/complaint-message`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          complaintId: id,
          messageType: body.messageType,
          content: body.content,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || 'Không thể gửi tin nhắn');
      }

      const payload = json?.data ?? json?.message ?? json;
      return normalizeMessage(payload);
    },
    [id]
  );

  const handleSendReply = async () => {
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
        newMessages.push(message);
      }

      if (attachments.length) {
        const urls = await uploadLicenseImages(attachments);
        for (const url of urls) {
          const imageMessage = await sendComplaintMessage({
            content: url,
            messageType: 'IMAGE',
          });
          newMessages.push(imageMessage);
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
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reply">Phản hồi của bạn</Label>
                      <Textarea
                        id="reply"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Nhập phản hồi của bạn..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Paperclip className="h-4 w-4 mr-2" />
                              Đính kèm file
                            </span>
                          </Button>
                        </Label>
                      </div>

                      <Button onClick={handleSendReply} disabled={sending}>
                        {sending ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Đang gửi...
                          </div>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Gửi phản hồi
                          </>
                        )}
                      </Button>
                    </div>

                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded"
                          >
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <button
                              onClick={() =>
                                setAttachments((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="text-red-500 hover:text-red-700"
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
                <p className="text-sm text-gray-600 mt-1">#{complaint.id}</p>
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
