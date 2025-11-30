import {
  ArrowLeft,
  ChevronLeft,
  ImagePlus,
  MessageSquare,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { convertUTCToVN, formatRelativeTime } from "../utils/timezone";
import { uploadLicenseImages } from "../utils/media-upload";

const sanitizeId = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (!str) return "";
  const lower = str.toLowerCase();
  if (lower === "undefined" || lower === "null") return "";
  return str;
};

interface ComplaintSummary {
  complaintId: string;
  userId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface ComplaintMessage {
  id: string;
  content: string;
  sender: "user" | "admin";
  createdAt: string;
  attachments?: string[];
}

const DEFAULT_COMPLAINT_PAGE_LIMIT = 20;

const normalizeComplaintSummary = (payload: any): ComplaintSummary => {
  const rawId =
    payload?.complaintId ?? payload?.complaint_id ?? payload?.id ?? payload?.cId ?? "";
  const complaintId = sanitizeId(rawId);
  const lastMessagePayload = payload?.lastMessage ?? payload?.last_message ?? null;
  const lastMessage =
    typeof lastMessagePayload === "string"
      ? lastMessagePayload
      : lastMessagePayload?.content ??
        lastMessagePayload?.message ??
        lastMessagePayload?.text ??
        undefined;
  const lastMessageAt =
    payload?.lastMessageAt ??
    payload?.last_message_at ??
    lastMessagePayload?.createdAt ??
    lastMessagePayload?.created_at ??
    lastMessagePayload?.timestamp ??
    payload?.updatedAt ??
    payload?.updated_at ??
    undefined;

  const fallbackCreatedAt =
    payload?.createdAt ??
    payload?.created_at ??
    payload?.createdDate ??
    payload?.created_date ??
    new Date().toISOString();

  const resolvedComplaintId =
    complaintId ||
    sanitizeId(payload?.id ?? payload?.complaint_id ?? payload?.cId ?? payload?.complaintCode);

  return {
    complaintId: resolvedComplaintId,
    userId:
      payload?.userId ??
      payload?.user_id ??
      payload?.customerId ??
      payload?.customer_id ??
      payload?.user?.id ??
      payload?.user?.userId ??
      "",
    title: payload?.title ?? payload?.subject ?? payload?.name ?? "Khiếu nại",
    status: (payload?.status ?? "OPEN").toString().toUpperCase(),
    createdAt: fallbackCreatedAt,
    updatedAt: payload?.updatedAt ?? payload?.updated_at ?? payload?.updatedDate,
    lastMessage: lastMessage,
    lastMessageAt: lastMessageAt,
  };
};

const normalizeComplaintMessage = (
  payload: any,
  complaintUserId?: string
): ComplaintMessage | null => {
  if (!payload) {
    return null;
  }

  const createdAt =
    payload?.createdAt ?? payload?.created_at ?? payload?.timestamp ?? new Date().toISOString();
  const senderId =
    payload?.senderId ??
    payload?.sender_id ??
    payload?.userId ??
    payload?.user_id ??
    payload?.createdBy ??
    payload?.sender?.id;
  const senderType = (
    payload?.senderType ??
    payload?.sender_type ??
    payload?.role ??
    payload?.sender?.role ??
    ""
  )
    .toString()
    .toUpperCase();
  const isUser =
    complaintUserId && senderId
      ? complaintUserId === senderId
      : senderType === "USER" || senderType === "CUSTOMER";
  const messageType = (payload?.messageType ?? payload?.type ?? "TEXT").toString().toUpperCase();
  const attachments = new Set<string>();

  if (Array.isArray(payload?.attachments)) {
    payload.attachments.filter(Boolean).forEach((url: string) => attachments.add(url));
  }
  if (Array.isArray(payload?.metadata?.attachments)) {
    payload.metadata.attachments.filter(Boolean).forEach((url: string) => attachments.add(url));
  }
  if (messageType === "IMAGE" && payload?.content) {
    attachments.add(payload.content);
  }

  const textContent =
    messageType === "IMAGE" && attachments.size
      ? "Đã gửi một hình ảnh"
      : payload?.content ?? payload?.message ?? "";

  return {
    id: payload?.id ?? `${senderId ?? "msg"}-${createdAt}`,
    content: textContent,
    sender: isUser ? "user" : "admin",
    createdAt,
    attachments: attachments.size ? Array.from(attachments) : undefined,
  };
};

export function Complaint() {
  const navigate = useNavigate();
  const apiBase =
    import.meta?.env?.VITE_API_BASE_URL;
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const selectedComplaint = useMemo(
    () => complaints.find((item) => item.complaintId === selectedId) ?? null,
    [complaints, selectedId]
  );

  const fetchComplaintList = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!apiBase) {
        toast.error("Chưa cấu hình API");
        setComplaints([]);
        setSelectedId(null);
        setListLoading(false);
        return;
      }

