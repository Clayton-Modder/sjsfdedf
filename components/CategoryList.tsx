import React from 'react';
import { Category } from '../types';

interface CategoryListProps {
  categories: Category[];
  activeCategoryId: number;
  onSelectCategory: (id: number) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ 
  categories, 
  activeCategoryId, 
  onSelectCategory 
}) => {
  return (
    <div className="w-full bg-dark border-b border-gray-800 sticky top-[65px] z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`
                whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
                flex-shrink-0 border
                ${activeCategoryId === category.id 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-105' 
                  : 'bg-card text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white hover:border-gray-600'}
              `}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};