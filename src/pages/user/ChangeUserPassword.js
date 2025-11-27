import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { FaUser, FaLock, FaKey, FaSave, FaTimes, FaCheckCircle, FaSearch } from "react-icons/fa";
import { useAuthStore } from '../../stores/authStore';
import { useForm } from 'react-hook-form';
import { useUsers } from '../../hooks/useData';
import styles from './changeuserpassword.module.css';

const ChangeUserPassword = () => {
  // Get user and token from Zustand store
  const { user, accessToken: token } = useAuthStore();
  
  // Get users data and functions from useUsers hook
  const {
    users,
    usersLoading,
    usersError,
    fetchUsers,
    changeUserPassword
  } = useUsers();
  
  // State hooks for UI elements
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for user search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // User type options - mapped to match the role format
  const userTypes = [
    { value: '', label: 'Select User Type' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'OPERATOR', label: 'Operator' },
    { value: 'TRANSPORTER', label: 'Transporter' },
    { value: 'DRIVER', label: 'Driver' }
  ];

  // Initialize React Hook Form
  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
    defaultValues: {
      userType: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Watch the userType field for filtering users
  const userTypeValue = watch('userType');

  // Fetch users when component mounts or when userType changes
  useEffect(() => {
    if (userTypeValue) {
      fetchUsers({ role: userTypeValue });
    } else {
      // Fetch all users if no type is selected
      fetchUsers();
    }
  }, [userTypeValue, fetchUsers]);

  // Show users of selected role automatically when role is selected
  useEffect(() => {
    if (userTypeValue && users.length > 0) {
      // When a role is selected and users are loaded, show all users of that role
      setUserSearchResults(users);
      setShowUserDropdown(true);
      setUserSearchTerm(''); // Clear search term to show all users
    } else if (!userTypeValue) {
      // If no role is selected, clear the search results
      setUserSearchResults([]);
      setShowUserDropdown(false);
    }
  }, [userTypeValue, users]);

  // Filter users based on search term
  useEffect(() => {
    if (!userTypeValue) return; // Don't filter if no role is selected
    
    if (userSearchTerm.trim() === '') {
      // If search term is empty, show all users of the selected role
      setUserSearchResults(users);
      setShowUserDropdown(true);
      return;
    }

    const filteredUsers = users.filter(user => {
      return user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
             user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
             user.user_id.toLowerCase().includes(userSearchTerm.toLowerCase());
    });

    setUserSearchResults(filteredUsers);
    setShowUserDropdown(true);
  }, [userSearchTerm, users, userTypeValue]);

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUserSearchTerm(user.full_name);
    setShowUserDropdown(false);
  };

  // Handle form submission
  const onSubmit = async (data) => {
    if (!selectedUser) {
      setValue('submit', 'Please select a user');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the changeUserPassword function from the hook
      const result = await changeUserPassword(selectedUser.id, data.newPassword);
      
      if (result.error) {
        throw new Error(result.error || 'Failed to change password');
      }
      
      // Success
      setSuccessMessage(`Password changed successfully for ${selectedUser.full_name}!`);
      
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

  // Format role for display
  const formatRole = (role) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          
          {usersError && (
            <div className={styles.errorMessage}>
              {usersError}
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
                {usersLoading && (
                  <div className={styles.loadingText}>Loading users...</div>
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
                    placeholder="Search by name, email or user ID"
                    className={errors.username ? 'error' : ''}
                    onFocus={() => userTypeValue && setShowUserDropdown(true)}
                    disabled={!userTypeValue || usersLoading}
                  />
                  {showUserDropdown && userSearchResults.length > 0 && (
                    <div className={styles.searchDropdown}>
                      {userSearchResults.map((user) => (
                        <div 
                          key={user.id} 
                          className={styles.searchResultItem}
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className={styles.userName}>{user.full_name}</div>
                          <div className={styles.userEmail}>{user.email}</div>
                          <div className={styles.userMeta}>
                            <span className={styles.userId}>{user.user_id}</span>
                            <span className={styles.userRole}>{formatRole(user.role)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showUserDropdown && userSearchResults.length === 0 && userTypeValue && (
                    <div className={styles.searchDropdown}>
                      <div className={styles.noResults}>
                        {usersLoading ? 'Loading users...' : 'No users found'}
                      </div>
                    </div>
                  )}
                </div>
                {errors.username && (
                  <span className={styles.errorText}>{errors.username.message}</span>
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
              <div className={styles.formGroup}>
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
                disabled={isLoading || !selectedUser}
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