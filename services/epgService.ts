import { EPGChannel, EPGProgram } from '../types';

// URL XMLTV
const EPG_URL = 'http://nocable.cc:8080/xmltv.php?username=J0WfUK&password=016294';

// Proxies CORS
const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

/**
 * Parse seguro de data XMLTV
 * Formato: YYYYMMDDHHMMSS +0000
 */
const parseXMLTVDate = (dateStr: string): Date => {
  if (!dateStr || dateStr.length < 14) return new Date(0);

  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  const hour = dateStr.slice(8, 10);
  const min = dateStr.slice(10, 12);
  const sec = dateStr.slice(12, 14);

  // Força UTC (XMLTV quase sempre é UTC)
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
};

export const fetchEPG = async (): Promise<EPGChannel[]> => {
  for (const createProxyUrl of PROXIES) {
    try {
      const proxyUrl = createProxyUrl(EPG_URL);
      console.log('[EPG] Tentando:', proxyUrl);

      const response = await fetch(proxyUrl, { cache: 'no-store' });

      if (!response.ok) {
        console.warn('[EPG] Proxy falhou:', response.status);
        continue;
      }

      const xmlText = await response.text();

      // Validação forte
      if (
        !xmlText ||
        !xmlText.includes('<tv') ||
        !xmlText.includes('<channel') ||
        !xmlText.includes('<programme')
      ) {
        console.warn('[EPG] Resposta não é XMLTV válido');
        continue;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      if (xmlDoc.querySelector('parsererror')) {
        console.error('[EPG] Erro ao fazer parse do XML');
        continue;
      }

      const channelMap = new Map<string, EPGChannel>();

      // === CHANNELS ===
      xmlDoc.querySelectorAll('channel').forEach((el) => {
        const id = el.getAttribute('id');
        const displayName =
          el.querySelector('display-name')?.textContent?.trim() || '';

        if (id) {
          channelMap.set(id, {
            id,
            displayName,
            programs: []
          });
        }
      });

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // === PROGRAMMES ===
      xmlDoc.querySelectorAll('programme').forEach((el) => {
        const channelId = el.getAttribute('channel');
        if (!channelId || !channelMap.has(channelId)) return;

        const start = parseXMLTVDate(el.getAttribute('start') || '');
        const end = parseXMLTVDate(el.getAttribute('stop') || '');

        // Filtro de relevância
        if (end < twoHoursAgo || start > next24h) return;

        const title =
          el.querySelector('title')?.textContent?.trim() || 'Sem título';
        const desc =
          el.querySelector('desc')?.textContent?.trim() || '';

        channelMap.get(channelId)!.programs.push({
          title,
          description: desc,
          start,
          end,
          channelId
        });
      });

      const result = Array.from(channelMap.values()).filter(
        (c) => c.programs.length > 0
      );

      console.log(`[EPG] OK → ${result.length} canais`);
      return result;

    } catch (err) {
      console.error('[EPG] Erro no proxy:', err);
    }
  }

  console.warn('[EPG] Todos os proxies falharam');
  return [];
};

// === Helpers ===

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
    .trim();
};

