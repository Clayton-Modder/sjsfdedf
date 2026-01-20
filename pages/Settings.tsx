import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Cast, 
  ChevronRight,
  ShieldCheck,
  Server,
  Database,
  RefreshCcw,
  Smartphone,
  Wifi,
  Loader2
} from 'lucide-react';
import { initializeCastApi, requestSession, getCastContext, endCurrentSession, CAST_STATES } from '../services/castService';

interface SettingsProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [castState, setCastState] = useState<string>('NO_DEVICES_AVAILABLE');
  const [currentSource, setCurrentSource] = useState<string>('default');
  const [isChangingSource, setIsChangingSource] = useState(false);

  useEffect(() => {
    // 1. Load Source Config
    const saved = localStorage.getItem('content_source');
    setCurrentSource(saved || 'default');

    // 2. Initialize Cast
    initializeCastApi();

    // 3. Setup Cast Listeners
    const setupCastListener = () => {
      const context = getCastContext();
      if (context) {
        // Set initial state
        setCastState(context.getCastState());

        // Listen for changes
        const eventHandler = (event: any) => {
          setCastState(event.castState);
        };
        
        context.addEventListener(
          window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
          eventHandler
        );

        return () => {
          context.removeEventListener(
            window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
            eventHandler
          );
        };
      }
    };

    // Retry finding context if it loads slowly
    const timer = setTimeout(setupCastListener, 1000);
    const cleanup = setupCastListener();

    return () => {
      clearTimeout(timer);
      if (cleanup) cleanup();
    };
  }, []);

  const handleCast = async () => {
    if (castState === CAST_STATES.NO_DEVICES_AVAILABLE) {
      alert("Nenhum dispositivo Chromecast encontrado na rede.");
      return;
    }

    if (castState === CAST_STATES.CONNECTED) {
        const confirmDisconnect = window.confirm("Desconectar do Chromecast?");
        if (confirmDisconnect) {
            endCurrentSession();
        }
    } else {
        // Fluxo Correto: Chamar requestSession no clique direto
        await requestSession();
    }
  };

  const handleSourceChange = (source: string) => {
    if (source === currentSource) return;
    
    const confirmChange = window.confirm(
      "Mudar a fonte reiniciará o aplicativo para carregar os novos canais. Deseja continuar?"
    );

    if (confirmChange) {
      setIsChangingSource(true);
      localStorage.setItem('content_source', source);
      
      localStorage.removeItem('megacanaistv_data_v2'); 
      localStorage.removeItem('reidoscanais_data_v1');

      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const isConnected = castState === CAST_STATES.CONNECTED;
  const isConnecting = castState === CAST_STATES.CONNECTING;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark transition-colors duration-300">
      <header className="bg-white dark:bg-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-800 dark:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Configurações</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        
        {/* Source Selection */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 px-2">Fonte de Canais</h2>
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
             
             <div 
               onClick={() => handleSourceChange('default')}
               className={`flex items-center justify-between p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800
                 ${currentSource === 'default' ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
               `}
             >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentSource === 'default' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                     <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold ${currentSource === 'default' ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                      Servidor Padrão
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Lista oficial curada (Estável)
                    </p>
                  </div>
                </div>
                {currentSource === 'default' && <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>}
             </div>

             <div 
               onClick={() => handleSourceChange('reidoscanais')}
               className={`flex items-center justify-between p-4 cursor-pointer transition-colors
                 ${currentSource === 'reidoscanais' ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
               `}
             >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentSource === 'reidoscanais' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                     <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${currentSource === 'reidoscanais' ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                        Servidor Alternativo
                      </p>
                      {isChangingSource && currentSource !== 'reidoscanais' && <RefreshCcw className="w-3 h-3 animate-spin text-gray-400"/>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Rei dos Canais (Lista Dinâmica)
                    </p>
                  </div>
                </div>
                {currentSource === 'reidoscanais' && <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>}
             </div>

          </div>
        </section>

        {/* Appearance */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 px-2">Aparência</h2>
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={toggleTheme}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-orange-500/10 text-orange-500'}`}>
                   {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Tema do Aplicativo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isDark ? 'Modo Escuro Ativado' : 'Modo Claro Ativado'}
                  </p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${isDark ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Transmission - ROBUST */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 px-2">Transmissão & Dispositivos</h2>
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div 
              className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors
                ${isConnected ? 'bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
              `}
              onClick={handleCast}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isConnected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-blue-500/10 text-blue-500'}`}>
                   {isConnecting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Cast className={`w-5 h-5`} />}
                </div>
                <div>
                  <p className={`font-semibold ${isConnected ? 'text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    Google Cast
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isConnected ? 'Conectado à TV' : (
                        castState === CAST_STATES.NO_DEVICES_AVAILABLE 
                            ? 'Nenhum dispositivo encontrado' 
                            : 'Toque para conectar'
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-4 overflow-x-auto">
                <div className="min-w-[100px] p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2 text-center">
                    <Smartphone className="w-6 h-6 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Este Celular</span>
                </div>
                 <div className={`min-w-[100px] p-3 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 text-center 
                    ${isConnected ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-200 dark:border-gray-700'}
                 `}>
                    <Wifi className={`w-6 h-6 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium text-gray-500">
                        {isConnected ? 'TV Conectada' : 'Buscar TV'}
                    </span>
                </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-center justify-center text-center mt-10 text-gray-400 text-sm gap-2">
           <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-2">
             <ShieldCheck className="w-6 h-6 text-gray-500" />
           </div>
           <p className="font-bold text-gray-600 dark:text-gray-300">Mega Canais TV v2.2.0</p>
        </div>

      </main>
    </div>
  );
};