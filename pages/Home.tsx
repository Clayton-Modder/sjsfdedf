import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { CategoryList } from '../components/CategoryList';
import { ChannelGrid } from '../components/ChannelGrid';
import { GameList } from '../components/GameList';
import { RadioList } from '../components/RadioList';
import { Channel, Category, Game, Radio } from '../types';
import { fetchGames } from '../services/dataService';

interface HomeProps {
  channels: Channel[];
  categories: Category[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  history: string[];
  radios: Radio[];
}

export const Home: React.FC<HomeProps> = ({ channels, categories, favorites, toggleFavorite, history, radios }) => {
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Games State
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState<boolean>(false);
  const [gamesLoaded, setGamesLoaded] = useState<boolean>(false);

  // Fetch games when category is selected
  useEffect(() => {
    if (activeCategoryId === -3 && !gamesLoaded) {
      setLoadingGames(true);
      fetchGames()
        .then(data => {
          setGames(data);
          setGamesLoaded(true);
        })
        .finally(() => setLoadingGames(false));
    }
  }, [activeCategoryId, gamesLoaded]);

  // Filter Logic for Channels
  const filteredChannels = useMemo(() => {
    // If we are in "Jogos" or "Rádios" mode, channel filtering doesn't matter much for the main grid
    if (activeCategoryId === -3 || activeCategoryId === -4) return [];

    let result: Channel[] = [];

    if (activeCategoryId === -2) {
      // Recentes: Map history IDs to channels to preserve order (newest first)
      result = history
        .map(id => channels.find(c => c.id === id))
        .filter((c): c is Channel => !!c);
    } else {
      // Standard Filtering
      result = channels.filter((channel) => {
        // Category Logic
        if (activeCategoryId === 0) return true; // Todos
        if (activeCategoryId === -1) {
          // Favoritos
          return favorites.includes(channel.id);
        }
        return channel.categories.includes(activeCategoryId);
      });
    }

    // Apply Search on top of category result
    if (searchQuery) {
      result = result.filter(channel => 
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [channels, activeCategoryId, searchQuery, favorites, history]);

  // Filter Logic for Games (Search only)
  const filteredGames = useMemo(() => {
    if (activeCategoryId !== -3) return [];
    if (!searchQuery) return games;
    
    const query = searchQuery.toLowerCase();
    
    return games.filter(g => {
        // Safe optional chaining to prevent crashes on bad data
        const titleMatch = g.title && g.title.toLowerCase().includes(query);
        const leagueMatch = g.data?.league && g.data.league.toLowerCase().includes(query);
        const homeMatch = g.data?.teams?.home?.name && g.data.teams.home.name.toLowerCase().includes(query);
        const awayMatch = g.data?.teams?.away?.name && g.data.teams.away.name.toLowerCase().includes(query);
        
        return titleMatch || leagueMatch || homeMatch || awayMatch;
    });
  }, [games, activeCategoryId, searchQuery]);

  // Filter Logic for Radios
  const filteredRadios = useMemo(() => {
    if (activeCategoryId !== -4) return [];
    if (!searchQuery) return radios;

    const query = searchQuery.toLowerCase();
    return radios.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.city.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
    );
  }, [radios, activeCategoryId, searchQuery]);

  const handleChannelSelect = (channel: Channel) => {
    navigate(`/watch/${channel.id}`);
  };

  const handleCategorySelect = (id: number) => {
    setActiveCategoryId(id);
    setSearchQuery(""); // Clear search on category change
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        searchTerm={searchQuery} 
        onSearch={setSearchQuery}
      />

      <CategoryList 
        categories={categories} 
        activeCategoryId={activeCategoryId} 
        onSelectCategory={handleCategorySelect} 
      />

      <div className="flex-1">
        <div className="container mx-auto px-4 py-4">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h2 className="text-xl font-bold text-white">
                {categories.find(c => c.id === activeCategoryId)?.name || 'Canais'}
                {searchQuery && <span className="text-gray-400 font-normal text-base ml-2">- Buscando por "{searchQuery}"</span>}
              </h2>
           </div>
           
           {activeCategoryId === -3 ? (
             <GameList games={filteredGames} loading={loadingGames} />
           ) : activeCategoryId === -4 ? (
             <RadioList radios={filteredRadios} />
           ) : (
             <ChannelGrid 
               channels={filteredChannels} 
               onSelectChannel={handleChannelSelect}
               favorites={favorites}
               onToggleFavorite={toggleFavorite}
             />
           )}
        </div>
      </div>
    </div>
  );
};