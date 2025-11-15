import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import BottomNavbar from "../../components/BottomNavbar";
import Cookies from 'js-cookie';
import { useUser } from '../../components/UserContext'; // Import the useUser hook
import './profile.css';

const Profile = () => {
  // Get user and setUser from context
  const { user, setUser } = useUser();
  
  // State for user profile data
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for profile editing - matching the request format
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    jobTitle: '',
    companyName: '',
    city: '',
    country: ''
  });
  
  // State for password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user profile data
  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch('http://3.109.186.142:3005/api/users/profile', {
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

      // Check if response has data object
      if (!data.data) {
        throw new Error('Invalid response format: data object missing');
      }

      setUserProfile(data.data);
      
      // Initialize profile form with current data - matching the response format
      setProfileForm({
        firstName: data.data.first_name || '',
        lastName: data.data.last_name || '',
        phoneNumber: data.data.phone_number || '',
        jobTitle: data.data.job_title || '',
        companyName: data.data.company_name || '',
        city: data.data.city || '',
        country: data.data.country || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

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

  // Handle profile update submission - matching the request format
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Prepare request body matching the provided format
      const requestBody = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phoneNumber: profileForm.phoneNumber,
        jobTitle: profileForm.jobTitle,
        companyName: profileForm.companyName,
        city: profileForm.city,
        country: profileForm.country
      };

      const response = await fetch('http://3.109.186.142:3005/api/users/profile', {
        method: 'PATCH',
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
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        phone_number: profileForm.phoneNumber,
        job_title: profileForm.jobTitle,
        company_name: profileForm.companyName,
        city: profileForm.city,
        country: profileForm.country
      };

      // Update the profile state with new data
      setUserProfile(updatedUser);
      
      // Update the context with new user data
      setUser(updatedUser);
      
      // Update the cookie with new user data
      Cookies.set('user', JSON.stringify(updatedUser), { 
        expires: 7,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });

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
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch('http://3.109.186.142:3005/api/users/change-password', {
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
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        phoneNumber: userProfile.phone_number || '',
        jobTitle: userProfile.job_title || '',
        companyName: userProfile.company_name || '',
        city: userProfile.city || '',
        country: userProfile.country || ''
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

  return (
    <>
      <Helmet>
        <title>User Profile</title>
      </Helmet>
      {/* No need to pass username to Header component anymore */}
      <Header />
      <BottomNavbar text="User Profile" />
      
      <div className="profile-container">
        {/* Error and Success Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading profile...</p>
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
                      <label htmlFor="firstName">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleProfileInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleProfileInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={profileForm.phoneNumber}
                        onChange={handleProfileInputChange}
                        placeholder="+91 8579000000"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="jobTitle">Job Title</label>
                      <input
                        type="text"
                        id="jobTitle"
                        name="jobTitle"
                        value={profileForm.jobTitle}
                        onChange={handleProfileInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="companyName">Company Name</label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={profileForm.companyName}
                        onChange={handleProfileInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={profileForm.city}
                        onChange={handleProfileInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="country">Country</label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={profileForm.country}
                        onChange={handleProfileInputChange}
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
                      <span className="label">Username:</span>
                      <span className="value">{userProfile?.username}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Email:</span>
                      <span className="value">{userProfile?.email}</span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Full Name:</span>
                      <span className="value">{userProfile?.first_name} {userProfile?.last_name}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">User ID:</span>
                      <span className="value">{userProfile?.user_id}</span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Status:</span>
                      <span className="value">
                        <span className={`status-badge ${userProfile?.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                          {userProfile?.status}
                        </span>
                      </span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Role:</span>
                      <span className="value">{userProfile?.roles || 'Not assigned'}</span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Phone Number:</span>
                      <span className="value">{userProfile?.phone_number || 'Not provided'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Job Title:</span>
                      <span className="value">{userProfile?.job_title || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Company:</span>
                      <span className="value">{userProfile?.company_name || 'Not provided'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Location:</span>
                      <span className="value">
                        {userProfile?.city && userProfile?.country 
                          ? `${userProfile.city}, ${userProfile.country}` 
                          : userProfile?.city || userProfile?.country || 'Not provided'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="profile-row">
                    <div className="profile-item">
                      <span className="label">Member Since:</span>
                      <span className="value">{formatDate(userProfile?.created_at)}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">Last Login:</span>
                      <span className="value">{formatDate(userProfile?.last_login)}</span>
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