import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  User, History, MapPin, CreditCard, MessageSquare, 
  Lock, LogOut, Camera, Star, Eye, Upload, Plus,
  Check, MessageCircle, Activity, Wifi, Copy, QrCode,
  Loader2, AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { toast } from 'sonner';
import { uploadAvatarImage, uploadLicenseImages } from '../utils/media-upload';
import { connectPaymentSocket } from '../utils/ws-client';
import { formatVNTime } from '../utils/timezone';

// License class enum
export const LicenseClassEnum = {
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
} as const;

export type LicenseClass = keyof typeof LicenseClassEnum;

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  const location = useLocation();
  const [currentUser] = useState(user);
  const [driverLicense, setDriverLicense] = useState<Driver | null>(null);

  // Fetch driver_licenses for current user
  const fetchDriverLicense = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/driver-license`, { 
        credentials: 'include' 
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Driver license not found');
          setDriverLicense(null);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const json = await response.json();
      // backend might return { data: {...} } or raw object
      const payload = json.data || json;
      setDriverLicense(payload);
    } catch (error) {
      console.error('Error fetching driver license:', error);
      setDriverLicense(null);
    }
  };

  useEffect(() => {
    // load driver license when component mounts and when currentUser changes
    fetchDriverLicense();
  }, [currentUser?.email]);

  const sidebarItems = [
    { id: 'account', label: 'Tài khoản của tôi', icon: User, path: '/profile/account' },
    { id: 'history', label: 'Lịch sử thuê', icon: History, path: '/profile/history' },
    { id: 'payment', label: 'Ví', icon: CreditCard, path: '/profile/payment' },
    { id: 'complaints', label: 'Lịch sử khiếu nại', icon: MessageSquare, path: '/profile/complaints' },
    { id: 'password', label: 'Đổi mật khẩu', icon: Lock, path: '/profile/password' },
    { id: 'logout', label: 'Đăng xuất', icon: LogOut, path: '/logout' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center mb-6">
                <Avatar className="h-20 w-20 mx-auto mb-3">
                  <AvatarImage src={currentUser.avatarUrl } />
                  <AvatarFallback>
                    {currentUser.data?.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">
                  {currentUser.fullName}
                </h3>
                <p className="text-sm text-gray-600">{currentUser.email}</p>
              </div>
              
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-3 sm:py-2 rounded-lg text-sm transition-colors min-h-[44px] ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Routes>
            <Route path="/account" element={<AccountTab user={currentUser} driver={driverLicense} />} />
            <Route path="/history" element={<HistoryTab />} />
            <Route path="/payment" element={<PaymentTab />} />
            <Route path="/complaints" element={<ComplaintsTab />} />
            <Route path="/password" element={<PasswordTab />} />
            <Route path="/" element={<AccountTab user={currentUser} driver={driverLicense} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

interface User {
  avatarUrl?: string;
  phone?: string;
  email: string;
  fullName?: string;
  data?: {
    facebook?: string;
    dateOfBirth?: string;
    verified?: boolean;
    fullName?: string;
  };
  creditScore?: number;
}

const formatDate = (dateString: string) : string =>{
  return dateString.split('T')[0];
};

// Driver license type (adjust fields to match your DB)
interface Driver {
  id?: string;
  userId?: string;
  licenseNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  selfieImageUrl?: string;
  isVerified?: boolean;
  expiryDate?: string;
  licenseClass?: string;
  issueDate?: string;
  issuePlace?: string;
}

function AccountTab({ user, driver }: { user: User; driver?: Driver | null }) {
  const [profileData, setProfileData] = useState({
    avatar: user.avatarUrl,
    phone: user.phone,
    email: user.email,
    facebook: user.data?.facebook || '',
    drivingLicense: driver?.licenseNumber || '',
    licenseNumber: driver?.licenseNumber || '',
    fullName: user.fullName || driver?.fullName || '',
    dateOfBirth: user.data?.dateOfBirth || driver?.dateOfBirth || '',
    licenseClass: driver?.licenseClass || '',
    issueDate: driver?.issueDate || '',
    expiryDate: driver?.expiryDate || '',
    issuePlace: driver?.issuePlace || '',
    verified: user.data?.verified || driver?.isVerified || false,
    creditScore: user.creditScore || 0
  });
  
  const [showLicenseUpload, setShowLicenseUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [licenseImages, setLicenseImages] = useState<{
    front?: File;
    back?: File;
    selfie?: File;
  }>({});

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      
      // Upload using internal presigned URL API
      const imageUrl = await uploadAvatarImage(file);
      
      // Save URL to database via internal API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          avatarUrl: imageUrl
        })
      });

      if (response.ok) {
        setProfileData(prev => ({
          ...prev,
          avatar: imageUrl
        }));
        toast.success('Cập nhật ảnh đại diện thành công! (Debug mode - không reload)');
        // Trigger parent component refresh
        // window.location.reload(); // Commented out for debugging
        console.log('✅ Avatar upload completed successfully. Image URL:', imageUrl);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lưu URL ảnh vào database thất bại');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Có lỗi xảy ra khi tải ảnh lên');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle license image file selection
  const handleLicenseImageSelect = (type: 'front' | 'back' | 'selfie') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLicenseImages(prev => ({
      ...prev,
      [type]: file
    }));

    toast.success(`Đã chọn ảnh ${type === 'front' ? 'mặt trước' : type === 'back' ? 'mặt sau' : 'selfie'}`);
  };

  // Submit license verification
  const handleSubmitLicense = async () => {
    if (!profileData.licenseNumber.trim()) {
      toast.error('Vui lòng nhập số giấy phép lái xe');
      return;
    }

    if (!profileData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    if (!profileData.dateOfBirth) {
      toast.error('Vui lòng chọn ngày sinh');
      return;
    }

    if (!licenseImages.front || !licenseImages.back) {
      toast.error('Vui lòng tải lên ảnh mặt trước và mặt sau của GPLX');
      return;
    }

    // Xác định method dựa trên việc có GPLX hiện tại không
    const isUpdate = driver && driver.id;

    setIsLoading(true);
    try {
      // Upload images using internal presigned URL API
      const filesToUpload: File[] = [];
      if (licenseImages.front) filesToUpload.push(licenseImages.front);
      if (licenseImages.back) filesToUpload.push(licenseImages.back);
      if (licenseImages.selfie) filesToUpload.push(licenseImages.selfie);
      
      const imageUrls = await uploadLicenseImages(filesToUpload);
      
      // Map URLs to corresponding fields
      const urlMapping = {
        front: imageUrls[0],
        back: imageUrls[1],
        selfie: imageUrls[2] || null
      };
      
      // Prepare payload
      const payload = {
        licenseNumber: profileData.licenseNumber,
        fullName: profileData.fullName,
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString() : null,
        licenseClass: profileData.licenseClass || null,
        issueDate: profileData.issueDate ? new Date(profileData.issueDate).toISOString() : null,
        expiryDate: profileData.expiryDate ? new Date(profileData.expiryDate).toISOString() : null,
        issuePlace: profileData.issuePlace || null,
        frontImageUrl: urlMapping.front,
        backImageUrl: urlMapping.back,
        selfieImageUrl: urlMapping.selfie
      };

      console.log('Sending license payload:', payload);
      
      // Submit license data to backend
      const method = isUpdate ? 'PUT' : 'POST';
      
      // Submit license data to backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/driver-license`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        const successMessage = isUpdate 
          ? 'Đã cập nhật GPLX thành công!' 
          : 'Đã gửi yêu cầu xác thực GPLX thành công!';
        toast.success(successMessage);
        setShowLicenseUpload(false);
        setLicenseImages({});
        // Trigger parent component refresh
        window.location.reload();
      } else {
        const errorData = await response.text(); // Use text() first to see raw response
        console.error('Error response text:', errorData);
        
        const defaultErrorMessage = isUpdate 
          ? 'Cập nhật GPLX thất bại' 
          : 'Gửi yêu cầu xác thực thất bại';
        let errorMessage = defaultErrorMessage;
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error || parsedError.message || parsedError.details || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status}): ${errorData || 'Unknown error'}`;
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting license:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        const errorMessage = isUpdate 
          ? 'Có lỗi xảy ra khi cập nhật GPLX' 
          : 'Có lỗi xảy ra khi gửi yêu cầu xác thực';
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fullName: profileData.fullName,
          phone: profileData.phone,
          avatarUrl: profileData.avatar
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile updated:', result);
        toast.success('Thông tin đã được cập nhật thành công!');
        
        // Cập nhật lại state từ response
        if (result.data) {
          setProfileData(prev => ({
            ...prev,
            fullName: result.data.fullName,
            phone: result.data.phone ,
            facebook: result.data.facebook,
            avatar: result.avatarUrl,
            dateOfBirth: result.data.dateOfBirth 
          }));
        }
        
        // Trigger parent component refresh
        window.location.reload();
      } else {
        throw new Error('Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tài khoản của tôi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-4 sm:px-6">
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
          <Avatar className="h-20 w-20 sm:h-20 sm:w-20">
            <AvatarImage src={profileData.avatar} />
            <AvatarFallback>
              {profileData.avatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
              id="avatar-upload"
            />
            <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('avatar-upload')?.click()}
                disabled={isLoading}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isLoading ? 'Đang tải...' : 'Thay đổi ảnh'}
              </Button>
              
            </div>
            <p className="text-sm text-gray-600 mt-1">
              JPG, PNG, GIF tối đa 10MB
            </p>
          </div>
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              value={profileData.fullName}
              onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profileData.email}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              value={profileData.facebook}
              onChange={(e) => setProfileData({...profileData, facebook: e.target.value})}
              placeholder="Link Facebook"
              className="mt-1"
            />
          </div>
        </div>

        {/* Driving License */}
        <div>
          <Label>Giấy phép lái xe</Label>
          {!profileData.verified && !driver ? (
            <div className="mt-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-4">
                  Tải lên giấy phép lái xe để xác thực tài khoản
                </p>
                <Button onClick={() => setShowLicenseUpload(true)}>
                  Tải lên giấy phép
                </Button>
              </div>
            </div>
          ) : driver ? (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {!driver.isVerified && (
                    <div className="text-red-600">Chưa xác thực</div>
                  )}
                  {driver.isVerified && (
                    <div className="text-green-600">Đã xác thực</div>
                  )}
                </div>
                {/* Nút cập nhật GPLX - chỉ hiển thị khi chưa xác thực */}
                {!driver.isVerified && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowLicenseUpload(true)}
                  >
                    Cập nhật GPLX
                  </Button>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div><strong>Số GPLX:</strong> {driver.licenseNumber}</div>
                <div><strong>Họ tên:</strong> {driver.fullName}</div>
                <div><strong>Ngày sinh:</strong> {formatDate(driver.dateOfBirth!)}</div>
                {driver.expiryDate && (
                  <div><strong>Ngày hết hạn:</strong> {formatDate(driver.expiryDate)}</div>
                )}
                <div className="flex space-x-2 mt-2">
                  {driver.frontImageUrl && (
                    <img src={driver.frontImageUrl} alt="GPLX mặt trước" className="w-20 h-20 object-cover rounded" />
                  )}
                  {driver.backImageUrl && (
                    <img src={driver.backImageUrl} alt="GPLX mặt sau" className="w-20 h-20 object-cover rounded" />
                  )}
                  {driver.selfieImageUrl && (
                    <img src={driver.selfieImageUrl} alt="Selfie" className="w-20 h-20 object-cover rounded" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center space-x-2 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm">Đã xác thực</span>
            </div>
          )}
        </div>

        {/* Credit Score */}
        <div>
          <Label>Điểm tín nhiệm</Label>
          <div className="mt-2 flex items-center space-x-4">
            <div className="text-2xl font-bold text-blue-600">{user.creditScore || 0}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(user.creditScore || 0, 100)}%` }}
                    ></div>
            </div>
            <span className="text-sm text-gray-600">
              {user.creditScore! >=80 ? 'Xuất sắc' :
               user.creditScore! >= 60 ? 'Tốt' :
               user.creditScore! >= 40 ? 'Trung bình' : 'Yếu'}
            </span>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full sm:w-auto min-h-[44px]" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : 'Lưu thông tin'}
        </Button>

        {/* License Upload Modal */}
        <Dialog open={showLicenseUpload} onOpenChange={setShowLicenseUpload}>
          <DialogContent 
            className="max-w-2xl w-[95vw] sm:w-full flex flex-col max-h-[85vh] sm:max-h-[90vh]" 
            style={{ 
              overflow: 'hidden'
            }}
          >
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {driver && driver.id ? 'Cập nhật giấy phép lái xe' : 'Xác thực giấy phép lái xe'}
              </DialogTitle>
            </DialogHeader>
            <div 
              className="flex-1 space-y-4 pr-2 overflow-y-auto" 
              style={{ 
                maxHeight: 'calc(85vh - 140px)',
                scrollbarWidth: 'thin',
                scrollbarColor: '#888 #f1f1f1'
              }}
            >
              <div>
                <Label htmlFor="licenseNumber">Số giấy phép lái xe</Label>
                <Input
                  id="licenseNumber"
                  value={driver?.licenseNumber || profileData.licenseNumber}
                  onChange={(e) => setProfileData({...profileData, licenseNumber: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="licenseFullName">Họ và tên (trên GPLX)</Label>
                <Input
                  id="licenseFullName"
                  value={driver?.fullName || profileData.fullName}
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={(driver?.dateOfBirth ? driver.dateOfBirth.slice(0,10) : (profileData.dateOfBirth ? profileData.dateOfBirth.slice(0,10) : ''))}
                  onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="licenseClass">Hạng GPLX</Label>
                <Select
                  value={driver?.licenseClass || profileData.licenseClass}
                  onValueChange={(value: string) => setProfileData({ ...profileData, licenseClass: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn hạng GPLX" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LicenseClassEnum).map((licenseClass) => (
                      <SelectItem key={licenseClass} value={licenseClass}>
                        {licenseClass}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="issueDate">Ngày cấp</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={(driver?.issueDate ? driver.issueDate.slice(0,10) : (profileData.issueDate ? profileData.issueDate.slice(0,10) : ''))}
                  onChange={(e) => setProfileData({...profileData, issueDate: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={(driver?.expiryDate ? driver.expiryDate.slice(0,10) : (profileData.expiryDate ? profileData.expiryDate.slice(0,10) : ''))}
                  onChange={(e) => setProfileData({...profileData, expiryDate: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="issuePlace">Nơi cấp</Label>
                <Input
                  id="issuePlace"
                  value={driver?.issuePlace || profileData.issuePlace}
                  onChange={(e) => setProfileData({...profileData, issuePlace: e.target.value})}
                  placeholder="Ví dụ: Sở Giao thông Vận tải Hà Nội"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Ảnh giấy phép lái xe</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {/* Front Image */}
                  <div>
                    <Label className="text-sm font-medium">Mặt trước GPLX *</Label>
                    <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                      <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 mb-2 truncate">
                        {licenseImages.front ? licenseImages.front.name : 'Chọn ảnh mặt trước'}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLicenseImageSelect('front')}
                        style={{ display: 'none' }}
                        id="front-image-upload"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.getElementById('front-image-upload')?.click()}
                        className="text-xs px-2 py-1 h-7"
                      >
                        {licenseImages.front ? 'Thay đổi' : 'Chọn file'}
                      </Button>
                    </div>
                  </div>

                  {/* Back Image */}
                  <div>
                    <Label className="text-sm font-medium">Mặt sau GPLX *</Label>
                    <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                      <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 mb-2 truncate">
                        {licenseImages.back ? licenseImages.back.name : 'Chọn ảnh mặt sau'}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLicenseImageSelect('back')}
                        style={{ display: 'none' }}
                        id="back-image-upload"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('back-image-upload')?.click()}
                        className="text-xs px-2 py-1 h-7"
                      >
                        {licenseImages.back ? 'Thay đổi' : 'Chọn file'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Selfie Image - Full width */}
                <div className="mt-4">
                  <Label className="text-sm font-medium">Ảnh selfie với GPLX (tùy chọn)</Label>
                  <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center max-w-md mx-auto">
                    <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-600 mb-2 truncate">
                      {licenseImages.selfie ? licenseImages.selfie.name : 'Chọn ảnh selfie'}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLicenseImageSelect('selfie')}
                      style={{ display: 'none' }}
                      id="selfie-image-upload"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('selfie-image-upload')?.click()}
                      className="text-xs px-2 py-1 h-7"
                    >
                      {licenseImages.selfie ? 'Thay đổi' : 'Chọn file'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 pt-4 border-t">
              <Button 
                className="w-full min-h-[44px]" 
                onClick={handleSubmitLicense}
                disabled={isLoading}
              >
                {isLoading 
                  ? (driver && driver.id ? 'Đang cập nhật...' : 'Đang gửi...') 
                  : (driver && driver.id ? 'Cập nhật GPLX' : 'Gửi xác thực')
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toDateISOString = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const date = new Date(value as any);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};



type TabKey = 'info' | 'history' | 'check' | 'extension';

interface BookingSummary {
  id: string;
  code?: string;
  vehicleName?: string;
  vehicleId?: string;
  vehicleImage?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  pickupAddress?: string;
  totalAmount?: number;
  checkCompletion?: CheckCompletion;
}

interface RefundData {
  id: string;
  userId: string;
  bookingId: string;
  principal: number;
  amount: number;
  penaltyAmount: number;
  damageAmount: number;
  overtimeAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  vehicleName?: string;
}

interface ComplaintData {
  id: string;
  userId: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

interface BookingDetailData extends BookingSummary {
  rentalFee?: number;
  insuranceFee?: number;
  deposit?: number;
  notes?: string;
  dropoffAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  customerName?: string;
  customerPhone?: string;
  hostName?: string;
  hostPhone?: string;
  driverLicenseNumber?: string;
}

interface TimelineEntry {
  id: string;
  action: string;
  createdAt: string;
  actor?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

type CheckType = 'CHECK_IN' | 'CHECK_OUT';

interface CheckRecord {
  id: string;
  bookingId: string;
  type: CheckType;
  address?: string;
  latitude?: number;
  longitude?: number;
  mileage?: number;
  fuelLevel?: number;
  images?: string[];
  damageNotes?: string;
  damageImages?: string[];
  createdAt?: string;
  staffName?: string;
  verified?: boolean;
  verifiedAt?: string;
}

interface ExtensionRecord {
  id: string;
  bookingId: string;
  newEndTime?: string;
  originalEndTime?: string;
  additionalHours?: number;
  additionalAmount?: number;
  status?: string;
  notes?: string;
  createdAt?: string;
  approvedBy?: string;
}

const BOOKING_STATUS_FILTERS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ xử lý', value: 'PENDING_PROCESS' },
  { label: 'Đang thuê', value: 'ONGOING' },
  { label: 'Hoàn tất', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED_GROUP' },
  { label: 'Hoàn tiền', value: 'REFUNDED' }
] as const;

const BOOKING_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  // Trạng thái thanh toán
  PENDING: { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
  DEPOSIT_PAID: { label: 'Đã cọc - Chờ ngày nhận xe', className: 'bg-yellow-100 text-yellow-700' },
  READY_FOR_CHECKIN: { label: 'Chờ thanh toán còn lại', className: 'bg-orange-100 text-orange-700' },
  FULLY_PAID: { label: 'Đã thanh toán đủ - Chờ nhận xe', className: 'bg-lime-100 text-lime-700' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-700' },

  // Trạng thái thuê xe
  ONGOING: { label: 'Đang thuê xe', className: 'bg-green-100 text-green-700' },
  IN_PROGRESS: { label: 'Đang thuê xe', className: 'bg-green-100 text-green-700' },
  IN_USE: { label: 'Đang thuê xe', className: 'bg-green-100 text-green-700' },

  // Trạng thái check-in/out
  CHECKED_IN: { label: 'Đã nhận xe', className: 'bg-indigo-100 text-indigo-700' },
  CHECKED_OUT: { label: 'Đã trả xe', className: 'bg-purple-100 text-purple-700' },
  CHECK_IN: { label: 'Đang check-in', className: 'bg-sky-100 text-sky-700' },
  CHECK_OUT: { label: 'Đang check-out', className: 'bg-slate-100 text-slate-700' },

  // Trạng thái kết thúc
  COMPLETED: { label: 'Hoàn tất', className: 'bg-emerald-100 text-emerald-700' },
  PENDING_REFUND: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-100 text-rose-700' },
  REJECTED: { label: 'Bị từ chối', className: 'bg-rose-100 text-rose-700' },
  EXPIRED: { label: 'Hết hạn thanh toán', className: 'bg-gray-100 text-gray-700' },
  OVERDUE: { label: 'Quá hạn trả xe', className: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-violet-100 text-violet-700' },

  // Trạng thái gia hạn
  EXTENSION_REQUESTED: { label: 'Yêu cầu gia hạn', className: 'bg-amber-100 text-amber-700' },
  EXTENSION_APPROVED: { label: 'Đã duyệt gia hạn', className: 'bg-emerald-100 text-emerald-700' },
  EXTENSION_REJECTED: { label: 'Từ chối gia hạn', className: 'bg-rose-100 text-rose-700' }
};

const HISTORY_ACTION_COPY: Record<string, string> = {
  CREATED: 'Tạo booking',
  PENDING: 'Chờ thanh toán',
  DEPOSIT_PAID: 'Đã thanh toán cọc, chờ đến ngày nhận xe',
  READY_FOR_CHECKIN: 'Đến ngày nhận xe, chờ thanh toán phần còn lại',
  FULLY_PAID: 'Đã thanh toán đủ, chờ check-in',
  CONFIRMED: 'Chủ xe xác nhận',
  ONGOING: 'Đang thuê xe (đã check-in)',
  CHECK_IN: 'Khách check-in',
  CHECK_OUT: 'Khách check-out',
  CHECKED_IN: 'Đã nhận xe',
  CHECKED_OUT: 'Đã trả xe',
  EXTENSION_REQUESTED: 'Yêu cầu gia hạn',
  EXTENSION_APPROVED: 'Gia hạn được duyệt',
  EXTENSION_REJECTED: 'Gia hạn bị từ chối',
  COMPLETED: 'Hoàn tất chuyến (đã check-out)',
  CANCELLED: 'Booking bị hủy',
  EXPIRED: 'Hết hạn (quá thời gian không thanh toán)',
  OVERDUE: 'Quá hạn (quá thời gian trả xe)'
};

const BOOKING_LIST_LIMIT = 10;
const HISTORY_PAGE_LIMIT = 10;
interface CheckCompletion {
  checkIn?: CheckRecord;
  checkOut?: CheckRecord;
}
interface PaymentInfo {
  id?: string;
  bookingId: string;
  paymentCode: string;
  amount: number;
  status?: string;
  createdAt?: string;
}
const QR_BASE_URL = 'https://qr.sepay.vn/img';
const PAYMENT_ACCOUNT_NUMBER = import.meta.env.VITE_PAYMENT_ACCOUNT || '0344927528';
const PAYMENT_BANK_CODE = import.meta.env.VITE_PAYMENT_BANK_CODE || 'MB';
const PAYMENT_ACCOUNT_NAME = import.meta.env.VITE_PAYMENT_ACCOUNT_NAME || 'HacMieu Journey';
const PENDING_PAYMENT_STATUSES = ['PENDING', 'PENDING_PAYMENT', 'WAITING_PAYMENT', 'AWAITING_PAYMENT'];
const PAYMENT_GRACE_PERIOD_MS = 15 * 60 * 1000;

const sanitizePaymentDescription = (value: string) => {
  if (!value) return 'VEHICLEPAYMENT';
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
};
function HistoryTab() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof BOOKING_STATUS_FILTERS)[number]['value']>('ALL');
  const { bookings, loading, error, totalPages, refetch } = useBookingList(page, BOOKING_LIST_LIMIT);
  const { refunds, loading: refundsLoading, error: refundsError, totalPages: refundsTotalPages, refetch: refetchRefunds } = useRefundList(page, BOOKING_LIST_LIMIT);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Khi statusFilter thay đổi sang/khỏi REFUNDED, reset page về 1
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesKeyword =
        !keyword ||
        booking.vehicleName?.toLowerCase().includes(keyword) ||
        booking.code?.toLowerCase().includes(keyword);
      const normalizedStatus = booking.status?.toUpperCase() || '';

      // Tab 1: Tất cả - show all bookings
      if (statusFilter === 'ALL') {
        return matchesKeyword;
      }

      // Tab 2: Chờ xử lý - chỉ PENDING (chờ thanh toán khi ấn booking)
      if (statusFilter === 'PENDING_PROCESS') {
        const isPendingProcess = normalizedStatus === 'PENDING';
        return matchesKeyword && isPendingProcess;
      }

      // Tab 3: Đang thuê - ONGOING hoặc PENDING_REFUND
      // Hiển thị booking đang thuê (ONGOING) hoặc đã checkout nhưng chờ admin duyệt (PENDING_REFUND)
      if (statusFilter === 'ONGOING') {
        const isOngoing = normalizedStatus === 'ONGOING';
        const isPendingRefund = normalizedStatus === 'PENDING_REFUND';

        // Hiển thị nếu status là ONGOING hoặc PENDING_REFUND
        return matchesKeyword && (isOngoing || isPendingRefund);
      }

      // Tab 4: Hoàn tất - COMPLETED
      // Chỉ hiển thị khi backend trả về status COMPLETED (admin đã duyệt xong)
      if (statusFilter === 'COMPLETED') {
        const isCompleted = normalizedStatus === 'COMPLETED';

        // Chỉ hiển thị khi status là COMPLETED
        return matchesKeyword && isCompleted;
      }

      // Tab 5: Đã hủy - CANCELLED, EXPIRED, OVERDUE
      if (statusFilter === 'CANCELLED_GROUP') {
        const isCancelled = ['CANCELLED', 'EXPIRED', 'OVERDUE'].includes(normalizedStatus);
        return matchesKeyword && isCancelled;
      }

      // Tab 6: Hoàn tiền - REFUNDED
      if (statusFilter === 'REFUNDED') {
        const isRefunded = normalizedStatus === 'REFUNDED';
        return matchesKeyword && isRefunded;
      }

      return matchesKeyword;
    });
  }, [bookings, searchTerm, statusFilter]);

  // Tính lại totalPages dựa trên filteredBookings khi có filter
  const adjustedTotalPages = useMemo(() => {
    // Nếu đang filter (không phải "Tất cả"), tính lại số trang dựa trên filteredBookings
    if (statusFilter !== 'ALL' || searchTerm.trim()) {
      return Math.max(1, Math.ceil(filteredBookings.length / BOOKING_LIST_LIMIT));
    }
    // Nếu không filter, dùng totalPages từ API
    return totalPages;
  }, [filteredBookings.length, statusFilter, searchTerm, totalPages]);

  // Reset về trang 1 khi thay đổi filter hoặc search
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    if (!filteredBookings.length) {
      setSelectedBookingId(null);
      return;
    }

    setSelectedBookingId((prev) => {
      if (prev && filteredBookings.some((booking) => booking.id === prev)) {
        return prev;
      }
      return filteredBookings[0].id;
    });
  }, [filteredBookings]);

  // Determine which data to display based on filter
  const isRefundTab = statusFilter === 'REFUNDED';
  const currentError = isRefundTab ? refundsError : error;
  const currentLoading = isRefundTab ? refundsLoading : loading;
  const currentTotalPages = isRefundTab ? refundsTotalPages : adjustedTotalPages;
  const currentRefetch = isRefundTab ? refetchRefunds : refetch;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thuê xe</CardTitle>
          <p className="text-sm text-gray-600">
            Theo dõi booking theo từng giai đoạn: danh sách ⇢ chi tiết ⇢ timeline ⇢ check-in/out ⇢ gia hạn.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {isRefundTab ? 'Không thể tải danh sách hoàn tiền' : 'Không thể tải danh sách booking'}
                </p>
                <p>{currentError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={currentRefetch}>
                  Thử lại
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Input
              placeholder={isRefundTab ? "Tìm kiếm hoàn tiền..." : "Tìm tên xe, mã booking..."}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="sm:max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              {BOOKING_STATUS_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatusFilter(item.value)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    statusFilter === item.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isRefundTab ? (
        <RefundListPanel
          refunds={refunds}
          loading={currentLoading}
          page={page}
          totalPages={currentTotalPages}
          onPageChange={setPage}
        />
      ) : (
        <BookingListPanel
          bookings={filteredBookings}
          loading={loading}
          page={page}
          totalPages={adjustedTotalPages}
          onPageChange={setPage}
          selectedId={selectedBookingId}
          onSelect={(id) => setSelectedBookingId(id)}
          renderDetail={(bookingId) => (
            <BookingDetailWorkspace bookingId={bookingId} onBookingUpdated={refetch} inline />
          )}
        />
      )}
    </div>
  );
}
function BookingListPanel({
  bookings,
  loading,
  page,
  totalPages,
  onPageChange,
  selectedId,
  onSelect,
  renderDetail
}: {
  bookings: BookingSummary[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  renderDetail?: (bookingId: string) => React.ReactNode;
}) {
  const handleToggle = (bookingId: string) => {
    if (!selectedId) {
      onSelect(bookingId);
    } else if (selectedId === bookingId) {
      onSelect(null);
    } else {
      onSelect(bookingId);
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Danh sách booking</p>
          <p className="text-xs text-gray-500">
            Trang {page}/{Math.max(totalPages, 1)}
          </p>
        </div>
        <Badge variant="secondary">{bookings.length}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[32rem] pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải danh sách booking...
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            Không tìm thấy booking phù hợp.
          </div>
        ) : (
          bookings.map((booking) => {
            const isActive = booking.id === selectedId;
            return (
              <div key={booking.id} className="space-y-2 border-b last:border-b-0">
                <BookingCard booking={booking} active={isActive} onToggle={() => handleToggle(booking.id)} />
                {renderDetail && isActive && (
                  <div className="bg-gray-50 px-4 pb-4">{renderDetail(booking.id)}</div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="border-t px-4 py-3">
        <PaginationControls page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </Card>
  );
}

function RefundListPanel({
  refunds,
  loading,
  page,
  totalPages,
  onPageChange
}: {
  refunds: RefundData[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const REFUND_STATUS_STYLES: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700' },
    APPROVED: { label: 'Đã duyệt', className: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { label: 'Từ chối', className: 'bg-rose-100 text-rose-700' },
    COMPLETED: { label: 'Đã hoàn tiền', className: 'bg-violet-100 text-violet-700' }
  };

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Danh sách hoàn tiền</p>
          <p className="text-xs text-gray-500">
            Trang {page}/{Math.max(totalPages, 1)}
          </p>
        </div>
        <Badge variant="secondary">{refunds.length}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[32rem] pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải danh sách hoàn tiền...
          </div>
        ) : refunds.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            Không tìm thấy yêu cầu hoàn tiền.
          </div>
        ) : (
          refunds.map((refund) => {
            const statusMeta = REFUND_STATUS_STYLES[refund.status] || {
              label: refund.status,
              className: 'bg-gray-100 text-gray-600'
            };

            return (
              <div key={refund.id} className="border-b last:border-b-0 p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Mã booking: {refund.bookingId.slice(0, 8)}...
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    {refund.vehicleName && (
                      <p className="text-sm font-medium text-gray-700">
                        🚗 {refund.vehicleName}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Tiền cọc:</span> {formatCurrency(refund.principal)}
                      </div>
                      <div>
                        <span className="font-medium">Số tiền hoàn:</span> {formatCurrency(refund.amount)}
                      </div>
                      {refund.penaltyAmount > 0 && (
                        <div>
                          <span className="font-medium">Phí phạt:</span> {formatCurrency(refund.penaltyAmount)}
                        </div>
                      )}
                      {refund.damageAmount > 0 && (
                        <div>
                          <span className="font-medium">Tiền hư hỏng:</span> {formatCurrency(refund.damageAmount)}
                        </div>
                      )}
                      {refund.overtimeAmount > 0 && (
                        <div>
                          <span className="font-medium">Phí quá giờ:</span> {formatCurrency(refund.overtimeAmount)}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      Tạo lúc: {formatVNTime(refund.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t px-4 py-3">
        <PaginationControls page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </Card>
  );
}

function BookingCard({
  booking,
  active,
  onToggle
}: {
  booking: BookingSummary;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full flex-col gap-2 px-4 py-3 text-left transition ${
        active ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {booking.vehicleId ? (
              <Link
                to={{
                  pathname: `/vehicle/${booking.vehicleId}`
                }}
                className="text-blue-600 hover:underline"
              >
                {booking.vehicleName || 'Xe chưa rõ'}
              </Link>
            ) : (
              booking.vehicleName || 'Xe chưa rõ'
            )}
          </p>
          <p className="text-xs text-gray-500">{booking.code || booking.id}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5" />
          <span>{formatDateRange(booking.startTime, booking.endTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{booking.pickupAddress || '—'}</span>
        </div>
      </div>
      <p className="text-right text-sm font-semibold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
    </button>
  );
}
function BookingDetailWorkspace({
  bookingId,
  onBookingUpdated,
  inline = false
}: {
  bookingId: string | null;
  onBookingUpdated?: () => void;
  inline?: boolean;
}) {
  const { booking, loading, error, refetch } = useBookingDetail(bookingId);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    setActiveTab('info');
  }, [bookingId]);

  const handleRefresh = () => {
    refetch();
    onBookingUpdated?.();
  };

  if (!bookingId) {
    return (
      <Card className="flex min-h-[400px] items-center justify-center p-6 text-sm text-gray-500">
        Chọn một booking để xem chi tiết.
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="flex min-h-[400px] items-center justify-center p-6 text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải chi tiết booking...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="space-y-3 p-6">
        <p className="font-semibold text-gray-900">Không thể tải chi tiết booking</p>
        <p className="text-sm text-gray-600">{error}</p>
        <Button variant="outline" onClick={refetch}>
          Thử lại
        </Button>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card className="flex min-h-[400px] items-center justify-center p-6 text-sm text-gray-500">
        Không tìm thấy thông tin booking.
      </Card>
    );
  }

  const tabs = [
    {
      id: 'info',
      label: 'Thông tin thuê xe',
      content: () => (
        <BookingInfoSection booking={booking} onNavigate={setActiveTab} onBookingUpdated={handleRefresh} />
      )
    },
    {
      id: 'history',
      label: 'Lịch sử thao tác',
      content: (isActive: boolean) => <HistoryTimelineSection bookingId={booking.id} isActive={isActive} />
    },
    {
      id: 'check',
      label: 'Check-in / Check-out',
      content: (isActive: boolean) => (
        <CheckSection bookingId={booking.id} booking={booking} isActive={isActive} onCompleted={handleRefresh} />
      )
    },
    {
      id: 'extension',
      label: 'Gia hạn thuê',
      content: (isActive: boolean) => (
        <ExtensionSection bookingId={booking.id} booking={booking} isActive={isActive} onCompleted={handleRefresh} />
      )
    }
  ];

  const isExpired = (booking.status || '').toUpperCase() === 'EXPIRED';

  const detailCard = (
    <Card className="p-0">
      <div className="border-b p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">Mã booking {booking.code || booking.id}</p>
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.vehicleId ? (
                <Link to={`/vehicle/${booking.vehicleId}`} className="text-blue-600 hover:underline">
                  {booking.vehicleName}
                </Link>
              ) : (
                booking.vehicleName
              )}
            </h3>
            <p className="text-sm text-gray-500">{formatDateRange(booking.startTime, booking.endTime)}</p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <StatusBadge status={booking.status} />
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
          </div>
        </div>
      </div>
      {!isExpired && (
        <div className="p-4">
          {isDesktop ? (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
              <TabsList className="grid grid-cols-4">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="pt-4">
                  {tab.content(activeTab === tab.id)}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Accordion
              type="single"
              collapsible
              value={activeTab}
              onValueChange={(value) => value && setActiveTab(value as TabKey)}
            >
              {tabs.map((tab) => (
                <AccordionItem key={tab.id} value={tab.id}>
                  <AccordionTrigger>{tab.label}</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    {tab.content(activeTab === tab.id)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )}
    </Card>
  );

  if (inline) {
    return <div className="pt-2">{detailCard}</div>;
  }

  return detailCard;
}
function BookingInfoSection({
  booking,
  onNavigate,
  onBookingUpdated
}: {
  booking: BookingDetailData;
  onNavigate: (tab: TabKey) => void;
  onBookingUpdated: () => void;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const status = booking.status?.toUpperCase() || '';
  const paymentStatus = booking.paymentStatus?.toUpperCase() || '';
  const paymentAmount = getPendingPaymentAmount(booking);
  const shouldShowPaymentNotice =
    paymentAmount > 0 &&
    (PENDING_PAYMENT_STATUSES.includes(status) || PENDING_PAYMENT_STATUSES.includes(paymentStatus));
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldShowPaymentNotice) {
      setPaymentInfo(null);
      setPaymentError(null);
      return;
    }
    if (!apiBase || !booking.id) {
      setPaymentError('Không thể tải thông tin thanh toán');
      return;
    }
    const controller = new AbortController();
    const fetchPayment = async () => {
      setPaymentLoading(true);
      setPaymentError(null);
      try {
        const response = await fetch(`${apiBase}/payment/${booking.id}`, {
          credentials: 'include',
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        const amountValue = Number(payload.amount ?? payload.totalAmount ?? paymentAmount) || paymentAmount;
        setPaymentInfo({
          id: payload.id,
          bookingId: payload.bookingId || booking.id,
          paymentCode: (payload.paymentCode || sanitizePaymentDescription(booking.id)).toString(),
          amount: amountValue,
          status: payload.status || payload.paymentStatus || 'PENDING',
          createdAt: payload.createdAt || payload.created_at
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Load payment info error:', error);
        setPaymentInfo(null);
        setPaymentError(error instanceof Error ? error.message : 'Không thể tải thông tin thanh toán');
      } finally {
        if (!controller.signal.aborted) {
          setPaymentLoading(false);
        }
      }
    };
    fetchPayment();
    return () => controller.abort();
  }, [apiBase, booking.id, paymentAmount, shouldShowPaymentNotice]);

  const handleCancel = async () => {
    if (!booking.id) return;
    if (!apiBase) {
      toast.error('Chưa cấu hình API');
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(`${apiBase}/booking/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          id: booking.id,
          cancelReason: cancelReason.trim() || 'Khách huỷ trên ứng dụng'
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      toast.success('Đã gửi yêu cầu hủy booking');
      setCancelOpen(false);
      setCancelReason('');
      onBookingUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể hủy booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const actions = [
    {
      id: 'cancel',
      label: 'Hủy booking',
      variant: 'outline' as const,
      visible: ['PENDING', 'CONFIRMED'].includes(status),
      onClick: () => setCancelOpen(true)
    },
    {
      id: 'checkin',
      label: 'Check-in',
      variant: 'secondary' as const,
      visible: ['CONFIRMED', 'PENDING_CHECKIN', 'READY'].includes(status),
      onClick: () => onNavigate('check')
    },
    {
      id: 'checkout',
      label: 'Check-out',
      variant: 'secondary' as const,
      visible: ['CHECKED_IN', 'IN_PROGRESS', 'IN_USE'].includes(status),
      onClick: () => onNavigate('check')
    },
    {
      id: 'extension',
      label: 'Gia hạn thuê',
      variant: 'default' as const,
      visible: ['IN_PROGRESS', 'CHECKED_IN', 'IN_USE'].includes(status),
      onClick: () => onNavigate('extension')
    }
  ];

  const visibleActions = actions.filter((action) => action.visible);

  return (
    <div className="space-y-6">
      {shouldShowPaymentNotice && (
        <PendingPaymentNotice
          booking={booking}
          fallbackAmount={paymentAmount}
          payment={paymentInfo}
          loading={paymentLoading}
          error={paymentError}
        />
      )}
      <div className="rounded-xl border p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Thời gian thuê" value={formatDateRange(booking.startTime, booking.endTime)} />
          <InfoRow label="Thời lượng" value={calcDurationLabel(booking.startTime, booking.endTime)} />
          <InfoRow label="Địa điểm nhận xe" value={booking.pickupAddress || 'Chưa cập nhật'} />
          <InfoRow label="Địa điểm trả xe" value={booking.dropoffAddress || 'Chưa cập nhật'} />
          <InfoRow
            label="Tọa độ nhận xe"
            value={
              booking.pickupLat != null && booking.pickupLng != null
                ? `${booking.pickupLat}, ${booking.pickupLng}`
                : 'Chưa cập nhật'
            }
          />
        </div>
        {booking.notes && (
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Ghi chú: {booking.notes}</p>
        )}
      </div>

      <BookingCostSummary booking={booking} />

      {(booking.customerName || booking.customerPhone || booking.driverLicenseNumber || booking.hostName || booking.hostPhone) && (
        <div className="grid gap-4 md:grid-cols-2">
          {(booking.customerName || booking.customerPhone || booking.driverLicenseNumber) && (
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase text-gray-500">Khách thuê</p>
              {booking.customerName ? (
                <>
                  <p className="text-base font-semibold text-gray-900">{booking.customerName}</p>
                  {booking.customerPhone && <p className="text-sm text-gray-600">{booking.customerPhone}</p>}
                  {booking.driverLicenseNumber && (
                    <p className="text-xs text-gray-500">GPLX: {booking.driverLicenseNumber}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Chưa có thông tin khách thuê.</p>
              )}
            </div>
          )}
          {(booking.hostName || booking.hostPhone) && (
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase text-gray-500">Chủ xe/đối tác</p>
              {booking.hostName ? (
                <>
                  <p className="text-base font-semibold text-gray-900">{booking.hostName}</p>
                  {booking.hostPhone && <p className="text-sm text-gray-600">{booking.hostPhone}</p>}
                </>
              ) : (
                <p className="text-sm text-gray-500">Chưa có thông tin chủ xe/đối tác.</p>
              )}
            </div>
          )}
        </div>
      )}

      {visibleActions.length > 0 && (
        <div className="rounded-xl border p-4">
          <p className="text-xs uppercase text-gray-500">Hành động nhanh</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleActions.map((action) => (
              <Button key={action.id} variant={action.variant} size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => onNavigate('history')}>
              Xem timeline
            </Button>
          </div>
        </div>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Mô tả lý do để chủ xe nắm thông tin chính xác.</p>
            <Textarea
              rows={4}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Ví dụ: đổi kế hoạch, không cần xe nữa..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Đóng
            </Button>
            <Button onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? 'Đang gửi...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function HistoryTimelineSection({
  bookingId,
  isActive
}: {
  bookingId?: string;
  isActive: boolean;
}) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setEntries([]);
    setPage(1);
    setHasMore(false);
    setError(null);
  }, [bookingId]);

  useEffect(() => {
    if (!isActive || !bookingId) {
      return;
    }
    if (!apiBase) {
      setError('Chưa cấu hình API');
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${apiBase}/history?page=${page}&limit=${HISTORY_PAGE_LIMIT}&bookingId=${bookingId}`,
          {
            credentials: 'include',
            signal: controller.signal
          }
        );
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        const rawList = payload.items ?? payload.data ?? payload.histories ?? [];
        const mapped = Array.isArray(rawList) ? rawList.map(mapTimelineEntry) : [];
        setEntries((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
        const totalItems = toNumber(payload.totalItems ?? payload.total) ?? mapped.length;
        const totalPages = payload.totalPages || (totalItems ? Math.max(1, Math.ceil(totalItems / HISTORY_PAGE_LIMIT)) : 1);
        setHasMore(page < totalPages);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải lịch sử');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [apiBase, bookingId, isActive, page]);

  if (!isActive) {
    return <p className="text-sm text-gray-500">Mở tab để xem lịch sử thao tác.</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Không thể tải lịch sử: {error}
        </div>
      )}
      {!loading && !entries.length && !error && (
        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
          Chưa có thao tác nào.
        </div>
      )}
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <TimelineItem key={`${entry.id}-${index}`} entry={entry} isLast={index === entries.length - 1} />
        ))}
      </div>
      {loading && (
        <div className="flex items-center justify-center text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang tải...
        </div>
      )}
      {hasMore && (
        <Button variant="outline" size="sm" onClick={() => setPage((prev) => prev + 1)} disabled={loading}>
          Xem thêm
        </Button>
      )}
    </div>
  );
}

function TimelineItem({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  const label = HISTORY_ACTION_COPY[entry.action] || entry.action.replace(/_/g, ' ');
  return (
    <div className="relative pl-8">
      <span className="absolute left-1 top-1.5 h-3 w-3 rounded-full bg-blue-500" />
      {!isLast && <span className="absolute left-2 top-4 h-full w-px bg-blue-100" aria-hidden />}
      <p className="text-xs uppercase text-gray-500">{formatDateTime(entry.createdAt)}</p>
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      {entry.actor && <p className="text-xs text-gray-500">Bởi {entry.actor}</p>}
      {entry.notes && <p className="mt-1 text-sm text-gray-600">{entry.notes}</p>}
    </div>
  );
}
function CheckSection({
  bookingId,
  booking,
  isActive,
  onCompleted
}: {
  bookingId?: string;
  booking?: BookingDetailData;
  isActive: boolean;
  onCompleted?: () => void;
}) {
  const checkCompletionState = useCheckCompletion(bookingId, isActive);
  const checkInState = useCheckRecords(bookingId, 'CHECK_IN', isActive);
  const checkOutState = useCheckRecords(bookingId, 'CHECK_OUT', isActive);

  const handleSuccess = () => {
    checkInState.refetch();
    checkOutState.refetch();
    checkCompletionState.refetch();
    onCompleted?.();
  };

  if (!bookingId) {
    return <p className="text-sm text-gray-500">Chọn booking để thực hiện check-in/check-out.</p>;
  }

  const hasCheckIn = Boolean(checkCompletionState.data?.checkIn);
  const hasCheckOut = Boolean(checkCompletionState.data?.checkOut);
  const shouldShowCheckInForm = !hasCheckIn;
  const shouldShowCheckOutForm = hasCheckIn && !hasCheckOut;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Trạng thái: {hasCheckIn ? 'Đã check-in' : 'Chưa check-in'} / {hasCheckOut ? 'Đã check-out' : 'Chưa check-out'}
        </p>
        {checkCompletionState.loading && (
          <div className="text-sm text-gray-500">Đang kiểm tra trạng thái check-in/check-out...</div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {checkCompletionState.data?.checkIn && (
            <CheckRecordSummary title="Thông tin check-in" record={checkCompletionState.data.checkIn} />
          )}
          {checkCompletionState.data?.checkOut && (
            <CheckRecordSummary title="Thông tin check-out" record={checkCompletionState.data.checkOut} />
          )}
        </div>
      </div>

      {(shouldShowCheckInForm || shouldShowCheckOutForm) ? (
        <div
          className={`grid gap-4 ${shouldShowCheckInForm && shouldShowCheckOutForm ? 'lg:grid-cols-2' : ''}`}
        >
          {shouldShowCheckInForm && <CheckForm bookingId={bookingId} type="CHECK_IN" onSuccess={handleSuccess} />}
          {shouldShowCheckOutForm && <CheckForm bookingId={bookingId} type="CHECK_OUT" onSuccess={handleSuccess} />}
        </div>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Bạn đã hoàn thành cả check-in và check-out cho booking này.
        </div>
      )}

    </div>
  );
}

interface CheckFormState {
  address: string;
  latitude: string;
  longitude: string;
  mileage: string;
  fuelLevel: string;
  notes: string;
  damageNotes: string;
  images: File[];
  damageImages: File[];
}

function getCheckFormDefaults(): CheckFormState {
  return {
    address: '',
    latitude: '',
    longitude: '',
    mileage: '',
    fuelLevel: '',
    notes: '',
    damageNotes: '',
    images: [],
    damageImages: []
  };
}

function CheckForm({ bookingId, type, onSuccess }: { bookingId: string; type: CheckType; onSuccess?: () => void }) {
  const [form, setForm] = useState<CheckFormState>(getCheckFormDefaults);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    coords,
    loading: geoLoading,
    error: geoError,
    refresh,
    usingFallback
  } = useGeoLocation({ enabled: Boolean(bookingId), auto: false, useIpFallback: true });
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setForm(getCheckFormDefaults());
  }, [bookingId, type]);

  useEffect(() => {
    if (!coords.latitude || !coords.longitude) return;
    setForm((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude
    }));
  }, [coords.latitude, coords.longitude]);

  const handleFileChange = (key: 'images' | 'damageImages') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 6);
    setForm((prev) => ({ ...prev, [key]: files }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.address || !form.mileage || !form.fuelLevel) {
      toast.error('Vui lòng nhập địa điểm, số km và mức nhiên liệu');
      return;
    }

    if (!apiBase) {
      toast.error('Chưa cấu hình API');
      return;
    }

    const uploadImages = async (files: File[]) => {
      if (!files?.length) return [];
      return Promise.all(files.map((file) => uploadAvatarImage(file)));
    };

    setIsSubmitting(true);
    try {
      const [images, damageImages] = await Promise.all([
        uploadImages(form.images),
        uploadImages(form.damageImages)
      ]);
      const payload = {
        bookingId,
        type,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        address: form.address,
        images,
        mileage: Number(form.mileage),
        fuelLevel: Number(form.fuelLevel),
        notes: form.notes || undefined,
        damageNotes: form.damageNotes || undefined,
        damageImages: damageImages.length ? damageImages : undefined
      };
      const endpoint = type === 'CHECK_IN' ? 'check-in' : 'check-out';
      const response = await fetch(`${apiBase}/check/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      toast.success(type === 'CHECK_IN' ? 'Đã gửi check-in' : 'Đã gửi check-out');
      setForm(getCheckFormDefaults());
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi thông tin check');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeLabel = type === 'CHECK_IN' ? 'Check-in' : 'Check-out';

  const gpsStatusLabel = geoLoading
    ? 'đang lấy...'
    : coords.latitude
      ? usingFallback
        ? 'đã cập nhật (IP)'
        : 'đã cập nhật'
      : geoError
        ? `lỗi: ${geoError}`
        : 'chưa có';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
        <span>{typeLabel}</span>
        <span className="text-xs font-normal text-gray-500">
          GPS {gpsStatusLabel}
        </span>
      </div>
      <div>
        <Label htmlFor={`${type}-address`}>Địa điểm thực hiện</Label>
        <Input
          id={`${type}-address`}
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          placeholder="Nhập địa chỉ cụ thể"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${type}-latitude`}>Vĩ độ</Label>
          <Input
            id={`${type}-latitude`}
            type="number"
            step="any"
            value={form.latitude}
            onChange={(event) => setForm((prev) => ({ ...prev, latitude: event.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor={`${type}-longitude`}>Kinh độ</Label>
          <Input
            id={`${type}-longitude`}
            type="number"
            step="any"
            value={form.longitude}
            onChange={(event) => setForm((prev) => ({ ...prev, longitude: event.target.value }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Button type="button" variant="ghost" size="sm" onClick={refresh}>
          Lấy GPS
        </Button>
        {geoError && <span className="text-rose-600">{geoError}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${type}-mileage`}>Số km ODO</Label>
          <Input
            id={`${type}-mileage`}
            type="number"
            min="0"
            value={form.mileage}
            onChange={(event) => setForm((prev) => ({ ...prev, mileage: event.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor={`${type}-fuel`}>Mức nhiên liệu (%)</Label>
          <Input
            id={`${type}-fuel`}
            type="number"
            min="0"
            max="100"
            value={form.fuelLevel}
            onChange={(event) => setForm((prev) => ({ ...prev, fuelLevel: event.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label>Hình ảnh hiện trạng</Label>
        <Input type="file" accept="image/*" multiple onChange={handleFileChange('images')} />
        {form.images.length > 0 && <p className="text-xs text-gray-500">{form.images.length} ảnh đã chọn</p>}
      </div>
      <div>
        <Label>Ghi chú</Label>
        <Textarea
          rows={3}
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
      </div>
      <div>
        <Label>Ghi chú hư hỏng</Label>
        <Textarea
          rows={2}
          value={form.damageNotes}
          onChange={(event) => setForm((prev) => ({ ...prev, damageNotes: event.target.value }))}
        />
      </div>
      <div>
        <Label>Ảnh hư hỏng</Label>
        <Input type="file" accept="image/*" multiple onChange={handleFileChange('damageImages')} />
        {form.damageImages.length > 0 && <p className="text-xs text-gray-500">{form.damageImages.length} ảnh đã chọn</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Đang gửi...' : `Gửi ${typeLabel}`}
      </Button>
    </form>
  );
}

function CheckRecordList({
  title,
  records,
  loading,
  error
}: {
  title: string;
  records: CheckRecord[];
  loading: boolean;
  error?: string | null;
}) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="font-semibold text-gray-900">{title}</p>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Đang tải...</p>}
      {!loading && !records.length && !error && (
        <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
      )}
      <div className="space-y-3">
        {records.map((record) => (
          <div key={record.id} className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDateTime(record.createdAt)}</span>
              <StatusBadge status={record.type} />
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {record.address || 'Không rõ địa điểm'}
            </p>
            <div className="mt-2 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
              <span>Số km: {record.mileage ?? '—'}</span>
              <span>Nhiên liệu: {record.fuelLevel != null ? `${record.fuelLevel}%` : '—'}</span>
              <span>
                Tọa độ:{' '}
                {record.latitude != null && record.longitude != null
                  ? `${record.latitude}, ${record.longitude}`
                  : '—'}
              </span>
              <span>Nhân viên: {record.staffName || '—'}</span>
            </div>
            {record.damageNotes && (
              <p className="mt-2 text-xs text-rose-600">Hư hỏng: {record.damageNotes}</p>
            )}
            {record.images?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {record.images.map((image, index) => (
                  <img key={`${image}-${index}`} src={image} alt="Ảnh check" className="h-16 w-16 rounded-md object-cover" />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckRecordSummary({ title, record }: { title: string; record: CheckRecord }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase text-gray-500">{title}</p>
      <p className="text-sm font-semibold text-gray-900">{formatDateTime(record.createdAt)}</p>
      <p className="mt-1 text-sm text-gray-600">{record.address || 'Không rõ địa điểm'}</p>
      <div className="mt-2 grid gap-2 text-xs text-gray-600">
        <span>Số km: {record.mileage ?? '—'}</span>
        <span>Nhiên liệu: {record.fuelLevel != null ? `${record.fuelLevel}%` : '—'}</span>
        <span>
          Tọa độ:{' '}
          {record.latitude != null && record.longitude != null
            ? `${record.latitude}, ${record.longitude}`
            : '—'}
        </span>
        {record.damageNotes && <span className="text-rose-600">Hư hỏng: {record.damageNotes}</span>}
      </div>
    </div>
  );
}
function ExtensionSection({
  bookingId,
  booking,
  isActive,
  onCompleted
}: {
  bookingId?: string;
  booking?: BookingDetailData;
  isActive: boolean;
  onCompleted?: () => void;
}) {
  const extensionState = useExtensionHistory(bookingId, isActive);

  const handleSuccess = () => {
    extensionState.refetch();
    onCompleted?.();
  };

  if (!bookingId) {
    return <p className="text-sm text-gray-500">Chọn booking để gửi yêu cầu gia hạn.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <ExtensionForm bookingId={bookingId} booking={booking} onSuccess={handleSuccess} />
      <ExtensionHistoryList
        records={extensionState.records}
        loading={extensionState.loading}
        error={extensionState.error}
      />
    </div>
  );
}

function ExtensionForm({
  bookingId,
  booking,
  onSuccess
}: {
  bookingId: string;
  booking?: BookingDetailData;
  onSuccess?: () => void;
}) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [form, setForm] = useState({ newEndTime: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      newEndTime: booking?.endTime ? toLocalDateTimeInput(booking.endTime) : ''
    }));
  }, [booking?.endTime, bookingId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.newEndTime) {
      toast.error('Vui lòng chọn thời gian kết thúc mới');
      return;
    }
    if (!apiBase) {
      toast.error('Chưa cấu hình API');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bookingId,
        newEndTime: new Date(form.newEndTime).toISOString(),
        notes: form.notes || undefined
      };
      const response = await fetch(`${apiBase}/extension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      toast.success('Đã gửi yêu cầu gia hạn');
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi yêu cầu gia hạn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border p-4">
      <p className="font-semibold text-gray-900">Gia hạn thuê</p>
      <div>
        <Label htmlFor="extension-time">Thời gian kết thúc mới</Label>
        <Input
          id="extension-time"
          type="datetime-local"
          value={form.newEndTime}
          onChange={(event) => setForm((prev) => ({ ...prev, newEndTime: event.target.value }))}
          min={booking?.endTime ? toLocalDateTimeInput(booking.endTime) : undefined}
        />
      </div>
      <div>
        <Label htmlFor="extension-notes">Ghi chú</Label>
        <Textarea
          id="extension-notes"
          rows={4}
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="Lý do gia hạn, nhu cầu thêm..."
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Đang gửi...' : 'Gửi yêu cầu gia hạn'}
      </Button>
    </form>
  );
}

function ExtensionHistoryList({
  records,
  loading,
  error
}: {
  records: ExtensionRecord[];
  loading: boolean;
  error?: string | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-900">Lịch sử gia hạn</p>
        <Badge variant="outline">{records.length}</Badge>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Đang tải...</p>}
      {!loading && !records.length && !error && (
        <p className="text-sm text-gray-500">Chưa có yêu cầu gia hạn nào.</p>
      )}
      <div className="space-y-3">
        {records.map((record) => (
          <ExtensionHistoryItem
            key={record.id}
            record={record}
            expanded={expandedId === record.id}
            onToggle={() => setExpandedId((prev) => (prev === record.id ? null : record.id))}
          />
        ))}
      </div>
    </div>
  );
}

function ExtensionHistoryItem({
  record,
  expanded,
  onToggle
}: {
  record: ExtensionRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const showPayment = record.status === 'APPROVED';
  return (
    <div
      className={`rounded-lg border border-gray-100 transition hover:shadow-sm ${
        expanded ? 'bg-gray-50' : 'bg-white'
      }`}
    >
      <button type="button" className="w-full text-left p-3" onClick={onToggle}>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDateTime(record.createdAt)}</span>
          <StatusBadge status={record.status} />
        </div>
        <p className="mt-1 text-sm font-semibold text-gray-900">
          Kết thúc mới: {formatDateTime(record.newEndTime)}
        </p>
        {record.notes && <p className="text-sm text-gray-600 line-clamp-2">Ghi chú: {record.notes}</p>}
      </button>
      {expanded && (
        <div className="border-t border-dashed border-gray-200 px-3 py-3 text-sm text-gray-600 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {record.originalEndTime && (
              <InfoRow label="Kết thúc ban đầu" value={formatDateTime(record.originalEndTime)} />
            )}
            {record.additionalHours && (
              <InfoRow label="Giờ bổ sung" value={`${record.additionalHours} giờ`} />
            )}
            {typeof record.additionalAmount === 'number' && record.additionalAmount > 0 && (
              <InfoRow label="Chi phí gia hạn" value={formatCurrency(record.additionalAmount)} />
            )}
            {record.approvedBy && <InfoRow label="Xử lý bởi" value={record.approvedBy} />}
          </div>
          {record.notes && (
            <p className="rounded-md bg-white/80 p-2 text-sm text-gray-700">Ghi chú: {record.notes}</p>
          )}
          {showPayment ? (
            <ExtensionPaymentNotice extension={record} />
          ) : (
            <p className="text-xs text-gray-500">
              Gia hạn đang ở trạng thái <span className="font-medium">{record.status || '—'}</span>. Thông tin
              thanh toán sẽ xuất hiện sau khi yêu cầu được phê duyệt.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ExtensionPaymentNotice({ extension }: { extension: ExtensionRecord }) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!extension?.id || !apiBase) return;
    const controller = new AbortController();
    const fetchPayment = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase}/payment/${extension.id}`, {
          credentials: 'include',
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        const amountValue =
          Number(payload.amount ?? payload.totalAmount ?? extension.additionalAmount ?? 0) ||
          extension.additionalAmount ||
          0;
        setPayment({
          id: payload.id,
          bookingId: payload.bookingId || extension.bookingId,
          paymentCode: (payload.paymentCode || sanitizePaymentDescription(`EXT${extension.id}`)).toString(),
          amount: amountValue,
          status: payload.status || payload.paymentStatus || 'PENDING',
          createdAt: payload.createdAt || payload.created_at
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Load extension payment error:', err);
        setPayment(null);
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin thanh toán');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchPayment();
    return () => controller.abort();
  }, [apiBase, extension.additionalAmount, extension.bookingId, extension.id]);

  const amount = payment?.amount ?? extension.additionalAmount ?? 0;
  const paymentCode = payment?.paymentCode ?? sanitizePaymentDescription(`EXT${extension.id}`);
  const qrUrl = amount ? buildPaymentQrUrl(amount, paymentCode) : '';

  const copyText = async (value: string, label: string) => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success(`Đã sao chép ${label}`);
    } catch (err) {
      console.error('Copy clipboard failed', err);
      toast.error('Không thể sao chép. Vui lòng thử lại.');
    }
  };

  if (!amount) {
    return <p className="text-xs text-gray-500">Không tìm thấy chi phí gia hạn.</p>;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3 text-sm text-amber-900">
      <div className="flex items-start gap-2">
        <QrCode className="h-4 w-4 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Thanh toán gia hạn</p>
          <p className="text-xs text-amber-700">
            Số tiền cần thanh toán thêm: <span className="font-semibold">{formatCurrency(amount)}</span>
          </p>
          {payment?.status && <p className="text-xs text-amber-700">Trạng thái: {payment.status}</p>}
          {loading && <p className="text-xs text-amber-700">Đang tải thông tin thanh toán...</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <p className="text-xs text-amber-700 mt-1">
            Bạn có thể thanh toán bất cứ lúc nào để áp dụng thời gian mới cho booking.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-amber-200 bg-white p-2">
          <p className="text-[11px] uppercase text-gray-500">Nội dung chuyển khoản</p>
          <p className="font-semibold text-gray-900">{paymentCode}</p>
          <Button
            type="button"
            onClick={() => copyText(paymentCode, 'nội dung chuyển khoản')}
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Sao chép
          </Button>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white p-2">
          <p className="text-[11px] uppercase text-gray-500">Số tiền</p>
          <p className="font-semibold text-gray-900">{formatCurrency(amount)}</p>
          <Button
            type="button"
            onClick={() => copyText(amount.toString(), 'số tiền')}
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Sao chép
          </Button>
        </div>
      </div>
      {qrUrl && (
        <div className="rounded-lg border border-amber-200 bg-white p-2 text-center">
          <p className="text-xs text-gray-500 mb-1">Quét QR để thanh toán</p>
          <img src={qrUrl} alt="QR thanh toán gia hạn" className="mx-auto h-32 w-32 rounded-md border" />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
        Không rõ
      </span>
    );
  }
  const meta = BOOKING_STATUS_STYLES[status.toUpperCase()] || {
    label: status.replace(/_/g, ' '),
    className: 'bg-gray-100 text-gray-600'
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function BookingCostSummary({ booking }: { booking?: BookingDetailData }) {
  if (!booking) return null;
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <p className="text-xs uppercase text-gray-500">Tổng chi phí</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <InfoRow label="Phí thuê" value={formatCurrency(booking.rentalFee)} />
        <InfoRow label="Bảo hiểm" value={formatCurrency(booking.insuranceFee)} />
        <InfoRow label="Tiền cọc" value={formatCurrency(booking.deposit)} />
      </div>
      <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-3">
        <p className="text-sm text-gray-600">Tổng thanh toán</p>
        <p className="text-xl font-semibold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

function PendingPaymentNotice({
  booking,
  fallbackAmount,
  payment,
  loading,
  error
}: {
  booking: BookingDetailData;
  fallbackAmount: number;
  payment: PaymentInfo | null;
  loading: boolean;
  error: string | null;
}) {
  const amount = payment?.amount ?? fallbackAmount;
  const description =
    payment?.paymentCode ?? sanitizePaymentDescription(booking.code || booking.id || 'VEHICLEPAYMENT');
  const qrUrl = buildPaymentQrUrl(amount, description);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!payment?.createdAt) {
      setCountdown(null);
      setExpired(false);
      return;
    }
    const deadline = new Date(payment.createdAt).getTime() + PAYMENT_GRACE_PERIOD_MS;
    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setCountdown('00:00');
        setExpired(true);
      } else {
        setCountdown(formatCountdownClock(diff));
        setExpired(false);
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [payment?.createdAt]);

  const copyText = async (value: string, label: string) => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success(`Đã sao chép ${label}`);
    } catch (error) {
      console.error('Copy clipboard failed', error);
      toast.error('Không thể sao chép. Vui lòng thử lại.');
    }
  };

  // Nếu giao dịch đã hết hạn, chỉ hiển thị thông báo đơn giản
  if (expired) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3 text-red-800">
          <QrCode className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-semibold">Hết hạn thanh toán</p>
            <p className="text-sm">
              Booking đã hết hạn do quá thời gian không thanh toán. Vui lòng tạo booking mới nếu bạn vẫn muốn thuê xe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
      <div className="flex items-start gap-3 text-amber-800">
        <QrCode className="h-5 w-5 mt-0.5" />
        <div>
          <p className="font-semibold">Chờ thanh toán để giữ chỗ</p>
          <p className="text-sm">
            Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới để hoàn tất đặt cọc và giữ chỗ xe. Hệ thống sẽ tự động xác nhận trong vài phút sau khi nhận được thanh toán.
          </p>
          {payment?.status && (
            <p className="text-xs text-amber-700 mt-1">Trạng thái: {payment.status}</p>
          )}
          {loading && (
            <p className="text-xs text-amber-700">Đang tải thông tin thanh toán...</p>
          )}
          {error && (
            <p className="text-xs text-red-600">Không thể tải thông tin thanh toán tự động. Vui lòng dùng thông tin tổng quát bên dưới.</p>
          )}
          {countdown && (
            <p className="text-xs mt-1 text-amber-700">
              Thời gian còn lại: {countdown}
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="space-y-2 text-sm text-amber-900">
          <p>
            Số tiền cần thanh toán:{' '}
            <span className="font-semibold text-amber-900">{formatCurrency(amount)}</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="space-y-1 border border-amber-200 rounded-lg p-3 bg-white">
              <p className="text-xs uppercase text-gray-500">Số tài khoản</p>
              <p className="font-semibold text-gray-900">{PAYMENT_ACCOUNT_NUMBER}</p>
            </div>
            <div className="space-y-1 border border-amber-200 rounded-lg p-3 bg-white">
              <p className="text-xs uppercase text-gray-500">Tên tài khoản</p>
              <p className="font-semibold text-gray-900">{PAYMENT_ACCOUNT_NAME}</p>
            </div>
          </div>
          <div className="space-y-1 border border-amber-200 rounded-lg p-3 bg-white">
            <p className="text-xs uppercase text-gray-500">Nội dung chuyển khoản</p>
            <p className="font-semibold text-gray-900">{description}</p>
          </div>
          <p className="text-xs text-amber-700">
            * Vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống tự động ghi nhận.
          </p>
        </div>
        <div className="bg-white border border-amber-200 rounded-lg p-4 flex flex-col items-center">
          {qrUrl ? (
            <img src={qrUrl} alt="QR thanh toán" className="w-48 h-48 object-contain" />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500 text-center">
              Không thể tạo QR
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Dùng app ngân hàng hoặc ví điện tử để quét mã và thanh toán.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => copyText(PAYMENT_ACCOUNT_NUMBER, 'số tài khoản')}>
          Sao chép STK
        </Button>
        <Button variant="secondary" size="sm" onClick={() => copyText(description, 'nội dung chuyển khoản')}>
          Sao chép nội dung
        </Button>
      </div>
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
        Trước
      </Button>
      <span className="text-gray-500">
        Trang {page}/{Math.max(totalPages, 1)}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        Tiếp
      </Button>
    </div>
  );
}
function useBookingList(page: number, limit: number) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!apiBase) {
        setError('Chưa cấu hình API');
        setLoading(false);
        setBookings([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase}/booking?page=${page}&limit=${limit}`, {
          credentials: 'include',
          signal: options?.signal
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        const rawList = payload.bookings ?? payload.items ?? payload.data ?? payload.results ?? [];
        const list = Array.isArray(rawList) ? rawList.map(mapBookingSummary) : [];
        setBookings(list);
        const totalItems = toNumber(payload.totalItems ?? payload.total) ?? list.length;
        const computedPages = payload.totalPages || (totalItems ? Math.max(1, Math.ceil(totalItems / limit)) : 1);
        setTotalPages(computedPages);
      } catch (err) {
        if (options?.signal?.aborted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách booking');
        setBookings([]);
      } finally {
        if (!options?.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [apiBase, page, limit]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchBookings({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    totalPages,
    refetch: () => fetchBookings()
  };
}

function useRefundList(page: number, limit: number) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [refunds, setRefunds] = useState<RefundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRefunds = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!apiBase) {
        setError('Chưa cấu hình API');
        setLoading(false);
        setRefunds([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase}/refund?page=${page}&limit=${limit}`, {
          credentials: 'include',
          signal: options?.signal
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        const rawList = payload.refunds ?? payload.items ?? payload.data ?? payload.results ?? [];
        const list = Array.isArray(rawList) ? rawList : [];
        setRefunds(list);
        const totalItems = toNumber(payload.totalItems ?? payload.total) ?? list.length;
        const computedPages = payload.totalPages || (totalItems ? Math.max(1, Math.ceil(totalItems / limit)) : 1);
        setTotalPages(computedPages);
      } catch (err) {
        if (options?.signal?.aborted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách hoàn tiền');
        setRefunds([]);
      } finally {
        if (!options?.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [apiBase, page, limit]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchRefunds({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchRefunds]);

  return {
    refunds,
    loading,
    error,
    totalPages,
    refetch: () => fetchRefunds()
  };
}

function useComplaintList(page: number, limit: number) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComplaints = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!apiBase) {
        setError('Chưa cấu hình API');
        setLoading(false);
        setComplaints([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase}/complaint?page=${page}&limit=${limit}`, {
          credentials: 'include',
          signal: options?.signal
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        const rawList = payload.complaints ?? payload.items ?? payload.data ?? payload.results ?? [];
        const list = Array.isArray(rawList) ? rawList : [];
        setComplaints(list);
        const totalItems = toNumber(payload.totalItems ?? payload.total) ?? list.length;
        const computedPages = payload.totalPages || (totalItems ? Math.max(1, Math.ceil(totalItems / limit)) : 1);
        setTotalPages(computedPages);
      } catch (err) {
        if (options?.signal?.aborted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách khiếu nại');
        setComplaints([]);
      } finally {
        if (!options?.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [apiBase, page, limit]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchComplaints({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchComplaints]);

  return {
    complaints,
    loading,
    error,
    totalPages,
    refetch: () => fetchComplaints()
  };
}

function useBookingDetail(bookingId?: string | null) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!bookingId) {
        setBooking(null);
        setLoading(false);
        return;
      }
      if (!apiBase) {
        setError('Chưa cấu hình API');
        setBooking(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase}/booking/${bookingId}`, {
          credentials: 'include',
          signal: options?.signal
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        setBooking(mapBookingDetail(payload));
      } catch (err) {
        if (options?.signal?.aborted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết booking');
        setBooking(null);
      } finally {
        if (!options?.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [apiBase, bookingId]
  );

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetchDetail({ signal: controller.signal });
    return () => controller.abort();
  }, [bookingId, fetchDetail]);

  return {
    booking,
    loading,
    error,
    refetch: () => fetchDetail()
  };
}

function useCheckRecords(bookingId?: string | null, type: CheckType = 'CHECK_IN', enabled = false) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [records, setRecords] = useState<CheckRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!bookingId) {
        setRecords([]);
        setLoading(false);
        return;
      }
      if (!apiBase) {
        setError('Chưa cấu hình API');
        setRecords([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase}/check?bookingId=${bookingId}&type=${type}`, {
          credentials: 'include',
          signal: options?.signal
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        const rawList = payload.items ?? payload.data ?? payload.checks ?? [];
        const mapped = Array.isArray(rawList) ? rawList.map((entry) => mapCheckRecord(entry, type)) : [];
        setRecords(mapped);
      } catch (err) {
        if (options?.signal?.aborted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu check');
        setRecords([]);
      } finally {
        if (!options?.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [apiBase, bookingId, type]
  );

  useEffect(() => {
    if (!enabled || !bookingId) {
      return;
    }
    const controller = new AbortController();
    fetchRecords({ signal: controller.signal });
    return () => controller.abort();
  }, [enabled, bookingId, fetchRecords]);

  useEffect(() => {
    if (!bookingId) {
      setRecords([]);
    }
  }, [bookingId]);

  return {
    records,
    loading,
    error,
    refetch: () => fetchRecords()
  };
}

function useCheckCompletion(bookingId?: string | null, enabled = false) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [data, setData] = useState<CheckCompletion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletion = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!bookingId || !apiBase) {
        setData(null);
        setLoading(false);
        if (!apiBase) setError('Chưa cấu hình API');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase}/check?bookingId=${bookingId}`, {
          credentials: 'include',
          signal: options?.signal
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        const checkIn = payload.checkIn ?? payload.check_in;
        const checkOut = payload.checkOut ?? payload.check_out;
        setData({
          checkIn: checkIn ? mapCheckRecord(checkIn, 'CHECK_IN') : undefined,
          checkOut: checkOut ? mapCheckRecord(checkOut, 'CHECK_OUT') : undefined
        });
      } catch (err) {
        if (options?.signal?.aborted) return;
        setError(err instanceof Error ? err.message : 'Không thể kiểm tra trạng thái check');
        setData(null);
      } finally {
        if (!options?.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [apiBase, bookingId]
  );

  useEffect(() => {
    if (!enabled || !bookingId) {
      return;
    }
    const controller = new AbortController();
    fetchCompletion({ signal: controller.signal });
    return () => controller.abort();
  }, [enabled, bookingId, fetchCompletion]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchCompletion()
  };
}

function useExtensionHistory(bookingId?: string | null, enabled = false) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [records, setRecords] = useState<ExtensionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExtensions = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!bookingId) {
        setRecords([]);
        setLoading(false);
        return;
      }
      if (!apiBase) {
        setError('Chưa cấu hình API');
        setRecords([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase}/extension?bookingId=${bookingId}&page=1&limit=10`, {
          credentials: 'include',
          signal: options?.signal
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }
        const json = await response.json();
        const payload = json.data ?? json;
        const rawList = payload.items ?? payload.data ?? payload.extensions ?? [];
        const mapped = Array.isArray(rawList) ? rawList.map(mapExtensionRecord) : [];
        setRecords(mapped);
      } catch (err) {
        if (options?.signal?.aborted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải lịch sử gia hạn');
        setRecords([]);
      } finally {
        if (!options?.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [apiBase, bookingId]
  );

  useEffect(() => {
    if (!enabled || !bookingId) {
      return;
    }
    const controller = new AbortController();
    fetchExtensions({ signal: controller.signal });
    return () => controller.abort();
  }, [enabled, bookingId, fetchExtensions]);

  useEffect(() => {
    if (!bookingId) {
      setRecords([]);
    }
  }, [bookingId]);

  return {
    records,
    loading,
    error,
    refetch: () => fetchExtensions()
  };
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

function useGeoLocation(options?: { enabled?: boolean; auto?: boolean; useIpFallback?: boolean }) {
  const { enabled = false, auto = true, useIpFallback = false } = options || {};
  const [coords, setCoords] = useState({ latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchIpFallback = useCallback(async () => {
    if (!useIpFallback) return;
    try {
      setUsingFallback(true);
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        throw new Error('Không thể lấy vị trí IP');
      }
      const data = await response.json();
      if (data?.latitude && data?.longitude) {
        setCoords({
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString()
        });
        setError((prev) => (prev ? `${prev} (đang dùng vị trí IP)` : 'Đang dùng vị trí IP'));
      }
    } catch (err) {
      console.error('IP location fallback error:', err);
    } finally {
      setUsingFallback(false);
    }
  }, [useIpFallback]);

  const request = useCallback(() => {
    if (typeof window === 'undefined') {
      setError('Không thể truy cập window');
      return;
    }
    if (!navigator.geolocation) {
      setError('Thiết bị không hỗ trợ GPS');
      fetchIpFallback();
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        fetchIpFallback();
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [fetchIpFallback]);

  useEffect(() => {
    if (enabled && auto) {
      request();
    }
  }, [enabled, auto, request]);

  return { coords, loading, error, refresh: request, usingFallback };
}

function toLocalDateTimeInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function formatCountdownClock(ms: number) {
  const clamped = Math.max(ms, 0);
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa cập nhật';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return 'Chưa cập nhật';
  if (start && !end) return `Từ ${formatDateTime(start)}`;
  if (!start && end) return `Đến ${formatDateTime(end)}`;
  return `${formatDateTime(start)} → ${formatDateTime(end)}`;
}

function calcDurationLabel(start?: string, end?: string) {
  if (!start || !end) return '—';
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '—';
  const diff = Math.max(0, endDate.getTime() - startDate.getTime());
  const totalHours = Math.round(diff / 36e5);
  if (!totalHours) return '<1 giờ';
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (!days) return `${totalHours} giờ`;
  if (!hours) return `${days} ngày`;
  return `${days} ngày ${hours} giờ`;
}

function toImageArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : item.url || item.path || ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') return [value];
  return [];
}

function mapBookingSummary(entry: any): BookingSummary {
  if (!entry) {
    return { id: '' };
  }
  const rawId = entry.id ?? entry.bookingId ?? entry.booking_id ?? entry.code;
  const fallbackId = `${entry.vehicleName ?? entry.vehicle?.name ?? 'booking'}-${
    entry.startTime ?? entry.createdAt ?? Date.now()
  }`;
  const status = (entry.status ?? entry.bookingStatus ?? entry.state ?? '').toString().toUpperCase();
  const startTime = entry.startTime ?? entry.start_time ?? entry.start ?? entry.startDate ?? entry.start_date;
  const endTime = entry.endTime ?? entry.end_time ?? entry.end ?? entry.endDate ?? entry.end_date;

  // Map checkCompletion if available
  let checkCompletion: CheckCompletion | undefined;
  if (entry.checkCompletion || entry.check_completion || entry.checkIn || entry.checkOut) {
    const checkInData = entry.checkCompletion?.checkIn ?? entry.check_completion?.check_in ?? entry.checkIn ?? entry.check_in;
    const checkOutData = entry.checkCompletion?.checkOut ?? entry.check_completion?.check_out ?? entry.checkOut ?? entry.check_out;
    checkCompletion = {
      checkIn: checkInData ? mapCheckRecord(checkInData, 'CHECK_IN') : undefined,
      checkOut: checkOutData ? mapCheckRecord(checkOutData, 'CHECK_OUT') : undefined
    };
  }

  return {
    id: rawId ? String(rawId) : String(fallbackId),
    code: entry.code ?? entry.bookingCode ?? entry.reference ?? entry.booking_code,
    vehicleName: entry.vehicleName ?? entry.vehicle?.name ?? entry.vehicle_name,
     vehicleId: entry.vehicleId ?? entry.vehicle?.id ?? entry.vehicle_id,
    vehicleImage: entry.vehicleImage ?? entry.vehicle?.thumbnail ?? entry.vehicle?.images?.[0],
    status,
    startTime: toDateISOString(startTime),
    endTime: toDateISOString(endTime),
    pickupAddress: entry.pickupAddress ?? entry.pickup_address ?? entry.pickupLocation,
    totalAmount: toNumber(entry.totalAmount ?? entry.pricing?.total ?? entry.total_price),
    checkCompletion
  };
}

function mapBookingDetail(entry: any): BookingDetailData {
  const summary = mapBookingSummary(entry);
  return {
    ...summary,
    rentalFee: toNumber(entry.rentalFee ?? entry.pricing?.rentalFee ?? entry.pricing?.rental),
    insuranceFee: toNumber(entry.insuranceFee ?? entry.pricing?.insuranceFee ?? entry.pricing?.insurance),
    deposit: toNumber(entry.deposit ?? entry.pricing?.deposit),
    notes: entry.notes ?? entry.note ?? entry.customerNotes,
    dropoffAddress: entry.dropoffAddress ?? entry.dropoff_address ?? entry.returnLocation,
    pickupLat: toNumber(entry.pickupLat ?? entry.pickup_lat ?? entry.pickupLatitude),
    pickupLng: toNumber(entry.pickupLng ?? entry.pickup_lng ?? entry.pickupLongitude),
    customerName: entry.customerName ?? entry.customer?.fullName ?? entry.customer?.name,
    customerPhone: entry.customerPhone ?? entry.customer?.phoneNumber ?? entry.customer?.phone,
    hostName: entry.hostName ?? entry.owner?.name ?? entry.partner?.name,
    hostPhone: entry.hostPhone ?? entry.owner?.phone ?? entry.partner?.phone,
    driverLicenseNumber:
      entry.driverLicenseNumber ?? entry.customer?.driverLicenseNumber ?? entry.customer?.licenseNumber
  };
}

function mapTimelineEntry(entry: any): TimelineEntry {
  const action = (entry?.action ?? entry?.status ?? 'UNKNOWN').toString().toUpperCase();
  const id = entry?.id ?? `${action}-${entry?.createdAt ?? entry?.timestamp ?? Math.random()}`;
  return {
    id: String(id),
    action,
    createdAt: toDateISOString(entry?.createdAt ?? entry?.timestamp ?? entry?.time),
    actor: entry?.actor ?? entry?.staffName ?? entry?.user?.fullName,
    notes: entry?.notes ?? entry?.description ?? entry?.message,
    metadata: entry?.metadata ?? entry
  };
}

function mapCheckRecord(entry: any, fallbackType: CheckType): CheckRecord {
  const rawType = (entry?.type ?? entry?.status ?? fallbackType).toString().toUpperCase();
  const normalizedType: CheckType = rawType.includes('OUT') ? 'CHECK_OUT' : 'CHECK_IN';
  return {
    id: String(entry?.id ?? `${normalizedType}-${entry?.createdAt ?? Math.random()}`),
    bookingId: entry?.bookingId ? String(entry.bookingId) : '',
    type: normalizedType,
    address: entry?.address ?? entry?.location ?? entry?.pickupAddress,
    latitude: toNumber(entry?.latitude),
    longitude: toNumber(entry?.longitude),
    mileage: toNumber(entry?.mileage),
    fuelLevel: toNumber(entry?.fuelLevel ?? entry?.fuel_level),
    images: toImageArray(entry?.images ?? entry?.photos),
    damageNotes: entry?.damageNotes ?? entry?.issues ?? entry?.notes,
    damageImages: toImageArray(entry?.damageImages ?? entry?.damage_photos),
    createdAt: toDateISOString(entry?.createdAt ?? entry?.timestamp),
    staffName: entry?.staffName ?? entry?.inspector ?? entry?.user?.fullName,
    verified: entry?.verified ?? false,
    verifiedAt: toDateISOString(entry?.verifiedAt ?? entry?.verified_at)
  };
}

function mapExtensionRecord(entry: any): ExtensionRecord {
  return {
    id: String(entry?.id ?? entry?.requestId ?? entry?.createdAt ?? Math.random()),
    bookingId: entry?.bookingId ? String(entry.bookingId) : '',
    newEndTime: toDateISOString(entry?.newEndTime ?? entry?.requestedEndTime ?? entry?.endTime),
    originalEndTime: toDateISOString(entry?.originalEndTime ?? entry?.previousEndTime ?? entry?.startTime),
    additionalHours: toNumber(entry?.additionalHours ?? entry?.hours),
    additionalAmount: toNumber(entry?.additionalAmount ?? entry?.amount ?? entry?.pricing?.amount),
    status: (entry?.status ?? entry?.state ?? '').toString().toUpperCase(),
    notes: entry?.notes ?? entry?.reason,
    createdAt: toDateISOString(entry?.createdAt ?? entry?.timestamp),
    approvedBy: entry?.approvedBy ?? entry?.handler
  };
}

function getPendingPaymentAmount(booking: BookingDetailData): number {
  const amount =
    booking.deposit ??
    booking.totalAmount ??
    booking.rentalFee ??
    booking.insuranceFee ??
    0;
  return Math.max(Math.round(amount), 0);
}

function buildPaymentQrUrl(amount: number, description: string) {
  if (!amount) return '';
  return `${QR_BASE_URL}?${new URLSearchParams({
    acc: PAYMENT_ACCOUNT_NUMBER,
    bank: PAYMENT_BANK_CODE,
    amount: amount.toString(),
    des: description
  }).toString()}`;
}



type PaymentStreamEvent = {
  id: string;
  paymentCode: string;
  userId?: string;
  message?: string;
  status?: string;
  amount?: number;
  type?: string;
  bookingId?: string;
  receivedAt: string;
  raw?: unknown;
};

const MAX_PAYMENT_EVENTS = 25;

const paymentCurrencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

const isPaymentWsEnabled = () => {
  const flag = (import.meta.env.VITE_ENABLE_WS ?? 'false').toString().toLowerCase();
  return flag === 'true' || flag === '1';
};

const makeEventId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseNumericAmount = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizePaymentPayload = (payload: any): PaymentStreamEvent | null => {
  if (!payload) return null;
  const data = payload.data ?? payload;
  const paymentCode = data.paymentCode || data.code || data.payment?.code || data.payment_code;
  const amount = parseNumericAmount(
    data.amount ??
    data.paymentAmount ??
    data.totalAmount ??
    data.total ??
    data.deposit ??
    data.data?.amount
  );
  const idSource = data.id || data.paymentId || data.payment?.id || paymentCode;

  return {
    id: `${idSource || makeEventId()}-${Date.now()}`,
    paymentCode: (paymentCode || 'UNKNOWN').toString(),
    userId: data.userId || data.user?.id,
    message: data.message || data.description || 'Nhận tín hiệu thanh toán',
    status: data.status || data.paymentStatus || data.message,
    amount,
    type: data.type || data.paymentType || data.payment?.type,
    bookingId: data.bookingId || data.booking?.id,
    receivedAt: new Date().toISOString(),
    raw: data,
  };
};

interface VietQrBank {
  id: number;
  name: string;
  code: string;
  shortName?: string;
  short_name?: string;
  logo?: string;
}

interface BankAccountPayload {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
}

function PaymentTab() {
  const wsSupported = isPaymentWsEnabled();
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [bankAccount, setBankAccount] = useState<BankAccountPayload>({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountHolder: ''
  });
  const [bankAccountId, setBankAccountId] = useState<string | null>(null);
  const [bankUpdatedAt, setBankUpdatedAt] = useState<string | null>(null);
  const [bankAccountLoading, setBankAccountLoading] = useState(false);
  const [bankAccountError, setBankAccountError] = useState<string | null>(null);
  const [bankAccountSaving, setBankAccountSaving] = useState(false);
  const [bankOptions, setBankOptions] = useState<VietQrBank[]>([]);
  const [bankOptionsLoading, setBankOptionsLoading] = useState(true);
  const [bankOptionsError, setBankOptionsError] = useState<string | null>(null);
  const [bankFilter, setBankFilter] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [events, setEvents] = useState<PaymentStreamEvent[]>([]);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>(
    wsSupported ? 'idle' : 'disconnected'
  );
  const [wsError, setWsError] = useState<string | null>(wsSupported ? null : 'WebSocket chưa được bật (VITE_ENABLE_WS).');

  useEffect(() => {
    const controller = new AbortController();
    const fetchBanks = async () => {
      setBankOptionsLoading(true);
      setBankOptionsError(null);
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks', { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        setBankOptions(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setBankOptionsError(error instanceof Error ? error.message : 'Không thể tải danh sách ngân hàng');
      } finally {
        if (!controller.signal.aborted) {
          setBankOptionsLoading(false);
        }
      }
    };
    fetchBanks();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!apiBase) return;
    const controller = new AbortController();
    const fetchAccount = async () => {
      setBankAccountLoading(true);
      setBankAccountError(null);
      try {
        const response = await fetch(`${apiBase}/user/bank-account`, {
          credentials: 'include',
          signal: controller.signal
        });
        if (response.status === 404) {
          setBankAccountId(null);
          setBankUpdatedAt(null);
          setBankAccount({
            bankName: '',
            bankCode: '',
            accountNumber: '',
            accountHolder: ''
          });
          return;
        }
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }
        const json = await response.json();
        const data = json.data ?? json;
        setBankAccount({
          bankName: data.bankName ?? '',
          bankCode: data.bankCode ?? '',
          accountNumber: data.accountNumber ?? '',
          accountHolder: data.accountHolder ?? ''
        });
        setBankAccountId(data.id ?? null);
        setBankUpdatedAt(data.updatedAt ?? data.createdAt ?? null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setBankAccountError(error instanceof Error ? error.message : 'Không thể tải thông tin ví');
      } finally {
        if (!controller.signal.aborted) {
          setBankAccountLoading(false);
        }
      }
    };
    fetchAccount();
    return () => controller.abort();
  }, [apiBase]);

  const filteredBanks = useMemo(() => {
    const keyword = bankFilter.trim().toLowerCase();
    if (!keyword) return bankOptions;
    return bankOptions.filter((bank) => {
      const name = bank.name?.toLowerCase() || '';
      const shortName = bank.shortName?.toLowerCase() || bank.short_name?.toLowerCase() || '';
      const code = bank.code?.toLowerCase() || '';
      return name.includes(keyword) || shortName.includes(keyword) || code.includes(keyword);
    });
  }, [bankOptions, bankFilter]);

  const handleSelectBank = (code: string) => {
    const selected = bankOptions.find((bank) => bank.code === code);
    setBankAccount((prev) => ({
      ...prev,
      bankCode: code,
      bankName: selected?.name ?? prev.bankName
    }));
  };

  const handleBankFieldChange = (field: keyof BankAccountPayload) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setBankAccount((prev) => ({ ...prev, [field]: value }));
  };

  const formattedUpdatedAt = useMemo(() => {
    if (!bankUpdatedAt) return null;
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(bankUpdatedAt));
    } catch {
      return bankUpdatedAt;
    }
  }, [bankUpdatedAt]);

  const handleSaveBankAccount = async () => {
    if (!apiBase) {
      toast.error('Chưa cấu hình API');
      return;
    }
    if (!bankAccount.bankCode || !bankAccount.accountNumber || !bankAccount.accountHolder) {
      toast.error('Vui lòng chọn ngân hàng và nhập đủ số tài khoản, tên chủ tài khoản');
      return;
    }
    setBankAccountSaving(true);
    try {
      const response = await fetch(`${apiBase}/user/bank-account`, {
        method: bankAccountId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(bankAccount)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      const json = await response.json().catch(() => ({}));
      const data = json.data ?? json;
      if (data) {
        setBankAccount({
          bankName: data.bankName ?? bankAccount.bankName,
          bankCode: data.bankCode ?? bankAccount.bankCode,
          accountNumber: data.accountNumber ?? bankAccount.accountNumber,
          accountHolder: data.accountHolder ?? bankAccount.accountHolder
        });
        setBankAccountId(data.id ?? bankAccountId);
        setBankUpdatedAt(data.updatedAt ?? new Date().toISOString());
      }
      toast.success(bankAccountId ? 'Đã cập nhật ví' : 'Đã lưu ví');
    } catch (error) {
      console.error('Save bank account failed:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể lưu thông tin ví');
    } finally {
      setBankAccountSaving(false);
    }
  };

  useEffect(() => {
    if (!wsSupported) return;

    setConnectionState('connecting');
    const ws = connectPaymentSocket();

    const handleIncoming = (payload: any) => {
      const parsed = normalizePaymentPayload(payload);
      if (!parsed) return;
      setEvents(prev => {
        const next = [parsed, ...prev];
        return next.slice(0, MAX_PAYMENT_EVENTS);
      });
      toast.success(`Đã nhận tín hiệu thanh toán ${parsed.paymentCode}`);
    };

    const unsubOpen = ws.on('open', () => {
      setConnectionState('connected');
      setWsError(null);
    });
    const unsubClose = ws.on('close', () => {
      setConnectionState('disconnected');
    });
    const unsubError = ws.on('error', () => {
      setWsError('Không thể kết nối đến kênh thanh toán. Vui lòng kiểm tra token hoặc URL.');
    });
    const unsubPayment = ws.on('payment', handleIncoming);
    const unsubMessage = ws.on('message', handleIncoming);

    return () => {
      unsubOpen();
      unsubClose();
      unsubError();
      unsubPayment();
      unsubMessage();
      ws.close();
    };
  }, [wsSupported]);

  const copyValue = async (value: string, label: string) => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success(`Đã sao chép ${label}`);
    } catch (error) {
      console.error('Copy clipboard failed', error);
      toast.error('Không thể sao chép. Vui lòng thử lại.');
    }
  };

  const clearEvents = () => setEvents([]);

  const statusMap: Record<'idle' | 'connecting' | 'connected' | 'disconnected', {
    label: string;
    tone: string;
    badge: 'default' | 'secondary' | 'destructive' | 'outline';
  }> = {
    idle: { label: 'Chưa kết nối', tone: 'text-gray-600', badge: 'outline' },
    connecting: { label: 'Đang kết nối', tone: 'text-amber-600', badge: 'secondary' },
    connected: { label: 'Đã kết nối', tone: 'text-green-600', badge: 'default' },
    disconnected: { label: 'Mất kết nối', tone: 'text-red-600', badge: 'destructive' },
  };

  const activeStatus = statusMap[connectionState];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ví</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Lưu thông tin ngân hàng để hệ thống tự động hoàn tiền hoặc xử lý các giao dịch liên quan đến đặt cọc.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet / Bank info */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium">Tài khoản ngân hàng nhận hoàn tiền</h3>
              <p className="text-sm text-gray-600">
                Chỉ lưu nội bộ, chúng tôi dùng thông tin này khi cần pay-out hoặc hoàn cọc.
              </p>
            </div>
            {formattedUpdatedAt && (
              <p className="text-xs text-gray-500">Cập nhật: {formattedUpdatedAt}</p>
            )}
          </div>
          {bankAccountError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              {bankAccountError}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="relative">
                <Label htmlFor="bankFilter">Tìm ngân hàng</Label>
                <Input
                  id="bankFilter"
                  placeholder="Nhập mã, tên ngân hàng (VD: VCB, BIDV...)"
                  value={bankFilter}
                  onChange={(event) => setBankFilter(event.target.value)}
                  className="mt-1"
                  disabled={bankOptionsLoading}
                />
                {/* Dropdown suggestions */}
                {bankFilter.trim() && filteredBanks.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredBanks.slice(0, 8).map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          handleSelectBank(bank.code);
                          setBankFilter('');
                        }}
                      >
                        <div className="font-medium text-sm">{bank.name}</div>
                        <div className="text-xs text-gray-500">({bank.code})</div>
                      </button>
                    ))}
                    {filteredBanks.length > 8 && (
                      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                        ... và {filteredBanks.length - 8} ngân hàng khác
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label>Chọn ngân hàng</Label>
                {bankOptionsLoading ? (
                  <div className="mt-2 text-sm text-gray-500">Đang tải danh sách ngân hàng...</div>
                ) : (
                  <Select
                    value={bankAccount.bankCode || undefined}
                    onValueChange={handleSelectBank}
                    disabled={bankAccountLoading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn ngân hàng" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {filteredBanks.length > 0 ? (
                        filteredBanks.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code} className="py-2">
                            <div className="flex flex-col">
                              <span className="font-medium">{bank.name}</span>
                              <span className="text-xs text-gray-500">({bank.code})</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__empty" disabled>
                          Không tìm thấy ngân hàng phù hợp
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {bankOptionsError && (
                  <p className="mt-2 text-xs text-rose-600">{bankOptionsError}</p>
                )}
                {bankAccount.bankName && (
                  <p className="mt-2 text-xs text-gray-500">Đã chọn: {bankAccount.bankName}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="accountNumber">Số tài khoản</Label>
                <Input
                  id="accountNumber"
                  placeholder="Nhập số tài khoản"
                  className="mt-1"
                  value={bankAccount.accountNumber}
                  onChange={handleBankFieldChange('accountNumber')}
                  disabled={bankAccountLoading}
                />
              </div>
              <div>
                <Label htmlFor="accountHolder">Tên chủ tài khoản</Label>
                <Input
                  id="accountHolder"
                  placeholder="Nhập tên chủ tài khoản"
                  className="mt-1"
                  value={bankAccount.accountHolder}
                  onChange={handleBankFieldChange('accountHolder')}
                  disabled={bankAccountLoading}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSaveBankAccount} disabled={bankAccountSaving || bankAccountLoading}>
              {bankAccountSaving ? 'Đang lưu...' : 'Lưu thông tin ví'}
            </Button>
            {bankAccountLoading && <span className="text-sm text-gray-500">Đang tải dữ liệu...</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplaintsTab() {
  const LIMIT = 10;
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);

  const { complaints, loading, error, totalPages, refetch } = useComplaintList(page, LIMIT);
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  // Filter complaints based on active tab
  const filteredComplaints = useMemo(() => {
    if (activeTab === 'open') {
      return complaints.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS');
    } else {
      return complaints.filter(c => c.status === 'CLOSED');
    }
  }, [complaints, activeTab]);

  // Reset page when changing tabs
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const handleCreateComplaint = async () => {
    if (!newTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề khiếu nại');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${apiBase}/complaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle.trim() })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      toast.success('Tạo khiếu nại thành công!');
      setNewTitle('');
      setShowCreateForm(false);
      refetch();
    } catch (err) {
      console.error('Create complaint error:', err);
      toast.error(err instanceof Error ? err.message : 'Không thể tạo khiếu nại');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-emerald-100 text-emerald-700">Đang mở</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-amber-100 text-amber-700">Đang xử lý</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Đã đóng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Lịch sử khiếu nại
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo khiếu nại
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-semibold">Không thể tải danh sách khiếu nại</p>
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={refetch}>
                Thử lại
              </Button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'open' | 'closed')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open">Đang mở</TabsTrigger>
            <TabsTrigger value="closed">Đã đóng</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải danh sách khiếu nại...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Không có khiếu nại nào.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((complaint) => (
                  <Card key={complaint.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{complaint.title}</h3>
                          <p className="text-sm text-gray-600">
                            Tạo: {formatVNTime(complaint.createdAt)}
                            {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
                              <> | Cập nhật: {formatVNTime(complaint.updatedAt)}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(complaint.status)}
                          <Link to={`/complaint/${complaint.id}`} state={{ complaint }}>
                            <Button size="sm">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Xem chi tiết
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-4">
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo khiếu nại mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="complaintTitle">Tiêu đề</Label>
                <Input
                  id="complaintTitle"
                  placeholder="Nhập tiêu đề khiếu nại"
                  className="mt-1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={creating}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateComplaint}
                disabled={creating || !newTitle.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo khiếu nại'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function PasswordTab() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    if (passwords.new.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });

      if (response.ok) {
        toast.success('Mật khẩu đã được thay đổi thành công');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi mật khẩu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
          <Input
            id="currentPassword"
            type="password"
            value={passwords.current}
            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <Input
            id="newPassword"
            type="password"
            value={passwords.new}
            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={passwords.confirm}
            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
            className="mt-1"
          />
        </div>

        <Button onClick={handleChangePassword} className="w-full" disabled={isLoading}>
          {isLoading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
        </Button>
      </CardContent>
    </Card>
  );
}
