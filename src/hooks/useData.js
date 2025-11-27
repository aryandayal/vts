// hooks/useData.js
import { useDataStore } from '../stores/dataStore';

// Custom hook for all data
export const useData = () => {
  return useDataStore.getState();
};

// Custom hook for goods data
export const useGoods = () => {
  const {
    goods,
    goodsLoading,
    goodsError,
    fetchGoods,
    addGoods,
    updateGoods,
    deleteGoods
  } = useDataStore();

  return {
    goods,
    goodsLoading,
    goodsError,
    fetchGoods,
    addGoods,
    updateGoods,
    deleteGoods
  };
};

// Custom hook for godowns data
export const useGodowns = () => {
  const {
    godowns,
    deletedGodowns,
    godownsLoading,
    godownsError,
    fetchGodowns,
    fetchDeletedGodowns,
    addGodown,
    updateGodown,
    deleteGodown,
    restoreGodown,
    importGodowns
  } = useDataStore();

  return {
    godowns,
    deletedGodowns,
    godownsLoading,
    godownsError,
    fetchGodowns,
    fetchDeletedGodowns,
    addGodown,
    updateGodown,
    deleteGodown,
    restoreGodown,
    importGodowns
  };
};

// Custom hook for users data
export const useUsers = () => {
  const {
    users,
    usersLoading,
    usersError,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    disableUser,
    enableUser
  } = useDataStore();

  return {
    users,
    usersLoading,
    usersError,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    disableUser,
    enableUser
  };
};

// Custom hook for profile data
export const useProfile = () => {
  const {
    profile,
    profileLoading,
    profileError,
    fetchProfile,
    updateProfile
  } = useDataStore();

  return {
    profile,
    profileLoading,
    profileError,
    fetchProfile,
    updateProfile
  };
};

// Custom hook for transporters data
export const useTransporters = () => {
  const {
    trips,
    vehicles,
    drivers,
    tripsLoading,
    vehiclesLoading,
    driversLoading,
    tripsError,
    vehiclesError,
    driversError,
    fetchTrips,
    addTrip,
    updateTrip,
    deleteTrip,
    fetchVehicles,
    fetchDrivers
  } = useDataStore();

  return {
    trips,
    vehicles,
    drivers,
    tripsLoading,
    vehiclesLoading,
    driversLoading,
    tripsError,
    vehiclesError,
    driversError,
    fetchTrips,
    addTrip,
    updateTrip,
    deleteTrip,
    fetchVehicles,
    fetchDrivers
  };
};

// Custom hook for clearing all data
export const useClearData = () => {
  const { clearData } = useDataStore();
  return { clearData };
};