import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { fetchChannels } from './services/dataService';
import { Channel, Category } from './types';
import { Loader2 } from 'lucide-react';
import { Home } from './pages/Home';
import { Watch } from './pages/Watch';
import { RemoteControl } from './components/RemoteControl';

const App: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  
  // Favorites State with localStorage persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading favorites", e);
      return [];
    }
  });

  // History State with localStorage persistence
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading history", e);
      return [];
    }
  });

  const toggleFavorite = (channelId: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      
      localStorage.setItem('favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const addToHistory = useCallback((channelId: string) => {
    setHistory(prev => {
      // Remove if exists to move to top, limit to 10
      const newHistory = [channelId, ...prev.filter(id => id !== channelId)].slice(0, 10);
      localStorage.setItem('history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchChannels();
        
        // Inject "Favoritos", "Recentes", and "Jogos" categories
        const todosCat = data.categories.find(c => c.id === 0) || { id: 0, name: "Todos" };
        const otherCats = data.categories.filter(c => c.id !== 0);
        
        const enhancedCategories = [
          todosCat,
          { id: -3, name: "Jogos" }, // New Games Category
          { id: -1, name: "Favoritos" },
          { id: -2, name: "Recentes" },
          ...otherCats
        ];

        setCategories(enhancedCategories);
        setChannels(data.channels);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsAppLoading(false);
      }
    };
    loadData();
  }, []);

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h1 className="text-xl font-bold text-white tracking-widest">Mega Canais <span className="text-primary">TV</span></h1>
        <p className="text-gray-500 mt-2 text-sm">Carregando programação...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-dark text-white font-sans relative">
        <RemoteControl channels={channels} />
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                channels={channels} 
                categories={categories}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                history={history}
              />
            } 
          />
          <Route 
            path="/watch/:id" 
            element={<Watch channels={channels} addToHistory={addToHistory} />} 
          />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;