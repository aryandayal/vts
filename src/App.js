
// import React, { useEffect, useState, useRef } from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { useAuthStore } from "./stores/authStore";
// import useData from "./hooks/useData"; // Import the useData hook
// import Layout from "./Layout";
// import Dashboard from "./pages/Dashboard";
// import VehicleTracking from "./pages/VehicleTracking";
// import Login from "./pages/Login";
// import HistoryTracking from "./pages/map/HistoryTracking";
// import ChangeUserPassword from "./pages/user/ChangeUserPassword";
// import ManageUser from "./pages/user/ManageUser";
// import Profile from "./pages/account/Profile";
// import JsfcGodown from "./pages/JsfcGodown";
// import Goods from "./pages/Goods";
// import Transporter from "./pages/Transporter";

// // Create a PrivateRoute component to protect routes
// const PrivateRoute = ({ children }) => {
//   const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
//   if (!isAuthenticated) {
//     // If not authenticated, redirect to login page
//     return <Navigate to="/" replace />;
//   }
  
//   return children;
// };

// function App() {
//   const checkAuth = useAuthStore((state) => state.checkAuth);
//   const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
//   const [authChecked, setAuthChecked] = useState(false);
//   const [storeReady, setStoreReady] = useState(false);
  
//   // Create a ref to hold the store state
//   const storeRef = useRef(useAuthStore.getState());
  
//   // Update the ref whenever the store changes
//   useEffect(() => {
//     const unsubscribe = useAuthStore.subscribe(
//       (state) => {
//         storeRef.current = state;
//         if (!storeReady && state.refreshAccessToken) {
//           setStoreReady(true);
//         }
//       }
//     );
//     return unsubscribe;
//   }, [storeReady]);

//   // Check authentication status on initial load
//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         // First, try to initialize from cookies
//         const initialized = useAuthStore.getState().initializeFromCookies();
        
//         if (!initialized) {
//           // If initialization from cookies failed, run the full auth check
//           await checkAuth();
//         }
        
//         // Set store ready after auth check
//         setStoreReady(true);
//       } catch (error) {
//         console.error("Authentication check failed:", error);
//         setStoreReady(true); // Set ready even if auth fails to avoid infinite loading
//       } finally {
//         setAuthChecked(true);
//       }
//     };
    
//     initializeAuth();
//   }, [checkAuth]);

//   // Set up periodic token refresh check
//   useEffect(() => {
//     if (!isAuthenticated || !storeReady) return;
    
//     // Check token validity every minute
//     const intervalId = setInterval(() => {
//       const state = storeRef.current;
//       if (state.isTokenExpiredOrExpiring && state.refreshToken) {
//         console.log('Token is about to expire, refreshing...');
//         // Check if refreshAccessToken is a function before calling it
//         if (typeof state.refreshAccessToken === 'function') {
//           state.refreshAccessToken().catch(err => {
//             console.error('Failed to refresh token:', err);
//           });
//         } else {
//           console.error('refreshAccessToken is not a function');
//         }
//       }
//     }, 60000); // Check every minute
    
//     return () => clearInterval(intervalId);
//   }, [isAuthenticated, storeReady]);

//   // Initialize the data for the app (godowns, drivers, vehicles, goods)
//   useData();

//   // Show loading while checking authentication
//   if (!authChecked || !storeReady) {
//     return (
//       <div className="loading-container">
//         <div className="spinner"></div>
//         <p>Loading application...</p>
//       </div>
//     );
//   }

//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Public routes (accessible without authentication) */}
//         <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
//         <Route path="login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        
//         {/* Protected routes (require authentication) */}
//         <Route path="/dashboard" element={
//           <PrivateRoute>
//             <Layout>
//               <Dashboard />
//             </Layout>
//           </PrivateRoute>
//         } />
        
//         <Route path="/vehicle-tracking" element={
//           <PrivateRoute>
//             <Layout>
//               <VehicleTracking />
//             </Layout>
//           </PrivateRoute>
//         } />
        
//         <Route path="/jsfc-godown" element={
//           <PrivateRoute>
//             <Layout>
//               <JsfcGodown />
//             </Layout>
//           </PrivateRoute>
//         } />

//         <Route path="/goods" element={
//           <PrivateRoute>
//             <Layout>
//               <Goods />
//             </Layout>
//           </PrivateRoute>
//         } />

//         <Route path="/transporter" element={
//           <PrivateRoute>
//             <Layout>
//               <Transporter />
//             </Layout>
//           </PrivateRoute>
//         } />
        
//         {/* Map Routes */}
//         <Route path="/map/history-tracking" element={
//           <PrivateRoute>
//             <Layout>
//               <HistoryTracking />
//             </Layout>
//           </PrivateRoute>
//         } />
        
