import React from 'react';
import { Channel } from '../types';
import { Play } from 'lucide-react';

interface ChannelGridProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({ channels, onSelectChannel }) => {
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
        {channels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => onSelectChannel(channel)}
            className="group relative bg-card hover:bg-gray-700 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border border-gray-800 hover:border-gray-600"
          >
            {/* Image Aspect Ratio Container */}
            <div className="aspect-video w-full bg-gray-900 relative p-4 flex items-center justify-center">
              <img
                src={channel.image}
                alt={channel.name}
                loading="lazy"
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  // Fallback if image fails
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=random&color=fff`;
                }}
              />
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75">
                  <Play className="w-6 h-6 text-white fill-current ml-1" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 border-t border-gray-700/50">
              <h3 className="font-semibold text-gray-200 text-sm sm:text-base truncate text-center group-hover:text-primary transition-colors">
                {channel.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};