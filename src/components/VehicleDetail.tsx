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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { formatVNDate } from '../utils/timezone';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

const formatDurationLabel = (hours: number) => {
  const safeHours = Math.max(Math.round(hours), 1);
  const days = Math.floor(safeHours / 24);
  const remainingHours = safeHours % 24;
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} ngày`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours} giờ`);
  }
  if (parts.length === 0) {
    return '1 giờ';
  }
  return parts.join(' ');
};

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

interface Review {
  id: string;
  bookingId: string;
  vehicleId: string;
  userId: string;
  rating: number;
  title: string;
  type: number;
  content: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface ReviewsResponse {
  data: {
    reviews: Review[];
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  message: string;
  statusCode: number;
}

export function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');
  const [rentalDuration, setRentalDuration] = useState<{
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    hours: number;
  } | null>(null);
  const [selectedHours, setSelectedHours] = useState(1);
  const [priceBreakdown, setPriceBreakdown] = useState<{
    rentalFee: number;
    insuranceFee: number;
    vat: number;
    deposit: number;
    totalAmount: number;
  } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Helper function to check if vehicle is available
  const isVehicleAvailable = (status: string | undefined) => {
    if (!status) return false;
    return status === 'AVAILABLE' || status === 'available' || status === 'Active' || status === 'ACTIVE';
  };

  // Helper function to get status display text
  const getStatusText = (status: string | undefined) => {
    if (!status) return 'Không xác định';
    if (isVehicleAvailable(status)) {
      return 'Có sẵn';
    }
    if (status === 'RESERVED' || status === 'reserved' || status === 'Reserved') {
      return 'Đã đặt';
    }
    return `Không có sẵn (${status})`;
  };

  // Helper function to get button text
  const getButtonText = (status: string | undefined) => {
    if (!status) return 'Không xác định trạng thái';
    if (isVehicleAvailable(status)) {
      return 'Thuê xe ngay';
    }
    if (status === 'RESERVED' || status === 'reserved' || status === 'Reserved') {
      return 'Xe đã được đặt';
    }
    return `Xe không có sẵn (${status})`;
  };

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
          const vehicleData = data.data || data.vehicle || data;
          setVehicle(vehicleData);
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

    const fetchReviews = async () => {
      if (!id) return;

      setReviewsLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/review/vehicle/${id}`,
          {
            credentials: 'include'
          }
        );

        console.log('[VehicleDetail] Reviews response status:', response.status);

        if (response.ok) {
          const payload: ReviewsResponse = await response.json();
          console.log('[VehicleDetail] Reviews payload:', payload);

          if (payload.data && Array.isArray(payload.data.reviews)) {
            setReviews(payload.data.reviews);
          }
        } else {
          console.error('Failed to fetch reviews:', response.status);
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchVehicleDetailCallback();
    fetchReviews();
    
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
        
        const safeHours = Math.max(hours, 1);
        setRentalDuration({
          startDate,
          startTime,
          endDate,
          endTime,
          hours: safeHours
        });
        setSelectedHours(safeHours);
      }
    }
  }, [id, searchParams, navigate]);

  const rentalHours = rentalDuration?.hours ?? selectedHours;
  const durationLabel = formatDurationLabel(rentalHours);

  // Calculate actual rating from reviews
  const actualRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : vehicle?.averageRating || 0;
  const reviewCount = reviews.length;

  // Fetch price breakdown every time rental duration or manual hours change
  useEffect(() => {
    if (!vehicle?.id) return;
    const controller = new AbortController();
    const fetchPrice = async () => {
      try {
        setPriceLoading(true);
        const params = new URLSearchParams({
          vehicleId: vehicle.id,
          hours: rentalHours.toString(),
        });
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/vehicle-price?${params.toString()}`,
          {
            credentials: 'include',
            signal: controller.signal,
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
          totalAmount: payload.totalAmount ?? 0,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error fetching vehicle price:', error);
        setPriceBreakdown(null);
        toast.error('Không thể tính giá thuê xe, vui lòng thử lại.');
      } finally {
        if (!controller.signal.aborted) {
          setPriceLoading(false);
        }
      }
    };
    fetchPrice();
    return () => controller.abort();
  }, [vehicle?.id, rentalHours]);

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

  const calculateTotal = () => priceBreakdown?.totalAmount || 0;

  const handleDateTimeChange = () => {
    if (tempStartDate && tempStartTime && tempEndDate && tempEndTime) {
      const startDateTime = new Date(`${tempStartDate}T${tempStartTime}`);
      const endDateTime = new Date(`${tempEndDate}T${tempEndTime}`);
      
      if (endDateTime > startDateTime) {
        const diffInMs = endDateTime.getTime() - startDateTime.getTime();
        const hours = Math.ceil(diffInMs / (1000 * 60 * 60));
        
        const safeHours = Math.max(hours, 1);
        setRentalDuration({
          startDate: tempStartDate,
          startTime: tempStartTime,
          endDate: tempEndDate,
          endTime: tempEndTime,
          hours: safeHours
        });
        setSelectedHours(safeHours);
        setShowDateModal(false);
        toast.success('Đã cập nhật thời gian thuê xe');
      } else {
        toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
    } else {
      toast.error('Vui lòng điền đầy đủ thông tin');
    }
  };

  const openDateModal = () => {
    if (rentalDuration) {
      setTempStartDate(rentalDuration.startDate);
      setTempStartTime(rentalDuration.startTime);
      setTempEndDate(rentalDuration.endDate);
      setTempEndTime(rentalDuration.endTime);
    } else {
      const now = new Date();
      const endDate = new Date(now.getTime() + selectedHours * 60 * 60 * 1000);
      setTempStartDate(now.toISOString().split('T')[0]);
      setTempStartTime(now.toTimeString().slice(0, 5));
      setTempEndDate(endDate.toISOString().split('T')[0]);
      setTempEndTime(endDate.toTimeString().slice(0, 5));
    }
    setShowDateModal(true);
  };

  const handleRentNow = () => {
    if (!vehicle || !priceBreakdown) {
      toast.error('Không thể đặt xe khi chưa có thông tin giá.');
      return;
    }
    navigate(`/booking/${vehicle.id}`, {
      state: {
        vehicle,
        totalPrice: calculateTotal(),
        rentalDuration,
        priceBreakdown,
        selectedHours
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
                    <span className="font-medium">{actualRating}</span>
                    <span className="text-gray-600 ml-1">({reviewCount} đánh giá)</span>
                  </div>
                  <Badge variant={isVehicleAvailable(vehicle.status) ? "default" : "secondary"}>
                    {getStatusText(vehicle.status)}
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
              <TabsTrigger value="reviews">
                Đánh giá ({reviewsLoading ? '...' : reviews.length})
              </TabsTrigger>
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
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Đang tải đánh giá...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center mb-4">
                      <Star className="h-12 w-12 text-yellow-400 fill-current" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Đánh giá</h3>
                    <p className="text-gray-600 mb-4">
                      Xe này có {actualRating}/5 sao
                    </p>
                    <p className="text-sm text-gray-500">
                      Chưa có đánh giá chi tiết
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">
                        Đánh giá từ khách hàng ({reviewCount})
                      </h3>
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{actualRating}/5</span>
                      </div>
                    </div>
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b pb-4 last:border-0"
                      >
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{review.title}</h4>
                            <span className="text-sm text-gray-500">
                              {formatVNDate(review.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">
                          {review.content}
                        </p>
                        {review.images && review.images.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {review.images.map((image, idx) => (
                              <ImageWithFallback
                                key={idx}
                                src={image}
                                alt={`Review image ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
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
              <div className="space-y-2">
                <div className="space-y-2">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {priceLoading
                        ? 'Đang tính giá...'
                        : formatPrice(priceBreakdown?.rentalFee ?? 0)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {rentalDuration
                        ? `Thời lượng: ${durationLabel}`
                        : `Giá tạm tính ${durationLabel}`}
                    </div>
                    {rentalDuration ? (
                      <div className="text-xs text-gray-500 mt-1">
                        {rentalDuration.startDate} {rentalDuration.startTime} - {rentalDuration.endDate} {rentalDuration.endTime}
                      </div>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={openDateModal}
                    >
                      {rentalDuration ? 'Chỉnh sửa thời gian' : 'Chọn thời gian thuê'}
                    </Button>
                  </div>

                  {!rentalDuration && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-3 border rounded-lg text-center">
                        <p className="text-gray-600">Giá theo giờ</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {vehicle ? formatPrice(vehicle.pricePerHour) : '…'}/giờ
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg text-center">
                        <p className="text-gray-600">Giá theo ngày</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {vehicle ? formatPrice(vehicle.pricePerDay) : '…'}/ngày
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {!rentalDuration && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Hoặc chọn nhanh số giờ</p>
                    <Select
                      value={selectedHours.toString()}
                      onValueChange={(value) => {
                        const hour = parseInt(value, 10) || 1;
                        setSelectedHours(hour);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn số giờ" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 6, 8, 12, 18, 24, 36, 48, 72].map((option) => (
                          <SelectItem key={option} value={option.toString()}>
                            {option} giờ
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>
                    Phí thuê xe ({durationLabel})
                  </span>
                  <span>
                    {priceLoading ? '…' : formatPrice(priceBreakdown?.rentalFee ?? 0)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Phí bảo hiểm</span>
                  <span>{priceLoading ? '…' : formatPrice(priceBreakdown?.insuranceFee ?? 0)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Thuế VAT</span>
                  <span>{priceLoading ? '…' : formatPrice(priceBreakdown?.vat ?? 0)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tiền cọc</span>
                  <span>{priceLoading ? '…' : formatPrice(priceBreakdown?.deposit ?? 0)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleRentNow}
                disabled={!isVehicleAvailable(vehicle.status) || priceLoading || !priceBreakdown}
              >
                {getButtonText(vehicle.status)}
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

      {/* Date/Time Selection Modal */}
      <Dialog open={showDateModal} onOpenChange={setShowDateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn thời gian thuê xe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Ngày bắt đầu</label>
                <Input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Giờ bắt đầu</label>
                <Input
                  type="time"
                  value={tempStartTime}
                  onChange={(e) => setTempStartTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Ngày kết thúc</label>
                <Input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  min={tempStartDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Giờ kết thúc</label>
                <Input
                  type="time"
                  value={tempEndTime}
                  onChange={(e) => setTempEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDateModal(false)}
              >
                Hủy
              </Button>
              <Button
                className="flex-1"
                onClick={handleDateTimeChange}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </>
  );
}
