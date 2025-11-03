import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, Star, Heart, Share2, Calendar, Clock, Check, 
  ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, Shield
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface Equipment {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  pricePerHour: number;
  information?: string[];
  quantity?: number;
  status?: string;
  images?: string[];
  rating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [rentalDuration, setRentalDuration] = useState<{
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    hours: number;
  } | null>(null);

  const reviews: Review[] = [
    {
      id: '1',
      userName: 'Trần Văn B',
      userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
      rating: 5,
      comment: 'Thiết bị chất lượng tốt, đúng như mô tả!',
      date: '2024-01-15'
    },
    {
      id: '2',
      userName: 'Nguyễn Thị C',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
      rating: 4,
      comment: 'Rất tiện lợi, sẽ thuê lại lần sau',
      date: '2024-01-10'
    }
  ];

  useEffect(() => {
    fetchEquipmentDetail();
    
    // Get rental duration from URL params
    const startDate = searchParams.get('startDate');
    const startTime = searchParams.get('startTime');
    const endDate = searchParams.get('endDate');
    const endTime = searchParams.get('endTime');

    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

      setRentalDuration({
        startDate,
        startTime,
        endDate,
        endTime,
        hours
      });
    }
  }, [id, searchParams]);

  const fetchEquipmentDetail = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockEquipment: Equipment = {
        id: id || '1',
        name: 'Lều cắm trại 4 người',
        brand: 'Coleman',
        description: 'Lều chống nước cao cấp, thiết kế hiện đại và dễ dàng lắp đặt. Phù hợp cho gia đình 4 người trong các chuyến camping, picnic hoặc du lịch.',
        pricePerHour: 20000,
        information: [
          'Kích thước: 2.1m x 2.1m x 1.3m',
          'Trọng lượng: 3.5kg',
          'Chất liệu: Polyester chống nước',
          'Chống nước: 2000mm',
          'Thời gian lắp đặt: 5-10 phút',
          'Bao gồm: Lều, cọc, dây giăng'
        ],
        quantity: 5,
        status: 'available',
        images: [
          'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
          'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800'
        ],
        rating: 4.8,
        reviewCount: 24
      };

      setEquipment(mockEquipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Không thể tải thông tin thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = () => {
    // Mock discount validation
    if (discountCode === 'EQUIPMENT10') {
      setAppliedDiscount({
        code: discountCode,
        percentage: 10,
        description: 'Giảm 10% cho thiết bị'
      });
      toast.success('Áp dụng mã giảm giá thành công!');
    } else {
      toast.error('Mã giảm giá không hợp lệ');
    }
  };

  const handleBooking = () => {
    if (!rentalDuration) {
      toast.error('Vui lòng chọn thời gian thuê');
      return;
    }

    const bookingData = {
      equipmentId: equipment?.id,
      ...rentalDuration,
      discountCode: appliedDiscount?.code
    };

    navigate(`/booking-equipment/${equipment?.id}`, { 
      state: { bookingData, equipment }
    });
  };

  const nextImage = () => {
    if (equipment?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % equipment.images!.length);
    }
  };

  const prevImage = () => {
    if (equipment?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + equipment.images!.length) % equipment.images!.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl mb-2">Không tìm thấy thiết bị</h2>
        <Button onClick={() => navigate('/equipment')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const rentalPrice = rentalDuration 
    ? equipment.pricePerHour * rentalDuration.hours
    : equipment.pricePerHour;

  const discountAmount = appliedDiscount 
    ? (rentalPrice * appliedDiscount.percentage) / 100
    : 0;

  const depositAmount = 1000000; // 1 triệu VNĐ tiền thế chấp
  const advancePayment = 3000000; // 3 triệu VNĐ tiền cọc
  const totalAmount = rentalPrice - discountAmount + depositAmount + advancePayment;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-green-600">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <Link to="/equipment" className="text-gray-600 hover:text-green-600">Thiết bị</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{equipment.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <div className="relative h-96 bg-gray-200 rounded-t-lg overflow-hidden">
                    <ImageWithFallback
                      src={equipment.images?.[currentImageIndex] || ''}
                      alt={equipment.name}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                      onClick={() => setShowImageModal(true)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {equipment.images && equipment.images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {equipment.images && equipment.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {equipment.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                          idx === currentImageIndex ? 'border-green-600' : 'border-transparent'
                        }`}
                      >
                        <ImageWithFallback
                          src={img}
                          alt={`${equipment.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="description">
                  <TabsList className="w-full">
                    <TabsTrigger value="description" className="flex-1">Mô tả</TabsTrigger>
                    <TabsTrigger value="specifications" className="flex-1">Thông số</TabsTrigger>
                    <TabsTrigger value="reviews" className="flex-1">Đánh giá ({reviews.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-4">
                    <p className="text-gray-700 leading-relaxed">{equipment.description}</p>
                  </TabsContent>

                  <TabsContent value="specifications" className="mt-4">
                    <div className="space-y-2">
                      {equipment.information?.map((info, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{info}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-4">
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <img
                              src={review.userAvatar}
                              alt={review.userName}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-semibold">{review.userName}</p>
                              <div className="flex items-center space-x-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 ml-13">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    {equipment.brand && (
                      <p className="text-sm text-gray-500 uppercase mb-1">{equipment.brand}</p>
                    )}
                    <CardTitle className="text-xl">{equipment.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
                
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-semibold">{equipment.rating}</span>
                    <span className="ml-1 text-sm text-gray-500">({equipment.reviewCount} đánh giá)</span>
                  </div>
                </div>

                {equipment.quantity && (
                  <Badge className="mt-2 bg-green-100 text-green-700">
                    Còn {equipment.quantity} thiết bị
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Rental Duration */}
                {rentalDuration && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-green-700" />
                      <span className="text-sm font-semibold text-green-900">Thời gian thuê</span>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>Từ: {new Date(`${rentalDuration.startDate}T${rentalDuration.startTime}`).toLocaleString('vi-VN')}</p>
                      <p>Đến: {new Date(`${rentalDuration.endDate}T${rentalDuration.endTime}`).toLocaleString('vi-VN')}</p>
                      <p className="font-semibold pt-2 border-t border-green-200">
                        Tổng thời gian: {rentalDuration.hours} giờ
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giá thuê/giờ:</span>
                    <span className="font-semibold">{equipment.pricePerHour.toLocaleString('vi-VN')}đ</span>
                  </div>

                  {rentalDuration && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">× {rentalDuration.hours} giờ:</span>
                        <span className="font-semibold">{rentalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tiền cọc (riêng):</span>
                        <span className="font-semibold text-orange-600">{advancePayment.toLocaleString('vi-VN')}đ</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tiền thế chấp (hoàn trả):</span>
                        <span className="font-semibold text-blue-600">{depositAmount.toLocaleString('vi-VN')}đ</span>
                      </div>

                      {appliedDiscount && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Giảm giá ({appliedDiscount.percentage}%):</span>
                          <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold">Tổng thanh toán:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {totalAmount.toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                      <p className="text-xs text-gray-500">
                        * Tiền thế chấp sẽ được hoàn trả sau khi trả thiết bị
                      </p>
                    </>
                  )}
                </div>

                {/* Discount Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mã giảm giá</label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Nhập mã giảm giá"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      disabled={!!appliedDiscount}
                    />
                    <Button
                      onClick={handleApplyDiscount}
                      disabled={!discountCode || !!appliedDiscount}
                      variant="outline"
                    >
                      Áp dụng
                    </Button>
                  </div>
                  {appliedDiscount && (
                    <p className="text-sm text-green-600">✓ {appliedDiscount.description}</p>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleBooking}
                  disabled={!rentalDuration}
                >
                  Đặt thuê ngay
                </Button>

                {!rentalDuration && (
                  <p className="text-sm text-center text-amber-600">
                    Vui lòng chọn thời gian thuê từ trang danh sách
                  </p>
                )}

                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Chia sẻ
                  </Button>
                </div>

                {/* Insurance Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Chính sách bảo vệ</p>
                      <p className="text-blue-700">Thiết bị được kiểm tra kỹ lưỡng trước khi giao. Bảo hành trong thời gian thuê.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{equipment.name}</DialogTitle>
            <DialogDescription>Xem ảnh phóng to</DialogDescription>
          </DialogHeader>
          <div className="relative h-[600px]">
            <ImageWithFallback
              src={equipment.images?.[currentImageIndex] || ''}
              alt={equipment.name}
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
