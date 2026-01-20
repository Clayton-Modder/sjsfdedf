/// <reference path="../types/global.d.ts" />

/**
 * SERVIÇO DE CHROMECAST (GOOGLE CAST)
 * 
 * Correção para "session_error":
 * 1. Inicialização imediata.
 * 2. requestSession deve ser chamado APENAS via clique direto do usuário.
 * 3. Monitoramento de estado (CastState) para saber se há devices.
 */

// Tipos de Estado do Cast (Enum do Google)
export const CAST_STATES = {
  NO_DEVICES_AVAILABLE: 'NO_DEVICES_AVAILABLE',
  NOT_CONNECTED: 'NOT_CONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED'
};

export const initializeCastApi = (): void => {
  const init = () => {
    if (!window.chrome || !window.cast || !window.cast.framework) {
      console.warn("Cast framework not loaded yet.");
      return;
    }

    const context = window.cast.framework.CastContext.getInstance();
    
    // Configuração crítica para evitar session_error
    context.setOptions({
      receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    console.log("Google Cast Initialized");
  };

  // Se a API já estiver disponível
  if (window.chrome && window.cast && window.cast.framework) {
    init();
  } else {
    // Aguarda callback global
    window.addEventListener('google-cast-ready', init);
  }
};

export const getCastContext = () => {
  if (window.cast && window.cast.framework) {
    return window.cast.framework.CastContext.getInstance();
  }
  return null;
};

export const getCastSession = () => {
  const context = getCastContext();
  return context ? context.getCurrentSession() : null;
};

// Solicita conexão - DEVE SER CHAMADO DENTRO DE UM ONCLICK
export const requestSession = async (): Promise<boolean> => {
    const context = getCastContext();
    
    if (!context) {
        alert("O serviço Google Cast ainda não foi carregado. Aguarde alguns segundos.");
        return false;
    }

    try {
        // Ação síncrona com o clique do usuário é mandatória aqui
        console.log("Solicitando sessão Cast...");
        await context.requestSession();
        return true;
    } catch (e: any) {
        console.error("Erro ao solicitar sessão Cast:", e);
        
        if (e === 'cancel') {
            // Usuário fechou a janela de diálogo
            return false;
        }
        
        if (e === 'session_error' || e.code === 'session_error') {
            alert("Erro de Sessão: Verifique se você está na mesma rede Wi-Fi do Chromecast e se o dispositivo está ligado.");
        } else {
            alert(`Não foi possível conectar: ${e.description || e}`);
        }
        
        return false;
    }
};

export const castMedia = async (mediaUrl: string, title: string, imageUrl?: string) => {
  const session = getCastSession();
  
  if (!session) {
    console.error("Tentativa de transmitir sem sessão ativa.");
    return;
  }

  // Validação de URL
  if (!mediaUrl.includes('.mp4') && !mediaUrl.includes('.m3u8') && !mediaUrl.includes('googlevideo')) {
      console.warn("ALERTA: O Chromecast não suporta iFrames ou páginas HTML. A transmissão falhará se a URL não for um vídeo direto.");
  }

  const mediaInfo = new window.chrome.cast.media.MediaInfo(mediaUrl, 'video/mp4');
  
  mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
  mediaInfo.metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
  mediaInfo.metadata.title = title;
  
  if (imageUrl) {
    mediaInfo.metadata.images = [{ url: imageUrl }];
  }

  const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
  
  try {
      await session.loadMedia(request);
      console.log('Mídia carregada com sucesso no Chromecast');
  } catch (error) {
      console.error('Erro ao carregar mídia no Chromecast:', error);
      alert("O Chromecast não conseguiu reproduzir este formato de vídeo.");
  }
};

export const endCurrentSession = () => {
    const session = getCastSession();
    if (session) {
        session.endSession(true);
    }
};
