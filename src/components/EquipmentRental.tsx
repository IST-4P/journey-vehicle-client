import { Package, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
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
  categoryName?: string;
}

const ITEMS_PER_PAGE = 10;
const NO_OPTION_PLACEHOLDER = "__no-option__";
const ALL_OPTION_VALUE = "__all__";
type SortOption = "price-asc" | "price-desc" | "quantity-asc" | "quantity-desc";

const inferBrandFromName = (name?: string) => {
  if (!name) return undefined;
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const firstWord = trimmed.split(" ")[0];
  return firstWord || undefined;
};

const formatStatusLabel = (status?: string) => {
  const normalized = status?.toUpperCase();
  if (normalized === "AVAILABLE") return "Còn hàng";
  if (normalized === "UNAVAILABLE") return "Hết hàng";
  return status || "";
};

export function EquipmentRental() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortOption, setSortOption] = useState<SortOption>("price-asc");

  const [filters, setFilters] = useState({
    priceRange: "",
    category: "",
    status: "",
    brand: "",
  });

  const itemsPerPage = ITEMS_PER_PAGE;

  useEffect(() => {
    fetchEquipment();
  }, [currentPage]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        page: currentPage.toString(),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/device?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch devices (${response.status})`);
      }

      const payload = await response.json();
      const devices = payload?.data?.devices ?? [];

      const normalized: Equipment[] = devices.map((device: any) => ({
        id: device.id,
        name: device.name,
        brand: device.categoryName ?? device.brand ?? inferBrandFromName(device.name),
        categoryName: device.categoryName,
        description: device.description,
        pricePerHour: Number(device.price) || 0,
        information: Array.isArray(device.information) ? device.information : [],
        quantity: device.quantity ?? 0,
        status: device.status,
        images: Array.isArray(device.images) ? device.images : [],
        rating: Number(device.averageRating ?? device.rating ?? 0) || 0,
        reviewCount: Array.isArray(device.reviewIds)
          ? device.reviewIds.filter((id: string) => id && id !== "NULL").length
          : device.reviewCount ?? 0,
      }));

      setEquipment(normalized);
      setTotalPages(Number(payload?.data?.totalPages) || 1);
      setTotalItems(Number(payload?.data?.totalItems) || normalized.length);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      setEquipment([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [equipment, filters, sortOption]);

  const applyFilters = () => {
    let filtered = [...equipment];

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

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(
        (eq) =>
          (eq.categoryName ?? "")
            .toLowerCase()
            .trim() === filters.category.toLowerCase().trim()
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(
        (eq) =>
          (eq.status ?? "")
            .toLowerCase()
            .trim() === filters.status.toLowerCase().trim()
      );
    }

    // Brand filter
    if (filters.brand) {
      filtered = filtered.filter(
        (eq) =>
          (eq.brand ?? "")
            .toLowerCase()
            .trim() === filters.brand.toLowerCase().trim()
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const qtyA = a.quantity ?? 0;
      const qtyB = b.quantity ?? 0;
      switch (sortOption) {
        case "price-desc":
          return (b.pricePerHour || 0) - (a.pricePerHour || 0);
        case "quantity-asc":
          return qtyA - qtyB;
        case "quantity-desc":
          return qtyB - qtyA;
        case "price-asc":
        default:
          return (a.pricePerHour || 0) - (b.pricePerHour || 0);
      }
    });

    setFilteredEquipment(sorted);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      priceRange: "",
      category: "",
      status: "",
      brand: "",
    });
    setSortOption("price-asc");
    setCurrentPage(1);
  };

  const uniqueCategories = Array.from(
    new Set(equipment.map((eq) => eq.categoryName).filter(Boolean))
  ) as string[];

  const uniqueStatuses = Array.from(
    new Set(equipment.map((eq) => eq.status).filter(Boolean))
  ) as string[];

  const uniqueBrands = Array.from(
    new Set(equipment.map((eq) => eq.brand).filter(Boolean))
  ) as string[];

  const paginatedEquipment = filteredEquipment.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasActiveFilters = Boolean(
    filters.priceRange || filters.category || filters.status || filters.brand
  );
  const visibleCount = hasActiveFilters
    ? filteredEquipment.length
    : totalItems || filteredEquipment.length;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

          {/* Filters */}
          <div className="text-sm text-gray-600">
            Tìm thấy{" "}
            <span className="font-semibold">{visibleCount}</span>{" "}
            thiết bị
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm mb-1">Giá thuê/giờ</label>
                  <Select
                    value={filters.priceRange || ALL_OPTION_VALUE}
                    onValueChange={(value: any) =>
                      handleFilterChange(
                        "priceRange",
                        value === ALL_OPTION_VALUE ? "" : value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn mức giá" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_OPTION_VALUE}>Tất cả</SelectItem>
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
                  <label className="block text-sm mb-1">Danh mục</label>
                  <Select
                    value={filters.category || ALL_OPTION_VALUE}
                    onValueChange={(value: any) =>
                      handleFilterChange(
                        "category",
                        value === ALL_OPTION_VALUE ? "" : value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueCategories.length === 0 ? (
                        <SelectItem value={NO_OPTION_PLACEHOLDER} disabled>
                          Không có danh mục
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value={ALL_OPTION_VALUE}>Tất cả</SelectItem>
                          {uniqueCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Trạng thái</label>
                  <Select
                    value={filters.status || ALL_OPTION_VALUE}
                    onValueChange={(value: any) =>
                      handleFilterChange(
                        "status",
                        value === ALL_OPTION_VALUE ? "" : value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueStatuses.length === 0 ? (
                        <SelectItem value={NO_OPTION_PLACEHOLDER} disabled>
                          Không có trạng thái
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value={ALL_OPTION_VALUE}>Tất cả</SelectItem>
                          {uniqueStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {formatStatusLabel(status)}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Thương hiệu</label>
                  <Select
                    value={filters.brand || ALL_OPTION_VALUE}
                    onValueChange={(value: any) =>
                      handleFilterChange(
                        "brand",
                        value === ALL_OPTION_VALUE ? "" : value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thương hiệu" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueBrands.length === 0 ? (
                        <SelectItem value={NO_OPTION_PLACEHOLDER} disabled>
                          Không có thương hiệu
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value={ALL_OPTION_VALUE}>Tất cả</SelectItem>
                          {uniqueBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <div className="min-w-[200px]">
              <label className="sr-only">Sắp xếp</label>
              <Select
                value={sortOption}
                onValueChange={(value: SortOption) => {
                  setSortOption(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                  <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                  <SelectItem value="quantity-desc">Số lượng nhiều nhất</SelectItem>
                  <SelectItem value="quantity-asc">Số lượng ít nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
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
                return (
                  <Link
                    key={item.id}
                    to={`/equipment/${item.id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 overflow-hidden">
                        {item.images?.[0] ? (
                          <ImageWithFallback
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                            Chưa có ảnh
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2 bg-white text-green-700">
                          {item.quantity ? `SL: ${item.quantity}` : "Có sẵn"}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {(item.categoryName || item.brand) && (
                              <p className="text-xs text-gray-500 uppercase">
                                {item.categoryName || item.brand}
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
                              Giá:
                            </span>
                            <span className="font-semibold text-green-600">
                              {item.pricePerHour.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline text-sm text-gray-600">
                            <span>Số lượng:</span>
                            <span className="font-semibold text-gray-900">
                              {item.quantity ?? 0}
                            </span>
                          </div>
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
