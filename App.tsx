import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { fetchChannels } from './services/dataService';
import { Channel, Category } from './types';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Home } from './pages/Home';
import { Watch } from './pages/Watch';

const App: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  
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

  // Check 2-hour persistent modal logic
  useEffect(() => {
    const checkAccessTime = () => {
      const lastVisit = localStorage.getItem('last_visit_timestamp');
      const TWO_HOURS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      const now = Date.now();

      if (!lastVisit || (now - parseInt(lastVisit) > TWO_HOURS)) {
        setShowWelcomeModal(true);
      }
    };
    
    checkAccessTime();
  }, []);

  // Handle "Entrar" (go:main)
  const handleEnterSite = () => {
    localStorage.setItem('last_visit_timestamp', Date.now().toString());
    setShowWelcomeModal(false);
  };

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchChannels();
        
        // Inject "Favoritos" and "Recentes" categories
        const todosCat = data.categories.find(c => c.id === 0) || { id: 0, name: "Todos" };
        const otherCats = data.categories.filter(c => c.id !== 0);
        
        const enhancedCategories = [
          todosCat,
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
        {/* Welcome Modal / Aviso Overlay */}
        {showWelcomeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-card border border-gray-700 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
              
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Aviso Importante</h2>
              
              <p className="text-gray-300 mb-8 leading-relaxed">
                Este site utiliza links de terceiros e não hospeda conteúdo. Ao entrar, você concorda com os termos de uso. Esta mensagem aparecerá novamente em 2 horas.
              </p>

              <a 
                href="go:main"
                onClick={handleEnterSite}
                className="w-full bg-primary hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group decoration-none"
              >
                <span>ENTRAR</span>
                <CheckCircle2 className="w-5 h-5 group-hover:text-white/80" />
              </a>
            </div>
          </div>
        )}

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