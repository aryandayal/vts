import React, { useState } from 'react';
import styles from './Transporter.module.css';

const Transporter = () => {
  // State for form inputs
  const [formData, setFormData] = useState({
    departure: '',
    destination: '',
    dateTime: '',
    vehicle: '',
    driver: '',
    goods: ''
  });

  // State for trips
  const [trips, setTrips] = useState([
    {
      id: 1,
      departure: 'Warehouse A',
      destination: 'Warehouse B',
      dateTime: '2023-05-15T10:30',
      vehicle: 'Truck 101',
      driver: 'John Doe',
      goods: 'Electronics',
      status: 'ongoing',
      startTime: '2023-05-15T10:30',
      endTime: null
    },
    {
      id: 2,
      departure: 'Warehouse C',
      destination: 'Warehouse D',
      dateTime: '2023-05-10T14:00',
      vehicle: 'Van 202',
      driver: 'Jane Smith',
      goods: 'Furniture',
      status: 'completed',
      startTime: '2023-05-10T14:00',
      endTime: '2023-05-10T18:45'
    }
  ]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newTrip = {
      id: trips.length + 1,
      ...formData,
      status: 'ongoing',
      startTime: formData.dateTime,
      endTime: null
    };
    
    setTrips([...trips, newTrip]);
    
    // Reset form
    setFormData({
      departure: '',
      destination: '',
      dateTime: '',
      vehicle: '',
      driver: '',
      goods: ''
    });
  };

  // Mark trip as completed
  const completeTrip = (id) => {
    setTrips(trips.map(trip => 
      trip.id === id 
        ? { ...trip, status: 'completed', endTime: new Date().toISOString().slice(0, 16) } 
        : trip
    ));
  };

  // Filter trips by status
  const ongoingTrips = trips.filter(trip => trip.status === 'ongoing');
  const completedTrips = trips.filter(trip => trip.status === 'completed');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Trip Management System</h1>
        <p className={styles.subtitle}>Efficiently manage your transportation logistics</p>
      </div>
      
      {/* Create Trip Form */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Create New Trip</h2>
          <div className={styles.cardIcon}>🚚</div>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Departure Godown</label>
              <input
                type="text"
                name="departure"
                value={formData.departure}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter departure location"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Destination Godown</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter destination"
                required
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Date & Time</label>
              <input
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Vehicle</label>
              <input
                type="text"
                name="vehicle"
                value={formData.vehicle}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Vehicle ID/Name"
                required
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Driver</label>
              <input
                type="text"
                name="driver"
                value={formData.driver}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Driver name"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Goods</label>
              <input
                type="text"
                name="goods"
                value={formData.goods}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Type of goods"
                required
              />
            </div>
          </div>
          
          <button type="submit" className={styles.button}>
            <span className={styles.buttonText}>Create Trip</span>
            <span className={styles.buttonIcon}>➕</span>
          </button>
        </form>
      </div>
      
      {/* Trip Status Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Ongoing Trips</h2>
          <div className={styles.statusBadge}>{ongoingTrips.length} Active</div>
        </div>
        {ongoingTrips.length === 0 ? (
          <div className={styles.noData}>
            <div className={styles.noDataIcon}>📋</div>
            <p>No ongoing trips</p>
          </div>
        ) : (
          <div className={styles.tripList}>
            {ongoingTrips.map(trip => (
              <div key={trip.id} className={styles.tripCard}>
                <div className={styles.tripHeader}>
                  <span className={styles.tripId}>Trip #{trip.id}</span>
                  <span className={`${styles.status} ${styles.ongoing}`}>
                    <span className={styles.statusDot}></span>
                    Ongoing
                  </span>
                </div>
                <div className={styles.tripDetails}>
                  <div className={styles.tripRoute}>
                    <div className={styles.location}>
                      <div className={styles.locationDot}></div>
                      <div>{trip.departure}</div>
                    </div>
                    <div className={styles.routeLine}></div>
                    <div className={styles.location}>
                      <div className={styles.locationDot}></div>
                      <div>{trip.destination}</div>
                    </div>
                  </div>
                  <div className={styles.tripInfo}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Departure:</span>
                      <span>{new Date(trip.startTime).toLocaleString()}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Vehicle:</span>
                      <span>{trip.vehicle}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Driver:</span>
                      <span>{trip.driver}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Goods:</span>
                      <span>{trip.goods}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => completeTrip(trip.id)} 
                  className={`${styles.button} ${styles.completeButton}`}
                >
                  <span className={styles.buttonText}>Mark as Completed</span>
                  <span className={styles.buttonIcon}>✓</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Trip Completed Details Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Completed Trips</h2>
          <div className={styles.statusBadge}>{completedTrips.length} Completed</div>
        </div>
        {completedTrips.length === 0 ? (
          <div className={styles.noData}>
            <div className={styles.noDataIcon}>📋</div>
            <p>No completed trips</p>
          </div>
        ) : (
          <div className={styles.tripList}>
            {completedTrips.map(trip => (
              <div key={trip.id} className={styles.tripCard}>
                <div className={styles.tripHeader}>
                  <span className={styles.tripId}>Trip #{trip.id}</span>
                  <span className={`${styles.status} ${styles.completed}`}>
                    <span className={styles.statusDot}></span>
                    Completed
                  </span>
                </div>
                <div className={styles.tripDetails}>
                  <div className={styles.tripRoute}>
                    <div className={styles.location}>
                      <div className={styles.locationDot}></div>
                      <div>{trip.departure}</div>
                    </div>
                    <div className={styles.routeLine}></div>
                    <div className={styles.location}>
                      <div className={styles.locationDot}></div>
                      <div>{trip.destination}</div>
                    </div>
                  </div>
                  <div className={styles.tripInfo}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Start Time:</span>
                      <span>{new Date(trip.startTime).toLocaleString()}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>End Time:</span>
                      <span>{new Date(trip.endTime).toLocaleString()}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Duration:</span>
                      <span>
                        {Math.round((new Date(trip.endTime) - new Date(trip.startTime)) / (1000 * 60 * 60))} hours
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Vehicle:</span>
                      <span>{trip.vehicle}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Driver:</span>
                      <span>{trip.driver}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Goods:</span>
                      <span>{trip.goods}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transporter;