import { ApiData } from '../types';
import { initialData } from './initialData';

const CACHE_KEY = 'megatv_data_v1';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CachedData {
  timestamp: number;
  data: ApiData;
}

export const fetchChannels = async (): Promise<ApiData> => {
  try {
    // 1. Check Local Storage
    const cachedString = localStorage.getItem(CACHE_KEY);
    
    if (cachedString) {
      try {
        const cached: CachedData = JSON.parse(cachedString);
        const now = Date.now();
        
        // If cache is valid (less than 1 hour old), return it
        if (now - cached.timestamp < CACHE_DURATION) {
          // console.log("Serving from local cache");
          return Promise.resolve(cached.data);
        }
      } catch (e) {
        console.warn("Cache parse error, refreshing data");
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // 2. Simulate Network Request (Using initialData)
    // In a real app, this would be: const response = await fetch('...');
    const freshData = initialData;

    // 3. Save to Cache
    try {
      const cachePayload: CachedData = {
        timestamp: Date.now(),
        data: freshData
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
    } catch (e) {
      console.error("Failed to save to cache (quota exceeded?)", e);
    }

    return Promise.resolve(freshData);
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    return {
      categories: [],
      channels: []
    };
  }
};