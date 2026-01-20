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
  Minimize2,
  Sparkles,
  ExternalLink,
  Cast,
  Radio,
  Music2,
  Play,
  Pause
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateChannelDescription, Source } from '../services/aiService';
import { castMedia, requestSession, getCastContext, CAST_STATES, initializeCastApi } from '../services/castService';
import { InstallAppModal } from './InstallAppModal';

interface PlayerProps {
  channel: Channel;
}

export const Player: React.FC<PlayerProps> = ({ channel }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  // AI Description State
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<Source[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // UI States
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // New state for Play/Pause
  
  const controlsTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Audio Ref
  const audioRef = useRef<HTMLAudioElement>(null);

  // Cast State
  const [castState, setCastState] = useState<string>('NO_DEVICES_AVAILABLE');
  const [showInstallModal, setShowInstallModal] = useState(false);

  const isRadio = channel.categories.includes(-4);

  useEffect(() => {
    // Reset state when channel changes
    setIsLoading(true);
    setHasError(false);
    setIframeKey(prev => prev + 1);
    setIsPlaying(false);
    
    // Reset AI state
    setAiDescription(null);
    setAiSources([]);
    
    // Fetch AI Description (Skip for radios usually)
    const fetchDescription = async () => {
      setLoadingAi(true);
      const result = await generateChannelDescription(channel.name);
      if (result) {
        setAiDescription(result.text);
        setAiSources(result.sources);
      }
      setLoadingAi(false);
    };
    
    // Debounce slightly to avoid race conditions on rapid switching
    const timer = setTimeout(fetchDescription, 100);

    // Initialize Cast
    initializeCastApi();
    const setupCast = () => {
        const context = getCastContext();
        if (context) {
            setCastState(context.getCastState());
            const handler = (e: any) => setCastState(e.castState);
            context.addEventListener(window.cast.framework.CastContextEventType.CAST_STATE_CHANGED, handler);
            return () => context.removeEventListener(window.cast.framework.CastContextEventType.CAST_STATE_CHANGED, handler);
        }
    };
    
    // Try to setup cast listener
    const cleanupCast = setupCast();

    return () => {
        clearTimeout(timer);
        if (cleanupCast) cleanupCast();
    };

  }, [channel]);

  // Handle Audio Volume
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume / 100;
        audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleMediaLoad = () => {
    setIsLoading(false);
    if (isRadio && audioRef.current) {
        // Attempt to play and update state
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.log("Autoplay prevented:", error);
                setIsPlaying(false);
            });
        }
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.pause();
              setIsPlaying(false);
          } else {
              audioRef.current.play();
              setIsPlaying(true);
          }
      }
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
    // Force show controls when toggling
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isLoading) setShowControls(false);
    }, 3000);
  };

  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    setIframeKey(prev => prev + 1);
    if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
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
      if (!isLoading && (isPlaying || !isRadio)) { 
          // Only hide if playing (or if it's video mode)
          // If radio is paused, keep controls visible
          setShowControls(false);
      }
    }, 3000);
  }, [isLoading, isPlaying, isRadio]);

  const handleCastClick = () => {
    setShowInstallModal(true);
  };

  const handleInstallApp = () => {
      window.open("https://play.google.com/store/apps/details?id=cast.video.screenmirroring.casttotv&hl=pt_BR", "_blank");
      setShowInstallModal(false);
  };

  const handleNativeCast = async () => {
    setShowInstallModal(false);

    // Fallback logic
    if (castState === CAST_STATES.NO_DEVICES_AVAILABLE) {
        alert("Nenhum dispositivo Chromecast encontrado.");
        return;
    }

    if (castState === CAST_STATES.CONNECTED) {
        // Já está conectado, apenas manda a mídia
        castMedia(channel.url, channel.name, channel.image);
    } else {
        // Tenta conectar (User Gesture required)
        const connected = await requestSession();
        if (connected) {
            // Pequeno delay para garantir que a sessão está pronta antes de carregar
            setTimeout(() => {
                castMedia(channel.url, channel.name, channel.image);
            }, 500);
        }
    }
  };

  const isCastConnected = castState === CAST_STATES.CONNECTED;

  return (
    <div className={`transition-all duration-500 ${
      isCinemaMode 
        ? 'fixed inset-0 z-50 bg-black flex flex-col justify-center' 
        : 'w-full bg-dark pt-4 pb-6 relative'
    }`}>
      <InstallAppModal 
        isOpen={showInstallModal}
        onClose={handleNativeCast}
        onDismiss={() => setShowInstallModal(false)}
        onConfirm={handleInstallApp}
      />
      <div 
        className={`mx-auto transition-all duration-500 ${
          isCinemaMode 
            ? 'w-full h-full' 
            : 'container px-4 max-w-6xl'
        }`}
      >
        {/* Header Section - Hidden in Cinema Mode */}
        {!isCinemaMode && (
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
                    {isRadio && isPlaying && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                    <p className="text-sm text-gray-300 font-medium">
                      {channel.currentProgram || (isRadio ? "Rádio Ao Vivo" : "Transmissão Ao Vivo")}
                    </p>
                  </div>
               </div>
          </div>
        )}

        {/* Player Container */}
        <div 
          id="video-player-container" 
          ref={containerRef}
          className={`
            relative bg-black overflow-hidden group
            ${isCinemaMode 
              ? `w-full h-full ${!showControls ? 'cursor-none' : 'cursor-default'}` 
              : 'rounded-xl aspect-video w-full shadow-2xl ring-1 ring-white/10'
            }
          `}
          onMouseMove={handleInteraction}
          onClick={handleInteraction}
          onTouchStart={handleInteraction}
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 text-white">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-3" />
              <p className="text-base font-medium text-gray-300">
                  {isRadio ? 'Sintonizando Rádio...' : 'Carregando sinal...'}
              </p>
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
            <>
              {isRadio ? (
                  // AUDIO PLAYER VISUALIZATION
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-black flex flex-col items-center justify-center overflow-hidden">
                      
                      {/* Animated Background Pulse */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-20'}`}></div>
                      
                      {/* Dynamic "Sound Waves" Background */}
                      {isPlaying && (
                         <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <div className="w-[120%] h-[100px] bg-primary blur-[80px] animate-pulse"></div>
                         </div>
                      )}

                      {/* Vinyl/Logo Container */}
                      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-12">
                          
                          {/* Main Disc */}
                          <div className={`
                                relative w-48 h-48 md:w-64 md:h-64 rounded-full 
                                bg-gray-950 border-8 border-gray-800 shadow-2xl overflow-hidden 
                                flex items-center justify-center
                                transition-transform duration-[20s] ease-linear
                                ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}
                          `}>
                              {/* Inner Ring details for vinyl look */}
                              <div className="absolute inset-0 rounded-full border border-gray-700/30 m-2"></div>
                              <div className="absolute inset-0 rounded-full border border-gray-700/30 m-4"></div>
                              <div className="absolute inset-0 rounded-full border border-gray-700/30 m-8"></div>
                              
                              <img 
                                src={channel.image} 
                                alt={channel.name} 
                                className="w-2/3 h-2/3 object-contain z-10 rounded-full bg-white/5 backdrop-blur-sm p-2" 
                                onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png')}
                              />
                          </div>

                          {/* Equalizer Visualizer (Simulated) */}
                          <div className="h-12 flex items-end gap-1.5 mt-8 mb-4">
                              {[...Array(8)].map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-1.5 bg-primary rounded-t-full transition-all duration-300 ease-in-out ${isPlaying ? 'animate-[bounce_0.8s_infinite]' : 'h-1'}`}
                                    style={{ 
                                        animationDelay: `${i * 0.1}s`,
                                        height: isPlaying ? undefined : '4px',
                                        animationDuration: `${0.6 + (i % 3) * 0.2}s`
                                    }}
                                  ></div>
                              ))}
                          </div>
                          
                          {/* Live Badge */}
                          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                              {isPlaying ? (
                                  <>
                                      <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                      </span>
                                      <span className="text-xs font-bold text-white tracking-widest uppercase">No Ar</span>
                                  </>
                              ) : (
                                  <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Pausado</span>
                              )}
                          </div>
                      </div>

                      {/* Play/Pause Overlay - Center of Screen */}
                      <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                          <button 
                            onClick={togglePlay}
                            className="pointer-events-auto w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 transition-all hover:scale-110 active:scale-95 group"
                          >
                             {isPlaying ? (
                                 <Pause className="w-8 h-8 text-white fill-current" />
                             ) : (
                                 <Play className="w-8 h-8 text-white fill-current ml-1" />
                             )}
                          </button>
                      </div>

                      <audio
                        ref={audioRef}
                        key={iframeKey}
                        autoPlay
                        onCanPlay={handleMediaLoad}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onError={() => setHasError(true)}
                        src={channel.url}
                        className="hidden" 
                      />
                  </div>
              ) : (
                  // VIDEO PLAYER (IFRAME)
                  <iframe
                    key={iframeKey}
                    src={channel.url}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
                    onLoad={handleMediaLoad}
                    title={`Player ${channel.name}`}
                  />
              )}
            </>
          )}

          {/* Top Overlay for Cinema Mode Info & Exit */}
          {isCinemaMode && (
             <div className={`
                absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent 
                transition-opacity duration-300 flex justify-between items-start pointer-events-none
                ${showControls ? 'opacity-100' : 'opacity-0'}
             `}>
                <div className="flex items-center gap-3 pointer-events-auto">
                   <button onClick={toggleCinemaMode} className="p-2 bg-black/40 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors">
                      <ArrowLeft className="w-6 h-6" />
                   </button>
                   <div>
                     <h2 className="text-lg font-bold text-white drop-shadow-md">{channel.name}</h2>
                     <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isRadio ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        <p className="text-xs text-gray-300 font-medium">{channel.currentProgram || (isRadio ? "Rádio Ao Vivo" : "Ao Vivo")}</p>
                     </div>
                   </div>
                </div>
                
                <button 
                   onClick={toggleCinemaMode}
                   className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-primary/90 hover:bg-primary text-white rounded-lg backdrop-blur-sm shadow-lg transition-all"
                >
                   <Minimize2 className="w-4 h-4" />
                   <span className="font-bold text-sm">Sair do Cinema</span>
                </button>
             </div>
          )}

          {/* Bottom Controls Overlay */}
          <div 
            className={`
              absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent 
              transition-opacity duration-300 flex items-end justify-between gap-4
              ${showControls || isLoading || (isRadio && !isPlaying) ? 'opacity-100' : 'opacity-0'}
            `}
          >
             {/* Left Controls (Volume) */}
             <div className="flex items-center gap-3">
                {isRadio && (
                    <button 
                        onClick={togglePlay} 
                        className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors pointer-events-auto mr-2"
                    >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                )}

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
                
                {isRadio && (
                    <div className="hidden sm:flex items-center gap-2 text-white/80 text-xs font-mono ml-2">
                        <Music2 className="w-4 h-4 text-primary" />
                        <span>Stereo HQ</span>
                    </div>
                )}
             </div>

             {/* Right Controls (Modes) */}
             <div className="flex items-center gap-2 pointer-events-auto">
                {/* Cast Button - Always Visible to prompt App Install */}
                 <button 
                   onClick={handleCastClick}
                   className={`p-2.5 backdrop-blur-sm rounded-lg transition-colors ${
                     isCastConnected 
                       ? 'bg-blue-600 text-white hover:bg-blue-700' 
                       : 'text-white bg-black/40 hover:bg-blue-600'
                   }`}
                   title={isCastConnected ? "Conectado (Toque para transmitir)" : "Transmitir para TV"}
                 >
                   <Cast className="w-5 h-5" />
                 </button>

               <button 
                 onClick={toggleCinemaMode}
                 className="p-2.5 text-white bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-lg transition-colors flex items-center gap-2"
                 title={isCinemaMode ? "Sair do Modo Cinema" : "Modo Cinema"}
               >
                 {isCinemaMode ? <Minimize2 className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
                 <span className={`text-xs font-bold ${isCinemaMode ? 'hidden' : 'hidden sm:block'}`}>Cinema</span>
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

        {/* Footer Info & AI Description - Only visible when NOT in Cinema Mode */}
        {!isCinemaMode && (
          <div className="mt-6 p-5 bg-card rounded-xl border border-gray-800 shadow-lg">
             <div className="flex flex-col gap-4">
               
               {/* Header Info */}
               <div>
                 <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">Sobre o Canal</h3>
                    {loadingAi && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                 </div>
                 
                 {/* AI Content */}
                 <div className="relative">
                   {aiDescription ? (
                     <div className="prose prose-invert max-w-none">
                       <div className="flex gap-2 items-start">
                         <Sparkles className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                         <p className="text-gray-300 text-base leading-relaxed">
                           {aiDescription}
                         </p>
                       </div>
                     </div>
                   ) : (
                     <p className="text-gray-400 text-sm italic">
                       {loadingAi ? 'Gerando descrição inteligente...' : (channel.description || `Assistindo ${channel.name} ao vivo.`)}
                     </p>
                   )}
                 </div>
               </div>

               {/* Grounding Sources */}
               {aiSources.length > 0 && (
                 <div className="mt-2 pt-3 border-t border-gray-700/50">
                   <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fontes Verificadas</p>
                   <div className="flex flex-wrap gap-2">
                     {aiSources.slice(0, 3).map((source, idx) => (
                       <a 
                         key={idx}
                         href={source.uri}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-blue-400 hover:text-blue-300 transition-colors border border-gray-700"
                       >
                         <ExternalLink className="w-3 h-3" />
                         <span className="truncate max-w-[150px]">{source.title}</span>
                       </a>
                     ))}
                   </div>
                 </div>
               )}

               <div className="flex gap-4 pt-2">
                  <button onClick={() => setHasError(true)} className="text-sm text-red-400 hover:text-red-300 underline flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Informar problema no {isRadio ? 'áudio' : 'vídeo'}
                  </button>
               </div>

             </div>
          </div>
        )}
      </div>
    </div>
  );
};