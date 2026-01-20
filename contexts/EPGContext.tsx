
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchEPG, normalizeStr, getCurrentProgram } from '../services/epgService';
import { EPGChannel, CurrentProgramData } from '../types';

interface EPGContextType {
  epgChannels: EPGChannel[];
  loading: boolean;
  getChannelEPG: (channelName: string) => CurrentProgramData | null;
}

const EPGContext = createContext<EPGContextType | undefined>(undefined);

export const EPGProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [epgChannels, setEpgChannels] = useState<EPGChannel[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega o EPG ao iniciar o app
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchEPG();
      setEpgChannels(data);
      setLoading(false);
    };
    load();
    
    // Recarrega a cada 30 minutos para manter atualizado
    const interval = setInterval(load, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Função inteligente para cruzar o nome do canal do App com o nome do canal no XMLTV
  const getChannelEPG = (channelName: string): CurrentProgramData | null => {
      if (epgChannels.length === 0) return null;

      const target = normalizeStr(channelName);
      
      // Tenta encontrar o canal no EPG comparando nomes normalizados
      const foundChannel = epgChannels.find(epg => normalizeStr(epg.displayName).includes(target) || target.includes(normalizeStr(epg.displayName)));

      if (foundChannel) {
          const current = getCurrentProgram(foundChannel);
          if (current) {
              const now = new Date().getTime();
              const start = current.start.getTime();
              const end = current.end.getTime();
              const total = end - start;
              const progress = now - start;
              const percentage = Math.min(100, Math.max(0, (progress / total) * 100));

              return {
                  title: current.title,
                  description: current.description,
                  since: current.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  until: current.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  percentage
              };
          }
      }
      return null;
  };

  return (
    <EPGContext.Provider value={{ epgChannels, loading, getChannelEPG }}>
      {children}
    </EPGContext.Provider>
  );
};

export const useEPG = () => {
  const context = useContext(EPGContext);
  if (context === undefined) {
    throw new Error('useEPG must be used within an EPGProvider');
  }
  return context;
};
