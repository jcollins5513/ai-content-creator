'use client';

import { useState } from 'react';
import { useImageCategories } from '@/hooks/useImageCategories';

interface CategoryManagerProps {
  onCategoryChange?: () => void;
}

export function CategoryManager({ onCategoryChange }: CategoryManagerProps) {
  const {
    categories,
    loading,
    error,
    stats,
    addCustomCategory,
    removeCustomCategory,
    renameCustomCategory,
  } = useImageCategories();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addCustomCategory(newCategoryName);
      setNewCategoryName('');
      onCategoryChange?.();
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCategory = async (categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the "${categoryName}" category? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await removeCustomCategory(categoryName);
      onCategoryChange?.();
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditingName(categoryName);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editingName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await renameCustomCategory(editingCategory, editingName);
      setEditingCategory(null);
      setEditingName('');
      onCategoryChange?.();
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditingName('');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Image Categories
        </h3>
        {stats && (
          <div className="text-sm text-gray-600 mb-4">
            <p>Total: {stats.totalCategories} categories</p>
            <p>Default: {stats.defaultCategories} | Custom: {stats.customCategories}</p>
            {stats.remainingSlots !== -1 && (
              <p>Remaining slots: {stats.remainingSlots}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Add new category form */}
      {stats?.canAddMore && (
        <form onSubmit={handleAddCategory} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
              maxLength={50}
            />
            <button
              type="submit"
              disabled={!newCategoryName.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Categories list */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.name}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
          >
            <div className="flex items-center gap-3">
              {editingCategory === category.name ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isSubmitting}
                  maxLength={50}
                  autoFocus
                />
              ) : (
                <span className="font-medium text-gray-900">
                  {category.name}
                </span>
              )}
              
              {!category.isCustom && (
                <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                  Default
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {editingCategory === category.name ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editingName.trim() || isSubmitting}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                category.canDelete && (
                  <>
                    <button
                      onClick={() => handleStartEdit(category.name)}
                      disabled={isSubmitting}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleRemoveCategory(category.name)}
                      disabled={isSubmitting}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Delete
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {!stats?.canAddMore && stats?.remainingSlots === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You've reached the maximum number of custom categories for your plan. 
            <button className="ml-1 text-yellow-900 underline hover:no-underline">
              Upgrade to Premium
            </button> for unlimited categories.
          </p>
        </div>
      )}
    </div>
  );
}