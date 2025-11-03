import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Package2, Star, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Combo {
  id: string;
  name: string;
  pricePerHour: number;
  description?: string;
  images?: string[];
  deviceCount: number;
  devices: Array<{ name: string; quantity: number }>;
  rating: number;
  reviewCount: number;
}

export function ComboRental() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    priceRange: '',
    search: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });

  const itemsPerPage = 12;

  useEffect(() => {
    fetchCombos();
  }, [currentPage]);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockCombos: Combo[] = [
        {
          id: '1',
          name: 'Combo Camping Gia Đình',
          description: 'Bộ thiết bị đầy đủ cho chuyến camping gia đình 4 người',
          pricePerHour: 80000,
          images: ['https://images.unsplash.com/photo-1739257599500-85ff0ff1b359?w=500'],
          deviceCount: 7,
          devices: [
            { name: 'Lều cắm trại 4 người', quantity: 1 },
            { name: 'Túi ngủ', quantity: 4 },
            { name: 'Bếp gas mini', quantity: 1 },
            { name: 'Bộ nồi niêu', quantity: 1 },
            { name: 'Đèn pin LED', quantity: 2 },
            { name: 'Bình nước giữ nhiệt', quantity: 2 },
            { name: 'Bạt trải sàn', quantity: 1 }
          ],
          rating: 4.9,
          reviewCount: 45
        },
        {
          id: '2',
          name: 'Combo Leo Núi Solo',
          description: 'Thiết bị cơ bản cho người leo núi 1 mình',
          pricePerHour: 45000,
          images: ['https://images.unsplash.com/photo-1574216459004-2362b88cb5f0?w=500'],
          deviceCount: 5,
          devices: [
            { name: 'Balo leo núi 50L', quantity: 1 },
            { name: 'Túi ngủ', quantity: 1 },
            { name: 'Đèn pin đội đầu', quantity: 1 },
            { name: 'Bình nước giữ nhiệt', quantity: 1 },
            { name: 'Áo mưa', quantity: 1 }
          ],
          rating: 4.8,
          reviewCount: 32
        },
        {
          id: '3',
          name: 'Combo Picnic Nhóm Bạn',
          description: 'Bộ thiết bị cho buổi picnic 6-8 người',
          pricePerHour: 60000,
          images: ['https://images.unsplash.com/photo-1758618851341-35cfd04b5406?w=500'],
          deviceCount: 6,
          devices: [
            { name: 'Bạt trải picnic lớn', quantity: 1 },
            { name: 'Bộ dụng cụ nấu ăn', quantity: 1 },
            { name: 'Bếp gas mini', quantity: 2 },
            { name: 'Loa bluetooth', quantity: 1 },
            { name: 'Võng xếp', quantity: 2 },
            { name: 'Ô dù che nắng', quantity: 1 }
          ],
          rating: 4.7,
          reviewCount: 28
        },
        {
          id: '4',
          name: 'Combo Du Lịch Phượt',
          description: 'Bộ thiết bị cho chuyến phượt đường dài',
          pricePerHour: 70000,
          images: ['https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=500'],
          deviceCount: 8,
          devices: [
            { name: 'Balo leo núi 50L', quantity: 1 },
            { name: 'Túi ngủ', quantity: 1 },
            { name: 'Lều 1 người', quantity: 1 },
            { name: 'Bếp gas mini', quantity: 1 },
            { name: 'Đèn pin', quantity: 1 },
            { name: 'Bình nước', quantity: 2 },
            { name: 'Áo mưa', quantity: 1 },
            { name: 'Bộ sơ cứu', quantity: 1 }
          ],
          rating: 4.9,
          reviewCount: 51
        },
        {
          id: '5',
          name: 'Combo Chụp Ảnh Du Lịch',
          description: 'Bộ thiết bị cho nhiếp ảnh gia du lịch',
          pricePerHour: 120000,
          images: ['https://images.unsplash.com/photo-1606318834502-c3127255246c?w=500'],
          deviceCount: 5,
          devices: [
            { name: 'Máy ảnh GoPro Hero', quantity: 1 },
            { name: 'Gimbal ổn định', quantity: 1 },
            { name: 'Ống nhòm', quantity: 1 },
            { name: 'Pin dự phòng', quantity: 2 },
            { name: 'Thẻ nhớ 128GB', quantity: 2 }
          ],
          rating: 5.0,
          reviewCount: 38
        },
        {
          id: '6',
          name: 'Combo Cắm Trại Cặp Đôi',
          description: 'Bộ thiết bị lãng mạn cho cặp đôi',
          pricePerHour: 55000,
          images: ['https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=500'],
          deviceCount: 6,
          devices: [
            { name: 'Lều 2 người', quantity: 1 },
            { name: 'Túi ngủ đôi', quantity: 1 },
            { name: 'Đèn trang trí', quantity: 1 },
            { name: 'Bộ nấu ăn mini', quantity: 1 },
            { name: 'Võng đôi', quantity: 1 },
            { name: 'Loa bluetooth', quantity: 1 }
          ],
          rating: 4.8,
          reviewCount: 42
        },
        {
          id: '7',
          name: 'Combo Du Lịch Biển',
          description: 'Bộ thiết bị cho chuyến du lịch biển',
          pricePerHour: 65000,
          images: ['https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=500'],
          deviceCount: 7,
          devices: [
            { name: 'Phao bơi', quantity: 2 },
            { name: 'Kính lặn', quantity: 2 },
            { name: 'Ô dù che nắng', quantity: 1 },
            { name: 'Túi chống nước', quantity: 2 },
            { name: 'Kem chống nắng', quantity: 2 },
            { name: 'Ghế xếp bãi biển', quantity: 2 },
            { name: 'Bình giữ nhiệt', quantity: 2 }
          ],
          rating: 4.7,
          reviewCount: 35
        },
        {
          id: '8',
          name: 'Combo Trekking Chuyên Nghiệp',
          description: 'Bộ thiết bị cao cấp cho người yêu trekking',
          pricePerHour: 95000,
          images: ['https://images.unsplash.com/photo-1622260614153-03223fb72052?w=500'],
          deviceCount: 9,
          devices: [
            { name: 'Balo leo núi 70L', quantity: 1 },
            { name: 'Lều chống bão', quantity: 1 },
            { name: 'Túi ngủ -10°C', quantity: 1 },
            { name: 'Gậy trekking', quantity: 2 },
            { name: 'Đèn pin siêu sáng', quantity: 1 },
            { name: 'GPS cầm tay', quantity: 1 },
            { name: 'Bộ sơ cứu nâng cao', quantity: 1 },
            { name: 'Bếp gas chuyên dụng', quantity: 1 },
            { name: 'Bình lọc nước', quantity: 1 }
          ],
          rating: 5.0,
          reviewCount: 27
        }
      ];

      setCombos(mockCombos);
      setTotalPages(Math.ceil(mockCombos.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching combos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [combos, filters]);

  const calculateHours = () => {
    if (!filters.startDate || !filters.startTime || !filters.endDate || !filters.endTime) {
      return 0;
    }

    const start = new Date(`${filters.startDate}T${filters.startTime}`);
    const end = new Date(`${filters.endDate}T${filters.endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    
    return hours;
  };

  const applyFilters = () => {
    let filtered = [...combos];

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(combo => {
        const price = combo.pricePerHour;
        if (max) {
          return price >= min && price <= max;
        }
        return price >= min;
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(combo => 
        combo.name.toLowerCase().includes(searchLower) ||
        combo.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCombos(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      priceRange: '',
      search: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: ''
    });
    setCurrentPage(1);
  };

  const paginatedCombos = filteredCombos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const rentalHours = calculateHours();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl mb-4">Combo Thiết Bị Du Lịch</h1>
          <p className="text-xl text-purple-100">Tiết kiệm hơn với gói thiết bị trọn gói</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Time Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Ngày bắt đầu</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Giờ bắt đầu</label>
              <Input
                type="time"
                value={filters.startTime}
                onChange={(e) => handleFilterChange('startTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Ngày kết thúc</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Giờ kết thúc</label>
              <Input
                type="time"
                value={filters.endTime}
                onChange={(e) => handleFilterChange('endTime', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              {rentalHours > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 w-full">
                  <p className="text-sm text-purple-700">Thời gian thuê: <span className="font-semibold">{rentalHours} giờ</span></p>
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
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            
            <div className="text-sm text-gray-600">
              Tìm thấy <span className="font-semibold">{filteredCombos.length}</span> combo
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm mb-1">Tìm kiếm</label>
                <Input
                  placeholder="Tên combo..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Giá thuê/giờ</label>
                <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange('priceRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mức giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-50000">Dưới 50.000đ</SelectItem>
                    <SelectItem value="50000-80000">50.000đ - 80.000đ</SelectItem>
                    <SelectItem value="80000-100000">80.000đ - 100.000đ</SelectItem>
                    <SelectItem value="100000-999999">Trên 100.000đ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Combos Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
        ) : paginatedCombos.length === 0 ? (
          <div className="text-center py-12">
            <Package2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Không tìm thấy combo phù hợp</h3>
            <p className="text-gray-600 mb-4">Thử điều chỉnh bộ lọc của bạn</p>
            <Button onClick={clearFilters}>Xóa bộ lọc</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCombos.map((combo) => {
                const totalPrice = rentalHours > 0 ? combo.pricePerHour * rentalHours : combo.pricePerHour;
                const queryParams = new URLSearchParams();
                if (filters.startDate) queryParams.append('startDate', filters.startDate);
                if (filters.startTime) queryParams.append('startTime', filters.startTime);
                if (filters.endDate) queryParams.append('endDate', filters.endDate);
                if (filters.endTime) queryParams.append('endTime', filters.endTime);

                return (
                  <Link
                    key={combo.id}
                    to={`/combo/${combo.id}?${queryParams.toString()}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                      <div className="relative h-48 overflow-hidden">
                        <ImageWithFallback
                          src={combo.images?.[0] || ''}
                          alt={combo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-2 right-2 bg-white text-purple-700">
                          {combo.deviceCount} thiết bị
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-2">
                          {combo.name}
                        </h3>
                        
                        {combo.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{combo.description}</p>
                        )}

                        <div className="flex items-center mb-3">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 text-sm">{combo.rating}</span>
                            <span className="ml-1 text-sm text-gray-500">({combo.reviewCount})</span>
                          </div>
                        </div>

                        {/* Device List Preview */}
                        <div className="mb-3 text-sm">
                          <p className="text-gray-600 mb-1">Bao gồm:</p>
                          <ul className="space-y-0.5">
                            {combo.devices.slice(0, 3).map((device, idx) => (
                              <li key={idx} className="text-gray-700 text-xs flex items-start">
                                <span className="text-purple-600 mr-1">•</span>
                                <span>{device.name} {device.quantity > 1 ? `(x${device.quantity})` : ''}</span>
                              </li>
                            ))}
                            {combo.devices.length > 3 && (
                              <li className="text-gray-500 text-xs italic">
                                và {combo.devices.length - 3} thiết bị khác...
                              </li>
                            )}
                          </ul>
                        </div>

                        <Separator className="my-3" />

                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-600">Giá thuê/giờ:</span>
                            <span className="font-semibold text-purple-600">
                              {combo.pricePerHour.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          {rentalHours > 0 && (
                            <>
                              <div className="flex justify-between items-baseline text-sm">
                                <span className="text-gray-600">× {rentalHours} giờ</span>
                                <span className="text-gray-900"></span>
                              </div>
                              <div className="flex justify-between items-baseline pt-2 border-t">
                                <span className="font-semibold">Tổng:</span>
                                <span className="font-bold text-purple-600">
                                  {totalPrice.toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-3">
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            Tiết kiệm đến 20%
                          </Badge>
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
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trang trước
                </Button>
                <span className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
