import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  User, History, MapPin, CreditCard, MessageSquare, 
  Lock, LogOut, Camera, Star, Eye, Upload, Plus,
  Check, MessageCircle
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { uploadAvatarImage, uploadLicenseImages, debugPostmanFlow } from '../utils/media-upload';
import { debugPresignedUpload } from '../utils/debug-upload';

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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    console.log('🚀 Starting debug upload test...');
                    const result = await debugPresignedUpload();
                    console.log('✅ Debug test completed successfully! URL:', result);
                    toast.success('Debug test thành công! Xem console để biết chi tiết.');
                  } catch (error) {
                    console.error('❌ Debug test failed:', error);
                    toast.error(`Debug test thất bại: ${error}`);
                  }
                }}
              >
                Debug Upload
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  try {
                    console.log('🧪 Testing real avatar upload without reload...');
                    setIsLoading(true);
                    const imageUrl = await uploadAvatarImage(file);
                    console.log('✅ Real avatar upload successful! URL:', imageUrl);
                    toast.success('Upload thành công! Không reload để debug.');
                    setProfileData(prev => ({ ...prev, avatar: imageUrl }));
                  } catch (error) {
                    console.error('❌ Real avatar upload failed:', error);
                    toast.error(`Upload thất bại: ${error}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                id="debug-avatar-upload"
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('debug-avatar-upload')?.click()}
                disabled={isLoading}
              >
                Test Real Upload
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  try {
                    console.log('🔥 Testing EXACT Postman flow...');
                    setIsLoading(true);
                    await debugPostmanFlow(file);
                    console.log('🎉 Postman flow test completed successfully!');
                    toast.success('Postman flow test thành công! Xem console để biết chi tiết.');
                  } catch (error) {
                    console.error('❌ Postman flow test failed:', error);
                    toast.error(`Postman flow test thất bại: ${error}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                id="postman-flow-upload"
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('postman-flow-upload')?.click()}
                disabled={isLoading}
              >
                Test Postman Flow
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

function HistoryTab() {
  const [activeTab, setActiveTab] = useState('active');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showBookingDetail, setShowBookingDetail] = useState(false);

  const activeBookings = [
    {
      id: '1',
      vehicleName: 'Toyota Camry 2023',
      vehicleImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      totalPrice: 1200000,
      status: 'active',
      canCheckIn: true
    }
  ];

  const completedBookings = [
    {
      id: '2',
      vehicleName: 'Honda City 2023',
      vehicleImage: 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=300',
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      totalPrice: 950000,
      status: 'completed',
      rating: 0
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử thuê xe</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Đang thuê</TabsTrigger>
            <TabsTrigger value="completed">Đã thuê</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className="space-y-4">
              {activeBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <ImageWithFallback
                        src={booking.vehicleImage}
                        alt={booking.vehicleName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{booking.vehicleName}</h3>
                        <p className="text-sm text-gray-600">
                          {booking.startDate} - {booking.endDate}
                        </p>
                        <p className="font-medium text-blue-600">
                          {formatPrice(booking.totalPrice)}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Badge variant="default">Đang thuê</Badge>
                        <Button size="sm" onClick={() => setShowBookingDetail(true)}>
                          Chi tiết
                        </Button>
                        {booking.canCheckIn && (
                          <Button size="sm" variant="outline" onClick={() => setShowCheckIn(true)}>
                            Check-in
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="space-y-4">
              {completedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <ImageWithFallback
                        src={booking.vehicleImage}
                        alt={booking.vehicleName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{booking.vehicleName}</h3>
                        <p className="text-sm text-gray-600">
                          {booking.startDate} - {booking.endDate}
                        </p>
                        <p className="font-medium text-blue-600">
                          {formatPrice(booking.totalPrice)}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Badge variant="secondary">Đã hoàn thành</Badge>
                        <Button size="sm" onClick={() => setShowBookingDetail(true)}>
                          Chi tiết
                        </Button>
                        {booking.rating === 0 && (
                          <RatingForm bookingId={booking.id} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Check-in Modal */}
        <Dialog open={showCheckIn} onOpenChange={setShowCheckIn}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check-in xe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Vui lòng chụp 5-6 ảnh xe từ các góc độ khác nhau để ghi nhận tình trạng xe.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Ảnh {index}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Chụp ảnh
                    </Button>
                  </div>
                ))}
              </div>
              <Button className="w-full">Hoàn tất Check-in</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking Detail Modal */}
        <Dialog open={showBookingDetail} onOpenChange={setShowBookingDetail}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chi tiết đặt xe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300"
                  alt="Toyota Camry"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold">Toyota Camry 2023</h3>
                  <p className="text-sm text-gray-600">Biển số: 51G-12345</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Thời gian thuê:</span>
                  <span>20/01/2024 - 22/01/2024</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí thuê xe:</span>
                  <span>1.000.000đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí bảo hiểm:</span>
                  <span>100.000đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Thuế VAT:</span>
                  <span>100.000đ</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Tổng cộng:</span>
                  <span>1.200.000đ</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RatingForm({ bookingId }: { bookingId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmitRating = () => {
    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }
    
    toast.success('Đánh giá đã được gửi thành công');
    setShowForm(false);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
        Đánh giá
      </Button>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh giá chuyến đi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Đánh giá của bạn</Label>
              <div className="flex space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="comment">Nhận xét</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                rows={4}
                className="mt-1"
              />
            </div>

            <Button className="w-full" onClick={handleSubmitRating}>
              Gửi đánh giá
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

function PaymentTab() {
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
