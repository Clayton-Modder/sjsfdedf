import React, { useMemo } from 'react';
import { useEPG } from '../contexts/EPGContext';
import { Calendar } from 'lucide-react';
import { EPGChannel } from '../types';

interface EPGListProps {
  searchQuery: string;
}

export const EPGList: React.FC<EPGListProps> = ({ searchQuery }) => {
  const { epgChannels, loading } = useEPG();

  const filteredEPG = useMemo(() => {
    if (!searchQuery) return epgChannels;
    const lowerQuery = searchQuery.toLowerCase();
    return epgChannels.filter(ch => 
      ch.displayName.toLowerCase().includes(lowerQuery) ||
      ch.programs.some(p => p.title.toLowerCase().includes(lowerQuery))
    );
  }, [epgChannels, searchQuery]);

  const getCurrentAndNext = (channel: EPGChannel) => {
    const now = new Date();
    // Filtra programas que terminam no futuro
    const upcoming = channel.programs.filter(p => p.end > now).sort((a, b) => a.start.getTime() - b.start.getTime());
    return upcoming;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
             <p>Carregando guia de programação...</p>
        </div>
     );
  }

  if (filteredEPG.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Calendar className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg">Nenhuma programação encontrada.</p>
        </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEPG.map((channel) => {
           const programs = getCurrentAndNext(channel);
           if (programs.length === 0) return null;

           const current = programs[0];
           const next = programs.slice(1, 4); // Próximos 3 programas

           return (
             <div key={channel.id} className="bg-card border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors h-full flex flex-col">
                <div className="bg-gray-900/50 p-3 border-b border-gray-800 flex items-center justify-between">
                   <h3 className="font-bold text-white truncate pr-2">{channel.displayName}</h3>
                   <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                     Guia
                   </span>
                </div>
                
                <div className="p-3 flex-1">
                   {/* Programa Atual */}
                   <div className="mb-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-1 text-primary text-xs font-bold uppercase tracking-wide">
                         <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                         Agora ({formatTime(current.start)} - {formatTime(current.end)})
                      </div>
                      <p className="font-bold text-sm text-white leading-tight">{current.title}</p>
                      {current.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{current.description}</p>
                      )}
                   </div>

                   {/* Próximos Programas */}
                   <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">A seguir</p>
                      {next.map((prog, idx) => (
                         <div key={idx} className="flex gap-3 items-start text-xs border-l-2 border-gray-700 pl-2">
                            <div className="text-gray-300 font-mono whitespace-nowrap font-medium">
                               {formatTime(prog.start)}
                            </div>
                            <div className="text-gray-400 line-clamp-1">{prog.title}</div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};