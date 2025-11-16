import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi trong 24h.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Địa chỉ văn phòng',
      details: [
        '123 Đường Nguyễn Văn Linh',
        'Quận 7, TP.HCM, Việt Nam'
      ]
    },
    {
      icon: Phone,
      title: 'Điện thoại',
      details: [
        'Hotline: +84 123 456 789',
        'Hỗ trợ kỹ thuật: +84 987 654 321'
      ]
    },
    {
      icon: Mail,
      title: 'Email',
      details: [
        'Thông tin chung: info@hacmieujourney.com',
        'Hỗ trợ khách hàng: support@hacmieujourney.com'
      ]
    },
    {
      icon: Clock,
      title: 'Giờ làm việc',
      details: [
        'Thứ 2 - Thứ 6: 8:00 - 18:00',
        'Thứ 7 - Chủ nhật: 9:00 - 17:00'
      ]
    }
  ];

  const subjects = [
    'Hỗ trợ kỹ thuật',
    'Khiếu nại dịch vụ',
    'Đề xuất cải tiến',
    'Hợp tác kinh doanh',
    'Thông tin chung',
    'Khác'
  ];

  const faqs = [
    {
      question: 'Làm thế nào để đặt xe trên HacMieu Journey?',
      answer: 'Bạn có thể đặt xe thông qua website hoặc ứng dụng di động. Chỉ cần chọn loại xe, thời gian thuê và hoàn tất thanh toán.'
    },
    {
      question: 'Tôi có cần giấy phép lái xe để thuê xe không?',
      answer: 'Có, bạn cần có giấy phép lái xe hợp lệ tương ứng với loại xe muốn thuê (A1/A2 cho xe máy, B2 cho ô tô).'
    },
    {
      question: 'Chính sách hủy đặt xe như thế nào?',
      answer: 'Bạn có thể hủy đặt xe miễn phí trước 24h. Sau thời gian này, phí hủy sẽ được áp dụng theo quy định.'
    },
    {
      question: 'Xe có được bảo hiểm không?',
      answer: 'Tất cả xe đều được bảo hiểm bắt buộc. Bạn có thể mua thêm bảo hiểm mở rộng để được bảo vệ tốt hơn.'
    },
    {
      question: 'Tôi có thể lái xe ra ngoài thành phố không?',
      answer: 'Có, bạn có thể lái xe đi bất kỳ đâu trong phạm vi lãnh thổ Việt Nam. Một số xe có thể có giới hạn km/ngày.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Liên hệ với chúng tôi</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy để lại thông tin để được tư vấn tốt nhất!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <info.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{info.title}</h3>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Gửi tin nhắn cho chúng tôi</CardTitle>
                  <p className="text-gray-600">
                    Điền thông tin vào form bên dưới và chúng tôi sẽ phản hồi trong vòng 24 giờ
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Nhập họ và tên"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Nhập email"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Nhập số điện thoại"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Chủ đề</Label>
                        <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Chọn chủ đề" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Tin nhắn *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Nhập tin nhắn của bạn..."
                        rows={6}
                        className="mt-1"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Đang gửi...' : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gửi tin nhắn
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Vị trí văn phòng</CardTitle>
                  <p className="text-gray-600">
                    Đến thăm văn phòng của chúng tôi tại trung tâm TP.HCM
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="aspect-w-16 aspect-h-12">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.9544777043194!2d106.69017621462268!3d10.732650692331068!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f1c06f4e1dd%3A0x43900f1d4539a3d!2zTmd1eeG7hW4gVsSDbiBMaW5oLCBRdeG6rW4gNywgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1629789435123!5m2!1svi!2s"
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-lg"
                    ></iframe>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Địa chỉ chính</p>
                        <p className="text-gray-600">123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Giờ mở cửa</p>
                        <p className="text-gray-600">Thứ 2 - Chủ nhật: 8:00 - 22:00</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h2>
            <p className="text-xl text-gray-600">
              Tìm hiểu thêm về dịch vụ của chúng tôi qua những câu hỏi phổ biến
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
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
            Cần hỗ trợ ngay lập tức?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Đội ngũ chăm sóc khách hàng 24/7 của chúng tôi luôn sẵn sàng hỗ trợ bạn
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Phone className="mr-2 h-5 w-5" />
              Gọi ngay: +84 123 456 789
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              <Mail className="mr-2 h-5 w-5" />
              Email: support@hacmieujourney.com
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}