import React, { useState, useEffect } from 'react';
import styles from './Transporter.module.css';
import { useGodowns, useGoods } from '../hooks/useData';

// Custom Searchable Select Component
const SearchableSelect = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options, 
  loading, 
  placeholder, 
  detailsButton, 
  onDetailsClick,
  detailsVisible,
  detailsContent,
  displayField,
  secondaryField
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  
  const filteredOptions = options?.filter(option => 
    option[displayField].toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option[secondaryField] && option[secondaryField].toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  const handleSelect = (option) => {
    onChange({ target: { name, value: option.id } });
    setSearchTerm('');
    setShowOptions(false);
  };
  
  const selectedOption = options?.find(option => option.id === value);
  
  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>{label}</label>
      <div className={styles.selectContainer}>
        <div className={styles.searchableSelect}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={searchTerm || (selectedOption ? `${selectedOption[displayField]} ${selectedOption[secondaryField] ? `(${selectedOption[secondaryField]})` : ''}` : '')}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowOptions(true);
            }}
            onFocus={() => setShowOptions(true)}
            onBlur={() => setTimeout(() => setShowOptions(false), 200)}
          />
          {showOptions && (
            <div className={styles.optionsDropdown}>
              {loading ? (
                <div className={styles.optionItem}>Loading...</div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div 
                    key={option.id} 
                    className={styles.optionItem}
                    onClick={() => handleSelect(option)}
                  >
                    {option[displayField]} {option[secondaryField] ? `(${option[secondaryField]})` : ''}
                  </div>
                ))
              ) : (
                <div className={styles.optionItem}>No options found</div>
              )}
            </div>
          )}
        </div>
        {detailsButton && (
          <button 
            type="button" 
            className={styles.detailsButton}
            onClick={onDetailsClick}
          >
            {detailsVisible ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>
      {detailsVisible && detailsContent && (
        <div className={styles.detailsDropdown}>
          {detailsContent}
        </div>
      )}
    </div>
  );
};

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

  // State for dropdown visibility
  const [showDetails, setShowDetails] = useState({
    departure: false,
    destination: false,
    goods: false
  });

  // Get data from store
  const { godowns, godownsLoading, fetchGodowns } = useGodowns();
  const { goods: goodsData, goodsLoading, fetchGoods } = useGoods();

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

  // Fetch data on component mount
  useEffect(() => {
    fetchGodowns();
    fetchGoods();
  }, [fetchGodowns, fetchGoods]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Toggle dropdown details
  const toggleDetails = (field) => {
    setShowDetails({
      ...showDetails,
      [field]: !showDetails[field]
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get selected objects from store
    const selectedDeparture = godowns?.find(g => g.id === formData.departure);
    const selectedDestination = godowns?.find(g => g.id === formData.destination);
    const selectedGoods = goodsData?.find(g => g.id === formData.goods);
    
    const newTrip = {
      id: trips.length + 1,
      departure: selectedDeparture ? selectedDeparture.godown_name : formData.departure,
      destination: selectedDestination ? selectedDestination.godown_name : formData.destination,
      dateTime: formData.dateTime,
      vehicle: formData.vehicle,
      driver: formData.driver,
      goods: selectedGoods ? selectedGoods.good_name : formData.goods,
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
            <SearchableSelect
              label="Source Godown"
              name="departure"
              value={formData.departure}
              onChange={handleInputChange}
              options={godowns}
              loading={godownsLoading}
              placeholder="Search source godown..."
              detailsButton={!!formData.departure}
              onDetailsClick={() => toggleDetails('departure')}
              detailsVisible={showDetails.departure}
              detailsContent={
                (godowns || [])
                  .filter(g => g.id === formData.departure)
                  .map(godown => (
                    <div key={godown.id} className={styles.detailsContent}>
                      <p><strong>ID:</strong> {godown.id}</p>
                      <p><strong>Name:</strong> {godown.godown_name}</p>
                      <p><strong>Godown No:</strong> {godown.godown_no}</p>
                      <p><strong>Contact:</strong> {godown.contact}</p>
                      <p><strong>Address:</strong> {godown.address}</p>
                      <p><strong>District:</strong> {godown.district}</p>
                      <p><strong>Pin:</strong> {godown.pin}</p>
                      <p><strong>Location:</strong> {godown.latitude}, {godown.longitude}</p>
                      <p><strong>Status:</strong> {godown.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                  ))
              }
              displayField="godown_name"
              secondaryField="godown_no"
            />
            
            <SearchableSelect
              label="Destination Godown"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              options={godowns}
              loading={godownsLoading}
              placeholder="Search destination godown..."
              detailsButton={!!formData.destination}
              onDetailsClick={() => toggleDetails('destination')}
              detailsVisible={showDetails.destination}
              detailsContent={
                (godowns || [])
                  .filter(g => g.id === formData.destination)
                  .map(godown => (
                    <div key={godown.id} className={styles.detailsContent}>
                      <p><strong>ID:</strong> {godown.id}</p>
                      <p><strong>Name:</strong> {godown.godown_name}</p>
                      <p><strong>Godown No:</strong> {godown.godown_no}</p>
                      <p><strong>Contact:</strong> {godown.contact}</p>
                      <p><strong>Address:</strong> {godown.address}</p>
                      <p><strong>District:</strong> {godown.district}</p>
                      <p><strong>Pin:</strong> {godown.pin}</p>
                      <p><strong>Location:</strong> {godown.latitude}, {godown.longitude}</p>
                      <p><strong>Status:</strong> {godown.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                  ))
              }
              displayField="godown_name"
              secondaryField="godown_no"
            />
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
            
            <SearchableSelect
              label="Goods"
              name="goods"
              value={formData.goods}
              onChange={handleInputChange}
              options={goodsData}
              loading={goodsLoading}
              placeholder="Search goods..."
              detailsButton={!!formData.goods}
              onDetailsClick={() => toggleDetails('goods')}
              detailsVisible={showDetails.goods}
              detailsContent={
                (goodsData || [])
                  .filter(g => g.id === formData.goods)
                  .map(item => (
                    <div key={item.id} className={styles.detailsContent}>
                      <p><strong>ID:</strong> {item.id}</p>
                      <p><strong>Name:</strong> {item.good_name}</p>
                      <p><strong>Type:</strong> {item.good_type}</p>
                      <p><strong>Description:</strong> {item.description}</p>
                      <p><strong>Unit Weight:</strong> {item.unit_weight} kg</p>
                      <p><strong>Status:</strong> {item.status}</p>
                    </div>
                  ))
              }
              displayField="good_name"
              secondaryField="good_type"
            />
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