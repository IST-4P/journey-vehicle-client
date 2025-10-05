import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Toaster } from 'sonner@2.0.3';
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
import { projectId, publicAnonKey } from './utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = (mode: string) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
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
            <Route path="/vehicle/:type/:id" element={<VehicleDetail />} />
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
            onSuccess={(user) => {
              setUser(user);
              setShowAuthModal(false);
            }}
          />
        )}
        
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}