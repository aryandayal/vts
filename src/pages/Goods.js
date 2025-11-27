// pages/Goods.js
import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiSearch, FiChevronDown, FiChevronUp, FiPackage, FiRefreshCw } from 'react-icons/fi';
import styles from './goods.module.css';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { useGoods } from '../hooks/useData'; // Import the useGoods hook

const Goods = () => {
  // Get auth state and functions from authStore
  const { user, isAuthenticated, logout } = useAuthStore();
  
  // Get goods data and actions from Zustand store
  const { 
    goods, 
    goodsLoading, 
    goodsError, 
    fetchGoods, 
    addGoods, 
    updateGoods, 
    deleteGoods 
  } = useGoods();
  
  // UI states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'good_name', direction: 'ascending' });
  const [expandedRows, setExpandedRows] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize React Hook Form
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      good_name: '',
      good_type: '',
      description: '',
      unit_weight: '',
      status: 'active'
    }
  });
  
  // Check if error is due to authentication
  const isAuthError = (error) => {
    return error.response?.status === 401 || 
           error.message?.includes('Authentication') || 
           error.message?.includes('Unauthorized') ||
           error.message?.includes('token');
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };
  
  // Fetch goods when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchGoods();
    }
  }, [isAuthenticated, fetchGoods]);
  
  // Filter and sort goods
  const filteredGoods = useMemo(() => {
    const goodsArray = Array.isArray(goods) ? goods : [];
    
    let result = [...goodsArray];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.good_name?.toLowerCase().includes(term) ||
        item.good_type?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term)
      );
    }
    
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [goods, searchTerm, sortConfig]);
  
  // Handle form submission for adding/editing
  const onSubmit = async (data) => {
    setSubmitting(true);
    
    try {
      const requestData = {
        good_name: data.good_name,
        good_type: data.good_type,
        description: data.description,
        unit_weight: data.unit_weight,
        status: data.status
      };
      
      let result;
      
      if (isEditing && editingId) {
        result = await updateGoods(editingId, requestData);
      } else {
        result = await addGoods(requestData);
      }
      
      if (result.success) {
        setIsAdding(false);
        setIsEditing(false);
        setEditingId(null);
        reset();
        
        alert(isEditing ? 'Goods updated successfully!' : 'Goods added successfully!');
      } else {
        throw new Error(result.error || 'Failed to submit goods');
      }
    } catch (err) {
      console.error('Error submitting goods:', err);
      
      // Check if it's an authentication error
      if (isAuthError(err)) {
        handleLogout();
        return;
      }
      
      alert(err.message || 'Failed to submit goods');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit goods
  const handleEdit = (item) => {
    console.log('Editing item with ID:', item.id);
    
    setValue('good_name', item.good_name || '');
    setValue('good_type', item.good_type || '');
    setValue('description', item.description || '');
    setValue('unit_weight', item.unit_weight || '');
    setValue('status', item.status || 'active');
    
    setIsEditing(true);
    setIsAdding(true);
    setEditingId(item.id);
  };
  
  // Delete goods
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      const result = await deleteGoods(id);
      
      if (result.success) {
        alert('Goods deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete goods');
      }
    } catch (err) {
      console.error('Error deleting goods:', err);
      
      // Check if it's an authentication error
      if (isAuthError(err)) {
        handleLogout();
        return;
      }
      
      alert(err.message || 'Failed to delete goods');
    }
  };
  
  // Cancel form
  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    reset();
  };
  
  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
  };
  
  // Format status text safely
  const formatStatus = (status) => {
    if (!status) return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    if (!status) return styles.statusBadgeActive;
    return status === 'active' ? styles.statusBadgeActive : styles.statusBadgeInactive;
  };
  
  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={styles.errorContainer}>
        <h2>Authentication Required</h2>
        <p>You need to be logged in to view this page.</p>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleLogout}>
          Go to Login
        </button>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.actionsBar}>
        <div className={styles.searchContainer}>
          <div className={styles.searchInput}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search goods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className={styles.actionButtons}>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`} 
            onClick={() => {
              setIsAdding(true);
              setIsEditing(false);
              setEditingId(null);
              reset();
            }}
          >
            <FiPlus /> Add New Goods
          </button>
          
          <button 
            className={`${styles.btn} ${styles.btnSecondary}`} 
            onClick={fetchGoods}
            disabled={goodsLoading}
          >
            <FiRefreshCw /> {goodsLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {isAdding && (
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2>{isEditing ? 'Edit Goods' : 'Add New Goods'}</h2>
            <button className={styles.closeBtn} onClick={handleCancel}>
              <FiX />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className={styles.goodsForm}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Goods Name</label>
                <input
                  type="text"
                  {...register('good_name', { 
                    required: 'Goods name is required',
                    minLength: { value: 2, message: 'Goods name must be at least 2 characters' }
                  })}
                  placeholder="Enter goods name"
                />
                {errors.good_name && <p className={styles.errorMessage}>{errors.good_name.message}</p>}
              </div>
              
              <div className={styles.formGroup}>
                <label>Goods Type</label>
                <input
                  type="text"
                  {...register('good_type', { 
                    required: 'Goods type is required',
                    minLength: { value: 2, message: 'Goods type must be at least 2 characters' }
                  })}
                  placeholder="Enter goods type"
                />
                {errors.good_type && <p className={styles.errorMessage}>{errors.good_type.message}</p>}
              </div>
              
              <div className={styles.formGroup}>
                <label>Unit Weight</label>
                <input
                  type="text"
                  {...register('unit_weight', { 
                    required: 'Unit weight is required',
                    pattern: { 
                      value: /^[0-9]+(\.[0-9]+)?$/, 
                      message: 'Please enter a valid weight (e.g., 10 or 10.5)' 
                    }
                  })}
                  placeholder="Enter unit weight"
                />
                {errors.unit_weight && <p className={styles.errorMessage}>{errors.unit_weight.message}</p>}
              </div>
              
              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  {...register('status', { required: 'Status is required' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && <p className={styles.errorMessage}>{errors.status.message}</p>}
              </div>
            </div>
            
            <div className={`${styles.formGroup} ${styles.formGroupFullWidth}`}>
              <label>Description</label>
              <textarea
                {...register('description', { 
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' }
                })}
                placeholder="Enter goods description"
                rows="3"
              ></textarea>
              {errors.description && <p className={styles.errorMessage}>{errors.description.message}</p>}
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={submitting}
              >
                <FiSave /> {submitting ? 'Processing...' : (isEditing ? 'Update Goods' : 'Add Goods')}
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Goods Inventory</h2>
          <div className={styles.tableInfo}>
            Showing {Array.isArray(filteredGoods) ? filteredGoods.length : 0} of {Array.isArray(goods) ? goods.length : 0} items
          </div>
        </div>
        
        <div className={styles.tableWrapper}>
          {goodsLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading goods...</p>
            </div>
          ) : goodsError ? (
            <div className={styles.errorContainer}>
              <p>Error: {goodsError}</p>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={fetchGoods}>
                Retry
              </button>
            </div>
          ) : (
            <table className={styles.goodsTable}>
              <thead>
                <tr>
                  <th onClick={() => requestSort('good_name')}>
                    Name {getSortIndicator('good_name')}
                  </th>
                  <th onClick={() => requestSort('good_type')}>
                    Type {getSortIndicator('good_type')}
                  </th>
                  <th onClick={() => requestSort('unit_weight')}>
                    Unit Weight {getSortIndicator('unit_weight')}
                  </th>
                  <th onClick={() => requestSort('status')}>
                    Status {getSortIndicator('status')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(filteredGoods) && filteredGoods.length > 0 ? (
                  filteredGoods.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr 
                        className={`${styles.goodsRow} ${expandedRows[item.id] ? styles.goodsRowExpanded : ''}`}
                        onClick={() => toggleRowExpansion(item.id)}
                      >
                        <td>
                          <div className={styles.itemName}>
                            <FiPackage className={styles.itemIcon} />
                            <span>{item.good_name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.typeBadge}>{item.good_type}</span>
                        </td>
                        <td>{item.unit_weight}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.status)}`}>
                            {formatStatus(item.status)}
                          </span>
                        </td>
                        <td className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
                          <button 
                            className={`${styles.btnIcon} ${styles.btnEdit}`} 
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            className={`${styles.btnIcon} ${styles.btnDelete}`} 
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                      {expandedRows[item.id] && (
                        <tr className={styles.expandedRow}>
                          <td colSpan="5">
                            <div className={styles.expandedContent}>
                              <div className={styles.detailRow}>
                                <div className={styles.detailLabel}>Description:</div>
                                <div className={styles.detailValue}>{item.description || 'No description available'}</div>
                              </div>
                              <div className={styles.detailRow}>
                                <div className={styles.detailLabel}>Created At:</div>
                                <div className={styles.detailValue}>
                                  {item.created_at ? new Date(item.created_at).toLocaleString() : 'Not available'}
                                </div>
                              </div>
                              <div className={styles.detailRow}>
                                <div className={styles.detailLabel}>Last Updated:</div>
                                <div className={styles.detailValue}>
                                  {item.updated_at ? new Date(item.updated_at).toLocaleString() : 'Not available'}
                                </div>
                              </div>
                              <div className={styles.detailRow}>
                                <div className={styles.detailLabel}>ID:</div>
                                <div className={styles.detailValue}>
                                  {item.id}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.noData}>
                      No goods records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goods;