//         {/* User Routes */}
//         <Route path="/user/change-user-password" element={
//           <PrivateRoute>
//             <Layout>
//               <ChangeUserPassword />
//             </Layout>
//           </PrivateRoute>
//         } />
        
//         <Route path="/user/manage-user" element={
//           <PrivateRoute>
//             <Layout>
//               <ManageUser />
//             </Layout>
//           </PrivateRoute>
//         } />
        
//         {/* Account Routes */}
//         <Route path="/profile" element={
//           <PrivateRoute>
//             <Layout>
//               <Profile />
//             </Layout>
//           </PrivateRoute>
//         } />
        
//         {/* Logout route - redirects to login page */}
//         <Route path="/logout" element={<LogoutPage />} />
        
//         {/* Catch-all route for unknown paths */}
//         <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// // Logout page component
// const LogoutPage = () => {
//   const logout = useAuthStore((state) => state.logout);
  
//   useEffect(() => {
//     logout();
//   }, [logout]);
  
//   return <Navigate to="/" replace />;
// };

// export default App;

// App.js
import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import useData from "./hooks/useData"; // Import the useData hook
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import VehicleTracking from "./pages/VehicleTracking";
import Login from "./pages/Login";
import HistoryTracking from "./pages/map/HistoryTracking";
import ChangeUserPassword from "./pages/user/ChangeUserPassword";
import ManageUser from "./pages/user/ManageUser";
import Profile from "./pages/account/Profile";
import JsfcGodown from "./pages/JsfcGodown";
import Goods from "./pages/Goods";
import Transporter from "./pages/Transporter";

// Create a PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    // If not authenticated, redirect to login page
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [authChecked, setAuthChecked] = useState(false);
  const [storeReady, setStoreReady] = useState(false);
  
  // Create a ref to hold the store state
  const storeRef = useRef(useAuthStore.getState());
  
  // Update the ref whenever the store changes
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe(
      (state) => {
        storeRef.current = state;
        if (!storeReady && state.refreshAccessToken) {
          setStoreReady(true);
        }
      }
    );
    return unsubscribe;
  }, [storeReady]);

  // Check authentication status on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First, try to initialize from cookies
        const initialized = useAuthStore.getState().initializeFromCookies();
        
        if (!initialized) {
          // If initialization from cookies failed, run the full auth check
          await checkAuth();
        }
        
        // Set store ready after auth check
        setStoreReady(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setStoreReady(true); // Set ready even if auth fails to avoid infinite loading
      } finally {
        setAuthChecked(true);
      }
    };
    
    initializeAuth();
  }, [checkAuth]);

  // Set up periodic token refresh check
  useEffect(() => {
    if (!isAuthenticated || !storeReady) return;
    
    // Check token validity every minute
    const intervalId = setInterval(() => {
      const state = storeRef.current;
      if (state.isTokenExpiredOrExpiring && state.refreshToken) {
        console.log('Token is about to expire, refreshing...');
        // Check if refreshAccessToken is a function before calling it
        if (typeof state.refreshAccessToken === 'function') {
          state.refreshAccessToken().catch(err => {
            console.error('Failed to refresh token:', err);
          });
        } else {
          console.error('refreshAccessToken is not a function');
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, storeReady]);

  // Initialize the data for the app (godowns, drivers, vehicles, goods)
  useData();

  // Show loading while checking authentication
  if (!authChecked || !storeReady) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (accessible without authentication) */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        
        {/* Protected routes (require authentication) */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/vehicle-tracking" element={
          <PrivateRoute>
            <Layout>
              <VehicleTracking />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/jsfc-godown" element={
          <PrivateRoute>
            <Layout>
              <JsfcGodown />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/goods" element={
          <PrivateRoute>
            <Layout>
              <Goods />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/transporter" element={
          <PrivateRoute>
            <Layout>
              <Transporter />
            </Layout>
          </PrivateRoute>
        } />
        
        {/* Map Routes */}
        <Route path="/map/history-tracking" element={
          <PrivateRoute>
            <Layout>
              <HistoryTracking />
            </Layout>
          </PrivateRoute>
        } />
        
        {/* User Routes */}
        <Route path="/user/change-user-password" element={
          <PrivateRoute>
            <Layout>
              <ChangeUserPassword />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/user/manage-user" element={
          <PrivateRoute>
            <Layout>
              <ManageUser />
            </Layout>
          </PrivateRoute>
        } />
        
        {/* Account Routes */}
        <Route path="/profile" element={
          <PrivateRoute>
            <Layout>
              <Profile />
            </Layout>
          </PrivateRoute>
        } />
        
        {/* Logout route - redirects to login page */}
        <Route path="/logout" element={<LogoutPage />} />
        
        {/* Catch-all route for unknown paths */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Logout page component
const LogoutPage = () => {
  const logout = useAuthStore((state) => state.logout);
  
  useEffect(() => {
    logout();
  }, [logout]);
  
  return <Navigate to="/" replace />;
};

export default App;