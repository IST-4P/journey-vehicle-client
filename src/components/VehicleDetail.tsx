import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MapPin, Users, Fuel, Star, Heart, Share2,
  Check, X, ChevronLeft, ChevronRight, ZoomIn
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface Discount {
  code: string;
  discount: number;
  description: string;
}

interface VehicleFeature {
  feature: {
    name: string;
    description: string;
    icon: string;
  };
}

interface Vehicle {
  id: string;
  type: string;
  name: string;
  brandId: string;
  modelId: string;
  seats: number;
  fuelType: string;
  transmission: string;
  pricePerHour: number;
  pricePerDay: number;
  location: string;
  city: string;
  ward: string;
  latitude: number;
  longitude: number;
  description: string;
  terms: string[];
  status: string;
  totalTrips: number;
  averageRating: number;
  images: string[];
  vehicleFeatures: VehicleFeature[];
  createdAt: string;
  updatedAt: string;
}

export function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [rentalDuration, setRentalDuration] = useState<{
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    hours: number;
  } | null>(null);

  const availableDiscounts = [
    { code: 'NEWUSER', discount: 15, description: 'Giảm 15% cho khách hàng mới' },
    { code: 'WEEKEND20', discount: 20, description: 'Giảm 20% cho thuê cuối tuần' },
    { code: 'MONTHLY10', discount: 10, description: 'Giảm 10% cho thuê từ 7 ngày' }
  ];

  useEffect(() => {
    const fetchVehicleDetailCallback = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/vehicle/${id}`,
          {
            credentials: 'include'
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Parse response data properly
          setVehicle(data.data || data.vehicle || data);
        } else {
          toast.error('Không tìm thấy thông tin xe');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        toast.error('Lỗi khi tải thông tin xe');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetailCallback();
    
    // Get rental duration from URL params
    const startDate = searchParams.get('startDate');
    const startTime = searchParams.get('startTime');
    const endDate = searchParams.get('endDate');
    const endTime = searchParams.get('endTime');
    
    if (startDate && startTime && endDate && endTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (endDateTime > startDateTime) {
        const diffInMs = endDateTime.getTime() - startDateTime.getTime();
        const hours = Math.ceil(diffInMs / (1000 * 60 * 60));
        
        setRentalDuration({
          startDate,
          startTime,
          endDate,
          endTime,
          hours: Math.max(hours, 1)
        });
      }
    }
  }, [id, searchParams, navigate]);

  // Auto-slide effect for images
  useEffect(() => {
    if (!vehicle || vehicle.images.length <= 1 || isImageHovered) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
    }, 3000); // Auto-slide every 3 seconds

    return () => clearInterval(interval);
  }, [vehicle, isImageHovered]);

  // Keyboard navigation for fullscreen modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!showImageModal || !vehicle) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
          break;
        case 'Escape':
          e.preventDefault();
          setShowImageModal(false);
          break;
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyPress);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal, vehicle]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateTotal = () => {
    if (!vehicle) return 0;
    
    const basePrice = rentalDuration 
      ? vehicle.pricePerHour * rentalDuration.hours 
      : vehicle.pricePerDay;
    const insurancePrice = insurance ? 50000 : 0;
    const vat = (basePrice + insurancePrice) * 0.1;
    const depositAmount = 3000000; // Tiền cọc
    const subtotal = basePrice + insurancePrice + vat + depositAmount;
    const discountAmount = appliedDiscount ? ((basePrice + insurancePrice + vat) * appliedDiscount.discount / 100) : 0;
    
    return subtotal - discountAmount;
  };

  const handleApplyDiscount = (discount: Discount) => {
    setAppliedDiscount(discount);
    setDiscountCode(discount.code);
    setShowDiscountModal(false);
    toast.success(`Đã áp dụng mã giảm giá ${discount.code}`);
  };

  const handleRentNow = () => {
    if (!vehicle) return;
    navigate(`/booking/${vehicle.id}`, {
      state: {
        vehicle,
        insurance,
        discountCode: appliedDiscount?.code,
        totalPrice: calculateTotal(),
        rentalDuration
      }
    });
  };

  const nextImage = () => {
    if (vehicle) {
      setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
    }
  };

  const prevImage = () => {
    if (vehicle) {
      setCurrentImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy xe</h2>
          <p className="text-gray-600 mb-4">Xe bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link to="/cars">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0%); }
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <span>/</span>
        <Link to={vehicle.type === 'CAR' ? '/cars' : '/motorcycles'} className="hover:text-blue-600">
          {vehicle.type === 'CAR' ? 'Thuê ô tô' : 'Thuê xe máy'}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{vehicle.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="mb-8">
            <div 
              className="relative"
              onMouseEnter={() => setIsImageHovered(true)}
              onMouseLeave={() => setIsImageHovered(false)}
            >
              <ImageWithFallback
                src={vehicle.images[currentImageIndex]}
                alt={vehicle.name}
                className="w-full h-96 md:h-[28rem] lg:h-[32rem] object-cover rounded-lg cursor-pointer shadow-lg transition-transform duration-300 hover:scale-[1.02]"
                onClick={() => setShowImageModal(true)}
              />
              
              {vehicle.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <button
                onClick={() => setShowImageModal(true)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
              >
                <ZoomIn className="h-5 w-5" />
              </button>

              {/* Auto-slide progress indicator */}
              {vehicle.images.length > 1 && !isImageHovered && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="w-full bg-black bg-opacity-30 h-1 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                      style={{
                        width: '100%',
                        animation: 'progress 3s linear infinite'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {vehicle.images.length > 1 && (
              <div className="flex space-x-3 mt-4 overflow-x-auto pb-2">
                {vehicle.images.map((image, index) => (
                  <ImageWithFallback
                    key={index}
                    src={image}
                    alt={`${vehicle.name} ${index + 1}`}
                    className={`w-24 h-16 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all duration-200 hover:scale-105 ${
                      index === currentImageIndex 
                        ? 'ring-2 ring-blue-600 ring-offset-2 shadow-md' 
                        : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}

            {/* Image indicator dots */}
            {vehicle.images.length > 1 && (
              <div className="flex justify-center space-x-2 mt-3">
                {vehicle.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex 
                        ? 'bg-blue-600 w-6' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{vehicle.name}</h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-5 w-5 mr-1" />
                  {vehicle.location}
                </div>
                <div className="flex items-center">
                  <div className="flex items-center mr-4">
                    <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{vehicle.averageRating || 0}</span>
                    <span className="text-gray-600 ml-1">({vehicle.totalTrips} chuyến)</span>
                  </div>
                  <Badge variant={vehicle.status === 'AVAILABLE' ? "default" : "secondary"}>
                    {vehicle.status === 'AVAILABLE' ? 'Có sẵn' : vehicle.status === 'RESERVED' ? 'Đã đặt' : 'Không có sẵn'}
                  </Badge>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Vehicle Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span>{vehicle.seats} chỗ ngồi</span>
              </div>
              <div className="flex items-center space-x-2">
                <Fuel className="h-5 w-5 text-gray-400" />
                <span>{vehicle.fuelType === 'GASOLINE' ? 'Xăng' : vehicle.fuelType === 'DIESEL' ? 'Dầu diesel' : vehicle.fuelType}</span>
              </div>
              {vehicle.transmission && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">⚙️</span>
                  <span>{vehicle.transmission === 'AUTOMATIC' ? 'Số tự động' : 'Số sàn'}</span>
                </div>
              )}
            </div>

            <p className="text-gray-600 mb-6">{vehicle.description}</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="amenities">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="amenities">Tiện nghi</TabsTrigger>
              <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
              <TabsTrigger value="policies">Chính sách</TabsTrigger>
              <TabsTrigger value="location">Vị trí</TabsTrigger>
            </TabsList>

            <TabsContent value="amenities" className="mt-6">
              {vehicle.vehicleFeatures && vehicle.vehicleFeatures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicle.vehicleFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900">{feature.feature.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{feature.feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Thông tin tiện nghi sẽ được cập nhật sớm.</p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="flex items-center justify-center mb-4">
                    <Star className="h-12 w-12 text-yellow-400 fill-current" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Đánh giá</h3>
                  <p className="text-gray-600 mb-4">
                    Xe này có {vehicle.averageRating || 0}/5 sao với {vehicle.totalTrips} chuyến đã hoàn thành
                  </p>
                  <p className="text-sm text-gray-500">
                    Đánh giá chi tiết sẽ được hiển thị sau khi có khách hàng thuê xe
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="policies" className="mt-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Chính sách hủy chuyến</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Hủy trước 24 giờ</span>
                        <span className="text-green-600 font-medium">Miễn phí</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Hủy trong vòng 24 giờ</span>
                        <span className="text-yellow-600 font-medium">Phí 50%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Hủy trong vòng 2 giờ</span>
                        <span className="text-red-600 font-medium">Không hoàn tiền</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Điều khoản và quy định</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vehicle.terms && vehicle.terms.length > 0 ? (
                      <div className="space-y-2">
                        {vehicle.terms.map((term, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {term}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>• Phải có giấy phép lái xe hợp lệ</div>
                        <div>• Không sử dụng rượu bia khi lái xe</div>
                        <div>• Trả xe đúng giờ và địa điểm đã thỏa thuận</div>
                        <div>• Chịu trách nhiệm về các vi phạm giao thông</div>
                        <div>• Bồi thường thiệt hại nếu có</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="location" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Địa điểm nhận xe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="bg-green-100 p-2 rounded">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Tôi tự lấy xe</h4>
                          <p className="text-sm text-gray-600">Miễn phí</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 opacity-50">
                        <div className="bg-gray-100 p-2 rounded">
                          <X className="h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-500">Nhận xe tận nơi</h4>
                          <p className="text-sm text-gray-400">Xe không hỗ trợ giao tận nơi</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.9544777043194!2d${vehicle.longitude}!3d${vehicle.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zVW5rbm93bg!5e0!3m2!1svi!2s!4v1629789435123!5m2!1svi!2s`}
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-lg"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Booking Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl">Thông tin thuê xe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                {rentalDuration ? (
                  <>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(vehicle.pricePerHour * rentalDuration.hours)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {rentalDuration.hours} giờ x {formatPrice(vehicle.pricePerHour)}/giờ
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {rentalDuration.startDate} {rentalDuration.startTime} - {rentalDuration.endDate} {rentalDuration.endTime}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(vehicle.pricePerDay)}/ngày
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatPrice(vehicle.pricePerHour)}/giờ
                    </div>
                  </>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>
                    Phí thuê xe 
                    {rentalDuration ? ` (${rentalDuration.hours} giờ)` : ' (1 ngày)'}
                  </span>
                  <span>
                    {formatPrice(rentalDuration 
                      ? vehicle.pricePerHour * rentalDuration.hours 
                      : vehicle.pricePerDay
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance"
                      checked={insurance}
                      onCheckedChange={setInsurance}
                    />
                    <label htmlFor="insurance" className="text-sm">Phí bảo hiểm</label>
                  </div>
                  <span>{formatPrice(insurance ? 50000 : 0)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Thuế VAT (10%)</span>
                  <span>{formatPrice(((rentalDuration 
                    ? vehicle.pricePerHour * rentalDuration.hours 
                    : vehicle.pricePerDay
                  ) + (insurance ? 50000 : 0)) * 0.1)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tiền cọc</span>
                  <span>{formatPrice(3000000)}</span>
                </div>

                <div className="flex justify-between text-yellow-600">
                  <span>Tiền thế chấp</span>
                  <span>{formatPrice(500000)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({appliedDiscount.code})</span>
                    <span>-{appliedDiscount.discount}%</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
              </div>

              {/* Discount Code */}
              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowDiscountModal(true)}
                >
                  {appliedDiscount ? `Mã: ${appliedDiscount.code}` : 'Nhập mã giảm giá'}
                </Button>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleRentNow}
                disabled={vehicle.status !== 'AVAILABLE'}
              >
                {vehicle.status === 'AVAILABLE' ? 'Thuê xe ngay' : vehicle.status === 'RESERVED' ? 'Xe đã được đặt' : 'Xe không có sẵn'}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Xe được vận hành bởi HacMieuJourney
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 z-60 text-white hover:text-gray-300 p-2"
          >
            <X className="h-8 w-8" />
          </button>
          
          {/* Image counter */}
          <div className="absolute top-4 left-4 z-60 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {vehicle.images.length}
          </div>

          {/* Vehicle name */}
          <div className="absolute bottom-4 left-4 z-60 text-white">
            <h3 className="text-xl font-semibold">{vehicle.name}</h3>
            <p className="text-sm text-gray-300">{vehicle.location}</p>
          </div>

          {/* Main image */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <ImageWithFallback
              src={vehicle.images[currentImageIndex]}
              alt={vehicle.name}
              className="max-w-full max-h-full object-contain"
            />
            
            {vehicle.images.length > 1 && (
              <>
                {/* Previous button */}
                <button
                  onClick={prevImage}
                  className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                {/* Next button */}
                <button
                  onClick={nextImage}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {vehicle.images.length > 1 && (
            <div className="absolute bottom-4 right-4 z-60 flex space-x-2 max-w-md overflow-x-auto">
              {vehicle.images.map((image, index) => (
                <ImageWithFallback
                  key={index}
                  src={image}
                  alt={`${vehicle.name} ${index + 1}`}
                  className={`w-16 h-16 object-cover rounded cursor-pointer flex-shrink-0 border-2 transition-all ${
                    index === currentImageIndex 
                      ? 'border-white' 
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}

          {/* Keyboard navigation hint */}
          {vehicle.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-60 text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded-full">
              Sử dụng ←→ để chuyển ảnh
            </div>
          )}
        </div>
      )}

      {/* Discount Modal */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mã giảm giá</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Nhập mã giảm giá"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
              />
              <Button className="w-full mt-2" variant="outline">
                Áp dụng mã
              </Button>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Mã giảm giá có sẵn</h4>
              <div className="space-y-2">
                {availableDiscounts.map((discount) => (
                  <div
                    key={discount.code}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleApplyDiscount(discount)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{discount.code}</div>
                        <div className="text-sm text-gray-600">{discount.description}</div>
                      </div>
                      <Badge variant="secondary">-{discount.discount}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}