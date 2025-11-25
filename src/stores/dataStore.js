// stores/dataStore.js
import { create } from 'zustand';

const useDataStore = create((set, get) => ({
  // Godowns data
  godowns: [],
  
  // Goods data
  goods: [],
  
  // Mock drivers data
  drivers: [
    { id: 'd1', name: 'John Doe', license: 'DL123456', phone: '555-1234', status: 'active' },
    { id: 'd2', name: 'Jane Smith', license: 'DL789012', phone: '555-5678', status: 'active' },
    { id: 'd3', name: 'Robert Johnson', license: 'DL345678', phone: '555-9012', status: 'active' },
    { id: 'd4', name: 'Emily Davis', license: 'DL901234', phone: '555-3456', status: 'inactive' },
    { id: 'd5', name: 'Michael Wilson', license: 'DL567890', phone: '555-7890', status: 'active' }
  ],
  
  // Mock vehicles data
  vehicles: [
    { id: 'v1', name: 'Truck 101', type: 'Heavy Truck', capacity: '10 tons', plate: 'TRK-101', status: 'active' },
    { id: 'v2', name: 'Van 202', type: 'Delivery Van', capacity: '2 tons', plate: 'VAN-202', status: 'active' },
    { id: 'v3', name: 'Trailer 303', type: 'Semi-Trailer', capacity: '20 tons', plate: 'TRL-303', status: 'maintenance' },
    { id: 'v4', name: 'Pickup 404', type: 'Pickup Truck', capacity: '1 ton', plate: 'PU-404', status: 'active' },
    { id: 'v5', name: 'Flatbed 505', type: 'Flatbed Truck', capacity: '15 tons', plate: 'FB-505', status: 'active' }
  ],
  
  // Setters for godowns
  setGodowns: (godowns) => set({ godowns }),
  
  // Setters for goods
  setGoods: (goods) => set({ goods }),
  
  // CRUD operations for godowns
  addGodown: (godown) => set((state) => ({ 
    godowns: [...state.godowns, { ...godown, id: `g${state.godowns.length + 1}` }] 
  })),
  updateGodown: (id, updatedGodown) => set((state) => ({
    godowns: state.godowns.map(g => g.id === id ? { ...g, ...updatedGodown } : g)
  })),
  deleteGodown: (id) => set((state) => ({
    godowns: state.godowns.filter(g => g.id !== id)
  })),
  
  // CRUD operations for goods
  addGoods: (good) => set((state) => ({ 
    goods: [...state.goods, { ...good, id: `gd${state.goods.length + 1}` }] 
  })),
  updateGoods: (id, updatedGoods) => set((state) => ({
    goods: state.goods.map(g => g.id === id ? { ...g, ...updatedGoods } : g)
  })),
  deleteGoods: (id) => set((state) => ({
    goods: state.goods.filter(g => g.id !== id)
  })),
  
  // CRUD operations for drivers
  addDriver: (driver) => set((state) => ({ 
    drivers: [...state.drivers, { ...driver, id: `d${state.drivers.length + 1}` }] 
  })),
  updateDriver: (id, updatedDriver) => set((state) => ({
    drivers: state.drivers.map(d => d.id === id ? { ...d, ...updatedDriver } : d)
  })),
  deleteDriver: (id) => set((state) => ({
    drivers: state.drivers.filter(d => d.id !== id)
  })),
  
  // CRUD operations for vehicles
  addVehicle: (vehicle) => set((state) => ({ 
    vehicles: [...state.vehicles, { ...vehicle, id: `v${state.vehicles.length + 1}` }] 
  })),
  updateVehicle: (id, updatedVehicle) => set((state) => ({
    vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...updatedVehicle } : v)
  })),
  deleteVehicle: (id) => set((state) => ({
    vehicles: state.vehicles.filter(v => v.id !== id)
  })),
  
  // Helper function to get godown by ID
  getGodownById: (id) => {
    return get().godowns.find(godown => godown.id === id);
  },
  
  // Helper function to get goods by ID
  getGoodsById: (id) => {
    return get().goods.find(good => good.id === id);
  },
  
  // Helper function to get driver by ID
  getDriverById: (id) => {
    return get().drivers.find(driver => driver.id === id);
  },
  
  // Helper function to get vehicle by ID
  getVehicleById: (id) => {
    return get().vehicles.find(vehicle => vehicle.id === id);
  },
  
  // Helper function to get active drivers only
  getActiveDrivers: () => {
    return get().drivers.filter(driver => driver.status === 'active');
  },
  
  // Helper function to get active vehicles only
  getActiveVehicles: () => {
    return get().vehicles.filter(vehicle => vehicle.status === 'active');
  },
  
  // Helper function to get active goods only
  getActiveGoods: () => {
    return get().goods.filter(good => good.status === 'active');
  },
  
  // Helper function to get active godowns only
  getActiveGodowns: () => {
    return get().godowns.filter(godown => godown.status === 'active');
  }
}));

export default useDataStore;