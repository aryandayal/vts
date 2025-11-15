import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import Header from '../../components/Header';
import BottomNavbar from '../../components/BottomNavbar';
import Cookies from 'js-cookie';
import './manageuser.css';

const ManageUser = () => {
  // Form state - matches the request format exactly
  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Operator' // Default role
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Table data state
  const [users, setUsers] = useState([]);

  // Role options
  const roleOptions = [
    'Super Admin',
    'Head Quarter Admin',
    'Manager',
    'Operator',
    'Transporter',
    'Driver'
  ];

  // API base URL
  const API_BASE_URL = 'http://3.109.186.142:3005';

  // Fetch users from database using GET /api/users (for table display)
  const fetchUsers = async () => {
    setIsFetching(true);
    setError('');
    
    try {
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      // Check if response has data array
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format: data array missing');
      }

      // Transform the data to match our table structure
      const transformedUsers = data.data.map(user => ({
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || 'Not provided',
        role: user.role || 'Not assigned',
        status: user.status || 'INACTIVE',
        lastLogin: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
        createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'
      }));

      setUsers(transformedUsers);
      console.log('Users fetched successfully:', transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch single user for editing using GET /api/users/:userId
  const fetchUserForEdit = async (id) => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      // Populate form with user data
      setFormData({
        user_id: data.data.user_id,
        full_name: data.data.full_name,
        email: data.data.email,
        phone: data.data.phone || '',
        password: '', // Don't populate password for security
        role: data.data.role || 'Operator'
      });
      
      setIsEditing(true);
      setEditingUserId(id);
      
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission - for both create and update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Prepare API request data - matches the provided request format exactly
      const apiData = {
        user_id: formData.user_id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      };

      // Only include password if it's provided (for create or password change)
      if (formData.password) {
        apiData.password = formData.password;
      }

      console.log('Sending API request:', apiData);

      let response;
      let url;
      let method;

      if (isEditing) {
        // Update existing user using PUT /api/users/:userId
        url = `${API_BASE_URL}/api/users/${editingUserId}`;
        method = 'PUT';
      } else {
        // Create new user using POST /api/users/create
        url = `${API_BASE_URL}/api/users/create`;
        method = 'POST';
      }

      response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();
      console.log('API response:', data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} user`);
      }

      // Reset form
      setFormData({
        user_id: '',
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'Operator'
      });
      
      setIsEditing(false);
      setEditingUserId(null);
      
      setSuccess(`User ${isEditing ? 'updated' : 'created'} successfully!`);
      
      // Refresh the user list to get the latest data
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit action
  const handleEdit = (id) => {
    fetchUserForEdit(id);
  };

  // Handle delete action using DELETE /api/users/:userId (soft delete)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This is a soft delete.')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      setSuccess('User deleted successfully!');
      
      // Refresh the user list to get the latest data
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disable user action using POST /api/users/:userId/disable
  const handleDisable = async (id) => {
    if (!window.confirm('Are you sure you want to disable this user?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${id}/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to disable user');
      }

      setSuccess('User disabled successfully!');
      
      // Refresh the user list to get the latest data
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle enable user action using POST /api/users/:userId/enable
  const handleEnable = async (id) => {
    if (!window.confirm('Are you sure you want to enable this user?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${id}/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to enable user');
      }

      setSuccess('User enabled successfully!');
      
      // Refresh the user list to get the latest data
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({
      user_id: '',
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'Operator'
    });
  };

  // Handle assign action
  const handleAssign = (id) => {
    alert(`Assigning home page data to user with ID: ${id}`);
  };

  return (
    <>
      <Helmet>
        <title>ManageUser</title>
      </Helmet>
      <Header />
      <BottomNavbar text="Add/Update Users"/>
    
      <div className="user-management-container">
        <div className="left-panel">
          <div className="form-card">
            <h2>{isEditing ? 'Update User' : 'Add User'}</h2>
            
            {/* Error and Success Messages */}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="user_id">User ID</label>
                <input 
                  type="text" 
                  id="user_id" 
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input 
                  type="text" 
                  id="full_name" 
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1-555-1234"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  {isEditing ? 'Password (leave blank to keep current)' : 'Password'}
                </label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!isEditing}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select 
                  id="role" 
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                {isEditing && (
                  <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="add-button" disabled={isLoading}>
                  {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'UPDATE' : 'ADD')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="right-panel">
          <div className="table-container">
            <div className="table-header">
              <h2>User Management</h2>
              <button 
                className="refresh-button" 
                onClick={fetchUsers}
                disabled={isFetching}
              >
                {isFetching ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {isFetching ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : (
              <div className="table-wrapper">
                {users.length === 0 ? (
                  <div className="no-data-message">
                    <p>No users found. Add a new user to get started.</p>
                  </div>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Created At</th>
                        <th>Assign</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.full_name}</td>
                          <td>{user.email}</td>
                          <td>{user.phone}</td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`status-badge ${user.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>{user.lastLogin}</td>
                          <td>{user.createdAt}</td>
                          <td>
                            <button 
                              className="assign-button"
                              onClick={() => handleAssign(user.id)}
                            >
                              Assign
                            </button>
                          </td>
                          <td className="action-buttons">
                            <button 
                              className="edit-button" 
                              onClick={() => handleEdit(user.id)}
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button 
                              className="delete-button" 
                              onClick={() => handleDelete(user.id)}
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                            {user.status === 'ACTIVE' ? (
                              <button 
                                className="disable-button" 
                                onClick={() => handleDisable(user.id)}
                                title="Disable"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="1" y="5" width="22" height="14" rx="2" ry="2"></rect>
                                  <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                              </button>
                            ) : (
                              <button 
                                className="enable-button" 
                                onClick={() => handleEnable(user.id)}
                                title="Enable"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="1" y="5" width="22" height="14" rx="2" ry="2"></rect>
                                  <line x1="1" y1="10" x2="23" y2="10"></line>
                                  <path d="M8 15h8"></path>
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageUser;