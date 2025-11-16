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

interface ComplaintSummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface ComplaintMessage {
  id: string;
  content: string;
  sender: "user" | "admin";
  createdAt: string;
  attachments?: string[];
}

export function Complaint() {
  const navigate = useNavigate();
  const apiBase =
    import.meta?.env?.VITE_API_BASE_URL || "http://localhost:3000/api";
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
    () => complaints.find((item) => item.id === selectedId) ?? null,
    [complaints, selectedId]
  );

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = useCallback(async () => {
    setListLoading(true);
    // Mock data - không gọi API
    await new Promise((resolve) => setTimeout(resolve, 500)); // Giả lập loading

    const mockComplaints: ComplaintSummary[] = [
      {
        id: "complaint-1",
        title: "Cần hỗ trợ về việc thuê xe Honda SH 150i",
        status: "OPEN",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "complaint-2",
        title: "Xe Yamaha Exciter bị hỏng giữa đường",
        status: "RESOLVED",
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: "complaint-3",
        title: "Hỏi về chính sách hoàn tiền đặt cọc",
        status: "OPEN",
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      },
      {
        id: "complaint-4",
        title: "Muốn đổi xe từ Wave Alpha sang Winner X",
        status: "CLOSED",
        createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
      },
      {
        id: "complaint-5",
        title: "Không nhận được xác nhận đơn hàng #789",
        status: "OPEN",
        createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
      },
      {
        id: "complaint-6",
        title: "Xe Vision bị thủng lốp, cần hỗ trợ khẩn cấp",
        status: "RESOLVED",
        createdAt: new Date(Date.now() - 3600000 * 144).toISOString(),
      },
      {
        id: "complaint-7",
        title: "Hỏi về combo thuê xe + khách sạn tại Đà Nẵng",
        status: "OPEN",
        createdAt: new Date(Date.now() - 3600000 * 168).toISOString(),
      },
      {
        id: "complaint-8",
        title: "Cần thay đổi thời gian nhận xe",
        status: "RESOLVED",
        createdAt: new Date(Date.now() - 3600000 * 192).toISOString(),
      },
      {
        id: "complaint-9",
        title: "Thanh toán bị lỗi, tiền đã trừ nhưng chưa có xe",
        status: "OPEN",
        createdAt: new Date(Date.now() - 3600000 * 216).toISOString(),
      },
      {
        id: "complaint-10",
        title: "Xe PCX 160 đã thuê không giống hình ảnh",
        status: "CLOSED",
        createdAt: new Date(Date.now() - 3600000 * 240).toISOString(),
      },
      {
        id: "complaint-11",
        title: "Muốn gia hạn thêm 3 ngày thuê xe",
        status: "RESOLVED",
        createdAt: new Date(Date.now() - 3600000 * 264).toISOString(),
      },
      {
        id: "complaint-12",
        title: "Hỏi về bảo hiểm khi thuê xe dài hạn",
        status: "OPEN",
        createdAt: new Date(Date.now() - 3600000 * 288).toISOString(),
      },
    ];

    setComplaints(mockComplaints);
    setListLoading(false);
  }, []);

  const handleCreateComplaint = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);

    // Mock create - không gọi API
    await new Promise((resolve) => setTimeout(resolve, 300)); // Giả lập loading

    const newComplaint: ComplaintSummary = {
      id: `complaint-${Date.now()}`,
      title: newTitle.trim(),
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };

    setComplaints((prev) => [newComplaint, ...prev]);
    setSelectedId(newComplaint.id);
    setNewTitle("");
    toast.success("Đã tạo khiếu nại");
    setCreating(false);
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
                    onClick={fetchComplaints}
                    disabled={listLoading}
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
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
        const isSelected = selectedId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectComplaint(item.id)}
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

  useEffect(() => {
    fetchMessages();
  }, [complaint.id]);

  const fetchMessages = async () => {
    setLoading(true);
    // Mock data
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockMessages: ComplaintMessage[] = [
      {
        id: "msg-1",
        content: "Xin chào! Tôi cần hỗ trợ về việc thuê xe máy.",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "msg-2",
        content:
          "Chào bạn! Cảm ơn bạn đã liên hệ. Đội ngũ hỗ trợ của chúng tôi sẽ giúp bạn ngay. Bạn gặp vấn đề gì với việc thuê xe?",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 23.5).toISOString(),
      },
    ];

    setMessages(mockMessages);
    setLoading(false);
  };

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

    const messageText =
      text ||
      (selectedImages.length > 0
        ? `[Đã gửi ${selectedImages.length} ảnh]`
        : "");

    setInput("");
    setSending(true);

    const newMessage: ComplaintMessage = {
      id: `msg-${Date.now()}`,
      content: messageText,
      sender: "user",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);

    setSelectedImages([]);
    setImagePreviewUrls([]);

    setTimeout(() => {
      const adminReply: ComplaintMessage = {
        id: `msg-${Date.now()}-admin`,
        content:
          "Cảm ơn bạn đã liên hệ! Chúng tôi đã nhận được tin nhắn và sẽ phản hồi trong thời gian sớm nhất. 🙏",
        sender: "admin",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, adminReply]);
    }, 1500);

    setSending(false);
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
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
