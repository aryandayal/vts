// pages/user/ManageUser.js
import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../stores/authStore';
import { userAPI } from '../../utils/api';
import api from '../../utils/api'; // Import the default api instance
import styles from './manageuser.module.css';

const ManageUser = () => {
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
  
  // Get auth state and functions from Zustand store
  const { user, isAuthenticated, hasRole } = useAuthStore();

  // Role options
  const roleOptions = [
    'SUPER_ADMIN',
    'HEAD_QUARTER_ADMIN',
    'MANAGER',
    'OPERATOR',
    'TRANSPORTER',
    'DRIVER'
  ];

  // Role mapping between API format and display format
  const roleDisplayMap = {
    'SUPER_ADMIN': 'Super Admin',
    'HEAD_QUARTER_ADMIN': 'Head Quarter Admin',
    'MANAGER': 'Manager',
    'OPERATOR': 'Operator',
    'TRANSPORTER': 'Transporter',
    'DRIVER': 'Driver'
  };

  // Check user permissions
  const hasPermission = hasRole('SUPER_ADMIN');

  // Initialize React Hook Form
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      user_id: '',
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'OPERATOR' // Default role in API format
    }
  });

  // Fetch users from database
  const fetchUsers = async () => {
    if (!hasPermission) {
      setIsFetching(false);
      return;
    }
    
    setIsFetching(true);
    setError('');
    
    try {
      const response = await userAPI.getUsers();
      const data = response.data;

      if (!data.data || !data.data.users || !Array.isArray(data.data.users)) {
        throw new Error('Invalid response format: users array missing');
      }

      // Transform the data to match our table structure
      const transformedUsers = data.data.users.map(user => ({
        id: user.id, // Use the UUID for operations
        user_id: user.user_id, // Keep the business ID for display
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || 'Not provided',
        role: roleDisplayMap[user.role] || user.role, // Convert API role to display format
        status: user.is_active ? 'ACTIVE' : 'INACTIVE', // Updated to use is_active
        isEmailVerified: user.is_email_verified, // Add email verification status
        lastLogin: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
        createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'
      }));

      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch single user for editing
  const fetchUserForEdit = async (id) => {
    if (!hasPermission) {
      setError('You do not have permission to edit users.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await userAPI.getUserById(id);
      const data = response.data;

      // Populate form with user data using React Hook Form's setValue
      setValue('user_id', data.data.user_id);
      setValue('full_name', data.data.full_name);
      setValue('email', data.data.email);
      setValue('phone', data.data.phone || '');
      setValue('password', ''); // Don't populate password for security
      setValue('role', data.data.role); // Use API role format directly
      
      setIsEditing(true);
      setEditingUserId(id);
      
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch user');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    } else {
      setIsFetching(false);
      setError('Authentication required. Please login.');
    }
  }, [isAuthenticated]);

  // Handle form submission - for both create and update
  const onSubmit = async (data) => {
    if (!hasPermission) {
      setError('You do not have permission to add or update users.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare API request data - use the exact format expected by the API
      const apiData = {
        user_id: data.user_id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role // Use the role value directly from the form (already in API format)
      };

      // For editing, don't send password if it's empty
      if (isEditing && !data.password) {
        delete apiData.password;
      }

      let response;
      
      if (isEditing) {
        // Update existing user
        response = await userAPI.updateUser(editingUserId, apiData);
      } else {
        // Create new user using the correct endpoint
        response = await api.post('/users/create', apiData);
      }

      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Request failed with status code ${response.status}`);
      }

      // Reset form using React Hook Form's reset
      reset();
      
      setIsEditing(false);
      setEditingUserId(null);
      
      setSuccess(`User ${isEditing ? 'updated' : 'created'} successfully!`);
      
      // Refresh the user list to get the latest data
      await fetchUsers();
    } catch (err) {
      console.error('Error in onSubmit:', err);
      
      // More detailed error message
      let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} user`;
      if (err.response) {
        errorMessage += `: ${err.response.status} ${err.response.statusText}`;
        if (err.response.data && err.response.data.message) {
          errorMessage += ` - ${err.response.data.message}`;
        }
        
        // Special handling for 400 Bad Request
        if (err.response.status === 400) {
          errorMessage += '. Please check all required fields and try again.';
          
          // Log validation errors if available
          if (err.response.data && err.response.data.errors) {
            console.error('Validation errors:', err.response.data.errors);
            const errorMessages = Object.values(err.response.data.errors).flat().join(', ');
            errorMessage += ` Details: ${errorMessages}`;
          }
        }
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit action
  const handleEdit = (id) => {
    if (!hasPermission) {
      setError('You do not have permission to edit users.');
      return;
    }
    
    fetchUserForEdit(id);
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (!hasPermission) {
      setError('You do not have permission to delete users.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user? This is a soft delete.')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await userAPI.deleteUser(id);
      setSuccess('User deleted successfully!');
      
      // Refresh the user list to get the latest data
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disable user action
  const handleDisable = async (id) => {
    if (!hasPermission) {
      setError('You do not have permission to disable users.');
      return;
    }
    
    // Prompt for reason before disabling
    const reason = prompt('Please provide a reason for disabling this user:');
    if (!reason) {
      return; // User cancelled or didn't provide a reason
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Call the disable API endpoint
      const response = await userAPI.disableUser(id, reason);
      
      // Log the response for debugging
      console.log('Disable user response:', response);
      
      // Check if the response was successful (status code 2xx)
      if (response.status >= 200 && response.status < 300) {
        setSuccess('User disabled successfully!');
        
        // Refresh the user list to get the latest data
        await fetchUsers();
      } else {
        throw new Error(`Request failed with status code ${response.status}`);
      }
    } catch (err) {
      console.error('Error disabling user:', err);
      setError(err.response?.data?.message || err.message || 'Failed to disable user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle enable user action
  const handleEnable = async (id) => {
    if (!hasPermission) {
      setError('You do not have permission to enable users.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to enable this user?')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Call the enable API endpoint
      const response = await userAPI.enableUser(id);
      
      // Log the response for debugging
      console.log('Enable user response:', response);
      
      // Check if the response was successful (status code 2xx)
      if (response.status >= 200 && response.status < 300) {
        setSuccess('User enabled successfully!');
        
        // Refresh the user list to get the latest data
        await fetchUsers();
      } else {
        throw new Error(`Request failed with status code ${response.status}`);
      }
    } catch (err) {
      console.error('Error enabling user:', err);
      setError(err.response?.data?.message || err.message || 'Failed to enable user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingUserId(null);
    reset(); // Reset form using React Hook Form
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    return status === 'ACTIVE' ? styles.statusBadgeActive : styles.statusBadgeInactive;
  };

  // Get email verification badge class
  const getEmailVerifiedBadgeClass = (isVerified) => {
    return isVerified ? styles.verifiedBadge : styles.notVerifiedBadge;
  };

  return (
    <>
      <Helmet>
        <title>ManageUser</title>
      </Helmet>
    
      <div className={styles.userManagementContainer}>
        {!isAuthenticated ? (
          <div className={styles.permissionDenied}>
            <h2>Authentication Required</h2>
            <p>Please login to access this page.</p>
          </div>
        ) : !hasPermission ? (
          <div className={styles.permissionDenied}>
            <h2>Permission Denied</h2>
            <p>You do not have permission to manage users. Only Super Admin can access this page.</p>
            <p>Please contact your administrator if you believe this is an error.</p>
          </div>
        ) : (
          <>
            <div className={styles.leftPanel}>
              <div className={styles.formCard}>
                <h2>{isEditing ? 'Update User' : 'Add User'}</h2>
                
                {/* Error and Success Messages */}
                {error && <div className={styles.errorMessage}>{error}</div>}
                {success && <div className={styles.successMessage}>{success}</div>}
                
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className={styles.formGroup}>
                    <label htmlFor="user_id">User ID</label>
                    <input 
                      type="text" 
                      id="user_id"
                      name="user_id"
                      {...register('user_id', { 
                        required: 'User ID is required',
                        pattern: {
                          value: /^[A-Za-z0-9]+$/,
                          message: 'User ID can only contain letters and numbers'
                        }
                      })}
                    />
                    {errors.user_id && <p className={styles.errorText}>{errors.user_id.message}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="full_name">Full Name</label>
                    <input 
                      type="text" 
                      id="full_name"
                      name="full_name"
                      {...register('full_name', { 
                        required: 'Full name is required',
                        minLength: {
                          value: 2,
                          message: 'Full name must be at least 2 characters'
                        }
                      })}
                    />
                    {errors.full_name && <p className={styles.errorText}>{errors.full_name.message}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                    {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone"
                      name="phone"
                      {...register('phone', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[+]?[0-9]{10,15}$/,
                          message: 'Invalid phone number format'
                        }
                      })}
                      placeholder="10 digits"
                    />
                    {errors.phone && <p className={styles.errorText}>{errors.phone.message}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password">
                      {isEditing ? 'Password (leave blank to keep current)' : 'Password'}
                    </label>
                    <input 
                      type="password" 
                      id="password"
                      name="password"
                      {...register('password', { 
                        required: isEditing ? false : 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                    />
                    {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="role">Role</label>
                    <select 
                      id="role"
                      name="role"
                      {...register('role', { 
                        required: 'Role is required'
                      })}
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>{roleDisplayMap[role]}</option>
                      ))}
                    </select>
                    {errors.role && <p className={styles.errorText}>{errors.role.message}</p>}
                  </div>

                  <div className={styles.formActions}>
                    {isEditing && (
                      <button type="button" className={styles.cancelBtn} onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" className={styles.addButton} disabled={isLoading}>
                      {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'UPDATE' : 'ADD')}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className={styles.rightPanel}>
              <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                  <h2>User Management</h2>
                  <button 
                    className={styles.refreshButton} 
                    onClick={fetchUsers}
                    disabled={isFetching}
                  >
                    {isFetching ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                
                {isFetching ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading users...</p>
                  </div>
                ) : (
                  <div className={styles.tableWrapper}>
                    {users.length === 0 ? (
                      <div className={styles.noDataMessage}>
                        <p>No users found. Add a new user to get started.</p>
                      </div>
                    ) : (
                      <table className={styles.usersTable}>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Email Verified</th>
                            <th>Last Login</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.user_id}</td>
                              <td>{user.full_name}</td>
                              <td>{user.email}</td>
                              <td>{user.phone}</td>
                              <td>{user.role}</td>
                              <td>
                                <span className={`${styles.statusBadge} ${getStatusBadgeClass(user.status)}`}>
                                  {user.status}
                                </span>
                              </td>
                              <td>
                                <span className={`${styles.emailVerifiedBadge} ${getEmailVerifiedBadgeClass(user.isEmailVerified)}`}>
                                  {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                                </span>
                              </td>
                              <td>{user.lastLogin}</td>
                              <td>{user.createdAt}</td>
                              <td className={styles.actionButtons}>
                                <button 
                                  className={styles.editButton} 
                                  onClick={() => handleEdit(user.id)}
                                  title="Edit"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </button>
                                <button 
                                  className={styles.deleteButton} 
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
                                    className={styles.disableButton} 
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
                                    className={styles.enableButton} 
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
          </>
        )}
      </div>
    </>
  );
};

export default ManageUser;