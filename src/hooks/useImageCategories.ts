import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ImageCategoriesService, ImageCategoryInfo } from '@/services/imageCategories';

export interface UseImageCategoriesReturn {
  categories: ImageCategoryInfo[];
  loading: boolean;
  error: string | null;
  stats: {
    totalCategories: number;
    defaultCategories: number;
    customCategories: number;
    canAddMore: boolean;
    remainingSlots: number;
  } | null;
  addCustomCategory: (name: string) => Promise<void>;
  removeCustomCategory: (name: string) => Promise<void>;
  renameCustomCategory: (oldName: string, newName: string) => Promise<void>;
  canAddMore: () => Promise<boolean>;
  refreshCategories: () => Promise<void>;
}

export function useImageCategories(): UseImageCategoriesReturn {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ImageCategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UseImageCategoriesReturn['stats']>(null);

  // Load categories and stats
  const loadCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const [categoriesData, statsData] = await Promise.all([
        ImageCategoriesService.getUserCategories(user.uid),
        ImageCategoriesService.getCategoryStats(user.uid),
      ]);

      setCategories(categoriesData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load categories when user changes
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Add custom category
  const addCustomCategory = async (name: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await ImageCategoriesService.addCustomCategory(user.uid, name);
      await loadCategories(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Remove custom category
  const removeCustomCategory = async (name: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await ImageCategoriesService.removeCustomCategory(user.uid, name);
      await loadCategories(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Rename custom category
  const renameCustomCategory = async (oldName: string, newName: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await ImageCategoriesService.renameCustomCategory(user.uid, oldName, newName);
      await loadCategories(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Check if user can add more categories
  const canAddMore = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const result = await ImageCategoriesService.canAddCustomCategory(user.uid);
      return result.canAdd;
    } catch (err) {
      console.error('Error checking category limits:', err);
      return false;
    }
  };

  // Refresh categories
  const refreshCategories = async (): Promise<void> => {
    await loadCategories();
  };

  return {
    categories,
    loading,
    error,
    stats,
    addCustomCategory,
    removeCustomCategory,
    renameCustomCategory,
    canAddMore,
    refreshCategories,
  };
}