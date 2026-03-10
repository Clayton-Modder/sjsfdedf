import React, { useEffect, useRef, useState } from 'react';
import { useRadio } from '../contexts/RadioContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, X, Radio as RadioIcon, Volume2, VolumeX, ChevronUp } from 'lucide-react';

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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // O Mini Player só aparece se tiver rádio ativa E não estivermos na página de detalhe da rádio
  const isWatchPage = location.pathname.includes('/watch/') && activeRadio && location.pathname.includes(activeRadio.id);
  const showMiniPlayer = activeRadio && !isWatchPage;

  // Lógica de Controle de Áudio
  useEffect(() => {
    if (!audioRef.current || !activeRadio) return;

    const audio = audioRef.current;

    if (audio.src !== activeRadio.url) {
      audio.src = activeRadio.url;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch(error => {
        console.error("Erro ao reproduzir:", error);
        setPlayingState(false);
      });
    } else {
      audio.pause();
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeRadio.name,
        artist: activeRadio.currentProgram || 'Rádio Online',
        artwork: [{ src: activeRadio.image, sizes: '512x512', type: 'image/png' }]
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('stop', () => stopRadio());
    }

  }, [activeRadio, isPlaying, togglePlay, stopRadio, setPlayingState]);

  // Controle de Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const expandPlayer = () => {
    if (activeRadio) {
      navigate(`/watch/${activeRadio.id}`);
    }
  };

  // CSS para as barras de áudio
  const AudioBars = () => (
    <div className="flex items-end gap-[2px] h-4">
      <div className={`w-1 bg-primary rounded-t-sm ${isPlaying ? 'animate-[bounce_1s_infinite]' : 'h-1'}`}></div>
      <div className={`w-1 bg-primary rounded-t-sm ${isPlaying ? 'animate-[bounce_1.2s_infinite]' : 'h-2'}`}></div>
      <div className={`w-1 bg-primary rounded-t-sm ${isPlaying ? 'animate-[bounce_0.8s_infinite]' : 'h-3'}`}></div>
      <div className={`w-1 bg-primary rounded-t-sm ${isPlaying ? 'animate-[bounce_1.1s_infinite]' : 'h-1'}`}></div>
    </div>
  );

  return (
    <>
      <audio
        ref={audioRef}
        onCanPlay={() => setBufferingState(false)}
        onWaiting={() => setBufferingState(true)}
        onPlaying={() => { setPlayingState(true); setBufferingState(false); }}
        onPause={() => setPlayingState(false)}
        onError={() => { setPlayingState(false); setBufferingState(false); }}
        style={{ display: 'none' }}
      />

      {showMiniPlayer && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
            {/* Barra de Progresso Infinita (Estética) */}
            {isPlaying && (
                <div className="w-full h-0.5 bg-gray-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent w-full animate-[shimmer_2s_infinite_-1s]"></div>
                </div>
            )}
            
            <div className="bg-gray-900/90 backdrop-blur-xl border-t border-white/10 p-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="container mx-auto max-w-6xl flex items-center justify-between gap-4">
              
              {/* Info Area */}
              <div 
                className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer group"
                onClick={expandPlayer}
              >
                <div className="relative">
                  <div className={`absolute inset-0 bg-primary/20 blur-lg rounded-full ${isPlaying ? 'animate-pulse' : 'hidden'}`}></div>
                  <img 
                    src={activeRadio.image} 
                    alt={activeRadio.name} 
                    className={`relative w-12 h-12 object-cover rounded-xl border border-white/10 shadow-lg ${isPlaying ? '' : 'grayscale'}`}
                    onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png')}
                  />
                  <div className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 border border-white/10">
                    <RadioIcon className="w-3 h-3 text-primary" />
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">
                      {activeRadio.name}
                    </h4>
                    {isPlaying && <div className="hidden sm:block"><AudioBars /></div>}
                  </div>
                  <span className="text-xs text-gray-400 truncate font-medium">
                    {activeRadio.currentProgram || 'Ao Vivo'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 md:gap-6">
                
                {/* Volume Control (Desktop) */}
                <div className="hidden md:flex items-center gap-2 group/vol">
                  <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-gray-400 hover:text-white">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-white/20"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-1" />
                      )}
                    </button>

                    <button 
                       onClick={(e) => { e.stopPropagation(); expandPlayer(); }}
                       className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors border border-white/5 hidden sm:block"
                       title="Expandir"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </button>

                    <button 
                      onClick={(e) => { e.stopPropagation(); stopRadio(); }}
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                      title="Fechar"
                    >
                      <X className="w-6 h-6" />
                    </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};