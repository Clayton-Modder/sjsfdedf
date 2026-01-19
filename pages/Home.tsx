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
  onOpenAI: () => void;
}

export const Home: React.FC<HomeProps> = ({ channels, categories, favorites, toggleFavorite, onOpenAI }) => {
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter Logic
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      // Search Logic
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Category Logic
      if (activeCategoryId === 0) return true; // Todos
      if (activeCategoryId === -1) {
        // Favoritos
        return favorites.includes(channel.id);
      }
      return channel.categories.includes(activeCategoryId);
    });
  }, [channels, activeCategoryId, searchQuery, favorites]);

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
        onOpenAI={onOpenAI}
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
      
      {/* Simple Footer */}
      <footer className="bg-card py-6 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 MegaTV. Projeto Demo. <br className="sm:hidden"/>
            Não hospedamos nenhum vídeo.
          </p>
        </div>
      </footer>
    </div>
  );
};