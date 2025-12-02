import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, CreditCard, Shield, Calendar, MapPin, Users, Fuel, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { connectPaymentSocket } from '../utils/ws-client';

interface PriceBreakdown {
  rentalFee: number;
  insuranceFee: number;
  vat: number;
  deposit: number;
  totalAmount: number;
}

interface PaymentDetails {
  id: string;
  bookingId: string;
  paymentCode: string;
  amount: number;
  status: string;
  createdAt?: string;
}

type StoredBookingSession = {
  bookingId: string;
  paymentCode?: string;
  amount?: number;
  createdAt: number;
};

const QR_BASE_URL = 'https://qr.sepay.vn/img';
const BOOKING_SESSION_STORAGE_KEY = 'hacmieu_vehicle_booking_sessions';
const DRIVER_LICENSE_ERROR_CODE = 'Error.DriverLicenseNotVerified';
const DRIVER_LICENSE_NOT_FOUND_CODE = 'Error.DriverLicenseNotFound';
const DRIVER_LICENSE_ERROR_MESSAGE =
  'Tài khoản chưa xác thực giấy phép lái xe nên không được phép thuê xe. Vui lòng cập nhật GPLX tại trang hồ sơ.';

const PAYMENT_GRACE_PERIOD_MS = 15 * 60 * 1000;

const sanitizeDescription = (value: string) => {
  if (!value) return 'VEHICLEPAYMENT';
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
};

