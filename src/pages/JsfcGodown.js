// pages/JsfcGodown.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiSearch, FiChevronDown, FiChevronUp, FiMapPin, FiUpload, FiDownload, FiFileText, FiFile, FiRefreshCw, FiArchive, FiRotateCcw } from 'react-icons/fi';
import styles from './jsfcgodown.module.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useForm } from 'react-hook-form';
import { jsfcGodownAPI } from '../utils/api';
import { useAuthStore } from '../stores/authStore';

const JsfcGodown = () => {
  // Get auth state and functions from authStore
  const { user, isAuthenticated, logout } = useAuthStore();
  
  // Initial state for godowns
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'godown_name', direction: 'ascending' });
  const [expandedRows, setExpandedRows] = useState({});
  const [importing, setImporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importErrors, setImportErrors] = useState([]);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'deleted'
  
  // Refs for file inputs
  const excelImportRef = useRef(null);
  
  // Initialize React Hook Form
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      godown_name: '',
      contact: '',
      address: '',
      district: '',
      pin: '',
      godown_no: '',
      latitude: '',
      longitude: ''
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
  
  // Fetch godowns from API
  const fetchGodowns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (viewMode === 'active') {
        response = await jsfcGodownAPI.getGodowns();
      } else {
        response = await jsfcGodownAPI.getDeletedGodowns();
      }
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      // Handle different response structures based on view mode
      if (viewMode === 'active') {
        // For active godowns, check for data.data.godowns structure
        if (data && data.data && data.data.godowns && Array.isArray(data.data.godowns)) {
          setGodowns(data.data.godowns);
        } else if (data && Array.isArray(data)) {
          setGodowns(data);
        } else {
          console.error('Unexpected API response structure for active godowns:', data);
          throw new Error('Unexpected API response structure for active godowns');
        }
      } else {
        // For deleted godowns, check for data structure (direct array)
        if (data && data.success === true && Array.isArray(data.data)) {
          setGodowns(data.data);
        } else if (data && Array.isArray(data)) {
          setGodowns(data);
        } else {
          console.error('Unexpected API response structure for deleted godowns:', data);
          throw new Error('Unexpected API response structure for deleted godowns');
        }
      }
    } catch (err) {
      console.error('Error fetching godowns:', err);
      
      // Check if it's an authentication error
      if (isAuthError(err)) {
        handleLogout();
        return;
      }
      
      setError(err.message || 'Failed to fetch godowns');
      setGodowns([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load godowns on component mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchGodowns();
    } else {
      setLoading(false);
      setError('Authentication required. Please login.');
    }
  }, [isAuthenticated, viewMode]);
  
  // Fetch a single godown by ID
  const fetchGodownById = async (id) => {
    try {
      const response = await jsfcGodownAPI.getGodownById(id);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      if (data && data.data && data.data.godown) {
        return data.data.godown;
      } else if (data && data.data) {
        return data.data;
      } else {
        return data;
      }
    } catch (err) {
      console.error('Error fetching godown:', err);
      
      // Check if it's an authentication error
      if (isAuthError(err)) {
        handleLogout();
        throw new Error('Session expired. Please login again.');
      }
      
      throw err;
    }
  };
  
  // Filter and sort godowns
  const filteredGodowns = useMemo(() => {
    const godownsArray = Array.isArray(godowns) ? godowns : [];
    let result = [...godownsArray];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(godown => 
        godown.godown_name?.toLowerCase().includes(term) ||
        godown.contact?.toLowerCase().includes(term) ||
        godown.address?.toLowerCase().includes(term) ||
        godown.district?.toLowerCase().includes(term) ||
        godown.pin?.toLowerCase().includes(term) ||
        godown.godown_no?.toLowerCase().includes(term)
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
  }, [godowns, searchTerm, sortConfig]);
  
  // Handle form submission
  const onSubmit = async (data) => {
    setSubmitting(true);
    
    try {
      const requestData = {
        godown_name: data.godown_name,
        contact: data.contact,
        address: data.address,
        district: data.district,
        pin: data.pin,
        godown_no: data.godown_no,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude)
      };
      
      let response;
      
      if (isEditing && editingId) {
        response = await jsfcGodownAPI.updateGodown(editingId, requestData);
      } else {
        response = await jsfcGodownAPI.createGodown(requestData);
      }
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the godowns list after successful operation
      await fetchGodowns();
      
      setIsAdding(false);
      setIsEditing(false);
      setEditingId(null);
      reset();
      
      alert(isEditing ? 'Godown updated successfully!' : 'Godown added successfully!');
    } catch (err) {
      console.error('Error submitting godown:', err);
      
      // Check if it's an authentication error
      if (isAuthError(err)) {
        handleLogout();
        return;
      }
      
      alert(err.response?.data?.message || err.message || 'Failed to submit godown');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit a godown
  const handleEdit = async (godown) => {
    try {
      const godownData = await fetchGodownById(godown.id);
      
      setValue('godown_name', godownData.godown_name || '');
      setValue('contact', godownData.contact || '');
      setValue('address', godownData.address || '');
      setValue('district', godownData.district || '');
      setValue('pin', godownData.pin || '');
      setValue('godown_no', godownData.godown_no || '');
      setValue('latitude', godownData.latitude || '');
      setValue('longitude', godownData.longitude || '');
      
      setIsEditing(true);
      setIsAdding(true);
      setEditingId(godown.id);
    } catch (err) {
      console.error('Error fetching godown details:', err);
      
      // Check if it's an authentication error
      if (isAuthError(err)) {
        handleLogout();
        return;
      }
      
      alert(err.message || 'Failed to fetch godown details');
    }
  };
  
  // Delete a godown
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this godown?')) {
      return;
    }
    
    try {
      const response = await jsfcGodownAPI.deleteGodown(id);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the godowns list after successful deletion
      await fetchGodowns();
      alert('Godown deleted successfully!');
    } catch (err) {
      console.error('Error deleting godown:', err);
      
      // Check if it's an authentication error
      if (isAuthError(err)) {
        handleLogout();
        return;
      }
      
      alert(err.response?.data?.message || err.message || 'Failed to delete godown');
    }
  };
  
  // Restore a deleted godown
  const handleRestore = async (id) => {
    if (!window.confirm('Are you sure you want to restore this godown?')) {
      return;
    }
    
    try {
      const response = await jsfcGodownAPI.restoreGodown(id);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the godowns list after successful restoration
      await fetchGodowns();
      alert('Godown restored successfully!');
    } catch (err) {
      console.error('Error restoring godown:', err);
      
      // Check if it's an authentication error
      if (isAuthError(err)) {
        handleLogout();
        return;
      }
      
      alert(err.response?.data?.message || err.message || 'Failed to restore godown');
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
  
  // Import from Excel
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImporting(true);
    setImportProgress(0);
    setImportErrors([]);
    
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Use the updated importGodowns endpoint
        const response = await jsfcGodownAPI.importGodowns(formData);
        
        // Accept any 2xx status as success
        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
        }
        
        const result = response.data;
        
        if (result.success === false) {
          throw new Error(result.message || 'Import failed on the server');
        }
        
        // Refresh the godowns list after successful import
        await fetchGodowns();
        
        let successMessage = 'Excel file imported successfully!';
        if (result.importedCount !== undefined) {
          successMessage = `Successfully imported ${result.importedCount} records!`;
        }
        if (result.message) {
          successMessage += ` ${result.message}`;
        }
        alert(successMessage);
        
      } catch (error) {
        console.error('Error importing godowns:', error);
        
        // Check if it's an authentication error
        if (isAuthError(error)) {
          handleLogout();
          return;
        }
        
        alert(error.response?.data?.message || error.message || 'Failed to import godowns');
      } finally {
        setImporting(false);
        if (excelImportRef.current) {
          excelImportRef.current.value = '';
        }
      }
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // Export to Excel
  const handleExportExcel = () => {
    const godownsToExport = Array.isArray(filteredGodowns) ? filteredGodowns : [];
    
    const exportData = godownsToExport.map(godown => ({
      Name: godown.godown_name,
      Contact: godown.contact,
      Address: godown.address,
      District: godown.district,
      Pincode: godown.pin,
      'Godown Number': godown.godown_no,
      Latitude: godown.latitude,
      Longitude: godown.longitude
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Godowns');
    
    XLSX.writeFile(workbook, 'JSFC_Godowns.xlsx');
  };
  
  // Export to PDF
  const handleExportPDF = () => {
    const godownsToExport = Array.isArray(filteredGodowns) ? filteredGodowns : [];
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('JSFC Godown Details', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
    
    const tableData = godownsToExport.map(godown => [
      godown.godown_name,
      godown.contact,
      godown.district,
      godown.pin,
      godown.godown_no,
      `${godown.latitude}, ${godown.longitude}`
    ]);
    
    const tableColumns = [
      { header: 'Name', dataKey: 'godown_name' },
      { header: 'Contact', dataKey: 'contact' },
      { header: 'District', dataKey: 'district' },
      { header: 'Pincode', dataKey: 'pin' },
      { header: 'Godown No.', dataKey: 'godown_no' },
      { header: 'Location', dataKey: 'location' }
    ];
    
    doc.autoTable({
      head: [tableColumns.map(col => col.header)],
      body: tableData,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    doc.save('JSFC_Godowns.pdf');
  };
  
  // Toggle between active and deleted godowns view
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'active' ? 'deleted' : 'active');
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
              placeholder="Search godowns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className={styles.actionButtons}>
          {viewMode === 'active' && (
            <button 
              className={`${styles.btn} ${styles.btnPrimary}`} 
              onClick={() => {
                setIsAdding(true);
                setIsEditing(false);
                setEditingId(null);
                reset();
              }}
            >
              <FiPlus /> Add New Godown
            </button>
          )}
          
          <button 
            className={`${styles.btn} ${styles.btnSecondary}`} 
            onClick={fetchGodowns}
            disabled={loading}
          >
            <FiRefreshCw /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button 
            className={`${styles.btn} ${viewMode === 'active' ? styles.btnSecondary : styles.btnPrimary}`}
            onClick={toggleViewMode}
          >
            {viewMode === 'active' ? (
              <>
                <FiArchive /> View Deleted
              </>
            ) : (
              <>
                <FiRotateCcw /> View Active
              </>
            )}
          </button>
          
          <div className={styles.dropdown}>
            <button className={`${styles.btn} ${styles.btnSecondary} ${styles.dropdownToggle}`}>
              <FiDownload /> Export
            </button>
            <div className={styles.dropdownMenu}>
              <button className={styles.dropdownItem} onClick={handleExportExcel}>
                <FiFile /> Export as Excel
              </button>
              <button className={styles.dropdownItem} onClick={handleExportPDF}>
                <FiFileText /> Export as PDF
              </button>
            </div>
          </div>
          
          {viewMode === 'active' && (
            <button 
              className={`${styles.btn} ${styles.btnSecondary}`} 
              onClick={() => excelImportRef.current?.click()}
              disabled={importing}
            >
              <FiUpload /> {importing ? 'Importing...' : 'Import Excel'}
            </button>
          )}
          
          <input
            type="file"
            ref={excelImportRef}
            onChange={handleImportExcel}
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {importing && (
        <div className={styles.importProgressContainer}>
          <div className={styles.importProgressBar}>
            <div 
              className={styles.importProgressFill} 
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
          <div className={styles.importProgressText}>
            Importing: {importProgress}% complete
          </div>
        </div>
      )}
      
      {importErrors.length > 0 && (
        <div className={styles.importErrorsContainer}>
          <h3>Import Errors ({importErrors.length})</h3>
          <ul className={styles.importErrorsList}>
            {importErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {isAdding && (
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2>{isEditing ? 'Edit Godown' : 'Add New Godown'}</h2>
            <button className={styles.closeBtn} onClick={handleCancel}>
              <FiX />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className={styles.godownForm}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  {...register('godown_name', { 
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  placeholder="Enter name"
                />
                {errors.godown_name && <p className={styles.errorMessage}>{errors.godown_name.message}</p>}
              </div>
              
              <div className={styles.formGroup}>
                <label>Contact</label>
                <input
                  type="tel"
                  {...register('contact', { 
                    required: 'Contact is required',
                    pattern: { value: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' }
                  })}
                  placeholder="Enter contact"
                />
                {errors.contact && <p className={styles.errorMessage}>{errors.contact.message}</p>}
              </div>
              
              <div className={styles.formGroup}>
                <label>District</label>
                <input
                  type="text"
                  {...register('district', { 
                    required: 'District is required',
                    minLength: { value: 2, message: 'District must be at least 2 characters' }
                  })}
                  placeholder="Enter district"
                />
                {errors.district && <p className={styles.errorMessage}>{errors.district.message}</p>}
              </div>
              
              <div className={styles.formGroup}>
                <label>Pincode</label>
                <input
                  type="text"
                  {...register('pin', { 
                    required: 'Pincode is required',
                    pattern: { value: /^[0-9]{6}$/, message: 'Please enter a valid 6-digit pincode' }
                  })}
                  placeholder="Enter pincode"
                />
                {errors.pin && <p className={styles.errorMessage}>{errors.pin.message}</p>}
              </div>
              
              <div className={styles.formGroup}>
                <label>Godown Number</label>
                <input
                  type="text"
                  {...register('godown_no', { 
                    required: 'Godown number is required'
                  })}
                  placeholder="Enter godown number"
                />
                {errors.godown_no && <p className={styles.errorMessage}>{errors.godown_no.message}</p>}
              </div>
              
              <div className={styles.formGroup}>
                <label>Latitude</label>
                <input
                  type="number"
                  step="any"
                  {...register('latitude', { 
                    required: 'Latitude is required',
                    min: { value: -90, message: 'Latitude must be between -90 and 90' },
                    max: { value: 90, message: 'Latitude must be between -90 and 90' },
                    validate: value => !isNaN(parseFloat(value)) || 'Latitude must be a valid number'
                  })}
                  placeholder="e.g., 19.0760"
                />
                {errors.latitude && <p className={styles.errorMessage}>{errors.latitude.message}</p>}
              </div>
              
              <div className={styles.formGroup}>
                <label>Longitude</label>
                <input
                  type="number"
                  step="any"
                  {...register('longitude', { 
                    required: 'Longitude is required',
                    min: { value: -180, message: 'Longitude must be between -180 and 180' },
                    max: { value: 180, message: 'Longitude must be between -180 and 180' },
                    validate: value => !isNaN(parseFloat(value)) || 'Longitude must be a valid number'
                  })}
                  placeholder="e.g., 72.8777"
                />
                {errors.longitude && <p className={styles.errorMessage}>{errors.longitude.message}</p>}
              </div>
            </div>
            
            <div className={`${styles.formGroup} ${styles.formGroupFullWidth}`}>
              <label>Address</label>
              <textarea
                {...register('address', { 
                  required: 'Address is required',
                  minLength: { value: 5, message: 'Address must be at least 5 characters' }
                })}
                placeholder="Enter complete address"
                rows="3"
              ></textarea>
              {errors.address && <p className={styles.errorMessage}>{errors.address.message}</p>}
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={submitting}
              >
                <FiSave /> {submitting ? 'Processing...' : (isEditing ? 'Update Godown' : 'Add Godown')}
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
          <h2>{viewMode === 'active' ? 'Active Godown Records' : 'Deleted Godown Records'}</h2>
          <div className={styles.tableInfo}>
            Showing {Array.isArray(filteredGodowns) ? filteredGodowns.length : 0} of {Array.isArray(godowns) ? godowns.length : 0} godowns
          </div>
        </div>
        
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading godowns...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>Error: {error}</p>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={fetchGodowns}>
                Retry
              </button>
            </div>
          ) : (
            <table className={styles.godownTable}>
              <thead>
                <tr>
                  <th onClick={() => requestSort('godown_name')}>
                    Name {getSortIndicator('godown_name')}
                  </th>
                  <th onClick={() => requestSort('contact')}>
                    Contact {getSortIndicator('contact')}
                  </th>
                  <th onClick={() => requestSort('district')}>
                    District {getSortIndicator('district')}
                  </th>
                  <th onClick={() => requestSort('pin')}>
                    Pincode {getSortIndicator('pin')}
                  </th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(filteredGodowns) && filteredGodowns.length > 0 ? (
                  filteredGodowns.map((godown) => (
                    <React.Fragment key={godown.id}>
                      <tr 
                        className={`${styles.godownRow} ${expandedRows[godown.id] ? styles.godownRowExpanded : ''}`}
                        onClick={() => toggleRowExpansion(godown.id)}
                      >
                        <td>{godown.godown_name}</td>
                        <td>{godown.contact}</td>
                        <td>{godown.district}</td>
                        <td>{godown.pin}</td>
                        <td>
                          <div className={styles.locationInfo}>
                            <FiMapPin className={styles.locationIcon} />
                            <span>{godown.latitude}, {godown.longitude}</span>
                          </div>
                        </td>
                        <td className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
                          {viewMode === 'active' ? (
                            <>
                              <button 
                                className={`${styles.btnIcon} ${styles.btnEdit}`} 
                                onClick={() => handleEdit(godown)}
                                title="Edit"
                              >
                                <FiEdit2 />
                              </button>
                              <button 
                                className={`${styles.btnIcon} ${styles.btnDelete}`} 
                                onClick={() => handleDelete(godown.id)}
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </>
                          ) : (
                            <button 
                              className={`${styles.btnIcon} ${styles.btnRestore}`} 
                              onClick={() => handleRestore(godown.id)}
                              title="Restore"
                            >
                              <FiRotateCcw />
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedRows[godown.id] && (
                        <tr className={styles.expandedRow}>
                          <td colSpan="6">
                            <div className={styles.expandedContent}>
                              <div className={styles.detailRow}>
                                <div className={styles.detailLabel}>Godown Number:</div>
                                <div className={styles.detailValue}>{godown.godown_no}</div>
                              </div>
                              <div className={styles.detailRow}>
                                <div className={styles.detailLabel}>Address:</div>
                                <div className={styles.detailValue}>{godown.address}</div>
                              </div>
                              <div className={styles.detailRow}>
                                <div className={styles.detailLabel}>Coordinates:</div>
                                <div className={styles.detailValue}>
                                  <a 
                                    href={`https://www.google.com/maps?q=${godown.latitude},${godown.longitude}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={styles.mapLink}
                                  >
                                    View on Map
                                  </a>
                                </div>
                              </div>
                              {viewMode === 'deleted' && godown.deleted_at && (
                                <div className={styles.detailRow}>
                                  <div className={styles.detailLabel}>Deleted At:</div>
                                  <div className={styles.detailValue}>
                                    {new Date(godown.deleted_at).toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.noData}>
                      {viewMode === 'active' 
                        ? 'No active godown records found' 
                        : 'No deleted godown records found'}
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

export default JsfcGodown;