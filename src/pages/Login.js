// pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../utils/api';
import './login.css';

function Login() {
  const [user_id, setuser_id] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login({ user_id, password });
      
      if (response.data.success) {
        // Access the nested data object
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Use Zustand login action
        login(user, { accessToken, refreshToken });
        
        console.log('User logged in successfully');
        
        // Redirect to dashboard
        navigate('/dashboard');
        
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <div className="login-blue">
          <h2 className="login-title">VTS</h2>
          <p className="login-desc">Vehicle Tracking</p>
        </div>
        <div className="login-form-section">
          <form className="login-form" onSubmit={handleSubmit}>
            <h3>Admin Login</h3>
            {error && <div className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
            
            {isLoading && (
              <div className="loading-overlay">
                <div className="loader"></div>
                <p>Authenticating...</p>
              </div>
            )}
            
            <div className="input-group">
              <input
                type="text"
                placeholder="username"
                value={user_id}
                onChange={e => setuser_id(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <span className="login-helper">Login to continue.</span>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;