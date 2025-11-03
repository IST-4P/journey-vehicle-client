import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Bell, Menu, X, Car, Bike, Package, Package2, BookOpen, ChevronDown, Home, Info, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { NotificationModal } from './NotificationModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Separator } from './ui/separator';

interface HeaderProps {
  user: any;
  onAuth: (mode: string) => void;
  onLogout: () => void;
}

export function Header({ user, onAuth, onLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showVehicleSubmenu, setShowVehicleSubmenu] = useState(false);
  const [showEquipmentSubmenu, setShowEquipmentSubmenu] = useState(false);
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

  const isActiveInGroup = (paths: string[]) => {
    return paths.some(path => location.pathname === path);
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
          <nav className="hidden lg:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`${isActivePage('/') ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} transition-colors`}
            >
              Trang chủ
            </Link>
            
            {/* Thuê phương tiện Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setShowVehicleSubmenu(true)}
              onMouseLeave={() => setShowVehicleSubmenu(false)}
            >
              <div 
                className={`${isActiveInGroup(['/cars', '/motorcycles']) ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} transition-colors flex items-center space-x-1 cursor-pointer`}
              >
                <Car className="h-4 w-4" />
                <span>Thuê phương tiện</span>
                <ChevronDown className="h-3 w-3" />
              </div>
              
              {showVehicleSubmenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <Link 
                    to="/cars" 
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Car className="h-4 w-4" />
                    <span>Thuê ô tô</span>
                  </Link>
                  <Link 
                    to="/motorcycles" 
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Bike className="h-4 w-4" />
                    <span>Thuê xe máy</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Thuê thiết bị Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setShowEquipmentSubmenu(true)}
              onMouseLeave={() => setShowEquipmentSubmenu(false)}
            >
              <div 
                className={`${isActiveInGroup(['/equipment', '/combos']) ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} transition-colors flex items-center space-x-1 cursor-pointer`}
              >
                <Package className="h-4 w-4" />
                <span>Thuê thiết bị</span>
                <ChevronDown className="h-3 w-3" />
              </div>
              
              {showEquipmentSubmenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <Link 
                    to="/equipment" 
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Package className="h-4 w-4" />
                    <span>Thiết bị du lịch</span>
                  </Link>
                  <Link 
                    to="/combos" 
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Package2 className="h-4 w-4" />
                    <span>Combo thiết bị</span>
                  </Link>
                </div>
              )}
            </div>

            <Link 
              to="/blog" 
              className={`${isActivePage('/blog') ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} transition-colors flex items-center space-x-1`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Blog</span>
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
              className="lg:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - Slide Drawer */}
        <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
            <SheetHeader className="p-6 pb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <SheetTitle className="text-xl">HacMieu Journey</SheetTitle>
              </div>
              <SheetDescription>
                Nền tảng hỗ trợ du lịch toàn diện
              </SheetDescription>
            </SheetHeader>
            
            <nav className="flex flex-col px-4 pb-6">
              <Link 
                to="/" 
                className={`${isActivePage('/') ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'} px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Home className="h-5 w-5" />
                <span>Trang chủ</span>
              </Link>
              
              <Separator className="my-2" />
              
              {/* Mobile - Thuê phương tiện */}
              <div className="py-2">
                <button
                  onClick={() => setShowVehicleSubmenu(!showVehicleSubmenu)}
                  className={`${isActiveInGroup(['/cars', '/motorcycles']) ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'} w-full px-4 py-3 rounded-lg flex items-center justify-between transition-colors`}
                >
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5" />
                    <span>Thuê phương tiện</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showVehicleSubmenu ? 'rotate-180' : ''}`} />
                </button>
                {showVehicleSubmenu && (
                  <div className="mt-2 ml-4 space-y-1">
                    <Link 
                      to="/cars" 
                      className={`${isActivePage('/cars') ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-gray-50'} px-4 py-2 rounded-lg flex items-center space-x-3 transition-colors`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Car className="h-4 w-4" />
                      <span>Thuê ô tô</span>
                    </Link>
                    <Link 
                      to="/motorcycles" 
                      className={`${isActivePage('/motorcycles') ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-gray-50'} px-4 py-2 rounded-lg flex items-center space-x-3 transition-colors`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Bike className="h-4 w-4" />
                      <span>Thuê xe máy</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile - Thuê thiết bị */}
              <div className="py-2">
                <button
                  onClick={() => setShowEquipmentSubmenu(!showEquipmentSubmenu)}
                  className={`${isActiveInGroup(['/equipment', '/combos']) ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'} w-full px-4 py-3 rounded-lg flex items-center justify-between transition-colors`}
                >
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5" />
                    <span>Thuê thiết bị</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showEquipmentSubmenu ? 'rotate-180' : ''}`} />
                </button>
                {showEquipmentSubmenu && (
                  <div className="mt-2 ml-4 space-y-1">
                    <Link 
                      to="/equipment" 
                      className={`${isActivePage('/equipment') ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-gray-50'} px-4 py-2 rounded-lg flex items-center space-x-3 transition-colors`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Package className="h-4 w-4" />
                      <span>Thiết bị du lịch</span>
                    </Link>
                    <Link 
                      to="/combos" 
                      className={`${isActivePage('/combos') ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-gray-50'} px-4 py-2 rounded-lg flex items-center space-x-3 transition-colors`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Package2 className="h-4 w-4" />
                      <span>Combo thiết bị</span>
                    </Link>
                  </div>
                )}
              </div>

              <Separator className="my-2" />

              <Link 
                to="/blog" 
                className={`${isActivePage('/blog') ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'} px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors`}
                onClick={() => setShowMobileMenu(false)}
              >
                <BookOpen className="h-5 w-5" />
                <span>Blog</span>
              </Link>
              
              <Link 
                to="/about" 
                className={`${isActivePage('/about') ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'} px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Info className="h-5 w-5" />
                <span>Về chúng tôi</span>
              </Link>
              
              <Link 
                to="/contact" 
                className={`${isActivePage('/contact') ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'} px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Phone className="h-5 w-5" />
                <span>Liên hệ</span>
              </Link>

              {!user && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2 px-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setShowMobileMenu(false);
                        onAuth('login');
                      }}
                    >
                      Đăng nhập
                    </Button>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setShowMobileMenu(false);
                        onAuth('register');
                      }}
                    >
                      Đăng ký
                    </Button>
                  </div>
                </>
              )}

              {user && (
                <>
                  <Separator className="my-4" />
                  <div className="px-2">
                    <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar} />
                        <AvatarFallback>
                          {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.user_metadata?.name || user.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Link 
                        to="/profile/account" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        Hồ sơ cá nhân
                      </Link>
                      <Link 
                        to="/profile/history" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        Lịch sử thuê
                      </Link>
                      <Link 
                        to="/profile/payment" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        Thanh toán/Ví
                      </Link>
                      <Link 
                        to="/profile/complaints" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        Lịch sử khiếu nại
                      </Link>
                      <Separator className="my-2" />
                      <button 
                        onClick={() => {
                          onLogout();
                          setShowMobileMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        
        {/* Notification Modal */}
        <NotificationModal 
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />
      </div>
    </header>
  );
}