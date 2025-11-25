// hooks/useData.js
import { useEffect } from 'react';
import useDataStore from '../stores/dataStore';
import { jsfcGodownAPI } from '../utils/api';
import { goodsAPI } from '../utils/api';

const useData = () => {
  const godowns = useDataStore((state) => state.godowns);
  const goods = useDataStore((state) => state.goods);
  const drivers = useDataStore((state) => state.drivers);
  const vehicles = useDataStore((state) => state.vehicles);
  
  const setGodowns = useDataStore((state) => state.setGodowns);
  const setGoods = useDataStore((state) => state.setGoods);

  // Initialize godowns data from API
  useEffect(() => {
    const fetchGodowns = async () => {
      try {
        const response = await jsfcGodownAPI.getGodowns();
        
        // Accept any 2xx status as success
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = response.data;
        
        // Handle different response structures based on the JsfcGodown component
        if (data && data.data && data.data.godowns && Array.isArray(data.data.godowns)) {
          // Structure: { data: { godowns: [...] } }
          console.log('Setting godowns from nested structure:', data.data.godowns);
          setGodowns(data.data.godowns);
        } else if (data && data.success === true && Array.isArray(data.data)) {
          // Structure: { success: true, data: [...] }
          console.log('Setting godowns from success structure:', data.data);
          setGodowns(data.data);
        } else if (data && Array.isArray(data)) {
          // Structure: direct array
          console.log('Setting godowns from direct array:', data);
          setGodowns(data);
        } else {
          console.error('Unexpected API response structure for godowns:', data);
          throw new Error('Unexpected API response structure for godowns');
        }
      } catch (err) {
        console.error('Error fetching godowns:', err);
        // If API fails, we'll use empty array
        setGodowns([]);
      }
    };
    
    fetchGodowns();
  }, [setGodowns]);

  // Initialize goods data from API
  useEffect(() => {
    const fetchGoods = async () => {
      try {
        const response = await goodsAPI.getGoods();
        
        // Accept any 2xx status as success
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = response.data;
        
        // Handle different response structures based on the Goods component
        if (data && data.success === true && Array.isArray(data.data)) {
          // Structure: { success: true, data: [...] }
          console.log('Setting goods from success structure:', data.data);
          setGoods(data.data);
        } else if (data && Array.isArray(data)) {
          // Structure: direct array
          console.log('Setting goods from direct array:', data);
          setGoods(data);
        } else {
          console.error('Unexpected API response structure for goods:', data);
          throw new Error('Unexpected API response structure for goods');
        }
      } catch (err) {
        console.error('Error fetching goods:', err);
        // If API fails, we'll use empty array
        setGoods([]);
      }
    };
    
    fetchGoods();
  }, [setGoods]);

  return {
    godowns,
    goods,
    drivers,
    vehicles,
  };
};

export default useData;