import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * TokenGuardian Component
 * Monitors JWT token expiration and intercepts 401 Unauthorized responses
 * to redirect the user to the login page automatically.
 */
const TokenGuardian = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Helper to clear auth data
    const handleLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Avoid redirect loops if already on login/register/verify
      const publicPaths = ['/login', '/register', '/verify-otp'];
      if (!publicPaths.includes(window.location.pathname)) {
        navigate('/login');
      }
    };

    // 1. Intercept Global Fetch to catch 401s
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // If we get a 401, check if it's token related
        if (response.status === 401) {
          // Clone the response to read it without consuming the original
          const clonedRes = response.clone();
          try {
            const data = await clonedRes.json();
            // Optional: check specific message if needed
            // if (data.message && (data.message.toLowerCase().includes('expired') || data.message.toLowerCase().includes('denied'))) { ... }
            
            // For now, any 401 at an API level usually means we need to re-login
            handleLogout();
          } catch (e) {
            // If it's not JSON, still 401 means auth issue
            handleLogout();
          }
        }
        return response;
      } catch (error) {
        // Network errors or other fetch failures
        throw error;
      }
    };

    // 2. Periodic check for token expiration (even if no API calls are made)
    let isRefreshing = false;
    
    const checkTokenExpiration = () => {
      if (isRefreshing) return;
      
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const buffer = 60; // Try to refresh 60 seconds before expiration
            if (payload.exp && (payload.exp - buffer) < Date.now() / 1000) {
              const refreshToken = localStorage.getItem('refresh_token');
              if (refreshToken) {
                isRefreshing = true;
                originalFetch('/api/user/refresh_token.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refresh_token: refreshToken })
                })
                .then(res => res.json())
                .then(data => {
                  if (data.status === 'success' && data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                    // Also update refresh_token if it was rotated
                    if (data.refresh_token) {
                      localStorage.setItem('refresh_token', data.refresh_token);
                    }
                  } else {
                    handleLogout();
                  }
                })
                .catch(() => handleLogout())
                .finally(() => { isRefreshing = false; });
              } else {
                handleLogout();
              }
            }
          }
        } catch (err) {
          console.error("Token decoding failed", err);
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);
    
    // Initial check on mount
    checkTokenExpiration();

    // Cleanup: restore original fetch and clear interval
    return () => {
      window.fetch = originalFetch;
      clearInterval(interval);
    };
  }, [navigate]);

  return null;
};

export default TokenGuardian;
