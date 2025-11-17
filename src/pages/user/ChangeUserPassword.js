import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { FaUser, FaLock, FaKey, FaSave, FaTimes, FaCheckCircle, FaSearch } from "react-icons/fa";
import Header from "../../components/Header";
import BottomNavbar from "../../components/BottomNavbar";
import { useUser } from '../../components/UserContext';
import Cookies from 'js-cookie';
import './changeuserpassword.css';

const ChangeUserPassword = () => {
  // Get user and token from context
  const { user, token: contextToken } = useUser();
  
  // State hooks for form fields
  const [userType, setUserType] = useState('');
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for user search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // User type options
  const userTypes = [
    { value: '', label: 'Select User Type' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Operator', label: 'Operator' },
    { value: 'Transporter', label: 'Transporter' },
    { value: 'Driver', label: 'Driver' }
  ];

  // Mock user data for search
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', type: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', type: 'Manager' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', type: 'Operator' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', type: 'Transporter' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', type: 'Driver' },
    { id: 6, name: 'Diana Miller', email: 'diana@example.com', type: 'Admin' },
    { id: 7, name: 'Edward Davis', email: 'edward@example.com', type: 'Manager' },
    { id: 8, name: 'Fiona Garcia', email: 'fiona@example.com', type: 'Operator' }
  ];

  // Filter users based on search term and user type
  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setUserSearchResults([]);
      return;
    }

    const filteredUsers = mockUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
      const matchesType = !userType || user.type === userType;
      return matchesSearch && matchesType;
    });

    setUserSearchResults(filteredUsers);
    setShowUserDropdown(true);
  }, [userSearchTerm, userType]);

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUsername(user.name);
    setUserSearchTerm(user.name);
    setShowUserDropdown(false);
  };

  // Get token from context or cookies
  const getToken = () => {
    // First try to get token from context
    if (contextToken) {
      return contextToken;
    }
    
    // If not in context, try to get from cookies
    const tokenFromCookie = Cookies.get('token') || Cookies.get('accessToken');
    if (tokenFromCookie) {
      return tokenFromCookie;
    }
    
    return null;
  };

  // Helper function to get user ID from token or user object
  const getUserId = () => {
    // First try to get ID from user object
    if (user && (user.id || user.user_id)) {
      return user.id || user.user_id;
    }
    
    // If not available, try to decode the token
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload.userId || payload.sub || payload.user_id;
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
    
    return null;
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!userType) errors.userType = 'Please select a user type';
    if (!selectedUser) errors.username = 'Please select a user';
    if (!oldPassword) errors.oldPassword = 'Old password is required';
    if (!newPassword) errors.newPassword = 'New password is required';
    if (newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setFormErrors({});
    
    try {
      // Get token and user ID
      const token = getToken();
      const userId = getUserId();
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }
      
      // API call to change password
      const response = await fetch(`http://3.109.186.142:3005/api/users/${userId}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      // Success
      setSuccessMessage('Password changed successfully!');
      
      // Reset form after successful submission
      setTimeout(() => {
        setUserType('');
        setUsername('');
        setUserSearchTerm('');
        setSelectedUser(null);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMessage('');
      }, 2000);
      
    } catch (error) {
      setFormErrors({ submit: error.message || 'Failed to change password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setUserType('');
    setUsername('');
    setUserSearchTerm('');
    setSelectedUser(null);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFormErrors({});
    setSuccessMessage('');
    setShowUserDropdown(false);
  };

  return (
    <>
      <Helmet>
        <title>Change User Password</title>
      </Helmet>
      <Header />
      <BottomNavbar text="Change User Password" />
      
      <div className="password-change-container">
        <div className="password-change-card">
          <div className="card-header">
            <h2>Change User Password</h2>
            <p>Update password for any user in the system</p>
          </div>
          
          {successMessage && (
            <div className="success-message">
              <FaCheckCircle /> {successMessage}
            </div>
          )}
          
          {formErrors.submit && (
            <div className="error-message">
              {formErrors.submit}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="password-form">
            <div className="form-grid">
              {/* User Type Field */}
              <div className="form-group">
                <label htmlFor="userType">
                  <FaUser className="input-icon" /> User Type
                </label>
                <select
                  id="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className={formErrors.userType ? 'error' : ''}
                >
                  {userTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {formErrors.userType && (
                  <span className="error-text">{formErrors.userType}</span>
                )}
              </div>
              
              {/* Username Search Field */}
              <div className="form-group">
                <label htmlFor="username">
                  <FaSearch className="input-icon" /> Search User
                </label>
                <div className="search-container">
                  <input
                    type="text"
                    id="username"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search by name or email"
                    className={formErrors.username ? 'error' : ''}
                    onFocus={() => setShowUserDropdown(true)}
                  />
                  {showUserDropdown && userSearchResults.length > 0 && (
                    <div className="search-dropdown">
                      {userSearchResults.map((user) => (
                        <div 
                          key={user.id} 
                          className="search-result-item"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formErrors.username && (
                  <span className="error-text">{formErrors.username}</span>
                )}
              </div>
              
              {/* Old Password Field */}
              <div className="form-group">
                <label htmlFor="oldPassword">
                  <FaLock className="input-icon" /> Old Password
                </label>
                <input
                  type="password"
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={formErrors.oldPassword ? 'error' : ''}
                />
                {formErrors.oldPassword && (
                  <span className="error-text">{formErrors.oldPassword}</span>
                )}
              </div>
              
              {/* New Password Field */}
              <div className="form-group">
                <label htmlFor="newPassword">
                  <FaKey className="input-icon" /> New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={formErrors.newPassword ? 'error' : ''}
                />
                {formErrors.newPassword && (
                  <span className="error-text">{formErrors.newPassword}</span>
                )}
              </div>
              
              {/* Confirm Password Field */}
              <div className="form-group full-width">
                <label htmlFor="confirmPassword">
                  <FaKey className="input-icon" /> Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={formErrors.confirmPassword ? 'error' : ''}
                />
                {formErrors.confirmPassword && (
                  <span className="error-text">{formErrors.confirmPassword}</span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span> Processing...
                  </>
                ) : (
                  <>
                    <FaSave /> Change Password
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                className="reset-btn"
                onClick={handleReset}
              >
                <FaTimes /> Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChangeUserPassword;