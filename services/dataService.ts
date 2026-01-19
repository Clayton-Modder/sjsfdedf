import { ApiData } from '../types';
import { initialData } from './initialData';

export const fetchChannels = async (): Promise<ApiData> => {
  try {
    return Promise.resolve(initialData);
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    return {
      categories: [],
      channels: []
    };
  }
};