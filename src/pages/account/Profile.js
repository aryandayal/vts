import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import BottomNavbar from "../../components/BottomNavbar";
import { useUser } from '../../components/UserContext'; // Import the useUser hook
import Cookies from 'js-cookie'; // Import Cookies directly
import './profile.css';

const Profile = () => {
  // Get user, setUser, and token from context
  const { user, setUser, token: contextToken } = useUser();
  
  // State for user profile data
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for profile editing - matching the request format
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  
  // State for password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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

  // Fetch user profile data - using user-specific endpoint
  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Get token using our helper function
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Get user ID
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Using GET /api/users/:userId endpoint for the current user
      const response = await fetch(`http://3.109.186.142:3005/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      // Check if response has data object with user details
      if (!data.data) {
        throw new Error('Invalid response format: user data missing');
      }

      // Set the user profile directly from the response
      const currentUser = data.data;
      setUserProfile(currentUser);
      
      // Initialize profile form with current data - matching the response format
      setProfileForm({
        full_name: currentUser.full_name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile when component mounts or when token changes
  useEffect(() => {
    // Check if we have a token either in context or cookies
    const token = getToken();
    if (token) {
      fetchUserProfile();
    } else {
      setError('Authentication token not found. Please login again.');
      setIsLoading(false);
    }
  }, [contextToken]); // Depend on contextToken to refetch when it changes

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

  // Handle profile update submission - using PUT method
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get token using our helper function
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Get user ID
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Prepare request body with only the fields that can be updated
      const requestBody = {
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        email: profileForm.email
      };

      // Using PUT /api/users/:userId endpoint to update user details
      const response = await fetch(`http://3.109.186.142:3005/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Create updated user object
      const updatedUser = {
        ...userProfile,
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        email: profileForm.email
      };

      // Update the profile state with new data
      setUserProfile(updatedUser);
      
      // Update the context with new user data
      setUser(updatedUser);

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change submission
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
      // Get token using our helper function
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Get user ID
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Using POST /api/users/:userId/change-password endpoint
      const response = await fetch(`http://3.109.186.142:3005/api/users/${userId}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel profile editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to current profile data
    if (userProfile) {
      setProfileForm({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        email: userProfile.email || ''
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
    window.location.href = '/login';
  };

  return (
    <>
      <Helmet>
        <title>User Profile</title>
      </Helmet>
      <Header />
      <BottomNavbar text="User Profile" />
      
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
        
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : error && error.includes('Authentication token not found') ? (
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
                      <span className="value">{userProfile?.user_id || user?.user_id}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Full Name:</span>
                      <span className="value">{userProfile?.full_name || user?.full_name}</span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Email:</span>
                      <span className="value">{userProfile?.email || user?.email}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Phone:</span>
                      <span className="value">{userProfile?.phone || user?.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Role:</span>
                      <span className="value">{userProfile?.role || user?.role || 'Not assigned'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Status:</span>
                      <span className="value">
                        <span className={`status-badge ${userProfile?.is_disabled || user?.is_disabled ? 'inactive' : 'active'}`}>
                          {userProfile?.is_disabled || user?.is_disabled ? 'Inactive' : 'Active'}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Email Verified:</span>
                      <span className="value">
                        <span className={`status-badge ${userProfile?.is_email_verified || user?.is_email_verified ? 'verified' : 'not-verified'}`}>
                          {userProfile?.is_email_verified || user?.is_email_verified ? 'Verified' : 'Not Verified'}
                        </span>
                      </span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Account Disabled:</span>
                      <span className="value">
                        <span className={`status-badge ${userProfile?.is_disabled || user?.is_disabled ? 'disabled' : 'enabled'}`}>
                          {userProfile?.is_disabled || user?.is_disabled ? 'Disabled' : 'Enabled'}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Member Since:</span>
                      <span className="value">{formatDate(userProfile?.created_at || user?.created_at)}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Last Login:</span>
                      <span className="value">{formatDate(userProfile?.last_login || user?.last_login)}</span>
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