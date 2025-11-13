import {
  Bell,
  Bike,
  BookOpen,
  Car,
  ChevronDown,
  Menu,
  Package,
  Package2,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NotificationModal } from "./NotificationModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { connectNotificationSocket } from "../utils/ws-client";

interface User {
  name?: string;
  fullName?: string;
  email?: string;
  data?: {
    name?: string;
    email?: string;
  };
}

interface HeaderProps {
  user: User | null;
  onAuth: (mode: "login" | "register" | "forgot-password") => void;
  onLogout: () => void;
}

export function Header({ user, onAuth, onLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showVehicleSubmenu, setShowVehicleSubmenu] = useState(false);
  const [showEquipmentSubmenu, setShowEquipmentSubmenu] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  const isActiveInGroup = (paths: string[]) => {
    return paths.some((path) => location.pathname === path);
  };

  // Initial fetch + subscribe via WebSocket
  useEffect(() => {
    let wsCleanup: (() => void) | undefined;

    const fetchUnreadCount = async () => {
      if (!user) {
        setUnreadNotificationCount(0);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/notification/list?page=1&limit=100`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const responseData = await response.json();
          const notifications = responseData.data?.notifications || [];
          const unreadCount = notifications.filter((n: { read: boolean }) => !n.read).length;
          setUnreadNotificationCount(unreadCount);
        }
      } catch (error) {
        console.error('Lỗi khi tải số thông báo:', error);
      }
    };

    fetchUnreadCount();

    // Subscribe websocket for live updates
    if (user) {
      const ws = connectNotificationSocket();
      const offNew = ws.on('newNotification', () => {
        setUnreadNotificationCount((c) => c + 1);
      });
      // Some backends emit generic messages; try to parse count
      const offAny = ws.on('message', (data) => {
        try {
          if (data?.type === 'newNotification') setUnreadNotificationCount((c) => c + 1);
        } catch {}
      });
      wsCleanup = () => { offNew(); offAny(); ws.close(); };
    }

    return () => { wsCleanup?.(); };
  }, [user]);

  // Function to refresh unread count (can be called from NotificationModal)
  const refreshUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/notification/list?page=1&limit=100`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        const notifications = responseData.data?.notifications || [];
        const unreadCount = notifications.filter((n: { read: boolean }) => !n.read).length;
        setUnreadNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error('Lỗi khi refresh số thông báo:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              HacMieu Journey
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link
              to="/"
              className={`${
                isActivePage("/")
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              } transition-colors`}
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
                className={`${
                  isActiveInGroup(["/cars", "/motorcycles"])
                    ? "text-blue-600 font-medium"
                    : "text-gray-700 hover:text-blue-600"
                } transition-colors flex items-center space-x-1 cursor-pointer`}
              >
                <Car className="h-4 w-4" />
                <span>Thuê phương tiện</span>
                <ChevronDown className="h-3 w-3" />
              </div>

              {showVehicleSubmenu && (
                <>
                  {/* Invisible bridge to prevent dropdown from disappearing */}
                  <div className="absolute top-full left-0 w-48 h-2 bg-transparent z-40"></div>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
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
                </>
              )}
            </div>

            {/* Thuê thiết bị Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setShowEquipmentSubmenu(true)}
              onMouseLeave={() => setShowEquipmentSubmenu(false)}
            >
              <div
                className={`${
                  isActiveInGroup(["/equipment", "/combos"])
                    ? "text-blue-600 font-medium"
                    : "text-gray-700 hover:text-blue-600"
                } transition-colors flex items-center space-x-1 cursor-pointer`}
              >
                <Package className="h-4 w-4" />
                <span>Thuê thiết bị</span>
                <ChevronDown className="h-3 w-3" />
              </div>

              {showEquipmentSubmenu && (
                <>
                  {/* Invisible bridge to prevent dropdown from disappearing */}
                  <div className="absolute top-full left-0 w-48 h-2 bg-transparent z-40"></div>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
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
                </>
              )}
            </div>

            <Link
              to="/blog"
              className={`${
                isActivePage("/blog")
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              } transition-colors flex items-center space-x-1`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Blog</span>
            </Link>
            <Link
              to="/about"
              className={`${
                isActivePage("/about")
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              } transition-colors`}
            >
              Về chúng tôi
            </Link>
            <Link
              to="/contact"
              className={`${
                isActivePage("/contact")
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              } transition-colors`}
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
                  title={`${unreadNotificationCount} thông báo chưa đọc`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
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
                    {/* Hiển thị tên thay vì avatar */}
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium">{user.fullName}</span>
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
                <Button variant="ghost" onClick={() => onAuth("login")}>
                  Đăng nhập
                </Button>
                <Button onClick={() => onAuth("register")}>Đăng ký</Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t bg-white py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`${
                  isActivePage("/")
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                } px-4 py-2`}
                onClick={() => setShowMobileMenu(false)}
              >
                Trang chủ
              </Link>
              <Link
                to="/cars"
                className={`${
                  isActivePage("/cars")
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                } px-4 py-2 flex items-center space-x-2`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Car className="h-4 w-4" />
                <span>Thuê ô tô</span>
              </Link>
              <Link
                to="/motorcycles"
                className={`${
                  isActivePage("/motorcycles")
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                } px-4 py-2 flex items-center space-x-2`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Bike className="h-4 w-4" />
                <span>Thuê xe máy</span>
              </Link>
              <Link
                to="/about"
                className={`${
                  isActivePage("/about")
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                } px-4 py-2`}
                onClick={() => setShowMobileMenu(false)}
              >
                Về chúng tôi
              </Link>
              <Link
                to="/contact"
                className={`${
                  isActivePage("/contact")
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                } px-4 py-2`}
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
          onClose={() => {
            setShowNotificationModal(false);
            refreshUnreadCount(); // Refresh count when closing modal
          }}
          onNotificationChange={refreshUnreadCount}
        />
      </div>
    </header>
  );
}
