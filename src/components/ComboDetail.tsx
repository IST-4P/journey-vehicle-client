import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Package2,
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

interface Combo {
  id: string;
  name: string;
  pricePerDay: number;
  description?: string;
  images?: string[];
  devices: Array<{ name: string; quantity: number; description?: string }>;
  rating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  bookingId?: string;
  vehicleId?: string;
  userId?: string;
  rating: number;
  title?: string;
  type?: number;
  content?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  userName?: string;
  userAvatar?: string;
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

interface ComboDetailProps {
  user: User | null;
}

export function ComboDetail({ user }: ComboDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [combo, setCombo] = useState<Combo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [rentalDuration, setRentalDuration] = useState<{
    startDate: string;
    endDate: string;
    days: number;
  } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [hasFetchedReviews, setHasFetchedReviews] = useState(false);

  useEffect(() => {
    fetchComboDetail();
    setActiveTab("description");
    setHasFetchedReviews(false);
    setReviews([]);

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
        endDate,
        days,
      });
    } else {
      // default prefill today -> tomorrow
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      setRentalDuration({
        startDate: today.toISOString().slice(0, 10),
        endDate: tomorrow.toISOString().slice(0, 10),
        days: 1,
      });
    }
  }, [id, searchParams]);

  const fetchComboDetail = async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    try {
      const url = `${apiBaseUrl}/combo/${id}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch combo (${response.status})`);
      }

      const payload = await response.json();
      const comboData = payload?.data ?? payload;

      const normalized: Combo = {
        id: comboData.id,
        name: comboData.name,
        description: comboData.description,
        pricePerDay: Number(comboData.price) || 0,
        images: Array.isArray(comboData.images) ? comboData.images : [],
        devices: Array.isArray(comboData.devices)
          ? comboData.devices.map((device: any) => ({
              name: device.name || "",
              quantity: device.quantity || 1,
              description: device.description,
            }))
          : [],
        rating: Number(comboData.averageRating ?? comboData.rating ?? 0) || 0,
        reviewCount: Array.isArray(comboData.reviewIds)
          ? comboData.reviewIds.filter((rid: string) => rid && rid !== "NULL").length
          : comboData.reviewCount ?? 0,
      };

      setCombo(normalized);
    } catch (error) {
      console.error("Error fetching combo:", error);
      toast.error("Không thể tải thông tin combo");
      navigate("/combos");
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
      const url = `${apiBaseUrl}/review/combo/${id}`;

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
      console.error("Error fetching combo reviews:", error);
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

  const handleBooking = async () => {
    if (!rentalDuration) return;

    if (!combo?.id) {
      toast.error("Không tìm thấy thông tin combo");
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
              targetId: combo.id,
              isCombo: true,
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
      navigate(`/combo-payment/${rentalId}`, {
        state: {
          rental: result.data,
          combo: combo,
          rentalDuration: rentalDuration,
        },
      });
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Đặt thuê thất bại');
    } finally {
      setBookingLoading(false);
    }
  };

  const nextImage = () => {
    if (combo?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % combo.images!.length);
    }
  };

  const prevImage = () => {
    if (combo?.images) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + combo.images!.length) % combo.images!.length
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Package2 className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl mb-2">Không tìm thấy combo</h2>
        <Button onClick={() => navigate("/combos")}>Quay lại danh sách</Button>
      </div>
    );
  }

  const rentalPrice = rentalDuration
    ? combo.pricePerDay * rentalDuration.days
    : combo.pricePerDay;
  const totalAmount = rentalPrice;
  const displayRating =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        )
      : combo.rating;
  const displayReviewCount =
    reviews.length > 0 ? reviews.length : combo.reviewCount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-purple-600">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/combos" className="text-gray-600 hover:text-purple-600">
              Combo
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{combo.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <div className="relative h-96 bg-gray-200 rounded-t-lg overflow-hidden">
                    <ImageWithFallback
                      src={combo.images?.[currentImageIndex] || ""}
                      alt={combo.name}
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
                    <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
                      Combo {combo.devices.length} thiết bị
                    </Badge>
                  </div>

                  {combo.images && combo.images.length > 1 && (
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

                {combo.images && combo.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {combo.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                          idx === currentImageIndex
                            ? "border-purple-600"
                            : "border-transparent"
                        }`}
                      >
                        <ImageWithFallback
                          src={img}
                          alt={`${combo.name} ${idx + 1}`}
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
                    <TabsTrigger value="devices" className="flex-1">
                      Thiết bị ({combo.devices.length})
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex-1">
                      Đánh giá ({reviewsLoading ? "..." : displayReviewCount})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-4">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {combo.description}
                    </p>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-purple-900 mb-2">
                        Ưu điểm của Combo
                      </h4>
                      <ul className="space-y-2 text-sm text-purple-800">
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Tiết kiệm đến 20% so với thuê lẻ</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Đầy đủ thiết bị cần thiết</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Được đóng gói sẵn, tiện lợi</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Kiểm tra kỹ trước khi giao</span>
                        </li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="devices" className="mt-4">
                    <div className="space-y-4">
                      {combo.devices.map((device, idx) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-4 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {device.name}
                              </h4>
                              {device.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {device.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="ml-2">
                              x{device.quantity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-4">
                    <div className="space-y-4">
                      {reviewsLoading ? (
                        <p className="text-sm text-gray-500">Đang tải đánh giá...</p>
                      ) : reviews.length === 0 ? (
                        <div className="text-center text-gray-500 py-6">
                          <Star className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                          <p>Chưa có đánh giá nào</p>
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div
                            key={review.id}
                            className="border-b pb-4 last:border-0"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={
                                    review.userAvatar ||
                                    "https://ui-avatars.com/api/?name=User"
                                  }
                                  alt={review.userName || "Người dùng"}
                                  className="w-10 h-10 rounded-full"
                                />
                                <div>
                                  <p className="font-semibold">
                                    {review.userName || "Người dùng"}
                                  </p>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
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
                                    {review.createdAt && (
                                      <span>{formatVNDate(review.createdAt)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-3">
                              {review.content || review.title || "Không có nội dung"}
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
                    <CardTitle className="text-xl">{combo.name}</CardTitle>
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
                    <span className="ml-1 font-semibold">{displayRating}</span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({displayReviewCount} đánh giá)
                    </span>
                  </div>
                </div>

                <Badge className="mt-2 bg-purple-100 text-purple-700">
                  Bao gồm {combo.devices.length} thiết bị
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-700" />
                    <span className="text-sm font-semibold text-purple-900">Chọn ngày thuê</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">Ngày bắt đầu</label>
                      <Input
                        type="date"
                        value={rentalDuration?.startDate || ''}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => {
                          const startDate = e.target.value;
                          setRentalDuration((prev) => {
                            if (!prev) return null;
                            const endDate = prev.endDate && prev.endDate < startDate ? startDate : prev.endDate;
                            const days = Math.max(
                              1,
                              Math.ceil(
                                (new Date(endDate || startDate).getTime() - new Date(startDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            );
                            return { ...prev, startDate, endDate: endDate || startDate, days };
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">Ngày kết thúc</label>
                      <Input
                        type="date"
                        value={rentalDuration?.endDate || ''}
                        min={rentalDuration?.startDate || new Date().toISOString().slice(0, 10)}
                        onChange={(e) => {
                          const endDate = e.target.value;
                          setRentalDuration((prev) => {
                            if (!prev) return null;
                            const days = Math.max(
                              1,
                              Math.ceil(
                                (new Date(endDate).getTime() - new Date(prev.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            );
                            return { ...prev, endDate, days };
                          });
                        }}
                      />
                    </div>
                  </div>
                  {rentalDuration && (
                    <p className="text-sm text-purple-800">
                      Tổng thời gian: <span className="font-semibold">{rentalDuration.days} ngày</span>
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giá thuê/ngày:</span>
                    <span className="font-semibold">
                      {combo.pricePerDay.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {rentalDuration && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">× {rentalDuration.days} ngày:</span>
                        <span className="font-semibold">
                          {rentalPrice.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold">Tổng thanh toán:</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {totalAmount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      <p className="text-xs text-gray-500">
                        Tổng thanh toán được tính theo giá thuê/ngày.
                      </p>
                    </>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBooking}
                  disabled={!rentalDuration || bookingLoading}
                >
                  {bookingLoading ? 'Đang xử lý...' : 'Đặt thuê ngay'}
                </Button>

                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Chia sẻ
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Tiết kiệm đến 20%</p>
                      <p className="text-blue-700">
                        Combo giúp bạn tiết kiệm chi phí so với thuê từng thiết
                        bị riêng lẻ.
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
            <DialogTitle>{combo.name}</DialogTitle>
            <DialogDescription>Xem ảnh phóng to</DialogDescription>
          </DialogHeader>
          <div className="relative h-[600px]">
            <ImageWithFallback
              src={combo.images?.[currentImageIndex] || ""}
              alt={combo.name}
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
