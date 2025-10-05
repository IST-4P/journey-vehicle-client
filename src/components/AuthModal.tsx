import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface AuthModalProps {
  mode: 'login' | 'register' | 'forgot-password';
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ mode: initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1); // 1: form, 2: OTP verification
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (mode === 'register') {
      if (!formData.name.trim()) {
        toast.error('Vui lòng nhập họ và tên');
        return false;
      }
      if (!formData.phone.trim()) {
        toast.error('Vui lòng nhập số điện thoại');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp');
        return false;
      }
    }
    
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email');
      return false;
    }
    
    if (!formData.password.trim()) {
      toast.error('Vui lòng nhập mật khẩu');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error('Đăng nhập thất bại: ' + error.message);
        return;
      }

      if (data.user) {
        toast.success('Đăng nhập thành công!');
        onSuccess(data.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-551107ff/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        toast.error('Đăng ký thất bại: ' + result.error);
        return;
      }

      // Simulate OTP verification step
      setStep(2);
      toast.success('Mã OTP đã được gửi đến email của bạn');
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Đã xảy ra lỗi khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (otp.length !== 6) {
      toast.error('Vui lòng nhập đầy đủ mã OTP');
      return;
    }

    setLoading(true);
    try {
      // Simulate OTP verification (in real app, you would verify with backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After successful OTP verification, sign in the user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error('Xác thực thất bại: ' + error.message);
        return;
      }

      if (data.user) {
        toast.success('Đăng ký thành công!');
        onSuccess(data.user);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Đã xảy ra lỗi khi xác thực OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
      
      if (error) {
        toast.error('Gửi email thất bại: ' + error.message);
        return;
      }

      toast.success('Email khôi phục mật khẩu đã được gửi!');
      setMode('login');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Đã xảy ra lỗi khi gửi email khôi phục');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 2) {
      handleOTPVerification();
      return;
    }

    switch (mode) {
      case 'login':
        handleLogin();
        break;
      case 'register':
        handleRegister();
        break;
      case 'forgot-password':
        handleForgotPassword();
        break;
    }
  };

  const getTitle = () => {
    if (step === 2) return 'Xác thực OTP';
    switch (mode) {
      case 'login': return 'Đăng nhập';
      case 'register': return 'Đăng ký';
      case 'forgot-password': return 'Quên mật khẩu';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        <div className="flex items-center justify-between p-6 border-b">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-xl font-semibold flex-1 text-center">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 ? (
            <>
              {mode === 'register' && (
                <div className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nhập họ và tên"
                      className="mt-1"
                    />
                  </div>
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
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Nhập email"
                    className="mt-1"
                  />
                </div>

                {mode !== 'forgot-password' && (
                  <div>
                    <Label htmlFor="password">Mật khẩu</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Nhập mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading ? 'Đang xử lý...' : getTitle()}
              </Button>

              <div className="mt-4 text-center text-sm">
                {mode === 'login' ? (
                  <>
                    <span className="text-gray-600">Chưa có tài khoản? </span>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-blue-600 hover:underline"
                    >
                      Đăng ký ngay
                    </button>
                    <br />
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-blue-600 hover:underline mt-2"
                    >
                      Quên mật khẩu?
                    </button>
                  </>
                ) : mode === 'register' ? (
                  <>
                    <span className="text-gray-600">Đã có tài khoản? </span>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-blue-600 hover:underline"
                    >
                      Đăng nhập
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-blue-600 hover:underline"
                    >
                      Quay lại đăng nhập
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600">
                  Chúng tôi đã gửi mã OTP 6 số đến email:
                </p>
                <p className="font-medium text-gray-900 mt-1">{formData.email}</p>
              </div>

              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={otp} 
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Không nhận được mã? </span>
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => toast.success('Mã OTP mới đã được gửi!')}
                >
                  Gửi lại
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}