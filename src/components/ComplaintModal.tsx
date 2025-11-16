import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, Plus, MessageSquare, Send, ImagePlus, X } from "lucide-react";

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
  const apiBase = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const portalNode = useComplaintModalPortal();

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    setListLoading(true);
    // Mock data - không gọi API
    await new Promise(resolve => setTimeout(resolve, 500)); // Giả lập loading
    
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
    await new Promise(resolve => setTimeout(resolve, 300)); // Giả lập loading
    
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

  if (!portalNode) {
    return null;
  }

  // Mobile view
  if (isMobile) {
    return createPortal(
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
          {!selectedId ? (
            // List view on mobile
            <>
              <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
                <DialogTitle className="text-base">Hỗ trợ</DialogTitle>
                <DialogDescription className="sr-only">
                  Quản lý yêu cầu hỗ trợ và khiếu nại của bạn
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-hidden">
                  <div className="space-y-2 flex-shrink-0">
                    <p className="text-sm text-gray-900">Tạo yêu cầu mới</p>
                    <div className="flex gap-2">
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Mô tả vấn đề của bạn..."
                        className="flex-1 text-sm h-10"
                      />
                      <Button
                        onClick={handleCreateComplaint}
                        disabled={!newTitle.trim() || creating}
                        size="icon"
                        className="h-10 w-10 flex-shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-3 flex-1 flex flex-col min-h-0 overflow-hidden">
                    <p className="text-sm text-gray-900 mb-2 flex-shrink-0">Yêu cầu của bạn</p>
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
              </div>
            </>
          ) : (
            // Chat view on mobile
            <>
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {selectedComplaint && (
                  <ComplaintChat
                    complaint={selectedComplaint}
                    apiBase={apiBase}
                    onBack={() => setSelectedId(null)}
                  />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>,
      portalNode
    );
  }

  // Desktop view
  return createPortal(
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="complaint-modal-fullscreen w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh] flex p-0 gap-0 rounded-lg">
        {/* Left Sidebar - Compact */}
        <div className="w-30 border-r flex flex-col bg-gray-50">
          <div className="p-4 border-b bg-white">
            <DialogTitle>Hỗ trợ</DialogTitle>
            <DialogDescription className="sr-only">
              Quản lý yêu cầu hỗ trợ và khiếu nại của bạn
            </DialogDescription>
          </div>
          
          <div className="p-4 border-b bg-white flex-shrink-0">
            <p className="text-sm text-gray-700 mb-3">Tạo yêu cầu mới</p>
            <div className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Mô tả vấn đề..."
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleCreateComplaint}
                disabled={!newTitle.trim() || creating}
                size="icon"
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-3 border-b bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">Yêu cầu của bạn</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchComplaints}
                  disabled={listLoading}
                  className="h-7 w-7 p-0"
                >
                  {listLoading ? "..." : "↻"}
                </Button>
              </div>
            </div>
            
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

        {/* Right Chat Area - Much Larger */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {selectedComplaint ? (
            <ComplaintChat 
              complaint={selectedComplaint} 
              apiBase={apiBase}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                <p className="text-base">Chọn hoặc tạo yêu cầu để bắt đầu trò chuyện</p>
                <p className="text-sm text-gray-400 mt-2">Đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>,
    portalNode
  );
}

// Complaint List Component - With proper scrolling
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
      <div className="flex items-center justify-center p-8">
        <p className="text-xs text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-xs text-gray-500 text-center">Chưa có yêu cầu nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {complaints.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelectComplaint(item.id)}
          className={`w-full p-3 rounded-lg text-left transition-colors ${
            selectedId === item.id
              ? "bg-blue-100 border border-blue-300"
              : "hover:bg-white border border-transparent"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Badge 
              variant="outline"
              className={`
                text-xs px-2
                ${item.status === 'RESOLVED' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                ${item.status === 'CLOSED' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                ${item.status === 'OPEN' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
              `}
            >
              {item.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-900 line-clamp-2 mb-1">
            {item.title}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(item.createdAt)}
          </p>
        </button>
      ))}
    </div>
  );
}

// Complaint Chat Component
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
    // Mock data - không gọi API
    await new Promise(resolve => setTimeout(resolve, 300)); // Giả lập loading
    
    const mockMessages: ComplaintMessage[] = [
      {
        id: "msg-1",
        content: "Xin chào! Tôi cần hỗ trợ về việc thuê xe máy.",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "msg-2",
        content: "Chào bạn! Cảm ơn bạn đã liên hệ. Đội ngũ hỗ trợ của chúng tôi sẽ giúp bạn ngay. Bạn gặp vấn đề gì với việc thuê xe?",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 23.5).toISOString(),
      },
      {
        id: "msg-3",
        content: "Tôi đã đặt xe Honda SH 150i nhưng chưa nhận được xác nhận đặt xe. Đơn hàng #12345.",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 23).toISOString(),
      },
      {
        id: "msg-4",
        content: "Cảm ơn bạn đã cung cấp thông tin. Để tôi kiểm tra đơn hàng #12345 của bạn. Vui lòng chờ trong giây lát.",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 22.8).toISOString(),
      },
      {
        id: "msg-5",
        content: "Tôi đã kiểm tra hệ thống và thấy rằng đơn hàng của bạn đang được xử lý. Xe Honda SH 150i màu đen sẽ sẵn sàng vào ngày mai lúc 10:00 sáng.",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
      },
      {
        id: "msg-6",
        content: "Vậy tôi có cần mang theo giấy tờ gì không?",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 21.5).toISOString(),
      },
      {
        id: "msg-7",
        content: "Bạn cần mang theo:\n- CMND/CCCD gốc\n- Bằng lái xe A1 hoặc A2\n- Tiền đặt cọc (có thể thanh toán bằng tiền mặt hoặc chuyển khoản)\n- Hợp đồng thuê xe (chúng tôi sẽ cung cấp)",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 21).toISOString(),
      },
      {
        id: "msg-8",
        content: "Được rồi, cảm ơn bạn! Tiền cọc là bao nhiêu vậy?",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 20.5).toISOString(),
      },
      {
        id: "msg-9",
        content: "Tiền cọc cho Honda SH 150i là 3.000.000 VNĐ. Bạn sẽ được hoàn lại đầy đủ khi trả xe trong tình trạng tốt.",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        id: "msg-10",
        content: "Tôi có thể thanh toán trước online được không?",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 19.5).toISOString(),
      },
      {
        id: "msg-11",
        content: "Có chứ! Bạn có thể thanh toán qua:\n- Chuyển khoản ngân hàng\n- Ví điện tử (MoMo, ZaloPay)\n- Thẻ tín dụng/ghi nợ\n\nSau khi thanh toán, vui lòng gửi ảnh chụp biên lai để chúng tôi xác nhận nhé.",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 19).toISOString(),
      },
      {
        id: "msg-12",
        content: "Tuyệt vời! Tôi sẽ chuyển khoản ngay bây giờ.",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 18.5).toISOString(),
      },
      {
        id: "msg-13",
        content: "Rất tốt! Đây là thông tin tài khoản:\n\nNgân hàng: Vietcombank\nSố TK: 0123456789\nChủ TK: CÔNG TY TNHH THUÊ XE ABC\nNội dung: DH12345 + Tên của bạn",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: "msg-14",
        content: "Tôi vừa chuyển khoản xong. [Đã gửi ảnh biên lai]",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 17).toISOString(),
      },
      {
        id: "msg-15",
        content: "Chúng tôi đã nhận được thanh toán của bạn! Đơn hàng #12345 đã được xác nhận hoàn tất. Hẹn gặp bạn vào lúc 10:00 sáng ngày mai tại địa chỉ: 123 Đường Lê Lợi, Quận 1, TP.HCM.\n\nNếu bạn cần thay đổi gì, vui lòng liên hệ với chúng tôi trước 24 giờ.",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 16.5).toISOString(),
      },
      {
        id: "msg-16",
        content: "Cảm ơn bạn rất nhiều! Hẹn gặp lại! 😊",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
      },
      {
        id: "msg-17",
        content: "Cảm ơn bạn! Chúc bạn có một chuyến đi an toàn và vui vẻ! 🏍️",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 15.5).toISOString(),
      },
      {
        id: "msg-18",
        content: "À, tôi có thêm câu hỏi. Nếu xe bị hỏng giữa đường thì có hỗ trợ không?",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
      },
      {
        id: "msg-19",
        content: "Chúng tôi có dịch vụ hỗ trợ 24/7:\n- Cứu hộ miễn phí trong bán kính 50km\n- Thay xe cùng loại nếu không sửa được\n- Hotline: 1900-xxxx (luôn sẵn sàng)\n\nBạn hoàn toàn yên tâm về điều này!",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 14.5).toISOString(),
      },
      {
        id: "msg-20",
        content: "Tuyệt vời! Vậy là mình yên tâm rồi. Một câu hỏi nữa, có giảm giá cho khách thuê dài hạn không?",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
      },
      {
        id: "msg-21",
        content: "Có ạ! Chính sách giảm giá của chúng tôi:\n- Thuê từ 7-14 ngày: giảm 10%\n- Thuê từ 15-30 ngày: giảm 15%\n- Thuê trên 30 ngày: giảm 20%\n\nNgoài ra còn có ưu đãi cho khách quen và giới thiệu bạn bè nữa!",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 13.5).toISOString(),
      },
      {
        id: "msg-22",
        content: "Nghe hay quá! Vậy nếu mình giới thiệu bạn bè thì có ưu đãi gì?",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 13).toISOString(),
      },
      {
        id: "msg-23",
        content: "Chương trình giới thiệu bạn bè:\n- Bạn được giảm 50.000đ cho lần thuê tiếp theo\n- Bạn bè được giảm 50.000đ cho lần thuê đầu tiên\n- Không giới hạn số lượng người giới thiệu\n- Voucher có hiệu lực 6 tháng\n\nCàng giới thiệu nhiều, càng tiết kiệm nhiều!",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 12.5).toISOString(),
      },
      {
        id: "msg-24",
        content: "Quá tốt luôn! Mình sẽ giới thiệu cho nhiều bạn bè đây. Còn một điều nữa, có combo thuê xe + tour du lịch không?",
        sender: "user",
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "msg-25",
        content: "Có nhiều combo hấp dẫn lắm:\n\n🏍️ Combo Đà Nẵng 3N2Đ:\n- Xe SH 150i\n- Khách sạn 3 sao\n- Tour ngắm cảnh\nGiá: 2.500.000đ\n\n🏍️ Combo Phú Quốc 4N3Đ:\n- Xe Vision\n- Resort 4 sao\n- Tour lặn biển\nGiá: 3.800.000đ\n\nBạn quan tâm combo nào?",
        sender: "admin",
        createdAt: new Date(Date.now() - 3600000 * 11.5).toISOString(),
      },
    ];
    
    setMessages(mockMessages);
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      // Chỉ chấp nhận ảnh
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} không phải là file ảnh`);
        return false;
      }
      // Giới hạn kích thước file (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} quá lớn (tối đa 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      
      // Tạo preview URLs
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviewUrls(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
      
      toast.success(`Đã chọn ${validFiles.length} ảnh`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && selectedImages.length === 0) return;
    
    const messageText = text || (selectedImages.length > 0 ? `[Đã gửi ${selectedImages.length} ảnh]` : '');
    
    setInput("");
    setSending(true);
    
    // Mock send - không gọi API hay socket
    const newMessage: ComplaintMessage = {
      id: `msg-${Date.now()}`,
      content: messageText,
      sender: "user",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    
    // Clear images after sending
    setSelectedImages([]);
    setImagePreviewUrls([]);
    
    // Giả lập phản hồi từ admin sau 1-2 giây
    setTimeout(() => {
      const adminReply: ComplaintMessage = {
        id: `msg-${Date.now()}-admin`,
        content: "Cảm ơn bạn đã liên hệ! Chúng tôi đã nhận được tin nhắn và sẽ phản hồi trong thời gian sớm nhất. 🙏",
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
      <div className="p-5 border-b flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={onBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-lg text-gray-900 truncate">
              {complaint.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                variant="outline"
                className="text-xs"
              >
                {complaint.status}
              </Badge>
              <span className="text-sm text-gray-500">
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
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        <div className="p-8 space-y-5 bg-gray-50 min-h-full">
          {loading && (
            <div className="flex justify-center py-12">
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
                className={`max-w-[70%] rounded-2xl px-5 py-3.5 ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-md"
                    : "bg-white text-gray-900 border rounded-bl-md shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {message.content}
                </p>
                <p className={`text-xs mt-2 ${
                  message.sender === "user" ? "text-blue-100" : "text-gray-500"
                }`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {!loading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center min-h-[400px]">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Chưa có tin nhắn nào</p>
                <p className="text-sm text-gray-400 mt-2">Gửi tin nhắn đầu tiên để bắt đầu</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-5 border-t bg-white flex-shrink-0">
        {/* Image Previews */}
        {imagePreviewUrls.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {imagePreviewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="h-20 w-20 object-cover rounded-lg border"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 items-end">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Upload Image Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-[56px] w-[56px] flex-shrink-0 hover:bg-gray-100"
            title="Đính kèm ảnh"
          >
            <ImagePlus className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Text Input */}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            rows={1}
            className="min-h-[56px] max-h-[160px] resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={sending || (!input.trim() && selectedImages.length === 0)}
            className="h-[56px] w-[56px] flex-shrink-0"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function useComplaintModalPortal() {
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const portalId = "complaint-modal-root";
    let element = document.getElementById(portalId);
    let created = false;

    if (!element) {
      element = document.createElement("div");
      element.id = portalId;
      element.classList.add("complaint-modal-root");
      document.body.appendChild(element);
      created = true;
    }

    element.style.position = "relative";
    element.style.zIndex = "9999";
    element.style.isolation = "isolate";

    setNode(element);

    return () => {
      if (created && element?.parentElement) {
        element.parentElement.removeChild(element);
      }
    };
  }, []);

  return node;
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
