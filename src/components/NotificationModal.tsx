import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { CheckCheck, Clock, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { connectNotificationSocket } from '../utils/ws-client';

interface Notification {
  id: string; 
  title: string;
  content?: string;
  message?: string; 
  time?: string; 
  read: boolean;
  type: string;
  createdAt: string; 
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationChange?: () => void;
}

export function NotificationModal({ isOpen, onClose, onNotificationChange }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Reset page when modal opens
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setSelectedNotification(null);
      setDetailLoadingId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/notification/list?page=${page}&limit=${limit}`,
          {
            credentials: 'include',
          }
        );

        if (response.ok) {
          const responseData = await response.json();
          const notifications = responseData.data?.notifications || responseData.notifications || [];
          // Log each notification
          setNotifications(notifications);
          setHasMore(notifications && notifications.length === limit);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
        toast.error('Lỗi khi tải thông báo');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, navigate, page, limit]);

  // Live updates via WebSocket
  useEffect(() => {
    if (!isOpen) return;
    const ws = connectNotificationSocket();
    const off = ws.on('newNotification', (payload) => {
      if (!payload) return;
      setNotifications((prev) => [payload, ...prev]);
    });
    const offAny = ws.on('message', (data) => {
      if (data?.type === 'newNotification' && data?.data) {
        setNotifications((prev) => [data.data, ...prev]);
      }
    });
    return () => { off(); offAny(); ws.close(); };
  }, [isOpen]);


  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    if (unreadIds.length === 0) return;

    setMarkingAllAsRead(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/notification`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationIds: unreadIds
          }),
        }
      );

      if (response.ok) {
        // Update local state if API call successful
        setNotifications(notifications.map(notification => ({
          ...notification,
          read: true
        })));
        toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
        onNotificationChange?.();
        if (selectedNotification) {
          setSelectedNotification({ ...selectedNotification, read: true });
        }
      } else {
        toast.error('Không thể cập nhật trạng thái thông báo');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông báo:', error);
      toast.error('Lỗi khi cập nhật thông báo');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const deleteNotification = async (id: string) => {
    // // Confirm before deleting
    // if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
    //   return;
    // }

    setDeletingNotification(id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/notification/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Remove from local state if API call successful
        setNotifications(notifications.filter(notification => notification.id !== id));
        toast.success('Đã xóa thông báo');
        onNotificationChange?.();
        if (selectedNotification?.id === id) {
          setSelectedNotification(null);
        }
      } else {
        toast.error('Không thể xóa thông báo');
      }
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
      toast.error('Lỗi khi xóa thông báo');
    } finally {
      setDeletingNotification(null);
    }
  };

  const viewNotificationDetail = async (id: string) => {
    if (selectedNotification?.id === id && !detailLoadingId) {
      setSelectedNotification(null);
      return;
    }

    setDetailLoadingId(id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/notification/${id}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        toast.error('Không thể tải chi tiết thông báo');
        return;
      }

      const result = await response.json();
      const detail = result?.data ?? result;
      let normalized: Notification = {
        id: detail.id,
        title: detail.title,
        content: detail.content ?? detail.message,
        read: detail.read,
        type: detail.type,
        createdAt: detail.createdAt,
      };

      setSelectedNotification(normalized);

      if (!detail.read) {
        try {
          const markResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/notification`,
            {
              method: 'PUT',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                notificationIds: [id],
              }),
            }
          );

          if (markResponse.ok) {
            normalized = { ...normalized, read: true };
            setSelectedNotification(normalized);
            setNotifications((prev) =>
              prev.map((notification) =>
                notification.id === id ? { ...notification, read: true } : notification,
              ),
            );
            onNotificationChange?.();
          }
        } catch (error) {
          console.error('Lỗi khi cập nhật trạng thái thông báo:', error);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết thông báo:', error);
      toast.error('Có lỗi khi tải chi tiết thông báo');
    } finally {
      setDetailLoadingId(null);
    }
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
        return 'bg-yellow-50 border-yellow-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Hôm nay';
      } else if (diffDays === 1) {
        return 'Hôm qua';
      } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
      } else {
        return date.toLocaleDateString('vi-VN');
      }
    } catch {
      return 'Không xác định';
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
              disabled={unreadCount === 0 || markingAllAsRead}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              {markingAllAsRead ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-1" />
              )}
              {markingAllAsRead ? 'Đang cập nhật...' : 'Đánh dấu tất cả'}
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
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => viewNotificationDetail(notification.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        viewNotificationDetail(notification.id);
                      }
                    }}
                    className={`relative p-4 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-100' 
                        : `${getNotificationColor(notification.type)} shadow-sm`
                    } ${selectedNotification?.id === notification.id ? 'ring-2 ring-blue-200' : ''}`}
                  >
                    {/* Debug info for each notification */}
                    {import.meta.env.DEV && (
                      <div className="absolute top-1 left-1 text-xs bg-red-500 text-white px-1 rounded">
                        {index + 1}
                      </div>
                    )}
                    
                    {!notification.read && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.type}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            disabled={deletingNotification === notification.id}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 ml-2 flex-shrink-0"
                            title="Xóa thông báo"
                          >
                            {deletingNotification === notification.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        
                        <p className={`text-xs mb-2 leading-relaxed ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                          {notification.title }
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(notification.createdAt)}
                          </div>
                          {notification.read ? (
                            <span className="text-green-600 font-medium">Đã đọc</span>
                          ) : (
                            <span className="text-blue-600 font-medium">Chưa đọc</span>
                          )}
                        </div>
                    </div>
                  </div>
                  
                  {selectedNotification?.id === notification.id && (
                    <div className="mt-3 rounded-lg border border-dashed border-blue-100 bg-white/80 p-3">
                      {detailLoadingId === notification.id ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tải chi tiết...
                        </div>
                      ) : (
                        <>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {selectedNotification.title}
                          </h3>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {selectedNotification.content || 'Không có nội dung chi tiết.'}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
        </div>
      </ScrollArea>

        <div className="p-6 pt-4 border-t bg-gray-50">
          {/* Pagination Controls */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1 || loading}
              className="flex items-center space-x-1"
            >
              <span>← Trang trước</span>
            </Button>
            
            <span className="text-sm text-gray-600">
              Trang {page}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => prev + 1)}
              disabled={!hasMore || loading}
              className="flex items-center space-x-1"
            >
              <span>Trang sau →</span>
            </Button>
          </div>
          
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
