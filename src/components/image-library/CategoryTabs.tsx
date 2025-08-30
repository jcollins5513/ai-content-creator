'use client';

import React from 'react';
import { ImageCategory } from '@/types';

interface CategoryTabsProps {
  categories: ImageCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  className?: string;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="flex min-w-max">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${activeCategory === category.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <span className="flex items-center space-x-2">
              <span>{category.name}</span>
              {category.isCustom && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                  Custom
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;