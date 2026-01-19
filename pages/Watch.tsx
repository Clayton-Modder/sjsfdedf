import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Player } from '../components/Player';
import { Channel } from '../types';
import { Tv, ArrowLeft } from 'lucide-react';

interface WatchProps {
  channels: Channel[];
}

export const Watch: React.FC<WatchProps> = ({ channels }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    const found = channels.find(c => c.id === id);
    if (found) {
      setChannel(found);
    } else if (channels.length > 0) {
      // Only redirect if channels are loaded but ID is invalid
      navigate('/', { replace: true });
    }
  }, [id, channels, navigate]);

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
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Tv className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Mega<span className="text-primary">TV</span>
            </span>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
             <ArrowLeft className="w-4 h-4" /> Lista
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Player channel={channel} />
      </main>
    </div>
  );
};