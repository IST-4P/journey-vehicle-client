import {
  ArrowRight,
  Bike,
  BookOpen,
  Car,
  Clock,
  CreditCard,
  Package,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DestinationCarousel } from "./DestinationCarousel";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { VehicleRecommendations } from "./VehicleRecommendations";

export function HomePage() {
  const [currentHeroText, setCurrentHeroText] = useState(0);
  const [equipmentRecommendations, setEquipmentRecommendations] = useState<any[]>([]);
  const [carRecommendations, setCarRecommendations] = useState<any[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingCars, setLoadingCars] = useState(false);
  
  const heroTexts = [
    { main: "Thuê xe dễ dàng", sub: "Hành trình tuyệt vời" },
    { main: "Thuê thiết bị du lịch", sub: "Trải nghiệm hoàn hảo" },
    { main: "Cùng bạn khám phá", sub: "Vẻ đẹp Việt Nam" },
    { main: "Du lịch thông minh", sub: "Tiện lợi và an toàn" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroText((prev) => (prev + 1) % heroTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Fetch equipment recommendations from API
  useEffect(() => {
    fetchEquipmentRecommendations();
    fetchCarRecommendations();
  }, []);

  const fetchEquipmentRecommendations = async () => {
    setLoadingEquipment(true);
    try {
      const params = new URLSearchParams({
        limit: "8",
        page: "1",
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

      // Convert equipment data to vehicle format for compatibility with VehicleRecommendations component
      const normalized = devices.map((device: any) => ({
        id: device.id,
        name: device.name,
        brand: device.categoryName ?? device.brand ?? "Equipment",
        image: device.images?.[0] ?? "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800",
        pricePerDay: Number(device.price) || 0,
        pricePerHour: Math.round(Number(device.price) / 24) || 0,
        rating: device.rating ?? 4.8,
        available: device.status === "available",
        category: "sedan" as const,
        transmission: "auto" as const,
        fuel: "gasoline" as const,
        seats: device.quantity ?? 1,
      }));

      setEquipmentRecommendations(normalized);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      setEquipmentRecommendations([]);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const fetchCarRecommendations = async () => {
    setLoadingCars(true);
    try {
      const params = new URLSearchParams({
        type: "CAR",
        page: "1",
        limit: "8",
        status: "ACTIVE",
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/vehicle?${params.toString()}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles (${response.status})`);
      }

      const payload = await response.json();
      const vehicles = payload?.data?.vehicles ?? [];

      const normalized = vehicles.map((vehicle: any) => ({
        id: vehicle.id,
        name: vehicle.name,
        brand:
          vehicle.brandName ||
          vehicle.brandId ||
          vehicle.brand ||
          "HacMieu",
        image:
          vehicle.images?.[0] ||
          "https://images.unsplash.com/photo-1610475426610-9d49bac9e278?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdWRpJTIwaGF0Y2hiYWNrJTIwY2FyfGVufDF8fHx8MTc1OTY3MDI2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
        pricePerDay:
          Number(vehicle.pricePerDay) ||
          Number(vehicle.price) ||
          Number(vehicle.pricePerHour) * 24 ||
          0,
        pricePerHour: Number(vehicle.pricePerHour) || 0,
        rating: vehicle.actualRating ?? vehicle.averageRating ?? 4.8,
        available: vehicle.status === "ACTIVE" || vehicle.available,
        category: (vehicle.category || "sedan").toLowerCase(),
        transmission:
          (vehicle.transmission || "auto").toLowerCase() === "automatic"
            ? "auto"
            : "manual",
        fuel: (vehicle.fuelType || "gasoline").toLowerCase(),
        seats: vehicle.seats,
      }));

      setCarRecommendations(normalized);
    } catch (error) {
      console.error("Error fetching car recommendations:", error);
      setCarRecommendations([]);
    } finally {
      setLoadingCars(false);
    }
  };
  

  const features = [
    {
      icon: Shield,
      title: "An toàn & Tin cậy",
      description:
        "Tất cả xe được kiểm tra kỹ thuật định kỳ và có bảo hiểm đầy đủ",
    },
    {
      icon: Clock,
      title: "Thuê nhanh 24/7",
      description:
        "Đặt xe mọi lúc mọi nơi với quy trình đơn giản chỉ trong vài phút",
    },
    {
      icon: CreditCard,
      title: "Thanh toán linh hoạt",
      description: "Hỗ trợ nhiều hình thức thanh toán tiện lợi và an toàn",
    },
    {
      icon: Users,
      title: "Hỗ trợ 24/7",
      description: "Đội ngũ tư vấn chuyên nghiệp luôn sẵn sàng hỗ trợ bạn",
    },
  ];

  const testimonials = [
    {
      name: "Nguyễn Văn A",
      rating: 5,
      comment:
        "Dịch vụ tuyệt vời, xe sạch sẽ và giá cả hợp lý. Tôi sẽ sử dụng lại!",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
    },
    {
      name: "Trần Thị B",
      rating: 5,
      comment: "Thuê xe máy rất tiện lợi, giao xe nhanh và chất lượng tốt.",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
    },
    {
      name: "Lê Văn C",
      rating: 4,
      comment:
        "Ứng dụng dễ sử dụng, quy trình thuê xe đơn giản và nhanh chóng.",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
    },
  ];

  const stats = [
    { number: "10K+", label: "Khách hàng tin tưởng" },
    { number: "500+", label: "Xe có sẵn" },
    { number: "50+", label: "Địa điểm phục vụ" },
    { number: "99%", label: "Khách hàng hài lòng" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.8), rgba(29, 78, 216, 0.8)), url('https://images.unsplash.com/photo-1727361824538-bf7614fbc97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZWhpY2xlJTIwcmVudGFsJTIwaGVyb3xlbnwxfHx8fDE3NTk2NjU0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 min-h-[160px] md:min-h-[200px] flex flex-col justify-center">
              <span className="transition-opacity duration-500">
                {heroTexts[currentHeroText].main}
              </span>
              <span className="text-yellow-300 transition-opacity duration-500">
                {heroTexts[currentHeroText].sub}
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Đồng hành cùng bạn trong mọi hành trình với dịch vụ thuê xe, thiết
              bị du lịch chất lượng cao. An toàn, tiện lợi và giá cả phải chăng.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cars">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <Car className="mr-2 h-5 w-5" />
                  Thuê ô tô
                </Button>
              </Link>
              <Link to="/motorcycles">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
                >
                  <Bike className="mr-2 h-5 w-5 text-white" />
                  <span className="text-white">Thuê xe máy</span>
                </Button>
              </Link>
              <Link to="/equipment">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-green-600 bg-transparent"
                >
                  <Package className="mr-2 h-5 w-5 text-white" />
                  <span className="text-white">Thuê thiết bị</span>
                </Button>
              </Link>
              <Link to="/combos">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-yellow-500 bg-transparent"
                >
                  <Package className="mr-2 h-5 w-5 text-white" />
                  <span className="text-white">Combo thiết bị</span>
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
              Chúng tôi cam kết mang đến cho bạn trải nghiệm thuê xe tốt nhất
              với những ưu điểm vượt trội
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center p-6 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
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

      {/* Equipment Recommendations */}
      <VehicleRecommendations
        title="Thiết bị dành cho bạn"
        vehicles={equipmentRecommendations}
        viewAllLink="/equipment"
        type="equipment"
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
            HacMieuJourney là nền tảng hỗ trợ du lịch toàn diện, mang đến dịch
            vụ thuê xe ô tô, xe máy và thiết bị du lịch chất lượng cao. Chúng
            tôi cam kết cung cấp đội xe đa dạng, thiết bị chuyên dụng đầy đủ,
            quy trình thuê đơn giản và dịch vụ khách hàng tận tâm 24/7. Với hơn
            500+ phương tiện và hàng trăm thiết bị có sẵn tại 50+ địa điểm trên
            toàn quốc, chúng tôi tự hào là đối tác đáng tin cậy cho mọi chuyến
            du lịch của bạn.
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
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Thuê ô tô
                </h3>
                <p className="text-gray-600 mb-6">
                  Đa dạng các loại xe từ sedan đến SUV, phù hợp cho mọi nhu cầu
                  từ du lịch gia đình đến công việc kinh doanh. Tất cả xe đều
                  được bảo dưỡng định kỳ và có bảo hiểm.
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
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Thuê xe máy
                </h3>
                <p className="text-gray-600 mb-6">
                  Xe máy đa dạng từ xe tay ga đến xe số, phù hợp cho việc di
                  chuyển nhanh chóng trong thành phố. Tiết kiệm chi phí và thời
                  gian.
                </p>
                <Link to="/motorcycles">
                  <Button className="w-full lg:w-auto">
                    Xem xe máy
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Equipment Rental */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800"
                  alt="Thuê thiết bị"
                  className="w-full lg:w-64 h-48 object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Thuê thiết bị du lịch
                </h3>
                <p className="text-gray-600 mb-6">
                  Đầy đủ thiết bị hỗ trợ cho các chuyến du lịch: lều cắm trại,
                  balo, túi ngủ, bếp gas, đèn pin và nhiều thiết bị khác.
                </p>
                <Link to="/equipment">
                  <Button className="w-full lg:w-auto">
                    Xem thiết bị
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Combo Rental */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1739257599500-85ff0ff1b359?w=800"
                  alt="Combo thiết bị"
                  className="w-full lg:w-64 h-48 object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Combo thiết bị
                </h3>
                <p className="text-gray-600 mb-6">
                  Tiết kiệm đến 20% với các gói combo thiết bị được đóng gói
                  sẵn, phù hợp cho từng nhu cầu: camping, leo núi, picnic, du
                  lịch biển.
                </p>
                <Link to="/combos">
                  <Button className="w-full lg:w-auto">
                    Xem combo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cẩm nang du lịch
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khám phá những bài viết hữu ích về du lịch, tips và tricks từ đội
              ngũ chuyên gia
            </p>
          </div>

          <div className="flex justify-center">
            <Link to="/blog">
              <Button size="lg" className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Xem tất cả bài viết
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
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
                          <Star
                            key={i}
                            className="h-4 w-4 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">
                    "{testimonial.comment}"
                  </p>
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
            Đặt xe ngay hôm nay và trải nghiệm dịch vụ thuê xe tốt nhất tại Việt
            Nam
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cars">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Thuê ô tô ngay
              </Button>
            </Link>
            <Link to="/motorcycles">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                <span className="text-white">Thuê xe máy ngay</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
