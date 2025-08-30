import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileService } from '@/services/userProfile';
import { UserProfile } from '@/types';

export interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  incrementUsage: (statType: keyof UserProfile['usageStats']) => Promise<void>;
  checkLimits: () => Promise<{
    canGenerateContent: boolean;
    canCreateCustomTemplate: boolean;
    canAddCustomCategory: boolean;
    remainingGenerations: number;
    customTemplatesUsed: number;
    customCategoriesUsed: number;
  }>;
  getImageCategories: () => Promise<string[]>;
  refreshProfile: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile when user changes
  useEffect(() => {
    if (user) {
      setProfile(user);
      setLoading(false);
      setError(null);
    } else {
      setProfile(null);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      // Validate the updates
      const validation = UserProfileService.validateProfileData(updates);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      await UserProfileService.updateUserProfile(user.uid, updates);
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Increment usage statistics
  const incrementUsage = async (statType: keyof UserProfile['usageStats']): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await UserProfileService.incrementUsageStats(user.uid, statType);
      
      // Update local state
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          usageStats: {
            ...prev.usageStats,
            [statType]: prev.usageStats[statType] + 1,
          },
        };
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update usage stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Check usage limits
  const checkLimits = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      return await UserProfileService.checkUsageLimits(user.uid);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check limits';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get user's image categories
  const getImageCategories = async (): Promise<string[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      return await UserProfileService.getUserImageCategories(user.uid);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get image categories';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Refresh profile from server
  const refreshProfile = async (): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const freshProfile = await UserProfileService.getUserProfile(user.uid);
      setProfile(freshProfile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    incrementUsage,
    checkLimits,
    getImageCategories,
    refreshProfile,
  };
}