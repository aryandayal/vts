// // // utils/api.js
// // import axios from 'axios';
// // import { useAuthStore } from '../stores/authStore';

// // // Create axios instance
// // const api = axios.create({
// //   baseURL: 'http://3.109.186.142:3005/api',
// //   timeout: 10000,
// //   headers: {
// //     'Content-Type': 'application/json',
// //   },
// // });

// // // Track if we're already refreshing the token
// // let isRefreshing = false;
// // let failedQueue = [];

// // const processQueue = (error, token = null) => {
// //   failedQueue.forEach(prom => {
// //     if (error) {
// //       prom.reject(error);
// //     } else {
// //       prom.resolve(token);
// //     }
// //   });
  
// //   failedQueue = [];
// // };

// // // Request interceptor to add auth token
// // api.interceptors.request.use(
// //   async (config) => {
// //     // Skip token for auth endpoints
// //     if (config.url.includes('/auth/')) {
// //       return config;
// //     }
    
// //     // Get the auth store state
// //     const authStore = useAuthStore.getState();
// //     const { accessToken, isAuthenticated, isTokenExpiredOrExpiring, refreshToken } = authStore;
    
// //     if (isAuthenticated && accessToken) {
// //       // Check if token is expired or about to expire (within 1 minute)
// //       if (isTokenExpiredOrExpiring()) {
// //         // If we have a refresh token, try to refresh
// //         if (refreshToken) {
// //           try {
// //             // If we are already refreshing, queue the request
// //             if (isRefreshing) {
// //               return new Promise((resolve, reject) => {
// //                 failedQueue.push({ resolve, reject });
// //               }).then(token => {
// //                 config.headers.Authorization = `Bearer ${token}`;
// //                 return api(config);
// //               }).catch(err => {
// //                 return Promise.reject(err);
// //               });
// //             }
            
// //             // Set refreshing flag
// //             isRefreshing = true;
            
// //             try {
// //               // Check if refreshAccessToken function exists before calling it
// //               if (typeof authStore.refreshAccessToken === 'function') {
// //                 const newToken = await authStore.refreshAccessToken();
                
// //                 // Process queued requests
// //                 processQueue(null, newToken);
                
// //                 // Update the request with the new token
// //                 config.headers.Authorization = `Bearer ${newToken}`;
// //               } else {
// //                 // If refresh function is not available, try to refresh directly
// //                 const response = await api.post('/auth/refresh-token', { refreshToken });
// //                 const { accessToken } = response.data;
                
// //                 // Update the store with the new token
// //                 authStore.setAccessToken(accessToken);
                
// //                 // Process queued requests
// //                 processQueue(null, accessToken);
                
// //                 // Update the request with the new token
// //                 config.headers.Authorization = `Bearer ${accessToken}`;
// //               }
// //             } catch (refreshError) {
// //               // Refresh token failed
// //               processQueue(refreshError, null);
// //               return Promise.reject(refreshError);
// //             } finally {
// //               isRefreshing = false;
// //             }
// //           } catch (error) {
// //             console.error('Error refreshing token:', error);
// //             return Promise.reject(error);
// //           }
// //         } else {
// //           // No refresh token available
// //           return Promise.reject(new Error('No refresh token available'));
// //         }
// //       } else {
// //         // Token is valid, add to headers
// //         config.headers.Authorization = `Bearer ${accessToken}`;
// //       }
// //     }
// //     return config;
// //   },
// //   (error) => {
// //     return Promise.reject(error);
// //   }
// // );

// // // Response interceptor for error handling
// // api.interceptors.response.use(
// //   (response) => response,
// //   async (error) => {
// //     const originalRequest = error.config;
    
// //     // Handle 401 Unauthorized errors
// //     if (error.response?.status === 401 && !originalRequest._retry) {
// //       if (isRefreshing) {
// //         // If already refreshing, queue the request
// //         return new Promise((resolve, reject) => {
// //           failedQueue.push({ resolve, reject });
// //         }).then(token => {
// //           originalRequest.headers.Authorization = `Bearer ${token}`;
// //           return api(originalRequest);
// //         }).catch(err => {
// //           return Promise.reject(err);
// //         });
// //       }
      
// //       originalRequest._retry = true;
// //       isRefreshing = true;
      
// //       const authStore = useAuthStore.getState();
// //       const { refreshToken, logout } = authStore;
      
