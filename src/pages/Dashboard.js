// components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { 
  FiTruck, 
  FiCheckCircle, 
  FiClock, 
  FiMapPin, 
  FiUser, 
  FiPackage, 
  FiNavigation,
  FiRefreshCw,
  FiAlertCircle,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '../components/Header'
import './dashboard.css';
import { useNavigate } from 'react-router-dom'; // Changed from useHistory to useNavigate

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom vehicle icon
const vehicleIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/34/34523.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const Dashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedToday: 0,
    activeVehicles: 0,
    avgDeliveryTime: 0
  });
  const [user, setUser] = useState({
    name: 'Admin User',
    role: 'Operations Manager',
    godown: 'JSFC Main Godown',
    lastLogin: 'Today, 09:30 AM'
  });
  
  const navigate = useNavigate(); // Changed from useHistory to useNavigate

  // Mock data initialization
  useEffect(() => {
    // Mock vehicles data
    const mockVehicles = [
      {
        id: 'VH-001',
        type: 'Truck',
        capacity: '5 tons',
        driver: 'Robert Johnson',
        status: 'On Delivery',
        location: { lat: 40.7128, lng: -74.0060 },
        lastUpdate: '2 min ago',
        speed: '45 km/h',
        fuel: '75%',
        temperature: '4°C'
      },
      {
        id: 'VH-002',
        type: 'Van',
        capacity: '1.5 tons',
        driver: 'Michael Davis',
        status: 'Available',
        location: { lat: 40.7218, lng: -73.9970 },
        lastUpdate: '5 min ago',
        speed: '0 km/h',
        fuel: '90%',
        temperature: '5°C'
      },
      {
        id: 'VH-003',
        type: 'Motorcycle',
        capacity: '20 kg',
        driver: 'James Wilson',
        status: 'On Delivery',
        location: { lat: 40.7028, lng: -74.0160 },
        lastUpdate: '1 min ago',
        speed: '35 km/h',
        fuel: '60%',
        temperature: 'N/A'
      }
    ];

    // Mock deliveries data
    const mockDeliveries = [
      {
        id: 'ORD-1001',
        customer: 'City Retail Store',
        address: '123 Main St, Cityville',
        items: ['Fresh Produce (50kg)', 'Dairy Products (30kg)'],
        status: 'transit',
        driver: 'Robert Johnson',
        vehicle: 'VH-001',
        estimatedTime: '15 min',
        orderTime: '10:30 AM',
        distance: '5.2 km',
        origin: 'JSFC Main Godown',
        destination: 'City Retail Store'
      },
      {
        id: 'ORD-1002',
        customer: 'Town Supermarket',
        address: '456 Oak Ave, Townsburg',
        items: ['Bakery Items (40kg)', 'Frozen Goods (25kg)'],
        status: 'preparing',
        driver: 'Michael Davis',
        vehicle: 'VH-002',
        estimatedTime: '30 min',
        orderTime: '10:45 AM',
        distance: '8.7 km',
        origin: 'JSFC Main Godown',
        destination: 'Town Supermarket'
      },
      {
        id: 'ORD-1003',
        customer: 'Village Corner Shop',
        address: '789 Pine Rd, Village',
        items: ['Beverages (60kg)', 'Snacks (15kg)'],
        status: 'pending',
        driver: 'Unassigned',
        vehicle: 'Unassigned',
        estimatedTime: '45 min',
        orderTime: '11:00 AM',
        distance: '12.3 km',
        origin: 'JSFC Main Godown',
        destination: 'Village Corner Shop'
      }
    ];

    // Mock drivers data
    const mockDrivers = [
      {
        id: 'DRV-001',
        name: 'Robert Johnson',
        phone: '+1 (555) 123-4567',
        license: 'DL-123456',
        status: 'On Duty',
        vehicle: 'VH-001',
        deliveries: 5,
        rating: 4.8,
        experience: '3 years'
      },
      {
        id: 'DRV-002',
        name: 'Michael Davis',
        phone: '+1 (555) 987-6543',
        license: 'DL-789012',
        status: 'On Duty',
        vehicle: 'VH-002',
        deliveries: 3,
        rating: 4.5,
        experience: '2 years'
      },
      {
        id: 'DRV-003',
        name: 'James Wilson',
        phone: '+1 (555) 456-7890',
        license: 'DL-345678',
        status: 'On Duty',
        vehicle: 'VH-003',
        deliveries: 7,
        rating: 4.9,
        experience: '5 years'
      }
    ];

    // Mock stats
    const mockStats = {
      activeDeliveries: 3,
      completedToday: 24,
      activeVehicles: 3,
      avgDeliveryTime: 28
    };

    setVehicles(mockVehicles);
    setDeliveries(mockDeliveries);
    setDrivers(mockDrivers);
    setStats(mockStats);
  }, []);

  // Function to handle vehicle tracking navigation
  const handleTrackVehicle = (vehicleId) => {
    navigate(`/vehicle-tracking/${vehicleId}`); // Changed from history.push to navigate
  };

  return (
    <>
    <Header />
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon active">
            <FiTruck />
          </div>
          <div className="stat-content">
            <h3>{stats.activeDeliveries}</h3>
            <p>Active Deliveries</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3>{stats.completedToday}</h3>
            <p>Completed Today</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon vehicles">
            <FiMapPin />
          </div>
          <div className="stat-content">
            <h3>{stats.activeVehicles}</h3>
            <p>Active Vehicles</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon time">
            <FiClock />
          </div>
          <div className="stat-content">
            <h3>{stats.avgDeliveryTime} min</h3>
            <p>Avg. Delivery Time</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {/* Deliveries Section */}
        <div className="deliveries-section">
          <div className="section-header">
            <h2>Active Deliveries</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="deliveries-list">
            {deliveries.map(delivery => (
              <div key={delivery.id} className={`delivery-card ${delivery.status}`}>
                <div className="delivery-header">
                  <h3>{delivery.id}</h3>
                  <span className={`status-badge ${delivery.status}`}>
                    {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                  </span>
                </div>
                <div className="delivery-route">
                  <div className="route-point">
                    <div className="point-label">From</div>
                    <div className="point-name">{delivery.origin}</div>
                  </div>
                  <div className="route-line"></div>
                  <div className="route-point">
                    <div className="point-label">To</div>
                    <div className="point-name">{delivery.destination}</div>
                  </div>
                </div>
                <div className="delivery-details">
                  <div className="detail-item">
                    <span className="detail-label">Customer:</span>
                    <span>{delivery.customer}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Driver:</span>
                    <span>{delivery.driver}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Vehicle:</span>
                    <span>{delivery.vehicle}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Distance:</span>
                    <span>{delivery.distance}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Est. Time:</span>
                    <span>{delivery.estimatedTime}</span>
                  </div>
                </div>
                <div className="delivery-footer">
                  <button className="track-btn"><FiNavigation /> Track</button>
                  <span>Order Time: {delivery.orderTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Information Sections */}
      <div className="info-sections">
        {/* Vehicles Section */}
        <div className="info-section">
          <div className="section-header">
            <h2>Vehicle Fleet</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="vehicles-grid">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="vehicle-card">
                <div className="vehicle-header">
                  <h3>{vehicle.id}</h3>
                  <span className={`status-badge ${vehicle.status.toLowerCase().replace(' ', '-')}`}>
                    {vehicle.status}
                  </span>
                </div>
                <div className="vehicle-info">
                  <div className="info-row">
                    <span className="info-label">Type:</span>
                    <span>{vehicle.type}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Capacity:</span>
                    <span>{vehicle.capacity}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Driver:</span>
                    <span>{vehicle.driver}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Speed:</span>
                    <span>{vehicle.speed}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fuel:</span>
                    <span>{vehicle.fuel}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Temperature:</span>
                    <span>{vehicle.temperature}</span>
                  </div>
                </div>
                <div className="vehicle-actions">
                  {/* Updated Track button to handle navigation */}
                  <button 
                    className="track-btn" 
                    onClick={() => handleTrackVehicle(vehicle.id)}
                  >
                    <FiNavigation /> Track
                  </button>
                  <button className="details-btn">Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drivers Section */}
        <div className="info-section">
          <div className="section-header">
            <h2>Driver Information</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="drivers-grid">
            {drivers.map(driver => (
              <div key={driver.id} className="driver-card">
                <div className="driver-header">
                  <div className="driver-avatar">
                    <img src={`https://randomuser.me/api/portraits/men/${driver.id.split('-')[1]}.jpg`} alt={driver.name} />
                  </div>
                  <div>
                    <h3>{driver.name}</h3>
                    <span className={`status-badge ${driver.status.toLowerCase().replace(' ', '-')}`}>
                      {driver.status}
                    </span>
                  </div>
                </div>
                <div className="driver-info">
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <span>{driver.phone}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">License:</span>
                    <span>{driver.license}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Vehicle:</span>
                    <span>{driver.vehicle}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Deliveries:</span>
                    <span>{driver.deliveries} today</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Rating:</span>
                    <span>{driver.rating}/5.0</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Experience:</span>
                    <span>{driver.experience}</span>
                  </div>
                </div>
                <div className="driver-actions">
                  <button className="contact-btn">Contact</button>
                  <button className="assign-btn">Assign Delivery</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="alerts-section">
        <div className="section-header">
          <h2>System Alerts</h2>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="alerts-list">
          <div className="alert-item warning">
            <div className="alert-icon">
              <FiAlertCircle />
            </div>
            <div className="alert-content">
              <h4>Low Fuel Warning</h4>
              <p>Vehicle VH-003 has less than 30% fuel remaining</p>
              <span>5 minutes ago</span>
            </div>
          </div>
          <div className="alert-item info">
            <div className="alert-icon">
              <FiPackage />
            </div>
            <div className="alert-content">
              <h4>New Delivery Order</h4>
              <p>New order received from Downtown Market</p>
              <span>10 minutes ago</span>
            </div>
          </div>
          <div className="alert-item success">
            <div className="alert-icon">
              <FiCheckCircle />
            </div>
            <div className="alert-content">
              <h4>Delivery Completed</h4>
              <p>Order ORD-0998 has been delivered successfully</p>
              <span>15 minutes ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
</>
  );
};

export default Dashboard;