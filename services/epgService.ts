
import { EPGChannel, EPGProgram } from '../types';

// URL fornecida pelo usuário
const EPG_URL = 'http://nocable.cc:8080/xmltv.php?username=J0WfUK&password=016294';

// Lista de proxies para tentar em caso de falha
const PROXIES = [
    // CorsProxy.io é geralmente rápido e estável
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    // AllOrigins como fallback
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

export const fetchEPG = async (): Promise<EPGChannel[]> => {
  for (const createProxyUrl of PROXIES) {
      try {
        const proxyUrl = createProxyUrl(EPG_URL);
        console.log(`Tentando carregar EPG via: ${proxyUrl}`);
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            console.warn(`Falha no proxy ${proxyUrl}: ${response.status}`);
            continue;
        }
        
        const xmlText = await response.text();
        
        // Validação básica se é um XML válido
        if (!xmlText || (!xmlText.trim().startsWith('<') && !xmlText.includes('xmltv'))) {
             console.warn("Resposta inválida do proxy (não parece XML)");
             continue;
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // Verifica erro de parse
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            console.error("Erro ao fazer parse do XML");
            continue;
        }

        const epgChannels: EPGChannel[] = [];
        
        // 1. Parse Channels
        const channelElements = xmlDoc.getElementsByTagName('channel');
        const channelMap = new Map<string, EPGChannel>();

        for (let i = 0; i < channelElements.length; i++) {
          const el = channelElements[i];
          const id = el.getAttribute('id');
          const displayName = el.getElementsByTagName('display-name')[0]?.textContent || '';

          if (id) {
            const channelObj: EPGChannel = {
              id,
              displayName,
              programs: []
            };
            epgChannels.push(channelObj);
            channelMap.set(id, channelObj);
          }
        }

        // 2. Parse Programmes
        const programElements = xmlDoc.getElementsByTagName('programme');
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        for (let i = 0; i < programElements.length; i++) {
          const el = programElements[i];
          const channelId = el.getAttribute('channel');
          
          if (channelId && channelMap.has(channelId)) {
            const startRaw = el.getAttribute('start') || '';
            const stopRaw = el.getAttribute('stop') || '';
            
            // Parse XMLTV Date: YYYYMMDDHHMMSS +0000
            const parseDate = (dateStr: string) => {
                if (!dateStr) return new Date();
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                const hour = dateStr.substring(8, 10);
                const min = dateStr.substring(10, 12);
                const sec = dateStr.substring(12, 14);
                // O formato geralmente inclui timezone, mas Date() construtor com string ISO é mais seguro se formatarmos
                // Vamos assumir UTC se tiver o offset ou local se não tiver.
                return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
            };

            const startDate = parseDate(startRaw);
            const endDate = parseDate(stopRaw);

            // Otimização: Manter apenas programas relevantes (Agora +/- 24h)
            // Isso reduz drasticamente o uso de memória se o XML for grande
            if (endDate > twoHoursAgo && startDate < twentyFourHoursFromNow) { 
                 const title = el.getElementsByTagName('title')[0]?.textContent || 'Sem Título';
                 const desc = el.getElementsByTagName('desc')[0]?.textContent || '';

                 channelMap.get(channelId)?.programs.push({
                     title,
                     description: desc,
                     start: startDate,
                     end: endDate,
                     channelId
                 });
            }
          }
        }
        
        console.log(`EPG carregado com sucesso: ${epgChannels.length} canais processados.`);
        return epgChannels;

      } catch (error) {
        console.error("Erro ao carregar EPG:", error);
        // Continua para o próximo proxy
      }
  }
  
  return [];
};

// Helper para encontrar o programa atual dado um canal EPG
export const getCurrentProgram = (epgData: EPGChannel): EPGProgram | null => {
    const now = new Date();
    return epgData.programs.find(p => now >= p.start && now < p.end) || null;
};

// Helper para normalizar strings para comparação (Fuzzy match simples)
export const normalizeStr = (str: string) => {
    return str.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
              .replace(/[^a-z0-9]/g, "") // Remove caracteres especiais
              .replace("hd", "")
              .replace("fhd", "")
              .replace("br", "")
              .replace("4k", "")
              .trim();
};
