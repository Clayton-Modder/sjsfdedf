import React, { useState, useEffect } from 'react';
import { Channel } from '../types';
import { Maximize2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlayerProps {
  channel: Channel;
}

export const Player: React.FC<PlayerProps> = ({ channel }) => {
  const navigate = useNavigate();
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

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="w-full bg-dark pt-4 pb-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-4 mb-4 text-white">
             <button 
                onClick={handleBack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
                aria-label="Voltar"
             >
                <ArrowLeft className="w-6 h-6" />
             </button>
             <div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight line-clamp-1">{channel.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-sm text-gray-300 font-medium">
                    {channel.currentProgram || "Transmissão Ao Vivo"}
                  </p>
                </div>
             </div>
        </div>

        <div 
          id="video-player-container" 
          className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 text-white">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-3" />
              <p className="text-base font-medium text-gray-300">Carregando sinal...</p>
            </div>
          )}

          {hasError ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20 text-white p-4 text-center">
               <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
               <p className="text-xl font-bold mb-2">Sinal Indisponível</p>
               <p className="text-gray-400 text-base mb-6 max-w-md">
                 Não foi possível conectar ao servidor de streaming deste canal. Tente recarregar.
               </p>
               <button 
                 onClick={handleReload}
                 className="px-8 py-3 bg-primary hover:bg-red-600 rounded-full font-bold transition-colors shadow-lg shadow-primary/20"
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
               className="p-3 text-white hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
               title="Tela Cheia"
             >
               <Maximize2 className="w-6 h-6" />
             </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-card rounded-xl border border-gray-800">
           <h3 className="text-lg font-semibold mb-2 text-white">Informações do Canal</h3>
           <p className="text-gray-400">
             {channel.description || `Assistindo ${channel.name} ao vivo. A qualidade da transmissão depende da sua conexão com a internet.`}
           </p>
           <div className="mt-4 flex gap-4">
              <button onClick={() => setHasError(true)} className="text-sm text-red-400 hover:text-red-300 underline">
                Informar problema no canal
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};