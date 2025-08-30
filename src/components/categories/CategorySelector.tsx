'use client';

import { useImageCategories } from '@/hooks/useImageCategories';

interface CategorySelectorProps {
  selectedCategory?: string;
  onCategorySelect: (category: string) => void;
  showAllOption?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CategorySelector({
  selectedCategory,
  onCategorySelect,
  showAllOption = true,
  disabled = false,
  className = '',
}: CategorySelectorProps) {
  const { categories, loading, error } = useImageCategories();

  if (loading) {
    return (
      <select disabled className={`animate-pulse bg-gray-200 ${className}`}>
        <option>Loading categories...</option>
      </select>
    );
  }

  if (error) {
    return (
      <select disabled className={className}>
        <option>Error loading categories</option>
      </select>
    );
  }

  return (
    <select
      value={selectedCategory || ''}
      onChange={(e) => onCategorySelect(e.target.value)}
      disabled={disabled}
      className={`border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      {showAllOption && (
        <option value="">All Categories</option>
      )}
      {categories.map((category) => (
        <option key={category.name} value={category.name}>
          {category.name} {!category.isCustom && '(Default)'}
        </option>
      ))}
    </select>
  );
}

// Simple category list component for display purposes
interface CategoryListProps {
  showCustomOnly?: boolean;
  className?: string;
}

export function CategoryList({ showCustomOnly = false, className = '' }: CategoryListProps) {
  const { categories, loading, error } = useImageCategories();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error loading categories
      </div>
    );
  }

  const filteredCategories = showCustomOnly 
    ? categories.filter(cat => cat.isCustom)
    : categories;

  if (filteredCategories.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        {showCustomOnly ? 'No custom categories' : 'No categories available'}
      </div>
    );
  }

  return (
    <div className={className}>
      <ul className="space-y-1">
        {filteredCategories.map((category) => (
          <li key={category.name} className="flex items-center justify-between">
            <span className="text-gray-900">{category.name}</span>
            {!category.isCustom && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Default
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}