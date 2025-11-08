import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Popup, ScaleControl, useMap, useMapEvents, Polyline, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { BsFillTruckFrontFill } from "react-icons/bs";
import { Helmet } from "react-helmet";
import { MdLayers, MdWhatshot, MdTimeline, MdCenterFocusStrong, MdInfo, MdZoomIn, MdZoomOut } from "react-icons/md";

// Import Leaflet CSS for proper rendering
import 'leaflet/dist/leaflet.css';
import './mapview.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://3.109.186.142:3000';
const GOOGLE_MAPS_API_KEY = 'AIzaSyB7GMusWIecrMygztw8BEGbc4zKhBru8N8';

console.log('🌐 MapView using API:', API_BASE_URL);
console.log('🗺️ Using Google Maps API Key:', GOOGLE_MAPS_API_KEY);

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

// Snap coordinates to roads using Google Roads API
const snapToRoads = async (coordinates) => {
  if (!coordinates || coordinates.length < 2) return coordinates;
  
  try {
    // Format coordinates for the API
    const path = coordinates.map(coord => `${coord.lat || coord[0]},${coord.lng || coord[1]}`).join('|');
    
    console.log('🛣️ Snapping coordinates to roads...');
    const response = await fetch(
      `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Roads API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Roads API response:', data);
    
    if (data.snappedPoints && data.snappedPoints.length > 0) {
      const snappedCoordinates = data.snappedPoints.map(point => [
        point.location.latitude,
        point.location.longitude
      ]);
      console.log(`🛣️ Successfully snapped ${coordinates.length} points to ${snappedCoordinates.length} road points`);
      return snappedCoordinates;
    }
    
    return coordinates;
  } catch (error) {
    console.error('❌ Error snapping to roads:', error);
    return coordinates;
  }
};

// Batch process coordinates for road snapping
const batchSnapToRoads = async (coordinates, batchSize = 100) => {
  if (!coordinates || coordinates.length < 2) return coordinates;
  
  const snappedCoordinates = [];
  
  for (let i = 0; i < coordinates.length; i += batchSize) {
    const batch = coordinates.slice(i, i + batchSize);
    const snappedBatch = await snapToRoads(batch);
    snappedCoordinates.push(...snappedBatch);
    
    // Add delay to avoid rate limiting
    if (i + batchSize < coordinates.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return snappedCoordinates;
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
      if (parts[i].includes('.') && i + 1 < parts.length && parts[i + 1] === 'N') {
        latitude = parseFloat(parts[i]);
      }
      if (parts[i].includes('.') && i + 1 < parts.length && parts[i + 1] === 'E') {
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
  // Check if inputs are valid numbers
  if (fromLat === null || fromLat === undefined || fromLng === null || fromLng === undefined ||
      toLat === null || toLat === undefined || toLng === null || toLng === undefined ||
      isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
    return 0;
  }
  
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

// Calculate distance between two points in meters
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Check if inputs are valid numbers
  if (lat1 === null || lat1 === undefined || lng1 === null || lng1 === undefined ||
      lat2 === null || lat2 === undefined || lng2 === null || lng2 === undefined ||
      isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    return 0;
  }
  
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate bounds for a set of coordinates
const calculateBounds = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  let minLat = coordinates[0][0];
  let maxLat = coordinates[0][0];
  let minLng = coordinates[0][1];
  let maxLng = coordinates[0][1];
  
  coordinates.forEach(coord => {
    if (coord[0] < minLat) minLat = coord[0];
    if (coord[0] > maxLat) maxLat = coord[0];
    if (coord[1] < minLng) minLng = coord[1];
    if (coord[1] > maxLng) maxLng = coord[1];
  });
  
  return [[minLat, minLng], [maxLat, maxLng]];
};

// Calculate optimal zoom level based on speed and context
const calculateOptimalZoom = (device, showPaths, pathLength = 0) => {
  const speed = device.speed ? parseFloat(device.speed) : 0;
  
  // Base zoom levels
  let baseZoom = 16; // Default zoom for city-level view
  
  // Adjust zoom based on speed
  if (speed > 80) {
    baseZoom = 12; // Highway level for high speed
  } else if (speed > 50) {
    baseZoom = 14; // Major roads for medium speed
  } else if (speed > 20) {
    baseZoom = 15; // City streets for low speed
  } else if (speed === 0) {
    baseZoom = 17; // Street level for stationary
  }
  
  // Adjust zoom if showing paths
  if (showPaths && pathLength > 0) {
    // Zoom out to show more of the path
    if (pathLength > 20) {
      baseZoom = Math.max(10, baseZoom - 3); // Show long paths
    } else if (pathLength > 10) {
      baseZoom = Math.max(12, baseZoom - 2); // Show medium paths
    } else if (pathLength > 5) {
      baseZoom = Math.max(13, baseZoom - 1); // Show short paths
    }
  }
  
  // Constrain zoom to reasonable bounds
  return Math.max(10, Math.min(18, baseZoom));
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

// Calculate the center point of multiple coordinates
const calculateCenterPoint = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  let sumLat = 0, sumLng = 0;
  let validCount = 0;
  
  coordinates.forEach(coord => {
    if (coord && coord.latitude && coord.longitude) {
      sumLat += parseFloat(coord.latitude);
      sumLng += parseFloat(coord.longitude);
      validCount++;
    }
  });
  
  if (validCount === 0) return null;
  
  return {
    latitude: sumLat / validCount,
    longitude: sumLng / validCount
  };
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
    onDeviceSelect(imei, true); // Pass true to indicate table click for 50ft zoom
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
      <div class="vehicle-icon-container" style="width: ${size}px; height: ${size}px; position: relative; cursor: pointer;">
        <div class="vehicle-icon-rotation" style="width: ${size}px; height: ${size}px; position: relative; transform: rotate(${rotation}deg);">
          <div class="vehicle-icon-body" style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            ${svgIcon}
          </div>
          ${isSelected ? `
          <div class="selection-pulse" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${size * 0.8}px; height: ${size * 0.8}px; background-color: rgba(255,255,255,0.3); border-radius: 50%; animation: pulse 2s infinite; border: 2px solid rgba(255,255,255,0.5);"></div>
          ` : ''}
        </div>
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
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Path Animation Marker Component for Real-Time Tracking
const PathAnimationMarker = ({
  positions,
  color,
  isSelected,
  device,
  children,
  onMarkerClick,
  onPositionChange
}) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pathIndex, setPathIndex] = useState(0);
  const [segmentProgress, setSegmentProgress] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastPositionRef = useRef(null);
  const animationStartIndexRef = useRef(0);
  const totalDistanceRef = useRef(0);
  const animationDurationRef = useRef(10000); // Default 10 seconds

  // Calculate distance between two points in meters
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    // Check if inputs are valid numbers
    if (lat1 === null || lat1 === undefined || lng1 === null || lng1 === undefined ||
        lat2 === null || lat2 === undefined || lng2 === null || lng2 === undefined ||
        isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      return 0;
    }
    
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate animation duration based on distance between points
  const calculateAnimationDuration = (startIndex, endIndex) => {
    // Check if positions is valid and has enough points
    if (!positions || positions.length < 2 || startIndex < 0 || endIndex >= positions.length || startIndex >= endIndex) {
      return 5000; // Default duration if we can't calculate
    }
    
    // Calculate the distance between the specified points
    const prevPoint = positions[startIndex];
    const currentPoint = positions[endIndex];
    
    // Check if the points are valid
    if (!prevPoint || !currentPoint || !Array.isArray(prevPoint) || !Array.isArray(currentPoint) || 
        prevPoint.length < 2 || currentPoint.length < 2) {
      return 5000; // Default duration if points are invalid
    }
    
    const distance = calculateDistance(
      prevPoint[0], prevPoint[1],
      currentPoint[0], currentPoint[1]
    );
    
    // Calculate speed based on distance:
    // - For short distances (< 50m): slower animation (8 seconds)
    // - For medium distances (50-200m): normal animation (5 seconds)
    // - For long distances (> 200m): faster animation (2 seconds)
    let duration;
    if (distance < 50) {
      duration = 8000; // 8 seconds for short distances
    } else if (distance < 200) {
      duration = 5000; // 5 seconds for medium distances
    } else {
      duration = 2000; // 2 seconds for long distances
    }
    
    // Apply device speed factor if available
    const deviceSpeed = device.speed ? parseFloat(device.speed) : 50; // km/h
    const speedFactor = deviceSpeed / 50; // Normalize to 50 km/h baseline
    
    // Adjust duration based on speed - faster device = shorter duration
    duration = duration / speedFactor;
    
    // Ensure duration is within reasonable bounds
    duration = Math.max(1000, Math.min(10000, duration));
    
    totalDistanceRef.current = distance;
    animationDurationRef.current = duration;
    
    console.log(`📏 Distance: ${distance.toFixed(2)}m, Device Speed: ${deviceSpeed}km/h, Duration: ${(duration/1000).toFixed(2)}s`);
    
    return duration;
  };

  // Update marker to latest position
  useEffect(() => {
    if (positions && positions.length > 0) {
      const latestPosition = positions[positions.length - 1];
      
      // Check if latest position is valid
      if (!latestPosition || !Array.isArray(latestPosition) || latestPosition.length < 2) {
        console.warn('⚠️ Invalid latest position:', latestPosition);
        return;
      }
      
      // If this is the first position, set it directly
      if (!currentPosition) {
        setCurrentPosition(latestPosition);
        setPathIndex(positions.length - 1);
        setSegmentProgress(1);
        animationStartIndexRef.current = positions.length - 1;
        
        // Calculate heading based on the last two points, if available
        if (positions.length >= 2) {
          const prevPosition = positions[positions.length - 2];
          // Check if prev position is valid
          if (prevPosition && Array.isArray(prevPosition) && prevPosition.length >= 2) {
            const heading = calculateHeading(
              prevPosition[0],
              prevPosition[1],
              latestPosition[0],
              latestPosition[1]
            );
            setCurrentHeading(heading);
            console.log(`🧭 Initial heading set to ${heading.toFixed(1)}°`);
          }
        } else if (device.heading) {
          setCurrentHeading(parseFloat(device.heading));
          console.log(`🧭 Using device heading: ${device.heading}°`);
        }
      } else if (lastPositionRef.current && 
                (lastPositionRef.current[0] !== latestPosition[0] || 
                 lastPositionRef.current[1] !== latestPosition[1])) {
        // New position received, calculate animation duration based on distance
        const startIndex = Math.max(0, positions.length - 2);
        const endIndex = positions.length - 1;
        
        // Calculate animation duration based on distance between points
        const duration = calculateAnimationDuration(startIndex, endIndex);
        
        setIsAnimating(true);
        setSegmentProgress(0);
        setPathIndex(startIndex);
        animationStartIndexRef.current = startIndex;
        startTimeRef.current = Date.now();
        lastPositionRef.current = latestPosition;
        
        // Calculate heading for the new direction
        if (positions.length >= 2) {
          const prevPosition = positions[positions.length - 2];
          // Check if prev position is valid
          if (prevPosition && Array.isArray(prevPosition) && prevPosition.length >= 2) {
            const heading = calculateHeading(
              prevPosition[0],
              prevPosition[1],
              latestPosition[0],
              latestPosition[1]
            );
            setCurrentHeading(heading);
            console.log(`🧭 New heading set to ${heading.toFixed(1)}°`);
          }
        }
      }
      
      lastPositionRef.current = latestPosition;
    }
  }, [positions, device, currentPosition]);

  // Animation loop
  useEffect(() => {
    if (isAnimating && positions && positions.length > 1) {
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const totalProgress = Math.min(elapsed / animationDurationRef.current, 1);
        
        // Calculate which segment we're on and the progress within that segment
        const startIndex = animationStartIndexRef.current;
        const availableSegments = positions.length - 1 - startIndex;
        const currentSegmentFloat = startIndex + (totalProgress * availableSegments);
        const currentSegmentIndex = Math.floor(currentSegmentFloat);
        const progressInSegment = currentSegmentFloat - currentSegmentIndex;
        
        setPathIndex(currentSegmentIndex);
        setSegmentProgress(progressInSegment);
        
        // If we've reached the end, stop animating
        if (currentSegmentIndex >= positions.length - 1) {
          setCurrentPosition(positions[positions.length - 1]);
          setIsAnimating(false);
          console.log(`✅ Animation completed in ${((Date.now() - startTimeRef.current) / 1000).toFixed(2)}s`);
          return;
        }
        
        // Get the current segment start and end points
        const segmentStart = positions[currentSegmentIndex];
        const segmentEnd = positions[currentSegmentIndex + 1];
        
        // Check if segment points are valid
        if (!segmentStart || !segmentEnd || !Array.isArray(segmentStart) || !Array.isArray(segmentEnd) ||
            segmentStart.length < 2 || segmentEnd.length < 2) {
          console.warn('⚠️ Invalid segment points:', { segmentStart, segmentEnd });
          setIsAnimating(false);
          return;
        }
        
        // Linear interpolation within the current segment
        const lat = segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * progressInSegment;
        const lng = segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * progressInSegment;
        
        const newPosition = [lat, lng];
        setCurrentPosition(newPosition);
        
        // Emit position change to parent component
        if (onPositionChange) {
          onPositionChange(newPosition);
        }
        
        // Calculate heading based on the current segment
        const heading = calculateHeading(
          segmentStart[0],
          segmentStart[1],
          segmentEnd[0],
          segmentEnd[1]
        );
        setCurrentHeading(heading);
        
        if (totalProgress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isAnimating, positions, onPositionChange]);

  if (!currentPosition) {
    return null;
  }

  return (
    <Marker
      position={currentPosition}
      icon={createVehicleIcon(color, currentHeading, isSelected)}
      eventHandlers={{
        click: () => {
          if (onMarkerClick) {
            onMarkerClick(device);
          }
        }
      }}
    >
      {children}
    </Marker>
  );
};

// Map Features Panel Component
const MapFeaturesPanel = ({
  showClusters, setShowClusters, showHeatmap, setShowHeatmap, showPaths, setShowPaths, showRealtimePath, setShowRealtimePath, showRoadSnapping, setShowRoadSnapping, autoCenter, setAutoCenter, autoZoom, setAutoZoom, onClose
}) => {
  return (
    <div className="map-features-panel">
      <div className="panel-header">
        <h3>Map Features</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        <div className="feature-option">
          <input type="checkbox" id="auto-center" checked={autoCenter} onChange={() => setAutoCenter(!autoCenter)} />
          <label htmlFor="auto-center"><MdCenterFocusStrong /> Auto Center on Selected Vehicle</label>
        </div>
        <div className="feature-option">
          <input type="checkbox" id="auto-zoom" checked={autoZoom} onChange={() => setAutoZoom(!autoZoom)} />
          <label htmlFor="auto-zoom"><MdZoomIn /> Auto Zoom Based on Speed & Context</label>
        </div>
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
        <div className="feature-option">
          <input type="checkbox" id="show-realtime-path" checked={showRealtimePath} onChange={() => setShowRealtimePath(!showRealtimePath)} />
          <label htmlFor="show-realtime-path"><MdTimeline /> Show Realtime Path (Blue)</label>
        </div>
        <div className="feature-option">
          <input type="checkbox" id="show-road-snapping" checked={showRoadSnapping} onChange={() => setShowRoadSnapping(!showRoadSnapping)} />
          <label htmlFor="show-road-snapping"><MdTimeline /> Enable Road Snapping</label>
        </div>
        <div className="feature-info">
          <p><strong>AIS-140 Features:</strong> Real-time GPS tracking with distance-based animated marker.</p>
          <p><strong>Auto Center:</strong> Automatically centers the map on the selected vehicle and keeps it in view as it moves.</p>
          <p><strong>Auto Zoom:</strong> Intelligently adjusts zoom level based on vehicle speed and path length.</p>
          <p><strong>50ft Zoom:</strong> Click on any device in the table to zoom to a 50-foot detailed view.</p>
          <p><strong>Zoom Levels:</strong> Highway (80+ km/h), City (20-50 km/h), Street (&lt;20 km/h), Detailed (stationary).</p>
          <p><strong>Marker Details:</strong> Click on any vehicle marker to view detailed information about that vehicle.</p>
          <p><strong>Road Snapping:</strong> Automatically adjusts GPS coordinates to align with actual road network.</p>
          <p><strong>Smart Speed:</strong> Marker speed adjusts based on distance between GPS points - faster for long distances, slower for short distances.</p>
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
  const [mapType, setMapType] = useState('roadmap');
  const [center, setCenter] = useState([25.621209, 85.170179]); // Default to India (Bihar)
  const [cursorPosition, setCursorPosition] = useState([25.621209, 85.170179]);
  const [devicesData, setDevicesData] = useState({});
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [clickedMarkerDevice, setClickedMarkerDevice] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeData, setRealtimeData] = useState({});
  const [deviceTracks, setDeviceTracks] = useState({}); // Historical tracks
  const [realtimeTracks, setRealtimeTracks] = useState({}); // Live tracks
  const [snappedTracks, setSnappedTracks] = useState({}); // Road-snapped tracks
  const [firstValidDevice, setFirstValidDevice] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [smoothCenter, setSmoothCenter] = useState(center);
  const [roadSnappingInProgress, setRoadSnappingInProgress] = useState({});
  const [selectedMarkerPosition, setSelectedMarkerPosition] = useState(null);
  const [lastCenteredPosition, setLastCenteredPosition] = useState(null); // Track last centered position

  const prevSelectedDeviceIdRef = useRef(null);
  const prevPositionRef = useRef(null);
  const positionUpdateTimeoutRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const initialPositionSetRef = useRef(false);
  const animationFrameRef = useRef(null);
  const lastDataUpdateRef = useRef({});
  const centeringTimeoutRef = useRef(null);

  // State for map features
  const [showMapFeaturesPanel, setShowMapFeaturesPanel] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [showRealtimePath, setShowRealtimePath] = useState(true); // Default to true for blue path
  const [showRoadSnapping, setShowRoadSnapping] = useState(true); // Default to true for road snapping
  const [autoCenter, setAutoCenter] = useState(true); // Default to true for auto-centering
  const [autoZoom, setAutoZoom] = useState(true); // Default to true for auto-zooming

  // State for sidebar width
  const [sidebarWidth, setSidebarWidth] = useState(30);

  const mapRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Map tile URLs with Google Maps API key
  const mapLayers = {
    roadmap: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
    satellite: `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
    hybrid: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
    terrain: `https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`
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

  // Unified centering function with auto-zoom
  const centerMapOnPosition = (position, device = null, pathPoints = [], animate = true, forceZoom = null) => {
    if (!mapRef.current || !position || !Array.isArray(position) || position.length < 2) {
      return;
    }
    
    // Check if we're already centered on this position (with some tolerance)
    if (lastCenteredPosition && !forceZoom) {
      const latDiff = Math.abs(position[0] - lastCenteredPosition[0]);
      const lngDiff = Math.abs(position[1] - lastCenteredPosition[1]);
      if (latDiff < 0.00001 && lngDiff < 0.00001) {
        return; // Already centered on this position
      }
    }
    
    // Clear any pending centering timeout
    if (centeringTimeoutRef.current) {
      clearTimeout(centeringTimeoutRef.current);
    }
    
    // Debounce the centering to avoid rapid repeated calls
    centeringTimeoutRef.current = setTimeout(() => {
      if (mapRef.current && !isUserInteracting) {
        let targetZoom = zoomLevel;
        
        // Use forced zoom if provided (for 50ft zoom from table click)
        if (forceZoom !== null) {
          targetZoom = forceZoom;
        } else if (autoZoom && device) {
          // Calculate optimal zoom if auto-zoom is enabled
          // Determine path length for zoom calculation
          const pathLength = pathPoints.length || 0;
          targetZoom = calculateOptimalZoom(device, showPaths || showRealtimePath, pathLength);
          
          // If we have path points, try to fit the entire path in view
          if (pathPoints.length > 1) {
            const bounds = calculateBounds(pathPoints);
            if (bounds) {
              mapRef.current.fitBounds(bounds, { 
                padding: [50, 50], 
                maxZoom: targetZoom,
                animate: animate,
                duration: animate ? 0.5 : 0
              });
              setCenter(position);
              setZoomLevel(targetZoom);
              setLastCenteredPosition(position);
              console.log('🎯 Map fitted to path bounds:', bounds, 'Zoom:', targetZoom);
              return;
            }
          }
        }
        
        // Standard centering with calculated zoom
        mapRef.current.setView(position, targetZoom, { animate, duration: animate ? 0.5 : 0 });
        setCenter(position);
        setZoomLevel(targetZoom);
        setLastCenteredPosition(position);
        console.log('🎯 Map centered on position:', position, 'Zoom:', targetZoom);
      }
    }, 100);
  };

  // Update map center when selected marker position changes (only for animated movement)
  useEffect(() => {
    if (selectedMarkerPosition && autoCenter && !isUserInteracting && selectedDeviceId) {
      const device = devicesData[selectedDeviceId];
      const pathPoints = realtimeTracks[selectedDeviceId] || [];
      centerMapOnPosition(selectedMarkerPosition, device, pathPoints);
    }
  }, [selectedMarkerPosition, autoCenter, isUserInteracting, selectedDeviceId, devicesData, realtimeTracks]);

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
          
          // Apply road snapping if enabled
          if (showRoadSnapping) {
            setRoadSnappingInProgress(prev => ({ ...prev, [imei]: true }));
            const snappedTrack = await batchSnapToRoads(smoothedTrack);
            setSnappedTracks(prev => ({
              ...prev,
              [imei]: snappedTrack
            }));
            setRoadSnappingInProgress(prev => ({ ...prev, [imei]: false }));
            console.log(`🛣️ Road-snapped track for ${imei}: ${snappedTrack.length} points`);
          }
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
        }, 5000); // Changed to 5 seconds (5000ms)
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

  // Calculate center point of all devices
  const calculateAllDevicesCenter = () => {
    const validCoordinates = Object.values(devicesData)
      .map(device => getCoordinatesFromDevice(device))
      .filter(coords => coords !== null);
    
    if (validCoordinates.length === 0) return null;
    
    const centerPoint = calculateCenterPoint(validCoordinates);
    return centerPoint ? [centerPoint.latitude, centerPoint.longitude] : null;
  };

  // Update map center for first valid device or all devices center (only on initial load)
  useEffect(() => {
    if (!initialPositionSetRef.current && mapRef.current) {
      let newCenter = null;
      
      if (firstValidDevice) {
        // If we have a first valid device, center on it
        newCenter = [firstValidDevice.latitude, firstValidDevice.longitude];
        console.log('🎯 Map centered on first valid device:', firstValidDevice);
      } else {
        // Otherwise, try to center on all devices
        newCenter = calculateAllDevicesCenter();
        if (newCenter) {
          console.log('🎯 Map centered on all devices center:', newCenter);
        }
      }
      
      if (newCenter) {
        centerMapOnPosition(newCenter, null, [], false);
        initialPositionSetRef.current = true;
      }
    }
  }, [firstValidDevice, devicesData]);

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
              
              // Apply road snapping to realtime track if enabled and we have enough points
              if (showRoadSnapping && updatedTracks[imei].length >= 2) {
                setRoadSnappingInProgress(prev => ({ ...prev, [imei]: true }));
                batchSnapToRoads(updatedTracks[imei]).then(snappedTrack => {
                  setSnappedTracks(prev => ({
                    ...prev,
                    [imei]: snappedTrack
                  }));
                  setRoadSnappingInProgress(prev => ({ ...prev, [imei]: false }));
                  console.log(`🛣️ Road-snapped realtime track for ${imei}: ${snappedTrack.length} points`);
                });
              }
              lastDataUpdateRef.current[imei] = currentUpdate;
            }
          }
        });
        return updatedTracks;
      });
      return updated;
    });
  }, [realtimeData, showRoadSnapping]);

  // Format date and time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Handle device selection
  const handleDeviceSelect = (imei, isTableClick = false) => {
    setSelectedDeviceId(imei);
    prevSelectedDeviceIdRef.current = imei;
    initialPositionSetRef.current = false;
    setLastCenteredPosition(null); // Reset last centered position when selecting new device
    
    if (positionUpdateTimeoutRef.current) {
      clearTimeout(positionUpdateTimeoutRef.current);
    }
    
    const device = devicesData[imei];
    if (device) {
      const coords = getCoordinatesFromDevice(device);
      if (coords) {
        const { latitude, longitude } = coords;
        const newPosition = [latitude, longitude];
        
        // Get path points for zoom calculation
        const pathPoints = realtimeTracks[imei] || [];
        
        // Force 50ft zoom (zoom level 18-19) if clicked from table
        const forceZoom = isTableClick ? 19 : null;
        
        // Center on the selected device immediately
        if (autoCenter || isTableClick) {
          centerMapOnPosition(newPosition, device, pathPoints, true, forceZoom);
        }
        
        prevPositionRef.current = newPosition;
        lastUpdateTimeRef.current = Date.now();
        initialPositionSetRef.current = true;
        console.log('🎯 Map centered on selected device:', { imei, coords, isTableClick, zoom: forceZoom || 'auto' });
      } else {
        console.warn('❌ Invalid coordinates for selected device:', { imei, device: device.device_name });
      }
    }
  };

  // Handle marker click
  const handleMarkerClick = (device) => {
    setClickedMarkerDevice(device);
    setSelectedDeviceId(device.imei);
    console.log('📍 Marker clicked:', device.device_name || device.imei);
  };

  // Handle sidebar resize
  const handleSidebarResize = (newWidth) => {
    setSidebarWidth(newWidth);
  };

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
            <button className={`control-btn ${autoCenter ? 'active' : ''}`} onClick={() => setAutoCenter(!autoCenter)} title="Auto Center on Selected Vehicle">
              <MdCenterFocusStrong />
            </button>
            <button className={`control-btn ${autoZoom ? 'active' : ''}`} onClick={() => setAutoZoom(!autoZoom)} title="Auto Zoom Based on Speed">
              <MdZoomIn />
            </button>
            <button className={`control-btn ${showMapFeaturesPanel ? 'active' : ''}`} onClick={() => setShowMapFeaturesPanel(!showMapFeaturesPanel)} title="Map Features">
              <MdLayers />
            </button>
          </div>
          <div className="map-controls-bottom">
            <div className="map-type-controls">
              <button className={`map-type-btn ${mapType === 'roadmap' ? 'active' : ''}`} onClick={() => setMapType('roadmap')}>
                Map
              </button>
              <button className={`map-type-btn ${mapType === 'satellite' ? 'active' : ''}`} onClick={() => setMapType('satellite')}>
                Satellite
              </button>
              <button className={`map-type-btn ${mapType === 'hybrid' ? 'active' : ''}`} onClick={() => setMapType('hybrid')}>
                Hybrid
              </button>
              <button className={`map-type-btn ${mapType === 'terrain' ? 'active' : ''}`} onClick={() => setMapType('terrain')}>
                Terrain
              </button>
            </div>
            <div className="connection-status">
              <StatusIndicator status={apiStatus} />
              <span style={{ marginLeft: '8px' }}>
                {apiStatus === 'connected' ? 'Device Connected' : apiStatus === 'checking' ? 'Checking...' : 'Connection Error'}
              </span>
            </div>
            <div className="cursor-info">
              <div>Lat: {cursorPosition[0].toFixed(6)}</div>
              <div>Lng: {cursorPosition[1].toFixed(6)}</div>
              <div>Zoom: {zoomLevel}</div>
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
            <TileLayer url={mapLayers[mapType]} maxZoom={20} />
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
              const isSelected = selectedDeviceId === imei;
              
              // Determine which track to use (snapped or original)
              const historicalTrack = showRoadSnapping && snappedTracks[imei] ? snappedTracks[imei] : deviceTracks[imei];
              const realtimeTrack = showRoadSnapping && snappedTracks[imei] ? snappedTracks[imei] : realtimeTracks[imei];
              
              return (
                <React.Fragment key={imei}>
                  {/* Historical path (green) */}
                  {showPaths && historicalTrack && historicalTrack.length > 1 && (
                    <Polyline
                      positions={historicalTrack}
                      color={isSelected ? "#4CAF50" : "#81C784"}
                      weight={isSelected ? 5 : 3}
                      opacity={isSelected ? 0.9 : 0.7}
                      smoothFactor={1}
                      className={isSelected ? "selected-path" : "vehicle-path"}
                    />
                  )}
                  {/* Realtime path (blue) - NEW */}
                  {showRealtimePath && realtimeTrack && realtimeTrack.length > 1 && (
                    <Polyline
                      positions={realtimeTrack}
                      color={isSelected ? "#1976D2" : "#2196F3"}
                      weight={isSelected ? 5 : 3}
                      opacity={isSelected ? 0.9 : 0.7}
                      smoothFactor={1}
                      className={isSelected ? "selected-realtime-path" : "realtime-path"}
                      dashArray="10, 5"
                    />
                  )}
                  {isSelected && realtimeTrack && realtimeTrack.length > 0 ? (
                    <PathAnimationMarker
                      positions={realtimeTrack}
                      color="#2196F3"
                      isSelected={true}
                      device={device}
                      onMarkerClick={handleMarkerClick}
                      onPositionChange={setSelectedMarkerPosition}
                    >
                      <Tooltip permanent direction="top" offset={[0, -24]} opacity={0.9}>
                        {device.device_name || `M66-${imei.slice(-4)}`}
                        {showRoadSnapping && roadSnappingInProgress[imei] && (
                          <span style={{ marginLeft: '5px', color: '#FF9800' }}>
                            🛣️ Snapping...
                          </span>
                        )}
                      </Tooltip>
                      <Popup>
                        <div className="popup-content">
                          <div className="popup-header">
                            <h3>{device.device_name || `M66-${imei.slice(-4)}`}</h3>
                            <button 
                              className="popup-close-btn" 
                              onClick={() => setClickedMarkerDevice(null)}
                            >
                              ×
                            </button>
                          </div>
                          <div className="popup-body">
                            <div className="popup-info-grid">
                              <div className="info-row">
                                <span className="info-label">IMEI:</span>
                                <span className="info-value">{imei}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Vehicle Registration:</span>
                                <span className="info-value">{device.vehicle_registration || 'N/A'}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Status:</span>
                                <span className="info-value">
                                  <StatusIndicator status={device.is_active ? (device.speed > 0 ? "running" : "idle") : "stopped"} />
                                  <span style={{ marginLeft: '8px' }}>
                                    {device.is_active ? (device.speed > 0 ? 'Running' : 'Idle') : 'Stopped'}
                                  </span>
                                </span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Location:</span>
                                <span className="info-value">{safeToFixed(coords.latitude)}, {safeToFixed(coords.longitude)}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Speed:</span>
                                <span className="info-value">{device.speed ? `${device.speed} km/h` : 'N/A'}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Last Updated:</span>
                                <span className="info-value">{formatDateTime(device.last_update || device.last_seen)}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Battery:</span>
                                <span className="info-value">{device.battery_voltage ? `${device.battery_voltage}V` : 'N/A'}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Network:</span>
                                <span className="info-value">{device.network_operator || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </PathAnimationMarker>
                  ) : (
                    // For non-selected devices, use a simpler marker that's positioned at the latest point
                    <Marker
                      position={realtimeTrack && realtimeTrack.length > 0 ? 
                        realtimeTrack[realtimeTrack.length - 1] : currentPosition}
                      icon={createVehicleIcon(
                        isSelected ? "#2196F3" : "#3388ff",
                        heading,
                        isSelected
                      )}
                      eventHandlers={{
                        click: () => {
                          handleMarkerClick(device);
                        }
                      }}
                    >
                      <Tooltip permanent direction="top" offset={[0, -24]} opacity={0.9}>
                        {device.device_name || `M66-${imei.slice(-4)}`}
                        {showRoadSnapping && roadSnappingInProgress[imei] && (
                          <span style={{ marginLeft: '5px', color: '#FF9800' }}>
                            🛣️
                          </span>
                        )}
                      </Tooltip>
                      <Popup>
                        <div className="popup-content">
                          <div className="popup-header">
                            <h3>{device.device_name || `M66-${imei.slice(-4)}`}</h3>
                            <button 
                              className="popup-close-btn" 
                              onClick={() => setClickedMarkerDevice(null)}
                            >
                              ×
                            </button>
                          </div>
                          <div className="popup-body">
                            <div className="popup-info-grid">
                              <div className="info-row">
                                <span className="info-label">IMEI:</span>
                                <span className="info-value">{imei}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Vehicle Registration:</span>
                                <span className="info-value">{device.vehicle_registration || 'N/A'}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Status:</span>
                                <span className="info-value">
                                  <StatusIndicator status={device.is_active ? (device.speed > 0 ? "running" : "idle") : "stopped"} />
                                  <span style={{ marginLeft: '8px' }}>
                                    {device.is_active ? (device.speed > 0 ? 'Running' : 'Idle') : 'Stopped'}
                                  </span>
                                </span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Location:</span>
                                <span className="info-value">{safeToFixed(coords.latitude)}, {safeToFixed(coords.longitude)}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Speed:</span>
                                <span className="info-value">{device.speed ? `${device.speed} km/h` : 'N/A'}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Last Updated:</span>
                                <span className="info-value">{formatDateTime(device.last_update || device.last_seen)}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Battery:</span>
                                <span className="info-value">{device.battery_voltage ? `${device.battery_voltage}V` : 'N/A'}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Network:</span>
                                <span className="info-value">{device.network_operator || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
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
          showHeatmap={setShowHeatmap}
          setShowHeatmap={setShowHeatmap}
          showPaths={setShowPaths}
          setShowPaths={setShowPaths}
          showRealtimePath={showRealtimePath}
          setShowRealtimePath={setShowRealtimePath}
          showRoadSnapping={setShowRoadSnapping}
          setShowRoadSnapping={setShowRoadSnapping}
          autoCenter={autoCenter}
          setAutoCenter={setAutoCenter}
          autoZoom={autoZoom}
          setAutoZoom={setAutoZoom}
          onClose={() => setShowMapFeaturesPanel(false)}
        />
      )}
    </div>
  );
}

export default MapView;