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
  Pause,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateChannelDescription, Source } from '../services/aiService';
import { castMedia, requestSession, getCastContext, CAST_STATES, initializeCastApi } from '../services/castService';
import { InstallAppModal } from './InstallAppModal';
import { useRadio } from '../contexts/RadioContext';
import { useEPG } from '../contexts/EPGContext';

interface PlayerProps {
  channel: Channel;
}

export const Player: React.FC<PlayerProps> = ({ channel }) => {
  const navigate = useNavigate();
  
  // Contexts
  const { 
    activeRadio, 
    isPlaying: isRadioPlaying, 
    isBuffering: isRadioBuffering,
    playRadio, 
    togglePlay: toggleRadioPlay 
  } = useRadio();

  const { getChannelEPG } = useEPG();

  const isRadio = channel.categories.includes(-4);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  // AI/EPG States
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [epgData, setEpgData] = useState<ReturnType<typeof getChannelEPG>>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // UI States
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  
  // Local state for Video (Radio uses context)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const controlsTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Cast State
  const [castState, setCastState] = useState<string>('NO_DEVICES_AVAILABLE');
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // Reset state when channel changes
    setHasError(false);
    setIframeKey(prev => prev + 1);
    
    if (!isRadio) {
        setIsLoading(true);
        setIsVideoPlaying(false);
    } else {
        setIsLoading(false);
        if (activeRadio?.id !== channel.id) {
            playRadio(channel);
        }
    }
    
    // EPG Data Update Loop
    const updateEPG = () => {
        const data = getChannelEPG(channel.name);
        setEpgData(data);
    };
    
    updateEPG(); // Initial fetch
    const epgInterval = setInterval(updateEPG, 60000); // Update every minute for progress bar

    // AI Description (Legacy fallback)
    setAiDescription(null);
    if (!epgData) { // Only fetch AI if no EPG
        const fetchDescription = async () => {
          setLoadingAi(true);
          const result = await generateChannelDescription(channel.name);
          if (result) {
            setAiDescription(result.text);
          }
          setLoadingAi(false);
        };
        fetchDescription();
    }
    
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
    
    const cleanupCast = setupCast();

    return () => {
        clearInterval(epgInterval);
        if (cleanupCast) cleanupCast();
    };

  }, [channel.id, channel.name, isRadio, getChannelEPG]);

  const isPlaying = isRadio ? isRadioPlaying : isVideoPlaying;
  const isBuffering = isRadio ? isRadioBuffering : isLoading;

  const handleVideoLoad = () => {
    setIsLoading(false);
    setIsVideoPlaying(true);
  };

  const handleTogglePlay = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (isRadio) {
          toggleRadioPlay();
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
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isLoading) setShowControls(false);
    }, 3000);
  };

  const handleReload = () => {
    if (isRadio) {
        playRadio(channel);
    } else {
        setIsLoading(true);
        setHasError(false);
        setIframeKey(prev => prev + 1);
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

  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isBuffering && (isPlaying || !isRadio)) { 
          setShowControls(false);
      }
    }, 3000);
  }, [isBuffering, isPlaying, isRadio]);

  const handleCastClick = () => {
    setShowInstallModal(true);
  };

  const handleInstallApp = () => {
      window.open("https://play.google.com/store/apps/details?id=cast.video.screenmirroring.casttotv&hl=pt_BR", "_blank");
      setShowInstallModal(false);
  };

  const handleNativeCast = async () => {
    setShowInstallModal(false);
    if (castState === CAST_STATES.NO_DEVICES_AVAILABLE) {
        alert("Nenhum dispositivo Chromecast encontrado.");
        return;
    }
    if (castState === CAST_STATES.CONNECTED) {
        castMedia(channel.url, channel.name, channel.image);
    } else {
        const connected = await requestSession();
        if (connected) {
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
               <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold leading-tight line-clamp-1">{channel.name}</h2>
                  <div className="flex items-center gap-2">
                    {isRadio && isPlaying && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                    <p className="text-sm text-gray-300 font-medium truncate">
                      {epgData ? (
                        <span className="text-primary font-bold uppercase">{epgData.title}</span>
                      ) : (
                        channel.currentProgram || (isRadio ? "Rádio Ao Vivo" : "Transmissão Ao Vivo")
                      )}
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
          {isBuffering && (
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
                 Não foi possível conectar ao servidor.
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
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-black flex flex-col items-center justify-center overflow-hidden">
                      {/* Radio Visualizer Code (Same as before) */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-20'}`}></div>
                      {isPlaying && (
                         <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <div className="w-[120%] h-[100px] bg-primary blur-[80px] animate-pulse"></div>
                         </div>
                      )}
                      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-12">
                          <div className={`
                                relative w-48 h-48 md:w-64 md:h-64 rounded-full 
                                bg-gray-950 border-8 border-gray-800 shadow-2xl overflow-hidden 
                                flex items-center justify-center
                                transition-transform duration-[20s] ease-linear
                                ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}
                          `}>
                              <img 
                                src={channel.image} 
                                alt={channel.name} 
                                className="w-2/3 h-2/3 object-contain z-10 rounded-full bg-white/5 backdrop-blur-sm p-2" 
                                onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png')}
                              />
                          </div>
                          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md mt-8">
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
                      <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                          <button 
                            onClick={handleTogglePlay}
                            className="pointer-events-auto w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 transition-all hover:scale-110 active:scale-95 group"
                          >
                             {isPlaying ? <Pause className="w-8 h-8 text-white fill-current" /> : <Play className="w-8 h-8 text-white fill-current ml-1" />}
                          </button>
                      </div>
                  </div>
              ) : (
                  <iframe
                    key={iframeKey}
                    src={channel.url}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
                    onLoad={handleVideoLoad}
                    title={`Player ${channel.name}`}
                  />
              )}
            </>
          )}

          {/* EPG Info Overlay (Visible when controls show) */}
          {epgData && (showControls || !isPlaying) && (
              <div className="absolute bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-30 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-2xl">
                      <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                              <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Agora</p>
                              <h3 className="text-white font-bold text-lg leading-tight">{epgData.title}</h3>
                          </div>
                          <div className="text-right">
                              <span className="text-xs font-mono text-gray-400 bg-black/50 px-1.5 py-0.5 rounded">
                                  {epgData.since} - {epgData.until}
                              </span>
                          </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden mb-2">
                          <div 
                              className="h-full bg-primary rounded-full transition-all duration-1000"
                              style={{ width: `${epgData.percentage}%` }}
                          ></div>
                      </div>
                      
                      {epgData.description && (
                          <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                              {epgData.description}
                          </p>
                      )}
                  </div>
              </div>
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
              ${showControls || (isRadio && !isPlaying) ? 'opacity-100' : 'opacity-0'}
            `}
          >
             {/* Left Controls */}
             <div className="flex items-center gap-3">
                {isRadio && (
                    <button 
                        onClick={handleTogglePlay} 
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
             </div>

             {/* Right Controls */}
             <div className="flex items-center gap-2 pointer-events-auto">
                 <button 
                   onClick={handleCastClick}
                   className={`p-2.5 backdrop-blur-sm rounded-lg transition-colors ${
                     isCastConnected 
                       ? 'bg-blue-600 text-white hover:bg-blue-700' 
                       : 'text-white bg-black/40 hover:bg-blue-600'
                   }`}
                   title={isCastConnected ? "Conectado" : "Transmitir"}
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

        {/* Footer Info & EPG Description - Only visible when NOT in Cinema Mode */}
        {!isCinemaMode && (
          <div className="mt-6 p-5 bg-card rounded-xl border border-gray-800 shadow-lg">
             <div className="flex flex-col gap-4">
               
               <div>
                 <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">Sobre o Canal</h3>
                    {loadingAi && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                 </div>
                 
                 <div className="relative">
                   {epgData ? (
                     <div className="prose prose-invert max-w-none">
                       <div className="flex gap-2 items-start">
                         <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                         <div>
                            <h4 className="font-bold text-gray-200">{epgData.title}</h4>
                            <p className="text-gray-400 text-sm leading-relaxed mt-1">
                               {epgData.description || "Sem descrição disponível para este programa."}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 font-mono">
                                Início: {epgData.since} • Término: {epgData.until}
                            </p>
                         </div>
                       </div>
                     </div>
                   ) : aiDescription ? (
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
                       {channel.description || `Assistindo ${channel.name} ao vivo.`}
                     </p>
                   )}
                 </div>
               </div>

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