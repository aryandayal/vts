// stores/gpsStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { gpsAPI } from '../utils/api';

// API configuration
const GOOGLE_MAPS_API_KEY = process.env.MAP_API_KEY;

// Helper functions (unchanged)
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

const calculateHeading = (fromLat, fromLng, toLat, toLng) => {
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

const snapToRoads = async (coordinates) => {
  if (!coordinates || coordinates.length < 2) return coordinates;

  try {
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

const batchSnapToRoads = async (coordinates, batchSize = 100) => {
  if (!coordinates || coordinates.length < 2) return coordinates;

  const snappedCoordinates = [];

  for (let i = 0; i < coordinates.length; i += batchSize) {
    const batch = coordinates.slice(i, i + batchSize);
    const snappedBatch = await snapToRoads(batch);
    snappedCoordinates.push(...snappedBatch);

    if (i + batchSize < coordinates.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return snappedCoordinates;
};

export const useGpsStore = create(subscribeWithSelector((set, get) => ({
  // State
  devicesData: {},
  realtimeData: {},
  realtimeTracks: {},
  snappedTracks: {},
  loading: true,
  error: null,
  apiStatus: 'checking',
  selectedDeviceId: null,
  firstValidDevice: null,
  roadSnappingInProgress: {},
  lastDataUpdate: {},
  pollingInterval: null,
  
  // Actions
  fetchDevices: async () => {
    try {
      set({ loading: true });
      console.log('📱 Fetching devices from GPS API');
      const response = await gpsAPI.getDevices();
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      console.log('✅ Devices API response:', data);
      
      if (data && data.success === true && data.data && data.data.devices && Array.isArray(data.data.devices)) {
        const devicesObject = {};
        data.data.devices.forEach(device => {
          devicesObject[device.imei] = device;
        });
        set({ 
          devicesData: devicesObject, 
          error: null, 
          apiStatus: 'connected' 
        });
        console.log(`📱 Processed ${Object.keys(devicesObject).length} devices`);
        const firstValid = data.data.devices.find(device => getCoordinatesFromDevice(device) !== null);
        if (firstValid) {
          const coords = getCoordinatesFromDevice(firstValid);
          set({ firstValidDevice: coords });
          console.log('🎯 First valid device found:', coords);
        } else {
          console.warn('⚠️ No devices with valid coordinates found');
        }
      } else if (data && Array.isArray(data)) {
        // Handle case where API returns array directly
        const devicesObject = {};
        data.forEach(device => {
          devicesObject[device.imei] = device;
        });
        set({ 
          devicesData: devicesObject, 
          error: null, 
          apiStatus: 'connected' 
        });
        console.log(`📱 Processed ${Object.keys(devicesObject).length} devices`);
        const firstValid = data.find(device => getCoordinatesFromDevice(device) !== null);
        if (firstValid) {
          const coords = getCoordinatesFromDevice(firstValid);
          set({ firstValidDevice: coords });
          console.log('🎯 First valid device found:', coords);
        } else {
          console.warn('⚠️ No devices with valid coordinates found');
        }
      } else {
        console.error('❌ Invalid devices data structure:', data);
        throw new Error('Invalid devices data structure');
      }
    } catch (err) {
      console.error('❌ Error fetching devices:', err);
      set({ 
        error: err.response?.data?.message || err.message || 'Failed to fetch devices', 
        apiStatus: 'error' 
      });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchRealtimeLocations: async () => {
    try {
      console.log('📍 Fetching realtime locations from GPS API');
      const response = await gpsAPI.getRealtimeLocations();
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      console.log('✅ Realtime locations API response:', data);
      
      if (data && data.success === true && data.data && data.data.devices && Array.isArray(data.data.devices)) {
        const realtimeObject = {};
        data.data.devices.forEach(device => {
          realtimeObject[device.imei] = device;
        });
        console.log(`📱 Processed ${Object.keys(realtimeObject).length} realtime devices`);
        
        // Update state with new realtime data
        const state = get();
        const updatedDevices = { ...state.devicesData };
        const updatedTracks = { ...state.realtimeTracks };
        const updatedSnappedTracks = { ...state.snappedTracks };
        const updatedLastDataUpdate = { ...state.lastDataUpdate };
        
        Object.keys(realtimeObject).forEach(imei => {
          const device = realtimeObject[imei];
          const coords = getCoordinatesFromDevice(device);
          if (coords) {
            const lastUpdate = state.lastDataUpdate[imei] || 0;
            const currentUpdate = device.last_seen || device.received_time || Date.now();
            if (!updatedDevices[imei] || lastUpdate < currentUpdate) {
              updatedDevices[imei] = {
                ...updatedDevices[imei],
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
              if (updatedTracks[imei].length >= 2) {
                set(state => ({ 
                  roadSnappingInProgress: { 
                    ...state.roadSnappingInProgress, 
                    [imei]: true 
                  } 
                }));
                
                batchSnapToRoads(updatedTracks[imei]).then(snappedTrack => {
                  set(state => ({ 
                    snappedTracks: {
                      ...state.snappedTracks,
                      [imei]: snappedTrack
                    },
                    roadSnappingInProgress: { 
                      ...state.roadSnappingInProgress, 
                      [imei]: false 
                    }
                  }));
                  console.log(`🛣️ Road-snapped realtime track for ${imei}: ${snappedTrack.length} points`);
                });
              }
              updatedLastDataUpdate[imei] = currentUpdate;
            }
          }
        });
        
        set({ 
          devicesData: updatedDevices,
          realtimeData: realtimeObject,
          realtimeTracks: updatedTracks,
          snappedTracks: updatedSnappedTracks,
          lastDataUpdate: updatedLastDataUpdate,
          apiStatus: 'connected'
        });
      } else if (data && Array.isArray(data)) {
        // Handle case where API returns array directly
        const realtimeObject = {};
        data.forEach(device => {
          realtimeObject[device.imei] = device;
        });
        console.log(`📱 Processed ${Object.keys(realtimeObject).length} realtime devices`);
        
        // Update state with new realtime data
        const state = get();
        const updatedDevices = { ...state.devicesData };
        const updatedTracks = { ...state.realtimeTracks };
        const updatedSnappedTracks = { ...state.snappedTracks };
        const updatedLastDataUpdate = { ...state.lastDataUpdate };
        
        Object.keys(realtimeObject).forEach(imei => {
          const device = realtimeObject[imei];
          const coords = getCoordinatesFromDevice(device);
          if (coords) {
            const lastUpdate = state.lastDataUpdate[imei] || 0;
            const currentUpdate = device.last_seen || device.received_time || Date.now();
            if (!updatedDevices[imei] || lastUpdate < currentUpdate) {
              updatedDevices[imei] = {
                ...updatedDevices[imei],
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
              if (updatedTracks[imei].length >= 2) {
                set(state => ({ 
                  roadSnappingInProgress: { 
                    ...state.roadSnappingInProgress, 
                    [imei]: true 
                  } 
                }));
                
                batchSnapToRoads(updatedTracks[imei]).then(snappedTrack => {
                  set(state => ({ 
                    snappedTracks: {
                      ...state.snappedTracks,
                      [imei]: snappedTrack
                    },
                    roadSnappingInProgress: { 
                      ...state.roadSnappingInProgress, 
                      [imei]: false 
                    }
                  }));
                  console.log(`🛣️ Road-snapped realtime track for ${imei}: ${snappedTrack.length} points`);
                });
              }
              updatedLastDataUpdate[imei] = currentUpdate;
            }
          }
        });
        
        set({ 
          devicesData: updatedDevices,
          realtimeData: realtimeObject,
          realtimeTracks: updatedTracks,
          snappedTracks: updatedSnappedTracks,
          lastDataUpdate: updatedLastDataUpdate,
          apiStatus: 'connected'
        });
      } else {
        console.error('❌ Invalid realtime data structure:', data);
        throw new Error('Invalid realtime data structure');
      }
    } catch (err) {
      console.error('❌ Error fetching realtime locations:', err);
      set({ 
        error: err.response?.data?.message || err.message || 'Failed to fetch realtime locations',
        apiStatus: 'error' 
      });
      return {};
    }
  },
  
  setSelectedDeviceId: (deviceId) => {
    set({ selectedDeviceId: deviceId });
  },
  
  // Start polling for realtime data
  startPolling: () => {
    // Clear any existing interval
    const state = get();
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval);
    }
    
    // Initial fetch
    get().fetchRealtimeLocations();
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      get().fetchRealtimeLocations();
    }, 5000); // Poll every 5 seconds
    
    // Store the interval ID
    set({ pollingInterval: intervalId });
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  },
  
  // Stop polling
  stopPolling: () => {
    const state = get();
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval);
      set({ pollingInterval: null });
    }
  },
  
  // Check API connectivity
  checkApiConnectivity: async () => {
    try {
      console.log('🔍 Checking GPS API connectivity');
      const response = await gpsAPI.checkHealth();
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ GPS API health check successful');
      set({ apiStatus: 'connected' });
      return true;
    } catch (err) {
      console.error('❌ GPS API connectivity check failed:', err);
      set({ 
        apiStatus: 'error',
        error: err.response?.data?.message || err.message || 'GPS API connectivity check failed'
      });
      return false;
    }
  },
  
  // Initialize data fetching
  initializeData: async () => {
    const isConnected = await get().checkApiConnectivity();
    if (isConnected) {
      await get().fetchDevices();
      return get().startPolling();
    } else {
      set({ 
        loading: false, 
        error: 'Failed to connect to GPS API. Please check if the API server is running.' 
      });
      return null;
    }
  },
  
  // Clear all data (useful for cleanup)
  clearData: () => {
    // Stop polling if active
    get().stopPolling();
    
    set({
      devicesData: {},
      realtimeData: {},
      realtimeTracks: {},
      snappedTracks: {},
      loading: false,
      error: null,
      apiStatus: 'checking',
      selectedDeviceId: null,
      firstValidDevice: null,
      roadSnappingInProgress: {},
      lastDataUpdate: {},
      pollingInterval: null
    });
  }
})));