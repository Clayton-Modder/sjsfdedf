import React from 'react';
import { Search, Tv, Sparkles } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchTerm: string;
  onOpenAI: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, searchTerm, onOpenAI }) => {
  return (
    <header className="sticky top-0 z-50 bg-dark/90 backdrop-blur-md border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
            <Tv className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Mega<span className="text-primary">TV</span>
          </span>
        </div>

        <div className="flex-1 max-w-xl flex items-center gap-2 sm:gap-4 justify-end">
          <div className="flex-1 relative max-w-md">
            <input
              type="text"
              placeholder="Buscar canais..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-card border border-gray-700 text-white rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-500 text-sm sm:text-base"
            />
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <button
            onClick={onOpenAI}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 sm:px-4 py-2.5 rounded-full font-medium text-sm transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 group whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">IA Assistente</span>
            <span className="sm:hidden">IA</span>
          </button>
        </div>
      </div>
    </header>
  );
};