import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { fetchChannels } from './services/dataService';
import { Channel, Category } from './types';
import { Loader2 } from 'lucide-react';
import { Home } from './pages/Home';
import { Watch } from './pages/Watch';

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

  const toggleFavorite = (channelId: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      
      localStorage.setItem('favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchChannels();
        
        // Inject "Favoritos" category after "Todos" (assuming Todos is id 0)
        const todosCat = data.categories.find(c => c.id === 0) || { id: 0, name: "Todos" };
        const otherCats = data.categories.filter(c => c.id !== 0);
        
        const enhancedCategories = [
          todosCat,
          { id: -1, name: "Favoritos" },
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
        <h1 className="text-xl font-bold text-white tracking-widest">Mega<span className="text-primary">TV</span></h1>
        <p className="text-gray-500 mt-2 text-sm">Carregando programação...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-dark text-white font-sans">
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                channels={channels} 
                categories={categories}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            } 
          />
          <Route 
            path="/watch/:id" 
            element={<Watch channels={channels} />} 
          />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;