import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, MapPin, Users, Fuel, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Motorcycle {
  id: string;
  name: string;
  brand: string;
  model: string;
  engineType: string;
  seats: number;
  fuel: string;
  consumption: string;
  pricePerHour: number;
  pricePerDay: number;
  location: string;
  images: string[];
  description: string;
  available: boolean;
  rating: number;
  reviewCount: number;
}

export function MotorcycleRental() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [filteredMotorcycles, setFilteredMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    priceRange: '',
    engineType: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });

  const itemsPerPage = 12;

  useEffect(() => {
    fetchMotorcycles();
    initializeData();
  }, [currentPage]);

  const initializeData = async () => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-551107ff/init-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const fetchMotorcycles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-551107ff/vehicles?type=motorcycle&page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMotorcycles(data.vehicles || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching motorcycles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [motorcycles, filters]);

  const applyFilters = () => {
    let filtered = [...motorcycles];

    // Filter out rented/unavailable motorcycles first
    filtered = filtered.filter(motorcycle => motorcycle.available === true);

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(motorcycle => {
        const price = motorcycle.pricePerDay;
        return price >= min && price <= max;
      });
    }

    if (filters.engineType) {
      filtered = filtered.filter(motorcycle => motorcycle.engineType === filters.engineType);
    }

    if (filters.location) {
      filtered = filtered.filter(motorcycle => motorcycle.location.includes(filters.location));
    }

    setFilteredMotorcycles(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: '',
      engineType: '',
      location: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: ''
    });
  };

  const calculateRentalHours = () => {
    if (!filters.startDate || !filters.startTime || !filters.endDate || !filters.endTime) {
      return 24; // Default to 1 day
    }

    const startDateTime = new Date(`${filters.startDate}T${filters.startTime}`);
    const endDateTime = new Date(`${filters.endDate}T${filters.endTime}`);
    
    if (endDateTime <= startDateTime) {
      return 24; // Minimum 1 day if invalid dates
    }

    const diffInMs = endDateTime.getTime() - startDateTime.getTime();
    const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));
    return Math.max(diffInHours, 1); // Minimum 1 hour
  };

  const calculateRentalPrice = (pricePerHour: number) => {
    const hours = calculateRentalHours();
    return pricePerHour * hours;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const engineTypes = [
    { value: 'tay ga', label: 'Xe tay ga' },
    { value: 'tay côn', label: 'Xe tay côn' },
    { value: 'số', label: 'Xe số' }
  ];

  const priceRanges = [
    { value: '0-100000', label: 'Dưới 100K' },
    { value: '100000-200000', label: '100K - 200K' },
    { value: '200000-300000', label: '200K - 300K' },
    { value: '300000-500000', label: '300K - 500K' },
    { value: '500000-999999999', label: 'Trên 500K' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.8), rgba(29, 78, 216, 0.8)), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3RvcmN5Y2xlJTIwcmVudGFsJTIwaGVyb3xlbnwxfHx8fDE3NTk2NjU0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Thuê xe máy
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Tìm kiếm và thuê xe máy phù hợp với nhu cầu di chuyển của bạn
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Horizontal Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Bộ lọc
            </h2>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {/* Price Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Giá theo ngày</label>
              <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange('priceRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khoảng giá" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Engine Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Loại xe</label>
              <Select value={filters.engineType} onValueChange={(value) => handleFilterChange('engineType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại xe" />
                </SelectTrigger>
                <SelectContent>
                  {engineTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-2 block">Khu vực</label>
              <Input
                placeholder="Nhập khu vực..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
          </div>

          {/* Rental Time */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Thời gian thuê</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Ngày bắt đầu</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Giờ bắt đầu</label>
                <Input
                  type="time"
                  value={filters.startTime}
                  onChange={(e) => handleFilterChange('startTime', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Ngày kết thúc</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  min={filters.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Giờ kết thúc</label>
                <Input
                  type="time"
                  value={filters.endTime}
                  onChange={(e) => handleFilterChange('endTime', e.target.value)}
                />
              </div>
            </div>

            {(filters.startDate && filters.startTime && filters.endDate && filters.endTime) && (
              <div className="bg-blue-50 p-3 rounded mt-4 text-sm">
                <span className="font-medium">Thời gian thuê: </span>
                <span className="text-blue-600">{calculateRentalHours()} giờ</span>
              </div>
            )}
          </div>
        </div>

        {/* Motorcycle Listings */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              Tìm thấy {filteredMotorcycles.length} xe máy
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMotorcycles.map((motorcycle) => (
              <Card key={motorcycle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <ImageWithFallback
                    src={motorcycle.images[0]}
                    alt={motorcycle.name}
                    className="w-full h-40 object-cover"
                  />
                </div>

                <CardContent className="p-3">
                  <div className="mb-2">
                    <h3 className="font-semibold text-base">{motorcycle.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {motorcycle.location}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {motorcycle.seats} chỗ
                    </div>
                    <div className="flex items-center">
                      <Fuel className="h-4 w-4 mr-1" />
                      {motorcycle.consumption}
                    </div>
                    <Badge variant="outline">
                      {motorcycle.engineType === 'tay ga' ? 'Tay ga' : 
                       motorcycle.engineType === 'tay côn' ? 'Tay côn' : 'Xe số'}
                    </Badge>
                  </div>

                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">{motorcycle.rating}</span>
                      <span className="text-sm text-gray-600 ml-1">({motorcycle.reviewCount})</span>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-3">
                    <div>
                      {(filters.startDate && filters.startTime && filters.endDate && filters.endTime) ? (
                        <>
                          <div className="text-sm text-gray-600">Tổng ({calculateRentalHours()} giờ)</div>
                          <div className="font-bold text-blue-600">
                            {formatPrice(calculateRentalPrice(motorcycle.pricePerHour))}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(motorcycle.pricePerHour)}/giờ
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-gray-600">Từ</div>
                          <div className="font-bold text-blue-600">
                            {formatPrice(motorcycle.pricePerDay)}/ngày
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(motorcycle.pricePerHour)}/giờ
                          </div>
                        </>
                      )}
                    </div>
                    <Link to={`/vehicle/motorcycle/${motorcycle.id}${(filters.startDate && filters.startTime && filters.endDate && filters.endTime) ? 
                      `?startDate=${filters.startDate}&startTime=${filters.startTime}&endDate=${filters.endDate}&endTime=${filters.endTime}` : ''}`}>
                      <Button size="sm" className="w-full">
                        Xem chi tiết
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index + 1}
                    variant={currentPage === index + 1 ? "default" : "outline"}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}

          {filteredMotorcycles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy xe</h3>
              <p className="text-gray-600">Vui lòng thử điều chỉnh bộ lọc để tìm kiếm xe phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}