const formatCountdown = (ms: number) => {
  const clamped = Math.max(ms, 0);
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const isPaymentStatusSuccessful = (status?: string, message?: string) => {
  const normalized = (status || '').toUpperCase();
  const normalizedMessage = (message || '').toUpperCase();
  if (!normalized && !normalizedMessage) return false;
  const successTokens = ['PAID', 'SUCCESS', 'COMPLETED', 'APPROVED'];
  return successTokens.some((token) => normalized.includes(token) || normalizedMessage.includes(token));
};

const readStoredSessions = (): Record<string, StoredBookingSession> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(BOOKING_SESSION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const getStoredSessionForVehicle = (vehicleId: string): StoredBookingSession | null => {
  const map = readStoredSessions();
  return map[vehicleId] || null;
};

const persistStoredSession = (vehicleId: string, session: StoredBookingSession | null) => {
  if (typeof window === 'undefined') return;
  const map = readStoredSessions();
  if (session) {
    map[vehicleId] = session;
  } else {
    delete map[vehicleId];
  }
  window.localStorage.setItem(BOOKING_SESSION_STORAGE_KEY, JSON.stringify(map));
};
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

const formatDurationLabel = (hours: number) => {
  const safeHours = Math.max(Math.round(hours), 1);
  const days = Math.floor(safeHours / 24);
  const remainingHours = safeHours % 24;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (remainingHours > 0) parts.push(`${remainingHours} giờ`);
  if (parts.length === 0) return '1 giờ';
  return parts.join(' ');
};

const addHoursToDateTime = (dateStr: string, timeStr: string, hours: number) => {
  const date = new Date(`${dateStr}T${timeStr}:00`);
  date.setHours(date.getHours() + hours);
  return {
    date: date.toISOString().split('T')[0],
    time: date.toTimeString().slice(0, 5)
  };
};

export function BookingProcess() {
  const { vehicleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialVehicle = location.state?.vehicle || null;
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const paymentAccountNumber = import.meta.env.VITE_PAYMENT_ACCOUNT || '0344927528';
  const paymentBankCode = import.meta.env.VITE_PAYMENT_BANK_CODE || 'MB';
  const paymentAccountName = import.meta.env.VITE_PAYMENT_ACCOUNT_NAME || 'HacMieu Journey';

  const initialHoursRef = useRef(location.state?.rentalDuration?.hours ?? location.state?.selectedHours ?? 1);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showQR, setShowQR] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    vehicle: initialVehicle,
    rentalDuration: location.state?.rentalDuration || null,
    startDate: '',
    endDate: '',
    startTime: location.state?.rentalDuration?.startTime || '08:00',
    endTime: location.state?.rentalDuration?.endTime || '08:00',
    pickupLocation: 'self',
    agreementAccepted: false,
    paymentMethod: 'qr'
  });
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(location.state?.priceBreakdown || null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRequestInFlight, setBookingRequestInFlight] = useState(false);
  const [fatalBookingError, setFatalBookingError] = useState<string | null>(null);
  const [driverLicenseChecking, setDriverLicenseChecking] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'waiting' | 'confirmed' | 'failed'>('idle');
  const [paymentDeadline, setPaymentDeadline] = useState<number | null>(null);
  const [paymentCountdown, setPaymentCountdown] = useState<string | null>(null);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [wsStatus, setWsStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [storedSession, setStoredSession] = useState<StoredBookingSession | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const steps = [
    { number: 1, title: 'Xác nhận thông tin', icon: Check },
    { number: 2, title: 'Thanh toán', icon: CreditCard },
    { number: 3, title: 'Hoàn tất', icon: Shield }
  ];

  useEffect(() => {
    if (!paymentDeadline) {
      setPaymentCountdown(null);
      setPaymentExpired(false);
      return;
    }
    const updateCountdown = () => {
      const diff = paymentDeadline - Date.now();
      if (diff <= 0) {
        setPaymentCountdown('00:00');
        setPaymentExpired(true);
      } else {
        setPaymentCountdown(formatCountdown(diff));
        setPaymentExpired(false);
      }
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [paymentDeadline]);

  useEffect(() => {
    if (!bookingData.vehicle) {
      navigate('/');
      return;
    }

    // Set default dates from rental duration or use tomorrow
    if (bookingData.rentalDuration) {
      setBookingData(prev => ({
        ...prev,
        startDate: bookingData.rentalDuration.startDate,
        endDate: bookingData.rentalDuration.endDate,
        startTime: bookingData.rentalDuration.startTime,
        endTime: bookingData.rentalDuration.endTime
      }));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultStartDate = tomorrow.toISOString().split('T')[0];
      const defaultStartTime = '08:00';
      const { date: computedEndDate, time: computedEndTime } = addHoursToDateTime(
        defaultStartDate,
        defaultStartTime,
        initialHoursRef.current
      );
      setBookingData(prev => ({
        ...prev,
        startDate: defaultStartDate,
        endDate: computedEndDate,
        startTime: defaultStartTime,
        endTime: computedEndTime
      }));
    }
  }, []);

  const derivedVehicleId = bookingData.vehicle?.id;
  const rentalHours = Math.max(bookingData.rentalDuration?.hours || initialHoursRef.current, 1);
  const durationLabel = formatDurationLabel(rentalHours);

  const ensureDriverLicenseVerified = useCallback(async () => {
    if (!apiBase) return true;
    setDriverLicenseChecking(true);
    try {
      const response = await fetch(`${apiBase}/user/driver-license`, {
        credentials: 'include'
      });

      if (response.status === 404) {
        throw new Error(DRIVER_LICENSE_ERROR_MESSAGE);
      }

      if (!response.ok) {
        throw new Error(DRIVER_LICENSE_ERROR_MESSAGE);
      }

      const json = await response.json();
      const payload = json.data || json;
      const isVerified =
        payload?.isVerified ??
        payload?.verified ??
        (payload?.status || '').toString().toUpperCase() === 'VERIFIED';

      if (!isVerified) {
        throw new Error(DRIVER_LICENSE_ERROR_MESSAGE);
      }

      setFatalBookingError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : DRIVER_LICENSE_ERROR_MESSAGE;
      setFatalBookingError(message);
      toast.error(message);
      return false;
    } finally {
      setDriverLicenseChecking(false);
    }
  }, [apiBase]);

  const clearSessionState = useCallback(() => {
    if (derivedVehicleId) {
      persistStoredSession(derivedVehicleId, null);
    }
    setStoredSession(null);
  }, [derivedVehicleId]);

  const finalizePaymentSuccess = useCallback(() => {
    setPaymentStatus((prev) => {
      if (prev === 'confirmed') {
        return prev;
      }
      setShowQR(false);
      setCurrentStep(3);
      toast.success('Thanh toán đã được xác nhận!');
      clearSessionState();
      return 'confirmed';
    });
  }, [clearSessionState]);

  useEffect(() => {
    if (storedSession && currentStep === 1) {
      ensureDriverLicenseVerified().then((ok) => {
        if (ok) {
          setCurrentStep(2);
        }
      });
    }
  }, [storedSession, currentStep, ensureDriverLicenseVerified]);

  useEffect(() => {
    if (!derivedVehicleId) return;
    const session = getStoredSessionForVehicle(derivedVehicleId);
    if (session) {
      setStoredSession(session);
      setBookingId(session.bookingId);
      setPaymentStatus('waiting');
    }
  }, [derivedVehicleId]);

  useEffect(() => {
    const targetVehicleId = derivedVehicleId || vehicleId;
    if (!targetVehicleId) return;
    const controller = new AbortController();

    const fetchPrice = async () => {
      try {
        setPriceLoading(true);
        const params = new URLSearchParams({
          vehicleId: targetVehicleId,
          hours: rentalHours.toString()
        });
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/vehicle-price?${params.toString()}`,
          {
            credentials: 'include',
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const payload = json.data || json;
        setPriceBreakdown({
          rentalFee: payload.rentalFee ?? 0,
          insuranceFee: payload.insuranceFee ?? 0,
          vat: payload.vat ?? 0,
          deposit: payload.deposit ?? 0,
          totalAmount: payload.totalAmount ?? 0
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error fetching booking price:', error);
        toast.error('Không thể tính giá thuê, vui lòng thử lại.');
        setPriceBreakdown(null);
      } finally {
        if (!controller.signal.aborted) {
          setPriceLoading(false);
        }
      }
    };

    fetchPrice();
    return () => controller.abort();
  }, [vehicleId, derivedVehicleId, rentalHours]);

  useEffect(() => {
    if (currentStep === 2) {
      if (fatalBookingError) {
        return;
      }

      if (!bookingId && !bookingRequestInFlight) {
        initializePaymentFlow();
      } else if (bookingId && !paymentDetails && !paymentLoading) {
        loadPaymentDetails(bookingId);
      }
    }
  }, [
    currentStep,
    bookingId,
    bookingRequestInFlight,
    paymentDetails,
    paymentLoading,
    fatalBookingError,
  ]);

  useEffect(() => {
    if (currentStep !== 2 || !bookingId || !paymentDetails) {
      setShowQR(false);
      return;
    }
    setShowQR(true);
  }, [currentStep, bookingId, paymentDetails]);

  useEffect(() => {
    if (currentStep !== 2 || !bookingId || paymentStatus !== 'waiting') {
      return;
    }
    const interval = window.setInterval(() => {
      loadPaymentDetails(bookingId, { silent: true });
    }, 900000);
    return () => window.clearInterval(interval);
  }, [currentStep, bookingId, paymentStatus]);

  useEffect(() => {
    if (
      currentStep === 2 &&
      paymentDetails &&
      isPaymentStatusSuccessful(paymentDetails.status)
    ) {
      finalizePaymentSuccess();
    }
  }, [currentStep, paymentDetails, finalizePaymentSuccess]);

  useEffect(() => {
    if (currentStep !== 2 || !bookingId || !paymentDetails) return;

    setWsStatus('connecting');
    const ws = connectPaymentSocket();

    const handleMessage = (payload: any) => {
      const data = payload?.data || payload;
      const eventBookingId = data.bookingId || data.data?.bookingId;
      const eventPaymentCode =
        data.paymentCode || data.data?.paymentCode || data.code || data.data?.code;
      const matchesBooking = Boolean(eventBookingId && eventBookingId === bookingId);
      const matchesPayment =
        Boolean(eventPaymentCode && paymentDetails && eventPaymentCode === paymentDetails.paymentCode);
      if (!matchesBooking && !matchesPayment) {
        return;
      }

      const statusRaw = (data.status || data.paymentStatus || '').toString();
      const messageRaw = (data.message || '').toString();

      if (isPaymentStatusSuccessful(statusRaw, messageRaw)) {
        finalizePaymentSuccess();
      } else if (statusRaw.toUpperCase().includes('PENDING')) {
        setPaymentStatus('waiting');
      }
    };

    const offPayment = ws.on('payment', handleMessage);
    const offMessage = ws.on('message', handleMessage);
    const offOpen = ws.on('open', () => setWsStatus('connected'));
    const offClose = ws.on('close', () => setWsStatus('idle'));
    const offError = ws.on('error', () => setWsStatus('idle'));

    return () => {
      offPayment();
      offMessage();
      offOpen();
      offClose();
      offError();
      ws.close();
    };
  }, [currentStep, bookingId, paymentDetails, finalizePaymentSuccess]);

  const updateRentalDuration = (startDate: string, startTime: string, endDate: string, endTime: string) => {
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(startDate);
      start.setHours(parseInt(startTime.split(':')[0] || '0', 10), parseInt(startTime.split(':')[1] || '0', 10));
      const end = new Date(endDate);
      end.setHours(parseInt(endTime.split(':')[0] || '0', 10), parseInt(endTime.split(':')[1] || '0', 10));
      
      if (end > start) {
        const diffInMs = end.getTime() - start.getTime();
        const hours = Math.ceil(diffInMs / (1000 * 60 * 60));
        const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        
        setBookingData(prev => ({
          ...prev,
          rentalDuration: {
            startDate,
            startTime,
            endDate,
            endTime,
            hours: Math.max(hours, 1),
            days: Math.max(days, 1)
          }
        }));
      }
    }
  };

  const handleStartDateChange = (value: string) => {
    setBookingData(prev => ({ ...prev, startDate: value }));
    updateRentalDuration(value, bookingData.startTime, bookingData.endDate, bookingData.endTime);
  };

  const handleEndDateChange = (value: string) => {
    setBookingData(prev => ({ ...prev, endDate: value }));
    updateRentalDuration(bookingData.startDate, bookingData.startTime, value, bookingData.endTime);
  };

  const handleStartTimeChange = (value: string) => {
    setBookingData(prev => ({ ...prev, startTime: value }));
    updateRentalDuration(bookingData.startDate, value, bookingData.endDate, bookingData.endTime);
  };

  const handleEndTimeChange = (value: string) => {
    setBookingData(prev => ({ ...prev, endTime: value }));
    updateRentalDuration(bookingData.startDate, bookingData.startTime, bookingData.endDate, value);
  };

  const calculatePricing = () => {
    if (!priceBreakdown) return null;

    return {
      basePrice: priceBreakdown.rentalFee,
      insurancePrice: priceBreakdown.insuranceFee,
      vat: priceBreakdown.vat,
      depositAmount: priceBreakdown.deposit,
      total: priceBreakdown.totalAmount - priceBreakdown.deposit,
      totalWithDeposit: priceBreakdown.totalAmount,
      durationLabel
    };
  };

  const createBooking = async () => {
    if (!bookingData.vehicle || !priceBreakdown) {
      throw new Error('Thiếu thông tin xe hoặc giá thuê');
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      throw new Error('Vui lòng chọn ngày thuê xe');
    }

    try {
      // Interpret user times in local timezone, then convert to UTC when posting
      const localStartString = `${bookingData.startDate}T${bookingData.rentalDuration?.startTime || '08:00'}:00`;
      const localEndString = `${bookingData.endDate}T${bookingData.rentalDuration?.endTime || '18:00'}:00`;
      const startDateTime = new Date(localStartString);
      const endDateTime = new Date(localEndString);

      const bookingPayload = {
        vehicleId: bookingData.vehicle.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        pickupAddress: bookingData.vehicle.location,
        pickupLat: bookingData.vehicle.latitude,
        pickupLng: bookingData.vehicle.longitude,
        rentalFee: Math.round(priceBreakdown.rentalFee),
        insuranceFee: Math.round(priceBreakdown.insuranceFee),
        vat: Math.round(priceBreakdown.vat),
        deposit: Math.round(priceBreakdown.deposit),
        totalAmount: Math.round(priceBreakdown.totalAmount),
        notes: `Thuê xe ${bookingData.vehicle.name} - ${bookingData.vehicle.type === 'CAR' ? 'Ô tô' : 'Xe máy'}`
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/booking`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingPayload)
        }
      );

      if (response.ok) {
        const bookingResult = await response.json();
        return bookingResult;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Booking API error:', errorData);
        const serverMessage = errorData?.message || '';
        if (
          serverMessage === DRIVER_LICENSE_ERROR_CODE ||
          serverMessage === DRIVER_LICENSE_NOT_FOUND_CODE ||
          serverMessage?.includes('DriverLicenseNotVerified') ||
          serverMessage?.includes('DriverLicenseNotFound')
        ) {
          throw new Error(DRIVER_LICENSE_ERROR_MESSAGE);
        }
        throw new Error(serverMessage || `Không thể tạo booking (${response.status})`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Có lỗi xảy ra khi tạo booking');
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
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
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success(`Đã sao chép ${label}`);
    } catch (error) {
      console.error('Copy clipboard error:', error);
      toast.error('Không thể sao chép, vui lòng thử lại');
    }
  };

  const loadPaymentDetails = async (id: string, options?: { toastOnError?: boolean; silent?: boolean }) => {
    if (!options?.silent) {
      setPaymentLoading(true);
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/payment/${id}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const payload = json.data || json;

      const amountValue = Number(payload.amount ?? payload.totalAmount ?? 0) || 0;
      const normalizedStatus = (payload.status || payload.paymentStatus || '').toString().toUpperCase();
      const createdAt = payload.createdAt || payload.created_at || new Date().toISOString();
      const hydratedPayment: PaymentDetails = {
        id: payload.id,
        bookingId: payload.bookingId || id,
        paymentCode: (payload.paymentCode || sanitizeDescription(id)).toString(),
        amount: amountValue,
        status: normalizedStatus || 'PENDING',
        createdAt
      };

      const sessionVehicleId = derivedVehicleId || payload.vehicleId || bookingData.vehicle?.id;

      if (isPaymentStatusSuccessful(normalizedStatus)) {
        setPaymentDetails(hydratedPayment);
        setPaymentDeadline(null);
        setPaymentCountdown(null);
        setPaymentExpired(false);
        clearSessionState();
        finalizePaymentSuccess();
        return;
      }

      if (normalizedStatus.includes('EXPIRED') || normalizedStatus.includes('CANCELLED')) {
        setPaymentDetails(null);
        setPaymentStatus('failed');
        setPaymentDeadline(null);
        setPaymentCountdown(null);
        setPaymentExpired(false);
        clearSessionState();
        setBookingId(null);
        setCurrentStep(1);
        toast.error('Giao dịch trước đó đã hết hạn. Vui lòng tạo booking mới.');
        return;
      }

      setPaymentDetails(hydratedPayment);
      const deadline = new Date(createdAt).getTime() + PAYMENT_GRACE_PERIOD_MS;
      setPaymentDeadline(deadline);
      setPaymentExpired(false);
      if (sessionVehicleId) {
        const sessionPayload: StoredBookingSession = {
          bookingId: hydratedPayment.bookingId,
          paymentCode: hydratedPayment.paymentCode,
          amount: hydratedPayment.amount,
          createdAt: Date.now()
        };
        setStoredSession(sessionPayload);
        persistStoredSession(sessionVehicleId, sessionPayload);
      }
      setPaymentStatus('waiting');
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setPaymentDetails(null);
      setPaymentStatus('failed');
      setPaymentDeadline(null);
      setPaymentCountdown(null);
      setPaymentExpired(false);
      if (options?.toastOnError) {
        toast.error('Không thể tải thông tin thanh toán');
      }
    } finally {
      if (!options?.silent) {
        setPaymentLoading(false);
      }
    }
  };

  const initializePaymentFlow = async () => {
    if (!bookingData.vehicle || !priceBreakdown) {
      toast.error('Thiếu thông tin xe hoặc giá.');
      return;
    }

    setBookingRequestInFlight(true);
    setPaymentStatus('waiting');
    try {
      const bookingResult = await createBooking();
      const id = bookingResult?.data?.id || bookingResult?.booking?.id;
      if (!id) {
        throw new Error('Không nhận được mã booking');
      }
      setBookingId(id);
      await loadPaymentDetails(id);
      toast.success('Đã tạo yêu cầu thanh toán. Vui lòng chuyển khoản.');
    } catch (error) {
      console.error('Initialize payment flow error:', error);
      setPaymentStatus('failed');
      if (error instanceof Error && error.message === DRIVER_LICENSE_ERROR_MESSAGE) {
        setFatalBookingError(error.message);
      }
      toast.error(error instanceof Error ? error.message : 'Không thể tạo thanh toán');
    } finally {
      setBookingRequestInFlight(false);
    }
  };

  const handleRefreshPaymentDetails = async () => {
    if (!bookingId) return;
    await loadPaymentDetails(bookingId, { toastOnError: true });
  };

  const handleCancelBooking = async () => {
    if (!bookingId) return;
    const reason = cancelReason.trim() || 'User cancelled booking';
    setCancelLoading(true);
    try {
      const response = await fetch(`${apiBase}/booking/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: bookingId,
          cancelReason: reason,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      toast.success('Đã hủy yêu cầu đặt xe');
      setCancelDialogOpen(false);
      setCancelReason('');
      handleEditInformation();
    } catch (error) {
      console.error('Cancel booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể hủy giao dịch');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleEditInformation = () => {
    setPaymentDetails(null);
    setBookingId(null);
    setPaymentStatus('idle');
    setPaymentDeadline(null);
    setPaymentCountdown(null);
    setPaymentExpired(false);
    setWsStatus('idle');
    setBookingRequestInFlight(false);
    setShowQR(false);
    setCurrentStep(1);
    clearSessionState();
    setFatalBookingError(null);
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!bookingData.startDate || !bookingData.endDate) {
        toast.error('Vui lòng chọn ngày thuê xe');
        return;
      }
      if (!bookingData.agreementAccepted) {
        toast.error('Vui lòng đồng ý với điều khoản sử dụng');
        return;
      }
      if (vehicleHeldByOther) {
        toast.error('Xe đang được giữ chỗ. Vui lòng chọn xe khác hoặc thử lại sau.');
        return;
      }
      const verified = await ensureDriverLicenseVerified();
      if (!verified) return;
      setCurrentStep(2);
    }
  };

  const pricing = calculatePricing();
  const qrAmount = paymentDetails?.amount ?? (pricing ? Math.max(Math.round(pricing.totalWithDeposit), 0) : 0);
  const paymentDescription = paymentDetails?.paymentCode || sanitizeDescription(bookingData.vehicle?.id || bookingId || 'VEHICLEPAYMENT');
  const qrImageUrl = qrAmount > 0
    ? `${QR_BASE_URL}?${new URLSearchParams({
        acc: paymentAccountNumber,
        bank: paymentBankCode,
        amount: qrAmount.toString(),
        des: paymentDescription
      }).toString()}`
    : '';
  const vehicleStatus = (bookingData.vehicle?.status || '').toUpperCase();
  const isVehicleReserved = vehicleStatus === 'RESERVED';
  const hasActiveSession = Boolean(bookingId || storedSession);
  const vehicleHeldByOther = isVehicleReserved && !hasActiveSession;

  const renderPriceSummary = (options?: { sticky?: boolean }) => {
    if (!pricing) return null;
    return (
      <Card className={options?.sticky ? 'lg:sticky lg:top-24' : ''}>
        <CardHeader className="pb-3">
          <CardTitle>Chi tiết giá</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Phí thuê xe ({pricing.durationLabel})</span>
              <span>{formatPrice(pricing.basePrice)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Phí bảo hiểm</span>
              <span>{formatPrice(pricing.insurancePrice)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Thuế VAT</span>
              <span>{formatPrice(pricing.vat)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Tiền cọc</span>
              <span>{formatPrice(pricing.depositAmount)}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between font-semibold">
              <span>Tổng cộng</span>
              <span>{formatPrice(pricing.total)}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between font-bold text-base">
              <span>Tổng thanh toán</span>
              <span className="text-blue-600">{formatPrice(pricing.totalWithDeposit)}</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>* Tiền cọc sẽ được trả lại khi hoàn trả xe</p>
            <p>* Giá đã bao gồm thuế VAT</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!bookingData.vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin xe</h2>
          <p className="text-gray-600 mb-4">Vui lòng quay lại và chọn xe để thuê.</p>
          <Button onClick={() => navigate('/')}>Quay lại trang chủ</Button>
        </div>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Đang tính giá thuê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Đặt xe</h1>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between md:justify-start md:space-x-4 overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 ${
                currentStep >= step.number 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-600'
              }`}>
                {currentStep > step.number ? (
                  <Check className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <step.icon className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </div>
              <span className={`ml-1 md:ml-2 text-xs md:text-sm font-medium whitespace-nowrap ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-4 md:w-12 h-0.5 ml-2 md:ml-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {fatalBookingError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{fatalBookingError}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => navigate('/profile/account')}
            >
              Cập nhật GPLX
            </Button>
            <Button size="sm" variant="outline" onClick={handleEditInformation}>
              Thử lại sau
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main Content */}
        <div>
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Xác nhận thông tin đặt xe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {vehicleHeldByOther && (
                  <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
                    Xe đang được giữ chỗ bởi người dùng khác. Vui lòng chọn xe khác hoặc quay lại sau khi xe được mở lại.
                  </div>
                )}
                {/* Vehicle Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-gray-50 rounded-lg">
                  <ImageWithFallback
                    src={bookingData.vehicle.images[0]}
                    alt={bookingData.vehicle.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{bookingData.vehicle.name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-sm text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="whitespace-nowrap">{bookingData.vehicle.seats} chỗ</span>
                      </div>
                      <div className="flex items-center">
                        <Fuel className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{bookingData.vehicle.consumption}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{bookingData.vehicle.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rental Dates */}
                <div>
                  <h3 className="font-medium mb-3">Thời gian thuê xe</h3>
                  {bookingData.rentalDuration ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Thời lượng:</span>
                          <span className="text-blue-600 font-medium">{durationLabel}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {bookingData.rentalDuration.startDate === bookingData.rentalDuration.endDate ? (
                            <>
                              Thuê ngày {bookingData.rentalDuration.startDate} từ {bookingData.rentalDuration.startTime}
                              {' '}đến {bookingData.rentalDuration.endTime}
                            </>
                          ) : (
                            <>
                              Từ {bookingData.rentalDuration.startDate} {bookingData.rentalDuration.startTime}
                              {' '}đến {bookingData.rentalDuration.endDate} {bookingData.rentalDuration.endTime}
                            </>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setBookingData({...bookingData, rentalDuration: null})}
                      >
                        Thay đổi thời gian
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div>
                            <Label htmlFor="startDate">Ngày bắt đầu</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={bookingData.startDate}
                              onChange={(e) => handleStartDateChange(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="startTime">Giờ bắt đầu</Label>
                            <Input
                              id="startTime"
                              type="time"
                              step={900}
                              value={bookingData.startTime}
                              onChange={(e) => handleStartTimeChange(e.target.value)}
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div>
                            <Label htmlFor="endDate">Ngày kết thúc</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={bookingData.endDate}
                              onChange={(e) => handleEndDateChange(e.target.value)}
                              min={bookingData.startDate}
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="endTime">Giờ kết thúc</Label>
                            <Input
                              id="endTime"
                              type="time"
                              step={900}
                              value={bookingData.endTime}
                              onChange={(e) => handleEndTimeChange(e.target.value)}
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Tổng thời gian dự kiến: {durationLabel}
                      </p>
                    </>
                  )}
                </div>

                {/* Pickup Location */}
                <div>
                  <h3 className="font-medium mb-3">Địa điểm nhận xe</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tôi tự lấy xe</h4>
                        <p className="text-sm text-gray-600">Miễn phí - {bookingData.vehicle.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 opacity-50">
                      <div className="bg-gray-100 p-2 rounded">
                        <span className="text-gray-400">✕</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-500">Nhận xe tận nơi</h4>
                        <p className="text-sm text-gray-400">Xe không hỗ trợ giao tận nơi</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agreement */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreement"
                    checked={bookingData.agreementAccepted}
                    onCheckedChange={(checked: boolean) => setBookingData({...bookingData, agreementAccepted: checked})}
                  />
                  <label htmlFor="agreement" className="text-sm text-gray-600">
                    Tôi đồng ý với{' '}
                    <a href="#" className="text-blue-600 hover:underline">điều khoản sử dụng</a>{' '}
                    và{' '}
                    <a href="#" className="text-blue-600 hover:underline">chính sách bảo mật</a>{' '}
                    của HacMieu Journey
                  </label>
                </div>

                <Button
                  onClick={handleNextStep}
                  className="w-full"
                  disabled={!bookingData.agreementAccepted || vehicleHeldByOther || driverLicenseChecking}
                >
                  Tiếp tục thanh toán
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!showQR ? (
                  <div className="text-center space-y-6 py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    <div>
                      <h3 className="text-lg font-semibold">Đang khởi tạo thanh toán</h3>
                      <p className="text-sm text-gray-600">
                        Hệ thống đang tạo booking và lấy thông tin thanh toán. Vui lòng đợi trong giây lát...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2">Quét mã QR để thanh toán</h3>
                      <p className="text-gray-600">
                        Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã và chuyển khoản đúng nội dung
                      </p>
                    </div>

                    <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
                      <div className="flex flex-col items-center justify-center bg-white border-2 border-gray-200 rounded-lg p-4 w-full max-w-sm mx-auto md:max-w-none md:mx-0">
                        {qrImageUrl ? (
                          <img
                            src={qrImageUrl}
                            alt="QR thanh toán"
                            className="w-48 h-48 object-contain"
                          />
                        ) : (
                          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center text-sm text-gray-500">
                              Không thể tạo QR<br />Vui lòng kiểm tra lại số tiền
                            </div>
                          </div>
                        )}
                        <div className="text-center mt-4 space-y-1">
                          <div className="text-xl font-bold text-blue-600">
                            {paymentDetails
                              ? formatPrice(paymentDetails.amount)
                              : pricing
                                ? formatPrice(pricing.totalWithDeposit)
                                : '…'}
                          </div>
                          <p className="text-xs text-gray-600">
                            Số tiền cần thanh toán
                          </p>
                          {paymentDetails?.status && (
                            <p className={`text-xs font-medium ${paymentExpired ? 'text-red-600' : 'text-gray-700'}`}>
                              Trạng thái: <span className="uppercase">{paymentDetails.status}</span>
                            </p>
                          )}
                          {paymentCountdown && (
                            <p className={`text-xs font-medium ${paymentExpired ? 'text-red-600' : 'text-gray-600'}`}>
                              {paymentExpired
                                ? 'Giao dịch đã hết hạn. Vui lòng tạo lại.'
                                : `Thời gian còn lại: ${paymentCountdown}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                          <div>
                            <p className="text-xs uppercase text-gray-500">Số tài khoản</p>
                            <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
                              <div>
                                <p className="font-semibold text-gray-900">{paymentAccountNumber}</p>
                                <p className="text-sm text-gray-600">{paymentAccountName}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-2"
                                onClick={() => copyToClipboard(paymentAccountNumber, 'số tài khoản')}
                              >
                                <Copy className="h-4 w-4" />
                                <span>Sao chép</span>
                              </Button>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs uppercase text-gray-500">Ngân hàng</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="font-medium text-gray-900">MB Bank ({paymentBankCode})</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs uppercase text-gray-500">Nội dung chuyển khoản</p>
                            <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
                              <p className="font-mono text-sm text-gray-900">{paymentDescription}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-2"
                                onClick={() => copyToClipboard(paymentDescription, 'nội dung chuyển khoản')}
                              >
                                <Copy className="h-4 w-4" />
                                <span>Sao chép</span>
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Hệ thống tự động ghi nhận khi bạn chuyển khoản đúng nội dung này.
                            </p>
                          </div>

                          <div className="p-3 bg-white rounded border border-gray-200 text-xs text-gray-700">
                            Vui lòng kiểm tra kỹ số tiền và nội dung trước khi chuyển khoản. Hệ thống sẽ tự động
                            chuyển sang bước tiếp theo ngay khi ghi nhận thanh toán thành công.
                          </div>
                        </div>

                        {renderPriceSummary()}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-center text-sm text-gray-600">
                        {paymentStatus === 'confirmed'
                          ? 'Hệ thống đã ghi nhận thanh toán. Bạn sẽ được chuyển sang bước tiếp theo.'
                          : 'Sau khi chuyển khoản thành công, hệ thống sẽ tự động xác nhận và chuyển sang bước hoàn tất.'}
                        <br />
                        <span className="text-xs text-gray-500 block mt-1">
                          Trạng thái kết nối:{' '}
                          {paymentStatus === 'confirmed'
                            ? 'Đã xác nhận'
                            : wsStatus === 'connected'
                              ? 'Đang theo dõi thanh toán'
                              : wsStatus === 'connecting'
                                ? 'Đang kết nối...'
                                : 'Mất kết nối, đang thử lại...'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          onClick={handleRefreshPaymentDetails}
                          className="w-full"
                          disabled={paymentLoading || !bookingId}
                        >
                          {paymentLoading ? 'Đang làm mới...' : 'Làm mới trạng thái thanh toán'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleEditInformation}
                          className="w-full"
                        >
                          Chỉnh sửa thông tin đặt xe
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setCancelDialogOpen(true)}
                          className="w-full"
                          disabled={!bookingId}
                        >
                          Hủy giao dịch
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Thanh toán thành công!
                </h2>
                <p className="text-gray-600 mb-6">
                  Đặt xe của bạn đã được xác nhận. Vui lòng đến địa điểm nhận xe đúng giờ.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Mã đặt xe:</span>
                    <span className="font-mono font-medium">BK{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Thời gian thuê:</span>
                    <span>
                      {bookingData.rentalDuration 
                        ? `${bookingData.rentalDuration.startDate} ${bookingData.rentalDuration.startTime} - ${bookingData.rentalDuration.endDate} ${bookingData.rentalDuration.endTime}` 
                        : `${bookingData.startDate} - ${bookingData.endDate}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tổng thời lượng:</span>
                    <span>{pricing.durationLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Địa điểm nhận xe:</span>
                    <span>{bookingData.vehicle.location}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={() => navigate('/profile/history')} className="w-full">
                    Xem lịch sử đặt xe
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                    Về trang chủ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Price Summary */}
        {(!showQR || currentStep !== 2) && (
          <div>
            {renderPriceSummary({ sticky: true })}
          </div>
        )}
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={(open) => {
        setCancelDialogOpen(open);
        if (!open) {
          setCancelReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy giao dịch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn hủy giao dịch này? Việc hủy sẽ giải phóng xe và bạn cần tạo lại booking nếu muốn tiếp tục.
            </p>
            <div>
              <Label htmlFor="cancelReason">Lý do hủy (không bắt buộc)</Label>
              <Textarea
                id="cancelReason"
                placeholder="Nhập lý do hủy để chúng tôi hỗ trợ tốt hơn"
                className="mt-2"
                rows={4}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading}>
              Giữ lại
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking} disabled={cancelLoading || !bookingId}>
              {cancelLoading ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
