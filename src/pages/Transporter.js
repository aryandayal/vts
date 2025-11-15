import React, { useState, useEffect } from 'react';
import './transporter.css';

const Transporter = () => {
  // Sample data - in real app this would come from API
  const initialDeliveries = [
    { id: 1, godown: 'Main Warehouse', retail: 'Downtown Store', goods: 'Electronics', status: 'pending', date: '2023-05-15' },
    { id: 2, godown: 'North Depot', retail: 'Mall Outlet', goods: 'Clothing', status: 'in_transit', date: '2023-05-16' },
    { id: 3, godown: 'South Hub', retail: 'Suburban Shop', goods: 'Groceries', status: 'delivered', date: '2023-05-14' },
  ];

  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [filteredDeliveries, setFilteredDeliveries] = useState(initialDeliveries);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newDelivery, setNewDelivery] = useState({
    godown: '',
    retail: '',
    goods: '',
    date: ''
  });

  // Filter deliveries based on status and search term
  useEffect(() => {
    let result = deliveries;
    
    if (statusFilter !== 'all') {
      result = result.filter(delivery => delivery.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(delivery => 
        delivery.godown.toLowerCase().includes(term) ||
        delivery.retail.toLowerCase().includes(term) ||
        delivery.goods.toLowerCase().includes(term)
      );
    }
    
    setFilteredDeliveries(result);
  }, [deliveries, statusFilter, searchTerm]);

  // Update delivery status
  const updateStatus = (id, newStatus) => {
    setDeliveries(deliveries.map(delivery => 
      delivery.id === id ? { ...delivery, status: newStatus } : delivery
    ));
  };

  // Add new delivery
  const addDelivery = () => {
    if (newDelivery.godown && newDelivery.retail && newDelivery.goods && newDelivery.date) {
      const delivery = {
        id: deliveries.length + 1,
        ...newDelivery,
        status: 'pending'
      };
      setDeliveries([...deliveries, delivery]);
      setNewDelivery({ godown: '', retail: '', goods: '', date: '' });
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusClasses = {
      pending: 'status-pending',
      in_transit: 'status-transit',
      delivered: 'status-delivered'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="transporter-container">
      <header className="transporter-header">
        <h1>Delivery Management System</h1>
        <p>Manage goods transport from godowns to retail stores</p>
      </header>

      <div className="controls-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search deliveries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div className="add-delivery-form">
          <h3>Add New Delivery</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Godown"
              value={newDelivery.godown}
              onChange={(e) => setNewDelivery({...newDelivery, godown: e.target.value})}
            />
            <input
              type="text"
              placeholder="Retail Store"
              value={newDelivery.retail}
              onChange={(e) => setNewDelivery({...newDelivery, retail: e.target.value})}
            />
            <input
              type="text"
              placeholder="Goods"
              value={newDelivery.goods}
              onChange={(e) => setNewDelivery({...newDelivery, goods: e.target.value})}
            />
            <input
              type="date"
              value={newDelivery.date}
              onChange={(e) => setNewDelivery({...newDelivery, date: e.target.value})}
            />
            <button onClick={addDelivery} className="add-btn">Add Delivery</button>
          </div>
        </div>
      </div>

      <div className="deliveries-table-container">
        <table className="deliveries-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Godown</th>
              <th>Retail Store</th>
              <th>Goods</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.map(delivery => (
              <tr key={delivery.id}>
                <td>{delivery.id}</td>
                <td>{delivery.godown}</td>
                <td>{delivery.retail}</td>
                <td>{delivery.goods}</td>
                <td>{delivery.date}</td>
                <td><StatusBadge status={delivery.status} /></td>
                <td>
                  <div className="action-buttons">
                    {delivery.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(delivery.id, 'in_transit')}
                        className="action-btn transit-btn"
                      >
                        Start Transit
                      </button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <button 
                        onClick={() => updateStatus(delivery.id, 'delivered')}
                        className="action-btn deliver-btn"
                      >
                        Mark Delivered
                      </button>
                    )}
                    <button 
                      onClick={() => updateStatus(delivery.id, 'pending')}
                      className="action-btn reset-btn"
                    >
                      Reset
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredDeliveries.length === 0 && (
          <div className="no-deliveries">
            No deliveries match your search criteria
          </div>
        )}
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3>Total Deliveries</h3>
          <p>{deliveries.length}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p>{deliveries.filter(d => d.status === 'pending').length}</p>
        </div>
        <div className="stat-card">
          <h3>In Transit</h3>
          <p>{deliveries.filter(d => d.status === 'in_transit').length}</p>
        </div>
        <div className="stat-card">
          <h3>Delivered</h3>
          <p>{deliveries.filter(d => d.status === 'delivered').length}</p>
        </div>
      </div>
    </div>
  );
};

export default Transporter;