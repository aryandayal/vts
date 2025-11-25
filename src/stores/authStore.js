// stores/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null, // This stores the refresh token string
      isAuthenticated: false,
      tokenExpiry: null,
      isRefreshing: false, // Track if token is being refreshed
      
      // Initialize from cookies
      initializeFromCookies: () => {
        const token = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');
        const userStr = Cookies.get('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            let expiry = null;
            
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              expiry = payload.exp * 1000;
            } catch (e) {
              console.error('Failed to parse token expiry', e);
            }
            
            // Check if token is expired
            if (expiry && Date.now() >= expiry) {
              // Token is expired, clear cookies and state
              Cookies.remove('accessToken');
              Cookies.remove('refreshToken');
              Cookies.remove('user');
              return false;
            }
            
            set({
              user,
              accessToken: token,
              refreshToken,
              isAuthenticated: true,
              tokenExpiry: expiry,
            });
            
            return true;
          } catch (e) {
            console.error('Failed to parse user from cookie', e);
            // Clear cookies if there's an error
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            Cookies.remove('user');
          }
        }
        
        return false;
      },
      
      // Actions
      login: (userData, tokens) => {
        // Calculate token expiration from JWT payload
        let expiry = null;
        try {
          const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
          expiry = payload.exp * 1000; // Convert to milliseconds
        } catch (e) {
          console.error('Failed to parse token expiry', e);
        }
        
        // Set cookies
        Cookies.set('accessToken', tokens.accessToken, { expires: 7 });
        Cookies.set('refreshToken', tokens.refreshToken, { expires: 30 });
        Cookies.set('user', JSON.stringify(userData), { expires: 7 });
        
        set({
          user: userData,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          tokenExpiry: expiry,
        });
      },
      
      logout: () => {
        // Remove cookies
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          tokenExpiry: null,
        });
      },
      
      updateUser: (userData) => {
        set((state) => {
          const updatedUser = { ...state.user, ...userData };
          // Update user cookie
          Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
          
          return {
            user: updatedUser,
          };
        });
      },
      
      setAccessToken: (token) => {
        let expiry = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          expiry = payload.exp * 1000;
        } catch (e) {
          console.error('Failed to parse token expiry', e);
        }
        
        // Update access token cookie
        Cookies.set('accessToken', token, { expires: 7 });
        
        set({ 
          accessToken: token,
          tokenExpiry: expiry,
        });
      },
      
      setRefreshToken: (token) => {
        // Update refresh token cookie
        Cookies.set('refreshToken', token, { expires: 30 });
        set({ refreshToken: token });
      },
      
      // Check if token is expired or about to expire (within 1 minute)
      isTokenExpiredOrExpiring: (threshold = 60000) => { // 60 seconds threshold
        const { tokenExpiry } = get();
        if (!tokenExpiry) return true;
        return Date.now() >= (tokenExpiry - threshold);
      },
      
      // Refresh token function - renamed to avoid conflict
      refreshAccessToken: async () => {
        const { refreshToken: refreshTokenValue, isRefreshing } = get();
        
        // If already refreshing, return the existing promise
        if (isRefreshing) {
          // Wait for the current refresh to complete
          return new Promise((resolve, reject) => {
            const checkRefreshStatus = setInterval(() => {
              const currentState = get();
              if (!currentState.isRefreshing) {
                clearInterval(checkRefreshStatus);
                if (currentState.accessToken) {
                  resolve(currentState.accessToken);
                } else {
                  reject(new Error('Token refresh failed'));
                }
              }
            }, 100);
          });
        }
        
        // Set refreshing flag
        set({ isRefreshing: true });
        
        try {
          const response = await fetch('http://3.109.186.142:3005/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: refreshTokenValue }),
          });

          if (!response.ok) {
            throw new Error('Failed to refresh token');
          }

          const data = await response.json();
          const { accessToken } = data.data;

          // Update the store with the new access token
          get().setAccessToken(accessToken);
          
          // Reset refreshing flag
          set({ isRefreshing: false });
          
          return accessToken;
        } catch (error) {
          // Reset refreshing flag
          set({ isRefreshing: false });
          get().logout();
          throw error;
        }
      },
      
      // Check if user has a specific role
      hasRole: (role) => {
        const { user } = get();
        return user && user.role === role;
      },
      
      // Check if user has any of the specified roles
      hasAnyRole: (roles) => {
        const { user } = get();
        return user && roles.includes(user.role);
      },
      
      // Check authentication status on app load
      checkAuth: () => {
        // Try to initialize from cookies first
        if (get().initializeFromCookies()) {
          return true;
        }
        
        const { accessToken, refreshToken, isTokenExpiredOrExpiring } = get();
        
        if (!accessToken) {
          set({ isAuthenticated: false });
          return false;
        }
        
        if (isTokenExpiredOrExpiring()) {
          if (refreshToken) {
            // Token expired but refresh token available
            // Try to refresh the token
            get().refreshAccessToken().catch(err => {
              console.error('Failed to refresh token during auth check:', err);
              get().logout();
            });
            return false;
          } else {
            // No refresh token, logout
            get().logout();
            return false;
          }
        }
        
        // Token is valid
        set({ isAuthenticated: true });
        return true;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tokenExpiry: state.tokenExpiry,
      }),
      onRehydrateStorage: () => (state) => {
        // When rehydrating, check if the token is still valid
        if (state && state.accessToken && state.tokenExpiry) {
          if (Date.now() >= state.tokenExpiry) {
            // Token is expired, reset state
            return {
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              tokenExpiry: null,
              isRefreshing: false,
            };
          }
        }
        return state;
      },
    }
  )
);