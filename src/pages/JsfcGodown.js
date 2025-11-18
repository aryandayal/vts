import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiSearch, FiChevronDown, FiChevronUp, FiMapPin, FiUpload, FiDownload, FiFileText, FiFile, FiRefreshCw } from 'react-icons/fi';
import Cookies from 'js-cookie';
import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import './jsfcgodown.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const JsfcGodown = () => {
  // Initial state for godowns
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  
  // Form state - using API field names
  const [formData, setFormData] = useState({
    godown_name: '', // Changed from name to godown_name
    contact: '',
    address: '',
    district: '',
    pin: '', // Changed from pin_code to pin
    godown_no: '',
    latitude: '',
    longitude: ''
  });
  
  // UI states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'godown_name', direction: 'ascending' });
  const [expandedRows, setExpandedRows] = useState({});
  const [importing, setImporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Refs for file inputs
  const excelImportRef = useRef(null);
  
  // API base URL
  const API_URL = 'http://3.109.186.142:3005/api/godowns';
  const AUTH_URL = 'http://3.109.186.142:3005/api/auth';
  
  // Get auth token
  const getAuthToken = () => {
    return Cookies.get('token');
  };
  
  // Get user info from token
  const getUserInfo = () => {
    const token = Cookies.get('token');
    if (!token) return null;
    
    try {
      // JWT tokens are base64 encoded, so we can decode the payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserInfo(payload);
      return payload;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  };
  
  // Fetch godowns from API
  const fetchGodowns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          handleLogout();
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle the specific API response structure
      if (data && data.data && data.data.godowns && Array.isArray(data.data.godowns)) {
        // Response structure: { data: { godowns: [...] } }
        setGodowns(data.data.godowns);
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Unexpected API response structure');
      }
    } catch (err) {
      console.error('Error fetching godowns:', err);
      setError(err.message || 'Failed to fetch godowns');
      setGodowns([]); // Ensure godowns is always an array
    } finally {
      setLoading(false);
    }
  };
  
  // Load godowns and user info on component mount
  useEffect(() => {
    getUserInfo();
    fetchGodowns();
  }, []);
  
  // Fetch a single godown by ID
  const fetchGodownById = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle the API response structure for single godown
      if (data && data.data && data.data.godown) {
        // Response structure: { data: { godown: {...} } }
        return data.data.godown;
      } else if (data && data.data) {
        // Response structure: { data: {...} }
        return data.data;
      } else {
        // Response is directly the godown
        return data;
      }
    } catch (err) {
      console.error('Error fetching godown:', err);
      throw err;
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    Cookies.remove('token');
    setUserInfo(null);
    window.location.href = '/login'; // Redirect to login page
  };
  
  // Filter and sort godowns with safeguards
  const filteredGodowns = useMemo(() => {
    // Ensure godowns is always an array
    const godownsArray = Array.isArray(godowns) ? godowns : [];
    
    let result = [...godownsArray];
    
    // Apply search filter - using API field names
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
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Handle null/undefined values
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
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission for adding/editing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Create a copy of form data to ensure all fields are included
      // Convert latitude and longitude to numbers as expected by API
      const requestData = {
        godown_name: formData.godown_name,
        contact: formData.contact,
        address: formData.address,
        district: formData.district,
        pin: formData.pin,
        godown_no: formData.godown_no,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };
      
      // Add ID only when editing
      if (isEditing && editingId) {
        requestData.id = editingId;
      }
      
      // Log the data being sent for debugging
      console.log('Sending data:', requestData);
      
      let url = API_URL;
      let method = 'POST';
      
      if (isEditing && editingId) {
        // Use PUT method with the specific godown ID
        url = `${API_URL}/${editingId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Success response:', responseData);
      
      // Refresh godowns list
      await fetchGodowns();
      
      // Reset form and UI state
      setIsAdding(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        godown_name: '',
        contact: '',
        address: '',
        district: '',
        pin: '',
        godown_no: '',
        latitude: '',
        longitude: ''
      });
      
      alert(isEditing ? 'Godown updated successfully!' : 'Godown added successfully!');
    } catch (err) {
      console.error('Error submitting godown:', err);
      alert(err.message || 'Failed to submit godown');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit a godown
  const handleEdit = async (godown) => {
    try {
      // Fetch the complete godown data
      const godownData = await fetchGodownById(godown.id);
      
      // Set the form data with the godown details - using API field names
      setFormData({
        godown_name: godownData.godown_name || '',
        contact: godownData.contact || '',
        address: godownData.address || '',
        district: godownData.district || '',
        pin: godownData.pin || '',
        godown_no: godownData.godown_no || '',
        latitude: godownData.latitude || '',
        longitude: godownData.longitude || ''
      });
      
      // Set editing state
      setIsEditing(true);
      setIsAdding(true);
      setEditingId(godown.id);
    } catch (err) {
      console.error('Error fetching godown details:', err);
      alert('Failed to fetch godown details');
    }
  };
  
  // Delete a godown
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this godown?')) {
      return;
    }
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh godowns list
      await fetchGodowns();
      alert('Godown deleted successfully!');
    } catch (err) {
      console.error('Error deleting godown:', err);
      alert(err.message || 'Failed to delete godown');
    }
  };
  
  // Cancel form
  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      godown_name: '',
      contact: '',
      address: '',
      district: '',
      pin: '',
      godown_no: '',
      latitude: '',
      longitude: ''
    });
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
  
  // Validate coordinates
  const validateCoordinates = (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return !isNaN(latNum) && latNum >= -90 && latNum <= 90 && 
           !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180;
  };
  
  // Import from Excel
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process imported data - using API field names
        const importedGodowns = jsonData.map((row, index) => {
          return {
            godown_name: row.godown_name || row.name || '',
            contact: row.contact || '',
            address: row.address || '',
            district: row.district || '',
            pin: row.pin || row.pincode || row.pin_code || '',
            godown_no: row.godown_no || row.godownNumber || '',
            latitude: parseFloat(row.latitude) || 0,
            longitude: parseFloat(row.longitude) || 0
          };
        });
        
        // Get token
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication token not found. Please login again.');
        }
        
        // Send each godown to the API
        const promises = importedGodowns.map(godown => 
          fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(godown)
          })
        );
        
        await Promise.all(promises);
        
        // Refresh godowns list
        await fetchGodowns();
        
        alert(`Successfully imported ${importedGodowns.length} godowns!`);
      } catch (error) {
        console.error('Error importing Excel file:', error);
        alert('Error importing Excel file. Please check the file format.');
      } finally {
        setImporting(false);
        // Reset file input
        if (excelImportRef.current) {
          excelImportRef.current.value = '';
        }
      }
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // Export to Excel
  const handleExportExcel = () => {
    // Ensure filteredGodowns is an array
    const godownsToExport = Array.isArray(filteredGodowns) ? filteredGodowns : [];
    
    // Prepare data for export - using API field names
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
    
    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Godowns');
    
    // Generate and download file
    XLSX.writeFile(workbook, 'JSFC_Godowns.xlsx');
  };
  
  // Export to PDF
  const handleExportPDF = () => {
    // Ensure filteredGodowns is an array
    const godownsToExport = Array.isArray(filteredGodowns) ? filteredGodowns : [];
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('JSFC Godown Details', 105, 15, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
    
    // Prepare table data - using API field names
    const tableData = godownsToExport.map(godown => [
      godown.godown_name,
      godown.contact,
      godown.district,
      godown.pin,
      godown.godown_no,
      `${godown.latitude}, ${godown.longitude}`
    ]);
    
    // Define table columns
    const tableColumns = [
      { header: 'Name', dataKey: 'godown_name' },
      { header: 'Contact', dataKey: 'contact' },
      { header: 'District', dataKey: 'district' },
      { header: 'Pincode', dataKey: 'pin' },
      { header: 'Godown No.', dataKey: 'godown_no' },
      { header: 'Location', dataKey: 'location' }
    ];
    
    // Add table to PDF
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
    
    // Save the PDF
    doc.save('JSFC_Godowns.pdf');
  };
  
  return (
    <>
      <Header />
      <BottomNavbar text="JSFC Godown Management" />
    <div className="jsfc-godown-container">
      <div className="actions-bar">
        <div className="search-container">
          <div className="search-input">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search godowns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setIsAdding(true);
              setIsEditing(false);
              setEditingId(null);
              setFormData({
                godown_name: '',
                contact: '',
                address: '',
                district: '',
                pin: '',
                godown_no: '',
                latitude: '',
                longitude: ''
              });
            }}
          >
            <FiPlus /> Add New Godown
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={fetchGodowns}
            disabled={loading}
          >
            <FiRefreshCw /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <div className="dropdown">
            <button className="btn btn-secondary dropdown-toggle">
              <FiDownload /> Export
            </button>
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleExportExcel}>
                <FiFile /> Export as Excel
              </button>
              <button className="dropdown-item" onClick={handleExportPDF}>
                <FiFileText /> Export as PDF
              </button>
            </div>
          </div>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => excelImportRef.current?.click()}
            disabled={importing}
          >
            <FiUpload /> {importing ? 'Importing...' : 'Import Excel'}
          </button>
          
          <input
            type="file"
            ref={excelImportRef}
            onChange={handleImportExcel}
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {isAdding && (
        <div className="form-container">
          <div className="form-header">
            <h2>{isEditing ? 'Edit Godown' : 'Add New Godown'}</h2>
            <button className="close-btn" onClick={handleCancel}>
              <FiX />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="godown-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="godown_name"
                  value={formData.godown_name}
                  onChange={handleInputChange}
                  placeholder="Enter name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Contact</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Enter contact"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="Enter district"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="pin"
                  value={formData.pin}
                  onChange={handleInputChange}
                  placeholder="Enter pincode"
                  pattern="[0-9]{6}"
                  title="Please enter a valid 6-digit pincode"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Godown Number</label>
                <input
                  type="text"
                  name="godown_no"
                  value={formData.godown_no}
                  onChange={handleInputChange}
                  placeholder="Enter godown number"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 19.0760"
                  step="any"
                  min="-90"
                  max="90"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 72.8777"
                  step="any"
                  min="-180"
                  max="180"
                  required
                />
              </div>
            </div>
            
            <div className="form-group full-width">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter complete address"
                rows="3"
                required
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!validateCoordinates(formData.latitude, formData.longitude) || submitting}
              >
                <FiSave /> {submitting ? 'Processing...' : (isEditing ? 'Update Godown' : 'Add Godown')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="table-container">
        <div className="table-header">
          <h2>Godown Records</h2>
          <div className="table-info">
            Showing {Array.isArray(filteredGodowns) ? filteredGodowns.length : 0} of {Array.isArray(godowns) ? godowns.length : 0} godowns
          </div>
        </div>
        
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading godowns...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>Error: {error}</p>
              <button className="btn btn-primary" onClick={fetchGodowns}>
                Retry
              </button>
            </div>
          ) : (
            <table className="godown-table">
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
                        className={`godown-row ${expandedRows[godown.id] ? 'expanded' : ''}`}
                        onClick={() => toggleRowExpansion(godown.id)}
                      >
                        <td>{godown.godown_name}</td>
                        <td>{godown.contact}</td>
                        <td>{godown.district}</td>
                        <td>{godown.pin}</td>
                        <td>
                          <div className="location-info">
                            <FiMapPin className="location-icon" />
                            <span>{godown.latitude}, {godown.longitude}</span>
                          </div>
                        </td>
                        <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn-icon btn-edit" 
                            onClick={() => handleEdit(godown)}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            className="btn-icon btn-delete" 
                            onClick={() => handleDelete(godown.id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                      {expandedRows[godown.id] && (
                        <tr className="expanded-row">
                          <td colSpan="6">
                            <div className="expanded-content">
                              <div className="detail-row">
                                <div className="detail-label">Godown Number:</div>
                                <div className="detail-value">{godown.godown_no}</div>
                              </div>
                              <div className="detail-row">
                                <div className="detail-label">Address:</div>
                                <div className="detail-value">{godown.address}</div>
                              </div>
                              <div className="detail-row">
                                <div className="detail-label">Coordinates:</div>
                                <div className="detail-value">
                                  <a 
                                    href={`https://www.google.com/maps?q=${godown.latitude},${godown.longitude}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="map-link"
                                  >
                                    View on Map
                                  </a>
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
                    <td colSpan="6" className="no-data">
                      No godown records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default JsfcGodown;