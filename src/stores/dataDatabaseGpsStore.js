// stores/dataDatabaseGpsStore.js
import { create } from 'zustand';
import { gpsDatabaseAPI } from '../utils/api';

export const useDatabaseGpsData = create((set, get) => ({
  devices: {},
  tracks: {},
  loading: false,
  error: null,
  trackLoading: false,
  
  // Fetch devices from backend
  fetchDevices: async () => {
    try {
      set({ loading: true, error: null });
      console.log(`📱 Fetching devices from GPS Database API`);
      const response = await gpsDatabaseAPI.getDevices();
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch devices');
      }
      
      const data = response.data;
      console.log('✅ Devices API response:', data);
      
      if (data.success && data.data && Array.isArray(data.data.devices)) {
        const devicesObject = {};
        data.data.devices.forEach(device => {
          if (device.imei) {
            devicesObject[device.imei] = device;
          }
        });
        
        set({ devices: devicesObject, loading: false });
        console.log(`📱 Processed ${Object.keys(devicesObject).length} devices`);
      } else {
        throw new Error(data.error?.message || 'Invalid devices data structure');
      }
    } catch (err) {
      console.error('❌ Error fetching devices:', err);
      set({ error: err.message, loading: false, devices: {} });
    }
  },
  
  // Fetch full device data for history track
  fetchDeviceTrack: async (imei, startDate, endDate) => {
    try {
      set({ trackLoading: true, error: null });
      
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      console.log(`📊 Fetching full device data for: ${imei}`);
      const response = await gpsDatabaseAPI.getDeviceFullData(imei, params);
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch device history');
      }
      
      const data = response.data;
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
        
        // Update tracks in state
        set(state => ({
          tracks: { ...state.tracks, [imei]: track },
          trackLoading: false
        }));
        
        console.log(`🛣️ Device ${imei} track: ${track.length} points`);
      } else {
        throw new Error(data.error?.message || 'No track data available');
      }
    } catch (err) {
      console.error(`❌ Error fetching full data for ${imei}:`, err);
      set({ 
        error: err.message, 
        trackLoading: false,
        tracks: { ...get().tracks, [imei]: [] }
      });
    }
  }
}));