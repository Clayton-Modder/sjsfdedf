import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Channel, Category } from '../types';
import { fetchChannels } from '../services/dataService';

interface DataContextType {
  channels: Channel[];
  categories: Category[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const channelsData = await fetchChannels();
      
      // Inject "Favoritos", "Recentes", "Futebol", "Rádios" categories
      const todosCat = channelsData.categories.find(c => c.id === 0) || { id: 0, name: "Todos" };
      const otherCats = channelsData.categories.filter(c => c.id !== 0);
      
      const enhancedCategories = [
        todosCat,
        { id: -3, name: "Futebol Ao vivo" },
        { id: -4, name: "Rádios Online" },
        { id: -1, name: "Favoritos" },
        { id: -2, name: "Recentes" },
        ...otherCats
      ];

      setCategories(enhancedCategories);
      setChannels(channelsData.channels);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = async () => {
    setIsLoading(true);
    await loadData();
  };

  return (
    <DataContext.Provider value={{ channels, categories, isLoading, refreshData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