// //       if (refreshToken) {
// //         try {
// //           // Check if refreshAccessToken function exists before calling it
// //           if (typeof authStore.refreshAccessToken === 'function') {
// //             const response = await api.post('/auth/refresh-token', { refreshToken });
// //             const { accessToken } = response.data;
            
// //             // Update store with new token
// //             authStore.setAccessToken(accessToken);
            
// //             // Process queued requests
// //             processQueue(null, accessToken);
            
// //             // Retry the original request
// //             originalRequest.headers.Authorization = `Bearer ${accessToken}`;
// //             return api(originalRequest);
// //           } else {
// //             // If refresh function is not available, try to refresh directly
// //             const response = await api.post('/auth/refresh-token', { refreshToken });
// //             const { accessToken } = response.data;
            
// //             // Update the store with the new token
// //             authStore.setAccessToken(accessToken);
            
// //             // Process queued requests
// //             processQueue(null, accessToken);
            
// //             // Retry the original request
// //             originalRequest.headers.Authorization = `Bearer ${accessToken}`;
// //             return api(originalRequest);
// //           }
// //         } catch (refreshError) {
// //           // Refresh token failed
// //           processQueue(refreshError, null);
// //           logout();
          
// //           // Only redirect if we're in a browser environment
// //           if (typeof window !== 'undefined') {
// //             window.location.href = '/login';
// //           }
          
// //           return Promise.reject(refreshError);
// //         } finally {
// //           isRefreshing = false;
// //         }
// //       } else {
// //         // No refresh token available
// //         logout();
        
// //         if (typeof window !== 'undefined') {
// //           window.location.href = '/login';
// //         }
        
// //         return Promise.reject(error);
// //       }
// //     }
    
// //     return Promise.reject(error);
// //   }
// // );

// // // Authentication API
// // export const authAPI = {
// //   login: (credentials) => api.post('/auth/login', credentials),
// //   logout: (logoutData) => api.post('/auth/logout', logoutData),
// //   refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
// // };

// // // JSFC Godown API
// // export const jsfcGodownAPI = {
// //   getGodowns: () => api.get('/godowns'),
// //   getGodownById: (godownId) => api.get(`/godowns/${godownId}`),
// //   createGodown: (godownData) => api.post('/godowns', godownData),
// //   updateGodown: (godownId, godownData) => api.put(`/godowns/${godownId}`, godownData),
// //   deleteGodown: (godownId) => api.delete(`/godowns/${godownId}`),
// //   getDeletedGodowns: () => api.get('/godowns/deleted/list'),
// //   restoreGodown: (godownId) => api.post(`/godowns/${godownId}/restore`),
// //   importGodowns: (formData) => api.post('/godowns/import', formData, {
// //     headers: {
// //       'Content-Type': 'multipart/form-data'
// //     }
// //   }),
// // };

// // // Goods API
// // export const goodsAPI = {
// //   getGoods: () => api.get('/logistics/goods'),
// //   getGoodsById: (goodsId) => api.get(`/logistics/goods/${goodsId}`),
// //   createGoods: (goodsData) => api.post('/logistics/goods', goodsData),
// //   updateGoods: (goodsId, goodsData) => api.put(`/logistics/goods/${goodsId}`, goodsData),
// //   deleteGoods: (goodsId) => api.delete(`/logistics/goods/${goodsId}`),
// // };

// // // User Management API
// // export const userAPI = {
// //   getUsers: () => api.get('/users'),
// //   getUserById: (userId) => api.get(`/users/${userId}`),
// //   createUser: (userData) => api.post('/users/create', userData),
// //   updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
// //   deleteUser: (userId) => api.delete(`/users/${userId}`),
// //   changePassword: (userId, passwordData) => api.post(`/users/${userId}/change-password`, passwordData),
// //   disableUser: (userId, reason) => api.post(`/users/${userId}/disable`, { reason }),
// //   enableUser: (userId) => api.post(`/users/${userId}/enable`),
// // };

// // // Profile API
// // export const profileAPI = {
// //   getProfile: () => api.get('/profile'),
// //   updateProfile: (profileData) => api.put('/profile', profileData),
// //   uploadProfileImage: (imageData) => api.post('/profile/image', imageData, {
// //     headers: {
// //       'Content-Type': 'multipart/form-data'
// //     }
// //   }),
// // };

// // export default api;



// // utils/api.js
// import axios from 'axios';
// import { useAuthStore } from '../stores/authStore';

