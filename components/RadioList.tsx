import React from 'react';
import { Radio, Channel } from '../types';
import { Play, Radio as RadioIcon, MapPin, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '../contexts/RadioContext';

interface RadioListProps {
  radios: Radio[];
}

export const RadioList: React.FC<RadioListProps> = ({ radios }) => {
  const navigate = useNavigate();
  const { playRadio, activeRadio, isPlaying } = useRadio();

  const handleRadioClick = (radio: Radio) => {
    // Converte Radio para Channel para o Player
    const radioChannel: Channel = {
      id: radio.id,
      name: radio.name,
      image: radio.image,
      categories: [-4], // ID Categoria Rádios
      url: radio.url,
      description: `${radio.city} • ${radio.category}`,
      currentProgram: 'Rádio Ao Vivo'
    };
    
    // Inicia o áudio imediatamente
    playRadio(radioChannel);

    // Navega para a tela de detalhes (o player global continuará tocando)
    navigate(`/watch/${radio.id}`, { state: { channel: radioChannel } });
  };

  if (radios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <RadioIcon className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg">Nenhuma rádio encontrada.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {radios.map((radio) => {
            const isActive = activeRadio?.id === radio.id;
            
            return (
              <div
                key={radio.id}
                onClick={() => handleRadioClick(radio)}
                className={`group relative bg-card hover:bg-gray-700 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border flex flex-col h-full ${isActive && isPlaying ? 'border-primary shadow-lg shadow-primary/20' : 'border-gray-800 hover:border-gray-600'}`}
              >
                {/* Image Aspect Ratio Container */}
                <div className="aspect-square w-full bg-gray-900 relative p-6 flex items-center justify-center">
                  <img
                    src={radio.image}
                    alt={radio.name}
                    className={`w-full h-full object-contain rounded-full shadow-lg transition-transform duration-500 ${isActive && isPlaying ? 'animate-[spin_10s_linear_infinite]' : 'group-hover:scale-110'}`}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-gray-800');
                    }}
                  />
                  
                  {/* Play Overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 z-10 ${isActive ? 'opacity-100 bg-black/20' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className={`w-14 h-14 bg-primary/90 rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-300 backdrop-blur-sm ${isActive ? 'scale-100' : 'scale-0 group-hover:scale-100 delay-75'}`}>
                        {isActive && isPlaying ? (
                             <BarChart3 className="w-7 h-7 text-white animate-pulse" />
                        ) : (
                             <Play className="w-7 h-7 text-white fill-current ml-1" />
                        )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 border-t border-gray-700/50 flex-1 flex flex-col justify-center gap-1 bg-gradient-to-b from-card to-gray-900">
                  <h3 className={`font-bold text-base text-center transition-colors truncate ${isActive ? 'text-primary' : 'text-gray-100 group-hover:text-primary'}`}>
                    {radio.name}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="truncate">{radio.city}</span>
                  </div>
                  
                  <div className="text-center mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-[10px] font-medium text-gray-300 uppercase tracking-wide">
                        {radio.category}
                      </span>
                  </div>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};