import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, CreditCard, Shield, Calendar, MapPin, Users, Fuel } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface PriceBreakdown {
  rentalFee: number;
  insuranceFee: number;
  vat: number;
  deposit: number;
  totalAmount: number;
}

export function BookingProcess() {
  const { vehicleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    vehicle: location.state?.vehicle || null,
    rentalDuration: location.state?.rentalDuration || null,
    startDate: '',
    endDate: '',
    pickupLocation: 'self',
    agreementAccepted: false,
    paymentMethod: 'qr'
  });
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(location.state?.priceBreakdown || null);
  const [priceLoading, setPriceLoading] = useState(false);

  const steps = [
    { number: 1, title: 'Xác nhận thông tin', icon: Check },
    { number: 2, title: 'Thanh toán', icon: CreditCard },
    { number: 3, title: 'Hoàn tất', icon: Shield }
  ];

  useEffect(() => {
    if (!bookingData.vehicle) {
      navigate('/');
      return;
    }

    // Set default dates from rental duration or use tomorrow
    if (bookingData.rentalDuration) {
      setBookingData(prev => ({
        ...prev,
        startDate: bookingData.rentalDuration.startDate,
        endDate: bookingData.rentalDuration.endDate
      }));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      setBookingData(prev => ({
        ...prev,
        startDate: tomorrow.toISOString().split('T')[0],
        endDate: dayAfter.toISOString().split('T')[0]
      }));
    }
  }, []);

  const vehicleId = bookingData.vehicle?.id;
  const rentalHours = Math.max(bookingData.rentalDuration?.hours || 24, 1);

  useEffect(() => {
    if (!vehicleId) return;
    const controller = new AbortController();

    const fetchPrice = async () => {
      try {
        setPriceLoading(true);
        const params = new URLSearchParams({
          vehicleId,
          hours: rentalHours.toString()
        });
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/vehicle-price?${params.toString()}`,
          {
            credentials: 'include',
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const payload = json.data || json;
        setPriceBreakdown({
          rentalFee: payload.rentalFee ?? 0,
          insuranceFee: payload.insuranceFee ?? 0,
          vat: payload.vat ?? 0,
          deposit: payload.deposit ?? 0,
          totalAmount: payload.totalAmount ?? 0
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error fetching booking price:', error);
        toast.error('Không thể tính giá thuê, vui lòng thử lại.');
        setPriceBreakdown(null);
      } finally {
        if (!controller.signal.aborted) {
          setPriceLoading(false);
        }
      }
    };

    fetchPrice();
    return () => controller.abort();
  }, [vehicleId, rentalHours]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const updateRentalDuration = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end > start) {
        const diffInMs = end.getTime() - start.getTime();
        const hours = Math.ceil(diffInMs / (1000 * 60 * 60));
        const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        
        setBookingData(prev => ({
          ...prev,
          rentalDuration: {
            startDate,
            startTime: '08:00',
            endDate,
            endTime: '08:00',
            hours: Math.max(hours, 1),
            days: Math.max(days, 1)
          }
        }));
      }
    }
  };

  const handleStartDateChange = (value: string) => {
    setBookingData(prev => ({ ...prev, startDate: value }));
    updateRentalDuration(value, bookingData.endDate);
  };

  const handleEndDateChange = (value: string) => {
    setBookingData(prev => ({ ...prev, endDate: value }));
    updateRentalDuration(bookingData.startDate, value);
  };

  const calculatePricing = () => {
    if (!priceBreakdown) return null;
    const rentalDays = bookingData.rentalDuration?.days
      ?? Math.max(Math.ceil(rentalHours / 24), 1);

    return {
      basePrice: priceBreakdown.rentalFee,
      insurancePrice: priceBreakdown.insuranceFee,
      vat: priceBreakdown.vat,
      depositAmount: priceBreakdown.deposit,
      total: priceBreakdown.totalAmount - priceBreakdown.deposit,
      totalWithDeposit: priceBreakdown.totalAmount,
      rentalDays
    };
  };

  const createBooking = async () => {
    if (!bookingData.vehicle || !priceBreakdown) {
      throw new Error('Thiếu thông tin xe hoặc giá thuê');
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      throw new Error('Vui lòng chọn ngày thuê xe');
    }

    try {
      // Create ISO datetime strings
      const startDateTime = new Date(`${bookingData.startDate}T${bookingData.rentalDuration?.startTime || '08:00'}:00.000Z`);
      const endDateTime = new Date(`${bookingData.endDate}T${bookingData.rentalDuration?.endTime || '18:00'}:00.000Z`);

      const bookingPayload = {
        vehicleId: bookingData.vehicle.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        pickupAddress: bookingData.vehicle.location,
        pickupLat: bookingData.vehicle.latitude,
        pickupLng: bookingData.vehicle.longitude,
        rentalFee: Math.round(priceBreakdown.rentalFee),
        insuranceFee: Math.round(priceBreakdown.insuranceFee),
        vat: Math.round(priceBreakdown.vat),
        deposit: Math.round(priceBreakdown.deposit),
        totalAmount: Math.round(priceBreakdown.totalAmount),
        notes: `Thuê xe ${bookingData.vehicle.name} - ${bookingData.vehicle.type === 'CAR' ? 'Ô tô' : 'Xe máy'}`
      };

      console.log('Creating booking with payload:', bookingPayload);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/booking`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingPayload)
        }
      );

      if (response.ok) {
        const bookingResult = await response.json();
        console.log('Booking created successfully:', bookingResult);
        return bookingResult;
      } else {
        const errorData = await response.json();
        console.error('Booking API error:', errorData);
        throw new Error(errorData.message || `Không thể tạo booking (${response.status})`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Có lỗi xảy ra khi tạo booking');
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!bookingData.startDate || !bookingData.endDate) {
        toast.error('Vui lòng chọn ngày thuê xe');
        return;
      }
      if (!bookingData.agreementAccepted) {
        toast.error('Vui lòng đồng ý với điều khoản sử dụng');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setLoading(true);
      // Simulate payment processing
      setTimeout(() => {
        setShowQR(true);
        setLoading(false);
      }, 1000);
    }
  };

  const handlePaymentConfirm = async () => {
    setLoading(true);
    
    try {
      // Call API to create booking
      const bookingResult = await createBooking();
      
      // If successful, move to step 3
      setCurrentStep(3);
      setLoading(false);
      setShowQR(false);
      toast.success('Đặt xe thành công! Mã booking: ' + (bookingResult?.data?.id || 'N/A'));
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi đặt xe');
    }
  };

  const pricing = calculatePricing();

  if (!bookingData.vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin xe</h2>
          <p className="text-gray-600 mb-4">Vui lòng quay lại và chọn xe để thuê.</p>
          <Button onClick={() => navigate('/')}>Quay lại trang chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Đặt xe</h1>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between md:justify-start md:space-x-4 overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 ${
                currentStep >= step.number 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-600'
              }`}>
                {currentStep > step.number ? (
                  <Check className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <step.icon className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </div>
              <span className={`ml-1 md:ml-2 text-xs md:text-sm font-medium whitespace-nowrap ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-4 md:w-12 h-0.5 ml-2 md:ml-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Xác nhận thông tin đặt xe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vehicle Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-gray-50 rounded-lg">
                  <ImageWithFallback
                    src={bookingData.vehicle.images[0]}
                    alt={bookingData.vehicle.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{bookingData.vehicle.name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-sm text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="whitespace-nowrap">{bookingData.vehicle.seats} chỗ</span>
                      </div>
                      <div className="flex items-center">
                        <Fuel className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{bookingData.vehicle.consumption}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{bookingData.vehicle.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rental Dates */}
                <div>
                  <h3 className="font-medium mb-3">Thời gian thuê xe</h3>
                  {bookingData.rentalDuration ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Thời gian đã chọn:</span>
                        <span className="text-blue-600 font-medium">
                          {bookingData.rentalDuration.days} ngày
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Bắt đầu: {bookingData.rentalDuration.startDate} {bookingData.rentalDuration.startTime}</div>
                        <div>Kết thúc: {bookingData.rentalDuration.endDate} {bookingData.rentalDuration.endTime}</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setBookingData({...bookingData, rentalDuration: null})}
                      >
                        Thay đổi thời gian
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Ngày bắt đầu</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={bookingData.startDate}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">Ngày kết thúc</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={bookingData.endDate}
                          onChange={(e) => handleEndDateChange(e.target.value)}
                          min={bookingData.startDate}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pickup Location */}
                <div>
                  <h3 className="font-medium mb-3">Địa điểm nhận xe</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tôi tự lấy xe</h4>
                        <p className="text-sm text-gray-600">Miễn phí - {bookingData.vehicle.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 opacity-50">
                      <div className="bg-gray-100 p-2 rounded">
                        <span className="text-gray-400">✕</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-500">Nhận xe tận nơi</h4>
                        <p className="text-sm text-gray-400">Xe không hỗ trợ giao tận nơi</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agreement */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreement"
                    checked={bookingData.agreementAccepted}
                    onCheckedChange={(checked: boolean) => setBookingData({...bookingData, agreementAccepted: checked})}
                  />
                  <label htmlFor="agreement" className="text-sm text-gray-600">
                    Tôi đồng ý với{' '}
                    <a href="#" className="text-blue-600 hover:underline">điều khoản sử dụng</a>{' '}
                    và{' '}
                    <a href="#" className="text-blue-600 hover:underline">chính sách bảo mật</a>{' '}
                    của HacMieu Journey
                  </label>
                </div>

                <Button
                  onClick={handleNextStep}
                  className="w-full"
                  disabled={!bookingData.agreementAccepted}
                >
                  Tiếp tục thanh toán
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!showQR ? (
                  <>
                    <div>
                      <h3 className="font-medium mb-3">Phương thức thanh toán</h3>
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4 border-blue-600 bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                            <div>
                              <h4 className="font-medium">Quét mã QR</h4>
                              <p className="text-sm text-gray-600">Thanh toán qua ví điện tử</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Lưu ý về thanh toán</h4>
                      <p className="text-sm text-yellow-700">
                        • Tiền cọc {pricing ? formatPrice(pricing.depositAmount) : '…'} sẽ được hoàn trả sau khi bạn kết thúc chuyến đi.<br/>
                        • Giá đã bao gồm thuế VAT và các khoản phí liên quan.
                      </p>
                    </div>

                    <Button
                      onClick={handleNextStep}
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Đang xử lý...' : 'Đồng ý và thanh toán'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Quét mã QR để thanh toán</h3>
                      <p className="text-gray-600">Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã</p>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-lg p-8 inline-block">
                      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <div className="text-center">
                          <div className="text-6xl mb-2">📱</div>
                          <p className="text-sm text-gray-600">QR Code</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {pricing ? formatPrice(pricing.totalWithDeposit) : '…'}
                        </div>
                        <p className="text-sm text-gray-600">Số tiền cần thanh toán</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handlePaymentConfirm}
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? 'Đang xác nhận...' : 'Tôi đã thanh toán'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowQR(false)}
                        className="w-full"
                      >
                        Quay lại
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Thanh toán thành công!
                </h2>
                <p className="text-gray-600 mb-6">
                  Đặt xe của bạn đã được xác nhận. Vui lòng đến địa điểm nhận xe đúng giờ.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Mã đặt xe:</span>
                    <span className="font-mono font-medium">BK{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Thời gian thuê:</span>
                    <span>
                      {bookingData.rentalDuration 
                        ? `${bookingData.rentalDuration.startDate} ${bookingData.rentalDuration.startTime} - ${bookingData.rentalDuration.endDate} ${bookingData.rentalDuration.endTime}` 
                        : `${bookingData.startDate} - ${bookingData.endDate}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Địa điểm nhận xe:</span>
                    <span>{bookingData.vehicle.location}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={() => navigate('/profile/history')} className="w-full">
                    Xem lịch sử đặt xe
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                    Về trang chủ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Price Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Chi tiết giá</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>
                    Phí thuê xe
                    {pricing && pricing.rentalDays > 1 ? ` (${pricing.rentalDays} ngày)` : ' (1 ngày)'}
                  </span>
                  <span>{pricing ? formatPrice(pricing.basePrice) : '…'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Phí bảo hiểm</span>
                  <span>{pricing ? formatPrice(pricing.insurancePrice) : '…'}</span>
                </div>

                <div className="flex justify-between">
                  <span>Thuế VAT</span>
                  <span>{pricing ? formatPrice(pricing.vat) : '…'}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tiền cọc</span>
                  <span>{pricing ? formatPrice(pricing.depositAmount) : '…'}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Tổng cộng</span>
                  <span>{pricing ? formatPrice(pricing.total) : '…'}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng thanh toán</span>
                  <span className="text-blue-600">{pricing ? formatPrice(pricing.totalWithDeposit) : '…'}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>* Tiền cọc sẽ được trả lại khi hoàn trả xe</p>
                <p>* Giá đã bao gồm thuế VAT</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
