import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Destination {
  id: string;
  name: string;
  image: string;
  description: string;
  vehicleCount: number;
}

const destinations: Destination[] = [
  {
    id: 'ho-chi-minh',
    name: 'TP. Hồ Chí Minh',
    image: 'https://images.unsplash.com/photo-1754797007248-12a4a9550102?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxobyUyMGNoaSUyMG1pbmglMjBjaXR5JTIwdmlldG5hbSUyMHNreWxpbmV8ZW58MXx8fHwxNzU5NjcwODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Thành phố năng động với hơn 200+ xe cho thuê',
    vehicleCount: 200
  },
  {
    id: 'hanoi',
    name: 'Hà Nội',
    image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5vaSUyMHZpZXRuYW0lMjBjaXR5JTIwdmlld3xlbnwxfHx8fDE3NTk2NzA4NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Thủ đô cổ kính với 150+ xe đa dạng',
    vehicleCount: 150
  },
  {
    id: 'da-nang',
    name: 'Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1693291031243-87fa0ec6196b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYSUyMG5hbmclMjB2aWV0bmFtJTIwZHJhZ29uJTIwYnJpZGdlfGVufDF8fHx8MTc1OTY3MDg1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Thành phố biển xinh đẹp với 100+ xe',
    vehicleCount: 100
  },
  {
    id: 'da-lat',
    name: 'Đà Lạt',
    image: 'https://images.unsplash.com/photo-1643799259865-055cea522dd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYSUyMGxhdCUyMHZpZXRuYW0lMjBtb3VudGFpbnMlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzU5NjcwODU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Thành phố ngàn hoa với 80+ xe',
    vehicleCount: 80
  },
  {
    id: 'nha-trang',
    name: 'Nha Trang',
    image: 'https://images.unsplash.com/photo-1730203549076-06358ad220e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaGElMjB0cmFuZyUyMHZpZXRuYW0lMjBiZWFjaCUyMGNvYXN0bGluZXxlbnwxfHx8fDE3NTk2NzA4NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Thiên đường biển với 90+ xe cho thuê',
    vehicleCount: 90
  }
];

export function DestinationCarousel() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Địa điểm nổi bật
            </h2>
            <p className="text-xl text-gray-600">
              Khám phá những thành phố tuyệt vời cùng chúng tôi
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-gray-500">
            <MapPin className="h-5 w-5" />
            <span>5 điểm đến</span>
          </div>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {destinations.map((destination) => (
              <CarouselItem key={destination.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="relative h-64">
                    <ImageWithFallback
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Content overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {destination.name}
                      </h3>
                      <p className="text-white/90 text-sm mb-4">
                        {destination.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-white/80 text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{destination.vehicleCount}+ xe</span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                          asChild
                        >
                          <Link to={`/cars?location=${destination.id}`}>
                            Khám phá
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <CarouselPrevious className="hidden md:flex -left-4 lg:-left-8" />
          <CarouselNext className="hidden md:flex -right-4 lg:-right-8" />
        </Carousel>

        {/* Mobile scroll indicator */}
        <div className="mt-6 text-center md:hidden">
          <p className="text-sm text-gray-500">
            Vuốt để xem thêm địa điểm
          </p>
        </div>
      </div>
    </section>
  );
}