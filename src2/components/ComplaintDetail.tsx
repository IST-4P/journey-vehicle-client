import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MessageCircle, Send, Paperclip, Image as ImageIcon,
  Clock, CheckCircle, AlertCircle, User, MessageSquare
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface ComplaintMessage {
  id: string;
  content: string;
  sender: 'user' | 'admin';
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  attachments?: string[];
}

interface ComplaintData {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
  updatedAt: string;
  vehicleId?: string;
  vehicleName?: string;
  bookingId?: string;
  messages: ComplaintMessage[];
}

export function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<ComplaintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  // Mock data - trong thực tế sẽ fetch từ API
  useEffect(() => {
    const fetchComplaint = async () => {
      // Simulate API call
      setTimeout(() => {
        const mockComplaint: ComplaintData = {
          id: id || '1',
          title: 'Xe không sạch sẽ như mô tả',
          description: 'Tôi đã thuê chiếc Toyota Camry với kỳ vọng xe sẽ sạch sẽ như hình ảnh trong app, nhưng khi nhận xe thì thấy nội thất còn dơ bẩn, có mùi thuốc lá và một số vết bẩn trên ghế ngồi.',
          status: 'in_progress',
          priority: 'medium',
          category: 'Chất lượng xe',
          createdAt: '2024-01-20T10:30:00Z',
          updatedAt: '2024-01-21T14:20:00Z',
          vehicleId: 'car-001',
          vehicleName: 'Toyota Camry 2023',
          bookingId: 'booking-001',
          messages: [
            {
              id: 'msg-1',
              content: 'Chào bạn! Chúng tôi đã nhận được khiếu nại của bạn về tình trạng xe Toyota Camry. Chúng tôi rất xin lỗi về sự bất tiện này và sẽ xử lý ngay. Bạn có thể gửi thêm hình ảnh để chúng tôi đánh giá được không?',
              sender: 'admin',
              senderName: 'Support Team',
              senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
              timestamp: '2024-01-20T11:00:00Z'
            },
            {
              id: 'msg-2',
              content: 'Tôi đã chụp một số hình ảnh về tình trạng xe. Đặc biệt là ghế lái có nhiều vết bẩn và khu vực tỳ tay cửa cũng không được lau chùi sạch sẽ.',
              sender: 'user',
              senderName: 'Nguyễn Văn A',
              timestamp: '2024-01-20T11:15:00Z',
              attachments: [
                'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
                'https://images.unsplash.com/photo-1544290224-5ac8c8b7da90?w=400'
              ]
            },
            {
              id: 'msg-3',
              content: 'Cảm ơn bạn đã cung cấp hình ảnh. Chúng tôi đã liên hệ với đối tác cung cấp xe và họ sẽ tiến hành vệ sinh lại xe ngay. Bạn có thể đổi sang một chiếc xe khác hoặc chúng tôi sẽ hoàn tiền 20% cho lần thuê này.',
              sender: 'admin',
              senderName: 'Manager Support',
              senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
              timestamp: '2024-01-21T09:30:00Z'
            },
            {
              id: 'msg-4',
              content: 'Tôi chấp nhận việc hoàn tiền 20%. Xin cảm ơn team đã xử lý nhanh chóng!',
              sender: 'user',
              senderName: 'Nguyễn Văn A',
              timestamp: '2024-01-21T14:20:00Z'
            }
          ]
        };
        
        setComplaint(mockComplaint);
        setLoading(false);
      }, 1000);
    };

    fetchComplaint();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Đang mở';
      case 'in_progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      case 'closed': return 'Đã đóng';
      default: return 'Không xác định';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Không xác định';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setSending(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMessage: ComplaintMessage = {
        id: `msg-${Date.now()}`,
        content: replyContent,
        sender: 'user',
        senderName: 'Nguyễn Văn A',
        timestamp: new Date().toISOString()
      };

      if (complaint) {
        setComplaint({
          ...complaint,
          messages: [...complaint.messages, newMessage],
          updatedAt: new Date().toISOString()
        });
      }

      setReplyContent('');
      setAttachments([]);
      toast.success('Phản hồi đã được gửi');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi phản hồi');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/profile/complaints">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách khiếu nại
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread Messages */}
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
              {/* Messages Thread */}
              <ScrollArea className="h-96 p-4">
                <div className="space-y-6">
                  {/* Initial Complaint */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">Bạn</span>
                          <span className="text-sm text-gray-500">
                            {formatTime(complaint.createdAt)}
                          </span>
                        </div>
                        <h4 className="font-medium mb-2">{complaint.title}</h4>
                        <p className="text-gray-700">{complaint.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  {complaint.messages.map((message, index) => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start space-x-3 max-w-4xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="h-8 w-8">
                          {message.senderAvatar ? (
                            <AvatarImage src={message.senderAvatar} />
                          ) : (
                            <AvatarFallback>
                              {message.sender === 'admin' ? 'A' : 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className={`rounded-lg p-4 ${
                          message.sender === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">
                              {message.senderName}
                            </span>
                            <span className={`text-xs ${
                              message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {message.attachments.map((attachment, idx) => (
                                <ImageWithFallback
                                  key={idx}
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
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              {/* Reply Form */}
              {complaint.status !== 'closed' && (
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

                    {/* File Upload */}
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
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Gửi phản hồi
                      </Button>
                    </div>

                    {/* Selected Files */}
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <button
                              onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
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

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Complaint Info */}
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
                <Label className="text-sm font-medium">Độ ưu tiên</Label>
                <p className={`text-sm mt-1 font-medium ${getPriorityColor(complaint.priority)}`}>
                  {getPriorityLabel(complaint.priority)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Danh mục</Label>
                <p className="text-sm text-gray-600 mt-1">{complaint.category}</p>
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

          {/* Related Booking */}
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