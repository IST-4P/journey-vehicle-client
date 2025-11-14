import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  User, History, MapPin, CreditCard, MessageSquare, 
  Lock, LogOut, Camera, Star, Eye, Upload, Plus,
  Check, MessageCircle, Activity, Wifi, Copy,
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
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { uploadAvatarImage, uploadLicenseImages } from '../utils/media-upload';
import { connectPaymentSocket } from '../utils/ws-client';

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
    { id: 'addresses', label: 'Địa chỉ của tôi', icon: MapPin, path: '/profile/addresses' },
    { id: 'payment', label: 'Thanh toán/Ví', icon: CreditCard, path: '/profile/payment' },
    { id: 'complaints', label: 'Lịch sử khiếu nại', icon: MessageSquare, path: '/profile/complaints' },
    { id: 'password', label: 'Đổi mật khẩu', icon: Lock, path: '/profile/password' },
    { id: 'logout', label: 'Đăng xuất', icon: LogOut, path: '/logout' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
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
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
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
            <Route path="/addresses" element={<AddressesTab />} />
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
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
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
            <div className="flex gap-2 flex-wrap">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Button onClick={handleSave} className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : 'Lưu thông tin'}
        </Button>

        {/* License Upload Modal */}
        <Dialog open={showLicenseUpload} onOpenChange={setShowLicenseUpload}>
          <DialogContent 
            className="max-w-2xl flex flex-col" 
            style={{ 
              height: '90vh', 
              maxHeight: '90vh',
              overflow: 'hidden'
            }}
          >
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {driver && driver.id ? 'Cập nhật giấy phép lái xe' : 'Xác thực giấy phép lái xe'}
              </DialogTitle>
            </DialogHeader>
            <div 
              className="flex-1 space-y-4 pr-2" 
              style={{ 
                overflowY: 'scroll',
                maxHeight: 'calc(90vh - 120px)',
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
                className="w-full" 
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

interface HistoryItem {
  id: string;
  bookingId: string;
  action: string;
  notes?: string;
  createdAt: string;
}

function HistoryTab() {
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState({ page: 1, totalPages: 1 });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);
  const limit = 10;
  const [refundStatuses, setRefundStatuses] = useState<Record<string, { status: string; amount?: number }>>({});
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId?: string }>({ open: false });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const formatDateTime = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const actionMeta = (action: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      CREATED: { label: 'Đã tạo booking', variant: 'secondary' },
      DEPOSIT_PAID: { label: 'Đã nhận cọc', variant: 'default' },
      PAYMENT_FAILED: { label: 'Thanh toán thất bại', variant: 'destructive' },
      CANCELLED: { label: 'Đã hủy', variant: 'destructive' }
    };
    return map[action] || { label: action.replace(/_/g, ' '), variant: 'outline' };
  };

  const fetchHistories = useCallback(async (targetPage = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiBase}/history?page=${targetPage}&limit=${limit}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      const json = await response.json();
      const payload = json.data || {};
      const list: HistoryItem[] = payload.histories || payload.items || [];
      setHistories(prev => append ? [...prev, ...list] : list);
      setPageInfo({
        page: payload.page || targetPage,
        totalPages: payload.totalPages || payload.total_pages || 1
      });
    } catch (err) {
      console.error('Error fetching histories:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử giao dịch');
      if (!append) setHistories([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, limit]);

  const fetchHistoryDetail = useCallback(async (historyId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await fetch(`${apiBase}/history/${historyId}`, { credentials: 'include' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      const json = await response.json();
      setDetailData(json.data || json);
    } catch (err) {
      console.error('Error fetching history detail:', err);
      setDetailError(err instanceof Error ? err.message : 'Không thể tải chi tiết giao dịch');
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  }, [apiBase]);

  const fetchRefundStatus = useCallback(async (bookingId: string) => {
    if (!bookingId) return;
    try {
      const response = await fetch(`${apiBase}/refund/${bookingId}`, { credentials: 'include' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      const json = await response.json();
      const payload = json.data || json;
      setRefundStatuses((prev) => ({
        ...prev,
        [bookingId]: {
          status: payload.status || 'PENDING',
          amount: payload.amount ?? payload.principal
        }
      }));
    } catch (error) {
      console.error('Error fetching refund status:', error);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchHistories(1, false);
  }, [fetchHistories]);

  const handleLoadMore = () => {
    if (!loading && pageInfo.page < pageInfo.totalPages) {
      fetchHistories(pageInfo.page + 1, true);
    }
  };

  const openHistoryDetail = (history: HistoryItem) => {
    setSelectedHistory(history);
    setDetailOpen(true);
    fetchHistoryDetail(history.id);
    fetchRefundStatus(history.bookingId);
  };

  const closeHistoryDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
    setDetailError(null);
    setSelectedHistory(null);
  };

  const hasMore = pageInfo.page < pageInfo.totalPages;

  const handleCancelBooking = async () => {
    if (!cancelDialog.bookingId) return;
    const reason = cancelReason.trim() || 'User cancelled booking';
    setCancelLoading(true);
    try {
      const response = await fetch(`${apiBase}/booking/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: cancelDialog.bookingId, cancelReason: reason }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      toast.success('Đã gửi yêu cầu hủy booking');
      setCancelDialog({ open: false });
      setCancelReason('');
      setRefundStatuses((prev) => ({
        ...prev,
        [cancelDialog.bookingId!]: { status: 'PENDING' }
      }));
    } catch (error) {
      console.error('Cancel booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể hủy booking');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử giao dịch</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Hiển thị các hoạt động đặt xe mới nhất của bạn (tối đa {limit} mục mỗi trang).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start space-x-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Không thể tải lịch sử</p>
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchHistories(pageInfo.page, false)}>
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {loading && histories.length === 0 && (
          <div className="flex items-center justify-center py-10 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Đang tải lịch sử giao dịch...
          </div>
        )}

        {!loading && histories.length === 0 && !error && (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Bạn chưa có giao dịch nào.
          </div>
        )}

        <div className="space-y-3">
          {histories.map((history) => {
            const meta = actionMeta(history.action);
            const refund = refundStatuses[history.bookingId];
            const canCancel = history.action === 'DEPOSIT_PAID' && !refund && !histories.some((h) => h.bookingId === history.bookingId && h.action === 'CHECKED_IN');
            return (
              <Card key={history.id}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <span className="text-xs text-gray-500">{formatDateTime(history.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {history.notes || 'Không có ghi chú'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Mã booking: <span className="font-mono">{history.bookingId}</span>
                    </p>
                    {canCancel && (
                      <p className="mt-3 text-xs text-gray-600">
                        Cần hủy chuyến? Bạn có thể yêu cầu hoàn cọc ngay bên dưới.
                      </p>
                    )}
                    {refund && (
                      <div className={`mt-3 text-xs font-medium ${refund.status.toUpperCase() === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                        Trạng thái hoàn tiền: {refund.status.toUpperCase()}
                        <span className="block text-[11px] text-gray-500 mt-1">
                          Tiền sẽ được hoàn trong 1-2 ngày làm việc (không tính cuối tuần và ngày lễ).
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Button variant="outline" size="sm" onClick={() => openHistoryDetail(history)}>
                      Chi tiết
                    </Button>
                    {canCancel && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setCancelDialog({ open: true, bookingId: history.bookingId })}
                      >
                        Hủy booking
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {hasMore && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang tải...
              </>
            ) : (
              'Tải thêm'
            )}
          </Button>
        )}
      </CardContent>

      <Dialog open={detailOpen} onOpenChange={(open) => !open && closeHistoryDetail()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết giao dịch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {detailLoading && (
              <div className="flex items-center text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang tải chi tiết...
              </div>
            )}

            {detailError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                {detailError}
              </div>
            )}

            {!detailLoading && !detailError && (
              <>
                <div>
                  <p className="text-gray-500">Hành động</p>
                  <p className="font-medium">{actionMeta(selectedHistory?.action || '').label}</p>
                </div>
                <div>
                  <p className="text-gray-500">Mã giao dịch</p>
                  <p className="font-mono">{selectedHistory?.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Mã booking</p>
                  <p className="font-mono">{selectedHistory?.bookingId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Thời gian</p>
                  <p>{formatDateTime(selectedHistory?.createdAt || '')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ghi chú</p>
                  <p className="text-gray-700">{detailData?.notes || selectedHistory?.notes || 'Không có ghi chú'}</p>
                </div>
                {selectedHistory?.bookingId && refundStatuses[selectedHistory.bookingId] && (
                  <div>
                    <p className="text-gray-500">Trạng thái hoàn tiền</p>
                    <p className={`font-medium ${refundStatuses[selectedHistory.bookingId].status.toUpperCase() === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                      {refundStatuses[selectedHistory.bookingId].status.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tiền sẽ được hoàn trong 1-2 ngày làm việc (trừ Thứ 7, CN và ngày lễ).
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={cancelDialog.open} onOpenChange={(open) => {
        setCancelDialog((prev) => ({ ...prev, open }));
        if (!open) {
          setCancelReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-gray-600">
              Bạn chắc chắn muốn hủy booking <span className="font-mono">{cancelDialog.bookingId}</span>? Tiền cọc sẽ
              được hoàn lại trong 1-2 ngày làm việc (không tính Thứ 7, CN và ngày lễ).
            </p>
            <div>
              <Label htmlFor="historyCancelReason">Lý do hủy (không bắt buộc)</Label>
              <Textarea
                id="historyCancelReason"
                className="mt-2"
                rows={3}
                placeholder="Ví dụ: Thay đổi kế hoạch, đặt nhầm ngày..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" onClick={() => setCancelDialog({ open: false })} disabled={cancelLoading}>
              Đóng
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking} disabled={cancelLoading}>
              {cancelLoading ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AddressesTab() {
  const [addresses] = useState([
    {
      id: '1',
      type: 'home',
      name: 'Nhà riêng',
      address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
      city: 'TP.HCM',
      district: 'Quận 7'
    }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Địa chỉ của tôi
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm địa chỉ
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{address.name}</h3>
                      <Badge variant="outline">{address.type === 'home' ? 'Nhà riêng' : 'Công ty'}</Badge>
                    </div>
                    <p className="text-gray-600">{address.address}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Sửa</Button>
                    <Button variant="outline" size="sm">Xóa</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm địa chỉ mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Loại địa điểm</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn loại địa điểm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Nhà riêng</SelectItem>
                    <SelectItem value="office">Công ty</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="addressName">Tên gợi nhớ</Label>
                <Input id="addressName" placeholder="VD: Nhà bố mẹ" className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Thành phố</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn thành phố" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hcm">TP.HCM</SelectItem>
                      <SelectItem value="hn">Hà Nội</SelectItem>
                      <SelectItem value="dn">Đà Nẵng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Quận/Huyện</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn quận/huyện" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="q1">Quận 1</SelectItem>
                      <SelectItem value="q3">Quận 3</SelectItem>
                      <SelectItem value="q7">Quận 7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="detailAddress">Địa chỉ cụ thể</Label>
                <Input id="detailAddress" placeholder="Số nhà, tên đường..." className="mt-1" />
              </div>

              <Button className="w-full">Thêm địa chỉ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
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

function PaymentTab() {
  const wsSupported = isPaymentWsEnabled();
  const [events, setEvents] = useState<PaymentStreamEvent[]>([]);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>(
    wsSupported ? 'idle' : 'disconnected'
  );
  const [wsError, setWsError] = useState<string | null>(wsSupported ? null : 'WebSocket chưa được bật (VITE_ENABLE_WS).');

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
        <CardTitle>Thanh toán/Ví</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bank Account */}
        <div>
          <h3 className="text-lg font-medium mb-4">Tài khoản ngân hàng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Tên ngân hàng</Label>
              <Input id="bankName" placeholder="VD: Vietcombank" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="accountNumber">Số tài khoản</Label>
              <Input id="accountNumber" placeholder="Nhập số tài khoản" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="accountHolder">Tên chủ tài khoản</Label>
              <Input id="accountHolder" placeholder="Nhập tên chủ tài khoản" className="mt-1" />
            </div>
          </div>
          <Button className="mt-4">Lưu thông tin</Button>
        </div>

        <Separator />

        {/* Pending Payments */}
        <div>
          <h3 className="text-lg font-medium mb-4">Thanh toán chờ xử lý</h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Toyota Camry - Đặt cọc</h4>
                  <p className="text-sm text-gray-600">Ngày tạo: 20/01/2024</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-red-600">500.000đ</div>
                  <Button size="sm" className="mt-1">Thanh toán</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Live Payment Stream */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium">Luồng thanh toán realtime</h3>
                <p className="text-sm text-gray-600">Theo dõi tín hiệu từ WebSocket /payment</p>
              </div>
            </div>
            <Badge variant={activeStatus.badge} className="flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5" />
              {activeStatus.label}
            </Badge>
          </div>

          {wsError && (
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {wsError}
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {wsSupported
                  ? `Hiển thị tối đa ${MAX_PAYMENT_EVENTS} sự kiện mới nhất`
                  : 'Vui lòng bật WebSocket để sử dụng tính năng này.'}
              </p>
              <Button variant="outline" size="sm" onClick={clearEvents} disabled={!events.length}>
                Xóa log
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="text-center text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg py-10">
                  Chưa có tín hiệu thanh toán nào được ghi nhận
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase text-gray-500 tracking-wide">Mã thanh toán</p>
                        <p className="font-semibold text-gray-900">{event.paymentCode}</p>
                      </div>
                      <Badge variant="outline">{event.status || 'MỚI'}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {event.message || 'Nhận tín hiệu thanh toán từ webhook'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      {typeof event.amount === 'number' && (
                        <div>
                          <p className="text-xs uppercase text-gray-500">Giá trị</p>
                          <p className="font-medium text-gray-900">
                            {paymentCurrencyFormatter.format(event.amount)}
                          </p>
                        </div>
                      )}
                      {event.type && (
                        <div>
                          <p className="text-xs uppercase text-gray-500">Loại thanh toán</p>
                          <p className="font-medium text-gray-900">{event.type}</p>
                        </div>
                      )}
                      {event.bookingId && (
                        <div>
                          <p className="text-xs uppercase text-gray-500">Booking</p>
                          <p className="font-medium text-gray-900 truncate">{event.bookingId}</p>
                        </div>
                      )}
                      {event.userId && (
                        <div>
                          <p className="text-xs uppercase text-gray-500">Người dùng</p>
                          <p className="font-medium text-gray-900 truncate">{event.userId}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs uppercase text-gray-500">Thời gian</p>
                        <p className="font-medium text-gray-900">
                          {new Date(event.receivedAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => copyValue(event.paymentCode, 'mã thanh toán')}
                      >
                        <Copy className="h-4 w-4" />
                        Sao chép mã
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => copyValue(JSON.stringify(event.raw, null, 2), 'JSON thanh toán')}
                      >
                        <Copy className="h-4 w-4" />
                        Sao chép JSON
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplaintsTab() {
  const [activeTab, setActiveTab] = useState('open');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const openComplaints = [
    {
      id: '1',
      title: 'Xe không sạch sẽ như mô tả',
      status: 'open',
      createdAt: '2024-01-20',
      lastReply: '2024-01-21'
    },
    {
      id: '3',
      title: 'Xe gặp sự cố kỹ thuật trên đường',
      status: 'open',
      createdAt: '2024-01-22',
      lastReply: '2024-01-22'
    },
    {
      id: '4',
      title: 'Chủ xe không giao xe đúng giờ',
      status: 'open',
      createdAt: '2024-01-23',
      lastReply: '2024-01-23'
    }
  ];

  const closedComplaints = [
    {
      id: '2',
      title: 'Vấn đề về thanh toán',
      status: 'closed',
      createdAt: '2024-01-15',
      resolvedAt: '2024-01-18'
    },
    {
      id: '5',
      title: 'Xe thiếu xăng khi giao',
      status: 'closed',
      createdAt: '2024-01-10',
      resolvedAt: '2024-01-12'
    },
    {
      id: '6',
      title: 'Phí phát sinh không thông báo trước',
      status: 'closed',
      createdAt: '2024-01-05',
      resolvedAt: '2024-01-08'
    }
  ];

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open">Đang mở</TabsTrigger>
            <TabsTrigger value="closed">Đã đóng</TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            <div className="space-y-4">
              {openComplaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{complaint.title}</h3>
                        <p className="text-sm text-gray-600">
                          Tạo: {complaint.createdAt} | Phản hồi cuối: {complaint.lastReply}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">Đang mở</Badge>
                        <Link to={`/complaint/${complaint.id}`}>
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
          </TabsContent>

          <TabsContent value="closed" className="mt-6">
            <div className="space-y-4">
              {closedComplaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{complaint.title}</h3>
                        <p className="text-sm text-gray-600">
                          Tạo: {complaint.createdAt} | Giải quyết: {complaint.resolvedAt}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Đã đóng</Badge>
                        <Link to={`/complaint/${complaint.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Xem
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                <Input id="complaintTitle" placeholder="Nhập tiêu đề khiếu nại" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="complaintDescription">Mô tả chi tiết</Label>
                <Textarea
                  id="complaintDescription"
                  placeholder="Mô tả vấn đề bạn gặp phải..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Hình ảnh đính kèm</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Tải lên hình ảnh liên quan (tùy chọn)</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Chọn file
                  </Button>
                </div>
              </div>

              <Button className="w-full">Tạo khiếu nại</Button>
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
