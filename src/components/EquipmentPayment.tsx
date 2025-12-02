import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Check, 
  CreditCard, 
  Shield, 
  ArrowLeft, 
  Copy, 
  QrCode,
  Clock,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { connectPaymentSocket } from '../utils/ws-client';
import type { WSClient } from '../utils/ws-client';

interface PaymentDetails {
  id: string;
  rentalId: string;
  amount: number;
  status: string;
  paymentCode: string;
  qrCodeUrl?: string;
  expiresAt?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const sanitizeDescription = (text: string) => {
  return text
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 20);
};

const formatDateOnly = (date?: string) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
}

interface EquipmentPaymentProps {
  user: User | null;
}

export function EquipmentPayment({ user }: EquipmentPaymentProps) {
  const { rentalId } = useParams<{ rentalId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const paymentAccountNumber = import.meta.env.VITE_PAYMENT_ACCOUNT || '0344927528';
  const paymentBankCode = import.meta.env.VITE_PAYMENT_BANK_CODE || 'MB';
  const paymentAccountName = import.meta.env.VITE_PAYMENT_ACCOUNT_NAME || 'HacMieu Journey';

  const rental = location.state?.rental;
  const equipment = location.state?.equipment;
  const rentalDuration = location.state?.rentalDuration;

  const [currentStep, setCurrentStep] = useState(2); // Start at payment step
  const [showQR, setShowQR] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'waiting' | 'confirmed' | 'failed'>('idle');
  const [paymentDeadline, setPaymentDeadline] = useState<number | null>(null);
  const [paymentCountdown, setPaymentCountdown] = useState<string | null>(null);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [wsStatus, setWsStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const wsClientRef = useRef<WSClient | null>(null);

  const steps = [
    { number: 1, title: 'Xác nhận thông tin', icon: Check },
    { number: 2, title: 'Thanh toán', icon: CreditCard },
    { number: 3, title: 'Hoàn tất', icon: Shield }
  ];

  // Countdown timer
  useEffect(() => {
    if (!paymentDeadline) {
      setPaymentCountdown(null);
      setPaymentExpired(false);
      return;
    }
    const updateCountdown = () => {
      const diff = paymentDeadline - Date.now();
      if (diff <= 0) {
        setPaymentCountdown('00:00');
        setPaymentExpired(true);
      } else {
        setPaymentCountdown(formatCountdown(diff));
        setPaymentExpired(false);
      }
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [paymentDeadline]);

  // Load payment details
  const loadPaymentDetails = useCallback(async (rid: string, options?: { silent?: boolean; toastOnError?: boolean }) => {
    if (!rid || !apiBase) return;
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBase}/payment/${rid}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể tải thông tin thanh toán');
      }

      const result = await response.json();
      const payload = result.data || result;

      const normalized: PaymentDetails = {
        id: payload.id,
        rentalId: payload.rentalId || payload.bookingId || rid,
        amount: payload.amount || payload.totalAmount || rental?.remainingAmount || 0,
        status: (payload.status || 'PENDING').toUpperCase(),
        paymentCode: (payload.paymentCode || sanitizeDescription(rid)).toString(),
        qrCodeUrl: payload.qrCodeUrl,
        expiresAt: payload.expiresAt,
      };

      setPaymentDetails(normalized);

      if (normalized.status === 'COMPLETED' || normalized.status === 'SUCCESS' || normalized.status === 'PAID') {
        setPaymentStatus('confirmed');
        setCurrentStep(3);
      } else if (normalized.status === 'PENDING') {
        setPaymentStatus('waiting');
        if (normalized.expiresAt) {
          setPaymentDeadline(new Date(normalized.expiresAt).getTime());
        }
      } else if (normalized.status === 'FAILED' || normalized.status === 'CANCELLED') {
        setPaymentStatus('failed');
      } else {
        // Default to waiting if no status or unknown status
        setPaymentStatus('waiting');
      }

      if (!options?.silent) {
        toast.success('Đã tải thông tin thanh toán');
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin thanh toán';
      if (options?.toastOnError !== false) {
        toast.error(errorMessage);
      }
    } finally {
      setPaymentLoading(false);
    }
  }, [apiBase, rental]);

  // Initialize payment
  useEffect(() => {
    if (!rentalId) {
      toast.error('Không tìm thấy mã đơn thuê');
      navigate('/equipment');
      return;
    }

    if (!rental) {
      toast.error('Không tìm thấy thông tin đơn thuê');
      navigate('/equipment');
      return;
    }

    loadPaymentDetails(rentalId);
  }, [rentalId, rental, navigate, loadPaymentDetails]);

  // WebSocket for payment status
  useEffect(() => {
    if (currentStep !== 2 || !rentalId || !paymentDetails) {
      return;
    }

    setWsStatus('connecting');
    const wsClient = connectPaymentSocket({ debug: false });
    wsClientRef.current = wsClient;

    const handlePaymentUpdate = (payload: any) => {
      const data = payload?.data || payload;
      const eventRentalId = data.rentalId || data.bookingId || data.data?.rentalId || data.data?.bookingId;
      const eventPaymentCode = data.paymentCode || data.data?.paymentCode || data.code || data.data?.code;
      
      // Check if event matches this rental - match by paymentCode OR rentalId
      const matchesRental = Boolean(eventRentalId && eventRentalId === rentalId);
      const matchesPayment = Boolean(eventPaymentCode && paymentDetails && eventPaymentCode === paymentDetails.paymentCode);
      
      // Only require ONE match (not both)
      if (!matchesRental && !matchesPayment) {
        return;
      }

      const statusRaw = (data.status || data.paymentStatus || '').toString().toUpperCase();
      const messageRaw = (data.message || '').toString().toUpperCase();

      // Check if payment is successful - also check message field
      if (
        statusRaw.includes('SUCCESS') || 
        statusRaw.includes('COMPLETED') || 
        statusRaw.includes('CONFIRMED') ||
        messageRaw.includes('THÀNH CÔNG') ||
        messageRaw.includes('RECEIVEDSUCCESSFULLY') ||
        messageRaw.includes('RECEIVED')
      ) {
        setPaymentStatus('confirmed');
        setCurrentStep(3);
        setShowQR(false);
        toast.success('Thanh toán đã được xác nhận!');
      } else if (statusRaw.includes('PENDING')) {
        setPaymentStatus('waiting');
      } else if (statusRaw.includes('FAILED') || statusRaw.includes('CANCELLED')) {
        setPaymentStatus('failed');
        toast.error('Thanh toán thất bại');
      }
    };

    const offPayment = wsClient.on('payment', handlePaymentUpdate);
    const offMessage = wsClient.on('message', handlePaymentUpdate);
    const offPaymentConfirmed = wsClient.on('paymentConfirmed', handlePaymentUpdate);
    
    const offOpen = wsClient.on('open', () => {
      setWsStatus('connected');
    });

    const offClose = wsClient.on('close', () => {
      setWsStatus('idle');
    });

    const offError = wsClient.on('error', () => {
      setWsStatus('idle');
    });

    return () => {
      offPayment();
      offMessage();
      offPaymentConfirmed();
      offOpen();
      offClose();
      offError();
      wsClient.close();
      wsClientRef.current = null;
    };
  }, [currentStep, rentalId, paymentDetails, paymentStatus]);

  // Auto-refresh payment status - DISABLED: Using WebSocket for real-time updates
  // useEffect(() => {
  //   if (currentStep !== 2 || !rentalId || !paymentDetails) return;

  //   const interval = setInterval(() => {
  //     loadPaymentDetails(rentalId, { silent: true });
  //   }, 10000); // Check every 10 seconds

  //   return () => clearInterval(interval);
  // }, [currentStep, rentalId, paymentDetails, loadPaymentDetails]);

  // Handle cancel rental
  const handleCancelRental = async () => {
    if (!rentalId || !cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }

    setCancelLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBase}/rental/cancel/${rentalId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: cancelReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Không thể hủy đơn thuê');
      }

      toast.success('Đã hủy đơn thuê thành công');
      setCancelDialogOpen(false);
      navigate('/equipment');
    } catch (error) {
      console.error('Error cancelling rental:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi hủy đơn');
    } finally {
      setCancelLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép');
  };

  const paymentDescription = paymentDetails?.paymentCode || sanitizeDescription(rentalId || 'EQUIPMENTPAYMENT');
  const paymentAmount = paymentDetails?.amount || rental?.remainingAmount || 0;
  
  // Generate VietQR URL
  const vietQRUrl = `https://img.vietqr.io/image/${paymentBankCode}-${paymentAccountNumber}-compact2.png?amount=${paymentAmount}&addInfo=${encodeURIComponent(paymentDescription)}&accountName=${encodeURIComponent(paymentAccountName)}`;

  if (!rental || !equipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy thông tin đơn thuê</h2>
          <Button onClick={() => navigate('/equipment')}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/equipment')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán đặt thuê thiết bị</h1>
          <p className="text-gray-600 mt-2">{equipment.name}</p>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  <p className="text-sm mt-2 text-center">{step.title}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Payment Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <>
                      {paymentExpired && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-semibold text-red-900">Đã hết thời gian thanh toán</h3>
                              <p className="text-sm text-red-700 mt-1">
                                Vui lòng tạo đơn mới hoặc liên hệ hỗ trợ
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentCountdown && !paymentExpired && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-5 w-5 text-amber-600" />
                              <span className="text-sm font-medium text-amber-900">
                                Thời gian còn lại
                              </span>
                            </div>
                            <span className="text-lg font-bold text-amber-600">
                              {paymentCountdown}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Số tài khoản</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{paymentAccountNumber}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(paymentAccountNumber)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Ngân hàng</span>
                          <span className="font-semibold">{paymentBankCode}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Chủ tài khoản</span>
                          <span className="font-semibold">{paymentAccountName}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Nội dung chuyển khoản</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-blue-600">{paymentDescription}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(paymentDescription)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Số tiền</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-blue-600">
                              {formatCurrency(paymentAmount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(paymentAmount.toString())}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* QR Code - Display directly */}
                      <div className="border rounded-lg p-6 bg-white">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <QrCode className="h-5 w-5" />
                            <span className="font-semibold">Quét mã QR để thanh toán</span>
                          </div>
                          <img
                            src={vietQRUrl}
                            alt="QR Code thanh toán"
                            className="w-64 h-64 border rounded-lg"
                            onError={(e) => {
                              console.error('Failed to load QR code');
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect fill="%23f3f4f6" width="256" height="256"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af"%3EKh%C3%B4ng t%E1%BA%A3i %C4%91%C6%B0%E1%BB%A3c QR%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-900">
                          <p className="font-semibold mb-2">Lưu ý:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Vui lòng chuyển khoản đúng số tiền và nội dung</li>
                            <li>Thanh toán sẽ được xác nhận tự động trong vài phút</li>
                            <li>Không chia sẻ thông tin thanh toán với người khác</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Hủy đơn thuê</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Nếu bạn muốn hủy đơn thuê này, vui lòng nhấn nút bên dưới
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={paymentStatus === 'confirmed'}
                  >
                    Hủy đơn thuê
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Thiết bị</p>
                    <p className="font-semibold">{equipment.name}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Thời gian thuê</p>
                    <p className="font-semibold">
                      {formatDateOnly(rentalDuration?.startDate)} đến {formatDateOnly(rentalDuration?.endDate)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Phí thuê / ngày</p>
                    <p className="font-semibold">{formatCurrency(rental.rentalFee || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tiền cọc</p>
                    <p className="font-semibold">{formatCurrency(rental.deposit || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng tiền</p>
                    <p className="font-semibold">{formatCurrency(rental.totalPrice || 0)}</p>
                  </div>
                  <Separator />
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Cần thanh toán</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(rental.remainingAmount || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Trạng thái thanh toán</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        paymentStatus === 'confirmed'
                          ? 'default'
                          : paymentStatus === 'waiting'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {paymentStatus === 'confirmed'
                        ? 'Đã thanh toán'
                        : paymentStatus === 'waiting'
                        ? 'Đang chờ'
                        : 'Chưa thanh toán'}
                    </Badge>
                    <Badge
                      variant={wsStatus === 'connected' ? 'default' : 'secondary'}
                    >
                      {wsStatus === 'connected' ? 'Đã kết nối' : 'Đang kết nối'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Đặt thuê thành công!</h2>
                <p className="text-gray-600">
                  Đơn thuê của bạn đã được thanh toán và xác nhận
                </p>
                <div className="flex space-x-4 mt-6">
                  <Button onClick={() => navigate('/profile/history')}>
                    Xem lịch sử thuê
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/equipment')}>
                    Tiếp tục thuê
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quét mã QR để thanh toán</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <img
              src={vietQRUrl}
              alt="QR Code thanh toán"
              className="w-64 h-64 border rounded-lg"
              onError={(e) => {
                console.error('Failed to load QR code');
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect fill="%23f3f4f6" width="256" height="256"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af"%3EKh%C3%B4ng t%E1%BA%A3i %C4%91%C6%B0%E1%BB%A3c QR%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="text-center">
              <p className="text-sm text-gray-600">Số tiền</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(paymentAmount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Nội dung</p>
              <p className="font-semibold">{paymentDescription}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đơn thuê</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn hủy đơn thuê này? Hành động này không thể hoàn tác.
            </p>
            <div>
              <label className="text-sm font-medium">Lý do hủy</label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelLoading}
            >
              Đóng
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelRental}
              disabled={cancelLoading || !cancelReason.trim()}
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                'Xác nhận hủy'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
