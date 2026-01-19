import React from 'react';
import { Category } from '../types';
import { 
  LayoutGrid, 
  Flame, 
  Trophy, 
  Baby, 
  Globe, 
  Clapperboard, 
  Newspaper, 
  Tv, 
  Shuffle,
  Heart,
  LucideIcon 
} from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  activeCategoryId: number;
  onSelectCategory: (id: number) => void;
}

// Map category IDs to specific icons
const getCategoryIcon = (id: number): LucideIcon => {
  switch (id) {
    case 0: return LayoutGrid;    // Todos
    case -1: return Heart;        // Favoritos
    case 8: return Flame;         // BBB
    case 6: return Tv;            // TV Aberta
    case 1: return Trophy;        // Esportes
    case 4: return Clapperboard;  // Filmes e Séries
    case 2: return Baby;          // Infantil
    case 5: return Newspaper;     // Noticias
    case 3: return Globe;         // Documentarios
    case 7: return Shuffle;       // Variedades
    default: return Tv;
  }
};

export const CategoryList: React.FC<CategoryListProps> = ({ 
  categories, 
  activeCategoryId, 
  onSelectCategory 
}) => {
  return (
    <div className="w-full bg-dark border-b border-gray-800 sticky top-[65px] z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.id);
            const isActive = activeCategoryId === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
                  flex items-center gap-2 flex-shrink-0 border
                  ${isActive 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-105' 
                    : 'bg-card text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white hover:border-gray-500'}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} ${category.id === -1 && !isActive ? 'text-primary' : ''}`} />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};