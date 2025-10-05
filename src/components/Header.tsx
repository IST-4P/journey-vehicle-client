import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Bell, Menu, X, Car, Bike } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { NotificationModal } from './NotificationModal';

interface HeaderProps {
  user: any;
  onAuth: (mode: string) => void;
  onLogout: () => void;
}

export function Header({ user, onAuth, onLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  // Fake notification count - in real app this would come from props or context
  const unreadNotificationCount = 4;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">HacMieu Journey</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`${isActivePage('/') ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} transition-colors`}
            >
              Trang chủ
            </Link>
            <Link 
              to="/cars" 
              className={`${isActivePage('/cars') ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} transition-colors flex items-center space-x-1`}
            >
              <Car className="h-4 w-4" />
              <span>Thuê ô tô</span>
            </Link>
            <Link 
              to="/motorcycles" 
              className={`${isActivePage('/motorcycles') ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} transition-colors flex items-center space-x-1`}
            >
              <Bike className="h-4 w-4" />
              <span>Thuê xe máy</span>
            </Link>
            <Link 
              to="/about" 
              className={`${isActivePage('/about') ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} transition-colors`}
            >
              Về chúng tôi
            </Link>
            <Link 
              to="/contact" 
              className={`${isActivePage('/contact') ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} transition-colors`}
            >
              Liên hệ
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotificationModal(true)}
                  className="relative p-2"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {unreadNotificationCount}
                    </Badge>
                  )}
                </Button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar} />
                      <AvatarFallback>
                        {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">
                      {user.user_metadata?.name || user.email}
                    </span>
                  </Button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                      <Link 
                        to="/profile/account" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Hồ sơ cá nhân
                      </Link>
                      <Link 
                        to="/profile/history" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Lịch sử thuê
                      </Link>
                      <Link 
                        to="/profile/payment" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Thanh toán/Ví
                      </Link>
                      <Link 
                        to="/profile/complaints" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Lịch sử khiếu nại
                      </Link>
                      <div className="border-t my-1"></div>
                      <button 
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => onAuth('login')}>
                  Đăng nhập
                </Button>
                <Button onClick={() => onAuth('register')}>
                  Đăng ký
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t bg-white py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className={`${isActivePage('/') ? 'text-blue-600 font-medium' : 'text-gray-700'} px-4 py-2`}
                onClick={() => setShowMobileMenu(false)}
              >
                Trang chủ
              </Link>
              <Link 
                to="/cars" 
                className={`${isActivePage('/cars') ? 'text-blue-600 font-medium' : 'text-gray-700'} px-4 py-2 flex items-center space-x-2`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Car className="h-4 w-4" />
                <span>Thuê ô tô</span>
              </Link>
              <Link 
                to="/motorcycles" 
                className={`${isActivePage('/motorcycles') ? 'text-blue-600 font-medium' : 'text-gray-700'} px-4 py-2 flex items-center space-x-2`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Bike className="h-4 w-4" />
                <span>Thuê xe máy</span>
              </Link>
              <Link 
                to="/about" 
                className={`${isActivePage('/about') ? 'text-blue-600 font-medium' : 'text-gray-700'} px-4 py-2`}
                onClick={() => setShowMobileMenu(false)}
              >
                Về chúng tôi
              </Link>
              <Link 
                to="/contact" 
                className={`${isActivePage('/contact') ? 'text-blue-600 font-medium' : 'text-gray-700'} px-4 py-2`}
                onClick={() => setShowMobileMenu(false)}
              >
                Liên hệ
              </Link>
            </nav>
          </div>
        )}
        
        {/* Notification Modal */}
        <NotificationModal 
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />
      </div>
    </header>
  );
}