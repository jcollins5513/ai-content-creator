'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getUserImages,
  getUserImagesByCategory,
  deleteImage,
  updateImageFilename,
  moveImageToCategory,
  getUserStorageUsage,
  getImageCountByCategory,
} from '@/services/imageService';
import { ImageMetadata } from '@/types';

interface UseImagesReturn {
  images: ImageMetadata[];
  loading: boolean;
  error: string | null;
  storageUsage: number;
  categoryCount: Record<string, number>;
  refreshImages: () => Promise<void>;
  getImagesByCategory: (category: string) => Promise<ImageMetadata[]>;
  deleteImageById: (imageId: string) => Promise<void>;
  renameImage: (imageId: string, newFilename: string) => Promise<void>;
  moveImage: (imageId: string, newCategory: string) => Promise<void>;
  refreshStorageUsage: () => Promise<void>;
  refreshCategoryCount: () => Promise<void>;
}

export const useImages = (): UseImagesReturn => {
  const { user } = useAuth();
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageUsage, setStorageUsage] = useState(0);
  const [categoryCount, setCategoryCount] = useState<Record<string, number>>({});

  // Define utility functions first
  const refreshStorageUsage = useCallback(async () => {
    if (!user) {
      setStorageUsage(0);
      return;
    }

    try {
      const usage = await getUserStorageUsage(user.uid);
      setStorageUsage(usage);
    } catch (err) {
      console.error('Error fetching storage usage:', err);
    }
  }, [user]);

  const refreshCategoryCount = useCallback(async () => {
    if (!user) {
      setCategoryCount({});
      return;
    }

    try {
      const counts = await getImageCountByCategory(user.uid);
      setCategoryCount(counts);
    } catch (err) {
      console.error('Error fetching category counts:', err);
    }
  }, [user]);

  const refreshImages = useCallback(async () => {
    if (!user) {
      setImages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userImages = await getUserImages(user.uid);
      setImages(userImages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch images';
      setError(errorMessage);
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getImagesByCategory = useCallback(async (category: string): Promise<ImageMetadata[]> => {
    if (!user) return [];

    try {
      return await getUserImagesByCategory(user.uid, category);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch images by category';
      setError(errorMessage);
      console.error('Error fetching images by category:', err);
      return [];
    }
  }, [user]);

  const deleteImageById = useCallback(async (imageId: string) => {
    if (!user) return;

    try {
      await deleteImage(imageId);
      // Remove from local state
      setImages(prev => prev.filter(img => img.id !== imageId));
      // Refresh storage usage and category count
      await refreshStorageUsage();
      await refreshCategoryCount();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete image';
      setError(errorMessage);
      console.error('Error deleting image:', err);
      throw err; // Re-throw to allow component to handle
    }
  }, [user, refreshStorageUsage, refreshCategoryCount]);

  const renameImage = useCallback(async (imageId: string, newFilename: string) => {
    if (!user) return;

    try {
      await updateImageFilename(imageId, newFilename);
      // Update local state
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, filename: newFilename } : img
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename image';
      setError(errorMessage);
      console.error('Error renaming image:', err);
      throw err;
    }
  }, [user]);

  const moveImage = useCallback(async (imageId: string, newCategory: string) => {
    if (!user) return;

    try {
      await moveImageToCategory(imageId, newCategory);
      // Update local state
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, category: newCategory } : img
      ));
      // Refresh category count
      await refreshCategoryCount();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move image';
      setError(errorMessage);
      console.error('Error moving image:', err);
      throw err;
    }
  }, [user, refreshCategoryCount]);

  // Load images when user changes
  useEffect(() => {
    refreshImages();
  }, [refreshImages]);

  // Load storage usage and category count when user changes
  useEffect(() => {
    refreshStorageUsage();
    refreshCategoryCount();
  }, [refreshStorageUsage, refreshCategoryCount]);

  return {
    images,
    loading,
    error,
    storageUsage,
    categoryCount,
    refreshImages,
    getImagesByCategory,
    deleteImageById,
    renameImage,
    moveImage,
    refreshStorageUsage,
    refreshCategoryCount,
  };
};