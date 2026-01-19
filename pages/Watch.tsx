import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Player } from '../components/Player';
import { Channel } from '../types';
import { Tv } from 'lucide-react';

interface WatchProps {
  channels: Channel[];
  addToHistory: (id: string) => void;
}

export const Watch: React.FC<WatchProps> = ({ channels, addToHistory }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    // 1. Try to find in standard channels list
    const found = channels.find(c => c.id === id);
    
    if (found) {
      setChannel(found);
      addToHistory(found.id);
    } 
    // 2. Check if channel object was passed via navigation state (e.g. from Games)
    else if (location.state && location.state.channel) {
      const stateChannel = location.state.channel as Channel;
      // Ensure the ID matches (basic validation)
      if (stateChannel.id === id) {
        setChannel(stateChannel);
        // We might choose NOT to add transient game channels to history to avoid broken links later,
        // or we add them but they won't load if revisited directly without state.
        // For now, let's not add transient items to persistent history to avoid 404s later.
      } else {
        navigate('/', { replace: true });
      }
    }
    // 3. Fallback: redirect if not found and channels are loaded
    else if (channels.length > 0) {
      navigate('/', { replace: true });
    }
  }, [id, channels, navigate, addToHistory, location.state]);

  if (!channel) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center text-white">
        <p>Carregando canal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
       {/* Minimal Header for Watch Page */}
      <header className="bg-dark border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center sm:justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Tv className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Mega Canais <span className="text-primary">TV</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Player channel={channel} />
      </main>
    </div>
  );
};