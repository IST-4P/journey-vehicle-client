import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { errorMessages } from '../config/errorMessages';
import { dispatchTokenChangeEvent } from '../utils/auth';


interface AuthModalProps {
  mode: 'login' | 'register' | 'forgot-password';
  onClose: () => void;
  onSuccess: (user: unknown) => void;
}

export function AuthModal({ mode: initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); 
  const [otpLoading, setOtpLoading] = useState(false); 
  const [otpVerified, setOtpVerified] = useState(false); 
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    code: '' // Đổi từ otp thành code
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      code: ''
    });
    setOtpSent(false);
    setOtpVerified(false);
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot-password') => {
    setMode(newMode);
    resetForm();
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
      if (!formData.code.trim()) {
        toast.error('Vui lòng nhập mã OTP');
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

  // Function gửi OTP
  const handleSendOTP = async () => {
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email trước khi gửi OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/auth/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cho phép gửi và nhận cookies
        body: JSON.stringify({
          email: formData.email,
          type: 'REGISTER'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Send OTP (Register) error response:', response.status, result); // Debug
        const errorMessage = result.error || result.message || `Gửi OTP thất bại (${response.status})`;
        toast.error(errorMessage);
        return;
      }

      setOtpSent(true);
      toast.success('Mã OTP đã được gửi đến email của bạn');
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Đã xảy ra lỗi khi gửi OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Function gửi OTP cho forgot password
  const handleSendForgotPasswordOTP = async () => {
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email trước khi gửi OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/auth/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          type: 'FORGOT_PASSWORD'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Send OTP (Forgot Password) error response:', response.status, result); // Debug
        const errorMessage = result.error || result.message || `Gửi OTP thất bại (${response.status})`;
        toast.error(errorMessage);
        return;
      }

      setOtpSent(true);
      toast.success('Mã OTP đã được gửi đến email của bạn');
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Đã xảy ra lỗi khi gửi OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cho phép gửi và nhận cookies
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const message = errorMessages[result.message];
        toast.error(message);
        return;
      }
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let cookieSessionProfile: unknown = null;
      let resolvedUserPayload: unknown = result.user || result.data || result;

      if (result.accessToken) {
        accessToken = result.accessToken;
      } else if (result.data?.accessToken) {
        accessToken = result.data.accessToken;
      } else if (result.data?.access_token) {
        accessToken = result.data.access_token;
      }

      if (result.refreshToken) {
        refreshToken = result.refreshToken;
      } else if (result.data?.refreshToken) {
        refreshToken = result.data.refreshToken;
      } else if (result.data?.refresh_token) {
        refreshToken = result.data.refresh_token;
      }

      // FIX: Nếu API không trả token trong body (cookie-based auth), verify session và lấy user data
      if (!accessToken) {
        console.log('[AuthModal] No token in response body, waiting for cookie to be set...');

        // Wait a bit to ensure cookies are properly set by the browser
        await new Promise(resolve => setTimeout(resolve, 200));

        // Try to get user profile directly (this verifies the session cookie is valid)
        try {
          console.log('[AuthModal] Fetching user profile to verify session...');
          const profileResponse = await fetch(`${apiBaseUrl}/user/profile`, {
            method: 'GET',
            credentials: 'include',
          });

          if (profileResponse.ok) {
            const profileResult = await profileResponse.json();
            cookieSessionProfile =
              profileResult?.user ?? profileResult?.data ?? profileResult ?? null;
            console.log('[AuthModal] Cookie session verified, user:', cookieSessionProfile);

            // Session is valid, we can use cookie-based auth
            resolvedUserPayload = cookieSessionProfile;
          } else {
            console.error('[AuthModal] Profile fetch failed with status:', profileResponse.status);
            const errorText = await profileResponse.text();
            console.error('[AuthModal] Profile error body:', errorText);

            // If profile fails, try refresh-token as backup
            console.log('[AuthModal] Trying refresh-token endpoint as backup...');
            try {
              const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh-token`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (refreshResponse.ok) {
                const refreshResult = await refreshResponse.json();
                console.log('[AuthModal] Refresh-token response:', refreshResult);

                const tokens = refreshResult?.data ?? refreshResult;
                accessToken = tokens?.accessToken ?? tokens?.access_token ?? tokens?.token ?? null;
                refreshToken = tokens?.refreshToken ?? tokens?.refresh_token ?? null;

                console.log('[AuthModal] Extracted tokens - accessToken:', accessToken ? 'exists' : 'null', 'refreshToken:', refreshToken ? 'exists' : 'null');
              } else {
                console.error('[AuthModal] Refresh-token also failed with status:', refreshResponse.status);
              }
            } catch (refreshError) {
              console.error('[AuthModal] Failed to get token from refresh endpoint:', refreshError);
            }
          }
        } catch (profileError) {
          console.error('[AuthModal] Error fetching profile:', profileError);
        }
      }

      // Lưu token vào localStorage nếu có
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        console.log('[AuthModal] Access token saved to localStorage');
        // FIX: Dùng helper function để dispatch cả 2 events
        dispatchTokenChangeEvent(accessToken);
      } else if (cookieSessionProfile) {
        // FIX: Nếu API dùng pure cookie-based auth, dispatch event với flag đặc biệt
        console.log('[AuthModal] Cookie-based auth verified, dispatching cookieAuth event');
        localStorage.setItem('cookieAuth', 'true');

        // Dispatch cookieAuth storage event riêng
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'cookieAuth',
            newValue: 'true',
            oldValue: null,
          }),
        );

        // Dispatch CustomEvent để ChatWidget biết user đã authenticated
        dispatchTokenChangeEvent('COOKIE_AUTH'); // Special marker

        resolvedUserPayload = cookieSessionProfile;
      } else {
        toast.error('Không thể xác thực phiên đăng nhập. Vui lòng thử lại.');
        return;
      }

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('[AuthModal] Refresh token saved to localStorage');
      }

      toast.success('Đăng nhập thành công!');
      onSuccess(resolvedUserPayload); // Fallback nếu không có result.user
      onClose(); // Đóng modal sau khi login thành công
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    // Kiểm tra xem đã có code OTP chưa
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã OTP');
      return;
    }
    
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cho phép gửi và nhận cookies
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          code: formData.code,
          confirmPassword: formData.confirmPassword
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Register error response:', response.status, result); // Debug
        const errorMessage = result.error || result.message || `Đăng ký thất bại (${response.status})`;
        toast.error(errorMessage);
        return;
      }

      console.log('Register successful, user data:', result); // Debug
      toast.success('Đăng ký thành công!');
      onSuccess(result.user || result); // Fallback nếu không có result.user
      onClose(); // Đóng modal sau khi đăng ký thành công
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Đã xảy ra lỗi khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    if (!otpSent) {
      // Bước 1: Gửi OTP
      handleSendForgotPasswordOTP();
      return;
    }

    // Bước 2: Xác thực OTP và đặt lại mật khẩu
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã OTP');
      return;
    }

    if (!formData.newPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
          newPassword: formData.newPassword,
          confirmNewPassword: formData.confirmNewPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Reset password error response:', response.status, result); // Debug
        const errorMessage = result.error || result.message || `Đặt lại mật khẩu thất bại (${response.status})`;
        toast.error(errorMessage);
        return;
      }

      toast.success('Đặt lại mật khẩu thành công!');
      switchMode('login');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Đã xảy ra lỗi khi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

  const getModalTitle = () => {
    switch (mode) {
      case 'login': return 'Đăng nhập';
      case 'register': return 'Đăng ký';
      case 'forgot-password': return 'Quên mật khẩu';
      default: return '';
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Đăng nhập';
      case 'register': return 'Đăng ký';
      case 'forgot-password': 
        if (!otpSent) return 'Gửi OTP';
        return 'Đặt lại mật khẩu';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* White background */}
      <div className="absolute inset-0 bg-white"></div>

      {/* Modal content */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex-1 text-center">{getModalTitle()}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
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
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Nhập email"
                      className="flex-1"
                    />
                    {(mode === 'register' || (mode === 'forgot-password' && !otpSent)) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={mode === 'register' ? handleSendOTP : handleSendForgotPasswordOTP}
                        disabled={otpLoading || !formData.email.trim()}
                        className="whitespace-nowrap"
                      >
                        {otpLoading ? 'Đang gửi...' : otpSent ? 'Gửi lại OTP' : 'Gửi OTP'}
                      </Button>
                    )}
                  </div>
                </div>

                {(mode === 'register' || (mode === 'forgot-password' && otpSent)) && (
                  <div>
                    <Label htmlFor="code">Mã OTP</Label>
                    <Input
                      id="code"
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder="Nhập mã OTP từ email"
                      className="mt-1"
                      maxLength={6}
                    />
                  </div>
                )}

                {(mode === 'forgot-password' && otpSent) && (
                  <>
                    <div>
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <div className="relative mt-1">
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          placeholder="Nhập mật khẩu mới"
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
                    <div>
                      <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmNewPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.confirmNewPassword}
                          onChange={(e) => handleInputChange('confirmNewPassword', e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                        />
                      </div>
                    </div>
                  </>
                )}

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
                      onClick={() => switchMode('register')}
                      className="text-blue-600 hover:underline"
                    >
                      Đăng ký ngay
                    </button>
                    <br />
                    <button
                      type="button"
                      onClick={() => switchMode('forgot-password')}
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
                      onClick={() => switchMode('login')}
                      className="text-blue-600 hover:underline"
                    >
                      Đăng nhập
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-blue-600 hover:underline"
                    >
                      Quay lại đăng nhập
                    </button>
                  </>
                )}
              </div>
            </>
        </form>
      </div>
    </div>
  );
}
