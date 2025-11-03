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
  pricePerHour: number;
  description?: string;
  images?: string[];
  devices: Array<{ name: string; quantity: number; description?: string }>;
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

export function ComboDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [combo, setCombo] = useState<Combo | null>(null);
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
    hours: number;
  } | null>(null);

  const reviews: Review[] = [
    {
      id: "1",
      userName: "Phạm Minh D",
      userAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face",
      rating: 5,
      comment: "Combo rất đầy đủ, tiết kiệm chi phí hơn thuê lẻ!",
      date: "2024-01-20",
    },
    {
      id: "2",
      userName: "Lê Thị E",
      userAvatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face",
      rating: 5,
      comment: "Chất lượng thiết bị tốt, đóng gói cẩn thận",
      date: "2024-01-18",
    },
  ];

  useEffect(() => {
    fetchComboDetail();

    const startDate = searchParams.get("startDate");
    const startTime = searchParams.get("startTime");
    const endDate = searchParams.get("endDate");
    const endTime = searchParams.get("endTime");

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
        hours,
      });
    }
  }, [id, searchParams]);

  const fetchComboDetail = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockCombo: Combo = {
        id: id || "1",
        name: "Combo Camping Gia Đình",
        description:
          "Bộ thiết bị đầy đủ cho chuyến camping gia đình 4 người. Combo này bao gồm tất cả những gì bạn cần cho một chuyến cắm trại hoàn hảo, từ lều, túi ngủ đến dụng cụ nấu ăn và chiếu sáng.",
        pricePerHour: 80000,
        images: [
          "https://images.unsplash.com/photo-1739257599500-85ff0ff1b359?w=800",
          "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800",
          "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
        ],
        devices: [
          {
            name: "Lều cắm trại 4 người",
            quantity: 1,
            description: "Lều chống nước Coleman, kích thước 2.1m x 2.1m",
          },
          {
            name: "Túi ngủ",
            quantity: 4,
            description: "Túi ngủ giữ ấm, phù hợp nhiệt độ 5-25°C",
          },
          {
            name: "Bếp gas mini",
            quantity: 1,
            description: "Bếp gas Kovea công suất 2800W",
          },
          {
            name: "Bộ nồi niêu",
            quantity: 1,
            description: "Bộ 5 món chất liệu nhôm anodized",
          },
          {
            name: "Đèn pin LED",
            quantity: 2,
            description: "Đèn pin siêu sáng 300 lumen, pin sạc",
          },
          {
            name: "Bình nước giữ nhiệt",
            quantity: 2,
            description: "Bình Thermos 1L giữ nhiệt 24h",
          },
          {
            name: "Bạt trải sàn",
            quantity: 1,
            description: "Bạt chống thấm kích thước 2.5m x 2.5m",
          },
        ],
        rating: 4.9,
        reviewCount: 45,
      };

      setCombo(mockCombo);
    } catch (error) {
      console.error("Error fetching combo:", error);
      toast.error("Không thể tải thông tin combo");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = () => {
    if (discountCode === "COMBO20") {
      setAppliedDiscount({
        code: discountCode,
        percentage: 20,
        description: "Giảm 20% cho combo",
      });
      toast.success("Áp dụng mã giảm giá thành công!");
    } else {
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

  const handleBooking = () => {
    if (!rentalDuration) {
      toast.error("Vui lòng chọn thời gian thuê");
      return;
    }

    const bookingData = {
      comboId: combo?.id,
      ...rentalDuration,
      discountCode: appliedDiscount?.code,
    };

    navigate(`/booking-combo/${combo?.id}`, {
      state: { bookingData, combo },
    });
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
    ? combo.pricePerHour * rentalDuration.hours
    : combo.pricePerHour;

  const discountAmount = appliedDiscount
    ? (rentalPrice * appliedDiscount.percentage) / 100
    : 0;

  const depositAmount = 2000000; // 2 triệu VNĐ tiền thế chấp cho combo
  const advancePayment = 3000000; // 3 triệu VNĐ tiền cọc
  const totalAmount =
    rentalPrice - discountAmount + depositAmount + advancePayment;

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
                <Tabs defaultValue="description">
                  <TabsList className="w-full">
                    <TabsTrigger value="description" className="flex-1">
                      Mô tả
                    </TabsTrigger>
                    <TabsTrigger value="devices" className="flex-1">
                      Thiết bị ({combo.devices.length})
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex-1">
                      Đánh giá ({reviews.length})
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
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border-b pb-4 last:border-0"
                        >
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
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {review.date}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 ml-13">
                            {review.comment}
                          </p>
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
                    <span className="ml-1 font-semibold">{combo.rating}</span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({combo.reviewCount} đánh giá)
                    </span>
                  </div>
                </div>

                <Badge className="mt-2 bg-purple-100 text-purple-700">
                  Bao gồm {combo.devices.length} thiết bị
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {rentalDuration && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-purple-700" />
                      <span className="text-sm font-semibold text-purple-900">
                        Thời gian thuê
                      </span>
                    </div>
                    <div className="text-sm text-purple-700 space-y-1">
                      <p>
                        Từ:{" "}
                        {new Date(
                          `${rentalDuration.startDate}T${rentalDuration.startTime}`
                        ).toLocaleString("vi-VN")}
                      </p>
                      <p>
                        Đến:{" "}
                        {new Date(
                          `${rentalDuration.endDate}T${rentalDuration.endTime}`
                        ).toLocaleString("vi-VN")}
                      </p>
                      <p className="font-semibold pt-2 border-t border-purple-200">
                        Tổng thời gian: {rentalDuration.hours} giờ
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giá thuê/giờ:</span>
                    <span className="font-semibold">
                      {combo.pricePerHour.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {rentalDuration && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          × {rentalDuration.hours} giờ:
                        </span>
                        <span className="font-semibold">
                          {rentalPrice.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tiền cọc (riêng):</span>
                        <span className="font-semibold text-orange-600">
                          {advancePayment.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Tiền thế chấp (hoàn trả):
                        </span>
                        <span className="font-semibold text-blue-600">
                          {depositAmount.toLocaleString("vi-VN")}đ
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
                        <span className="text-2xl font-bold text-purple-600">
                          {totalAmount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      <p className="text-xs text-gray-500">
                        * Tiền thế chấp sẽ được hoàn trả sau khi trả thiết bị
                      </p>
                    </>
                  )}
                </div>

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
                    <p className="text-sm text-green-600">
                      ✓ {appliedDiscount.description}
                    </p>
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
