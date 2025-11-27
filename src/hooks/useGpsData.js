// hooks/useGpsData.js
import { useGpsStore } from '../stores/gpsStore';

// Custom hook for all GPS data
export const useGpsData = () => {
  return useGpsStore.getState();
};

// Custom hook for devices data
export const useDevices = () => {
  const {
    devicesData,
    loading,
    error,
    apiStatus,
    fetchDevices,
    setSelectedDeviceId
  } = useGpsStore();

  return {
    devicesData,
    loading,
    error,
    apiStatus,
    fetchDevices,
    setSelectedDeviceId
  };
};

// Custom hook for realtime tracking data
export const useRealtimeTracking = () => {
  const {
    realtimeData,
    realtimeTracks,
    snappedTracks,
    selectedDeviceId,
    firstValidDevice,
    roadSnappingInProgress,
    fetchRealtimeLocations,
    setSelectedDeviceId,
    startPolling,
    stopPolling
  } = useGpsStore();

  return {
    realtimeData,
    realtimeTracks,
    snappedTracks,
    selectedDeviceId,
    firstValidDevice,
    roadSnappingInProgress,
    fetchRealtimeLocations,
    setSelectedDeviceId,
    startPolling,
    stopPolling
  };
};

// Custom hook for initializing GPS data
export const useInitializeGpsData = () => {
  const {
    initializeData,
    clearData
  } = useGpsStore();

  return {
    initializeData,
    clearData
  };
};