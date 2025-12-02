/**
 * Timezone utilities for handling Vietnam timezone (UTC+7)
 * 
 * Backend stores all timestamps in UTC.
 * Frontend converts UTC to VN time for display.
 */

export const VN_TIMEZONE_OFFSET = 7 * 60; // VN is UTC+7 (in minutes)

/**
 * Convert UTC time from backend to Vietnam time
 * @param utcString - ISO string in UTC timezone
 * @returns Date object adjusted to Vietnam timezone
 */
export const convertUTCToVN = (utcString: string): Date => {
  const utcDate = new Date(utcString);
  if (isNaN(utcDate.getTime())) {
    return new Date(); // Return current time if invalid
  }
  // Add 7 hours to convert UTC to VN time
  return new Date(utcDate.getTime() + (VN_TIMEZONE_OFFSET * 60 * 1000));
};

/**
 * Convert local Vietnam time to UTC for sending to backend
 * Note: This is typically not needed as backend should create timestamps,
 * but can be useful for client-side timestamp generation
 * @param date - Date object (defaults to current time)
 * @returns ISO string in UTC timezone
 */
export const convertVNToUTC = (date: Date = new Date()): string => {
  // Get the date in VN timezone and convert to UTC
  const vnTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const utcTime = new Date(vnTime.getTime() - (VN_TIMEZONE_OFFSET * 60 * 1000));
  return utcTime.toISOString();
};

/**
 * Convert a Vietnam date/time string to UTC ISO string.
 * Useful when backend expects UTC but user inputs are VN local (e.g. date pickers).
 * @param dateStr - yyyy-MM-dd
 * @param timeStr - HH:mm (defaults 00:00)
 */
export const toUTCFromVNDateTime = (dateStr?: string, timeStr: string = '00:00'): string => {
  if (!dateStr) return '';
  const isoCandidate = new Date(`${dateStr}T${timeStr}:00+07:00`);
  return isNaN(isoCandidate.getTime()) ? '' : isoCandidate.toISOString();
};

/**
 * Format UTC timestamp to Vietnam time string
 * @param timestamp - UTC timestamp string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Vietnam timezone
 */
export const formatVNTime = (
  timestamp?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!timestamp) return '';
  
  const vnDate = convertUTCToVN(timestamp);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
    ...options,
  };
  
  return vnDate.toLocaleString('vi-VN', defaultOptions);
};

/**
 * Format UTC timestamp to Vietnam date string only (no time)
 * @param timestamp - UTC timestamp string
 * @returns Formatted date string in Vietnam timezone
 */
export const formatVNDate = (timestamp?: string): string => {
  if (!timestamp) return '';
  
  const vnDate = convertUTCToVN(timestamp);
  
  return vnDate.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

/**
 * Format UTC timestamp to relative time string (e.g., "2 hours ago")
 * @param timestamp - UTC timestamp string
 * @returns Relative time string in Vietnamese
 */
export const formatRelativeTime = (timestamp?: string): string => {
  if (!timestamp) return '';
  
  const vnDate = convertUTCToVN(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - vnDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return formatVNDate(timestamp);
};
