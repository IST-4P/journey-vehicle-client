import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, MapPin, Users, Fuel, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Car {
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
  createdAt: string;
  updatedAt: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brandId: string;
}
export function CarRental() {
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  
  // Filters để hiển thị trong form (chưa áp dụng)
  const [filters, setFilters] = useState({
    priceRange: '',
    seats: '', // Giữ là string để tương thích với Select component
    brand: '',
    model: '',
    transmission: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });

  // Applied filters để thực sự lọc dữ liệu
  const [appliedFilters, setAppliedFilters] = useState({
    priceRange: '',
    seats: '', // Giữ là string, sẽ convert khi cần
    brand: '',
    model: '',
    transmission: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });

  const itemsPerPage = 12;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Xây dựng query parameters từ filters
        const queryParams = new URLSearchParams({
          type: 'CAR',
          page: currentPage.toString(),
          limit: itemsPerPage.toString()
        });

        // Thêm các filter parameters
        if (appliedFilters.priceRange) {
          const [minPrice, maxPrice] = appliedFilters.priceRange.split('-');
          queryParams.append('minPrice', minPrice);
          queryParams.append('maxPrice', maxPrice);
          console.log('Price filter applied:', minPrice, 'to', maxPrice);
        }

        if (appliedFilters.seats) {
          queryParams.append('seats', appliedFilters.seats);
        }

        if (appliedFilters.brand) {
          queryParams.append('brandId', appliedFilters.brand);
        }

        if (appliedFilters.model) {
          queryParams.append('modelId', appliedFilters.model);
        }

        if (appliedFilters.transmission) {
          queryParams.append('transmission', appliedFilters.transmission);
        }

        if (appliedFilters.location) {
          queryParams.append('location', appliedFilters.location);
        }

        // Chỉ lấy xe có status ACTIVE
        queryParams.append('status', 'ACTIVE');

        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/vehicle?${queryParams.toString()}`;
        console.log('Fetching vehicles from:', apiUrl);

        const response = await fetch(apiUrl, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          
          // Kiểm tra message Error.VehicleNotFound
          if (data.message === "Error.VehicleNotFound") {
            setFilteredCars([]);
            setTotalPages(1);
            console.log('No vehicles found:', data.message);
            return;
          }
          
          let vehicles = data.data.vehicles || [];
          
          // Fallback: nếu server không filter theo giá, filter client-side
          if (appliedFilters.priceRange && vehicles.length > 0) {
            const [minPrice, maxPrice] = appliedFilters.priceRange.split('-');
            const minPriceNum = parseInt(minPrice);
            const maxPriceNum = parseInt(maxPrice);
            
            // Kiểm tra xem server đã filter chưa bằng cách xem có xe nào ngoài range không
            const hasVehiclesOutsideRange = vehicles.some((car: Car) => 
              car.pricePerDay < minPriceNum || car.pricePerDay > maxPriceNum
            );
            
            if (hasVehiclesOutsideRange) {
              console.log('Server không filter theo giá, filtering client-side...');
              vehicles = vehicles.filter((car: Car) => {
                const pricePerDay = car.pricePerDay;
                return pricePerDay >= minPriceNum && pricePerDay <= maxPriceNum;
              });
            } else {
              console.log('Server đã filter theo giá thành công');
            }
          }
          
          setFilteredCars(vehicles);
          setTotalPages(data.data.totalPages || 1);
          console.log('Vehicles after filtering:', vehicles.length);
        } else {
          // Xử lý các response codes khác (404, 500, etc.)
          const errorData = await response.json().catch(() => null);
          
          if (response.status === 404 && errorData?.message === "Error.VehicleNotFound") {
            setFilteredCars([]);
            setTotalPages(1);
            console.log('No vehicles found (404):', errorData.message);
          } else {
            console.error('Failed to fetch vehicles:', response.status);
            setFilteredCars([]);
            setTotalPages(1);
          }
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };

    const initializeDriverLicense = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/driver-license`, { 
          credentials: 'include' 
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('Driver license not found');
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log('Driver license data:', data);
      } catch (error) {
        console.error('Error fetching driver license:', error);
      }
    };

    fetchData();
    initializeDriverLicense();
  }, [currentPage, appliedFilters]); // Thêm appliedFilters vào dependency array

  // Fetch brands một lần khi component mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        console.log('Fetching brands from:', `${import.meta.env.VITE_API_BASE_URL}/vehicle-brand`);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vehicle-brand`, { 
          credentials: 'include' 
        });
        
        console.log('Brands response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Brands response data:', data);
          console.log('data.data:', data.data);
          console.log('typeof data.data:', typeof data.data);
          
          // Kiểm tra cấu trúc response và set brands
          if (data.data && data.data.brands && Array.isArray(data.data.brands)) {
            console.log('Using data.data.brands');
            setBrands(data.data.brands);
          } else if (data.data && Array.isArray(data.data)) {
            console.log('Using data.data as array');
            setBrands(data.data);
          } else if (Array.isArray(data)) {
            console.log('Using data as array');
            setBrands(data);
          } else if (data.data && typeof data.data === 'object') {
            // Try to find brands in various nested structures
            const possibleBrands = Object.values(data.data).find(value => Array.isArray(value));
            if (possibleBrands) {
              console.log('Found brands in nested object:', possibleBrands);
              setBrands(possibleBrands as Brand[]);
            } else {
              console.warn('Could not find brands array in response:', data);
              setBrands([]);
            }
          } else {
            console.warn('Unexpected brands response format:', data);
            setBrands([]);
          }
        } else {
          console.error('Failed to fetch brands:', response.status, response.statusText);
          setBrands([]);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
        setBrands([]);
      }
    };

    fetchBrands();
  }, []); // Chỉ chạy một lần khi component mount

  // Fetch models một lần khi component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        console.log('Fetching models from:', `${import.meta.env.VITE_API_BASE_URL}/vehicle-model`);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vehicle-model`, { 
          credentials: 'include' 
        });
        
        console.log('Models response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Models response data:', data);
          
          // Kiểm tra cấu trúc response và set models
          if (data.data && data.data.models && Array.isArray(data.data.models)) {
            console.log('Using data.data.models');
            setModels(data.data.models);
          } else if (data.data && Array.isArray(data.data)) {
            console.log('Using data.data as array');
            setModels(data.data);
          } else if (Array.isArray(data)) {
            console.log('Using data as array');
            setModels(data);
          } else {
            console.warn('Unexpected models response format:', data);
            setModels([]);
          }
        } else {
          console.error('Failed to fetch models:', response.status, response.statusText);
          setModels([]);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setModels([]);
      }
    };

    fetchModels();
  }, []); // Chỉ chạy một lần khi component mount

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Nếu brand thay đổi, reset model
      if (key === 'brand') {
        newFilters.model = '';
      }
      
      return newFilters;
    });
  };

  // Filter models based on selected brand
  const getAvailableModels = () => {
    if (!filters.brand) {
      // Nếu chưa chọn brand, hiển thị tất cả models
      return models;
    } else {
      // Nếu đã chọn brand, chỉ hiển thị models của brand đó
      return models.filter(model => model.brandId === filters.brand);
    }
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setCurrentPage(1); 
  };

  const clearFilters = () => {
    const emptyFilters = {
      priceRange: '',
      seats: '',
      brand: '',
      model: '',
      transmission: '',
      location: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1); // Reset về trang 1 khi clear filters
  };

  const calculateRentalHours = () => {
    if (!appliedFilters.startDate || !appliedFilters.startTime || !appliedFilters.endDate || !appliedFilters.endTime) {
      return 24; // Default to 1 day
    }

    const startDateTime = new Date(`${appliedFilters.startDate}T${appliedFilters.startTime}`);
    const endDateTime = new Date(`${appliedFilters.endDate}T${appliedFilters.endTime}`);
    
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

  const transmissions = [
    { value: 'MANUAL', label: 'Số sàn' },
    { value: 'AUTOMATIC', label: 'Số tự động' }
  ];
  const seatOptions = ['4', '5', '7', '8'];
  const priceRanges = [
    { value: '0-500000', label: 'Dưới 500K' },
    { value: '500000-1000000', label: '500K - 1M' },
    { value: '1000000-1500000', label: '1M - 1.5M' },
    { value: '1500000-2000000', label: '1.5M - 2M' },
    { value: '2000000-999999999', label: 'Trên 2M' }
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
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.8), rgba(29, 78, 216, 0.8)), url('https://images.unsplash.com/photo-1644749700856-a82a92828a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXJzJTIwcmVudGFsJTIwc2hvd3Jvb218ZW58MXx8fHwxNzU5NjY3NTc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Thuê xe ô tô
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Tìm kiếm và thuê xe ô tô phù hợp với nhu cầu của bạn
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={applyFilters}>
                Áp dụng bộ lọc
              </Button>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {/* Price Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Giá theo ngày</label>
              <Select value={filters.priceRange} onValueChange={(value: string) => handleFilterChange('priceRange', value)}>
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

            {/* Seats */}
            <div>
              <label className="text-sm font-medium mb-2 block">Số chỗ ngồi</label>
              <Select value={filters.seats} onValueChange={(value: string) => handleFilterChange('seats', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn số chỗ" />
                </SelectTrigger>
                <SelectContent>
                  {seatOptions.map(seat => (
                    <SelectItem key={seat} value={seat}>{seat} chỗ</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div>
              <label className="text-sm font-medium mb-2 block">Hãng xe</label>
              <Select value={filters.brand} onValueChange={(value: string) => handleFilterChange('brand', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hãng xe" />
                </SelectTrigger>
                <SelectContent>
                  {brands && brands.length > 0 ? brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  )) : (
                    <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <label className="text-sm font-medium mb-2 block">Model xe</label>
              <Select value={filters.model} onValueChange={(value: string) => handleFilterChange('model', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn model xe" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const availableModels = getAvailableModels();
                    return availableModels && availableModels.length > 0 ? 
                      availableModels.map(model => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      )) : (
                        <SelectItem value="loading" disabled>
                          {filters.brand ? 'Không có model nào' : 'Chọn hãng xe trước'}
                        </SelectItem>
                      );
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Transmission */}
            <div>
              <label className="text-sm font-medium mb-2 block">Loại hộp số</label>
              <Select value={filters.transmission} onValueChange={(value: string) => handleFilterChange('transmission', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại hộp số" />
                </SelectTrigger>
                <SelectContent>
                  {transmissions.map(trans => (
                    <SelectItem key={trans.value} value={trans.value}>{trans.label}</SelectItem>
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
                <span className="font-medium">Thời gian thuê (dự kiến): </span>
                <span className="text-blue-600">
                  {(() => {
                    const startDateTime = new Date(`${filters.startDate}T${filters.startTime}`);
                    const endDateTime = new Date(`${filters.endDate}T${filters.endTime}`);
                    if (endDateTime <= startDateTime) return 24;
                    const diffInMs = endDateTime.getTime() - startDateTime.getTime();
                    const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));
                    return Math.max(diffInHours, 1);
                  })()} giờ
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Car Listings */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              Tìm thấy {filteredCars.length} xe ô tô
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCars.map((car) => (
              <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <ImageWithFallback
                    src={car.images[0]}
                    alt={car.name}
                    className="w-full h-40 object-cover"
                  />
                </div>

                <CardContent className="p-3">
                  <div className="mb-2">
                    <h3 className="font-semibold text-base">{car.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {car.location}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {car.seats} chỗ
                    </div>
                    <div className="flex items-center">
                      <Fuel className="h-4 w-4 mr-1" />
                      {car.fuelType === 'GASOLINE' ? 'Xăng' : 
                       car.fuelType === 'ELECTRIC' ? 'Điện' : 
                       car.fuelType === 'DIESEL' ? 'Dầu' : car.fuelType}
                    </div>
                    <Badge variant="outline">
                      {car.transmission === 'AUTOMATIC' ? 'Số tự động' : 
                       car.transmission === 'MANUAL' ? 'Số sàn' : car.transmission}
                    </Badge>
                  </div>

                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">{car.averageRating || 0}</span>
                      <span className="text-sm text-gray-600 ml-1">({car.totalTrips} chuyến)</span>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-3">
                    <div>
                      {(appliedFilters.startDate && appliedFilters.startTime && appliedFilters.endDate && appliedFilters.endTime) ? (
                        <>
                          <div className="text-sm text-gray-600">Tổng ({calculateRentalHours()} giờ)</div>
                          <div className="font-bold text-blue-600">
                            {formatPrice(calculateRentalPrice(car.pricePerHour))}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(car.pricePerHour)}/giờ
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-gray-600">Từ</div>
                          <div className="font-bold text-blue-600">
                            {formatPrice(car.pricePerDay)}/ngày
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(car.pricePerHour)}/giờ
                          </div>
                        </>
                      )}
                    </div>
                    <Link 
                      to={`/vehicle/${car.id}${(appliedFilters.startDate && appliedFilters.startTime && appliedFilters.endDate && appliedFilters.endTime) ? 
                        `?startDate=${appliedFilters.startDate}&startTime=${appliedFilters.startTime}&endDate=${appliedFilters.endDate}&endTime=${appliedFilters.endTime}` : ''}`}
                      onClick={() => {
                        const targetUrl = `/vehicle/${car.id}`;
                        console.log('🔗 Link clicked:', targetUrl);
                        console.log('📍 Current location:', window.location.pathname);
                        console.log('🚗 Car ID:', car.id);
                        
                        // Test with window.location for debugging
                        // window.location.href = targetUrl;
                      }}
                    >
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
                
                {(() => {
                  const pages = [];
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(totalPages, currentPage + 2);
                  
                  // Hiển thị trang đầu nếu không nằm trong range
                  if (startPage > 1) {
                    pages.push(
                      <Button
                        key={1}
                        variant="outline"
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </Button>
                    );
                    
                    if (startPage > 2) {
                      pages.push(
                        <span key="start-ellipsis" className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                  }
                  
                  // Hiển thị các trang trong range
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </Button>
                    );
                  }
                  
                  // Hiển thị trang cuối nếu không nằm trong range
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="end-ellipsis" className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    
                    pages.push(
                      <Button
                        key={totalPages}
                        variant="outline"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    );
                  }
                  
                  return pages;
                })()}
                
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

          {filteredCars.length === 0 && (
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