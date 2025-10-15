import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import Header from "../../components/Header";
import BottomNavbar from "../../components/BottomNavbar";
import './historytracking.css';
import { MapContainer, TileLayer, Popup, Polyline, Marker, Tooltip, ScaleControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3020';

// Fetch devices from backend
const fetchDevices = async (setDevicesData, setLoading, setError) => {
  try {
    setLoading(true);
    console.log(`📱 Fetching devices from: ${API_BASE_URL}/api/devices`);
    const response = await fetch(`${API_BASE_URL}/api/devices`);
    if (!response.ok) {
      throw new Error(`Failed to fetch devices: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('✅ Devices API response:', data);
    if (data.success && data.data && Array.isArray(data.data.devices)) {
      const devicesObject = {};
      data.data.devices.forEach(device => {
        if (device.imei) {
          devicesObject[device.imei] = device;
        }
      });
      setDevicesData(devicesObject);
      setError(null);
      console.log(`📱 Processed ${Object.keys(devicesObject).length} devices`);
    } else {
      throw new Error(data.error?.message || 'Invalid devices data structure');
    }
  } catch (err) {
    console.error('❌ Error fetching devices:', err);
    setError(err.message);
    setDevicesData({});
  } finally {
    setLoading(false);
  }
};

// Fetch full device data for history track
const fetchFullDeviceData = async (imei, startDate, endDate, setHistoryTrack, setError, setTrackLoading) => {
  try {
    setTrackLoading(true);
    let url = `${API_BASE_URL}/api/devices/${imei}/full`;
    if (startDate && endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      url += `?${params.toString()}`;
    }
    console.log(`📊 Fetching full device data for: ${imei} with URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch full device data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`✅ Full device data for ${imei}:`, JSON.stringify(data, null, 2));
    if (data.success && data.data && Array.isArray(data.data.track)) {
      const track = data.data.track
        .map((loc, index) => {
          const lat = parseFloat(loc.latitude);
          const lng = parseFloat(loc.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            console.warn(`⚠️ Invalid coordinates at index ${index}:`, loc);
            return null;
          }
          return {
            latitude: lat,
            longitude: lng,
            speed: Number.isFinite(parseFloat(loc.speed)) ? parseFloat(loc.speed) : 0,
            heading: Number.isFinite(parseFloat(loc.heading)) ? parseFloat(loc.heading) : 0,
            altitude: Number.isFinite(parseFloat(loc.altitude)) ? parseFloat(loc.altitude) : 0,
            timestamp: loc.created_at || null,
            raw_packet: loc.raw_packet || null,
          };
        })
        .filter(loc => loc !== null);
      if (track.length === 0) {
        throw new Error('No valid track points found');
      }
      setHistoryTrack(track);
      setError(null);
      console.log(`🛣️ Device ${imei} track: ${track.length} points`);
    } else {
      throw new Error(data.error?.message || 'No track data available');
    }
  } catch (err) {
    console.error(`❌ Error fetching full data for ${imei}:`, err);
    setHistoryTrack([]);
    setError(err.message);
  } finally {
    setTrackLoading(false);
  }
};

// Helper function to safely convert to fixed decimal
const safeToFixed = (value, decimals = 6) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return 'N/A';
  }
  return num.toFixed(decimals);
};

// Calculate heading between two points
const calculateHeading = (fromLat, fromLng, toLat, toLng) => {
  const fromLatRad = fromLat * Math.PI / 180;
  const toLatRad = toLat * Math.PI / 180;
  const deltaLngRad = (toLng - fromLng) * Math.PI / 180;
  const y = Math.sin(deltaLngRad) * Math.cos(toLatRad);
  const x = Math.cos(fromLatRad) * Math.sin(toLatRad) -
           Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(deltaLngRad);
  let heading = Math.atan2(y, x) * 180 / Math.PI;
  heading = (heading + 360) % 360; // Normalize to 0-360
  return heading;
};

