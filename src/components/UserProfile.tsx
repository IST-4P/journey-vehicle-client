import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  User, History, MapPin, CreditCard, MessageSquare, 
  Lock, LogOut, Camera, Star, Eye, Upload, Plus,
  Check, X, Clock, MessageCircle
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
import { toast } from 'sonner@2.0.3';

interface UserProfileProps {
  user: any;
}

export function UserProfile({ user }: UserProfileProps) {
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('account');

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
                  <AvatarImage src={user.user_metadata?.avatar} />
                  <AvatarFallback>
                    {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{user.user_metadata?.name || user.email}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
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
            <Route path="/account" element={<AccountTab user={user} />} />
            <Route path="/history" element={<HistoryTab />} />
            <Route path="/addresses" element={<AddressesTab />} />
            <Route path="/payment" element={<PaymentTab />} />
            <Route path="/complaints" element={<ComplaintsTab />} />
            <Route path="/password" element={<PasswordTab />} />
            <Route path="/" element={<AccountTab user={user} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function AccountTab({ user }: { user: any }) {
  const [profileData, setProfileData] = useState({
    avatar: user.user_metadata?.avatar || '',
    phone: user.user_metadata?.phone || '',
    email: user.email,
    facebook: '',
    drivingLicense: '',
    licenseNumber: '',
    fullName: user.user_metadata?.name || '',
    dateOfBirth: '',
    verified: false
  });

  const [showLicenseUpload, setShowLicenseUpload] = useState(false);

  const handleSave = () => {
    toast.success('Thông tin đã được cập nhật');
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
              {profileData.fullName?.charAt(0) || profileData.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Thay đổi ảnh
            </Button>
            <p className="text-sm text-gray-600 mt-1">
              JPG, PNG tối đa 5MB
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
          {!profileData.verified ? (
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
            <div className="text-2xl font-bold text-blue-600">100</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <span className="text-sm text-gray-600">Xuất sắc</span>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full md:w-auto">
          Lưu thông tin
        </Button>

        {/* License Upload Modal */}
        <Dialog open={showLicenseUpload} onOpenChange={setShowLicenseUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác thực giấy phép lái xe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="licenseNumber">Số giấy phép lái xe</Label>
                <Input
                  id="licenseNumber"
                  value={profileData.licenseNumber}
                  onChange={(e) => setProfileData({...profileData, licenseNumber: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="licenseFullName">Họ và tên (trên GPLX)</Label>
                <Input
                  id="licenseFullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Ảnh giấy phép lái xe</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Tải lên ảnh GPLX (mặt trước và sau)</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Chọn file
                  </Button>
                </div>
              </div>
              <Button className="w-full">Gửi xác thực</Button>
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
  const [addresses, setAddresses] = useState([
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

  const handleChangePassword = () => {
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

    toast.success('Mật khẩu đã được thay đổi thành công');
    setPasswords({ current: '', new: '', confirm: '' });
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

        <Button onClick={handleChangePassword} className="w-full">
          Đổi mật khẩu
        </Button>
      </CardContent>
    </Card>
  );
}