// // Create axios instance
// const api = axios.create({
//   baseURL: 'http://3.109.186.142:3005/api', // Your existing API base URL
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Create a separate axios instance for GPS API
// const gpsApi = axios.create({
//   baseURL: 'http://3.109.186.142:3000/api', // Replace with your GPS API base URL
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Track if we're already refreshing the token
// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach(prom => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });
  
//   failedQueue = [];
// };

// // Request interceptor to add auth token for main API
// api.interceptors.request.use(
//   async (config) => {
//     // Skip token for auth endpoints
//     if (config.url.includes('/auth/')) {
//       return config;
//     }
    
//     // Get the auth store state
//     const authStore = useAuthStore.getState();
//     const { accessToken, isAuthenticated, isTokenExpiredOrExpiring, refreshToken } = authStore;
    
//     if (isAuthenticated && accessToken) {
//       // Check if token is expired or about to expire (within 1 minute)
//       if (isTokenExpiredOrExpiring()) {
//         // If we have a refresh token, try to refresh
//         if (refreshToken) {
//           try {
//             // If we are already refreshing, queue the request
//             if (isRefreshing) {
//               return new Promise((resolve, reject) => {
//                 failedQueue.push({ resolve, reject });
//               }).then(token => {
//                 config.headers.Authorization = `Bearer ${token}`;
//                 return api(config);
//               }).catch(err => {
//                 return Promise.reject(err);
//               });
//             }
            
//             // Set refreshing flag
//             isRefreshing = true;
            
//             try {
//               // Check if refreshAccessToken function exists before calling it
//               if (typeof authStore.refreshAccessToken === 'function') {
//                 const newToken = await authStore.refreshAccessToken();
                
//                 // Process queued requests
//                 processQueue(null, newToken);
                
//                 // Update the request with the new token
//                 config.headers.Authorization = `Bearer ${newToken}`;
//               } else {
//                 // If refresh function is not available, try to refresh directly
//                 const response = await api.post('/auth/refresh-token', { refreshToken });
//                 const { accessToken } = response.data;
                
//                 // Update the store with the new token
//                 authStore.setAccessToken(accessToken);
                
//                 // Process queued requests
//                 processQueue(null, accessToken);
                
//                 // Update the request with the new token
//                 config.headers.Authorization = `Bearer ${accessToken}`;
//               }
//             } catch (refreshError) {
//               // Refresh token failed
//               processQueue(refreshError, null);
//               return Promise.reject(refreshError);
//             } finally {
//               isRefreshing = false;
//             }
//           } catch (error) {
//             console.error('Error refreshing token:', error);
//             return Promise.reject(error);
//           }
//         } else {
//           // No refresh token available
//           return Promise.reject(new Error('No refresh token available'));
//         }
//       } else {
//         // Token is valid, add to headers
//         config.headers.Authorization = `Bearer ${accessToken}`;
//       }
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Request interceptor to add auth token for GPS API
// gpsApi.interceptors.request.use(
//   async (config) => {
//     // Get the auth store state
//     const authStore = useAuthStore.getState();
//     const { accessToken, isAuthenticated, isTokenExpiredOrExpiring, refreshToken } = authStore;
    
//     if (isAuthenticated && accessToken) {
//       // Check if token is expired or about to expire (within 1 minute)
//       if (isTokenExpiredOrExpiring()) {
//         // If we have a refresh token, try to refresh
//         if (refreshToken) {
//           try {
//             // If we are already refreshing, queue the request
//             if (isRefreshing) {
//               return new Promise((resolve, reject) => {
//                 failedQueue.push({ resolve, reject });
//               }).then(token => {
//                 config.headers.Authorization = `Bearer ${token}`;
//                 return gpsApi(config);
//               }).catch(err => {
//                 return Promise.reject(err);
//               });
//             }
            
//             // Set refreshing flag
//             isRefreshing = true;
            
//             try {
//               // Check if refreshAccessToken function exists before calling it
//               if (typeof authStore.refreshAccessToken === 'function') {
//                 const newToken = await authStore.refreshAccessToken();
                
//                 // Process queued requests
//                 processQueue(null, newToken);
                
//                 // Update the request with the new token
//                 config.headers.Authorization = `Bearer ${newToken}`;
//               } else {
//                 // If refresh function is not available, try to refresh directly
//                 const response = await api.post('/auth/refresh-token', { refreshToken });
//                 const { accessToken } = response.data;
                
