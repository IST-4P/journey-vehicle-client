// Utility functions for authentication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

    if (response.ok) {
      const result = await response.json();
      
      // Lưu token mới vào localStorage nếu có
      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
      }
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
      
      console.log('Access token refreshed successfully');
      return true;
    } else {
      console.error('Failed to refresh token:', response.status);
      return false;
    }
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

    // Xóa tokens khỏi localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    if (response.ok) {
      console.log('Logout successful');
      return true;
    } else {
      console.error('Logout failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error during logout:', error);
    // Vẫn trả về true vì đã xóa tokens khỏi localStorage
    return true;
  }
};

// Setup automatic token refresh every 5 minutes
export const setupTokenRefresh = (onTokenExpired?: () => void) => {
  // Refresh ngay lập tức khi setup
  refreshAccessToken();
  
  const refreshInterval = setInterval(async () => {
    console.log('Auto refreshing token...');
    const success = await refreshAccessToken();
    
    if (!success && onTokenExpired) {
      // Nếu refresh thất bại, có thể token đã hết hạn hoàn toàn
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