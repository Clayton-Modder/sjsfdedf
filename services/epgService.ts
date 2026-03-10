import { EPGChannel, EPGProgram } from '../types';

// Lista de URLs XMLTV para tentar (Canais Brasileiros)
const EPG_URLS = [
  'https://iptv-org.github.io/epg/guides/br.xml',
  'https://raw.githubusercontent.com/LITUATUI/IPTV-Brasil/master/epg.xml',
  'https://epg.pw/xmltv/guide_br.xml',
  'https://iptv-org.github.io/epg/guides/br/sky.com.br.xml'
];

// Lista de proxies para contornar bloqueios de CORS e Mixed Content
const PROXIES = [
  // 1. Local Proxy (Bypass CORS via Server) - O mais confiável pois roda no backend
  (url: string) => `/api/proxy?url=${encodeURIComponent(url)}`,
  // 2. CorsProxy.io: Rápido e confiável
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  // 3. AllOrigins: Fallback robusto
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  // 4. CodeTabs
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  // 5. Proxy.cors.sh
  (url: string) => `https://proxy.cors.sh/${url}`,
  // 6. ThingProxy
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
];

/**
 * Parse seguro de data XMLTV
 * Formato padrão: YYYYMMDDHHMMSS +0000 ou YYYYMMDDHHMMSS -0300
 */
const parseXMLTVDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(0);
  
  // Remove espaços e caracteres não numéricos do início
  const cleanDate = dateStr.replace(/[^0-9+\- ]/g, '').trim();
  if (cleanDate.length < 14) return new Date(0);

  const year = cleanDate.slice(0, 4);
  const month = cleanDate.slice(4, 6);
  const day = cleanDate.slice(6, 8);
  const hour = cleanDate.slice(8, 10);
  const min = cleanDate.slice(10, 12);
  const sec = cleanDate.slice(12, 14);

  // Tenta extrair o offset
  let offset = 'Z';
  const tzMatch = cleanDate.match(/([+\-]\d{4})$/);
  if (tzMatch) {
    const tz = tzMatch[1];
    offset = `${tz.slice(0, 3)}:${tz.slice(3, 5)}`;
  }

  const isoString = `${year}-${month}-${day}T${hour}:${min}:${sec}${offset}`;
  const date = new Date(isoString);
  
  // Se a data for inválida, tenta sem offset (assume local)
  if (isNaN(date.getTime())) {
    return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
  }
  
  return date;
};

export const fetchEPG = async (): Promise<EPGChannel[]> => {
  // Tenta cada URL na lista
  for (const epgUrl of EPG_URLS) {
    // Para cada URL, tenta os proxies se for HTTP ou se falhar direto
    const isHttp = epgUrl.startsWith('http:');
    
    // Se for HTTPS, tenta direto primeiro
    if (!isHttp) {
      try {
        console.log(`[EPG] Tentando carregar direto: ${epgUrl}`);
        const result = await tryFetch(epgUrl);
        if (result && result.length > 0) return result;
      } catch (e) {
        console.warn(`[EPG] Falha ao carregar direto ${epgUrl}, tentando via proxy...`);
      }
    }

    // Tenta cada proxy na lista
    for (const createProxyUrl of PROXIES) {
      const proxyUrl = createProxyUrl(epgUrl);
      try {
        const proxyName = proxyUrl.includes('/api/proxy') ? 'Local Server Proxy' : proxyUrl.split('/')[2];
        console.log(`[EPG] Tentando via ${proxyName} para: ${epgUrl}`);
        const result = await tryFetch(proxyUrl);
        if (result && result.length > 0) return result;
      } catch (error) {
        // Erros já são logados no tryFetch
      }
    }
  }

  console.error('[EPG] Todas as tentativas de conexão falharam.');
  return [];
};

/**
 * Função auxiliar para realizar o fetch e parse do XML
 */
async function tryFetch(url: string): Promise<EPGChannel[] | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // Aumentado para 30s

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[EPG] Resposta não OK (${response.status}) para: ${url}`);
      return null;
    }

    const xmlText = await response.text();

    if (!xmlText || (!xmlText.trim().startsWith('<') && !xmlText.includes('<tv'))) {
      console.warn(`[EPG] Conteúdo não parece XML para: ${url}`);
      return null;
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    if (xmlDoc.querySelector('parsererror')) {
      return null;
    }

    const channelMap = new Map<string, EPGChannel>();

    // ===== 1. Processar Canais =====
    xmlDoc.querySelectorAll('channel').forEach((el) => {
      const id = el.getAttribute('id');
      const displayName = el.querySelector('display-name')?.textContent?.trim() || '';

      if (id) {
        channelMap.set(id, { id, displayName, programs: [] });
      }
    });

    // Definição de janela de tempo
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // ===== 2. Processar Programas =====
    const programs = xmlDoc.querySelectorAll('programme');
    
    programs.forEach((el) => {
      const channelId = el.getAttribute('channel');
      if (!channelId || !channelMap.has(channelId)) return;

      const start = parseXMLTVDate(el.getAttribute('start') || '');
      const end = parseXMLTVDate(el.getAttribute('stop') || '');

      if (end < twoHoursAgo || start > next24h) return;

      const title = el.querySelector('title')?.textContent?.trim() || 'Sem título';
      const desc = el.querySelector('desc')?.textContent?.trim() || '';

      channelMap.get(channelId)!.programs.push({
        title,
        description: desc,
        start,
        end,
        channelId
      });
    });

    const result = Array.from(channelMap.values()).filter(c => c.programs.length > 0);
    if (result.length > 0) {
      console.log(`[EPG] Sucesso! ${result.length} canais carregados.`);
      return result;
    }
    console.warn(`[EPG] Nenhum programa encontrado na janela de tempo para: ${url}`);
    return null;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.warn(`[EPG] Timeout (15s) para: ${url}`);
    } else {
      console.error(`[EPG] Erro ao buscar ${url}:`, e.message);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ===== HELPERS EXPORTADOS =====

export const getCurrentProgram = (
  epgChannel: EPGChannel
): EPGProgram | null => {
  const now = new Date();
  return epgChannel.programs.find(
    (p) => now >= p.start && now < p.end
  ) || null;
};

export const normalizeStr = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace('fhd', '')
    .replace('hd', '')
    .replace('4k', '')
    .replace('br', '')
    .replace('bra', '') // Filtro extra comum
    .replace('pl', '') // Filtro extra comum
    .trim();
};