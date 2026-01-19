import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Channel } from '../types';
import { 
  Maximize2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Expand,
  Minimize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlayerProps {
  channel: Channel;
}

export const Player: React.FC<PlayerProps> = ({ channel }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  // UI States
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);

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

  const toggleCinemaMode = () => {
    setIsCinemaMode(!isCinemaMode);
  };

  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    setIframeKey(prev => prev + 1);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (newVol > 0 && isMuted) setIsMuted(false);
    if (newVol === 0) setIsMuted(true);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) setVolume(50);
  };

  // Interaction handlers for showing/hiding controls
  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  return (
    <div className={`w-full bg-dark transition-all duration-500 ${isCinemaMode ? 'py-0' : 'pt-4 pb-6'}`}>
      <div 
        className={`mx-auto transition-all duration-500 ${
          isCinemaMode ? 'max-w-full px-0' : 'container px-4 max-w-6xl'
        }`}
      >
        {/* Header Section - Hidden in Cinema Mode for immersion */}
        <div className={`flex items-center gap-4 mb-4 text-white transition-all duration-300 ${isCinemaMode ? 'h-0 opacity-0 overflow-hidden mb-0' : 'h-auto opacity-100'}`}>
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

        {/* Player Container */}
        <div 
          id="video-player-container" 
          className={`
            relative bg-black overflow-hidden shadow-2xl ring-1 ring-white/10 group
            transition-all duration-500
            ${isCinemaMode ? 'rounded-none h-[80vh] sm:h-[85vh]' : 'rounded-xl aspect-video w-full'}
          `}
          onMouseMove={handleInteraction}
          onClick={handleInteraction}
          onTouchStart={handleInteraction}
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
          <div 
            className={`
              absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent 
              transition-opacity duration-300 flex items-end justify-between gap-4
              ${showControls || isLoading ? 'opacity-100' : 'opacity-0'}
            `}
          >
             {/* Left Controls (Volume) */}
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 group/vol bg-black/40 backdrop-blur-sm p-2 rounded-lg hover:bg-black/60 transition-colors pointer-events-auto">
                  <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300 ease-out flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={isMuted ? 0 : volume} 
                      onChange={handleVolumeChange} 
                      className="h-1 w-20 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary" 
                    />
                  </div>
                </div>
             </div>

             {/* Right Controls (Modes) */}
             <div className="flex items-center gap-2 pointer-events-auto">
               <button 
                 onClick={toggleCinemaMode}
                 className="p-2.5 text-white bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-lg transition-colors hidden sm:flex items-center gap-2"
                 title={isCinemaMode ? "Modo Padrão" : "Modo Cinema"}
               >
                 {isCinemaMode ? <Minimize2 className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
                 <span className="text-xs font-bold">{isCinemaMode ? "Padrão" : "Cinema"}</span>
               </button>

               <button 
                 onClick={handleFullscreen}
                 className="p-2.5 text-white bg-black/40 backdrop-blur-sm hover:bg-primary rounded-lg transition-colors"
                 title="Tela Cheia"
               >
                 <Maximize2 className="w-5 h-5" />
               </button>
             </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-card rounded-xl border border-gray-800">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
               <h3 className="text-lg font-semibold mb-1 text-white">Informações do Canal</h3>
               <p className="text-gray-400 text-sm">
                 {channel.description || `Assistindo ${channel.name} ao vivo. A qualidade da transmissão depende da sua conexão com a internet.`}
               </p>
             </div>
             
             {isCinemaMode && (
               <button 
                onClick={toggleCinemaMode}
                className="text-primary text-sm font-medium hover:underline whitespace-nowrap"
               >
                 Sair do Modo Cinema
               </button>
             )}
           </div>
           
           <div className="mt-4 flex gap-4 border-t border-gray-700 pt-4">
              <button onClick={() => setHasError(true)} className="text-sm text-red-400 hover:text-red-300 underline flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Informar problema
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};