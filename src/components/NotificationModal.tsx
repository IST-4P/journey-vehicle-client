import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { CheckCheck, Clock, X } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'booking' | 'payment' | 'promotion' | 'system';
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: 1, 
      title: 'Đặt xe thành công', 
      message: 'Bạn đã đặt xe Honda City thành công. Vui lòng đến nhận xe đúng giờ.', 
      time: '2 phút trước',
      isRead: false,
      type: 'booking'
    },
    { 
      id: 2, 
      title: 'Thanh toán thành công', 
      message: 'Thanh toán 1.500.000 VNĐ cho Honda City đã được xử lý thành công.', 
      time: '1 giờ trước',
      isRead: false,
      type: 'payment'
    },
    { 
      id: 3, 
      title: 'Khuyến mãi mới', 
      message: 'Giảm giá 20% cho tất cả các chuyến đi cuối tuần. Áp dụng mã WEEKEND20.', 
      time: '3 giờ trước',
      isRead: true,
      type: 'promotion'
    },
    { 
      id: 4, 
      title: 'Nhắc nhở trả xe', 
      message: 'Bạn có 1 xe cần trả vào ngày mai lúc 15:00. Vui lòng chuẩn bị sẵn sàng.', 
      time: '5 giờ trước',
      isRead: false,
      type: 'booking'
    },
    { 
      id: 5, 
      title: 'Cập nhật hệ thống', 
      message: 'Hệ thống sẽ bảo trì vào 2:00 - 4:00 sáng ngày mai. Vui lòng hoàn tất giao dịch trước thời gian này.', 
      time: '1 ngày trước',
      isRead: true,
      type: 'system'
    },
    { 
      id: 6, 
      title: 'Đánh giá chuyến đi', 
      message: 'Hãy đánh giá chuyến đi với xe Toyota Vios của bạn để giúp chúng tôi cải thiện dịch vụ.', 
      time: '2 ngày trước',
      isRead: true,
      type: 'booking'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      isRead: true
    })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '🚗';
      case 'payment':
        return '💳';
      case 'promotion':
        return '🎉';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-50 border-blue-200';
      case 'payment':
        return 'bg-green-50 border-green-200';
      case 'promotion':
        return 'bg-purple-50 border-purple-200';
      case 'system':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DialogTitle className="text-lg">Thông báo</DialogTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Đánh dấu tất cả
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="p-6 pt-0">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-gray-500 text-sm">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative p-4 rounded-lg border transition-all hover:shadow-sm ${
                      notification.isRead 
                        ? 'bg-gray-50 border-gray-100' 
                        : `${getNotificationColor(notification.type)} shadow-sm`
                    }`}
                  >
                    {!notification.isRead && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 ml-2 flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <p className={`text-xs mb-2 leading-relaxed ${notification.isRead ? 'text-gray-500' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {notification.time}
                          </div>
                          
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                            >
                              Đánh dấu đã đọc
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t bg-gray-50">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}