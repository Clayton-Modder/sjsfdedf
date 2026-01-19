import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Channel } from '../types';
import { Tv, CornerDownLeft } from 'lucide-react';

interface RemoteControlProps {
  channels: Channel[];
}

export const RemoteControl: React.FC<RemoteControlProps> = ({ channels }) => {
  const [inputBuffer, setInputBuffer] = useState<string>("");
  const [targetChannel, setTargetChannel] = useState<Channel | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Determine potential channel based on current buffer
    if (inputBuffer) {
      const index = parseInt(inputBuffer) - 1; // 1-based index for user
      if (index >= 0 && index < channels.length) {
        setTargetChannel(channels[index]);
      } else {
        setTargetChannel(null);
      }
    } else {
      setTargetChannel(null);
    }
  }, [inputBuffer, channels]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (like search)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Handle Numbers
      if (/^[0-9]$/.test(e.key)) {
        setInputBuffer(prev => {
          // Limit to 4 digits
          if (prev.length >= 4) return prev;
          return prev + e.key;
        });
        
        // Reset timer
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(executeChannelSwitch, 2000); // 2 seconds delay
      }

      // Handle Enter (Confirm immediately)
      if (e.key === 'Enter' && inputBuffer) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        executeChannelSwitch();
      }

      // Handle Backspace (Correction)
      if (e.key === 'Backspace') {
        setInputBuffer(prev => prev.slice(0, -1));
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (inputBuffer.length > 1) {
             timeoutRef.current = window.setTimeout(executeChannelSwitch, 2000);
        }
      }
      
      // Handle Escape (Cancel)
      if (e.key === 'Escape') {
          setInputBuffer("");
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inputBuffer, channels]); // Dependencies for the event listener closure

  const executeChannelSwitch = () => {
    if (!inputBuffer) return;

    const index = parseInt(inputBuffer) - 1;
    
    // Clear buffer immediately to hide UI
    const currentBuffer = inputBuffer; // Capture for logic
    setInputBuffer("");
    
    if (index >= 0 && index < channels.length) {
      const channel = channels[index];
      // console.log(`Switching to Channel ${currentBuffer}: ${channel.name}`);
      navigate(`/watch/${channel.id}`);
    } else {
      // console.log(`Channel ${currentBuffer} not found`);
      // Optional: Show "Channel not found" temporary toast
    }
  };

  if (!inputBuffer) return null;

  return (
    <div className="fixed top-20 right-8 z-[100] animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none select-none">
      <div className="bg-black/80 backdrop-blur-md border border-green-500/30 rounded-lg p-4 shadow-2xl min-w-[200px] flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
           <span className="text-green-500 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
             <Tv className="w-4 h-4" /> Canal
           </span>
           <span className="text-4xl font-bold font-mono text-green-400 tracking-tighter drop-shadow-green">
             {inputBuffer}
           </span>
        </div>
        
        <div className="pt-1">
          {targetChannel ? (
            <div className="text-white font-medium truncate text-lg">
              {targetChannel.name}
            </div>
          ) : (
             <div className="text-red-400 font-mono text-sm">
               Canal não encontrado
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-wider mt-1">
            <CornerDownLeft className="w-3 h-3" />
            <span>Enter para ir</span>
        </div>
      </div>
    </div>
  );
};