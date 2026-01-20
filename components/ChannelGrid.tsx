import React, { useState, useEffect, useRef } from 'react';
import { Channel } from '../types';
import { Play, Tv, Loader2, Heart } from 'lucide-react';
import { useEPG } from '../contexts/EPGContext';

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: () => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, isFavorite, onToggleFavorite, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // EPG Hook
  const { getChannelEPG } = useEPG();
  const epgData = getChannelEPG(channel.name);

  // Helper to extract initials
  const getInitials = (name: string) => {
    return name
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'TV';
  };

  const hasImage = !!channel.image && channel.image.trim() !== '';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(channel.id);
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-card hover:bg-gray-700 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border border-gray-800 hover:border-gray-600 flex flex-col h-full"
    >
      <div className="aspect-video w-full bg-gray-900 relative p-4 flex items-center justify-center">
        
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 opacity-100 sm:opacity-0"
          title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Heart 
            className={`w-5 h-5 transition-colors duration-200 ${isFavorite ? 'text-primary fill-primary' : 'text-white hover:text-primary'}`} 
          />
        </button>

        {hasImage && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}
            <img
              src={channel.image}
              alt={channel.name}
              loading="lazy"
              decoding="async"
              className={`max-h-full max-w-full object-contain transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 rounded-lg select-none">
             <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-2 shadow-inner">
               <Tv className="w-6 h-6 text-gray-500" />
             </div>
             <span className="text-lg font-bold text-gray-400 tracking-wider">
               {getInitials(channel.name)}
             </span>
           </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75">
            <Play className="w-6 h-6 text-white fill-current ml-1" />
          </div>
        </div>

        {/* EPG Progress Bar on Card (Visual Flair) */}
        {epgData && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/50">
                <div 
                    className="h-full bg-primary" 
                    style={{ width: `${epgData.percentage}%` }}
                ></div>
            </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700/50 flex-1 flex flex-col justify-center gap-1">
        <h3 className="font-semibold text-gray-200 text-sm sm:text-base truncate text-center group-hover:text-primary transition-colors">
          {channel.name}
        </h3>
        
        <div className="flex items-center justify-center gap-1.5 w-full">
              {epgData ? (
                  <p className="text-xs text-primary font-medium truncate max-w-full opacity-90">
                    {epgData.title}
                  </p>
              ) : (channel.currentProgram || channel.description) ? (
                  <>
                      {channel.currentProgram && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" title="Ao Vivo"></span>
                      )}
                      <p className="text-xs text-gray-400 truncate max-w-full opacity-80 group-hover:opacity-100 transition-opacity">
                        {channel.currentProgram || channel.description}
                      </p>
                  </>
              ) : null}
        </div>
      </div>
    </div>
  );
};

interface ChannelGridProps {
  channels: Channel[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectChannel: (channel: Channel) => void;
}

const ITEMS_PER_PAGE = 24;

export const ChannelGrid: React.FC<ChannelGridProps> = ({ channels, favorites, onToggleFavorite, onSelectChannel }) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [channels]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, channels.length));
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [channels.length]);

  const visibleChannels = channels.slice(0, visibleCount);

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg">Nenhum canal encontrado.</p>
        <p className="text-sm">Tente mudar a categoria ou sua busca.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {visibleChannels.map((channel) => (
          <ChannelCard 
            key={channel.id} 
            channel={channel} 
            isFavorite={favorites.includes(channel.id)}
            onToggleFavorite={onToggleFavorite}
            onClick={() => onSelectChannel(channel)} 
          />
        ))}
      </div>
      
      {visibleCount < channels.length && (
        <div 
          ref={observerRef} 
          className="w-full py-8 flex justify-center items-center"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
    </div>
  );
};