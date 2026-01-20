import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Channel } from '../types';

interface RadioContextType {
  activeRadio: Channel | null;
  isPlaying: boolean;
  isBuffering: boolean;
  playRadio: (radio: Channel) => void;
  togglePlay: () => void;
  stopRadio: () => void;
  setBufferingState: (state: boolean) => void;
  setPlayingState: (state: boolean) => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export const RadioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRadio, setActiveRadio] = useState<Channel | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const playRadio = useCallback((radio: Channel) => {
    // Se for a mesma rádio, apenas garante o play
    if (activeRadio?.id === radio.id) {
      setIsPlaying(true);
      return;
    }
    setActiveRadio(radio);
    setIsPlaying(true);
    setIsBuffering(true);
  }, [activeRadio]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const stopRadio = useCallback(() => {
    setIsPlaying(false);
    setActiveRadio(null);
  }, []);

  const setBufferingState = useCallback((state: boolean) => {
    setIsBuffering(state);
  }, []);

  const setPlayingState = useCallback((state: boolean) => {
    setIsPlaying(state);
  }, []);

  return (
    <RadioContext.Provider value={{
      activeRadio,
      isPlaying,
      isBuffering,
      playRadio,
      togglePlay,
      stopRadio,
      setBufferingState,
      setPlayingState
    }}>
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};