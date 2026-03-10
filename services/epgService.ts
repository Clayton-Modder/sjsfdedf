import { EPGChannel, EPGProgram } from '../types';

// Lista de URLs XMLTV para tentar (Canais Brasileiros)
const EPG_URLS = [
  'https://iptv-org.github.io/epg/guides/br.xml',
  'https://raw.githubusercontent.com/LITUATUI/IPTV-Brasil/master/epg.xml',
  'https://iptv-org.github.io/epg/guides/br/sky.com.br.xml',
  'https://iptv-org.github.io/epg/guides/br/claro.com.br.xml',
  'https://iptv-org.github.io/epg/guides/br/vivo.com.br.xml',
  'https://iptv-org.github.io/epg/guides/br/oi.com.br.xml',
  'https://epg.pw/xmltv/guide_br.xml'
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
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  // 7. HTMLDriven
  (url: string) => `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(url)}`
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

let isFetching = false;
let cachedEPG: EPGChannel[] | null = null;
let lastFetchTime = 0;

export const fetchEPG = async (): Promise<EPGChannel[]> => {
  const now = Date.now();
  // Cache por 30 minutos
  if (cachedEPG && (now - lastFetchTime < 30 * 60 * 1000)) {
    return cachedEPG;
  }

  if (isFetching) return cachedEPG || [];
  isFetching = true;
  console.log('[EPG] Iniciando busca de programação...');

  try {
    // Tenta cada URL na lista
    for (const epgUrl of EPG_URLS) {
      // Tenta cada proxy na lista
      for (const createProxyUrl of PROXIES) {
        const proxyUrl = createProxyUrl(epgUrl);
        try {
          const proxyName = proxyUrl.includes('/api/proxy') ? 'Local Server Proxy' : (proxyUrl.split('/')[2] || 'Unknown Proxy');
          console.log(`[EPG] Tentando via ${proxyName} para: ${epgUrl}`);
          
          // Se for o proxy local, tentamos até 2 vezes
          const maxRetries = proxyUrl.includes('/api/proxy') ? 2 : 1;
          for (let i = 0; i < maxRetries; i++) {
            if (i > 0) console.log(`[EPG] Retentando via ${proxyName} (Tentativa ${i+1}/${maxRetries})...`);
            const result = await tryFetch(proxyUrl);
            if (result && result.length > 0) {
              cachedEPG = result;
              lastFetchTime = Date.now();
              return result;
            }
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 2000));
          }
        } catch (error) {
          // Erros já são logados no tryFetch
        }
      }

      // Se falhar todos os proxies, tenta direto como último recurso (se for HTTPS)
      if (epgUrl.startsWith('https:')) {
        try {
          console.log(`[EPG] Tentando carregar direto como último recurso: ${epgUrl}`);
          const result = await tryFetch(epgUrl);
          if (result && result.length > 0) {
            cachedEPG = result;
            lastFetchTime = Date.now();
            return result;
          }
        } catch (e) {
          // Ignora erro direto
        }
      }
    }
  } finally {
    isFetching = false;
  }

  console.error('[EPG] Todas as tentativas de conexão falharam. Verifique sua conexão ou tente novamente mais tarde.');
  return cachedEPG || [];
};

/**
 * Função auxiliar para realizar o fetch e parse do XML
 */
