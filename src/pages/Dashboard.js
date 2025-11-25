import React from 'react';
import './dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="dashboard-cards">
        <div className="card">
          <div className="card-header">
            <h3>Total Vehicles</h3>
            <i className="fas fa-truck"></i>
          </div>
          <div className="card-value">24</div>
          <div className="card-description">Active vehicles in fleet</div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3>Active Routes</h3>
            <i className="fas fa-route"></i>
          </div>
          <div className="card-value">12</div>
          <div className="card-description">Currently active routes</div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3>Drivers</h3>
            <i className="fas fa-users"></i>
          </div>
          <div className="card-value">18</div>
          <div className="card-description">Total drivers</div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3>Deliveries Today</h3>
            <i className="fas fa-box"></i>
          </div>
          <div className="card-value">32</div>
          <div className="card-description">Completed deliveries</div>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Vehicle Status</h3>
          <div className="chart-placeholder">
            <i className="fas fa-chart-pie"></i>
            <p>Vehicle status chart will appear here</p>
          </div>
        </div>
        
        <div className="chart-container">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <i className="fas fa-truck-moving"></i>
              </div>
              <div className="activity-details">
                <div className="activity-title">Vehicle VH-1234 started route</div>
                <div className="activity-time">10 minutes ago</div>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="activity-details">
                <div className="activity-title">Delivery completed for order #ORD-5678</div>
                <div className="activity-time">25 minutes ago</div>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="activity-details">
                <div className="activity-title">Delay reported for route RT-9876</div>
                <div className="activity-time">1 hour ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;