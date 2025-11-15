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
  vehicleImage?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  pickupAddress?: string;
  totalAmount?: number;
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
}

interface ExtensionRecord {
  id: string;
  bookingId: string;
  newEndTime?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  approvedBy?: string;
}

const BOOKING_STATUS_FILTERS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ thanh toán', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đang thuê', value: 'IN_PROGRESS' },
  { label: 'Đã nhận xe', value: 'CHECKED_IN' },
  { label: 'Hoàn tất', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' }
] as const;

const BOOKING_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'Đang thuê', className: 'bg-green-100 text-green-700' },
  IN_USE: { label: 'Đang thuê', className: 'bg-green-100 text-green-700' },
  CHECKED_IN: { label: 'Đã nhận xe', className: 'bg-indigo-100 text-indigo-700' },
  CHECKED_OUT: { label: 'Đã trả xe', className: 'bg-purple-100 text-purple-700' },
  CHECK_IN: { label: 'Check-in', className: 'bg-sky-100 text-sky-700' },
  CHECK_OUT: { label: 'Check-out', className: 'bg-slate-100 text-slate-700' },
  COMPLETED: { label: 'Hoàn tất', className: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-100 text-rose-700' },
  REJECTED: { label: 'Từ chối', className: 'bg-rose-100 text-rose-700' },
  EXTENSION_REQUESTED: { label: 'Gia hạn chờ duyệt', className: 'bg-amber-100 text-amber-700' },
  EXTENSION_APPROVED: { label: 'Gia hạn duyệt', className: 'bg-emerald-100 text-emerald-700' },
  EXTENSION_REJECTED: { label: 'Gia hạn từ chối', className: 'bg-rose-100 text-rose-700' }
};

const HISTORY_ACTION_COPY: Record<string, string> = {
  CREATED: 'Tạo booking',
  DEPOSIT_PAID: 'Đã thanh toán cọc',
  CONFIRMED: 'Chủ xe xác nhận',
  CHECK_IN: 'Khách check-in',
  CHECK_OUT: 'Khách check-out',
  CHECKED_IN: 'Khách check-in',
  CHECKED_OUT: 'Khách check-out',
  EXTENSION_REQUESTED: 'Yêu cầu gia hạn',
  EXTENSION_APPROVED: 'Gia hạn được duyệt',
  EXTENSION_REJECTED: 'Gia hạn bị từ chối',
  CANCELLED: 'Booking bị hủy',
  COMPLETED: 'Hoàn tất chuyến'
};

const BOOKING_LIST_LIMIT = 10;
const HISTORY_PAGE_LIMIT = 10;
interface CheckCompletion {
  checkIn?: CheckRecord;
  checkOut?: CheckRecord;
}
const QR_BASE_URL = 'https://qr.sepay.vn/img';
const PAYMENT_ACCOUNT_NUMBER = import.meta.env.VITE_PAYMENT_ACCOUNT || '0344927528';
const PAYMENT_BANK_CODE = import.meta.env.VITE_PAYMENT_BANK_CODE || 'MB';
const PAYMENT_ACCOUNT_NAME = import.meta.env.VITE_PAYMENT_ACCOUNT_NAME || 'HacMieu Journey';
const PENDING_PAYMENT_STATUSES = ['PENDING', 'PENDING_PAYMENT', 'WAITING_PAYMENT', 'AWAITING_PAYMENT'];

