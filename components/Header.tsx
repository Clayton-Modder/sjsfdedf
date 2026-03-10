import React from 'react';
import { Search, Tv, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchTerm: string;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, searchTerm }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div 
          className="flex items-center gap-2 flex-shrink-0 cursor-pointer" 
          onClick={() => {
            navigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Página Inicial"
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
            <Tv className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block text-gray-900 dark:text-white">
            TV Online <span className="text-primary">HD</span>
          </span>
        </div>

        <div className="flex-1 max-w-xl flex items-center gap-2 sm:gap-4 justify-end">
          <div className="flex-1 relative max-w-md" title="Buscar canais">
            <input
              type="text"
              placeholder="Buscar canais..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-gray-100 dark:bg-card border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-500 text-sm sm:text-base"
            />
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => navigate(user ? '/profile' : '/login')}
              className="p-2 sm:p-2.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-2"
              title={user ? "Meu Perfil" : "Entrar / Cadastrar"}
            >
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img src={user.profilePic} alt={user.username} className="w-8 h-8 rounded-full border-2 border-primary" />
                    <div className="absolute -bottom-1 -right-1 bg-primary text-[8px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center border border-dark">
                      {user.level}
                    </div>
                  </div>
                  <span className="text-sm font-bold hidden md:block">{user.username}</span>
                </div>
              ) : (
                <User className="w-6 h-6" />
              )}
            </button>

            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="p-2.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-primary transition-colors"
                title="Painel Administrativo"
              >
                <Settings className="w-6 h-6" />
              </button>
            )}

            <button 
              onClick={() => navigate('/settings')}
              className="p-2.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              title="Configurações e Ajustes"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
