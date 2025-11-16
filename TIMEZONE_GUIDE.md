# Hướng dẫn xử lý Timezone - Vietnam (UTC+7)

## Vấn đề

Khi user tạo khiếu nại hoặc các dữ liệu có timestamp ở múi giờ Vietnam (UTC+7), nhưng backend lưu trữ theo giờ UTC (Coordinated Universal Time). Điều này dẫn đến việc thời gian hiển thị bị lệch 7 giờ.

## Giải pháp

### 1. Backend - Lưu trữ UTC Time
Backend luôn lưu timestamps theo UTC timezone. Đây là best practice cho việc quản lý thời gian trong hệ thống phân tán.

### 2. Frontend - Hiển thị Vietnam Time

Frontend sẽ chuyển đổi UTC time từ backend sang Vietnam time khi hiển thị.

## Sử dụng Timezone Utilities

Tất cả các utility functions được tập trung trong file `src/utils/timezone.ts`

### Import

```typescript
import { 
  formatVNTime,      // Format timestamp với giờ và phút
  formatVNDate,      // Format chỉ ngày tháng năm
  formatRelativeTime, // Format thời gian tương đối (vd: "2 giờ trước")
  convertUTCToVN,    // Convert UTC Date sang VN Date
  convertVNToUTC     // Convert VN Date sang UTC String (hiếm khi dùng)
} from '../utils/timezone';
```

### Ví dụ sử dụng

#### 1. Hiển thị đầy đủ ngày giờ

```typescript
// Timestamp từ backend (UTC): "2024-11-17T10:00:00.000Z"
// Hiển thị: "17/11/2024, 17:00" (UTC+7)
<p>Tạo lúc: {formatVNTime(complaint.createdAt)}</p>
```

#### 2. Hiển thị chỉ ngày

```typescript
// Timestamp từ backend (UTC): "2024-11-17T10:00:00.000Z"
// Hiển thị: "17/11/2024"
<p>Ngày: {formatVNDate(review.createdAt)}</p>
```

#### 3. Hiển thị thời gian tương đối

```typescript
// Timestamp từ backend (UTC): "2024-11-17T10:00:00.000Z"
// Hiển thị: "2 giờ trước" (nếu hiện tại là 19:00 VN time)
<p>{formatRelativeTime(notification.createdAt)}</p>
```

#### 4. Custom format

```typescript
// Tùy chỉnh format
const customFormat = formatVNTime(timestamp, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
// Hiển thị: "tháng 11 17, 2024, 17:00:00"
```

## Files đã cập nhật

1. ✅ `src/utils/timezone.ts` - Utility functions cho timezone
2. ✅ `src/components/ComplaintDetail.tsx` - Chi tiết khiếu nại
3. ✅ `src/components/Complaint.tsx` - Danh sách khiếu nại
4. ✅ `src/components/UserProfile.tsx` - Profile người dùng
5. ✅ `src/components/VehicleDetail.tsx` - Chi tiết xe
6. ✅ `src/components/EquipmentDetail.tsx` - Chi tiết thiết bị
7. ✅ `src/components/NotificationModal.tsx` - Thông báo

## Lưu ý quan trọng

### ✅ DO (Nên làm)
- Luôn sử dụng `formatVNTime`, `formatVNDate`, hoặc `formatRelativeTime` khi hiển thị timestamp
- Backend lưu trữ theo UTC
- Frontend chỉ convert khi hiển thị

### ❌ DON'T (Không nên)
- Không sử dụng `new Date(timestamp).toLocaleString('vi-VN')` trực tiếp
- Không cần gửi `createdAt` từ frontend lên backend (để backend tự tạo)
- Không convert timezone trước khi gửi lên backend

## Kiểm tra

### Test Manual

1. Tạo một khiếu nại mới
2. Kiểm tra thời gian hiển thị trong danh sách khiếu nại
3. Xem chi tiết khiếu nại và kiểm tra timestamp của messages
4. So sánh với giờ hệ thống của bạn (VN timezone)

### Expected Behavior

- Tất cả thời gian hiển thị phải khớp với giờ địa phương (UTC+7)
- Không có lệch 7 giờ so với thời gian hiện tại
- Format nhất quán trên toàn bộ app

## Tương lai

Nếu cần hỗ trợ multi-timezone:
1. Lưu timezone preference của user trong database
2. Thêm parameter `timezone` vào các format functions
3. Sử dụng library như `date-fns-tz` hoặc `luxon` cho timezone phức tạp

---

**Cập nhật:** 17/11/2024
**Tác giả:** GitHub Copilot
**Múi giờ:** Asia/Ho_Chi_Minh (UTC+7)
