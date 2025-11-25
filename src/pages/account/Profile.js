// pages/account/Profile.js
import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useAuthStore } from '../../stores/authStore';
import { profileAPI, userAPI } from '../../utils/api';
import './profile.css';

const Profile = () => {
  // Get user and auth functions from Zustand store
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  
  // State for UI interactions only
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form with user data from Zustand store
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Handle profile form input changes
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value
    });
  };

  // Handle password form input changes
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };

  // Handle profile update submission using both APIs
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare request body
      const requestBody = {
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        email: profileForm.email
      };

      // Try to update using profileAPI first (current user)
      let response;
      try {
        response = await profileAPI.updateProfile(requestBody);
      } catch (profileError) {
        // If profileAPI fails, try with userAPI using user ID
        const userId = user?.id || user?.user_id;
        if (userId) {
          response = await userAPI.updateUser(userId, requestBody);
        } else {
          throw profileError;
        }
      }
      
      if (response.status !== 200) {
        throw new Error(response.data?.message || 'Failed to update profile');
      }

      // Update the Zustand store with new data
      updateUser({
        ...user,
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        email: profileForm.email
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change submission using both APIs
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Password validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords don't match!");
      setIsLoading(false);
      return;
    }

    try {
      // Get user ID for password change
      const userId = user?.id || user?.user_id;
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Try to update using userAPI first
      let response;
      try {
        response = await userAPI.changePassword(userId, {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        });
      } catch (userError) {
        // If userAPI fails, try with profileAPI if available
        try {
          response = await profileAPI.updateProfile({
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword
          });
        } catch (profileError) {
          throw userError; // Throw the original error
        }
      }
      
      if (response.status !== 200) {
        throw new Error(response.data?.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel profile editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to current user data from Zustand store
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  };

  // Toggle password form visibility
  const togglePasswordForm = () => {
    setShowPasswordForm(!showPasswordForm);
    // Reset password form when toggling
    setPasswordForm({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };

  // Function to handle login redirect
  const handleLoginRedirect = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      <Helmet>
        <title>User Profile</title>
      </Helmet>
      
      <div className="profile-container">
        {/* Error and Success Messages */}
        {error && (
          <div className="error-message">
            {error}
            {error.includes('Authentication token not found') && (
              <button className="login-btn" onClick={handleLoginRedirect}>
                Go to Login
              </button>
            )}
          </div>
        )}
        {success && <div className="success-message">{success}</div>}
        
        {!isAuthenticated ? (
          <div className="auth-error-container">
            <h2>Authentication Required</h2>
            <p>You need to be logged in to view your profile.</p>
            <button className="login-btn" onClick={handleLoginRedirect}>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            {/* Profile Information Section */}
            <div className="profile-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                {!isEditing && (
                  <button 
                    className="edit-btn" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <form onSubmit={handleProfileSubmit} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="full_name">Full Name</label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={profileForm.full_name}
                        onChange={handleProfileInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileInputChange}
                        placeholder="+91 8579000000"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                    <button type="submit" className="save-btn" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-display">
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">User ID:</span>
                      <span className="value">{user?.user_id || 'Not available'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Full Name:</span>
                      <span className="value">{user?.full_name || 'Not available'}</span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Email:</span>
                      <span className="value">{user?.email || 'Not available'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Phone:</span>
                      <span className="value">{user?.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Role:</span>
                      <span className="value">{user?.role || 'Not assigned'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Status:</span>
                      <span className="value">
                        <span className={`status-badge ${user?.is_disabled ? 'inactive' : 'active'}`}>
                          {user?.is_disabled ? 'Inactive' : 'Active'}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Email Verified:</span>
                      <span className="value">
                        <span className={`status-badge ${user?.is_email_verified ? 'verified' : 'not-verified'}`}>
                          {user?.is_email_verified ? 'Verified' : 'Not Verified'}
                        </span>
                      </span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Account Disabled:</span>
                      <span className="value">
                        <span className={`status-badge ${user?.is_disabled ? 'disabled' : 'enabled'}`}>
                          {user?.is_disabled ? 'Disabled' : 'Enabled'}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Member Since:</span>
                      <span className="value">{formatDate(user?.created_at)}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Last Login:</span>
                      <span className="value">{formatDate(user?.last_login)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Change Password Section */}
            <div className="profile-section">
              <div className="section-header">
                <h2>Security</h2>
                <button 
                  className="change-password-btn" 
                  onClick={togglePasswordForm}
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>
              
              {showPasswordForm && (
                <div className="password-form-container">
                  <form onSubmit={handlePasswordSubmit} className="password-form">
                    <div className="form-group">
                      <label htmlFor="oldPassword">Current Password</label>
                      <input
                        type="password"
                        id="oldPassword"
                        name="oldPassword"
                        value={passwordForm.oldPassword}
                        onChange={handlePasswordInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordInputChange}
                        required
                      />
                    </div>

                    <div className="form-actions">
                      <button type="button" className="cancel-btn" onClick={togglePasswordForm}>
                        Cancel
                      </button>
                      <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Profile;