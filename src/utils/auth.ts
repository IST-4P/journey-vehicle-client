// Utility functions for authentication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper: Dispatch token change event (EXPORTED để AuthModal có thể dùng)
export const dispatchTokenChangeEvent = (token: string | null) => {
  if (typeof window !== 'undefined') {
    console.log('[Auth] Dispatching token change event:', token ? 'Token exists' : 'Token removed');

    // FIX: Dispatch event để tất cả listeners có thể nhận được
    window.dispatchEvent(
      new CustomEvent('accessTokenChanged', {
        detail: { token },
      }),
    );

    // FIX: Chỉ dispatch StorageEvent nếu KHÔNG phải cookie auth
    // Cookie auth dùng riêng event 'cookieAuth'
    if (token !== 'COOKIE_AUTH') {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'accessToken',
          newValue: token,
          oldValue: localStorage.getItem('accessToken'),
        }),
      );
    }
  }
};

// Refresh access token
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', response.status);
      return false;
    }

    const result = await response.json();
    const tokens = result?.data ?? result;
    const accessToken =
      tokens?.accessToken ?? tokens?.access_token ?? tokens?.token ?? null;
    const refreshToken =
      tokens?.refreshToken ?? tokens?.refresh_token ?? null;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      console.log('[Auth] Access token updated');
      // FIX: Dispatch event với token mới
      dispatchTokenChangeEvent(accessToken);
    } else {
      // FIX: Cookie-based auth - không có token trong body nhưng vẫn success
      const cookieAuth = localStorage.getItem('cookieAuth');
      if (cookieAuth === 'true') {
        console.log('[Auth] Cookie-based auth refresh successful');
        // Không dispatch event vì cookie auth không thay đổi
      } else {
        // API không trả token và không phải cookie auth -> có thể là lỗi
        dispatchTokenChangeEvent(null);
      }
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    // FIX: Return true nếu response OK (dù có token trong body hay không)
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Logout function
export const logout = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Remove tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('cookieAuth'); // FIX: Also remove cookieAuth flag

    // FIX: Dispatch event để notify các component khác
    dispatchTokenChangeEvent(null);

    if (response.ok) {
      console.log('[Auth] Logout successful');
      return true;
    } else {
      console.error('[Auth] Logout failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[Auth] Error during logout:', error);
    // Vẫn trả về true vì đã xóa tokens từ localStorage
    return true;
  }
};

// Setup automatic token refresh every 5 minutes
export const setupTokenRefresh = (onTokenExpired?: () => void) => {
  // Refresh ngay lập tức khi setup
  refreshAccessToken();
  
  const refreshInterval = setInterval(async () => {
    const success = await refreshAccessToken();
    
    if (!success && onTokenExpired) {
      // Nếu refresh thất bại, có thể token đã hết hạn hoàn toàn
      console.warn('[Auth] Token refresh failed, calling onTokenExpired callback');
      onTokenExpired();
      clearInterval(refreshInterval);
    }
  }, 5 * 60 * 1000); // 5 minutes

  return refreshInterval;
};

// Clear token refresh interval
export const clearTokenRefresh = (intervalId: number) => {
  clearInterval(intervalId);
};