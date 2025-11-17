import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useUser } from './UserContext'; // Import the useUser hook
import './header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const navigate = useNavigate();
  const { user, setUser } = useUser(); // Get user and setUser from context

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) {
      setActiveDropdown(null);
      setActiveSubmenu(null);
    }
  };

  const toggleDropdown = (index) => {
    if (activeDropdown === index) {
      setActiveDropdown(null);
      setActiveSubmenu(null);
    } else {
      setActiveDropdown(index);
      setActiveSubmenu(null);
    }
  };

  const toggleSubmenu = (index) => {
    if (activeSubmenu === index) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(index);
    }
  };

  const handleLogout = async () => {
    try {
      const token = Cookies.get('accessToken'); // Changed from 'token' to 'accessToken'
      
      console.log('Logging out...');
      console.log('Token before removal:', token);
      console.log('User data before removal:', user);
      
      const logoutTimestamp = new Date().toISOString();
      
      if (token) {
        const response = await fetch('http://3.109.186.142:3005/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            logoutTime: logoutTimestamp,
            userId: user ? user.id : null
          })
        });
        
        if (response.ok) {
          console.log('Logout recorded successfully');
        } else {
          console.error('Failed to record logout on server');
        }
      }
      
      // Clear cookies
      Cookies.remove('accessToken', { path: '/' }); // Changed from 'token' to 'accessToken'
      Cookies.remove('refreshToken', { path: '/' }); // Add refreshToken removal
      Cookies.remove('user', { path: '/' });
      
      // Clear context
      setUser(null);
      
      // Clear local storage
      localStorage.clear();
      
      // Navigate to login
      navigate('/');
      setIsMenuOpen(false);
      setActiveDropdown(null);
      
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Still clear everything even if there's an error
      Cookies.remove('accessToken', { path: '/' }); // Changed from 'token' to 'accessToken'
      Cookies.remove('refreshToken', { path: '/' }); // Add refreshToken removal
      Cookies.remove('user', { path: '/' });
      setUser(null);
      localStorage.clear();
      navigate('/');
      setIsMenuOpen(false);
      setActiveDropdown(null);
    }
  };

  // Get display name for user
  const getUserDisplayName = () => {
    if (!user) return 'Account';
    
    // Try to get full_name first, then user_id, then fall back to 'Account'
    return user.full_name || user.user_id || 'Account';
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <div className="logo-icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <div className="logo-text">
            <h1>VehicleTrack</h1>
            <span>Fleet Management System</span>
          </div>
          <button className="hamburger" onClick={toggleMenu}>
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
        
        {/* User welcome section removed */}
        
        <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/dashboard" className="nav-link">
                <i className="fas fa-home"></i> 
                <span>Dashboard</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link to="/vehicle-tracking" className="nav-link">
                <i className="fas fa-truck-moving"></i> 
                <span>Vehicle Tracking</span>
              </Link>
            </li>
            
            {/* Added JSFC Godown menu item */}
            <li className="nav-item">
              <Link to="/jsfc-godown" className="nav-link">
                <i className="fas fa-warehouse"></i> 
                <span>JSFC Godown</span>
              </Link>
            </li>
            
            <li className={`nav-item dropdown ${activeDropdown === 0 ? 'active' : ''}`}>
              <div 
                className="nav-link" 
                onClick={() => toggleDropdown(0)}
              >
                <i className="fas fa-users"></i> 
                <span>User</span>
                <i className={`fas ${activeDropdown === 0 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-icon`}></i>
              </div>
              <ul className="dropdown-menu">
                <li><Link to="/user/change-user-password"><i className="fas fa-key"></i> Change Password</Link></li>
                <li><Link to="/user/manage-user"><i className="fas fa-user-cog"></i> Manage Users</Link></li>
              </ul>
            </li>
            
            <li className={`nav-item dropdown ${activeDropdown === 1 ? 'active' : ''}`}>
              <div 
                className="nav-link" 
                onClick={() => toggleDropdown(1)}
              >
                <i className="fas fa-chart-line"></i> 
                <span>Reports</span>
                <i className={`fas ${activeDropdown === 1 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-icon`}></i>
              </div>
              <ul className="dropdown-menu">
                <li><Link to="/reports/event-logs"><i className="fas fa-clipboard-list"></i> Event Logs</Link></li>
              </ul>
            </li>
            
            <li className={`nav-item dropdown ${activeDropdown === 2 ? 'active' : ''}`}>
              <div 
                className="nav-link" 
                onClick={() => toggleDropdown(2)}
              >
                <i className="fas fa-map-marked-alt"></i> 
                <span>Map</span>
                <i className={`fas ${activeDropdown === 2 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-icon`}></i>
              </div>
              <ul className="dropdown-menu">
                <li><Link to="/map/history-tracking"><i className="fas fa-history"></i> History Tracking</Link></li>
              </ul>
            </li>
            
            <li className={`nav-item dropdown ${activeDropdown === 3 ? 'active' : ''}`}>
              <div 
                className="nav-link" 
                onClick={() => toggleDropdown(3)}
              >
                <i className="fas fa-route"></i> 
                <span>Routes</span>
                <i className={`fas ${activeDropdown === 3 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-icon`}></i>
              </div>
              <ul className="dropdown-menu">
                <li><Link to="/routes/add-route"><i className="fas fa-plus-circle"></i> Add Route</Link></li>
              </ul>
            </li>
            
            <li className={`nav-item dropdown ${activeDropdown === 4 ? 'active' : ''}`}>
              <div 
                className="nav-link" 
                onClick={() => toggleDropdown(4)}
              >
                <i className="fas fa-user-circle"></i> 
                <span>{getUserDisplayName()}</span>
                <i className={`fas ${activeDropdown === 4 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-icon`}></i>
              </div>
              <ul className="dropdown-menu">
                {user ? (
                  <>
                    <li><Link to="/profile"><i className="fas fa-id-card"></i> Profile</Link></li>
                    <li><Link to="/settings"><i className="fas fa-cog"></i> Settings</Link></li>
                    <li>
                      <button onClick={handleLogout} className="logout-button">
                        <i className="fas fa-sign-out-alt"></i> Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li><Link to="/profile"><i className="fas fa-id-card"></i> Profile</Link></li>
                    <li><Link to="/settings"><i className="fas fa-cog"></i> Settings</Link></li>
                    <li>
                      <button onClick={handleLogout} className="logout-button">
                        <i className="fas fa-sign-out-alt"></i> Logout
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;