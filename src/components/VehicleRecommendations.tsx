import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  image: string;
  pricePerDay: number;
  pricePerHour: number;
  rating: number;
  available: boolean;
  category: 'sedan' | 'suv' | 'hatchback' | 'convertible' | 'scooter' | 'motorcycle' | 'sport';
  transmission: 'auto' | 'manual';
  fuel: 'gasoline' | 'electric' | 'hybrid';
  seats?: number;
}

interface VehicleRecommendationsProps {
  title: string;
  vehicles: Vehicle[];
  viewAllLink: string;
  type: 'car' | 'motorcycle';
}

export function VehicleRecommendations({ title, vehicles, viewAllLink, type }: VehicleRecommendationsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap = {
      sedan: 'Sedan',
      suv: 'SUV',
      hatchback: 'Hatchback',
      convertible: 'Convertible',
      scooter: 'Tay ga',
      motorcycle: 'Xe số',
      sport: 'Thể thao'
    };
    return categoryMap[category as keyof typeof categoryMap] || category;
  };

  const getTransmissionLabel = (transmission: string) => {
    return transmission === 'auto' ? 'Tự động' : 'Số sàn';
  };

  const getFuelLabel = (fuel: string) => {
    const fuelMap = {
      gasoline: 'Xăng',
      electric: 'Điện',
      hybrid: 'Hybrid'
    };
    return fuelMap[fuel as keyof typeof fuelMap] || fuel;
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-xl text-gray-600">
              Những lựa chọn phù hợp nhất cho bạn
            </p>
          </div>
          <Link to={viewAllLink}>
            <Button variant="outline" className="hidden md:flex">
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.slice(0, 8).map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <ImageWithFallback
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-48 object-cover"
                />
                {!vehicle.available && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Badge variant="secondary" className="bg-red-600 text-white">
                      Không có sẵn
                    </Badge>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-white text-gray-800">
                    {getCategoryLabel(vehicle.category)}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3 flex items-center bg-black bg-opacity-70 text-white px-2 py-1 rounded">
                  <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm">{vehicle.rating}</span>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-lg mb-1">{vehicle.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{vehicle.brand}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{getTransmissionLabel(vehicle.transmission)}</span>
                    <span>{getFuelLabel(vehicle.fuel)}</span>
                    {vehicle.seats && (
                      <span>{vehicle.seats} chỗ</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Từ</div>
                    <div className="font-bold text-blue-600">
                      {formatPrice(vehicle.pricePerDay)}/ngày
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(vehicle.pricePerHour)}/giờ
                    </div>
                  </div>
                  
                  <Link to={`/vehicle/${type}/${vehicle.id}`}>
                    <Button size="sm" disabled={!vehicle.available} className="w-full">
                      {vehicle.available ? 'Xem chi tiết' : 'Không có sẵn'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center md:hidden">
          <Link to={viewAllLink}>
            <Button variant="outline">
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}