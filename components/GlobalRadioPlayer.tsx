import React, { useEffect, useRef } from 'react';
import { useRadio } from '../contexts/RadioContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, X, Radio as RadioIcon, Loader2, Maximize2 } from 'lucide-react';

export const GlobalRadioPlayer: React.FC = () => {
  const { 
    activeRadio, 
    isPlaying, 
    togglePlay, 
    stopRadio, 
    setBufferingState, 
    setPlayingState 
  } = useRadio();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // O Mini Player só aparece se tiver rádio ativa E não estivermos na página de detalhe da rádio
  // Se estivermos na página /watch/ID-DA-RADIO, o player grande assume o visual, mas o áudio vem daqui
  const isWatchPage = location.pathname.includes('/watch/') && activeRadio && location.pathname.includes(activeRadio.id);
  const showMiniPlayer = activeRadio && !isWatchPage;

  // Lógica de Controle de Áudio
  useEffect(() => {
    if (!audioRef.current || !activeRadio) return;

    const audio = audioRef.current;

    // Se mudou a fonte (nova rádio)
    if (audio.src !== activeRadio.url) {
      audio.src = activeRadio.url;
      audio.load();
    }

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Erro ao reproduzir:", error);
          setPlayingState(false);
        });
      }
    } else {
      audio.pause();
    }

    // Media Session API (Para controle na tela de bloqueio/notificações)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeRadio.name,
        artist: activeRadio.currentProgram || 'Rádio Online',
        album: 'Mega Canais TV',
        artwork: [
          { src: activeRadio.image, sizes: '96x96', type: 'image/png' },
          { src: activeRadio.image, sizes: '128x128', type: 'image/png' },
          { src: activeRadio.image, sizes: '192x192', type: 'image/png' },
          { src: activeRadio.image, sizes: '512x512', type: 'image/png' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('stop', () => stopRadio());
    }

  }, [activeRadio, isPlaying, togglePlay, stopRadio, setPlayingState]);

  // Event Listeners do Audio
  const handleCanPlay = () => setBufferingState(false);
  const handleWaiting = () => setBufferingState(true);
  const handlePlaying = () => {
    setPlayingState(true);
    setBufferingState(false);
  };
  const handlePause = () => setPlayingState(false);
  const handleError = () => {
    setPlayingState(false);
    setBufferingState(false);
    console.error("Erro no stream de áudio");
  };

  const expandPlayer = () => {
    if (activeRadio) {
      navigate(`/watch/${activeRadio.id}`);
    }
  };

  return (
    <>
      {/* Elemento de Áudio Persistente (Invisível) */}
      <audio
        ref={audioRef}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onPause={handlePause}
        onError={handleError}
        style={{ display: 'none' }}
      />

      {/* Mini Player Flutuante */}
      {showMiniPlayer && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-3 shadow-2xl">
            <div className="container mx-auto max-w-6xl flex items-center justify-between gap-3">
              
              {/* Info Area (Click to expand) */}
              <div 
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
                onClick={expandPlayer}
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <img 
                    src={activeRadio.image} 
                    alt={activeRadio.name} 
                    className={`w-full h-full object-cover rounded-full border-2 border-gray-700 ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                    onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png')}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-0.5">
                    <RadioIcon className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden">
                  <h4 className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">
                    {activeRadio.name}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {isPlaying && (
                       <div className="flex items-end gap-0.5 h-3">
                         <span className="w-0.5 h-full bg-green-500 animate-[bounce_1s_infinite]"></span>
                         <span className="w-0.5 h-full bg-green-500 animate-[bounce_1.2s_infinite]"></span>
                         <span className="w-0.5 h-full bg-green-500 animate-[bounce_0.8s_infinite]"></span>
                       </div>
                    )}
                    <span className="text-xs text-gray-400 truncate">
                      {activeRadio.currentProgram || 'Tocando em segundo plano'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button 
                   onClick={(e) => { e.stopPropagation(); expandPlayer(); }}
                   className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block"
                   title="Expandir"
                >
                    <Maximize2 className="w-5 h-5" />
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); stopRadio(); }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Fechar Rádio"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};