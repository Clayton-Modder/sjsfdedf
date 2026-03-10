import { ApiData, Game, Radio } from '../types';
import { initialData } from './initialData';

const CACHE_KEY = 'megacanaistv_data_v2';

interface CachedData {
  timestamp: number;
  data: ApiData;
}

// ============================
// CANAIS (CACHE + FALLBACK)
// ============================
export const fetchChannels = async (): Promise<ApiData> => {
  try {
    // 1️⃣ TENTA BUSCAR DA API DO SERVIDOR
    const response = await fetch(`/api/data?t=${Date.now()}`);
    if (response.ok) {
      const freshData = await response.json();
      
      // SALVA NO CACHE PARA USO OFFLINE/RÁPIDO
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data: freshData
        })
      );
      
      return freshData;
    }

    // 2️⃣ SE FALHAR, TENTA CACHE LOCAL
    const cachedString = localStorage.getItem(CACHE_KEY);
    if (cachedString) {
      const cached: CachedData = JSON.parse(cachedString);
      return cached.data;
    }

    // 3️⃣ SE TUDO FALHAR, USA DADOS INICIAIS
    return initialData;
  } catch (error) {
    console.error('Erro ao buscar canais:', error);
    
    // TENTA CACHE EM CASO DE ERRO DE REDE
    const cachedString = localStorage.getItem(CACHE_KEY);
    if (cachedString) {
      const cached: CachedData = JSON.parse(cachedString);
      return cached.data;
    }
    
    return initialData;
  }
};

// ============================
// JOGOS (API REMOTA)
// ============================
export const fetchGames = async (): Promise<Game[]> => {
  try {
    // DATA ATUAL (DDMMYYYY)
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateString = `${day}${month}${year}`;

    // API PHP (TEM QUE TER CORS LIBERADO)
    const url = `https://megacanaisonline.space/api/scramnpjogos.php?day=${dateString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro API: ${response.status}`);
    }

    const json = await response.json();

    // ❌ NÃO É ARRAY DIRETO
    if (!json.status || !Array.isArray(json.data)) {
      console.warn('API retornou formato inválido');
      return [];
    }

    // ✅ ADAPTA PARA O TIPO Game
    const games: Game[] = json.data.map((item: any) => ({
      title: item.titulo,
      image: item.capa,
      data: {
        league: item.liga,
        timer: {
          start: item.inicio,
          end: item.fim
        },
        teams: {
          home: {
            name: item.times?.casa?.nome ?? '',
            image: item.times?.casa?.logo ?? ''
          },
          away: {
            name: item.times?.fora?.nome ?? '',
            image: item.times?.fora?.logo ?? ''
          }
        }
      },
      players: Array.isArray(item.players) ? item.players : []
    }));

    return games;

  } catch (error) {
    console.warn('Não foi possível carregar os jogos:', error);
    return [];
  }
};

// ============================
// RÁDIOS (ARQUIVO LOCAL/PUBLIC)
// ============================
export const fetchRadios = async (): Promise<Radio[]> => {
  try {
    const response = await fetch('/radios.json');
    if (!response.ok) {
      throw new Error('Falha ao carregar radios.json');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar rádios:', error);
    return [];
  }
};