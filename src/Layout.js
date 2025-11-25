// Layout.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore'; // Import Zustand authStore
import SideBar from './components/SideBar';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userDropdownRef = useRef(null);
  
  // Get user and logout function from Zustand store
  const { user, logout } = useAuthStore();

  // Check if we're on mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 992);
      if (window.innerWidth <= 992) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdowns when route changes
  useEffect(() => {
    setActiveDropdown(null);
    setUserDropdownOpen(false);
  }, [location]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Function to get page name from route based on Sidebar navigation
  const getPageName = (path) => {
    // Map routes to page names based on Sidebar navigation
    const pathMap = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/vehicle-tracking': 'Vehicle Tracking',
      '/jsfc-godown': 'JSFC Godown',
      '/transporter': 'Transporter', // Added Transporter route
      '/user/change-user-password': 'Change Password',
      '/user/manage-user': 'Manage Users',
      '/reports/event-logs': 'Event Logs',
      '/map/history-tracking': 'History Tracking',
      '/routes/add-route': 'Add Route',
    };
    
    // Check for exact match first
    if (pathMap[path]) {
      return pathMap[path];
    }
    
    // Check for parent paths (e.g., /user/* should return "User")
    const pathSegments = path.split('/').filter(segment => segment);
    if (pathSegments.length > 0) {
      const parentPath = `/${pathSegments[0]}`;
      const parentMap = {
        '/user': 'User',
        '/reports': 'Reports',
        '/map': 'Map',
        '/routes': 'Routes',
        '/transporter': 'Transporter', // Added Transporter parent path
      };
      
      if (parentMap[parentPath]) {
        return parentMap[parentPath];
      }
    }
    
    // Default fallback
    return 'Dashboard';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      // Get token from Zustand store
      const token = useAuthStore.getState().accessToken;
      
      if (token) {
        await fetch('http://3.109.186.142:3005/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            logoutTime: new Date().toISOString(),
            userId: user ? user.id : null
          })
        });
      }
      
      // Use Zustand's logout method to clear state and cookies
      logout();
      
      // Navigate to login page
      navigate('/');
      setUserDropdownOpen(false);
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, still logout locally
      logout();
      navigate('/');
      setUserDropdownOpen(false);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'Account';
    return user.full_name || user.user_id || 'Account';
  };

  return (
    <div className={styles.layoutContainer}>
      <SideBar 
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        activeDropdown={activeDropdown}
        toggleDropdown={toggleDropdown}
        handleLogout={handleLogout}
        getUserDisplayName={getUserDisplayName}
      />

      <div className={`${styles.mainContent} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            {/* Removed hamburger menu button */}
            <h2 className={styles.pageTitle}>{getPageName(location.pathname)}</h2>
          </div>
          <div className={styles.topbarRight}>
            <div 
              className={styles.userInfoContainer} 
              ref={userDropdownRef}
            >
              <div className={styles.userInfo} onClick={toggleUserDropdown}>
                <div className={styles.userAvatar}>
                  <i className="fas fa-user"></i>
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userName}>{getUserDisplayName()}</div>
                  <div className={styles.userRole}>Administrator</div>
                </div>
                <div className={styles.dropdownArrow}>
                  <i className={`fas ${userDropdownOpen ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                </div>
              </div>
              
              <div className={`${styles.userDropdown} ${userDropdownOpen ? styles.dropdownOpen : ''}`}>
                <ul className={styles.dropdownList}>
                  <li>
                    <Link to="/profile" className={styles.dropdownItem}>
                      <i className="fas fa-id-card"></i> Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className={styles.dropdownItem}>
                      <i className="fas fa-cog"></i> Settings
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className={styles.dropdownItem}>
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;