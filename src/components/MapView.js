import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Popup, ScaleControl, useMap, useMapEvents, Polyline, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { BsFillTruckFrontFill } from "react-icons/bs";
import { Helmet } from "react-helmet";
import { MdLayers, MdWhatshot, MdTimeline } from "react-icons/md";

// Import Leaflet CSS for proper rendering
import 'leaflet/dist/leaflet.css';
// Import the CSS file
import './mapview.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

console.log('🌐 MapView using API:', API_BASE_URL);

// Fetch realtime locations from our backend
const fetchRealtimeLocations = async () => {
  try {
    console.log(`📍 Fetching realtime locations from: ${API_BASE_URL}/api/locations/realtime`);
    const response = await fetch(`${API_BASE_URL}/api/locations/realtime`);
    if (!response.ok) {
      throw new Error(`Failed to fetch realtime locations: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('✅ Realtime locations API response:', data);
    if (data.success) {
      const realtimeObject = {};
      if (data.data && data.data.devices && Array.isArray(data.data.devices)) {
        data.data.devices.forEach(device => {
          realtimeObject[device.imei] = device;
        });
        console.log(`📱 Processed ${Object.keys(realtimeObject).length} realtime devices`);
        return realtimeObject;
      } else {
        console.warn('❌ Invalid realtime data structure:', data);
        return {};
      }
    } else {
      throw new Error(data.error?.message || 'Unknown error');
    }
  } catch (err) {
    console.error('❌ Error fetching realtime locations:', err);
    return {};
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

// Parse coordinates from raw packet (matches M66 format)
const parseCoordinatesFromRawPacket = (rawPacket) => {
  if (!rawPacket) return null;
  try {
    const parts = rawPacket.split(',');
    let latitude = null;
    let longitude = null;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes('.') && i + 1 < parts.length && parts[i+1] === 'N') {
        latitude = parseFloat(parts[i]);
      }
      if (parts[i].includes('.') && i + 1 < parts.length && parts[i+1] === 'E') {
        longitude = parseFloat(parts[i]);
      }
    }
    if (latitude !== null && longitude !== null && 
        !isNaN(latitude) && !isNaN(longitude) &&
        latitude >= 6 && latitude <= 38 && longitude >= 68 && longitude <= 98) {
      return { latitude, longitude };
    }
    return null;
  } catch (error) {
    console.error('❌ Error parsing coordinates from raw packet:', error);
    return null;
  }
};

// Get coordinates from device
const getCoordinatesFromDevice = (device) => {
  if (device.latitude && device.longitude) {
    const lat = parseFloat(device.latitude);
    const lng = parseFloat(device.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
      console.log('✅ Using direct coordinates from API:', { lat, lng });
      return { latitude: lat, longitude: lng };
    }
  }
  if (device.raw_packet || device.raw_data) {
    const rawPacket = device.raw_packet || device.raw_data;
    const packetCoords = parseCoordinatesFromRawPacket(rawPacket);
    if (packetCoords) {
      console.log('✅ Using coordinates from raw packet:', packetCoords);
      return packetCoords;
    }
  }
  console.warn('❌ No valid coordinates found for device:', device.device_name || device.imei);
  return null;
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
  heading = (heading + 360) % 360;
  return heading;
};

// Calculate distance between two points using Haversine formula (in meters)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Smooth path using moving average
const smoothPath = (positions, windowSize = 3) => {
  if (positions.length <= windowSize) return positions;
  const smoothed = [];
  const halfWindow = Math.floor(windowSize / 2);
  for (let i = 0; i < positions.length; i++) {
    let latSum = 0, lngSum = 0, count = 0;
    for (let j = Math.max(0, i - halfWindow); j <= Math.min(positions.length - 1, i + halfWindow); j++) {
      latSum += positions[j][0];
      lngSum += positions[j][1];
      count++;
    }
    smoothed.push([latSum / count, lngSum / count]);
  }
  return smoothed;
};

// Status Indicator Component
const StatusIndicator = ({ status }) => {
  const color = status === "running" ? "green" : status === "idle" ? "orange" : status === "connected" ? "green" : "red";
  return (
    <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "6px", background: color }} />
  );
};

// Vehicle Table Component
const VehicleTable = ({ devices, onDeviceSelect, selectedDeviceId, loading, error }) => {
  const [selectedVehicles, setSelectedVehicles] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelectedVehicles = {};
    Object.keys(devices).forEach(imei => {
      newSelectedVehicles[imei] = newSelectAll;
    });
    setSelectedVehicles(newSelectedVehicles);
  };

  const handleVehicleSelect = (imei) => {
    setSelectedVehicles(prev => ({
      ...prev,
      [imei]: !prev[imei]
    }));
  };

  const handleRowClick = (imei) => {
    onDeviceSelect(imei);
  };

  if (loading) {
    return (
      <div className="no-devices-message">
        <p>Loading devices from AIS-140 system...</p>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="no-devices-message">
        <p>Error loading devices: {error}</p>
        <button onClick={() => window.location.reload()}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="table-container">
      {Object.keys(devices).length === 0 ? (
        <div className="no-devices-message">
          <p>No M66 devices connected. Waiting for GPS data...</p>
          <div className="loading-spinner"></div>
          <p style={{fontSize: '12px', marginTop: '10px'}}>Make sure your AIS-140 system is running on port 5025</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
                <th style={{ width: '40px' }}>#</th>
                <th>Device Name</th>
                <th>Vehicle Reg</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>Speed(Km/H)</th>
                <th>Location</th>
                <th>IMEI</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(devices).map(([imei, device], idx) => {
                const coords = getCoordinatesFromDevice(device);
                const isActive = device.is_active || (device.last_seen && (new Date() - new Date(device.last_seen)) < 3600000);
                return (
                  <tr key={imei} className={selectedDeviceId === imei ? 'selected-row' : ''} onClick={() => handleRowClick(imei)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={!!selectedVehicles[imei]} onChange={() => handleVehicleSelect(imei)} />
                    </td>
                    <td>{idx + 1}</td>
                    <td>{device.device_name || 'M66-Device'}</td>
                    <td>{device.vehicle_registration || device.device_name || 'N/A'}</td>
                    <td>
                      <StatusIndicator status={isActive ? (device.speed > 0 ? "running" : "idle") : "stopped"} />
                      <span style={{ marginLeft: '8px' }}>{isActive ? (device.speed > 0 ? 'Running' : 'Idle') : 'Stopped'}</span>
                    </td>
                    <td>{device.last_seen ? new Date(device.last_seen).toLocaleString() : device.received_time ? new Date(device.received_time).toLocaleString() : 'N/A'}</td>
                    <td>{device.speed || 0}</td>
                    <td>{coords ? `${safeToFixed(coords.latitude)}, ${safeToFixed(coords.longitude)}` : 'No Valid GPS'}</td>
                    <td>{imei}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Vehicle Indicator Component
const VehicleIndicator = ({ devices }) => {
  const counts = {
    running: Object.values(devices).filter(d => {
      const isActive = d.is_active || (d.last_seen && (new Date() - new Date(d.last_seen)) < 3600000);
      return isActive && d.speed > 0;
    }).length,
    idle: Object.values(devices).filter(d => {
      const isActive = d.is_active || (d.last_seen && (new Date() - new Date(d.last_seen)) < 3600000);
      return isActive && d.speed === 0;
    }).length,
    stopped: Object.values(devices).filter(d => {
      const isActive = d.is_active || (d.last_seen && (new Date() - new Date(d.last_seen)) < 3600000);
      return !isActive;
    }).length,
    all: Object.keys(devices).length
  };

  const truckStyles = [
    { color: "#4caf50" }, // green - running
    { color: "#ffc107" }, // yellow - idle
    { color: "#f44336" }, // red - stopped
    { color: "#2196f3" }  // blue - all
  ];

  return (
    <div style={{ display: "flex", background: "#e8f2fd", height: 32, padding: "0 10px", width: "100%", borderBottom: "1px solid #dce7f4", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <span style={{ color: "#444", fontWeight: 500, marginRight: 2, fontSize: 13 }}>{counts.running}</span>
          <BsFillTruckFrontFill size={18} style={truckStyles[0]} />
          <span style={{ fontSize: 12, marginLeft: 2 }}>Running</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <span style={{ color: "#444", fontWeight: 500, marginRight: 2, fontSize: 13 }}>{counts.idle}</span>
          <BsFillTruckFrontFill size={18} style={truckStyles[1]} />
          <span style={{ fontSize: 12, marginLeft: 2 }}>Idle</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <span style={{ color: "#444", fontWeight: 500, marginRight: 2, fontSize: 13 }}>{counts.stopped}</span>
          <BsFillTruckFrontFill size={18} style={truckStyles[2]} />
          <span style={{ fontSize: 12, marginLeft: 2 }}>Stopped</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <span style={{ color: "#444", fontWeight: 500, marginRight: 2, fontSize: 13 }}>{counts.all}</span>
          <BsFillTruckFrontFill size={18} style={truckStyles[3]} />
          <span style={{ fontSize: 12, marginLeft: 2 }}>All Devices</span>
        </span>
      </div>
    </div>
  );
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
      <div style="width: ${size}px; height: ${size}px; position: relative; transform: rotate(${rotation}deg); transition: transform 0.5s ease-in-out;">
        <div style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          ${svgIcon}
        </div>
        ${isSelected ? `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${size * 0.8}px; height: ${size * 0.8}px; background-color: rgba(255,255,255,0.3); border-radius: 50%; animation: pulse 2s infinite; border: 2px solid rgba(255,255,255,0.5);"></div>
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

// Path Animation Marker Component for Real-Time Tracking
const PathAnimationMarker = ({ 
  positions, 
  color, 
  isSelected, 
  device, // Pass device data for speed and timing
  children, 
  onAnimationComplete
}) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const animationFrameRef = useRef(null);
  const animationStartTimeRef = useRef(0);
  const targetPositionRef = useRef(null);
  const targetHeadingRef = useRef(0);
  const startPositionRef = useRef(null);
  const startHeadingRef = useRef(0);
  const currentSegmentRef = useRef(0);
  const animationDurationRef = useRef(20000); // Default to 20-second polling interval
  const lastPositionsLengthRef = useRef(0);
  const progressRef = useRef(0); // Track animation progress for smooth transitions

  // Calculate heading between two points
  const calculateHeading = (fromLat, fromLng, toLat, toLng) => {
    const fromLatRad = fromLat * Math.PI / 180;
    const toLatRad = toLat * Math.PI / 180;
    const deltaLngRad = (toLng - fromLng) * Math.PI / 180;
    const y = Math.sin(deltaLngRad) * Math.cos(toLatRad);
    const x = Math.cos(fromLatRad) * Math.sin(toLatRad) - 
             Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(deltaLngRad);
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    heading = (heading + 360) % 360;
    return heading;
  };

  // Initialize with first position
  useEffect(() => {
    if (positions && positions.length > 0 && !currentPosition) {
      setCurrentPosition(positions[0]);
      startPositionRef.current = positions[0];
      if (positions.length > 1) {
        const heading = calculateHeading(
          positions[0][0], positions[0][1],
          positions[1][0], positions[1][1]
        );
        setCurrentHeading(heading);
        startHeadingRef.current = heading;
      }
      lastPositionsLengthRef.current = positions.length;
      console.log('🚀 Initialized marker at:', positions[0]);
    }
  }, [positions, currentPosition]);

  // Start animation function
  const startAnimation = useCallback(() => {
    if (positions.length < 2 || currentSegmentRef.current >= positions.length - 1) {
      setIsAnimating(false);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
      console.log('⏹️ Animation stopped: insufficient points or at end of path');
      return;
    }

    const startIndex = currentSegmentRef.current;
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

    // Calculate animation duration based on device speed
    const speedKmh = device.speed ? parseFloat(device.speed) : 0;
    const speedMs = speedKmh * 1000 / 3600; // Convert km/h to m/s
    const distanceM = calculateDistance(
      positions[startIndex][0], positions[startIndex][1],
      positions[endIndex][0], positions[endIndex][1]
    );

    if (speedMs > 0) {
      // Duration = distance (m) / speed (m/s) * 1000 (to ms)
      animationDurationRef.current = Math.max(1000, Math.min(30000, (distanceM / speedMs) * 1000));
      console.log(`⏱️ Animation duration set to ${animationDurationRef.current}ms based on speed ${speedKmh} km/h and distance ${distanceM.toFixed(2)}m`);
    } else {
      // Fallback to default duration if speed is invalid or zero
      animationDurationRef.current = 20000; // 20 seconds
      console.log(`⚠️ Invalid or zero speed (${speedKmh} km/h), using default duration ${animationDurationRef.current}ms`);
    }
    
    setIsAnimating(true);
    console.log(`▶️ Starting animation from segment ${startIndex} to ${endIndex}`);
  }, [positions, currentHeading, device, onAnimationComplete]);

  // Handle position updates for smooth transitions
  useEffect(() => {
    if (positions && positions.length > 0) {
      const prevLength = lastPositionsLengthRef.current;
      const newLength = positions.length;
      lastPositionsLengthRef.current = newLength;

      if (newLength > prevLength && newLength >= 2) {
        // New point added
        if (currentSegmentRef.current >= newLength - 1) {
          // If at the end, reset to the new last segment
          currentSegmentRef.current = Math.max(0, newLength - 2);
          console.log(`🛠️ New point added, resetting to segment ${currentSegmentRef.current}`);
          setCurrentPosition(positions[currentSegmentRef.current]);
          if (positions.length > currentSegmentRef.current + 1) {
            const heading = calculateHeading(
              positions[currentSegmentRef.current][0],
              positions[currentSegmentRef.current][1],
              positions[currentSegmentRef.current + 1][0],
              positions[currentSegmentRef.current + 1][1]
            );
            setCurrentHeading(heading);
            startHeadingRef.current = heading;
          }
          setIsAnimating(false); // Trigger restart
        } else if (isAnimating && progressRef.current > 0) {
          // Carry over progress for smooth transition
          const remainingProgress = progressRef.current;
          console.log(`🔄 Carrying over ${remainingProgress * 100}% progress to segment ${currentSegmentRef.current}`);
          startPositionRef.current = positions[currentSegmentRef.current];
          targetPositionRef.current = positions[currentSegmentRef.current + 1];
          const segmentHeading = calculateHeading(
            positions[currentSegmentRef.current][0],
            positions[currentSegmentRef.current][1],
            positions[currentSegmentRef.current + 1][0],
            positions[currentSegmentRef.current + 1][1]
          );
          targetHeadingRef.current = segmentHeading;
          startHeadingRef.current = currentHeading;
          animationStartTimeRef.current = Date.now() - (remainingProgress * animationDurationRef.current);
        }
      } else if (newLength < prevLength) {
        // Handle array shrinkage
        currentSegmentRef.current = Math.min(currentSegmentRef.current, Math.max(0, newLength - 2));
        setCurrentPosition(positions[currentSegmentRef.current] || positions[0]);
        setIsAnimating(false);
        console.log(`🔙 Array shortened, reset to segment ${currentSegmentRef.current}`);
      } else if (newLength === 2) {
        // Handle two points case
        currentSegmentRef.current = 0; // Animate from p0 to p1
        setCurrentPosition(positions[0]);
        if (positions.length > 1) {
          const heading = calculateHeading(
            positions[0][0], positions[0][1],
            positions[1][0], positions[1][1]
          );
          setCurrentHeading(heading);
          startHeadingRef.current = heading;
        }
        setIsAnimating(false); // Trigger restart
        console.log('🛠️ Only two points, setting segment to 0');
      } else if (newLength === 1) {
        // Single point case
        currentSegmentRef.current = 0;
        setCurrentPosition(positions[0]);
        setIsAnimating(false);
        console.log('🛠️ Only one point, no animation');
      }
    }
  }, [positions, currentHeading]);

  // Start animation when positions change
  useEffect(() => {
    if (positions && positions.length > 1 && currentPosition && !isAnimating) {
      startAnimation();
    }
  }, [positions, currentPosition, isAnimating, startAnimation]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - animationStartTimeRef.current;
      const progress = Math.min(elapsed / animationDurationRef.current, 1);
      progressRef.current = progress; // Store progress for transitions

      if (progress < 1) {
        const easeProgress = easeLinear(progress); // Use linear easing
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
        currentSegmentRef.current = Math.min(currentSegmentRef.current + 1, positions.length - 2); // Move to next segment
        progressRef.current = 0; // Reset progress
        setIsAnimating(false);
        startAnimation();
        console.log(`🏁 Completed segment, moving to ${currentSegmentRef.current}`);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, startAnimation, positions]);

  // Linear easing function for constant speed
  const easeLinear = (t) => t;

  if (!currentPosition) {
    return null;
  }

  return (
    <Marker position={currentPosition} icon={createVehicleIcon(color, currentHeading, isSelected)}>
      {children}
    </Marker>
  );
};

// Map Features Panel Component
const MapFeaturesPanel = ({ 
  showClusters, setShowClusters, showHeatmap, setShowHeatmap, showPaths, setShowPaths, onClose
}) => {
  return (
    <div className="map-features-panel">
      <div className="panel-header">
        <h3>Map Features</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        <div className="feature-option">
          <input type="checkbox" id="show-clusters" checked={showClusters} onChange={() => setShowClusters(!showClusters)} />
          <label htmlFor="show-clusters"><MdLayers /> Show Clusters</label>
        </div>
        <div className="feature-option">
          <input type="checkbox" id="show-heatmap" checked={showHeatmap} onChange={() => setShowHeatmap(!showHeatmap)} />
          <label htmlFor="show-heatmap"><MdWhatshot /> Show Heatmap</label>
        </div>
        <div className="feature-option">
          <input type="checkbox" id="show-paths" checked={showPaths} onChange={() => setShowPaths(!showPaths)} />
          <label htmlFor="show-paths"><MdTimeline /> Show Historical Paths</label>
        </div>
        <div className="feature-info">
          <p><strong>AIS-140 Features:</strong> Real-time GPS tracking with speed-based animated marker and tooltip.</p>
        </div>
      </div>
    </div>
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
    <div className={`resizable-divider ${isDragging ? 'dragging' : ''}`} onMouseDown={handleMouseDown}>
      <div className="divider-line"></div>
    </div>
  );
};

// Main MapView Component
function MapView() {
  const [mapType, setMapType] = useState('map');
  const [center, setCenter] = useState([25.621209, 85.170179]); // Default to India (Bihar)
  const [cursorPosition, setCursorPosition] = useState([25.621209, 85.170179]);
  const [devicesData, setDevicesData] = useState({});
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeData, setRealtimeData] = useState({});
  const [deviceTracks, setDeviceTracks] = useState({}); // Historical tracks
  const [realtimeTracks, setRealtimeTracks] = useState({}); // Live tracks
  const [firstValidDevice, setFirstValidDevice] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [smoothCenter, setSmoothCenter] = useState(center);

  const prevSelectedDeviceIdRef = useRef(null);
  const prevPositionRef = useRef(null);
  const positionUpdateTimeoutRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const initialPositionSetRef = useRef(false);
  const animationFrameRef = useRef(null);
  const lastDataUpdateRef = useRef({});

  // State for map features
  const [showMapFeaturesPanel, setShowMapFeaturesPanel] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPaths, setShowPaths] = useState(false);

  // State for sidebar width
  const [sidebarWidth, setSidebarWidth] = useState(30);

  const mapRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Map tile URLs
  const mapLayers = {
    map: "http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}",
    satellite: "http://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}"
  };

  // Smooth center animation
  useEffect(() => {
    const animate = () => {
      setSmoothCenter(prev => {
        const latDiff = center[0] - prev[0];
        const lngDiff = center[1] - prev[1];
        if (Math.abs(latDiff) < 0.00001 && Math.abs(lngDiff) < 0.00001) {
          return center;
        }
        return [prev[0] + latDiff * 0.1, prev[1] + lngDiff * 0.1];
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [center]);

  // Check API connectivity
  const checkApiConnectivity = async () => {
    try {
      console.log(`🔍 Checking API connectivity: ${API_BASE_URL}/api/health`);
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response.ok) {
        console.log('✅ API health check successful');
        setApiStatus('connected');
        return true;
      } else {
        setApiStatus('error');
        console.error('❌ API health check failed:', response.status);
        return false;
      }
    } catch (err) {
      setApiStatus('error');
      console.error('❌ API connectivity check failed:', err);
      return false;
    }
  };

  // Fetch devices
  const fetchDevices = async () => {
    try {
      setLoading(true);
      console.log(`📱 Fetching devices from: ${API_BASE_URL}/api/devices`);
      const response = await fetch(`${API_BASE_URL}/api/devices`);
      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ Devices API response:', data);
      if (data.success) {
        const devicesObject = {};
        if (data.data && data.data.devices && Array.isArray(data.data.devices)) {
          data.data.devices.forEach(device => {
            devicesObject[device.imei] = device;
          });
          setDevicesData(devicesObject);
          setError(null);
          setApiStatus('connected');
          console.log(`📱 Processed ${Object.keys(devicesObject).length} devices`);
          const firstValid = data.data.devices.find(device => getCoordinatesFromDevice(device) !== null);
          if (firstValid) {
            const coords = getCoordinatesFromDevice(firstValid);
            setFirstValidDevice(coords);
            console.log('🎯 First valid device found:', coords);
          } else {
            console.warn('⚠️ No devices with valid coordinates found');
          }
        } else {
          console.warn('❌ Invalid devices data structure:', data);
          setDevicesData({});
        }
      } else {
        throw new Error(data.error?.message || 'Unknown error');
      }
    } catch (err) {
      console.error('❌ Error fetching devices:', err);
      setError(err.message);
      setApiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch full device data (historical tracks)
  const fetchFullDeviceData = async (imei) => {
    try {
      console.log(`📊 Fetching full device data for: ${imei}`);
      const response = await fetch(`${API_BASE_URL}/api/devices/${imei}/full`);
      if (!response.ok) {
        throw new Error(`Failed to fetch full device data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log(`✅ Full device data for ${imei}:`, data);
      if (data.success) {
        setDevicesData(prev => ({
          ...prev,
          [imei]: {
            ...prev[imei],
            ...data.data.device,
            last_location: data.data.last_location,
            alerts: data.data.alerts,
            logins: data.data.logins,
            counts: data.data.counts
          }
        }));
        if (data.data.track && data.data.track.length > 0) {
          const rawTrack = data.data.track
            .filter(loc => getCoordinatesFromDevice({ latitude: loc.latitude, longitude: loc.longitude, raw_packet: loc.raw_packet }) !== null)
            .map(loc => {
              const coords = getCoordinatesFromDevice({ latitude: loc.latitude, longitude: loc.longitude, raw_packet: loc.raw_packet });
              return [coords.latitude, coords.longitude];
            });
          if (rawTrack.length === 0) {
            throw new Error('No valid track points found');
          }
          const smoothedTrack = smoothPath(rawTrack, 3);
          setDeviceTracks(prev => ({
            ...prev,
            [imei]: smoothedTrack
          }));
          console.log(`🛣️ Smoothed historical track: ${smoothedTrack.length} points (from ${rawTrack.length} raw)`);
        }
      } else {
        throw new Error(data.error?.message || 'Unknown error');
      }
    } catch (err) {
      console.error(`❌ Error fetching full data for ${imei}:`, err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    checkApiConnectivity().then(isConnected => {
      if (isConnected) {
        fetchDevices();
        fetchRealtimeLocations().then(realtimeObject => {
          setRealtimeData(realtimeObject);
          setApiStatus('connected');
        });
        pollingIntervalRef.current = setInterval(() => {
          fetchRealtimeLocations().then(realtimeObject => {
            setRealtimeData(realtimeObject);
          });
        }, 20000); // 20 seconds
      } else {
        setLoading(false);
        setError('Failed to connect to AIS-140 API. Please check if the API server is running.');
      }
    });
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Update map center for first valid device
  useEffect(() => {
    if (firstValidDevice && !initialPositionSetRef.current && mapRef.current) {
      setCenter([firstValidDevice.latitude, firstValidDevice.longitude]);
      mapRef.current.setView([firstValidDevice.latitude, firstValidDevice.longitude], zoomLevel);
      initialPositionSetRef.current = true;
      console.log('🎯 Map centered on first valid device:', firstValidDevice);
    }
  }, [firstValidDevice, zoomLevel]);

  // Fetch historical track when device is selected and showPaths is true
  useEffect(() => {
    if (selectedDeviceId && showPaths) {
      fetchFullDeviceData(selectedDeviceId);
    }
  }, [selectedDeviceId, showPaths]);

  // Merge realtime data and update tracks
  useEffect(() => {
    setDevicesData(prev => {
      const updated = { ...prev };
      setRealtimeTracks(prevTracks => {
        const updatedTracks = { ...prevTracks };
        Object.keys(realtimeData).forEach(imei => {
          const device = realtimeData[imei];
          const coords = getCoordinatesFromDevice(device);
          if (coords) {
            const lastUpdate = lastDataUpdateRef.current[imei] || 0;
            const currentUpdate = device.last_seen || device.received_time || Date.now();
            if (!updated[imei] || lastUpdate < currentUpdate) {
              updated[imei] = {
                ...updated[imei],
                ...device,
                latitude: coords.latitude,
                longitude: coords.longitude,
                speed: device.speed ? parseFloat(device.speed) : 0,
                heading: device.heading ? parseFloat(device.heading) : 0,
                last_update: currentUpdate
              };
              updatedTracks[imei] = updatedTracks[imei] || [];
              const newPoint = [coords.latitude, coords.longitude];
              updatedTracks[imei] = [...updatedTracks[imei], newPoint].slice(-10); // Limit to 10 points
              updatedTracks[imei] = smoothPath(updatedTracks[imei], 3);
              console.log(`🛣️ Updated realtime track for ${imei}: ${updatedTracks[imei].length} points`);
              lastDataUpdateRef.current[imei] = currentUpdate;
            }
          }
        });
        return updatedTracks;
      });
      return updated;
    });
  }, [realtimeData]);

  // Format date and time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Handle device selection
  const handleDeviceSelect = (imei) => {
    setSelectedDeviceId(imei);
    prevSelectedDeviceIdRef.current = imei;
    initialPositionSetRef.current = false;
    if (positionUpdateTimeoutRef.current) {
      clearTimeout(positionUpdateTimeoutRef.current);
    }
    const device = devicesData[imei];
    if (device) {
      const coords = getCoordinatesFromDevice(device);
      if (coords && mapRef.current) {
        const { latitude, longitude } = coords;
        mapRef.current.flyTo([latitude, longitude], zoomLevel, { animate: true, duration: 1.0 });
        setCenter([latitude, longitude]);
        prevPositionRef.current = [latitude, longitude];
        lastUpdateTimeRef.current = Date.now();
        initialPositionSetRef.current = true;
        console.log('🎯 Map centered on selected device:', { imei, coords });
      } else {
        console.warn('❌ Invalid coordinates for selected device:', { imei, device: device.device_name });
      }
    }
  };

  // Handle sidebar resize
  const handleSidebarResize = (newWidth) => {
    setSidebarWidth(newWidth);
  };

  // Center map on animated marker position
  useEffect(() => {
    if (selectedDeviceId && devicesData[selectedDeviceId] && !isUserInteracting) {
      const device = devicesData[selectedDeviceId];
      const coords = getCoordinatesFromDevice(device);
      if (!coords) {
        console.warn('❌ Invalid coordinates for selected device:', { selectedDeviceId, deviceName: device.device_name });
        return;
      }
      const { latitude, longitude } = coords;
      const currentPosition = [latitude, longitude];
      const now = Date.now();
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
      if (prevSelectedDeviceIdRef.current !== selectedDeviceId) {
        const map = mapRef.current;
        if (map) {
          map.flyTo(currentPosition, zoomLevel, { animate: true, duration: 1.0 });
          setCenter(currentPosition);
          prevPositionRef.current = currentPosition;
          prevSelectedDeviceIdRef.current = selectedDeviceId;
          lastUpdateTimeRef.current = now;
          initialPositionSetRef.current = true;
          console.log('🎯 Map centered on new device selection:', { selectedDeviceId, coords });
        }
      }
    }
  }, [selectedDeviceId, devicesData, zoomLevel, isUserInteracting]);

  // Map events
  function MapEvents() {
    const map = useMap();
    mapRef.current = map;
    useMapEvents({
      moveend: (e) => {
        const center = e.target.getCenter();
        setCenter([center.lat, center.lng]);
        setCursorPosition([center.lat, center.lng]);
        setIsUserInteracting(false);
      },
      mousemove: (e) => {
        setCursorPosition([e.latlng.lat, e.latlng.lng]);
      },
      zoomend: (e) => {
        setZoomLevel(e.target.getZoom());
        setIsUserInteracting(false);
      },
      movestart: () => setIsUserInteracting(true),
      zoomstart: () => setIsUserInteracting(true)
    });
    return null;
  }

  return (
    <div className="map-view-container">
      <Helmet>
        <title>AIS-140 GPS Tracking Dashboard</title>
      </Helmet>
      <VehicleIndicator devices={devicesData} />
      <div className="main-content">
        <div className="sidebar" style={{ width: `${sidebarWidth}%` }}>
          <VehicleTable 
            devices={devicesData} 
            onDeviceSelect={handleDeviceSelect}
            selectedDeviceId={selectedDeviceId}
            loading={loading}
            error={error}
          />
        </div>
        <ResizableDivider onResize={handleSidebarResize} />
        <div className="map-container" style={{ width: `${100 - sidebarWidth}%` }}>
          <div className="map-controls-top">
            <button className={`control-btn ${showMapFeaturesPanel ? 'active' : ''}`} onClick={() => setShowMapFeaturesPanel(!showMapFeaturesPanel)} title="Map Features">
              <MdLayers />
            </button>
          </div>
          <div className="map-controls-bottom">
            <div className="map-type-controls">
              <button className={`map-type-btn ${mapType === 'map' ? 'active' : ''}`} onClick={() => setMapType('map')}>
                Map
              </button>
              <button className={`map-type-btn ${mapType === 'satellite' ? 'active' : ''}`} onClick={() => setMapType('satellite')}>
                Satellite
              </button>
            </div>
            <div className="connection-status">
              <StatusIndicator status={apiStatus} />
              <span style={{ marginLeft: '8px' }}>
                {apiStatus === 'connected' ? 'AIS-140 Connected' : apiStatus === 'checking' ? 'Checking...' : 'Connection Error'}
              </span>
            </div>
            <div className="cursor-info">
              <div>Lat: {cursorPosition[0].toFixed(6)}</div>
              <div>Lng: {cursorPosition[1].toFixed(6)}</div>
            </div>
          </div>
          <MapContainer
            center={smoothCenter}
            zoom={zoomLevel}
            className="map-view"
            attributionControl={false}
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
              console.log('🗺️ Map created successfully with center:', smoothCenter);
            }}
          >
            <TileLayer url={mapLayers[mapType]} maxZoom={20} subdomains={['mt0', 'mt1', 'mt2', 'mt3']} />
            <ScaleControl position="bottomleft" />
            {Object.entries(devicesData).map(([imei, device]) => {
              const coords = getCoordinatesFromDevice(device);
              if (!coords) return null;
              const currentPosition = [coords.latitude, coords.longitude];
              let heading = device.heading ? parseFloat(device.heading) : 0;
              if (!device.heading && realtimeTracks[imei] && realtimeTracks[imei].length >= 2) {
                const lastTwo = realtimeTracks[imei].slice(-2);
                heading = calculateHeading(lastTwo[0][0], lastTwo[0][1], lastTwo[1][0], lastTwo[1][1]);
              }
              return (
                <React.Fragment key={imei}>
                  {showPaths && deviceTracks[imei] && deviceTracks[imei].length > 1 && (
                    <Polyline 
                      positions={deviceTracks[imei]} 
                      color={selectedDeviceId === imei ? "#4CAF50" : "#81C784"} 
                      weight={selectedDeviceId === imei ? 5 : 3} 
                      opacity={selectedDeviceId === imei ? 0.9 : 0.7}
                      smoothFactor={1}
                      className={selectedDeviceId === imei ? "selected-path" : "vehicle-path"}
                    />
                  )}
                  {realtimeTracks[imei] && realtimeTracks[imei].length > 1 && (
                    <Polyline 
                      positions={realtimeTracks[imei]} 
                      color={selectedDeviceId === imei ? "#2196F3" : "#64B5F6"} 
                      weight={selectedDeviceId === imei ? 5 : 3} 
                      opacity={selectedDeviceId === imei ? 0.9 : 0.7}
                      smoothFactor={1}
                      className={selectedDeviceId === imei ? "selected-path-trace" : "path-trace"}
                    />
                  )}
                  {selectedDeviceId === imei && realtimeTracks[imei] && realtimeTracks[imei].length > 0 ? (
                    <PathAnimationMarker
                      positions={realtimeTracks[imei]}
                      color="#2196F3"
                      isSelected={true}
                      device={device} // Pass device for speed and timing
                      onAnimationComplete={() => {
                        console.log('Path animation completed for device:', imei);
                      }}
                    >
                      <Tooltip permanent direction="top" offset={[0, -24]} opacity={0.9}>
                        {device.device_name || `M66-${imei.slice(-4)}`}
                      </Tooltip>
                      <Popup>
                        <div className="popup-content">
                          <h3>Device: {device.device_name || `M66-${imei.slice(-4)}`}</h3>
                          <p><strong>IMEI:</strong> {imei}</p>
                          <p><strong>Vehicle Reg:</strong> {device.vehicle_registration || 'N/A'}</p>
                          <p><strong>Location:</strong> {safeToFixed(coords.latitude)}, {safeToFixed(coords.longitude)}</p>
                          <p><strong>Speed:</strong> {device.speed ? `${device.speed} km/h` : 'N/A'}</p>
                          <p><strong>Heading:</strong> {heading ? `${heading.toFixed(1)}°` : 'N/A'}</p>
                          <p><strong>Altitude:</strong> {device.altitude ? `${device.altitude}m` : 'N/A'}</p>
                          <p><strong>Last Update:</strong> {formatDateTime(device.last_update || device.last_seen)}</p>
                          <p><strong>Battery:</strong> {device.battery_voltage ? `${device.battery_voltage}V` : 'N/A'}</p>
                          <p><strong>GSM Signal:</strong> {device.gsm_signal_strength || 0}</p>
                          <p><strong>Satellites:</strong> {device.satellites || 0}</p>
                          <p><strong>Network:</strong> {device.network_operator || 'N/A'}</p>
                          <hr/>
                          <p style={{fontSize: '11px'}}><strong>Raw Packet:</strong> {device.raw_packet ? device.raw_packet.substring(0, 80) + '...' : 'N/A'}</p>
                        </div>
                      </Popup>
                    </PathAnimationMarker>
                  ) : (
                    <Marker
                      position={currentPosition}
                      icon={createVehicleIcon(
                        selectedDeviceId === imei ? "#2196F3" : "#3388ff",
                        heading,
                        selectedDeviceId === imei
                      )}
                    >
                      <Tooltip permanent direction="top" offset={[0, -24]} opacity={0.9}>
                        {device.device_name || `M66-${imei.slice(-4)}`}
                      </Tooltip>
                      <Popup>
                        <div className="popup-content">
                          <h3>Device: {device.device_name || `M66-${imei.slice(-4)}`}</h3>
                          <p><strong>IMEI:</strong> {imei}</p>
                          <p><strong>Vehicle Reg:</strong> {device.vehicle_registration || 'N/A'}</p>
                          <p><strong>Location:</strong> {safeToFixed(coords.latitude)}, {safeToFixed(coords.longitude)}</p>
                          <p><strong>Speed:</strong> {device.speed ? `${device.speed} km/h` : 'N/A'}</p>
                          <p><strong>Heading:</strong> {heading ? `${heading.toFixed(1)}°` : 'N/A'}</p>
                          <p><strong>Altitude:</strong> {device.altitude ? `${device.altitude}m` : 'N/A'}</p>
                          <p><strong>Last Update:</strong> {formatDateTime(device.last_update || device.last_seen)}</p>
                          <p><strong>Battery:</strong> {device.battery_voltage ? `${device.battery_voltage}V` : 'N/A'}</p>
                          <p><strong>GSM Signal:</strong> {device.gsm_signal_strength || 0}</p>
                          <p><strong>Satellites:</strong> {device.satellites || 0}</p>
                          <p><strong>Network:</strong> {device.network_operator || 'N/A'}</p>
                          <hr/>
                          <p style={{fontSize: '11px'}}><strong>Raw Packet:</strong> {device.raw_packet ? device.raw_packet.substring(0, 80) + '...' : 'N/A'}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </React.Fragment>
              );
            })}
            <MapEvents />
          </MapContainer>
        </div>
      </div>
      {showMapFeaturesPanel && (
        <MapFeaturesPanel 
          showClusters={showClusters}
          setShowClusters={setShowClusters}
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
          showPaths={showPaths}
          setShowPaths={setShowPaths}
          onClose={() => setShowMapFeaturesPanel(false)}
        />
      )}
    </div>
  );
}

export default MapView;