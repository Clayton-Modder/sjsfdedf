import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Cast, 
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Wifi,
  Loader2,
  Trash2,
  LifeBuoy
} from 'lucide-react';
import { initializeCastApi, requestSession, getCastContext, endCurrentSession, CAST_STATES } from '../services/castService';
import { InstallAppModal } from '../components/InstallAppModal';

interface SettingsProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [castState, setCastState] = useState<string>('NO_DEVICES_AVAILABLE');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  useEffect(() => {
    // 1. Initialize Cast
    initializeCastApi();

    // 2. Setup Cast Listeners
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

  const handleCastClick = () => {
      setShowInstallModal(true);
  };

  const handleInstallApp = () => {
      window.open("https://play.google.com/store/apps/details?id=cast.video.screenmirroring.casttotv&hl=pt_BR", "_blank");
      setShowInstallModal(false);
  };

  const handleNativeCast = async () => {
    setShowInstallModal(false);
    
    // Fallback Nativo
    if (castState === CAST_STATES.NO_DEVICES_AVAILABLE) {
      alert("Nenhum dispositivo Chromecast encontrado na rede pelo navegador.");
      return;
    }

    if (castState === CAST_STATES.CONNECTED) {
        const confirmDisconnect = window.confirm("Desconectar do Chromecast?");
        if (confirmDisconnect) {
            endCurrentSession();
        }
    } else {
        await requestSession();
    }
  };

  const handleClearCacheClick = () => {
    setShowClearCacheModal(true);
  };

  const confirmClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    window.location.reload();
  };

  const handleSupport = () => {
    // Verifica se está rodando em navegador comum/desktop para evitar erros com protocolo "go:"
    // Se o userAgent indicar Android/iOS, assumimos que pode ser o WebView do App
    const isMobileApp = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Se for Desktop ou Localhost, exibe alerta (Modo Web)
    if (!isMobileApp || isLocalhost) {
      alert("A função de suporte está disponível apenas no aplicativo.");
    } else {
      // Redirecionamento interno AppCreator24
      // Isso aciona a navegação nativa do WebView para a seção de suporte
      window.location.href = "go:sup";
    }
  };

  const isConnected = castState === CAST_STATES.CONNECTED;
  const isConnecting = castState === CAST_STATES.CONNECTING;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark transition-colors duration-300">
      <InstallAppModal 
        isOpen={showInstallModal}
        onClose={handleNativeCast}
        onDismiss={() => setShowInstallModal(false)}
        onConfirm={handleInstallApp}
      />

      {/* Clear Cache Modal */}
      {showClearCacheModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100 dark:border-red-500/30">
                        <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        Limpar Cache?
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                        Isso irá apagar favoritos, histórico e dados temporários para corrigir problemas. O app será recarregado.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowClearCacheModal(false)}
                            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmClearCache}
                            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/25"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <header className="bg-white dark:bg-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-800 dark:text-white"
            title="Voltar para a página inicial"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Configurações</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        
        {/* Appearance */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 px-2">Aparência</h2>
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={toggleTheme}
              title={`Mudar para modo ${isDark ? 'claro' : 'escuro'}`}
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
              onClick={handleCastClick}
              title="Configurar transmissão para TV"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isConnected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-blue-500/10 text-blue-500'}`}>
                   {isConnecting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Cast className={`w-5 h-5`} />}
                </div>
                <div>
                  <p className={`font-semibold ${isConnected ? 'text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    Google Cast / Recomendado
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isConnected ? 'Conectado à TV' : 'Conectar ou baixar app'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-4 overflow-x-auto">
                <div 
                  className="min-w-[100px] p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2 text-center"
                  title="Dispositivo atual em uso"
                >
                    <Smartphone className="w-6 h-6 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Este Celular</span>
                </div>
                 <div 
                    className={`min-w-[100px] p-3 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 text-center 
                      ${isConnected ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-200 dark:border-gray-700'}
                    `}
                    title={isConnected ? "TV Conectada" : "Nenhuma TV conectada"}
                 >
                    <Wifi className={`w-6 h-6 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium text-gray-500">
                        {isConnected ? 'TV Conectada' : 'Buscar TV'}
                    </span>
                </div>
            </div>
          </div>
        </section>

        {/* System & Support */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 px-2">Sistema & Suporte</h2>
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            
            {/* Clear Cache */}
            <div 
              className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={handleClearCacheClick}
              title="Limpar dados salvos e recarregar o aplicativo"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                   <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Limpar Cache</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Corrigir problemas de carregamento
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Support */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={handleSupport}
              title="Entrar em contato com o suporte"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                   <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Suporte</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Fale com nossa equipe
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

          </div>
        </section>

        <div className="flex flex-col items-center justify-center text-center mt-10 text-gray-400 text-sm gap-2">
           <div 
             className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-2"
             title="Verificado e Seguro"
           >
             <ShieldCheck className="w-6 h-6 text-gray-500" />
           </div>
           <p className="font-bold text-gray-600 dark:text-gray-300">TV Online HD v2.2.0</p>
        </div>

      </main>
    </div>
  );
};