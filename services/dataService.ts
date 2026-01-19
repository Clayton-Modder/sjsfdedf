import { ApiData, Game } from '../types';
import { initialData } from './initialData';

const CACHE_KEY = 'megacanaistv_data_v2';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CachedData {
  timestamp: number;
  data: ApiData;
}

// Static Fallback Data removed as requested
const FALLBACK_GAMES: Game[] = [];

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

export const fetchGames = async (): Promise<Game[]> => {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateString = `${day}${month}${year}`;
    
    // Updated URL to use the new source provided by the user
    // Direct fetch without proxy as requested
    const targetUrl = `https://megacanaisonline.space/api/scramnpjogos.php?day=${dateString}`;
    
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
       throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    
    return [];
    
  } catch (error) {
    // Log helpful info for debugging but don't crash app
    console.warn("Could not fetch live games.", error);
    return [];
  }
};