//                 // Update the store with the new token
//                 authStore.setAccessToken(accessToken);
                
//                 // Process queued requests
//                 processQueue(null, accessToken);
                
//                 // Update the request with the new token
//                 config.headers.Authorization = `Bearer ${accessToken}`;
//               }
//             } catch (refreshError) {
//               // Refresh token failed
//               processQueue(refreshError, null);
//               return Promise.reject(refreshError);
//             } finally {
//               isRefreshing = false;
//             }
//           } catch (error) {
//             console.error('Error refreshing token:', error);
//             return Promise.reject(error);
//           }
//         } else {
//           // No refresh token available
//           return Promise.reject(new Error('No refresh token available'));
//         }
//       } else {
//         // Token is valid, add to headers
//         config.headers.Authorization = `Bearer ${accessToken}`;
//       }
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for error handling for main API
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
    
//     // Handle 401 Unauthorized errors
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         // If already refreshing, queue the request
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then(token => {
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return api(originalRequest);
//         }).catch(err => {
//           return Promise.reject(err);
//         });
//       }
      
//       originalRequest._retry = true;
//       isRefreshing = true;
      
//       const authStore = useAuthStore.getState();
//       const { refreshToken, logout } = authStore;
      
//       if (refreshToken) {
//         try {
//           // Check if refreshAccessToken function exists before calling it
//           if (typeof authStore.refreshAccessToken === 'function') {
//             const response = await api.post('/auth/refresh-token', { refreshToken });
//             const { accessToken } = response.data;
            
//             // Update store with new token
//             authStore.setAccessToken(accessToken);
            
//             // Process queued requests
//             processQueue(null, accessToken);
            
//             // Retry the original request
//             originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//             return api(originalRequest);
//           } else {
//             // If refresh function is not available, try to refresh directly
//             const response = await api.post('/auth/refresh-token', { refreshToken });
//             const { accessToken } = response.data;
            
//             // Update the store with the new token
//             authStore.setAccessToken(accessToken);
            
//             // Process queued requests
//             processQueue(null, accessToken);
            
//             // Retry the original request
//             originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//             return api(originalRequest);
//           }
//         } catch (refreshError) {
//           // Refresh token failed
//           processQueue(refreshError, null);
//           logout();
          
//           // Only redirect if we're in a browser environment
//           if (typeof window !== 'undefined') {
//             window.location.href = '/login';
//           }
          
//           return Promise.reject(refreshError);
//         } finally {
//           isRefreshing = false;
//         }
//       } else {
//         // No refresh token available
//         logout();
        
//         if (typeof window !== 'undefined') {
//           window.location.href = '/login';
//         }
        
//         return Promise.reject(error);
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for error handling for GPS API
// gpsApi.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
    
//     // Handle 401 Unauthorized errors
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         // If already refreshing, queue the request
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then(token => {
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return gpsApi(originalRequest);
//         }).catch(err => {
//           return Promise.reject(err);
//         });
//       }
      
//       originalRequest._retry = true;
//       isRefreshing = true;
      
//       const authStore = useAuthStore.getState();
//       const { refreshToken, logout } = authStore;
      
//       if (refreshToken) {
//         try {
//           // Check if refreshAccessToken function exists before calling it
//           if (typeof authStore.refreshAccessToken === 'function') {
//             const response = await api.post('/auth/refresh-token', { refreshToken });
//             const { accessToken } = response.data;
            
//             // Update store with new token
//             authStore.setAccessToken(accessToken);
            
//             // Process queued requests
//             processQueue(null, accessToken);
            
//             // Retry the original request
//             originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//             return gpsApi(originalRequest);
//           } else {
//             // If refresh function is not available, try to refresh directly
//             const response = await api.post('/auth/refresh-token', { refreshToken });
//             const { accessToken } = response.data;
            
//             // Update the store with new token
//             authStore.setAccessToken(accessToken);
            
//             // Process queued requests
//             processQueue(null, accessToken);
            
//             // Retry the original request
//             originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//             return gpsApi(originalRequest);
//           }
//         } catch (refreshError) {
//           // Refresh token failed
//           processQueue(refreshError, null);
//           logout();
          
//           // Only redirect if we're in a browser environment
//           if (typeof window !== 'undefined') {
//             window.location.href = '/login';
//           }
          
//           return Promise.reject(refreshError);
//         } finally {
//           isRefreshing = false;
//         }
//       } else {
//         // No refresh token available
//         logout();
        
//         if (typeof window !== 'undefined') {
//           window.location.href = '/login';
//         }
        
//         return Promise.reject(error);
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

// // Authentication API
// export const authAPI = {
//   login: (credentials) => api.post('/auth/login', credentials),
//   logout: (logoutData) => api.post('/auth/logout', logoutData),
//   refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
// };

// // JSFC Godown API
// export const jsfcGodownAPI = {
//   getGodowns: () => api.get('/godowns'),
//   getGodownById: (godownId) => api.get(`/godowns/${godownId}`),
//   createGodown: (godownData) => api.post('/godowns', godownData),
//   updateGodown: (godownId, godownData) => api.put(`/godowns/${godownId}`, godownData),
//   deleteGodown: (godownId) => api.delete(`/godowns/${godownId}`),
//   getDeletedGodowns: () => api.get('/godowns/deleted/list'),
//   restoreGodown: (godownId) => api.post(`/godowns/${godownId}/restore`),
//   importGodowns: (formData) => api.post('/godowns/import', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
//   }),
// };

// // Goods API
// export const goodsAPI = {
//   getGoods: () => api.get('/logistics/goods'),
//   getGoodsById: (goodsId) => api.get(`/logistics/goods/${goodsId}`),
//   createGoods: (goodsData) => api.post('/logistics/goods', goodsData),
//   updateGoods: (goodsId, goodsData) => api.put(`/logistics/goods/${goodsId}`, goodsData),
//   deleteGoods: (goodsId) => api.delete(`/logistics/goods/${goodsId}`),
// };

// // User Management API
// export const userAPI = {
//   getUsers: () => api.get('/users'),
//   getUserById: (userId) => api.get(`/users/${userId}`),
//   createUser: (userData) => api.post('/users/create', userData),
//   updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
//   deleteUser: (userId) => api.delete(`/users/${userId}`),
//   changePassword: (userId, passwordData) => api.post(`/users/${userId}/change-password`, passwordData),
//   disableUser: (userId, reason) => api.post(`/users/${userId}/disable`, { reason }),
//   enableUser: (userId) => api.post(`/users/${userId}/enable`),
// };

// // Profile API
// export const profileAPI = {
//   getProfile: () => api.get('/profile'),
//   updateProfile: (profileData) => api.put('/profile', profileData),
//   uploadProfileImage: (imageData) => api.post('/profile/image', imageData, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
//   }),
// };

// // GPS Tracking API
// export const gpsAPI = {
//   // Health check
//   checkHealth: () => gpsApi.get('/health'),
  
//   // Devices
//   getDevices: () => gpsApi.get('/devices'),
//   getDeviceById: (deviceId) => gpsApi.get(`/devices/${deviceId}`),
  
//   // Realtime locations
//   getRealtimeLocations: () => gpsApi.get('/locations/realtime'),
//   getDeviceLocation: (deviceId) => gpsApi.get(`/locations/${deviceId}`),
  
//   // Historical data
//   getDeviceHistory: (deviceId, params) => gpsApi.get(`/history/${deviceId}`, { params }),
  
//   // Trips
//   getTrips: (params) => gpsApi.get('/trips', { params }),
//   getTripById: (tripId) => gpsApi.get(`/trips/${tripId}`),
//   createTrip: (tripData) => gpsApi.post('/trips', tripData),
//   updateTrip: (tripId, tripData) => gpsApi.put(`/trips/${tripId}`, tripData),
//   deleteTrip: (tripId) => gpsApi.delete(`/trips/${tripId}`),
  
//   // Geofences
//   getGeofences: () => gpsApi.get('/geofences'),
//   getGeofenceById: (geofenceId) => gpsApi.get(`/geofences/${geofenceId}`),
//   createGeofence: (geofenceData) => gpsApi.post('/geofences', geofenceData),
//   updateGeofence: (geofenceId, geofenceData) => gpsApi.put(`/geofences/${geofenceId}`, geofenceData),
//   deleteGeofence: (geofenceId) => gpsApi.delete(`/geofences/${geofenceId}`),
  
//   // Alerts
//   getAlerts: (params) => gpsApi.get('/alerts', { params }),
//   acknowledgeAlert: (alertId) => gpsApi.post(`/alerts/${alertId}/acknowledge`),
// };

// export default api;

// utils/api.js
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Create axios instance
const api = axios.create({
  baseURL: 'http://3.109.186.142:3005/api', // Your existing API base URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate axios instance for GPS API
const gpsApi = axios.create({
  baseURL: 'http://3.109.186.142:3000/api', // GPS API base URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a new axios instance specifically for GPS database data
const gpsDatabaseApi = axios.create({
  baseURL: 'http://3.109.186.142:3020/api', // GPS Database API base URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're already refreshing the token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token for main API
api.interceptors.request.use(
  async (config) => {
    // Skip token for auth endpoints
    if (config.url.includes('/auth/')) {
      return config;
    }
    
    // Get the auth store state
    const authStore = useAuthStore.getState();
    const { accessToken, isAuthenticated, isTokenExpiredOrExpiring, refreshToken } = authStore;
    
    if (isAuthenticated && accessToken) {
      // Check if token is expired or about to expire (within 1 minute)
      if (isTokenExpiredOrExpiring()) {
        // If we have a refresh token, try to refresh
        if (refreshToken) {
          try {
            // If we are already refreshing, queue the request
            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              }).then(token => {
                config.headers.Authorization = `Bearer ${token}`;
                return api(config);
              }).catch(err => {
                return Promise.reject(err);
              });
            }
            
            // Set refreshing flag
            isRefreshing = true;
            
            try {
              // Check if refreshAccessToken function exists before calling it
              if (typeof authStore.refreshAccessToken === 'function') {
                const newToken = await authStore.refreshAccessToken();
                
                // Process queued requests
                processQueue(null, newToken);
                
                // Update the request with the new token
                config.headers.Authorization = `Bearer ${newToken}`;
              } else {
                // If refresh function is not available, try to refresh directly
                const response = await api.post('/auth/refresh-token', { refreshToken });
                const { accessToken } = response.data;
                
                // Update the store with the new token
                authStore.setAccessToken(accessToken);
                
                // Process queued requests
                processQueue(null, accessToken);
                
                // Update the request with the new token
                config.headers.Authorization = `Bearer ${accessToken}`;
              }
            } catch (refreshError) {
              // Refresh token failed
              processQueue(refreshError, null);
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          } catch (error) {
            console.error('Error refreshing token:', error);
            return Promise.reject(error);
          }
        } else {
          // No refresh token available
          return Promise.reject(new Error('No refresh token available'));
        }
      } else {
        // Token is valid, add to headers
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token for GPS API
gpsApi.interceptors.request.use(
  async (config) => {
    // Get the auth store state
    const authStore = useAuthStore.getState();
    const { accessToken, isAuthenticated, isTokenExpiredOrExpiring, refreshToken } = authStore;
    
    if (isAuthenticated && accessToken) {
      // Check if token is expired or about to expire (within 1 minute)
      if (isTokenExpiredOrExpiring()) {
        // If we have a refresh token, try to refresh
        if (refreshToken) {
          try {
            // If we are already refreshing, queue the request
            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              }).then(token => {
                config.headers.Authorization = `Bearer ${token}`;
                return gpsApi(config);
              }).catch(err => {
                return Promise.reject(err);
              });
            }
            
            // Set refreshing flag
            isRefreshing = true;
            
            try {
              // Check if refreshAccessToken function exists before calling it
              if (typeof authStore.refreshAccessToken === 'function') {
                const newToken = await authStore.refreshAccessToken();
                
                // Process queued requests
                processQueue(null, newToken);
                
                // Update the request with the new token
                config.headers.Authorization = `Bearer ${newToken}`;
              } else {
                // If refresh function is not available, try to refresh directly
                const response = await api.post('/auth/refresh-token', { refreshToken });
                const { accessToken } = response.data;
                
                // Update the store with the new token
                authStore.setAccessToken(accessToken);
                
                // Process queued requests
                processQueue(null, accessToken);
                
                // Update the request with the new token
                config.headers.Authorization = `Bearer ${accessToken}`;
              }
            } catch (refreshError) {
              // Refresh token failed
              processQueue(refreshError, null);
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          } catch (error) {
            console.error('Error refreshing token:', error);
            return Promise.reject(error);
          }
        } else {
          // No refresh token available
          return Promise.reject(new Error('No refresh token available'));
        }
      } else {
        // Token is valid, add to headers
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token for GPS Database API
gpsDatabaseApi.interceptors.request.use(
  async (config) => {
    // Get the auth store state
    const authStore = useAuthStore.getState();
    const { accessToken, isAuthenticated, isTokenExpiredOrExpiring, refreshToken } = authStore;
    
    if (isAuthenticated && accessToken) {
      // Check if token is expired or about to expire (within 1 minute)
      if (isTokenExpiredOrExpiring()) {
        // If we have a refresh token, try to refresh
        if (refreshToken) {
          try {
            // If we are already refreshing, queue the request
            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              }).then(token => {
                config.headers.Authorization = `Bearer ${token}`;
                return gpsDatabaseApi(config);
              }).catch(err => {
                return Promise.reject(err);
              });
            }
            
            // Set refreshing flag
            isRefreshing = true;
            
            try {
              // Check if refreshAccessToken function exists before calling it
              if (typeof authStore.refreshAccessToken === 'function') {
                const newToken = await authStore.refreshAccessToken();
                
                // Process queued requests
                processQueue(null, newToken);
                
                // Update the request with the new token
                config.headers.Authorization = `Bearer ${newToken}`;
              } else {
                // If refresh function is not available, try to refresh directly
                const response = await api.post('/auth/refresh-token', { refreshToken });
                const { accessToken } = response.data;
                
                // Update the store with the new token
                authStore.setAccessToken(accessToken);
                
                // Process queued requests
                processQueue(null, accessToken);
                
                // Update the request with the new token
                config.headers.Authorization = `Bearer ${accessToken}`;
              }
            } catch (refreshError) {
              // Refresh token failed
              processQueue(refreshError, null);
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          } catch (error) {
            console.error('Error refreshing token:', error);
            return Promise.reject(error);
          }
        } else {
          // No refresh token available
          return Promise.reject(new Error('No refresh token available'));
        }
      } else {
        // Token is valid, add to headers
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling for main API
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const authStore = useAuthStore.getState();
      const { refreshToken, logout } = authStore;
      
      if (refreshToken) {
        try {
          // Check if refreshAccessToken function exists before calling it
          if (typeof authStore.refreshAccessToken === 'function') {
            const response = await api.post('/auth/refresh-token', { refreshToken });
            const { accessToken } = response.data;
            
            // Update store with new token
            authStore.setAccessToken(accessToken);
            
            // Process queued requests
            processQueue(null, accessToken);
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } else {
            // If refresh function is not available, try to refresh directly
            const response = await api.post('/auth/refresh-token', { refreshToken });
            const { accessToken } = response.data;
            
            // Update the store with the new token
            authStore.setAccessToken(accessToken);
            
            // Process queued requests
            processQueue(null, accessToken);
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token failed
          processQueue(refreshError, null);
          logout();
          
          // Only redirect if we're in a browser environment
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available
        logout();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor for error handling for GPS API
gpsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return gpsApi(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const authStore = useAuthStore.getState();
      const { refreshToken, logout } = authStore;
      
      if (refreshToken) {
        try {
          // Check if refreshAccessToken function exists before calling it
          if (typeof authStore.refreshAccessToken === 'function') {
            const response = await api.post('/auth/refresh-token', { refreshToken });
            const { accessToken } = response.data;
            
            // Update store with new token
            authStore.setAccessToken(accessToken);
            
            // Process queued requests
            processQueue(null, accessToken);
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return gpsApi(originalRequest);
          } else {
            // If refresh function is not available, try to refresh directly
            const response = await api.post('/auth/refresh-token', { refreshToken });
            const { accessToken } = response.data;
            
            // Update the store with the new token
            authStore.setAccessToken(accessToken);
            
            // Process queued requests
            processQueue(null, accessToken);
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return gpsApi(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token failed
          processQueue(refreshError, null);
          logout();
          
          // Only redirect if we're in a browser environment
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available
        logout();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor for error handling for GPS Database API
gpsDatabaseApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return gpsDatabaseApi(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const authStore = useAuthStore.getState();
      const { refreshToken, logout } = authStore;
      
      if (refreshToken) {
        try {
          // Check if refreshAccessToken function exists before calling it
          if (typeof authStore.refreshAccessToken === 'function') {
            const response = await api.post('/auth/refresh-token', { refreshToken });
            const { accessToken } = response.data;
            
            // Update store with new token
            authStore.setAccessToken(accessToken);
            
            // Process queued requests
            processQueue(null, accessToken);
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return gpsDatabaseApi(originalRequest);
          } else {
            // If refresh function is not available, try to refresh directly
            const response = await api.post('/auth/refresh-token', { refreshToken });
            const { accessToken } = response.data;
            
            // Update the store with the new token
            authStore.setAccessToken(accessToken);
            
            // Process queued requests
            processQueue(null, accessToken);
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return gpsDatabaseApi(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token failed
          processQueue(refreshError, null);
          logout();
          
          // Only redirect if we're in a browser environment
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available
        logout();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: (logoutData) => api.post('/auth/logout', logoutData),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

// JSFC Godown API
export const jsfcGodownAPI = {
  getGodowns: () => api.get('/godowns'),
  getGodownById: (godownId) => api.get(`/godowns/${godownId}`),
  createGodown: (godownData) => api.post('/godowns', godownData),
  updateGodown: (godownId, godownData) => api.put(`/godowns/${godownId}`, godownData),
  deleteGodown: (godownId) => api.delete(`/godowns/${godownId}`),
  getDeletedGodowns: () => api.get('/godowns/deleted/list'),
  restoreGodown: (godownId) => api.post(`/godowns/${godownId}/restore`),
  importGodowns: (formData) => api.post('/godowns/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
};

// Goods API
export const goodsAPI = {
  getGoods: () => api.get('/logistics/goods'),
  getGoodsById: (goodsId) => api.get(`/logistics/goods/${goodsId}`),
  createGoods: (goodsData) => api.post('/logistics/goods', goodsData),
  updateGoods: (goodsId, goodsData) => api.put(`/logistics/goods/${goodsId}`, goodsData),
  deleteGoods: (goodsId) => api.delete(`/logistics/goods/${goodsId}`),
};

// User Management API
export const userAPI = {
  getUsers: () => api.get('/users'),
  getUserById: (userId) => api.get(`/users/${userId}`),
  createUser: (userData) => api.post('/users/create', userData),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  changePassword: (userId, passwordData) => api.post(`/users/${userId}/change-password`, passwordData),
  disableUser: (userId, reason) => api.post(`/users/${userId}/disable`, { reason }),
  enableUser: (userId) => api.post(`/users/${userId}/enable`),
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData) => api.put('/profile', profileData),
  uploadProfileImage: (imageData) => api.post('/profile/image', imageData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
};

// GPS Tracking API
export const gpsAPI = {
  // Health check
  checkHealth: () => gpsApi.get('/health'),
  
  // Devices
  getDevices: () => gpsApi.get('/devices'),
  getDeviceById: (deviceId) => gpsApi.get(`/devices/${deviceId}`),
  
  // Realtime locations
  getRealtimeLocations: () => gpsApi.get('/locations/realtime'),
  getDeviceLocation: (deviceId) => gpsApi.get(`/locations/${deviceId}`),
  
  // Historical data
  getDeviceHistory: (deviceId, params) => gpsApi.get(`/history/${deviceId}`, { params }),
  
  // Trips
  getTrips: (params) => gpsApi.get('/trips', { params }),
  getTripById: (tripId) => gpsApi.get(`/trips/${tripId}`),
  createTrip: (tripData) => gpsApi.post('/trips', tripData),
  updateTrip: (tripId, tripData) => gpsApi.put(`/trips/${tripId}`, tripData),
  deleteTrip: (tripId) => gpsApi.delete(`/trips/${tripId}`),
  
  // Geofences
  getGeofences: () => gpsApi.get('/geofences'),
  getGeofenceById: (geofenceId) => gpsApi.get(`/geofences/${geofenceId}`),
  createGeofence: (geofenceData) => gpsApi.post('/geofences', geofenceData),
  updateGeofence: (geofenceId, geofenceData) => gpsApi.put(`/geofences/${geofenceId}`, geofenceData),
  deleteGeofence: (geofenceId) => gpsApi.delete(`/geofences/${geofenceId}`),
  
  // Alerts
  getAlerts: (params) => gpsApi.get('/alerts', { params }),
  acknowledgeAlert: (alertId) => gpsApi.post(`/alerts/${alertId}/acknowledge`),
};

// GPS Database API
export const gpsDatabaseAPI = {
  // Devices
  getDevices: () => gpsDatabaseApi.get('/devices'),
  
  // Full device data for history tracking
  getDeviceFullData: (imei, params) => gpsDatabaseApi.get(`/devices/${imei}/full`, { params }),
};

export default api;