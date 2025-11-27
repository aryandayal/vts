// stores/dataStore.js
import { create } from 'zustand';
import { goodsAPI, jsfcGodownAPI, userAPI, profileAPI } from '../utils/api';

export const useDataStore = create((set, get) => ({
  // Goods state
  goods: [],
  goodsLoading: false,
  goodsError: null,
  
  // Godowns state
  godowns: [],
  deletedGodowns: [],
  godownsLoading: false,
  godownsError: null,
  
  // Users state
  users: [],
  usersLoading: false,
  usersError: null,
  
  // Profile state
  profile: null,
  profileLoading: false,
  profileError: null,
  
  // Goods actions
  fetchGoods: async () => {
    set({ goodsLoading: true, goodsError: null });
    
    try {
      const response = await goodsAPI.getGoods();
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      if (data && data.success === true && Array.isArray(data.data)) {
        set({ goods: data.data });
      } else if (data && Array.isArray(data)) {
        set({ goods: data });
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      console.error('Error fetching goods:', error);
      set({ goodsError: error.message || 'Failed to fetch goods' });
    } finally {
      set({ goodsLoading: false });
    }
  },
  
  addGoods: async (goodsData) => {
    set({ goodsLoading: true, goodsError: null });
    
    try {
      const response = await goodsAPI.createGoods(goodsData);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the goods list after successful creation
      await get().fetchGoods();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding goods:', error);
      set({ goodsError: error.response?.data?.message || error.message || 'Failed to add goods' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to add goods' };
    } finally {
      set({ goodsLoading: false });
    }
  },
  
  updateGoods: async (id, goodsData) => {
    set({ goodsLoading: true, goodsError: null });
    
    try {
      const response = await goodsAPI.updateGoods(id, goodsData);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the goods list after successful update
      await get().fetchGoods();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating goods:', error);
      set({ goodsError: error.response?.data?.message || error.message || 'Failed to update goods' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to update goods' };
    } finally {
      set({ goodsLoading: false });
    }
  },
  
  deleteGoods: async (id) => {
    set({ goodsLoading: true, goodsError: null });
    
    try {
      const response = await goodsAPI.deleteGoods(id);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the goods list after successful deletion
      await get().fetchGoods();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting goods:', error);
      set({ goodsError: error.response?.data?.message || error.message || 'Failed to delete goods' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to delete goods' };
    } finally {
      set({ goodsLoading: false });
    }
  },
  
  // Godowns actions
  fetchGodowns: async () => {
    set({ godownsLoading: true, godownsError: null });
    
    try {
      const response = await jsfcGodownAPI.getGodowns();
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      // Handle different response structures
      if (data && data.data && data.data.godowns && Array.isArray(data.data.godowns)) {
        set({ godowns: data.data.godowns });
      } else if (data && Array.isArray(data)) {
        set({ godowns: data });
      } else {
        console.error('Unexpected API response structure for godowns:', data);
        throw new Error('Unexpected API response structure for godowns');
      }
    } catch (error) {
      console.error('Error fetching godowns:', error);
      set({ godownsError: error.message || 'Failed to fetch godowns' });
    } finally {
      set({ godownsLoading: false });
    }
  },
  
  fetchDeletedGodowns: async () => {
    set({ godownsLoading: true, godownsError: null });
    
    try {
      const response = await jsfcGodownAPI.getDeletedGodowns();
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      // Handle different response structures
      if (data && data.success === true && Array.isArray(data.data)) {
        set({ deletedGodowns: data.data });
      } else if (data && Array.isArray(data)) {
        set({ deletedGodowns: data });
      } else {
        console.error('Unexpected API response structure for deleted godowns:', data);
        throw new Error('Unexpected API response structure for deleted godowns');
      }
    } catch (error) {
      console.error('Error fetching deleted godowns:', error);
      set({ godownsError: error.message || 'Failed to fetch deleted godowns' });
    } finally {
      set({ godownsLoading: false });
    }
  },
  
  addGodown: async (godownData) => {
    set({ godownsLoading: true, godownsError: null });
    
    try {
      const response = await jsfcGodownAPI.createGodown(godownData);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the godowns list after successful creation
      await get().fetchGodowns();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding godown:', error);
      set({ godownsError: error.response?.data?.message || error.message || 'Failed to add godown' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to add godown' };
    } finally {
      set({ godownsLoading: false });
    }
  },
  
  updateGodown: async (id, godownData) => {
    set({ godownsLoading: true, godownsError: null });
    
    try {
      const response = await jsfcGodownAPI.updateGodown(id, godownData);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the godowns list after successful update
      await get().fetchGodowns();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating godown:', error);
      set({ godownsError: error.response?.data?.message || error.message || 'Failed to update godown' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to update godown' };
    } finally {
      set({ godownsLoading: false });
    }
  },
  
  deleteGodown: async (id) => {
    set({ godownsLoading: true, godownsError: null });
    
    try {
      const response = await jsfcGodownAPI.deleteGodown(id);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the godowns list after successful deletion
      await get().fetchGodowns();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting godown:', error);
      set({ godownsError: error.response?.data?.message || error.message || 'Failed to delete godown' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to delete godown' };
    } finally {
      set({ godownsLoading: false });
    }
  },
  
  restoreGodown: async (id) => {
    set({ godownsLoading: true, godownsError: null });
    
    try {
      const response = await jsfcGodownAPI.restoreGodown(id);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the godowns list after successful restoration
      await get().fetchGodowns();
      await get().fetchDeletedGodowns();
      
      return { success: true };
    } catch (error) {
      console.error('Error restoring godown:', error);
      set({ godownsError: error.response?.data?.message || error.message || 'Failed to restore godown' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to restore godown' };
    } finally {
      set({ godownsLoading: false });
    }
  },
  
  importGodowns: async (formData) => {
    set({ godownsLoading: true, godownsError: null });
    
    try {
      const response = await jsfcGodownAPI.importGodowns(formData);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      const result = response.data;
      
      if (result.success === false) {
        throw new Error(result.message || 'Import failed on the server');
      }
      
      // Refresh the godowns list after successful import
      await get().fetchGodowns();
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error importing godowns:', error);
      set({ godownsError: error.response?.data?.message || error.message || 'Failed to import godowns' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to import godowns' };
    } finally {
      set({ godownsLoading: false });
    }
  },
  
  // Users actions
  fetchUsers: async () => {
    set({ usersLoading: true, usersError: null });
    
    try {
      const response = await userAPI.getUsers();
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      if (data && data.data && data.data.users && Array.isArray(data.data.users)) {
        set({ users: data.data.users });
      } else if (data && Array.isArray(data)) {
        set({ users: data });
      } else {
        console.error('Unexpected API response structure for users:', data);
        throw new Error('Unexpected API response structure for users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ usersError: error.message || 'Failed to fetch users' });
    } finally {
      set({ usersLoading: false });
    }
  },
  
  addUser: async (userData) => {
    set({ usersLoading: true, usersError: null });
    
    try {
      const response = await userAPI.createUser(userData);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the users list after successful creation
      await get().fetchUsers();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding user:', error);
      set({ usersError: error.response?.data?.message || error.message || 'Failed to add user' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to add user' };
    } finally {
      set({ usersLoading: false });
    }
  },
  
  updateUser: async (id, userData) => {
    set({ usersLoading: true, usersError: null });
    
    try {
      const response = await userAPI.updateUser(id, userData);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the users list after successful update
      await get().fetchUsers();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating user:', error);
      set({ usersError: error.response?.data?.message || error.message || 'Failed to update user' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to update user' };
    } finally {
      set({ usersLoading: false });
    }
  },
  
  deleteUser: async (id) => {
    set({ usersLoading: true, usersError: null });
    
    try {
      const response = await userAPI.deleteUser(id);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the users list after successful deletion
      await get().fetchUsers();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      set({ usersError: error.response?.data?.message || error.message || 'Failed to delete user' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to delete user' };
    } finally {
      set({ usersLoading: false });
    }
  },
  
  changeUserPassword: async (id, passwordData) => {
    set({ usersLoading: true, usersError: null });
    
    try {
      const response = await userAPI.changePassword(id, passwordData);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error changing user password:', error);
      set({ usersError: error.response?.data?.message || error.message || 'Failed to change user password' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to change user password' };
    } finally {
      set({ usersLoading: false });
    }
  },
  
  disableUser: async (id, reason) => {
    set({ usersLoading: true, usersError: null });
    
    try {
      const response = await userAPI.disableUser(id, reason);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the users list after successful disable
      await get().fetchUsers();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error disabling user:', error);
      set({ usersError: error.response?.data?.message || error.message || 'Failed to disable user' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to disable user' };
    } finally {
      set({ usersLoading: false });
    }
  },
  
  enableUser: async (id) => {
    set({ usersLoading: true, usersError: null });
    
    try {
      const response = await userAPI.enableUser(id);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh the users list after successful enable
      await get().fetchUsers();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error enabling user:', error);
      set({ usersError: error.response?.data?.message || error.message || 'Failed to enable user' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to enable user' };
    } finally {
      set({ usersLoading: false });
    }
  },
  
  // Profile actions
  fetchProfile: async () => {
    set({ profileLoading: true, profileError: null });
    
    try {
      const response = await profileAPI.getProfile();
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      if (data && data.data) {
        set({ profile: data.data });
      } else if (data) {
        set({ profile: data });
      } else {
        console.error('Unexpected API response structure for profile:', data);
        throw new Error('Unexpected API response structure for profile');
      }
      
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ profileError: error.message || 'Failed to fetch profile' });
      return { success: false, error: error.message || 'Failed to fetch profile' };
    } finally {
      set({ profileLoading: false });
    }
  },
  
  updateProfile: async (profileData) => {
    set({ profileLoading: true, profileError: null });
    
    try {
      const response = await profileAPI.updateProfile(profileData);
      
      // Accept any 2xx status as success
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Update the profile in the store
      set({ profile: { ...get().profile, ...profileData } });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ profileError: error.response?.data?.message || error.message || 'Failed to update profile' });
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to update profile' };
    } finally {
      set({ profileLoading: false });
    }
  },
  
  // Clear all data (useful for logout)
  clearData: () => {
    set({
      goods: [],
      goodsLoading: false,
      goodsError: null,
      godowns: [],
      deletedGodowns: [],
      godownsLoading: false,
      godownsError: null,
      users: [],
      usersLoading: false,
      usersError: null,
      profile: null,
      profileLoading: false,
      profileError: null
    });
  }
}));