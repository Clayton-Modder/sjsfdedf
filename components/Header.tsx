import React from 'react';
import { Search, Tv } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchTerm: string;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, searchTerm }) => {
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

        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Buscar canais..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-card border border-gray-700 text-white rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-500 text-sm sm:text-base"
          />
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </header>
  );
};