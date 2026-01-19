import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { CategoryList } from '../components/CategoryList';
import { ChannelGrid } from '../components/ChannelGrid';
import { Channel, Category } from '../types';

interface HomeProps {
  channels: Channel[];
  categories: Category[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  history: string[];
}

export const Home: React.FC<HomeProps> = ({ channels, categories, favorites, toggleFavorite, history }) => {
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter Logic
  const filteredChannels = useMemo(() => {
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

  const handleChannelSelect = (channel: Channel) => {
    navigate(`/watch/${channel.id}`);
  };

  const handleCategorySelect = (id: number) => {
    setActiveCategoryId(id);
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
           
           <ChannelGrid 
             channels={filteredChannels} 
             onSelectChannel={handleChannelSelect}
             favorites={favorites}
             onToggleFavorite={toggleFavorite}
           />
        </div>
      </div>
    </div>
  );
};