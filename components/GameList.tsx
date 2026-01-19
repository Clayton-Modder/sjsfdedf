import React from 'react';
import { Game, Channel } from '../types';
import { Play, Clock, Trophy, Tv } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GameListProps {
  games: Game[];
  loading: boolean;
}

export const GameList: React.FC<GameListProps> = ({ games, loading }) => {
  const navigate = useNavigate();

  const handleGameClick = (game: Game) => {
    if (!game.players || game.players.length === 0) return;

    // Create a temporary channel object compatible with the Player component
    const gameChannel: Channel = {
      id: `game-${game.data.timer.start}-${game.title.replace(/\s+/g, '-')}`,
      name: game.title,
      image: game.image, // Could be generic or specific
      categories: [-3],
      url: game.players[0], // Pick first stream
      description: `${game.data.league} | ${game.data.teams.home.name} vs ${game.data.teams.away.name}`,
      currentProgram: 'Ao Vivo'
    };

    // Navigate with state
    navigate(`/watch/${gameChannel.id}`, { state: { channel: gameChannel } });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="bg-gray-800 p-4 rounded-full mb-4">
            <Trophy className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-lg font-medium">Nenhum jogo encontrado para hoje.</p>
        <p className="text-sm opacity-70">Verifique novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {games.map((game, index) => (
          <div 
            key={index}
            onClick={() => handleGameClick(game)}
            className="bg-card border border-gray-800 hover:border-primary/50 rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative"
          >
            {/* Header: League */}
            <div className="bg-black/40 p-2 text-center border-b border-gray-700/50 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{game.data.league}</span>
            </div>

            {/* Matchup Body */}
            <div className="p-5 flex items-center justify-between gap-2">
               {/* Home Team */}
               <div className="flex flex-col items-center flex-1 min-w-0">
                 <div className="w-14 h-14 mb-3 p-1 bg-white/5 rounded-full flex items-center justify-center">
                    <img src={game.data.teams.home.image} alt={game.data.teams.home.name} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png')} />
                 </div>
                 <span className="text-xs font-bold text-center leading-tight line-clamp-2 w-full">{game.data.teams.home.name}</span>
               </div>

               {/* VS / Time */}
               <div className="flex flex-col items-center justify-center px-1">
                 <span className="text-gray-600 font-black text-xs mb-2">VS</span>
                 <div className="bg-gray-800 px-2.5 py-1 rounded text-xs text-primary font-mono font-bold flex items-center gap-1 whitespace-nowrap">
                   <Clock className="w-3 h-3" />
                   {formatTime(game.data.timer.start)}
                 </div>
               </div>

               {/* Away Team */}
               <div className="flex flex-col items-center flex-1 min-w-0">
                 <div className="w-14 h-14 mb-3 p-1 bg-white/5 rounded-full flex items-center justify-center">
                    <img src={game.data.teams.away.image} alt={game.data.teams.away.name} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png')} />
                 </div>
                 <span className="text-xs font-bold text-center leading-tight line-clamp-2 w-full">{game.data.teams.away.name}</span>
               </div>
            </div>
            
            {/* Action Footer */}
            <div className="bg-gray-900/80 p-3 flex justify-center items-center group-hover:bg-primary transition-colors duration-300">
                {game.players.length > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-white">
                        <Tv className="w-4 h-4" />
                        <span>Assistir</span>
                    </div>
                ) : (
                    <span className="text-xs text-red-400 font-medium">Indisponível</span>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};