const sanitizePaymentDescription = (value: string) => {
  if (!value) return 'VEHICLEPAYMENT';
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
};
function HistoryTab() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof BOOKING_STATUS_FILTERS)[number]['value']>('ALL');
  const { bookings, loading, error, totalPages, refetch } = useBookingList(page, BOOKING_LIST_LIMIT);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesKeyword =
        !keyword ||
        booking.vehicleName?.toLowerCase().includes(keyword) ||
        booking.code?.toLowerCase().includes(keyword);
      const normalizedStatus = booking.status?.toUpperCase() || '';
      const matchesStatus =
        statusFilter === 'ALL' ||
        normalizedStatus === statusFilter ||
        (statusFilter === 'IN_PROGRESS' && ['IN_PROGRESS', 'IN_USE'].includes(normalizedStatus));
      return matchesKeyword && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

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
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-semibold">Không thể tải danh sách booking</p>
                <p>{error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={refetch}>
                  Thử lại
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Input
              placeholder="Tìm tên xe, mã booking..."
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

      <div className={isDesktop ? 'grid grid-cols-[32%_1fr] gap-5' : 'space-y-5'}>
        <BookingListPanel
          bookings={filteredBookings}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          selectedId={selectedBookingId}
          onSelect={(id) => setSelectedBookingId(id)}
        />
        <BookingDetailWorkspace bookingId={selectedBookingId} onBookingUpdated={refetch} />
      </div>
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
  onSelect
}: {
  bookings: BookingSummary[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
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
      <div className="flex-1 divide-y overflow-y-auto">
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
          bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              active={booking.id === selectedId}
              onSelect={onSelect}
            />
          ))
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
  onSelect
}: {
  booking: BookingSummary;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(booking.id)}
      className={`flex w-full flex-col gap-2 px-4 py-3 text-left transition ${
        active ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{booking.vehicleName || 'Xe chưa rõ'}</p>
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
  onBookingUpdated
}: {
  bookingId: string | null;
  onBookingUpdated?: () => void;
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

  return (
    <Card className="p-0">
      <div className="border-b p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">Mã booking {booking.code || booking.id}</p>
            <h3 className="text-lg font-semibold text-gray-900">{booking.vehicleName}</h3>
            <p className="text-sm text-gray-500">{formatDateRange(booking.startTime, booking.endTime)}</p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <StatusBadge status={booking.status} />
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
          </div>
        </div>
      </div>
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
    </Card>
  );
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
        <PendingPaymentNotice booking={booking} amount={paymentAmount} />
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
          <div key={record.id} className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDateTime(record.createdAt)}</span>
              <StatusBadge status={record.status} />
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              Kết thúc mới: {formatDateTime(record.newEndTime)}
            </p>
            {record.notes && <p className="text-sm text-gray-600">Ghi chú: {record.notes}</p>}
            {record.approvedBy && <p className="text-xs text-gray-500">Xử lý bởi {record.approvedBy}</p>}
          </div>
        ))}
      </div>
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

function PendingPaymentNotice({ booking, amount }: { booking: BookingDetailData; amount: number }) {
  const description = sanitizePaymentDescription(booking.code || booking.id || 'VEHICLEPAYMENT');
  const qrUrl = buildPaymentQrUrl(amount, description);

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

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
      <div className="flex items-start gap-3 text-amber-800">
        <QrCode className="h-5 w-5 mt-0.5" />
        <div>
          <p className="font-semibold">Đang chờ thanh toán</p>
          <p className="text-sm">
            Quét QR hoặc chuyển khoản theo thông tin bên dưới để hoàn tất giữ chỗ. Giao dịch có thể mất vài phút để xác nhận.
          </p>
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
  return {
    id: rawId ? String(rawId) : String(fallbackId),
    code: entry.code ?? entry.bookingCode ?? entry.reference ?? entry.booking_code,
    vehicleName: entry.vehicleName ?? entry.vehicle?.name ?? entry.vehicle_name,
    vehicleImage: entry.vehicleImage ?? entry.vehicle?.thumbnail ?? entry.vehicle?.images?.[0],
    status,
    startTime: toDateISOString(startTime),
    endTime: toDateISOString(endTime),
    pickupAddress: entry.pickupAddress ?? entry.pickup_address ?? entry.pickupLocation,
    totalAmount: toNumber(entry.totalAmount ?? entry.pricing?.total ?? entry.total_price)
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
    staffName: entry?.staffName ?? entry?.inspector ?? entry?.user?.fullName
  };
}

function mapExtensionRecord(entry: any): ExtensionRecord {
  return {
    id: String(entry?.id ?? entry?.requestId ?? entry?.createdAt ?? Math.random()),
    bookingId: entry?.bookingId ? String(entry.bookingId) : '',
    newEndTime: toDateISOString(entry?.newEndTime ?? entry?.requestedEndTime ?? entry?.endTime),
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

