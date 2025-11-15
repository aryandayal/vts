import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiSearch, FiChevronDown, FiChevronUp, FiMapPin, FiUpload, FiDownload, FiFileText, FiFile } from 'react-icons/fi';
import Cookies from 'js-cookie';
import './jsfcgodown.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const JsfcGodown = () => {
  // Initial state for godowns
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    contact: '',
    address: '',
    district: '',
    pincode: '',
    godownNumber: '',
    latitude: '',
    longitude: ''
  });
  
  // UI states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [expandedRows, setExpandedRows] = useState({});
  const [importing, setImporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Refs for file inputs
  const excelImportRef = useRef(null);
  
  // API base URL
  const API_URL = 'http://3.109.186.142:3005/api/godowns';
  
  // Get auth token
  const getAuthToken = () => {
    return Cookies.get('token');
  };
  
  // Fetch godowns from API
  const fetchGodowns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(API_URL, {
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
      setGodowns(data);
    } catch (err) {
      console.error('Error fetching godowns:', err);
      setError(err.message || 'Failed to fetch godowns');
    } finally {
      setLoading(false);
    }
  };
  
  // Load godowns on component mount
  useEffect(() => {
    fetchGodowns();
  }, []);
  
  // Filter and sort godowns
  const filteredGodowns = useMemo(() => {
    let result = [...godowns];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(godown => 
        godown.id?.toLowerCase().includes(term) ||
        godown.name?.toLowerCase().includes(term) ||
        godown.contact?.toLowerCase().includes(term) ||
        godown.address?.toLowerCase().includes(term) ||
        godown.district?.toLowerCase().includes(term) ||
        godown.pincode?.toLowerCase().includes(term) ||
        godown.godownNumber?.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
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
        throw new Error('Authentication token not found');
      }
      
      let url = API_URL;
      let method = 'POST';
      
      if (isEditing) {
        url = `${API_URL}/${formData.id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh godowns list
      await fetchGodowns();
      
      // Reset form and UI state
      setIsAdding(false);
      setIsEditing(false);
      setFormData({
        id: '',
        name: '',
        contact: '',
        address: '',
        district: '',
        pincode: '',
        godownNumber: '',
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
  const handleEdit = (godown) => {
    setFormData(godown);
    setIsEditing(true);
    setIsAdding(true);
  };
  
  // Delete a godown
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this godown?')) {
      return;
    }
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
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
    setFormData({
      id: '',
      name: '',
      contact: '',
      address: '',
      district: '',
      pincode: '',
      godownNumber: '',
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
        
        // Process imported data
        const importedGodowns = jsonData.map((row, index) => {
          // Generate ID if not present
          const id = row.id || `GD-${String(godowns.length + index + 1).padStart(3, '0')}`;
          
          return {
            id,
            name: row.name || '',
            contact: row.contact || '',
            address: row.address || '',
            district: row.district || '',
            pincode: row.pincode || '',
            godownNumber: row.godownNumber || '',
            latitude: row.latitude || '',
            longitude: row.longitude || '',
            capacity: row.capacity || 'Not specified',
            manager: row.manager || 'Not assigned'
          };
        });
        
        // Get token
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication token not found');
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
    // Prepare data for export
    const exportData = filteredGodowns.map(godown => ({
      ID: godown.id,
      Name: godown.name,
      Contact: godown.contact,
      Address: godown.address,
      District: godown.district,
      Pincode: godown.pincode,
      'Godown Number': godown.godownNumber,
      Latitude: godown.latitude,
      Longitude: godown.longitude,
      Capacity: godown.capacity || 'Not specified',
      Manager: godown.manager || 'Not assigned'
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
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('JSFC Godown Details', 105, 15, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
    
    // Prepare table data
    const tableData = filteredGodowns.map(godown => [
      godown.id,
      godown.name,
      godown.contact,
      godown.district,
      godown.pincode,
      godown.godownNumber,
      `${godown.latitude}, ${godown.longitude}`
    ]);
    
    // Define table columns
    const tableColumns = [
      { header: 'ID', dataKey: 'id' },
      { header: 'Name', dataKey: 'name' },
      { header: 'Contact', dataKey: 'contact' },
      { header: 'District', dataKey: 'district' },
      { header: 'Pincode', dataKey: 'pincode' },
      { header: 'Godown No.', dataKey: 'godownNumber' },
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
    <div className="jsfc-godown-container">
      <div className="page-header">
        <h1>JSFC Godown Management</h1>
        <p>Manage godown details and locations</p>
      </div>
      
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
            onClick={() => setIsAdding(true)}
          >
            <FiPlus /> Add New Godown
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
                <label>Godown Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter godown name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Enter contact number"
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
                  name="pincode"
                  value={formData.pincode}
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
                  name="godownNumber"
                  value={formData.godownNumber}
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
            Showing {filteredGodowns.length} of {godowns.length} godowns
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
                  <th onClick={() => requestSort('id')}>
                    ID {getSortIndicator('id')}
                  </th>
                  <th onClick={() => requestSort('name')}>
                    Name {getSortIndicator('name')}
                  </th>
                  <th onClick={() => requestSort('contact')}>
                    Contact {getSortIndicator('contact')}
                  </th>
                  <th onClick={() => requestSort('district')}>
                    District {getSortIndicator('district')}
                  </th>
                  <th onClick={() => requestSort('pincode')}>
                    Pincode {getSortIndicator('pincode')}
                  </th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGodowns.length > 0 ? (
                  filteredGodowns.map((godown) => (
                    <React.Fragment key={godown.id}>
                      <tr 
                        className={`godown-row ${expandedRows[godown.id] ? 'expanded' : ''}`}
                        onClick={() => toggleRowExpansion(godown.id)}
                      >
                        <td>{godown.id}</td>
                        <td>{godown.name}</td>
                        <td>{godown.contact}</td>
                        <td>{godown.district}</td>
                        <td>{godown.pincode}</td>
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
                          <td colSpan="7">
                            <div className="expanded-content">
                              <div className="detail-row">
                                <div className="detail-label">Godown Number:</div>
                                <div className="detail-value">{godown.godownNumber}</div>
                              </div>
                              <div className="detail-row">
                                <div className="detail-label">Complete Address:</div>
                                <div className="detail-value">{godown.address}</div>
                              </div>
                              <div className="detail-row">
                                <div className="detail-label">Capacity:</div>
                                <div className="detail-value">{godown.capacity || 'Not specified'}</div>
                              </div>
                              <div className="detail-row">
                                <div className="detail-label">Manager:</div>
                                <div className="detail-value">{godown.manager || 'Not assigned'}</div>
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
                    <td colSpan="7" className="no-data">
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
  );
};

export default JsfcGodown;