import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { fetchChannels, fetchRadios } from './services/dataService';
import { Channel, Category, Radio } from './types';
import { Loader2 } from 'lucide-react';
import { Home } from './pages/Home';
import { Watch } from './pages/Watch';
import { Settings } from './pages/Settings';
import { RemoteControl } from './components/RemoteControl';
import { RadioProvider } from './contexts/RadioContext';
import { EPGProvider } from './contexts/EPGContext';
import { GlobalRadioPlayer } from './components/GlobalRadioPlayer';

const App: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [radios, setRadios] = useState<Radio[]>([]);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  
  // Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true; // Default to dark
    } catch {
      return true;
    }
  });

  // Apply Theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

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
        const [channelsData, radiosData] = await Promise.all([
          fetchChannels(),
          fetchRadios()
        ]);
        
        // Inject "Favoritos", "Recentes", "Futebol", "Rádios" and "Programação TV" categories
        const todosCat = channelsData.categories.find(c => c.id === 0) || { id: 0, name: "Todos" };
        const otherCats = channelsData.categories.filter(c => c.id !== 0);
        
        const enhancedCategories = [
          todosCat,
          { id: -3, name: "Futebol Ao vivo" },
          { id: -4, name: "Rádios Online" },
          { id: -5, name: "Programação TV" },
          { id: -1, name: "Favoritos" },
          { id: -2, name: "Recentes" },
          ...otherCats
        ];

        setCategories(enhancedCategories);
        setChannels(channelsData.channels);
        setRadios(radiosData);
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
    <EPGProvider>
      <RadioProvider>
        <HashRouter>
          <div className="min-h-screen bg-white dark:bg-dark text-gray-900 dark:text-white font-sans relative transition-colors duration-300">
            <GlobalRadioPlayer />
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
                    radios={radios}
                  />
                } 
              />
              <Route 
                path="/watch/:id" 
                element={<Watch channels={channels} radios={radios} addToHistory={addToHistory} />} 
              />
              <Route 
                path="/settings" 
                element={<Settings isDark={isDark} toggleTheme={toggleTheme} />} 
              />
            </Routes>
          </div>
        </HashRouter>
      </RadioProvider>
    </EPGProvider>
  );
};

export default App;