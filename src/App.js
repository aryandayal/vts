import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Cookies from 'js-cookie';
import { UserProvider } from './components/UserContext';
import Dashboard from "./pages/Dashboard";
import VehicleTracking from "./pages/VehicleTracking";
import Login from "./pages/Login";
import HistoryTracking from "./pages/map/HistoryTracking";
import ChangeUserPassword from "./pages/user/ChangeUserPassword";
import ManageUser from "./pages/user/ManageUser";
import Profile from "./pages/account/Profile";
import JsfcGodown from "./pages/JsfcGodown";
import Transporter from "./pages/Transporter";

// Create a PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const token = Cookies.get('token');
  
  if (!token) {
    // If no token, redirect to login page
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes (accessible without authentication) */}
          <Route path="/" element={<Login />} />
          <Route path="login" element={<Login />} />
          
          {/* Protected routes (require authentication) */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/vehicle-tracking" element={
            <PrivateRoute>
              <VehicleTracking />
              </PrivateRoute>
          } />
          
          <Route path="/jsfc-godown" element={
            <PrivateRoute>
              <JsfcGodown />
             </PrivateRoute>
          } />

            <Route path="/transporter" element={
            <PrivateRoute>
              <Transporter />
            </PrivateRoute>
          } />
          
          {/* Map Routes */}
          <Route path="/map/history-tracking" element={
            <PrivateRoute>
              <HistoryTracking />
            </PrivateRoute>
          } />
          
          {/* User Routes */}
          <Route path="/user/change-user-password" element={
            <PrivateRoute>
              <ChangeUserPassword />
            </PrivateRoute>
          } />
          
          <Route path="/user/manage-user" element={
            <PrivateRoute>
              <ManageUser />
            </PrivateRoute>
          } />
          
          {/* Account Routes */}
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          
          {/* Logout route - redirects to login page */}
          <Route path="/logout" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;