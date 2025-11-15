import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import BottomNavbar from "../../components/BottomNavbar";
import './changeuserpassword.css';

const ChangeUserPassword = () => {
  // State hooks for user search
  const [username, setUsername] = useState('');
  const [userFound, setUserFound] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // State hooks for password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle user search
  const handleSearch = (e) => {
    e.preventDefault();
    setSearching(true);
    
    // Simulate API call to find user
    setTimeout(() => {
      // For demo purposes, we'll consider any non-empty username as found
      if (username.trim() !== '') {
        setUserFound(true);
      } else {
        alert('Please enter a username or mobile number');
      }
      setSearching(false);
    }, 1000);
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    // Password validation
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    // API call would go here
    console.log('Password change submitted for user:', username);
    alert('Password changed successfully!');
    
    // Reset form
    setUsername('');
    setUserFound(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  // Reset form to search state
  const handleReset = () => {
    setUsername('');
    setUserFound(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      <Helmet>
        <title>Change CP Password</title>
      </Helmet>
      <Header />
      <BottomNavbar text="Change All User Password" />
      <div className="password-form-container">
        <form onSubmit={userFound ? handleSubmit : handleSearch} className="password-form">
          {/* Username/Mobile Number Field */}
          <div className="form-group">
            <label htmlFor="username">Username / Mobile Number</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username or mobile number"
              required
              disabled={userFound}
            />
          </div>

          {/* Search Button (only show if user not found) */}
          {!userFound && (
            <button type="submit" className="search-btn" disabled={searching}>
              {searching ? 'Searching...' : 'Search User'}
            </button>
          )}

          {/* User Info Display */}
          {userFound && (
            <div className="user-info">
              <p>Changing password for: <strong>{username}</strong></p>
            </div>
          )}

          {/* Separator between search and password sections */}
          <div className="form-section-separator"></div>


          {/* New Password Field */}
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={!userFound}
            />
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!userFound}
            />
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            {/* Submit Button */}
            <button 
              type="submit" 
              className={`submit-btn ${!userFound ? 'disabled' : ''}`}
              disabled={!userFound}
            >
              CHANGE PASSWORD
            </button>
            
            {/* Reset Button (only show if user found) */}
            {userFound && (
              <button 
                type="button" 
                className="reset-btn"
                onClick={handleReset}
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default ChangeUserPassword;