async function tryFetch(url: string): Promise<EPGChannel[] | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // Aumentado para 60s

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const statusText = response.statusText || 'Sem descrição';
      console.warn(`[EPG] Falha na resposta (${response.status} - ${statusText}) para: ${url}`);
      return null;
    }

    const xmlText = await response.text();
    if (!xmlText || xmlText.trim() === '') {
      console.warn(`[EPG] Conteúdo XML vazio recebido para: ${url}`);
      return null;
    }
    if (xmlText.length < 100) {
      console.warn(`[EPG] Conteúdo XML muito pequeno (${xmlText.length} bytes) para: ${url}`);
    }

    if (xmlText.trim().startsWith('{') || xmlText.trim().startsWith('[')) {
      console.warn(`[EPG] Recebido JSON em vez de XML para: ${url}`);
      return null;
    }

    const lowerText = xmlText.toLowerCase();
    const isSmall = xmlText.length < 2000;

    if (isSmall && (lowerText.includes('<!doctype html') || lowerText.includes('<html'))) {
      console.warn(`[EPG] Recebido HTML em vez de XML para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('internal server error') || lowerText.includes('500 error'))) {
      console.warn(`[EPG] Erro interno no servidor remoto para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('bad gateway') || lowerText.includes('502 error'))) {
      console.warn(`[EPG] Bad gateway no servidor remoto para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('timeout') || lowerText.includes('504 error'))) {
      console.warn(`[EPG] Timeout no proxy ou servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('not found') || lowerText.includes('404 error'))) {
      console.warn(`[EPG] Arquivo não encontrado no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('forbidden') || lowerText.includes('access denied') || lowerText.includes('403 error'))) {
      console.warn(`[EPG] Acesso negado pelo servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('too many requests') || lowerText.includes('429 error'))) {
      console.warn(`[EPG] Muitas requisições ao servidor remoto para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('service unavailable') || lowerText.includes('503 error'))) {
      console.warn(`[EPG] Serviço indisponível no servidor remoto para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('captcha') || lowerText.includes('cloudflare') || lowerText.includes('ddos protection') || lowerText.includes('checking your browser'))) {
      console.warn(`[EPG] Proteção ativa (Captcha/Cloudflare) no servidor remoto para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('operation not permitted') || lowerText.includes('eperm'))) {
      console.warn(`[EPG] Operação não permitida pelo servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('no route to host') || lowerText.includes('ehostunreach'))) {
      console.warn(`[EPG] Sem rota para o host para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('wrong medium type') || lowerText.includes('emediumtype'))) {
      console.warn(`[EPG] Tipo de mídia errado no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('no medium found') || lowerText.includes('enomedium'))) {
      console.warn(`[EPG] Mídia não encontrada no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('quota exceeded') || lowerText.includes('edquot'))) {
      console.warn(`[EPG] Cota de disco excedida no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('remote i/o error') || lowerText.includes('eremoteio'))) {
      console.warn(`[EPG] Erro de E/S remoto para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('stale file handle') || lowerText.includes('estale'))) {
      console.warn(`[EPG] Handle de arquivo obsoleto no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('read-only file system') || lowerText.includes('erofs'))) {
      console.warn(`[EPG] Sistema de arquivos apenas para leitura no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('no space left on device') || lowerText.includes('enospc'))) {
      console.warn(`[EPG] Sem espaço em disco no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('file too large') || lowerText.includes('efbig'))) {
      console.warn(`[EPG] Arquivo muito grande para o sistema para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('too many links') || lowerText.includes('emlink'))) {
      console.warn(`[EPG] Muitos links simbólicos encontrados para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('shutdown') || lowerText.includes('eshutdown'))) {
      console.warn(`[EPG] Servidor em processo de desligamento para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('socket is not connected') || lowerText.includes('enotconn'))) {
      console.warn(`[EPG] Socket não conectado para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('socket is already connected') || lowerText.includes('eisconn'))) {
      console.warn(`[EPG] Socket já conectado para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('no buffer space available') || lowerText.includes('enobufs'))) {
      console.warn(`[EPG] Sem espaço de buffer disponível no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('too many open files') || lowerText.includes('emfile'))) {
      console.warn(`[EPG] Muitos arquivos abertos no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('software caused connection abort') || lowerText.includes('econnaborted'))) {
      console.warn(`[EPG] Conexão abortada pelo software para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('network reset') || lowerText.includes('enetreset'))) {
      console.warn(`[EPG] Rede resetada para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('network down') || lowerText.includes('enetdown'))) {
      console.warn(`[EPG] Rede fora do ar para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('host down') || lowerText.includes('ehostdown'))) {
      console.warn(`[EPG] Host fora do ar para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('broken pipe') || lowerText.includes('epipe'))) {
      console.warn(`[EPG] Pipe quebrado ao tentar acessar: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('operation already in progress') || lowerText.includes('einprogress'))) {
      console.warn(`[EPG] Operação já em progresso para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('connection already in progress') || lowerText.includes('ealready'))) {
      console.warn(`[EPG] Conexão já em progresso para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('address not available') || lowerText.includes('eaddrnotavail'))) {
      console.warn(`[EPG] Endereço não disponível para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('address in use') || lowerText.includes('eaddrinuse'))) {
      console.warn(`[EPG] Endereço já em uso para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('network unreachable') || lowerText.includes('enetunreach'))) {
      console.warn(`[EPG] Rede inacessível para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('host unreachable') || lowerText.includes('ehostunreach'))) {
      console.warn(`[EPG] Host inacessível para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('connection timed out') || lowerText.includes('etimedout'))) {
      console.warn(`[EPG] Tempo de conexão esgotado para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('connection aborted') || lowerText.includes('econnaborted'))) {
      console.warn(`[EPG] Conexão abortada pelo servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('connection reset') || lowerText.includes('econnreset'))) {
      console.warn(`[EPG] Conexão resetada pelo servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('ssl error') || lowerText.includes('certificate error'))) {
      console.warn(`[EPG] Erro de SSL/Certificado ao tentar acessar: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('dns error') || lowerText.includes('enotfound'))) {
      console.warn(`[EPG] Erro de DNS ao tentar acessar: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('connection refused') || lowerText.includes('connrefused'))) {
      console.warn(`[EPG] Conexão recusada pelo servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('proxy error') || lowerText.includes('502 error'))) {
      console.warn(`[EPG] Erro no proxy ao tentar acessar: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('bandwidth limit exceeded') || lowerText.includes('509 error'))) {
      console.warn(`[EPG] Limite de banda excedido no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('network authentication required') || lowerText.includes('511 error'))) {
      console.warn(`[EPG] Autenticação de rede necessária para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('not extended') || lowerText.includes('510 error'))) {
      console.warn(`[EPG] Não estendido para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('loop detected') || lowerText.includes('508 error'))) {
      console.warn(`[EPG] Loop detectado na requisição para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('insufficient storage') || lowerText.includes('507 error'))) {
      console.warn(`[EPG] Armazenamento insuficiente no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('variant also negotiates') || lowerText.includes('506 error'))) {
      console.warn(`[EPG] Variante também negocia para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('http version not supported') || lowerText.includes('505 error'))) {
      console.warn(`[EPG] Versão HTTP não suportada para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('not implemented') || lowerText.includes('501 error'))) {
      console.warn(`[EPG] Funcionalidade não implementada no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('unavailable for legal reasons') || lowerText.includes('451 error'))) {
      console.warn(`[EPG] Indisponível por razões legais para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('request header fields too large') || lowerText.includes('431 error'))) {
      console.warn(`[EPG] Cabeçalhos da requisição muito grandes para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('precondition required') || lowerText.includes('428 error'))) {
      console.warn(`[EPG] Pré-condição obrigatória para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('upgrade required') || lowerText.includes('426 error'))) {
      console.warn(`[EPG] Atualização necessária para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('failed dependency') || lowerText.includes('424 error'))) {
      console.warn(`[EPG] Falha na dependência para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('locked') || lowerText.includes('423 error'))) {
      console.warn(`[EPG] Recurso bloqueado no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('unprocessable entity') || lowerText.includes('422 error'))) {
      console.warn(`[EPG] Entidade não processável para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('expectation failed') || lowerText.includes('417 error'))) {
      console.warn(`[EPG] Expectativa falhou para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('length required') || lowerText.includes('411 error'))) {
      console.warn(`[EPG] Comprimento da requisição obrigatório para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('precondition failed') || lowerText.includes('412 error'))) {
      console.warn(`[EPG] Pré-condição falhou para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('gone') || lowerText.includes('410 error'))) {
      console.warn(`[EPG] Recurso não mais disponível no servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('conflict') || lowerText.includes('409 error'))) {
      console.warn(`[EPG] Conflito na requisição para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('bad request') || lowerText.includes('400 error'))) {
      console.warn(`[EPG] Requisição inválida para o servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('unsupported media type') || lowerText.includes('415 error'))) {
      console.warn(`[EPG] Tipo de mídia não suportado pelo servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('method not allowed') || lowerText.includes('405 error'))) {
      console.warn(`[EPG] Método HTTP não permitido pelo servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('request entity too large') || lowerText.includes('413 error'))) {
      console.warn(`[EPG] Requisição muito grande para o servidor para: ${url}`);
      return null;
    }

    if (isSmall && (lowerText.includes('just a moment') || lowerText.includes('please wait'))) {
      console.warn(`[EPG] Aguardando verificação do Cloudflare para: ${url}`);
      return null;
    }

    if (!xmlText.trim().startsWith('<')) {
      const preview = xmlText.slice(0, 50).replace(/\n/g, ' ');
      console.warn(`[EPG] Conteúdo não é XML para: ${url} (Início: ${preview}...)`);
      return null;
    }

    if (!xmlText || (!xmlText.trim().startsWith('<') && !xmlText.includes('<tv'))) {
      const preview = xmlText ? xmlText.slice(0, 50).replace(/\n/g, ' ') : 'vazio';
      console.warn(`[EPG] Conteúdo recebido não parece ser um XML válido para: ${url} (Início: ${preview}...)`);
      return null;
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    if (xmlDoc.querySelector('parsererror')) {
      console.error(`[EPG] Erro de parsing XML para: ${url}`);
      return null;
    }

    const channelMap = new Map<string, EPGChannel>();

    // ===== 1. Processar Canais =====
    const channelElements = xmlDoc.querySelectorAll('channel');
    if (channelElements.length === 0) {
      console.warn(`[EPG] Nenhum canal encontrado no XML de: ${url}`);
    } else {
      console.log(`[EPG] XML carregado: ${channelElements.length} canais encontrados no arquivo.`);
    }
    
    channelElements.forEach((el) => {
      const id = el.getAttribute('id');
      const displayName = el.querySelector('display-name')?.textContent?.trim() || '';

      if (id) {
        channelMap.set(id, { id, displayName, programs: [] });
      } else {
        console.warn(`[EPG] Canal sem ID encontrado no XML de: ${url}`);
      }
    });

    // Definição de janela de tempo
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // ===== 2. Processar Programas =====
    const programs = xmlDoc.querySelectorAll('programme');
    if (programs.length === 0) {
      console.warn(`[EPG] Nenhum programa encontrado no XML de: ${url}`);
    } else {
      console.log(`[EPG] XML carregado: ${programs.length} programas encontrados no arquivo.`);
    }
    let filteredCount = 0;
    
    programs.forEach((el) => {
      const channelId = el.getAttribute('channel');
      if (!channelId) return;
      
      if (!channelMap.has(channelId)) {
        // console.warn(`[EPG] Programa para canal desconhecido (${channelId}) em: ${url}`);
        return;
      }

      const startStr = el.getAttribute('start');
      const endStr = el.getAttribute('stop');
      
      if (!startStr || !endStr) {
        // console.warn(`[EPG] Programa sem datas em: ${url}`);
        return;
      }

      const start = parseXMLTVDate(startStr);
      const end = parseXMLTVDate(endStr);

      if (end < twoHoursAgo || start > next24h) {
        filteredCount++;
        return;
      }

      const titleEl = el.querySelector('title');
      if (!titleEl) {
        // console.warn(`[EPG] Programa sem título em: ${url}`);
        return;
      }
      
      const title = titleEl.textContent?.trim() || 'Sem título';
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
      console.log(`[EPG] Sucesso! ${result.length} canais com programação carregados (${filteredCount} programas fora da janela ignorados).`);
      return result;
    }
    console.warn(`[EPG] Nenhum programa encontrado na janela de tempo (últimas 2h até próximas 24h) para: ${url}`);
    return null;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.warn(`[EPG] Timeout (60s) para: ${url}`);
    } else {
      console.error(`[EPG] Erro ao buscar ${url}: ${e.message}`);
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