import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Package,
  Share2,
  Shield,
  Star,
  ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { formatVNDate } from "../utils/timezone";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Equipment {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  pricePerDay: number;
  information?: string[];
  quantity?: number;
  status?: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  categoryName?: string;
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

interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
}

interface EquipmentDetailProps {
  user: User | null;
}

export function EquipmentDetail({ user }: EquipmentDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [rentalDuration, setRentalDuration] = useState<{
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    days: number;
  } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [hasFetchedReviews, setHasFetchedReviews] = useState(false);

  useEffect(() => {
    fetchEquipmentDetail();
    setActiveTab("description");
    setHasFetchedReviews(false);
    setReviews([]);

    // Get rental duration from URL params
    const startDate = searchParams.get("startDate");
    const startTime = searchParams.get("startTime");
    const endDate = searchParams.get("endDate");
    const endTime = searchParams.get("endTime");

    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      setRentalDuration({
        startDate,
        startTime,
        endDate,
        endTime,
        days,
      });
    }
  }, [id, searchParams, apiBaseUrl]);

  const fetchEquipmentDetail = async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    try {
      const url = `${apiBaseUrl}/device/${id}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch device (${response.status})`);
      }

      const payload = await response.json();
      const device = payload?.data ?? payload;

      const normalized: Equipment = {
        id: device.id,
        name: device.name,
        brand: device.categoryName ?? device.brand,
        categoryName: device.categoryName,
        description: device.description,
        pricePerDay: Number(device.price) || 0,
        information: Array.isArray(device.information) ? device.information : [],
        quantity: device.quantity ?? 1,
        status: device.status,
        images: Array.isArray(device.images) ? device.images : [],
        rating: Number(device.averageRating ?? device.rating ?? 0) || 0,
        reviewCount: Array.isArray(device.reviewIds)
          ? device.reviewIds.filter((id: string) => id && id !== "NULL").length
          : device.reviewCount ?? 0,
      };

      setEquipment(normalized);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast.error("Không thể tải thông tin thiết bị");
      navigate("/equipment");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) {
      return;
    }

    setReviewsLoading(true);
    try {
      const url = `${apiBaseUrl}/review/device/${id}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews (${response.status})`);
      }

      const payload: ReviewsResponse = await response.json();

      if (payload.data && Array.isArray(payload.data.reviews)) {
        setReviews(payload.data.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Don't show error toast for reviews, just log it
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reviews" && !hasFetchedReviews) {
      fetchReviews();
      setHasFetchedReviews(true);
    }
  }, [activeTab, hasFetchedReviews, id]);

  const handleApplyDiscount = () => {
    // Mock discount validation
    if (discountCode === "EQUIPMENT10") {
      setAppliedDiscount({
        code: discountCode,
        percentage: 10,
        description: "Giảm 10% cho thiết bị",
      });
      toast.success("Áp dụng mã giảm giá thành công!");
    } else {
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

  const handleBooking = async () => {
    if (!rentalDuration) {
      toast.error("Vui lòng chọn thời gian thuê");
      return;
    }

    if (!equipment?.id) {
      toast.error("Không tìm thấy thông tin thiết bị");
      return;
    }

    setBookingLoading(true);
    try {
      if (!user) {
        toast.error("Vui lòng đăng nhập để đặt thuê");
        return;
      }

      // Get token, may be null if using cookie-based auth
      const token = localStorage.getItem('accessToken');

      // Step 1: Create rental
      const response = await fetch(`${apiBaseUrl}/rental`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          items: [
            {
              targetId: equipment.id,
              isCombo: false,
              quantity: 1,
            },
          ],
          startDate: rentalDuration.startDate,
          endDate: rentalDuration.endDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Không thể tạo đơn thuê');
      }

      const rentalId = result.data?.id;
      if (!rentalId) {
        throw new Error('Không nhận được mã đơn thuê');
      }

      toast.success('Tạo đơn thuê thành công!');
      
      // Step 2: Navigate to payment page with rentalId
      navigate(`/equipment-payment/${rentalId}`, {
        state: {
          rental: result.data,
          equipment: equipment,
          rentalDuration: rentalDuration,
        },
      });
    } catch (error) {
      console.error('Error creating rental:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi đặt thuê');
    } finally {
      setBookingLoading(false);
    }
  };

  const nextImage = () => {
    if (equipment?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % equipment.images!.length);
    }
  };

  const prevImage = () => {
    if (equipment?.images) {
      setCurrentImageIndex(
        (prev) =>
          (prev - 1 + equipment.images!.length) % equipment.images!.length
      );
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
        <Button onClick={() => navigate("/equipment")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const rentalPrice = rentalDuration
    ? equipment.pricePerDay * rentalDuration.days
    : equipment.pricePerDay;

  const discountAmount = appliedDiscount
    ? (rentalPrice * appliedDiscount.percentage) / 100
    : 0;

  const totalAmount = Math.max(0, rentalPrice - discountAmount);

  const displayRating =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        )
      : equipment.rating;

  const displayReviewCount =
    reviews.length > 0 ? reviews.length : equipment.reviewCount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-green-600">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              to="/equipment"
              className="text-gray-600 hover:text-green-600"
            >
              Thiết bị
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{equipment.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
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
                      src={equipment.images?.[currentImageIndex] || ""}
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
                          idx === currentImageIndex
                            ? "border-green-600"
                            : "border-transparent"
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
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="description" className="flex-1">
                      Mô tả
                    </TabsTrigger>
                    <TabsTrigger value="specifications" className="flex-1">
                      Thông số
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex-1">
                      Đánh giá ({reviewsLoading ? "..." : displayReviewCount})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-4">
                    <p className="text-gray-700 leading-relaxed">
                      {equipment.description}
                    </p>
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
                      {reviewsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Đang tải đánh giá...</p>
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className="text-center py-8">
                          <Star className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Chưa có đánh giá nào</p>
                        </div>
                      ) : (
                        reviews.map((review) => (
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
                        ))
                      )}
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
                      <p className="text-sm text-gray-500 uppercase mb-1">
                        {equipment.brand}
                      </p>
                    )}
                    <CardTitle className="text-xl">{equipment.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isFavorite ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </Button>
                </div>

                <div className="flex items-center mt-2">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 font-semibold">
                            {displayRating}
                          </span>
                          <span className="ml-1 text-sm text-gray-500">
                            ({displayReviewCount} đánh giá)
                          </span>
                        </div>
                </div>

                {equipment.quantity && (
                  <Badge className="mt-2 bg-green-100 text-green-700">
                    Còn {equipment.quantity} thiết bị
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Rental Duration Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Thời gian thuê
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Ngày nhận</label>
                      <Input
                        type="date"
                        value={rentalDuration?.startDate || ""}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          const currentEndDate = rentalDuration?.endDate ? new Date(rentalDuration.endDate) : null;
                          
                          // Nếu chưa có endDate hoặc endDate <= startDate mới, tự động set endDate = startDate + 1 ngày
                          let newEndDate: string;
                          if (!currentEndDate || currentEndDate <= selectedDate) {
                            const nextDay = new Date(selectedDate);
                            nextDay.setDate(nextDay.getDate() + 1);
                            newEndDate = nextDay.toISOString().split('T')[0];
                          } else {
                            newEndDate = rentalDuration.endDate;
                          }
                          
                          const days = Math.ceil((new Date(newEndDate).getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
                          
                          setRentalDuration({
                            startDate: e.target.value,
                            startTime: "08:00",
                            endDate: newEndDate,
                            endTime: "18:00",
                            days: Math.max(1, days),
                          });
                        }}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Ngày trả</label>
                      <Input
                        type="date"
                        value={rentalDuration?.endDate || ""}
                        onChange={(e) => {
                          const days = rentalDuration?.startDate
                            ? Math.ceil((new Date(e.target.value).getTime() - new Date(rentalDuration.startDate).getTime()) / (1000 * 60 * 60 * 24))
                            : 1;
                          setRentalDuration({
                            startDate: rentalDuration?.startDate || e.target.value,
                            startTime: "08:00",
                            endDate: e.target.value,
                            endTime: "18:00",
                            days: Math.max(1, days),
                          });
                        }}
                        min={rentalDuration?.startDate || new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>

                  {rentalDuration?.startDate && rentalDuration?.endDate && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-green-900">
                        Tổng thời gian: {(() => {
                          const start = new Date(rentalDuration.startDate);
                          const end = new Date(rentalDuration.endDate);
                          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                          return `${Math.max(1, days)} ngày`;
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giá thuê/ngày:</span>
                    <span className="font-semibold">
                      {equipment.pricePerDay.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {rentalDuration && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          × {rentalDuration.days} ngày:
                        </span>
                        <span className="font-semibold">
                          {rentalPrice.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      {appliedDiscount && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Giảm giá ({appliedDiscount.percentage}%):</span>
                          <span>
                            -{discountAmount.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold">Tổng thanh toán:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {totalAmount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBooking}
                  disabled={!rentalDuration?.startDate || !rentalDuration?.endDate || bookingLoading}
                >
                  {bookingLoading ? 'Đang xử lý...' : 'Đặt thuê ngay'}
                </Button>

                {(!rentalDuration?.startDate || !rentalDuration?.endDate) && (
                  <p className="text-sm text-center text-amber-600">
                    Vui lòng chọn thời gian thuê
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
                      <p className="text-blue-700">
                        Thiết bị được kiểm tra kỹ lưỡng trước khi giao. Bảo hành
                        trong thời gian thuê.
                      </p>
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
              src={equipment.images?.[currentImageIndex] || ""}
              alt={equipment.name}
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