      setListLoading(true);
      try {
        const url = new URL(`${apiBase}/complaint`);
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", DEFAULT_COMPLAINT_PAGE_LIMIT.toString());

        const response = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
          signal: options?.signal,
        });

        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(body?.message || "Không thể tải danh sách khiếu nại");
        }

        const payload = body?.data ?? body;
        const rawList =
          payload?.complaints ?? payload?.items ?? payload?.data ?? payload?.results ?? [];
        const normalized = Array.isArray(rawList)
          ? rawList
              .map(normalizeComplaintSummary)
              .filter((item: ComplaintSummary) => Boolean(item.complaintId))
          : [];

        setComplaints(normalized);
        setSelectedId((prev) => {
          if (prev && normalized.some((item) => item.complaintId === prev)) {
            return prev;
          }
          return normalized[0]?.complaintId ?? null;
        });
      } catch (error) {
        if (options?.signal?.aborted) return;
        console.error("Fetch complaints error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách khiếu nại. Vui lòng thử lại."
        );
        setComplaints([]);
        setSelectedId(null);
      } finally {
        if (!options?.signal?.aborted) {
          setListLoading(false);
        }
      }
    },
    [apiBase]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchComplaintList({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchComplaintList]);

  const handleCreateComplaint = async () => {
    if (!newTitle.trim()) return;
    if (!apiBase) {
      toast.error("Chưa cấu hình API");
      return;
    }
    setCreating(true);

    try {
      const response = await fetch(`${apiBase}/complaint`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message || "Không thể tạo khiếu nại");
      }

      const payload = body?.data ?? body;
      const normalized = normalizeComplaintSummary(payload);
      setComplaints((prev) => {
        const remaining = prev.filter(
          (item) => item.complaintId !== normalized.complaintId
        );
        return [normalized, ...remaining];
      });
      setSelectedId(normalized.complaintId);
      setNewTitle("");
      toast.success("Đã tạo khiếu nại");
    } catch (error) {
      console.error("Create complaint error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tạo khiếu nại. Vui lòng thử lại."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSelectComplaint = (complaintId: string) => {
    setSelectedId(complaintId);
  };

  // Mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {!selectedId ? (
          // List view on mobile
          <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
              <div className="px-4 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="h-10 w-10"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Trung tâm hỗ trợ
                    </h1>
                    <p className="text-sm text-gray-600">
                      Quản lý yêu cầu của bạn
                    </p>
                  </div>
                </div>

                {/* Create New Request */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    Tạo yêu cầu mới
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Nhập vấn đề cần hỗ trợ..."
                      className="flex-1 text-sm h-11 border-gray-300 rounded-lg"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          newTitle.trim()
                        ) {
                          e.preventDefault();
                          handleCreateComplaint();
                        }
                      }}
                    />
                    <Button
                      onClick={handleCreateComplaint}
                      disabled={!newTitle.trim() || creating}
                      size="icon"
                      className="h-11 w-11 flex-shrink-0 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Complaints List */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                Yêu cầu của bạn
              </p>
              <ComplaintList
                complaints={complaints}
                selectedId={selectedId}
                onSelectComplaint={handleSelectComplaint}
                loading={listLoading}
              />
            </div>
          </div>
        ) : (
          // Chat view on mobile
          <div className="flex flex-col h-screen">
            {selectedComplaint && (
              <ComplaintChat
                complaint={selectedComplaint}
                apiBase={apiBase}
                onBack={() => setSelectedId(null)}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-[1400px]">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trung tâm hỗ trợ
          </h1>
          <p className="text-gray-600">
            Quản lý yêu cầu và trò chuyện với đội ngũ hỗ trợ
          </p>
        </div>

        {/* Main Content */}
        <div className="flex gap-6 h-[calc(100vh-220px)]">
          {/* Left Sidebar */}
          <div className="w-[380px] bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
            {/* Create New Request */}
            <div className="px-6 py-5 border-b border-gray-200 flex-shrink-0">
              <p className="text-sm font-medium text-gray-900 mb-3">
                Tạo yêu cầu mới
              </p>
              <div className="flex gap-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập vấn đề cần hỗ trợ..."
                  className="flex-1 text-sm h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && newTitle.trim()) {
                      e.preventDefault();
                      handleCreateComplaint();
                    }
                  }}
                />
                <Button
                  onClick={handleCreateComplaint}
                  disabled={!newTitle.trim() || creating}
                  size="icon"
                  className="h-11 w-11 flex-shrink-0 bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Complaints List */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    Yêu cầu của bạn
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={listLoading}
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                    onClick={() => fetchComplaintList()}
                    title="Làm mới danh sách"
                  >
                    <span className="text-lg">{listLoading ? "⟳" : "↻"}</span>
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
                <ComplaintList
                  complaints={complaints}
                  selectedId={selectedId}
                  onSelectComplaint={handleSelectComplaint}
                  loading={listLoading}
                />
              </div>
            </div>
          </div>

          {/* Right Chat Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {selectedComplaint ? (
              <ComplaintChat complaint={selectedComplaint} apiBase={apiBase} />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 via-white to-blue-50">
                <div className="text-center px-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Chào mừng đến Trung tâm hỗ trợ
                  </h3>
                  <p className="text-base text-gray-600 mb-1">
                    Chọn một yêu cầu hoặc tạo mới để bắt đầu
                  </p>
                  <p className="text-sm text-gray-500">
                    Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Complaint List Component
function ComplaintList({
  complaints,
  selectedId,
  onSelectComplaint,
  loading,
}: {
  complaints: ComplaintSummary[];
  selectedId: string | null;
  onSelectComplaint: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-2"></div>
          <p className="text-sm text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Chưa có yêu cầu nào
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tạo yêu cầu mới để bắt đầu
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: {
        label: "Đang xử lý",
        className: "bg-blue-100 text-blue-700 border-blue-200",
      },
      RESOLVED: {
        label: "Đã giải quyết",
        className: "bg-green-100 text-green-700 border-green-200",
      },
      CLOSED: {
        label: "Đã đóng",
        className: "bg-gray-100 text-gray-700 border-gray-200",
      },
    };
    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig["OPEN"]
    );
  };

  return (
    <div className="space-y-2">
      {complaints.map((item) => {
        const statusBadge = getStatusBadge(item.status);
        const isSelected = selectedId === item.complaintId;

        return (
          <button
            key={item.complaintId}
            onClick={() => onSelectComplaint(item.complaintId)}
            className={`
              w-full p-4 rounded-xl text-left transition-all duration-200
              ${
                isSelected
                  ? "bg-blue-50 border-2 border-blue-400 shadow-md scale-[1.02]"
                  : "bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }
            `}
          >
            <div className="flex items-center justify-between mb-2.5">
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 font-medium ${statusBadge.className}`}
              >
                {statusBadge.label}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDate(item.createdAt)}
              </span>
            </div>
            <p
              className={`text-sm font-medium line-clamp-2 leading-relaxed ${
                isSelected ? "text-gray-900" : "text-gray-800"
              }`}
            >
              {item.title}
            </p>
            {item.lastMessage && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {item.lastMessage}
              </p>
            )}
            {item.lastMessageAt && (
              <p className="text-[11px] text-gray-400 mt-1">
                {formatDate(item.lastMessageAt)}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Complaint Chat Component
function ComplaintChat({
  complaint,
  apiBase,
  onBack,
}: {
  complaint: ComplaintSummary;
  apiBase?: string;
  onBack?: () => void;
}) {
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    const complaintId = sanitizeId(complaint?.complaintId);
    if (!apiBase || !complaintId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = new URL(`${apiBase}/complaint-message`);
      url.searchParams.set("complaintId", complaintId);
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "50");

      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message || "Không thể tải tin nhắn");
      }

      const payload = body?.data ?? body;
      const rawList =
        payload?.complaintMessages ?? payload?.items ?? payload?.data ?? payload?.results ?? [];
      const normalized = Array.isArray(rawList)
        ? rawList
            .map((item: any) => normalizeComplaintMessage(item, complaint.userId))
            .filter((item): item is ComplaintMessage => Boolean(item?.id))
        : [];
      normalized.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(normalized);
    } catch (error) {
      console.error("Fetch complaint messages error:", error);
      toast.error(
        error instanceof Error ? error.message : "Không thể tải tin nhắn. Vui lòng thử lại."
      );
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, complaint.complaintId, complaint.userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendComplaintMessage = useCallback(
    async (content: string, messageType: "TEXT" | "IMAGE") => {
      const complaintId = sanitizeId(complaint?.complaintId);
      if (!apiBase || !complaintId) {
        throw new Error("Không xác định được khiếu nại");
      }

      const response = await fetch(`${apiBase}/complaint-message`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaintId,
          messageType,
          content,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message || "Không thể gửi tin nhắn");
      }

      const payload = body?.data ?? body;
      const normalized = normalizeComplaintMessage(payload, complaint.userId);
      if (!normalized) {
        throw new Error("Không thể xác định tin nhắn vừa gửi");
      }
      return normalized;
    },
    [apiBase, complaint.complaintId, complaint.userId]
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} không phải là file ảnh`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} quá lớn (tối đa 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...validFiles]);

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviewUrls((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      toast.success(`Đã chọn ${validFiles.length} ảnh`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && selectedImages.length === 0) return;
    if (!apiBase || !complaint?.complaintId) {
      toast.error("Không xác định được khiếu nại");
      return;
    }

    setSending(true);
    try {
      const newMessages: ComplaintMessage[] = [];

      if (text) {
        const message = await sendComplaintMessage(text, "TEXT");
        newMessages.push(message);
      }

      if (selectedImages.length) {
        const uploaded = await uploadLicenseImages(selectedImages);
        for (const url of uploaded) {
          const imageMessage = await sendComplaintMessage(url, "IMAGE");
          newMessages.push(imageMessage);
        }
      }

      if (newMessages.length) {
        setMessages((prev) => {
          const merged = [...prev, ...newMessages];
          merged.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return merged;
        });
      }

      setInput("");
      setSelectedImages([]);
      setImagePreviewUrls([]);
    } catch (error) {
      console.error("Send complaint message error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể gửi tin nhắn. Vui lòng thử lại."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 flex-shrink-0 hover:bg-gray-100 rounded-full"
              onClick={onBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate mb-1.5">
              {complaint.title}
            </h2>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`text-xs font-medium px-2.5 py-0.5 ${
                  complaint.status === "OPEN"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : complaint.status === "RESOLVED"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {complaint.status === "OPEN"
                  ? "Đang xử lý"
                  : complaint.status === "RESOLVED"
                  ? "Đã giải quyết"
                  : "Đã đóng"}
              </Badge>
              <span className="text-sm text-gray-600">
                {formatDate(complaint.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto min-h-0 overscroll-contain"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        }}
      >
        <div className="p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white min-h-full">
          {loading && (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-3"></div>
                <p className="text-sm text-gray-600">Đang tải tin nhắn...</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.sender === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm"
                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {message.content}
                </p>
                <p
                  className={`text-xs mt-2 ${
                    message.sender === "user"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {!loading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-700 mb-1">
                  Chưa có tin nhắn nào
                </p>
                <p className="text-sm text-gray-500">
                  Gửi tin nhắn đầu tiên để bắt đầu trò chuyện
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-6 py-5 border-t border-gray-200 bg-white flex-shrink-0">
        {/* Image Previews */}
        {imagePreviewUrls.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {imagePreviewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-12 flex-shrink-0 hover:bg-gray-100 rounded-xl border border-gray-200"
            title="Đính kèm ảnh"
          >
            <ImagePlus className="h-5 w-5 text-gray-600" />
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn của bạn..."
            rows={1}
            className="min-h-[48px] max-h-[160px] resize-none flex-1 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <Button
            onClick={handleSend}
            disabled={sending || (!input.trim() && selectedImages.length === 0)}
            className="h-12 w-12 flex-shrink-0 bg-blue-600 hover:bg-blue-700 shadow-md rounded-xl disabled:opacity-50"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          Nhấn Enter để gửi, Shift + Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}

// Utility functions
function formatDate(dateStr: string) {
  return formatRelativeTime(dateStr);
}

function formatTime(dateStr: string) {
  const vnDate = convertUTCToVN(dateStr);
  return vnDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}
