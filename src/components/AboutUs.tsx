import React from 'react';
import { Shield, Users, Clock, Award, MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function AboutUs() {
  const values = [
    {
      icon: Shield,
      title: 'An toàn & Tin cậy',
      description: 'Cam kết cung cấp dịch vụ thuê xe an toàn với đội ngũ kiểm tra kỹ thuật chuyên nghiệp và bảo hiểm toàn diện.'
    },
    {
      icon: Users,
      title: 'Khách hàng là trung tâm',
      description: 'Luôn đặt khách hàng lên hàng đầu, lắng nghe và đáp ứng mọi nhu cầu một cách tận tâm nhất.'
    },
    {
      icon: Clock,
      title: 'Phục vụ 24/7',
      description: 'Đội ngũ hỗ trợ khách hàng luôn sẵn sàng phục vụ bạn 24 giờ mỗi ngày, 7 ngày trong tuần.'
    },
    {
      icon: Award,
      title: 'Chất lượng hàng đầu',
      description: 'Không ngừng nâng cao chất lượng dịch vụ để trở thành nền tảng thuê xe hàng đầu Việt Nam.'
    }
  ];

  const milestones = [
    { year: '2020', title: 'Thành lập công ty', description: 'HacMieu Journey được thành lập với tầm nhìn trở thành nền tảng thuê xe hàng đầu' },
    { year: '2021', title: 'Mở rộng dịch vụ', description: 'Bổ sung dịch vụ thuê xe máy và mở rộng ra 5 thành phố lớn' },
    { year: '2022', title: 'Đạt 10,000 khách hàng', description: 'Cột mốc quan trọng với hơn 10,000 khách hàng tin tưởng sử dụng dịch vụ' },
    { year: '2023', title: 'Nâng cấp công nghệ', description: 'Ra mắt ứng dụng di động và hệ thống AI hỗ trợ khách hàng' },
    { year: '2024', title: 'Mở rộng toàn quốc', description: 'Hiện diện tại 50+ thành phố với đội xe hơn 500 chiếc' }
  ];

  const team = [
    {
      name: 'Nguyễn Văn A',
      position: 'CEO & Founder',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      description: '10 năm kinh nghiệm trong lĩnh vực công nghệ và giao thông vận tải'
    },
    {
      name: 'Trần Thị B',
      position: 'CTO',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face',
      description: 'Chuyên gia công nghệ với hơn 8 năm kinh nghiệm phát triển ứng dụng'
    },
    {
      name: 'Lê Văn C',
      position: 'Giám đốc Vận hành',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      description: 'Chuyên gia vận hành với kinh nghiệm quản lý đội xe lớn'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Về HacMieu Journey</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Hành trình kết nối mọi điểm đến với dịch vụ thuê xe tin cậy và tiện lợi nhất Việt Nam
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Câu chuyện của chúng tôi</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  HacMieu Journey ra đời từ mong muốn giải quyết những khó khăn mà người dùng gặp phải 
                  khi thuê xe truyền thống. Chúng tôi hiểu rằng việc di chuyển an toàn, tiện lợi và 
                  giá cả hợp lý là nhu cầu thiết yếu của mọi người.
                </p>
                <p>
                  Với sứ mệnh "Kết nối mọi hành trình", chúng tôi không ngừng đầu tư vào công nghệ 
                  và nâng cao chất lượng dịch vụ để mang đến trải nghiệm thuê xe tốt nhất cho khách hàng.
                </p>
                <p>
                  Từ một startup nhỏ, HacMieu Journey đã phát triển thành nền tảng thuê xe hàng đầu 
                  với hơn 500 xe và phục vụ hơn 50 thành phố trên toàn quốc.
                </p>
              </div>
            </div>
            <div>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop"
                alt="Về chúng tôi"
                className="w-full h-80 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Sứ mệnh</h3>
                <p className="text-gray-600">
                  Cung cấp dịch vụ thuê xe an toàn, tiện lợi và giá cả hợp lý, giúp mọi người 
                  dễ dàng di chuyển và khám phá thế giới xung quanh. Chúng tôi cam kết mang đến 
                  trải nghiệm thuê xe tuyệt vời nhất cho khách hàng.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tầm nhìn</h3>
                <p className="text-gray-600">
                  Trở thành nền tảng thuê xe hàng đầu Đông Nam Á, tiên phong trong việc ứng dụng 
                  công nghệ để tối ưu hóa trải nghiệm khách hàng và góp phần xây dựng hệ thống 
                  giao thông bền vững.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Giá trị cốt lõi</h2>
            <p className="text-xl text-gray-600">
              Những giá trị định hướng mọi hoạt động của chúng tôi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hành trình phát triển</h2>
            <p className="text-xl text-gray-600">
              Những cột mốc quan trọng trong quá trình phát triển của HacMieu Journey
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-blue-200"></div>
            
            {milestones.map((milestone, index) => (
              <div key={index} className={`relative flex items-center mb-8 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                  <Card className="p-6">
                    <CardContent className="p-0">
                      <div className="text-2xl font-bold text-blue-600 mb-2">{milestone.year}</div>
                      <h3 className="font-semibold text-lg mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Đội ngũ lãnh đạo</h2>
            <p className="text-xl text-gray-600">
              Những con người tâm huyết đứng sau thành công của HacMieu Journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <ImageWithFallback
                    src={member.avatar}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4"
                  />
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <div className="text-blue-600 font-medium mb-3">{member.position}</div>
                  <p className="text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Những con số ấn tượng</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Khách hàng tin tưởng</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Xe có sẵn</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Thành phố phục vụ</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99%</div>
              <div className="text-blue-100">Khách hàng hài lòng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Liên hệ với chúng tôi</h2>
            <p className="text-xl text-gray-600">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Địa chỉ</h3>
                <p className="text-gray-600">123 Đường Nguyễn Văn Linh<br />Quận 7, TP.HCM</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="p-0">
                <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Điện thoại</h3>
                <p className="text-gray-600">+84 123 456 789<br />Hỗ trợ 24/7</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="p-0">
                <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Email</h3>
                <p className="text-gray-600">info@hacmieujourney.com<br />support@hacmieujourney.com</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}