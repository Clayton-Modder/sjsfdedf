import React, { useState, useEffect } from 'react';
import { Channel } from '../types';
import { Maximize2, X, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

interface PlayerProps {
  channel: Channel;
  onClose: () => void;
}

export const Player: React.FC<PlayerProps> = ({ channel, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    // Reset state when channel changes
    setIsLoading(true);
    setHasError(false);
    setIframeKey(prev => prev + 1);
  }, [channel]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleFullscreen = () => {
    const playerElement = document.getElementById('video-player-container');
    if (playerElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerElement.requestFullscreen();
      }
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="w-full bg-black/50 backdrop-blur-sm pt-4 pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-3 text-white">
          <div className="flex items-center gap-3">
             <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden"
                aria-label="Voltar"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                <h2 className="text-lg font-bold leading-tight line-clamp-1">{channel.name}</h2>
                <p className="text-xs text-green-400 font-medium animate-pulse">● Ao Vivo</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div 
          id="video-player-container" 
          className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 text-white">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
              <p className="text-sm font-medium text-gray-300">Carregando sinal...</p>
            </div>
          )}

          {/* 
            Note: We cannot easily detect iframe errors (404/Connection Refused) due to Cross-Origin policies.
            We provide a manual reload if it takes too long or appears broken.
          */}
          {hasError ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20 text-white p-4 text-center">
               <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
               <p className="text-lg font-bold mb-2">Não foi possível carregar o canal</p>
               <p className="text-gray-400 text-sm mb-6 max-w-sm">
                 O sinal pode estar indisponível ou bloqueado na sua região.
               </p>
               <button 
                 onClick={handleReload}
                 className="px-6 py-2 bg-primary hover:bg-red-600 rounded-full font-medium transition-colors"
               >
                 Tentar Novamente
               </button>
             </div>
          ) : (
            <iframe
              key={iframeKey}
              src={channel.url}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleIframeLoad}
              title={`Player ${channel.name}`}
            />
          )}

          {/* Player Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex justify-end">
             <button 
               onClick={handleFullscreen}
               className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
               title="Tela Cheia"
             >
               <Maximize2 className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
            <button 
              onClick={onClose} 
              className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-card transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para lista
            </button>
            <div className="flex gap-2">
                 <button 
                   onClick={() => setHasError(true)} 
                   className="text-xs text-gray-500 hover:text-red-400 underline decoration-dotted"
                 >
                   Reportar erro
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};