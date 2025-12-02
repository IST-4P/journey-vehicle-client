import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom";
import { toast, Toaster } from "sonner";
import { AboutUs } from "./components/AboutUs";
import { AuthModal } from "./components/AuthModal";
import { Blog } from "./components/Blog";
import { BlogDetail } from "./components/BlogDetail";
import { BookingProcess } from "./components/BookingProcess";
import { CarRental } from "./components/CarRental";
import { ChatWidget } from "./components/ChatWidget";
import { ComboDetail } from "./components/ComboDetail";
import { ComboPayment } from "./components/ComboPayment";
import { ComboRental } from "./components/ComboRental";
import { Complaint } from "./components/Complaint";
import { ComplaintDetail } from "./components/ComplaintDetail";
import { Contact } from "./components/Contact";
import { EquipmentDetail } from "./components/EquipmentDetail";
import { EquipmentPayment } from "./components/EquipmentPayment";
import { EquipmentRental } from "./components/EquipmentRental";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HomePage } from "./components/HomePage";
import { MotorcycleRental } from "./components/MotorcycleRental";
import { UserProfile } from "./components/UserProfile";
import { VehicleDetail } from "./components/VehicleDetail";
import {
  clearTokenRefresh,
  logout,
  refreshAccessToken,
  setupTokenRefresh,
} from "./utils/auth";

interface User {
  avatarUrl?: string;
  phone?: string;
  name?: string;
  fullName?: string;
  email: string;
  data?: {
    name?: string;
    email?: string;
    facebook?: string;
    dateOfBirth?: string;
    verified?: boolean;
    fullName?: string;
  };
  creditScore?: number;
}

function LogoutRoute({ onLogout }: { onLogout: () => Promise<void> | void }) {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await onLogout();
      } finally {
        navigate("/", { replace: true });
      }
    })();
  }, [onLogout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<
    "login" | "register" | "forgot-password"
  >("login");
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Kiểm tra session bằng /user/profile
    const checkSession = async () => {
      const ensureAccessToken = async () => {
        let token = localStorage.getItem("accessToken");
        if (!token) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            token = localStorage.getItem("accessToken");
          }
        }
        return token;
      };

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const fetchProfile = (token?: string | null) =>
          fetch(`${apiBaseUrl}/user/profile`, {
            method: "GET",
            credentials: "include",
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : undefined,
          });

        let tokenToUse = await ensureAccessToken();
        let res = await fetchProfile(tokenToUse);

        // Nếu access token hết hạn, cố gắng refresh và thử lại
        if (res.status === 401) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            tokenToUse = localStorage.getItem("accessToken");
            res = await fetchProfile(tokenToUse);
          }
        }

        if (res.ok) {
          const data = await res.json();
          // Nếu lấy được profile, user đã đăng nhập
          setUser(data.user || data.data || data);

          // Đảm bảo token được dispatch cho ChatWidget và các component khác
          const currentToken = localStorage.getItem("accessToken");
          const cookieAuth = localStorage.getItem("cookieAuth");

          if (currentToken && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("accessTokenChanged", {
                detail: { token: currentToken },
              })
            );
          } else if (cookieAuth === "true" && typeof window !== "undefined") {
            // FIX: Cookie-based auth detected
            window.dispatchEvent(
              new CustomEvent("accessTokenChanged", {
                detail: { token: "COOKIE_AUTH" },
              })
            );
          }

          // Setup auto refresh token mỗi 5 phút
          refreshIntervalRef.current = setupTokenRefresh(() => {
            // Callback khi token hết hạn
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            setUser(null);
          });
        } else {
          // Nếu không lấy được profile, user chưa đăng nhập
        }
      } catch (error) {
        console.error("Session check error:", error);
        // Không cần hiển thị lỗi cho user
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        clearTokenRefresh(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleAuth = (mode: "login" | "register" | "forgot-password") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      // Gọi API đăng xuất backend
      const success = await logout();

      if (success) {
        // Clear refresh interval
        if (refreshIntervalRef.current) {
          clearTokenRefresh(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }

        setUser(null);
        toast.success("Đăng xuất thành công");
      } else {
        toast.error("Có lỗi khi đăng xuất");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Có lỗi khi đăng xuất");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onAuth={handleAuth} onLogout={handleLogout} />

        <main className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cars" element={<CarRental />} />
            <Route path="/motorcycles" element={<MotorcycleRental />} />
            <Route path="/equipment" element={<EquipmentRental />} />
            <Route path="/combos" element={<ComboRental />} />
            <Route path="/blog" element={<Blog />} />

            <Route path="/vehicle/:id" element={<VehicleDetail />} />
            <Route path="/equipment/:id" element={<EquipmentDetail user={user} />} />
            <Route path="/equipment-payment/:rentalId" element={<EquipmentPayment user={user} />} />
            <Route path="/combo/:id" element={<ComboDetail user={user} />} />
            <Route path="/combo-payment/:rentalId" element={<ComboPayment user={user} />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/booking/:vehicleId" element={<BookingProcess />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/complaint"
              element={user ? <Complaint /> : <Navigate to="/" replace />}
            />
            <Route
              path="/profile/*"
              element={
                user ? <UserProfile user={user} /> : <Navigate to="/" replace />
              }
            />
            <Route
              path="/complaint/:id"
              element={user ? <ComplaintDetail /> : <Navigate to="/" replace />}
            />
            <Route path="/logout" element={<LogoutRoute onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        <ChatWidget />

        {showAuthModal && (
          <AuthModal
            mode={authMode}
            onClose={() => setShowAuthModal(false)}
            onSuccess={(userData: unknown) => {
              setUser(userData as User);
              setShowAuthModal(false);

              // Setup auto refresh token khi user đăng nhập thành công
              if (refreshIntervalRef.current) {
                clearTokenRefresh(refreshIntervalRef.current);
              }

              refreshIntervalRef.current = setupTokenRefresh(() => {
                // Callback khi token hết hạn
                toast.error(
                  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                );
                setUser(null);
              });
            }}
          />
        )}

        <Toaster position="top-right" />
      </div>
    </Router>
  );
}
