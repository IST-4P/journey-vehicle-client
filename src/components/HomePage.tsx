import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Bike, Shield, Clock, CreditCard, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { VehicleRecommendations } from './VehicleRecommendations';
import { DestinationCarousel } from './DestinationCarousel';

export function HomePage() {
  // Mock data for car recommendations
  const carRecommendations = [
    {
      id: 'car-rec-1',
      name: 'Toyota Camry 2023',
      brand: 'Toyota',
      image: 'https://images.unsplash.com/photo-1624578571415-09e9b1991929?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3lvdGElMjBjYW1yeSUyMHNlZGFuJTIwY2FyfGVufDF8fHx8MTc1OTY3MDI1Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 800000,
      pricePerHour: 35000,
      rating: 4.8,
      available: true,
      category: 'sedan' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const,
      seats: 5
    },
    {
      id: 'car-rec-2',
      name: 'Honda Civic 2023',
      brand: 'Honda',
      image: 'https://images.unsplash.com/photo-1742230376664-ce990c7d7bb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob25kYSUyMGNpdmljJTIwc2VkYW58ZW58MXx8fHwxNzU5NjQ2ODA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 750000,
      pricePerHour: 32000,
      rating: 4.7,
      available: true,
      category: 'sedan' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const,
      seats: 5
    },
    {
      id: 'car-rec-3',
      name: 'BMW X3 2023',
      brand: 'BMW',
      image: 'https://images.unsplash.com/photo-1635990716619-7710162ea073?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibXclMjBzdXYlMjBjYXJ8ZW58MXx8fHwxNzU5NjcwMjU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 1500000,
      pricePerHour: 65000,
      rating: 4.9,
      available: true,
      category: 'suv' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const,
      seats: 7
    },
    {
      id: 'car-rec-4',
      name: 'Mercedes E-Class',
      brand: 'Mercedes-Benz',
      image: 'https://images.unsplash.com/photo-1698816688678-a3f838fd4fe0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXJjZWRlcyUyMHNlZGFuJTIwbHV4dXJ5fGVufDF8fHx8MTc1OTY3MDI2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 1800000,
      pricePerHour: 75000,
      rating: 4.9,
      available: true,
      category: 'sedan' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const,
      seats: 5
    },
    {
      id: 'car-rec-5',
      name: 'Audi A3 Hatchback',
      brand: 'Audi',
      image: 'https://images.unsplash.com/photo-1610475426610-9d49bac9e278?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdWRpJTIwaGF0Y2hiYWNrJTIwY2FyfGVufDF8fHx8MTc1OTY3MDI2M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 900000,
      pricePerHour: 40000,
      rating: 4.6,
      available: true,
      category: 'hatchback' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const,
      seats: 5
    },
    {
      id: 'car-rec-6',
      name: 'Lexus ES 2023',
      brand: 'Lexus',
      image: 'https://images.unsplash.com/photo-1751982998942-dce5c9f4c95d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZXh1cyUyMGx1eHVyeSUyMHNlZGFufGVufDF8fHx8MTc1OTY3MDI2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 1600000,
      pricePerHour: 70000,
      rating: 4.8,
      available: true,
      category: 'sedan' as const,
      transmission: 'auto' as const,
      fuel: 'hybrid' as const,
      seats: 5
    },
    {
      id: 'car-rec-7',
      name: 'Ford Explorer 2023',
      brand: 'Ford',
      image: 'https://images.unsplash.com/photo-1669349738612-f5ca5fc51871?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JkJTIwc3V2JTIwY2FyfGVufDF8fHx8MTc1OTY3MDI2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 1200000,
      pricePerHour: 52000,
      rating: 4.5,
      available: false,
      category: 'suv' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const,
      seats: 7
    },
    {
      id: 'car-rec-8',
      name: 'Mazda3 Hatchback',
      brand: 'Mazda',
      image: 'https://images.unsplash.com/photo-1655821545058-0c6c6538d5d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMGhhdGNoYmFjayUyMGNhcnxlbnwxfHx8fDE3NTk2NzAyNzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 850000,
      pricePerHour: 38000,
      rating: 4.4,
      available: true,
      category: 'hatchback' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const,
      seats: 5
    }
  ];

  // Mock data for motorcycle recommendations
  const motorcycleRecommendations = [
    {
      id: 'moto-rec-1',
      name: 'Honda Air Blade 150',
      brand: 'Honda',
      image: 'https://images.unsplash.com/photo-1719642357410-e2910048087c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob25kYSUyMHNjb290ZXIlMjBtb3RvcmN5Y2xlfGVufDF8fHx8MTc1OTY3MDI3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 150000,
      pricePerHour: 8000,
      rating: 4.7,
      available: true,
      category: 'scooter' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const
    },
    {
      id: 'moto-rec-2',
      name: 'Yamaha Janus 125',
      brand: 'Yamaha',
      image: 'https://images.unsplash.com/photo-1705297433337-dcb458fbdf35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5YW1haGElMjBzY29vdGVyJTIwbW90b3JjeWNsZXxlbnwxfHx8fDE3NTk2NzAyNzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 130000,
      pricePerHour: 7000,
      rating: 4.5,
      available: true,
      category: 'scooter' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const
    },
    {
      id: 'moto-rec-3',
      name: 'Suzuki Skydrive 125',
      brand: 'Suzuki',
      image: 'https://images.unsplash.com/photo-1643926859395-92b10d45477c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXp1a2klMjBtb3RvcmN5Y2xlJTIwc2Nvb3RlcnxlbnwxfHx8fDE3NTk2NzAyODJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 140000,
      pricePerHour: 7500,
      rating: 4.3,
      available: true,
      category: 'scooter' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const
    },
    {
      id: 'moto-rec-4',
      name: 'Kawasaki Ninja 300',
      brand: 'Kawasaki',
      image: 'https://images.unsplash.com/photo-1725317450560-cd166f22d8d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrYXdhc2FraSUyMHNwb3J0JTIwbW90b3JjeWNsZXxlbnwxfHx8fDE3NTk2NzAyODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 300000,
      pricePerHour: 15000,
      rating: 4.8,
      available: true,
      category: 'sport' as const,
      transmission: 'manual' as const,
      fuel: 'gasoline' as const
    },
    {
      id: 'moto-rec-5',
      name: 'Piaggio Vespa LX 150',
      brand: 'Piaggio',
      image: 'https://images.unsplash.com/photo-1646939813404-abee9dcc770c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWFnZ2lvJTIwdmVzcGElMjBzY29vdGVyfGVufDF8fHx8MTc1OTY3MDI4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 180000,
      pricePerHour: 9500,
      rating: 4.6,
      available: true,
      category: 'scooter' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const
    },
    {
      id: 'moto-rec-6',
      name: 'Honda CBR 150R',
      brand: 'Honda',
      image: 'https://images.unsplash.com/photo-1668445046413-59f8ea2e0b4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob25kYSUyMG1vdG9yY3ljbGUlMjBzcG9ydHxlbnwxfHx8fDE3NTk2NzAyOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 250000,
      pricePerHour: 12000,
      rating: 4.7,
      available: false,
      category: 'sport' as const,
      transmission: 'manual' as const,
      fuel: 'gasoline' as const
    },
    {
      id: 'moto-rec-7',
      name: 'Yamaha R15 V3',
      brand: 'Yamaha',
      image: 'https://images.unsplash.com/photo-1643824762078-d7307c468ee6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5YW1haGElMjBzcG9ydCUyMG1vdG9yY3ljbGV8ZW58MXx8fHwxNzU5NjcwMjk1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 280000,
      pricePerHour: 14000,
      rating: 4.8,
      available: true,
      category: 'sport' as const,
      transmission: 'manual' as const,
      fuel: 'gasoline' as const
    },
    {
      id: 'moto-rec-8',
      name: 'SYM Attila Venus 125',
      brand: 'SYM',
      image: 'https://images.unsplash.com/photo-1696604219978-fc33d972cc8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzeW0lMjBzY29vdGVyJTIwbW90b3JjeWNsZXxlbnwxfHx8fDE3NTk2NzAzMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      pricePerDay: 120000,
      pricePerHour: 6500,
      rating: 4.2,
      available: true,
      category: 'scooter' as const,
      transmission: 'auto' as const,
      fuel: 'gasoline' as const
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'An toàn & Tin cậy',
      description: 'Tất cả xe được kiểm tra kỹ thuật định kỳ và có bảo hiểm đầy đủ'
    },
    {
      icon: Clock,
      title: 'Thuê nhanh 24/7',
      description: 'Đặt xe mọi lúc mọi nơi với quy trình đơn giản chỉ trong vài phút'
    },
    {
      icon: CreditCard,
      title: 'Thanh toán linh hoạt',
      description: 'Hỗ trợ nhiều hình thức thanh toán tiện lợi và an toàn'
    },
    {
      icon: Users,
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ tư vấn chuyên nghiệp luôn sẵn sàng hỗ trợ bạn'
    }
  ];

  const testimonials = [
    {
      name: 'Nguyễn Văn A',
      rating: 5,
      comment: 'Dịch vụ tuyệt vời, xe sạch sẽ và giá cả hợp lý. Tôi sẽ sử dụng lại!',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
    },
    {
      name: 'Trần Thị B',
      rating: 5,
      comment: 'Thuê xe máy rất tiện lợi, giao xe nhanh và chất lượng tốt.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face'
    },
    {
      name: 'Lê Văn C',
      rating: 4,
      comment: 'Ứng dụng dễ sử dụng, quy trình thuê xe đơn giản và nhanh chóng.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Khách hàng tin tưởng' },
    { number: '500+', label: 'Xe có sẵn' },
    { number: '50+', label: 'Địa điểm phục vụ' },
    { number: '99%', label: 'Khách hàng hài lòng' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.8), rgba(29, 78, 216, 0.8)), url('https://images.unsplash.com/photo-1727361824538-bf7614fbc97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZWhpY2xlJTIwcmVudGFsJTIwaGVyb3xlbnwxfHx8fDE3NTk2NjU0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Thuê xe dễ dàng <br />
              <span className="text-yellow-300">Hành trình tuyệt vời</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Khám phá thế giới với dịch vụ thuê xe ô tô và xe máy hàng đầu Việt Nam. 
              An toàn, tiện lợi và giá cả phải chăng.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cars">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Car className="mr-2 h-5 w-5" />
                  Thuê ô tô
                </Button>
              </Link>
              <Link to="/motorcycles">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-blue-600 bg-transparent">
                  <Bike className="mr-2 h-5 w-5 text-white" />
                  <span className="text-white">Thuê xe máy</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tại sao chọn HacMieu Journey?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chúng tôi cam kết mang đến cho bạn trải nghiệm thuê xe tốt nhất với những ưu điểm vượt trội
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Car Recommendations */}
      <VehicleRecommendations 
        title="Xe ô tô dành cho bạn"
        vehicles={carRecommendations}
        viewAllLink="/cars"
        type="car"
      />

      {/* Motorcycle Recommendations */}
      <VehicleRecommendations 
        title="Xe máy dành cho bạn"
        vehicles={motorcycleRecommendations}
        viewAllLink="/motorcycles"
        type="motorcycle"
      />

      {/* Destination Carousel */}
      <DestinationCarousel />

      {/* About Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Bạn muốn biết thêm về HacMieuJourney?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
            HacMieuJourney được thành lập với sứ mệnh mang đến dịch vụ thuê xe ô tô và xe máy 
            chất lượng cao, an toàn và tiện lợi nhất cho người dân Việt Nam. Chúng tôi cam kết 
            cung cấp đội xe đa dạng, quy trình thuê xe đơn giản và dịch vụ khách hàng tận tâm 
            24/7. Với hơn 500+ xe có sẵn tại 50+ địa điểm trên toàn quốc, chúng tôi tự hào là 
            đối tác đáng tin cậy cho mọi hành trình của bạn.
          </p>
          <Link to="/about">
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Tìm hiểu thêm
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dịch vụ của chúng tôi
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Car Rental */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTkwNzQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Thuê ô tô"
                  className="w-full lg:w-64 h-48 object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Thuê ô tô</h3>
                <p className="text-gray-600 mb-6">
                  Đa dạng các loại xe từ sedan đến SUV, phù hợp cho mọi nhu cầu từ du lịch gia đình 
                  đến công việc kinh doanh. Tất cả xe đều được bảo dưỡng định kỳ và có bảo hiểm.
                </p>
                <Link to="/cars">
                  <Button className="w-full lg:w-auto">
                    Xem xe ô tô
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Motorcycle Rental */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
                  alt="Thuê xe máy"
                  className="w-full lg:w-64 h-48 object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Thuê xe máy</h3>
                <p className="text-gray-600 mb-6">
                  Xe máy đa dạng từ xe tay ga đến xe số, phù hợp cho việc di chuyển nhanh chóng 
                  trong thành phố. Tiết kiệm chi phí và thời gian.
                </p>
                <Link to="/motorcycles">
                  <Button className="w-full lg:w-auto">
                    Xem xe máy
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Khách hàng nói gì về chúng tôi
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <ImageWithFallback
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="flex items-center">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sẵn sàng cho chuyến đi của bạn?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Đặt xe ngay hôm nay và trải nghiệm dịch vụ thuê xe tốt nhất tại Việt Nam
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cars">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Thuê ô tô ngay
              </Button>
            </Link>
            <Link to="/motorcycles">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-blue-600 bg-transparent">
                <span className="text-white">Thuê xe máy ngay</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}