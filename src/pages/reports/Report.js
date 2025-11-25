import React, { useState } from 'react';
import styles from './Report.module.css';

const Report = () => {
  // Sample trip data
  const tripsData = [
    {
      id: 'TRP-2023-0842',
      date: '2023-10-15',
      duration: '3 days',
      departure: 'Chicago Warehouse',
      destination: 'New York Distribution Center',
      distance: '790 miles',
      estimatedTravelTime: '12 hours',
      status: 'In Transit',
      progress: '65%',
      lastUpdated: 'October 16, 2023 14:30',
      notes: 'On schedule, no delays reported',
      vehicle: {
        id: 'V-7842',
        type: 'Refrigerated Truck',
        model: 'Freightliner Cascadia',
        year: '2021',
        licensePlate: 'IL-TRK-7842',
        mileage: '89,420 miles'
      },
      driver: {
        id: 'DRV-203',
        name: 'Michael Johnson',
        license: 'CDL-A #IL7842',
        contact: '(555) 123-4567',
        experience: '8 years'
      },
      goods: [
        {
          type: 'Perishable Food',
          quantity: '42 pallets',
          weight: '18,500 lbs',
          dimensions: '40\' x 8\' x 8.5\'',
          specialRequirements: 'Temperature: 38°F'
        },
        {
          type: 'Electronics',
          quantity: '28 crates',
          weight: '5,200 lbs',
          dimensions: '24" x 24" x 18" each',
          specialRequirements: 'Fragile, handle with care'
        }
      ],
      route: [
        { checkpoint: 'Chicago Warehouse', dateTime: 'Oct 15, 08:00 AM', status: 'Departed' },
        { checkpoint: 'Indianapolis, IN', dateTime: 'Oct 15, 02:30 PM', status: 'Passed' },
        { checkpoint: 'Toledo, OH', dateTime: 'Oct 15, 06:45 PM', status: 'Passed' },
        { checkpoint: 'Pittsburgh, PA', dateTime: 'Oct 16, 01:20 AM', status: 'Passed' },
        { checkpoint: 'Harrisburg, PA', dateTime: 'Oct 16, 07:15 AM', status: 'Passed' },
        { checkpoint: 'Philadelphia, PA', dateTime: 'Oct 16, 12:30 PM', status: 'Passed' },
        { checkpoint: 'New York Distribution Center', dateTime: 'Oct 16, 08:00 PM (Est.)', status: 'Upcoming' }
      ],
      additionalNotes: [
        'Weather Conditions: Clear weather expected along the entire route',
        'Fuel Stops: Planned in Toledo and Harrisburg',
        'Rest Breaks: Scheduled in Indianapolis and Philadelphia',
        'Special Instructions: Maintain temperature control for perishable items, Avoid sudden braking for electronics, Use designated loading docks at destination'
      ],
      contact: {
        dispatch: '(555) 987-6543',
        emergency: '(555) 456-7890',
        email: 'dispatch@logisticscompany.com'
      }
    },
    {
      id: 'TRP-2023-0843',
      date: '2023-10-18',
      duration: '2 days',
      departure: 'Los Angeles Warehouse',
      destination: 'San Francisco Distribution Center',
      distance: '380 miles',
      estimatedTravelTime: '6 hours',
      status: 'Completed',
      progress: '100%',
      lastUpdated: 'October 19, 2023 10:15',
      notes: 'Delivered on time',
      vehicle: {
        id: 'V-7843',
        type: 'Box Truck',
        model: 'Isuzu NQR',
        year: '2020',
        licensePlate: 'CA-TRK-7843',
        mileage: '65,320 miles'
      },
      driver: {
        id: 'DRV-204',
        name: 'Sarah Williams',
        license: 'CDL-B #CA6543',
        contact: '(555) 234-5678',
        experience: '5 years'
      },
      goods: [
        {
          type: 'Clothing',
          quantity: '35 boxes',
          weight: '2,800 lbs',
          dimensions: '20" x 20" x 15" each',
          specialRequirements: 'None'
        }
      ],
      route: [
        { checkpoint: 'Los Angeles Warehouse', dateTime: 'Oct 18, 09:00 AM', status: 'Departed' },
        { checkpoint: 'Bakersfield, CA', dateTime: 'Oct 18, 12:30 PM', status: 'Passed' },
        { checkpoint: 'San Francisco Distribution Center', dateTime: 'Oct 18, 05:45 PM', status: 'Arrived' }
      ],
      additionalNotes: [
        'Weather Conditions: Light rain in northern California',
        'Fuel Stops: Planned in Bakersfield',
        'Rest Breaks: Scheduled in Bakersfield'
      ],
      contact: {
        dispatch: '(555) 987-6543',
        emergency: '(555) 456-7890',
        email: 'dispatch@logisticscompany.com'
      }
    }
  ];

  const [trips] = useState(tripsData);
  const [filteredTrips, setFilteredTrips] = useState(tripsData);
  const [searchDate, setSearchDate] = useState('');
  const [searchTime, setSearchTime] = useState('');

  const handleSearch = () => {
    if (!searchDate && !searchTime) {
      setFilteredTrips(trips);
      return;
    }

    const filtered = trips.filter(trip => {
      const tripDate = new Date(trip.date).toISOString().split('T')[0];
      const searchDateObj = searchDate ? new Date(searchDate).toISOString().split('T')[0] : '';
      
      // Check if date matches
      const dateMatch = !searchDate || tripDate === searchDateObj;
      
      // For time search, we'll check if the trip departure time contains the search time
      const timeMatch = !searchTime || 
        trip.route.some(point => point.dateTime.toLowerCase().includes(searchTime.toLowerCase()));
      
      return dateMatch && timeMatch;
    });

    setFilteredTrips(filtered);
  };

  const resetSearch = () => {
    setSearchDate('');
    setSearchTime('');
    setFilteredTrips(trips);
  };

  return (
    <div className={styles.reportContainer}>
      <header className={styles.reportHeader}>
        <h1>Trip Details Report</h1>
        <p>Generated on October 16, 2023 at 15:45</p>
      </header>

      {/* Search Section */}
      <section className={styles.searchSection}>
        <h2>Search Trips</h2>
        <div className={styles.searchControls}>
          <div className={styles.searchGroup}>
            <label htmlFor="searchDate">Date:</label>
            <input
              type="date"
              id="searchDate"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.searchGroup}>
            <label htmlFor="searchTime">Time:</label>
            <input
              type="text"
              id="searchTime"
              placeholder="e.g. 08:00 AM"
              value={searchTime}
              onChange={(e) => setSearchTime(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.searchButtons}>
            <button onClick={handleSearch} className={styles.searchButton}>Search</button>
            <button onClick={resetSearch} className={styles.resetButton}>Reset</button>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className={styles.resultsSection}>
        <h2>Search Results</h2>
        {filteredTrips.length === 0 ? (
          <div className={styles.noResults}>No trips found matching your search criteria.</div>
        ) : (
          <div className={styles.tripList}>
            {filteredTrips.map(trip => (
              <div key={trip.id} className={styles.tripCard}>
                <div className={styles.tripSummary}>
                  <h3>Trip {trip.id}</h3>
                  <div className={styles.tripMeta}>
                    <span><strong>Date:</strong> {trip.date}</span>
                    <span><strong>Status:</strong> {trip.status}</span>
                    <span><strong>Progress:</strong> {trip.progress}</span>
                  </div>
                  <div className={styles.tripRoute}>
                    <strong>Route:</strong> {trip.departure} → {trip.destination}
                  </div>
                </div>
                
                {/* Detailed Trip Information */}
                <div className={styles.tripDetails}>
                  <div className={styles.detailCard}>
                    <h4>Departure & Destination</h4>
                    <table className={styles.detailTable}>
                      <tbody>
                        <tr>
                          <td className={styles.label}>Departure</td>
                          <td>{trip.departure}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Destination</td>
                          <td>{trip.destination}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Distance</td>
                          <td>{trip.distance}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Estimated Travel Time</td>
                          <td>{trip.estimatedTravelTime}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.detailCard}>
                    <h4>Status Information</h4>
                    <table className={styles.detailTable}>
                      <tbody>
                        <tr>
                          <td className={styles.label}>Current Status</td>
                          <td>{trip.status}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Progress</td>
                          <td>{trip.progress}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Last Updated</td>
                          <td>{trip.lastUpdated}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Notes</td>
                          <td>{trip.notes}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.detailCard}>
                    <h4>Vehicle Details</h4>
                    <table className={styles.detailTable}>
                      <tbody>
                        <tr>
                          <td className={styles.label}>Vehicle ID</td>
                          <td>{trip.vehicle.id}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Type</td>
                          <td>{trip.vehicle.type}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Model</td>
                          <td>{trip.vehicle.model}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Year</td>
                          <td>{trip.vehicle.year}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>License Plate</td>
                          <td>{trip.vehicle.licensePlate}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Mileage</td>
                          <td>{trip.vehicle.mileage}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.detailCard}>
                    <h4>Driver Information</h4>
                    <table className={styles.detailTable}>
                      <tbody>
                        <tr>
                          <td className={styles.label}>Driver ID</td>
                          <td>{trip.driver.id}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Name</td>
                          <td>{trip.driver.name}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>License</td>
                          <td>{trip.driver.license}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Contact</td>
                          <td>{trip.driver.contact}</td>
                        </tr>
                        <tr>
                          <td className={styles.label}>Experience</td>
                          <td>{trip.driver.experience}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.detailCard}>
                    <h4>Goods Details</h4>
                    <table className={styles.goodsTable}>
                      <thead>
                        <tr>
                          <th>Goods Type</th>
                          <th>Quantity</th>
                          <th>Weight</th>
                          <th>Dimensions</th>
                          <th>Special Requirements</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trip.goods.map((goods, index) => (
                          <tr key={index}>
                            <td>{goods.type}</td>
                            <td>{goods.quantity}</td>
                            <td>{goods.weight}</td>
                            <td>{goods.dimensions}</td>
                            <td>{goods.specialRequirements}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.detailCard}>
                    <h4>Route & Timeline</h4>
                    <table className={styles.routeTable}>
                      <thead>
                        <tr>
                          <th>Checkpoint</th>
                          <th>Date/Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trip.route.map((point, index) => (
                          <tr key={index} className={point.status === 'Upcoming' ? styles.upcoming : ''}>
                            <td>{point.checkpoint}</td>
                            <td>{point.dateTime}</td>
                            <td>{point.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.detailCard}>
                    <h4>Additional Notes</h4>
                    <ul>
                      {trip.additionalNotes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.detailCard}>
                    <h4>Contact Information</h4>
                    <p>For inquiries regarding this trip:</p>
                    <ul>
                      <li><strong>Dispatch Office:</strong> {trip.contact.dispatch}</li>
                      <li><strong>Emergency Contact:</strong> {trip.contact.emergency}</li>
                      <li><strong>Email:</strong> {trip.contact.email}</li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Report;