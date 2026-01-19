import { ApiData, Game } from '../types';
import { initialData } from './initialData';

const CACHE_KEY = 'megacanaistv_data_v1';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CachedData {
  timestamp: number;
  data: ApiData;
}

// Static Fallback Data provided by user
const FALLBACK_GAMES: Game[] = [
  {
    "title": "Parma X Genoa",
    "image": "https://imgur.com/LRMCkG2.png",
    "data": {
      "league": "Campeonato Italiano",
      "timer": { "start": 1768735800, "end": 1768743600 },
      "teams": {
        "home": { "name": "Parma", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/parma.webp" },
        "away": { "name": "Genoa", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/genoa.webp" }
      }
    },
    "players": ["https://www1.embedtv.best/pt_sportv2"]
  },
  {
    "title": "Getafe X Valencia",
    "image": "https://imgur.com/rgeFEJi.png",
    "data": {
      "league": "La Liga",
      "timer": { "start": 1768741200, "end": 1768749000 },
      "teams": {
        "home": { "name": "Getafe", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/getafe.webp" },
        "away": { "name": "Valencia", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/valencia.webp" }
      }
    },
    "players": ["https://www1.embedtv.best/disneyplus1"]
  },
  {
    "title": "Wolves X Newcastle",
    "image": "https://imgur.com/5oKeIid.png",
    "data": {
      "league": "Campeonato Inglês",
      "timer": { "start": 1768744800, "end": 1768752600 },
      "teams": {
        "home": { "name": "Wolverhampton", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/wolverhampton.webp" },
        "away": { "name": "Newcastle", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/newcastle.webp" }
      }
    },
    "players": ["https://www1.embedtv.best/espn"]
  },
  {
    "title": "Bologna X Fiorentina",
    "image": "https://imgur.com/sRNR7yp.png",
    "data": {
      "league": "Campeonato Italiano",
      "timer": { "start": 1768744800, "end": 1768752600 },
      "teams": {
        "home": { "name": "Bologna", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/bologna.webp" },
        "away": { "name": "Fiorentina", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/fiorentina.webp" }
      }
    },
    "players": ["https://www1.embedtv.best/xsports"]
  },
  {
    "title": "VfB Stuttgart X Union Berlin",
    "image": "https://imgur.com/WKRTmCp.png",
    "data": {
      "league": "Campeonato Alemão",
      "timer": { "start": 1768746600, "end": 1768754400 },
      "teams": {
        "home": { "name": "Stuttgart", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/stuttgart.webp" },
        "away": { "name": "Union Berlin", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/union-berlin.webp" }
      }
    },
    "players": []
  },
  {
    "title": "Atletico Madrid X Alavés",
    "image": "https://imgur.com/e2oQk3o.png",
    "data": {
      "league": "La Liga",
      "timer": { "start": 1768752000, "end": 1768759800 },
      "teams": {
        "home": { "name": "Atletico Madrid", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/atletico-madrid.webp" },
        "away": { "name": "Alavés", "image": "https://d1muf25xaso8hp.cloudfront.net/https://futemax.giving/assets/uploads/teams/alaves.webp" }
      }
    },
    "players": ["https://www1.embedtv.best/disneyplus1"]
  }
];

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
    
    // Attempt fetch
    const response = await fetch(`https://embedtv.best/jogos.php?day=${dateString}`);
    
    if (!response.ok) {
       throw new Error('Failed to fetch games');
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    
    // If array is empty, maybe fallback? For now return empty or fallback
    return data.length > 0 ? data : FALLBACK_GAMES;
    
  } catch (error) {
    console.warn("Error fetching games (likely CORS), using fallback data.", error);
    // Return fallback data to avoid empty screen on CORS/Network error
    return FALLBACK_GAMES;
  }
};