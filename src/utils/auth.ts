const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const dispatchTokenChangeEvent = (token: string | null) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('accessTokenChanged', {
        detail: { token },
      }),
    );
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
  if (typeof window !== 'undefined' && localStorage.getItem('cookieAuth') === 'true') {
    // Verify cookie session is still valid by checking profile endpoint
    try {
      const profileResponse = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      if (profileResponse.ok) {
        return true;
      } else {
        console.error('[Auth] Cookie session invalid, status:', profileResponse.status);
        // Clear cookie auth flag if session is invalid
        localStorage.removeItem('cookieAuth');
        dispatchTokenChangeEvent(null);
        return false;
      }
    } catch (error) {
      console.error('[Auth] Error verifying cookie session:', error);
      return false;
    }
  }

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
      dispatchTokenChangeEvent(accessToken);
    } else {
      const cookieAuth = localStorage.getItem('cookieAuth');
      if (cookieAuth === 'true') {
      } else {
        dispatchTokenChangeEvent(null);
      }
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Logout function
export const logout = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('cookieAuth');
    dispatchTokenChangeEvent(null);

    if (response.ok) {
      return true;
    } else {
      console.error('[Auth] Logout failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[Auth] Error during logout:', error);

    return true;
  }
};

export const setupTokenRefresh = (onTokenExpired?: () => void): number | null => {
  if (typeof window !== 'undefined' && localStorage.getItem('cookieAuth') === 'true') {
    return null;
  }

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
