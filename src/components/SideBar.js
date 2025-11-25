// Sidebar.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore'; // Import Zustand authStore
import styles from './Sidebar.module.css'; // Import CSS module

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user and logout function from Zustand store
  const { user, logout } = useAuthStore();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (!isSidebarOpen) {
      setActiveDropdown(null);
    }
  };

  const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
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
      setIsSidebarOpen(false);
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, still logout locally
      logout();
      navigate('/');
      setIsSidebarOpen(false);
    }
  };

  // Check if a link is active
  const isLinkActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button className={styles.sidebarToggle} onClick={toggleSidebar}>
        <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>
      
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <div className={styles.logoText}>
              <h1>VehicleTrack</h1>
              <span>Fleet Management</span>
            </div>
          </div>
        </div>
        
        <nav className={styles.sidebarNav}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link 
                to="/dashboard" 
                className={`${styles.navLink} ${isLinkActive('/dashboard') ? styles.activeLink : ''}`}
              >
                <i className="fas fa-home"></i> 
                <span>Dashboard</span>
              </Link>
            </li>
            
            <li className={styles.navItem}>
              <Link 
                to="/vehicle-tracking" 
                className={`${styles.navLink} ${isLinkActive('/vehicle-tracking') ? styles.activeLink : ''}`}
              >
                <i className="fas fa-truck-moving"></i> 
                <span>Vehicle Tracking</span>
              </Link>
            </li>
            
            <li className={styles.navItem}>
              <Link 
                to="/jsfc-godown" 
                className={`${styles.navLink} ${isLinkActive('/jsfc-godown') ? styles.activeLink : ''}`}
              >
                <i className="fas fa-warehouse"></i> 
                <span>JSFC Godown</span>
              </Link>
            </li>
            
            {/* Goods menu item */}
            <li className={styles.navItem}>
              <Link 
                to="/goods" 
                className={`${styles.navLink} ${isLinkActive('/goods') ? styles.activeLink : ''}`}
              >
                <i className="fas fa-boxes"></i> 
                <span>Goods</span>
              </Link>
            </li>
            
            {/* NEW: Transporter menu item */}
            <li className={styles.navItem}>
              <Link 
                to="/transporter" 
                className={`${styles.navLink} ${isLinkActive('/transporter') ? styles.activeLink : ''}`}
              >
                <i className="fas fa-truck"></i> 
                <span>Transporter</span>
              </Link>
            </li>
            
            <li className={`${styles.navItem} ${activeDropdown === 0 ? styles.dropdownActive : ''}`}>
              <div 
                className={`${styles.navLink} ${isLinkActive('/user/change-user-password') || isLinkActive('/user/manage-user') ? styles.activeLink : ''}`}
                onClick={() => toggleDropdown(0)}
              >
                <i className="fas fa-users"></i> 
                <span>User</span>
                <div className={styles.dropdownArrow}>
                  <i className={`fas ${activeDropdown === 0 ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                </div>
              </div>
              <ul className={`${styles.dropdownMenu} ${activeDropdown === 0 ? styles.dropdownMenuOpen : ''}`}>
                <li className={styles.dropdownItem}>
                  <Link 
                    to="/user/change-user-password" 
                    className={`${styles.dropdownLink} ${isLinkActive('/user/change-user-password') ? styles.activeLink : ''}`}
                  >
                    <i className="fas fa-key"></i> Change Password
                  </Link>
                </li>
                <li className={styles.dropdownItem}>
                  <Link 
                    to="/user/manage-user" 
                    className={`${styles.dropdownLink} ${isLinkActive('/user/manage-user') ? styles.activeLink : ''}`}
                  >
                    <i className="fas fa-user-cog"></i> Manage Users
                  </Link>
                </li>
              </ul>
            </li>
            
            <li className={`${styles.navItem} ${activeDropdown === 1 ? styles.dropdownActive : ''}`}>
              <div 
                className={`${styles.navLink} ${isLinkActive('/reports/report') ? styles.activeLink : ''}`}
                onClick={() => toggleDropdown(1)}
              >
                <i className="fas fa-chart-line"></i> 
                <span>Reports</span>
                <div className={styles.dropdownArrow}>
                  <i className={`fas ${activeDropdown === 1 ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                </div>
              </div>
              <ul className={`${styles.dropdownMenu} ${activeDropdown === 1 ? styles.dropdownMenuOpen : ''}`}>
                <li className={styles.dropdownItem}>
                  <Link 
                    to="/reports/report" 
                    className={`${styles.dropdownLink} ${isLinkActive('/reports/report') ? styles.activeLink : ''}`}
                  >
                    <i className="fas fa-clipboard-list"></i> Event Logs
                  </Link>
                </li>
              </ul>
            </li>
            
            <li className={`${styles.navItem} ${activeDropdown === 2 ? styles.dropdownActive : ''}`}>
              <div 
                className={`${styles.navLink} ${isLinkActive('/map/history-tracking') ? styles.activeLink : ''}`}
                onClick={() => toggleDropdown(2)}
              >
                <i className="fas fa-map-marked-alt"></i> 
                <span>Map</span>
                <div className={styles.dropdownArrow}>
                  <i className={`fas ${activeDropdown === 2 ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                </div>
              </div>
              <ul className={`${styles.dropdownMenu} ${activeDropdown === 2 ? styles.dropdownMenuOpen : ''}`}>
                <li className={styles.dropdownItem}>
                  <Link 
                    to="/map/history-tracking" 
                    className={`${styles.dropdownLink} ${isLinkActive('/map/history-tracking') ? styles.activeLink : ''}`}
                  >
                    <i className="fas fa-history"></i> History Tracking
                  </Link>
                </li>
              </ul>
            </li>
            
            <li className={`${styles.navItem} ${activeDropdown === 3 ? styles.dropdownActive : ''}`}>
              <div 
                className={`${styles.navLink} ${isLinkActive('/routes/add-route') ? styles.activeLink : ''}`}
                onClick={() => toggleDropdown(3)}
              >
                <i className="fas fa-route"></i> 
                <span>Routes</span>
                <div className={styles.dropdownArrow}>
                  <i className={`fas ${activeDropdown === 3 ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                </div>
              </div>
              <ul className={`${styles.dropdownMenu} ${activeDropdown === 3 ? styles.dropdownMenuOpen : ''}`}>
                <li className={styles.dropdownItem}>
                  <Link 
                    to="/routes/add-route" 
                    className={`${styles.dropdownLink} ${isLinkActive('/routes/add-route') ? styles.activeLink : ''}`}
                  >
                    <i className="fas fa-plus-circle"></i> Add Route
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;