// Create a vehicle marker icon with direction
const createVehicleIcon = (color = '#3388ff', heading = 0, isSelected = false) => {
  const rotation = heading || 0;
  const size = isSelected ? 48 : 40;
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <rect x="6" y="8" width="12" height="8" rx="1" fill="${color}" />
      <rect x="7" y="9" width="4" height="2" fill="${color}" opacity="0.7" />
      <rect x="13" y="9" width="4" height="2" fill="${color}" opacity="0.7" />
      <circle cx="8" cy="10" r="1" fill="#ffffff" opacity="0.9" />
      <path d="M 8 6 L 6 8 L 10 8 Z" fill="#ffffff" opacity="0.8" />
    </svg>
  `;
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        position: relative;
        transform: rotate(${rotation}deg);
        transition: transform 0.5s ease-in-out;
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        ">
          ${svgIcon}
        </div>
        ${isSelected ? `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size * 0.8}px;
          height: ${size * 0.8}px;
          background-color: rgba(255,255,255,0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
          border: 2px solid rgba(255,255,255,0.5);
        "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

// Path Animation Marker Component
const PathAnimationMarker = ({
  positions,
  color,
  isSelected,
  children,
  animationDuration = 20000,
  onAnimationComplete,
  currentIndex,
  setCurrentIndex,
  isPlaying,
  resetAnimation
}) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [internalSegment, setInternalSegment] = useState(0);
  const animationFrameRef = useRef(null);
  const animationStartTimeRef = useRef(0);
  const targetPositionRef = useRef(null);
  const targetHeadingRef = useRef(0);
  const startPositionRef = useRef(null);
  const startHeadingRef = useRef(0);

  useEffect(() => {
    if (positions && positions.length > 0 && !currentPosition) {
      setCurrentPosition(positions[0]);
      startPositionRef.current = positions[0];
      setInternalSegment(0);
      if (positions.length > 1) {
        const heading = calculateHeading(
          positions[0][0], positions[0][1],
          positions[1][0], positions[1][1]
        );
        setCurrentHeading(heading);
        startHeadingRef.current = heading;
        targetHeadingRef.current = heading;
      }
    }
  }, [positions, currentPosition]);

  useEffect(() => {
    if (isPlaying && positions && positions.length > 1 && internalSegment < positions.length - 1) {
      if (!isAnimating) {
        const startIndex = internalSegment;
        const endIndex = startIndex + 1;
        startPositionRef.current = positions[startIndex];
        targetPositionRef.current = positions[endIndex];
        const segmentHeading = calculateHeading(
          positions[startIndex][0], positions[startIndex][1],
          positions[endIndex][0], positions[endIndex][1]
        );
        targetHeadingRef.current = segmentHeading;
        startHeadingRef.current = currentHeading;
        animationStartTimeRef.current = Date.now();
        setIsAnimating(true);
      }
    } else {
      setIsAnimating(false);
    }
  }, [isPlaying, positions, internalSegment, currentHeading]);

  useEffect(() => {
    if (resetAnimation && positions && positions.length > 0) {
      setCurrentPosition(positions[0]);
      startPositionRef.current = positions[0];
      targetPositionRef.current = positions[0];
      setInternalSegment(0);
      setIsAnimating(false);
      if (positions.length > 1) {
        const heading = calculateHeading(
          positions[0][0], positions[0][1],
          positions[1][0], positions[1][1]
        );
        setCurrentHeading(heading);
        startHeadingRef.current = heading;
        targetHeadingRef.current = heading;
      }
      if (setCurrentIndex) {
        setCurrentIndex(0);
      }
    }
  }, [resetAnimation, positions, setCurrentIndex]);

  useEffect(() => {
    if (!isAnimating) return;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - animationStartTimeRef.current;
      const segmentDuration = animationDuration / (positions.length - 1);
      const progress = Math.min(elapsed / segmentDuration, 1);

      if (progress < 1) {
        const easeProgress = easeInOutCubic(progress);
        const lat = startPositionRef.current[0] + (targetPositionRef.current[0] - startPositionRef.current[0]) * easeProgress;
        const lng = startPositionRef.current[1] + (targetPositionRef.current[1] - startPositionRef.current[1]) * easeProgress;
        let headingDiff = targetHeadingRef.current - startHeadingRef.current;
        if (headingDiff > 180) headingDiff -= 360;
        if (headingDiff < -180) headingDiff += 360;
        const newHeading = startHeadingRef.current + headingDiff * easeProgress;
        setCurrentPosition([lat, lng]);
        setCurrentHeading(newHeading);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentPosition(targetPositionRef.current);
        setCurrentHeading(targetHeadingRef.current);
        setInternalSegment(prev => prev + 1);
        setIsAnimating(false);
        if (setCurrentIndex) {
          setCurrentIndex(internalSegment + 1);
        }
        if (isPlaying && internalSegment < positions.length - 2) {
          setTimeout(() => {
            if (isPlaying) {
              const nextIndex = internalSegment + 1;
              const nextStartIndex = nextIndex;
              const nextEndIndex = nextIndex + 1;
              startPositionRef.current = positions[nextStartIndex];
              targetPositionRef.current = positions[nextEndIndex];
              const segmentHeading = calculateHeading(
                positions[nextStartIndex][0], positions[nextStartIndex][1],
                positions[nextEndIndex][0], positions[nextEndIndex][1]
              );
              targetHeadingRef.current = segmentHeading;
              startHeadingRef.current = currentHeading;
              animationStartTimeRef.current = Date.now();
              setIsAnimating(true);
            }
          }, 100);
        } else if (internalSegment >= positions.length - 2) {
          setIsAnimating(false);
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, positions, animationDuration, currentHeading, isPlaying, internalSegment, setCurrentIndex, onAnimationComplete]);

  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  if (!currentPosition) {
    return null;
  }

  return (
    <Marker position={currentPosition} icon={createVehicleIcon(color, currentHeading, isSelected)}>
      {children}
    </Marker>
  );
};

// Resizable Divider Component
const ResizableDivider = ({ onResize }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      const constrainedWidth = Math.max(20, Math.min(70, newWidth));
      onResize(constrainedWidth);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, onResize]);

  return (
    <div
      className={`resizable-divider ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
    >
      <div className="divider-line"></div>
    </div>
  );
};

const TrackingHistory = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mapMode, setMapMode] = useState('roadmap');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [devicesData, setDevicesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [trackLoading, setTrackLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyTrack, setHistoryTrack] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(30);
  const [animationSpeed, setAnimationSpeed] = useState(20000);
  const [showPath, setShowPath] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const mapRef = useRef(null);
  const isMounted = useRef(false);

  const mapLayers = {
    roadmap: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  useEffect(() => {
    isMounted.current = true;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    fetchDevices(setDevicesData, setLoading, setError);
  }, []);

  const vehicles = useMemo(() => {
    if (!devicesData || typeof devicesData !== 'object') {
      return [{ id: '', name: 'Select Vehicle' }];
    }
    return [
      { id: '', name: 'Select Vehicle' },
      ...Object.entries(devicesData).map(([imei, device]) => ({
        id: imei,
        name: device.device_name || imei,
        status: device.is_active ? 'Active' : 'Inactive'
      }))
    ];
  }, [devicesData]);

  const toggleMapMode = () => {
    setMapMode(prev => prev === 'roadmap' ? 'satellite' : 'roadmap');
  };

  const handleView = () => {
    if (!selectedVehicle) {
      alert('Please select a vehicle');
      return;
    }
    setPlaybackIndex(0);
    setIsPlaying(false);
    setHistoryTrack([]);
    setError(null);
    setResetTrigger(prev => prev + 1);
    fetchFullDeviceData(selectedVehicle, startDate, endDate, setHistoryTrack, setError, setTrackLoading);
  };

  const handlePlayPause = () => {
    if (playbackIndex >= historyTrack.length - 1) {
      setPlaybackIndex(0);
      setResetTrigger(prev => prev + 1);
      setTimeout(() => {
        setIsPlaying(true);
      }, 100);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setPlaybackIndex(0);
    setIsPlaying(false);
    setResetTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (historyTrack.length > 0 && mapRef.current && !trackLoading && isMounted.current) {
      const firstPos = historyTrack[0];
      if (Number.isFinite(firstPos.latitude) && Number.isFinite(firstPos.longitude)) {
        mapRef.current.flyTo([firstPos.latitude, firstPos.longitude], 15, { animate: true, duration: 1.0 });
      }
    }
  }, [historyTrack, trackLoading]);

  const positions = useMemo(() => {
    const validPositions = historyTrack
      .filter(loc => loc && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude))
      .map(loc => [loc.latitude, loc.longitude]);
    console.log(`🗺️ Rendered positions: ${validPositions.length} out of ${historyTrack.length} track points`);
    return validPositions;
  }, [historyTrack]);

  const currentLoc = useMemo(() => {
    if (
      historyTrack.length > 0 &&
      playbackIndex >= 0 &&
      playbackIndex < historyTrack.length &&
      historyTrack[playbackIndex] &&
      Number.isFinite(historyTrack[playbackIndex].latitude) &&
      Number.isFinite(historyTrack[playbackIndex].longitude)
    ) {
      return historyTrack[playbackIndex];
    }
    return null;
  }, [historyTrack, playbackIndex]);

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString();
  };

  const handleSidebarResize = (newWidth) => {
    setSidebarWidth(newWidth);
  };

  function MapEvents() {
    const map = useMap();
    mapRef.current = map;
    useMapEvents({
      moveend: (e) => {
        const center = e.target.getCenter();
        console.log('Map moved to:', [center.lat, center.lng]);
      },
      zoomend: (e) => {
        console.log('Zoom level changed to:', e.target.getZoom());
      }
    });
    return null;
  }

  return (
    <>
      <Helmet>
        <title>HistoryTracking</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <Header />
      <BottomNavbar text="Tracking History" />
      <div className="tracking-history-container">
        <div className="header">
          <div className="report-title">Tracking History</div>
          <div className="date-range">
            <span>From: {historyTrack.length > 0 ? formatTimestamp(historyTrack[0].timestamp) : 'N/A'}</span>
            <span>To: {historyTrack.length > 0 ? formatTimestamp(historyTrack[historyTrack.length - 1].timestamp) : 'N/A'}</span>
          </div>
        </div>

        <div className="main-content">
          <div className="sidebar" style={{ width: `${sidebarWidth}%` }}>
            {loading ? (
              <div className="loading">Loading vehicles...</div>
            ) : error && !selectedVehicle ? (
              <div className="error">
                Error: {error} <button onClick={() => fetchDevices(setDevicesData, setLoading, setError)}>Retry</button>
              </div>
            ) : (
              <>
                <div className="filter-section">
                  <h3>Select Vehicle</h3>
                  <select className="filter-select" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-section">
                  <h3>Date Range</h3>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
                <div className="filter-section">
                  <button className="view-button" onClick={handleView} disabled={trackLoading}>
                    {trackLoading ? 'Loading...' : 'View'}
                  </button>
                </div>
                {historyTrack.length > 0 && (
                  <div className="filter-section">
                    <h3>Animation Speed</h3>
                    <div className="speed-control">
                      <input
                        type="range"
                        min="5000"
                        max="60000"
                        step="5000"
                        value={animationSpeed}
                        onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                      />
                      <span>{animationSpeed / 1000}s</span>
                    </div>
                  </div>
                )}
                {historyTrack.length > 0 && (
                  <div className="filter-section">
                    <h3>Display Options</h3>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={showPath}
                        onChange={(e) => setShowPath(e.target.checked)}
                      />
                      Show Path
                    </label>
                  </div>
                )}
                {trackLoading && selectedVehicle && (
                  <div className="loading">Loading track data...</div>
                )}
                {historyTrack.length === 0 && selectedVehicle && !loading && !trackLoading && !error && (
                  <div className="no-data">
                    No valid track data available for this vehicle.
                    <button onClick={handleView}>Retry</button>
                  </div>
                )}
                {error && selectedVehicle && (
                  <div className="error">
                    Error: {error}
                    <button onClick={handleView}>Retry</button>
                  </div>
                )}
              </>
            )}
          </div>

          <ResizableDivider onResize={handleSidebarResize} />

          <div className="map-container" style={{ width: `${100 - sidebarWidth}%` }}>
            <button className="map-mode-btn" onClick={toggleMapMode}>
              {mapMode === 'roadmap' ? 'Satellite View' : 'Roadmap View'}
            </button>
            {historyTrack.length > 0 && !trackLoading && (
              <div className="playback-controls">
                <div className="control-buttons">
                  <button onClick={handlePlayPause} disabled={trackLoading}>
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button onClick={handleReset} disabled={trackLoading}>
                    Reset
                  </button>
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${historyTrack.length > 0 ? (playbackIndex / (historyTrack.length - 1)) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {historyTrack.length > 0 ? `${playbackIndex + 1} / ${historyTrack.length}` : '0 / 0'}
                  </span>
                </div>
              </div>
            )}
            <MapContainer
              center={[20, 78]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
            >
              <TileLayer
                url={mapLayers[mapMode]}
                attribution={mapMode === 'roadmap' ?
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' :
                  '&copy; <a href="https://www.esri.com/">Esri</a>'
                }
              />
              <ScaleControl position="bottomleft" />
              {showPath && positions.length > 1 && !trackLoading && (
                <Polyline
                  positions={positions}
                  color="red"
                  weight={5}
                  opacity={0.7}
                  smoothFactor={1}
                  className="history-path"
                />
              )}
              {currentLoc && !trackLoading && (
                <PathAnimationMarker
                  positions={positions}
                  color="#ff0000"
                  isSelected={true}
                  animationDuration={animationSpeed}
                  currentIndex={playbackIndex}
                  setCurrentIndex={setPlaybackIndex}
                  isPlaying={isPlaying}
                  resetAnimation={resetTrigger}
                  onAnimationComplete={() => {
                    setIsPlaying(false);
                    console.log('Path animation completed');
                  }}
                >
                  <Tooltip>
                    {vehicles.find(v => v.id === selectedVehicle)?.name || 'Vehicle'}
                  </Tooltip>
                  <Popup>
                    <div className="popup-content">
                      <h3>Vehicle Details</h3>
                      <p><strong>Timestamp:</strong> {formatTimestamp(currentLoc.timestamp)}</p>
                      <p><strong>Speed:</strong> {currentLoc.speed || 0} km/h</p>
                      <p><strong>Altitude:</strong> {currentLoc.altitude || 0} m</p>
                      <p><strong>Heading:</strong> {currentLoc.heading || 0}°</p>
                    </div>
                  </Popup>
                </PathAnimationMarker>
              )}
              <MapEvents />
            </MapContainer>
          </div>
        </div>

        <div className="status-bar">
          <div className="status-item">
            <span className="status-label">Current Time:</span>
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Selected Vehicle:</span>
            <span>{selectedVehicle ? vehicles.find(v => v.id === selectedVehicle)?.name : 'None'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Playback Progress:</span>
            <span>{historyTrack.length > 0 ? `${playbackIndex + 1} / ${historyTrack.length}` : 'N/A'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Playback Time:</span>
            <span>{formatTimestamp(currentLoc?.timestamp)}</span>
          </div>
          <div className="status-item">
            <span className="status-label">View Mode:</span>
            <span>{mapMode === 'roadmap' ? 'Roadmap' : 'Satellite'}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrackingHistory;