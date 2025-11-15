import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { connectComplaintSocket } from "../utils/ws-client";
import { toast } from "sonner";
import { ChevronLeft, Plus, MessageSquare, History, Send } from "lucide-react";

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

interface ComplaintModalProps {
  open: boolean;
  onClose: (value: boolean) => void;
}

export function ComplaintModal({ open, onClose }: ComplaintModalProps) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedComplaint = useMemo(
    () => complaints.find((item) => item.id === selectedId) ?? null,
    [complaints, selectedId]
  );

  useEffect(() => {
    if (open) {
      fetchComplaints();
    } else {
      setSelectedId(null);
      setNewTitle("");
    }
  }, [open]);

  const fetchComplaints = useCallback(async () => {
    if (!apiBase) return;
    setListLoading(true);
    try {
      const response = await fetch(`${apiBase}/complaint?limit=10&page=1`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      const payload = json.data ?? json;
      const list = Array.isArray(payload.complaints)
        ? payload.complaints
        : Array.isArray(payload.items)
        ? payload.items
        : [];
      const mapped: ComplaintSummary[] = list.map((item: any) => ({
        id: item.id,
        title: item.title,
        status: item.status ?? "OPEN",
        createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
        updatedAt: item.updatedAt ?? item.updated_at,
      }));
      setComplaints(mapped);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Không thể tải danh sách khiếu nại");
      setComplaints([]);
    } finally {
      setListLoading(false);
    }
  }, [apiBase]);

  const handleCreateComplaint = async () => {
    if (!apiBase || !newTitle.trim()) return;
    setCreating(true);
    try {
      const response = await fetch(`${apiBase}/complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${response.status}`);
      }
      const json = await response.json();
      const data = json.data ?? json;
      const summary: ComplaintSummary = {
        id: data.id,
        title: data.title,
        status: data.status ?? "OPEN",
        createdAt: data.createdAt ?? data.created_at ?? new Date().toISOString(),
        updatedAt: data.updatedAt ?? data.updated_at,
      };
      setComplaints((prev) => [summary, ...prev]);
      setSelectedId(summary.id);
      setNewTitle("");
      toast.success("Đã tạo khiếu nại");
    } catch (error) {
      console.error("Create complaint error:", error);
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo khiếu nại"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSelectComplaint = (complaintId: string) => {
    setSelectedId(complaintId);
  };

  // Mobile view
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-full max-h-[95vh] flex flex-col p-0 sm:max-w-lg overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                Hỗ trợ
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1 text-sm"
              >
                <History className="h-4 w-4" />
                Danh sách
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {!selectedId ? (
              // Complaint list view
              <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-hidden">
                <div className="space-y-3 flex-shrink-0">
                  <p className="font-medium text-gray-900">Tạo yêu cầu mới</p>
                  <div className="flex gap-2">
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Mô tả vấn đề của bạn..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleCreateComplaint}
                      disabled={!newTitle.trim() || creating}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                  <p className="font-medium text-gray-900 mb-3 flex-shrink-0">Yêu cầu của bạn</p>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <ComplaintList
                      complaints={complaints}
                      selectedId={selectedId}
                      onSelectComplaint={handleSelectComplaint}
                      loading={listLoading}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Chat view
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop view - Adjusted ratios (smaller sidebar, larger chat)
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[2000px] h-[600px] flex p-0">
        {/* Left Sidebar - Smaller */}
        <div className="w-48 border-r flex flex-col">
          <div className="p-4 border-b">
            <DialogTitle className="text-lg font-semibold">Hỗ trợ</DialogTitle>
          </div>
          
          <div className="p-4 border-b">
            <p className="font-medium text-gray-900 mb-2 text-sm">Tạo yêu cầu mới</p>
            <div className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Mô tả vấn đề..."
                className="flex-1 text-sm h-9"
              />
              <Button
                onClick={handleCreateComplaint}
                disabled={!newTitle.trim() || creating}
                size="sm"
                className="h-9 w-9"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900 text-sm">Yêu cầu của bạn</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchComplaints}
                  disabled={listLoading}
                  className="h-6 w-6"
                >
                  {listLoading ? "..." : "↻"}
                </Button>
              </div>
            </div>
            
            <ComplaintList
              complaints={complaints}
              selectedId={selectedId}
              onSelectComplaint={handleSelectComplaint}
              loading={listLoading}
            />
          </div>
        </div>

        {/* Right Chat Area - Larger */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedComplaint ? (
            <ComplaintChat 
              complaint={selectedComplaint} 
              apiBase={apiBase}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm">Chọn hoặc tạo yêu cầu để bắt đầu trò chuyện</p>
                <p className="text-xs text-gray-400 mt-1">Đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Complaint List Component - Compact version
function ComplaintList({ 
  complaints, 
  selectedId, 
  onSelectComplaint, 
  loading 
}: {
  complaints: ComplaintSummary[];
  selectedId: string | null;
  onSelectComplaint: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-gray-500 text-center">Chưa có yêu cầu nào</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 p-2">
      {complaints.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelectComplaint(item.id)}
          className={`w-full p-2 rounded text-left transition-colors ${
            selectedId === item.id
              ? "bg-blue-50 border border-blue-200"
              : "hover:bg-gray-50 border border-transparent"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Badge 
              variant="outline"
              className={`
                text-xs h-5 px-1.5
                ${item.status === 'RESOLVED' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                ${item.status === 'CLOSED' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                ${item.status === 'OPEN' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
              `}
            >
              {item.status}
            </Badge>
            <span className="text-xs text-gray-500">
              {formatTime(item.createdAt)}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 line-clamp-1 leading-tight">
            {item.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(item.createdAt)}
          </p>
        </button>
      ))}
    </div>
  );
}

// Complaint Chat Component - Fixed scroll for mobile
function ComplaintChat({
  complaint,
  apiBase,
  onBack
}: {
  complaint: ComplaintSummary;
  apiBase?: string;
  onBack?: () => void;
}) {
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketClient, setSocketClient] = useState<ReturnType<typeof connectComplaintSocket> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
  }, [complaint.id]);

  useEffect(() => {
    const client = connectComplaintSocket(complaint.id, { debug: true });
    setSocketClient(client);

    const handler = (payload: any) => {
      setMessages((prev) => {
        const mapped = mapComplaintMessage(payload);
        if (prev.some(msg => msg.id === mapped.id)) {
          return prev;
        }
        return [...prev, mapped];
      });
    };

    const offMessage = client.on("message", (data) => {
      if (data?.type === "complaintMessage" || data?.event === "complaintMessage" || data?.type === "newComplaintMessage") {
        handler(data.data ?? data);
      }
    });

    return () => {
      offMessage();
      client.close();
    };
  }, [complaint.id]);

  const fetchMessages = async () => {
    if (!apiBase) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${apiBase}/complaint-message?limit=50&page=1&complaintId=${complaint.id}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const json = await response.json();
      const payload = json.data ?? json;
      const list = Array.isArray(payload.complaintMessages)
        ? payload.complaintMessages
        : Array.isArray(payload.items)
        ? payload.items
        : [];
      const mapped = list.map((item: any) => mapComplaintMessage(item));
      setMessages(mapped);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    
    setInput("");
    setSending(true);
    
    try {
      const optimistic: ComplaintMessage = {
        id: `temp-${Date.now()}`,
        content: text,
        sender: "user",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      
      const payload = {
        complaintId: complaint.id,
        content: text,
        messageType: "TEXT",
      };

      const socket = socketClient?.socket;
      if (socket && 'emit' in socket && typeof socket.emit === 'function') {
        socket.emit("sendComplaintMessage", payload);
      }
    } catch (error) {
      console.error("Send message failed:", error);
      toast.error("Không thể gửi tin nhắn");
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Responsive */}
      <div className="p-3 sm:p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={onBack}
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm sm:text-lg truncate">
              {complaint.title}
            </p>
            <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
              <Badge
                variant="outline"
                className="text-xs"
              >
                {complaint.status}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDate(complaint.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area - Fixed scroll */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gray-50 min-h-full">
          {loading && (
            <div className="flex justify-center py-4">
              <p className="text-sm text-gray-500">Đang tải tin nhắn...</p>
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
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-md"
                    : "bg-white text-gray-900 border rounded-bl-md shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p className={`text-xs mt-1 sm:mt-2 ${
                  message.sender === "user" ? "text-blue-100" : "text-gray-500"
                }`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {!loading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center min-h-[200px]">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Chưa có tin nhắn nào</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Responsive */}
      <div className="p-3 sm:p-4 border-t bg-white flex-shrink-0">
        <div className="flex gap-2 sm:gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            rows={1}
            className="min-h-[50px] sm:min-h-[60px] resize-none flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="h-10 sm:h-12 px-3 sm:px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1 sm:mt-2 text-center">
          Nhấn Enter để gửi, Shift + Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}

function mapComplaintMessage(entry: any): ComplaintMessage {
  const senderRaw = (entry?.senderType ?? entry?.sender ?? "user").toString().toLowerCase();
  const sender: "user" | "admin" = senderRaw.includes("admin") ? "admin" : "user";
  return {
    id: String(entry?.id ?? entry?.messageId ?? entry?.createdAt ?? Math.random()),
    content: entry?.content ?? "",
    sender,
    createdAt: entry?.createdAt ?? entry?.timestamp ?? new Date().toISOString(),
    attachments: entry?.attachments ?? entry?.files ?? [],
  };
}

function formatDate(value?: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatTime(value?: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}