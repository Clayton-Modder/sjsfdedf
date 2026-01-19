import { ApiData } from '../types';

export const fetchChannels = async (): Promise<ApiData> => {
  try {
    const response = await fetch('./appcanais.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: ApiData = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    // Return empty structure on error to prevent app crash
    return {
      categories: [],
      channels: []
    };
  }
};