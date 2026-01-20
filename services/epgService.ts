import { EPGChannel, EPGProgram } from '../types';

// URL HTTP (SEM HTTPS)
const EPG_URL =
  'http://nocable.cc:8080/xmltv.php?username=J0WfUK&password=016294';

/**
 * Converte data XMLTV
 * Formato: YYYYMMDDHHMMSS +0000
 */
const parseXMLTVDate = (dateStr: string): Date => {
  if (!dateStr || dateStr.length < 14) return new Date(0);

  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  const h = dateStr.slice(8, 10);
  const min = dateStr.slice(10, 12);
  const s = dateStr.slice(12, 14);

  // XMLTV geralmente é UTC
  return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`);
};

export const fetchEPG = async (): Promise<EPGChannel[]> => {
  try {
    console.log('[EPG] Buscando XMLTV via HTTP');

    const response = await fetch(EPG_URL, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xmlText = await response.text();

    // Validação básica
    if (!xmlText.includes('<tv') || !xmlText.includes('<programme')) {
      console.error('[EPG] XML inválido');
      return [];
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    if (xmlDoc.querySelector('parsererror')) {
      console.error('[EPG] Erro ao fazer parse do XML');
      return [];
    }

    const channelMap = new Map<string, EPGChannel>();

    // ===== CHANNELS =====
    xmlDoc.querySelectorAll('channel').forEach((el) => {
      const id = el.getAttribute('id');
      const name =
        el.querySelector('display-name')?.textContent?.trim() || '';

      if (id) {
        channelMap.set(id, {
          id,
          displayName: name,
          programs: []
        });
      }
    });

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // ===== PROGRAMMES =====
    xmlDoc.querySelectorAll('programme').forEach((el) => {
      const channelId = el.getAttribute('channel');
      if (!channelId || !channelMap.has(channelId)) return;

      const start = parseXMLTVDate(el.getAttribute('start') || '');
      const end = parseXMLTVDate(el.getAttribute('stop') || '');

      if (end < twoHoursAgo || start > next24h) return;

      channelMap.get(channelId)!.programs.push({
        title: el.querySelector('title')?.textContent?.trim() || 'Sem título',
        description: el.querySelector('desc')?.textContent?.trim() || '',
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
    console.error('[EPG] Falha ao carregar EPG:', err);
    return [];
  }
};

// ===== HELPERS =====

export const getCurrentProgram = (
  channel: EPGChannel
): EPGProgram | null => {
  const now = new Date();
  return channel.programs.find(
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
