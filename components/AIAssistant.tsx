import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, Play } from 'lucide-react';
import { Channel } from '../types';
import { askTvAssistant, AIResponse } from '../services/aiService';
import { useNavigate } from 'react-router-dom';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  recommendations?: Channel[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, channels }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Olá! Eu sou a IA da MegaTV. O que você gostaria de assistir hoje? Posso sugerir filmes, esportes, desenhos ou notícias!' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userText = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response: AIResponse = await askTvAssistant(userText, channels);
      
      const recommendedChannels = response.recommendedIds
        .map(id => channels.find(c => c.id === id))
        .filter((c): c is Channel => !!c);

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: response.message,
        recommendations: recommendedChannels
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "Desculpe, não consegui conectar com o servidor de inteligência agora." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelClick = (id: string) => {
    navigate(`/watch/${id}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-dark border-l border-gray-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white leading-none">Assistente IA</h3>
              <p className="text-xs text-purple-300 font-medium">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-br-none shadow-md shadow-primary/10' 
                    : 'bg-card border border-gray-700 text-gray-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Recommendations Grid */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-3 w-full grid grid-cols-2 gap-2">
                  {msg.recommendations.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelClick(channel.id)}
                      className="group flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700 border border-gray-700 hover:border-primary/50 rounded-lg p-2 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded bg-black/40 flex-shrink-0 flex items-center justify-center p-1">
                        <img src={channel.image} alt={channel.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-200 truncate group-hover:text-primary transition-colors">{channel.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">Assistir agora</p>
                      </div>
                      <Play className="w-3 h-3 text-gray-500 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm pl-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
              <span>Pensando...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-gray-800">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Quero ver um filme de ação..."
              className="w-full bg-dark border border-gray-700 text-white rounded-full py-3 pl-4 pr-12 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-500 text-sm"
            />
            <button 
              type="submit" 
              disabled={!query.trim() || isLoading}
              className="absolute right-1.5 top-1.5 p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};