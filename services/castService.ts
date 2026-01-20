/// <reference path="../types/global.d.ts" />

/**
 * SERVIÇO DE CHROMECAST (GOOGLE CAST)
 * 
 * Requisitos:
 * 1. O app deve rodar em HTTPS (ou localhost).
 * 2. As URLs de mídia devem ser diretas (.mp4, .m3u8).
 *    O Chromecast NÃO suporta iframes ou páginas HTML embutidas.
 */

export const initializeCastApi = (): void => {
  const init = () => {
    if (!window.chrome || !window.cast || !window.cast.framework) {
      console.warn("Cast framework not loaded yet.");
      return;
    }

    const context = window.cast.framework.CastContext.getInstance();
    
    context.setOptions({
      // Usar ID padrão para reprodução de vídeo genérico
      receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      // Pede para reconectar automaticamente se recarregar a página
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    console.log("Google Cast Initialized");
  };

  // Se a API já estiver disponível (carregou antes do React)
  if (window.chrome && window.cast && window.cast.framework) {
    init();
  } else {
    // Caso contrário, aguarda o evento disparado no index.html
    window.addEventListener('google-cast-ready', init);
  }
};

export const getCastSession = () => {
  if (!window.cast || !window.cast.framework) return null;
  return window.cast.framework.CastContext.getInstance().getCurrentSession();
};

export const requestSession = async (): Promise<boolean> => {
    if (!window.cast || !window.cast.framework) {
        alert("API do Chromecast não carregada.");
        return false;
    }
    try {
        await window.cast.framework.CastContext.getInstance().requestSession();
        return true;
    } catch (e) {
        console.error("Erro ao solicitar sessão Cast:", e);
        return false;
    }
};

export const castMedia = (mediaUrl: string, title: string, imageUrl?: string) => {
  const session = getCastSession();
  
  if (!session) {
    console.error("No active Cast session.");
    return;
  }

  // Validação importante: Chromecast não toca IFRAMES
  // Tentar detectar se é um embed HTML e avisar (lógica simplificada)
  if (!mediaUrl.includes('.mp4') && !mediaUrl.includes('.m3u8') && !mediaUrl.includes('googlevideo')) {
      console.warn("A URL fornecida parece ser uma página web, não um vídeo direto. O Chromecast pode falhar.");
  }

  const mediaInfo = new window.chrome.cast.media.MediaInfo(mediaUrl, 'video/mp4'); // Defaulting to mp4, but HLS works too usually if CORS allows
  
  // Metadados (Título, Imagem de Capa)
  mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
  mediaInfo.metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
  mediaInfo.metadata.title = title;
  
  if (imageUrl) {
    mediaInfo.metadata.images = [{ url: imageUrl }];
  }

  const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
  
  session.loadMedia(request).then(
    function() { console.log('Cast load succeed'); },
    function(errorCode: any) { console.error('Cast load error code:', errorCode); }
  );
};

export const endCurrentSession = () => {
    const session = getCastSession();
    if (session) {
        session.endSession(true);
    }
};
