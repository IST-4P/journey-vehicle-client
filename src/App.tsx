import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { CarRental } from './components/CarRental';
import { MotorcycleRental } from './components/MotorcycleRental';
import { VehicleDetail } from './components/VehicleDetail';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { BookingProcess } from './components/BookingProcess';
import { AboutUs } from './components/AboutUs';
import { Contact } from './components/Contact';
import { ChatWidget } from './components/ChatWidget';
import { ComplaintDetail } from './components/ComplaintDetail';
import { setupTokenRefresh, clearTokenRefresh, logout } from './utils/auth';
import { toast } from 'sonner';

interface User {
  name?: string;
  fullName?: string;
  email?: string;
  data?: {
    name?: string;
    email?: string;
  };
}


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Kiểm tra session bằng /user/profile
    const checkSession = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ;
        const res = await fetch(`${apiBaseUrl}/user/profile`, { 
          method: 'GET',
          credentials: 'include' 
        });
        
        if (res.ok) {
          const data = await res.json();
          // Nếu lấy được profile, user đã đăng nhập
          setUser(data.user || data.data || data);
          
          // Setup auto refresh token mỗi 5 phút
          refreshIntervalRef.current = setupTokenRefresh(() => {
            // Callback khi token hết hạn
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            setUser(null);
          });
        } else {
          // Nếu không lấy được profile, user chưa đăng nhập
          console.log('No valid session found');
        }
      } catch (error) {
        console.error('Session check error:', error);
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

  const handleAuth = (mode: 'login' | 'register' | 'forgot-password') => {
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
        toast.success('Đăng xuất thành công');
      } else {
        toast.error('Có lỗi khi đăng xuất');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi khi đăng xuất');
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
        <Header 
          user={user} 
          onAuth={handleAuth}
          onLogout={handleLogout}
        />
        
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cars" element={<CarRental />} />
            <Route path="/motorcycles" element={<MotorcycleRental />} />
            
            <Route path="/vehicle/:id" element={<VehicleDetail />} />
            <Route path="/booking/:vehicleId" element={<BookingProcess />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route 
              path="/profile/*" 
              element={
                user ? <UserProfile user={user} /> : <Navigate to="/" replace />
              } 
            />
            <Route 
              path="/complaint/:id" 
              element={
                user ? <ComplaintDetail /> : <Navigate to="/" replace />
              } 
            />
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
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
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