import { ChevronDown, Filter, Package, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";

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

export function EquipmentRental() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    priceRange: "",
    brand: "",
    search: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  const itemsPerPage = 12;

  useEffect(() => {
    fetchEquipment();
  }, [currentPage]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockEquipment: Equipment[] = [
        {
          id: "1",
          name: "Lều cắm trại 4 người",
          brand: "Coleman",
          description:
            "Lều chống nước, dễ dàng lắp đặt, phù hợp cho gia đình 4 người",
          pricePerHour: 20000,
          information: [
            "Kích thước: 2.1m x 2.1m",
            "Trọng lượng: 3.5kg",
            "Chống nước",
          ],
          quantity: 5,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=500",
          ],
          rating: 4.8,
          reviewCount: 24,
        },
        {
          id: "2",
          name: "Balo leo núi 50L",
          brand: "The North Face",
          description: "Balo chuyên dụng cho leo núi và trekking",
          pricePerHour: 15000,
          information: ["Dung tích: 50L", "Chống nước", "Nhiều ngăn tiện lợi"],
          quantity: 10,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=500",
          ],
          rating: 4.9,
          reviewCount: 32,
        },
        {
          id: "3",
          name: "Túi ngủ mùa đông",
          brand: "Naturehike",
          description: "Túi ngủ giữ ấm tốt, phù hợp cho camping mùa đông",
          pricePerHour: 12000,
          information: ["Nhiệt độ: -5°C đến 15°C", "Trọng lượng: 1.2kg"],
          quantity: 8,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=500",
          ],
          rating: 4.7,
          reviewCount: 18,
        },
        {
          id: "4",
          name: "Bếp gas mini du lịch",
          brand: "Kovea",
          description: "Bếp gas nhỏ gọn, tiện lợi cho nấu ăn outdoor",
          pricePerHour: 10000,
          information: ["Công suất: 2800W", "Trọng lượng: 85g", "Dễ sử dụng"],
          quantity: 12,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=500",
          ],
          rating: 4.6,
          reviewCount: 28,
        },
        {
          id: "5",
          name: "Đèn pin chiếu sáng LED",
          brand: "Petzl",
          description: "Đèn pin siêu sáng với pin sạc",
          pricePerHour: 8000,
          information: ["Độ sáng: 300 lumen", "Pin sạc", "Chống nước IPX4"],
          quantity: 15,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500",
          ],
          rating: 4.8,
          reviewCount: 45,
        },
        {
          id: "6",
          name: "Ống nhòm chuyên nghiệp",
          brand: "Nikon",
          description: "Ống nhòm cho ngắm cảnh và quan sát thiên nhiên",
          pricePerHour: 25000,
          information: [
            "Độ phóng đại: 10x42",
            "Chống nước",
            "Phủ coating đa lớp",
          ],
          quantity: 6,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1580982172477-09502529c1af?w=500",
          ],
          rating: 4.9,
          reviewCount: 21,
        },
        {
          id: "7",
          name: "Máy ảnh GoPro Hero",
          brand: "GoPro",
          description: "Camera hành trình chống nước, quay 4K",
          pricePerHour: 50000,
          information: ["Quay 4K60fps", "Chống nước 10m", "Stabilization"],
          quantity: 4,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1606318834502-c3127255246c?w=500",
          ],
          rating: 5.0,
          reviewCount: 38,
        },
        {
          id: "8",
          name: "Bộ dụng cụ nấu ăn",
          brand: "MSR",
          description: "Bộ nồi niêu dành cho camping và picnic",
          pricePerHour: 18000,
          information: ["Bộ 5 món", "Chất liệu nhôm anodized", "Gọn nhẹ"],
          quantity: 7,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1585909695284-32d2985ac9c0?w=500",
          ],
          rating: 4.7,
          reviewCount: 16,
        },
        {
          id: "9",
          name: "Võng xếp du lịch",
          brand: "Ticket to the Moon",
          description: "Võng parachute siêu nhẹ, dễ dàng gắn vào cây",
          pricePerHour: 15000,
          information: [
            "Tải trọng: 200kg",
            "Trọng lượng: 500g",
            "Kích thước: 3x2m",
          ],
          quantity: 9,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1603640953238-0e52c21e2f56?w=500",
          ],
          rating: 4.8,
          reviewCount: 27,
        },
        {
          id: "10",
          name: "Bình nước giữ nhiệt",
          brand: "Thermos",
          description: "Bình giữ nhiệt 1L, giữ nóng/lạnh 24h",
          pricePerHour: 5000,
          information: ["Dung tích: 1L", "Giữ nhiệt 24h", "Không chứa BPA"],
          quantity: 20,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500",
          ],
          rating: 4.6,
          reviewCount: 19,
        },
        {
          id: "11",
          name: "Phao bơi cứu sinh",
          brand: "Speedo",
          description: "Phao bơi an toàn cho các hoạt động nước",
          pricePerHour: 8000,
          information: [
            "Kích thước M/L",
            "Chất liệu EVA",
            "Đủ tiêu chuẩn an toàn",
          ],
          quantity: 15,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=500",
          ],
          rating: 4.5,
          reviewCount: 22,
        },
        {
          id: "12",
          name: "Kem chống nắng du lịch",
          brand: "Neutrogena",
          description: "Kem chống nắng SPF 50+ chống nước",
          pricePerHour: 3000,
          information: ["SPF 50+", "Chống nước 80 phút", "Dung tích 88ml"],
          quantity: 25,
          status: "available",
          images: [
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500",
          ],
          rating: 4.7,
          reviewCount: 31,
        },
      ];

      setEquipment(mockEquipment);
      setTotalPages(Math.ceil(mockEquipment.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [equipment, filters]);

  const calculateHours = () => {
    if (
      !filters.startDate ||
      !filters.startTime ||
      !filters.endDate ||
      !filters.endTime
    ) {
      return 0;
    }

    const start = new Date(`${filters.startDate}T${filters.startTime}`);
    const end = new Date(`${filters.endDate}T${filters.endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

    return hours;
  };

  const applyFilters = () => {
    let filtered = [...equipment];

    // Check availability based on time
    if (
      filters.startDate &&
      filters.startTime &&
      filters.endDate &&
      filters.endTime
    ) {
      // In real app, check against bookings from backend
      // For now, we'll show all as available
    }

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      filtered = filtered.filter((eq) => {
        const price = eq.pricePerHour;
        if (max) {
          return price >= min && price <= max;
        }
        return price >= min;
      });
    }

    // Brand filter
    if (filters.brand) {
      filtered = filtered.filter((eq) => eq.brand === filters.brand);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (eq) =>
          eq.name.toLowerCase().includes(searchLower) ||
          eq.brand?.toLowerCase().includes(searchLower) ||
          eq.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEquipment(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      priceRange: "",
      brand: "",
      search: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
    });
    setCurrentPage(1);
  };

  const uniqueBrands = Array.from(
    new Set(equipment.map((eq) => eq.brand).filter(Boolean))
  ) as string[];

  const paginatedEquipment = filteredEquipment.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const rentalHours = calculateHours();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl mb-4">Thuê Thiết Bị Du Lịch</h1>
          <p className="text-xl text-green-100">
            Đầy đủ thiết bị hỗ trợ cho chuyến đi của bạn
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Time and Location Filters - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Ngày bắt đầu</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Giờ bắt đầu</label>
              <Input
                type="time"
                value={filters.startTime}
                onChange={(e) =>
                  handleFilterChange("startTime", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Ngày kết thúc</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                min={
                  filters.startDate || new Date().toISOString().split("T")[0]
                }
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Giờ kết thúc</label>
              <Input
                type="time"
                value={filters.endTime}
                onChange={(e) => handleFilterChange("endTime", e.target.value)}
              />
            </div>
            <div className="flex items-end">
              {rentalHours > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 w-full">
                  <p className="text-sm text-green-700">
                    Thời gian thuê:{" "}
                    <span className="font-semibold">{rentalHours} giờ</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Additional Filters Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Bộ lọc nâng cao</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </Button>

            <div className="text-sm text-gray-600">
              Tìm thấy{" "}
              <span className="font-semibold">{filteredEquipment.length}</span>{" "}
              thiết bị
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm mb-1">Tìm kiếm</label>
                <Input
                  placeholder="Tên thiết bị..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Giá thuê/giờ</label>
                <Select
                  value={filters.priceRange}
                  onValueChange={(value: any) =>
                    handleFilterChange("priceRange", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mức giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-10000">Dưới 10.000đ</SelectItem>
                    <SelectItem value="10000-20000">
                      10.000đ - 20.000đ
                    </SelectItem>
                    <SelectItem value="20000-50000">
                      20.000đ - 50.000đ
                    </SelectItem>
                    <SelectItem value="50000-999999">Trên 50.000đ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-1">Thương hiệu</label>
                <Select
                  value={filters.brand}
                  onValueChange={(value: any) =>
                    handleFilterChange("brand", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thương hiệu" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="bg-gray-300 h-48"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : paginatedEquipment.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Không tìm thấy thiết bị phù hợp</h3>
            <p className="text-gray-600 mb-4">Thử điều chỉnh bộ lọc của bạn</p>
            <Button onClick={clearFilters}>Xóa bộ lọc</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedEquipment.map((item) => {
                const totalPrice =
                  rentalHours > 0
                    ? item.pricePerHour * rentalHours
                    : item.pricePerHour;
                const queryParams = new URLSearchParams();
                if (filters.startDate)
                  queryParams.append("startDate", filters.startDate);
                if (filters.startTime)
                  queryParams.append("startTime", filters.startTime);
                if (filters.endDate)
                  queryParams.append("endDate", filters.endDate);
                if (filters.endTime)
                  queryParams.append("endTime", filters.endTime);

                return (
                  <Link
                    key={item.id}
                    to={`/equipment/${item.id}?${queryParams.toString()}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 overflow-hidden">
                        <ImageWithFallback
                          src={item.images?.[0] || ""}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-2 right-2 bg-white text-green-700">
                          {item.quantity ? `SL: ${item.quantity}` : "Có sẵn"}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {item.brand && (
                              <p className="text-xs text-gray-500 uppercase">
                                {item.brand}
                              </p>
                            )}
                            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                              {item.name}
                            </h3>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center mb-3">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 text-sm">{item.rating}</span>
                            <span className="ml-1 text-sm text-gray-500">
                              ({item.reviewCount})
                            </span>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-600">
                              Giá thuê/giờ:
                            </span>
                            <span className="font-semibold text-green-600">
                              {item.pricePerHour.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                          {rentalHours > 0 && (
                            <>
                              <div className="flex justify-between items-baseline text-sm">
                                <span className="text-gray-600">
                                  × {rentalHours} giờ
                                </span>
                                <span className="text-gray-900"></span>
                              </div>
                              <div className="flex justify-between items-baseline pt-2 border-t">
                                <span className="font-semibold">Tổng:</span>
                                <span className="font-bold text-green-600">
                                  {totalPrice.toLocaleString("vi-VN")}đ
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Trang trước
                </Button>
                <span className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
