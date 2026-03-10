import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Player } from '../components/Player';
import { Channel, Radio } from '../types';
import { Tv } from 'lucide-react';

interface WatchProps {
  channels: Channel[];
  radios: Radio[];
  addToHistory: (id: string) => void;
}

export const Watch: React.FC<WatchProps> = ({ channels, radios, addToHistory }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    // 1. Try to find in standard channels list
    const foundChannel = channels.find(c => c.id === id);
    
    if (foundChannel) {
      setChannel(foundChannel);
      addToHistory(foundChannel.id);
      return;
    }

    // 2. Try to find in radios list
    const foundRadio = radios.find(r => r.id === id);
    if (foundRadio) {
      // Convert Radio to Channel object for Player
      const radioAsChannel: Channel = {
          id: foundRadio.id,
          name: foundRadio.name,
          image: foundRadio.image,
          categories: [-4],
          url: foundRadio.url,
          description: `${foundRadio.city} - ${foundRadio.category}`,
          currentProgram: "Rádio Ao Vivo"
      };
      setChannel(radioAsChannel);
      // We might want to add radios to history too? For now, yes.
      // Note: addToHistory expects a string ID. It relies on the ID being in the 'channels' list 
      // for the Home history filter to work (since filtering looks up by ID in 'channels').
      // Since radios aren't in 'channels', they won't show up in the history list on Home unless we handle that.
      // For now, let's skip adding radios to history to avoid blank entries.
      return;
    }
    
    // 3. Check if channel object was passed via navigation state (e.g. from Games)
    if (location.state && location.state.channel) {
      const stateChannel = location.state.channel as Channel;
      // Ensure the ID matches (basic validation)
      if (stateChannel.id === id) {
        setChannel(stateChannel);
      } else {
        navigate('/', { replace: true });
      }
    }
    // 4. Fallback: redirect if not found and data is loaded
    else if (channels.length > 0 && radios.length > 0) {
      navigate('/', { replace: true });
    }
  }, [id, channels, radios, navigate, addToHistory, location.state]);

  if (!channel) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center text-white">
        <p>Carregando...</p>
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
              TV Online <span className="text-primary">HD</span>
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