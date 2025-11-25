import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { FaUser, FaLock, FaKey, FaSave, FaTimes, FaCheckCircle, FaSearch } from "react-icons/fa";
import { useAuthStore } from '../../stores/authStore';
import { useForm } from 'react-hook-form';
import styles from './changeuserpassword.module.css';

const ChangeUserPassword = () => {
  // Get user and token from Zustand store
  const { user, accessToken: token } = useAuthStore();
  
  // State hooks for UI elements
  const [isLoading, setIsLoading] = useState(false);
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

  // Initialize React Hook Form
  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
    defaultValues: {
      userType: '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Watch the userType field for filtering users
  const userTypeValue = watch('userType');

  // Filter users based on search term and user type
  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setUserSearchResults([]);
      return;
    }

    const filteredUsers = mockUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
      const matchesType = !userTypeValue || user.type === userTypeValue;
      return matchesSearch && matchesType;
    });

    setUserSearchResults(filteredUsers);
    setShowUserDropdown(true);
  }, [userSearchTerm, userTypeValue]);

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUserSearchTerm(user.name);
    setShowUserDropdown(false);
  };

  // Helper function to get user ID from token or user object
  const getUserId = () => {
    // First try to get ID from user object
    if (user && (user.id || user.user_id)) {
      return user.id || user.user_id;
    }
    
    // If not available, try to decode the token
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

  // Handle form submission
  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Get user ID
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
          oldPassword: data.oldPassword,
          newPassword: data.newPassword
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to change password');
      }
      
      // Success
      setSuccessMessage('Password changed successfully!');
      
      // Reset form after successful submission
      setTimeout(() => {
        reset();
        setUserSearchTerm('');
        setSelectedUser(null);
        setSuccessMessage('');
      }, 2000);
      
    } catch (error) {
      // Set form error for submit
      setValue('submit', error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    reset();
    setUserSearchTerm('');
    setSelectedUser(null);
    setShowUserDropdown(false);
  };

  return (
    <>
      <Helmet>
        <title>Change User Password</title>
      </Helmet>
      
      <div className={styles.passwordChangeContainer}>
        <div className={styles.passwordChangeCard}>
          <div className={styles.cardHeader}>
            <h2>Change User Password</h2>
            <p>Update password for any user in the system</p>
          </div>
          
          {successMessage && (
            <div className={styles.successMessage}>
              <FaCheckCircle /> {successMessage}
            </div>
          )}
          
          {errors.submit && (
            <div className={styles.errorMessage}>
              {errors.submit.message}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className={styles.passwordForm}>
            <div className={styles.formGrid}>
              {/* User Type Field */}
              <div className={styles.formGroup}>
                <label htmlFor="userType">
                  <FaUser className={styles.inputIcon} /> User Type
                </label>
                <select
                  id="userType"
                  {...register('userType', { 
                    required: 'Please select a user type' 
                  })}
                  className={errors.userType ? 'error' : ''}
                >
                  {userTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.userType && (
                  <span className={styles.errorText}>{errors.userType.message}</span>
                )}
              </div>
              
              {/* Username Search Field */}
              <div className={styles.formGroup}>
                <label htmlFor="username">
                  <FaSearch className={styles.inputIcon} /> Search User
                </label>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    id="username"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search by name or email"
                    className={errors.username ? 'error' : ''}
                    onFocus={() => setShowUserDropdown(true)}
                  />
                  {showUserDropdown && userSearchResults.length > 0 && (
                    <div className={styles.searchDropdown}>
                      {userSearchResults.map((user) => (
                        <div 
                          key={user.id} 
                          className={styles.searchResultItem}
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className={styles.userName}>{user.name}</div>
                          <div className={styles.userEmail}>{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.username && (
                  <span className={styles.errorText}>{errors.username.message}</span>
                )}
              </div>
              
              {/* Old Password Field */}
              <div className={styles.formGroup}>
                <label htmlFor="oldPassword">
                  <FaLock className={styles.inputIcon} /> Old Password
                </label>
                <input
                  type="password"
                  id="oldPassword"
                  {...register('oldPassword', { 
                    required: 'Old password is required' 
                  })}
                  placeholder="Enter current password"
                  className={errors.oldPassword ? 'error' : ''}
                />
                {errors.oldPassword && (
                  <span className={styles.errorText}>{errors.oldPassword.message}</span>
                )}
              </div>
              
              {/* New Password Field */}
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">
                  <FaKey className={styles.inputIcon} /> New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  {...register('newPassword', { 
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  placeholder="Enter new password"
                  className={errors.newPassword ? 'error' : ''}
                />
                {errors.newPassword && (
                  <span className={styles.errorText}>{errors.newPassword.message}</span>
                )}
              </div>
              
              {/* Confirm Password Field */}
              <div className={`${styles.formGroup} ${styles.formGroupFullWidth}`}>
                <label htmlFor="confirmPassword">
                  <FaKey className={styles.inputIcon} /> Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => 
                      value === watch('newPassword') || 'Passwords do not match'
                  })}
                  placeholder="Confirm new password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && (
                  <span className={styles.errorText}>{errors.confirmPassword.message}</span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner}></span> Processing...
                  </>
                ) : (
                  <>
                    <FaSave /> Change Password
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                className={styles.resetBtn}
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