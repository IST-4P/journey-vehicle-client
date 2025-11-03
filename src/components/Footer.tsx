import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">HacMieu Journey</span>
            </div>
            <p className="text-gray-300 mb-4">
              HacMieu Journey là nền tảng thuê phương tiện hàng đầu Việt Nam, 
              cung cấp dịch vụ thuê xe ô tô và xe máy an toàn, tiện lợi với giá cả hợp lý.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/cars" className="text-gray-300 hover:text-white">
                  Thuê ô tô
                </Link>
              </li>
              <li>
                <Link to="/motorcycles" className="text-gray-300 hover:text-white">
                  Thuê xe máy
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Thông tin liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-gray-300" />
                <span className="text-gray-300">+84 123 456 789</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-300" />
                <span className="text-gray-300">info@hacmieujourney.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2024 HacMieu Journey. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-300 hover:text-white text-sm">
                Điều khoản sử dụng
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-sm">
                Chính sách bảo mật
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-sm">
                Hướng dẫn thuê xe
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}