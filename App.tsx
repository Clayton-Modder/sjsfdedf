import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CategoryList } from './components/CategoryList';
import { Player } from './components/Player';
import { ChannelGrid } from './components/ChannelGrid';
import { fetchChannels } from './services/dataService';
import { Channel, Category } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchChannels();
        setCategories(data.categories);
        setChannels(data.channels);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsAppLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter Logic
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      const matchesCategory = activeCategoryId === 0 || channel.categories.includes(activeCategoryId);
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [channels, activeCategoryId, searchQuery]);

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (id: number) => {
    setActiveCategoryId(id);
    // Reset search when changing category for better UX, or keep it? Keeping it feels more standard.
  };

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
    <div className="min-h-screen flex flex-col bg-dark">
      {/* Header */}
      <Header 
        searchTerm={searchQuery} 
        onSearch={setSearchQuery} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Player Section - Conditionally Rendered */}
        {selectedChannel && (
          <Player 
            channel={selectedChannel} 
            onClose={() => setSelectedChannel(null)} 
          />
        )}

        {/* Categories Bar */}
        <CategoryList 
          categories={categories} 
          activeCategoryId={activeCategoryId} 
          onSelectCategory={handleCategorySelect} 
        />

        {/* Channels Grid */}
        <div className="flex-1">
          <div className="container mx-auto px-4 py-4">
             {/* Breadcrumb / Title */}
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
             />
          </div>
        </div>
      </main>

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

export default App;