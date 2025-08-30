import { UserProfileService } from './userProfile';
import { DEFAULT_IMAGE_CATEGORIES, FREE_TIER_LIMITS } from '@/types/firestore';

export interface ImageCategoryInfo {
  name: string;
  isCustom: boolean;
  canDelete: boolean;
}

export class ImageCategoriesService {
  
  // Get all available categories for a user (default + custom)
  static async getUserCategories(userId: string): Promise<ImageCategoryInfo[]> {
    const profile = await UserProfileService.getUserProfile(userId);
    
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    const categories: ImageCategoryInfo[] = [];
    
    // Add default categories
    DEFAULT_IMAGE_CATEGORIES.forEach(category => {
      categories.push({
        name: category,
        isCustom: false,
        canDelete: false,
      });
    });
    
    // Add custom categories
    profile.customImageCategories.forEach(category => {
      categories.push({
        name: category,
        isCustom: true,
        canDelete: true,
      });
    });
    
    return categories;
  }
  
  // Add a new custom category
  static async addCustomCategory(userId: string, categoryName: string): Promise<void> {
    const profile = await UserProfileService.getUserProfile(userId);
    
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Validate category name
    const validation = this.validateCategoryName(categoryName, profile.customImageCategories);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    // Check if user can add more categories
    if (profile.subscriptionPlan === 'free' && 
        profile.customImageCategories.length >= FREE_TIER_LIMITS.CUSTOM_CATEGORIES) {
      throw new Error(`Free tier users can only create ${FREE_TIER_LIMITS.CUSTOM_CATEGORIES} custom categories. Upgrade to premium for unlimited categories.`);
    }
    
    // Add the new category
    const updatedCategories = [...profile.customImageCategories, categoryName.trim()];
    
    await UserProfileService.updateUserProfile(userId, {
      customImageCategories: updatedCategories,
    });
  }
  
  // Remove a custom category
  static async removeCustomCategory(userId: string, categoryName: string): Promise<void> {
    const profile = await UserProfileService.getUserProfile(userId);
    
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Check if category exists and is custom
    if (!profile.customImageCategories.includes(categoryName)) {
      throw new Error('Category not found or is not a custom category');
    }
    
    // Remove the category
    const updatedCategories = profile.customImageCategories.filter(
      cat => cat !== categoryName
    );
    
    await UserProfileService.updateUserProfile(userId, {
      customImageCategories: updatedCategories,
    });
  }
  
  // Rename a custom category
  static async renameCustomCategory(
    userId: string, 
    oldName: string, 
    newName: string
  ): Promise<void> {
    const profile = await UserProfileService.getUserProfile(userId);
    
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Check if old category exists and is custom
    if (!profile.customImageCategories.includes(oldName)) {
      throw new Error('Category not found or is not a custom category');
    }
    
    // Validate new category name
    const otherCategories = profile.customImageCategories.filter(cat => cat !== oldName);
    const validation = this.validateCategoryName(newName, otherCategories);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    // Update the category name
    const updatedCategories = profile.customImageCategories.map(cat => 
      cat === oldName ? newName.trim() : cat
    );
    
    await UserProfileService.updateUserProfile(userId, {
      customImageCategories: updatedCategories,
    });
  }
  
  // Check if user can add more custom categories
  static async canAddCustomCategory(userId: string): Promise<{
    canAdd: boolean;
    reason?: string;
    currentCount: number;
    maxAllowed: number;
  }> {
    const profile = await UserProfileService.getUserProfile(userId);
    
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    const currentCount = profile.customImageCategories.length;
    
    if (profile.subscriptionPlan === 'premium') {
      return {
        canAdd: true,
        currentCount,
        maxAllowed: -1, // Unlimited
      };
    }
    
    // Free tier limits
    const maxAllowed = FREE_TIER_LIMITS.CUSTOM_CATEGORIES;
    const canAdd = currentCount < maxAllowed;
    
    return {
      canAdd,
      reason: canAdd ? undefined : `Free tier users can only create ${maxAllowed} custom categories. Upgrade to premium for unlimited categories.`,
      currentCount,
      maxAllowed,
    };
  }
  
  // Validate category name
  static validateCategoryName(
    categoryName: string, 
    existingCustomCategories: string[] = []
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const trimmedName = categoryName.trim();
    
    // Check if empty
    if (!trimmedName) {
      errors.push('Category name cannot be empty');
    }
    
    // Check length
    if (trimmedName.length > 50) {
      errors.push('Category name cannot exceed 50 characters');
    }
    
    // Check for invalid characters
    if (!/^[a-zA-Z0-9\s\-_/]+$/.test(trimmedName)) {
      errors.push('Category name can only contain letters, numbers, spaces, hyphens, underscores, and forward slashes');
    }
    
    // Check if conflicts with default categories
    if (DEFAULT_IMAGE_CATEGORIES.includes(trimmedName as any)) {
      errors.push(`"${trimmedName}" is a default category name and cannot be used as a custom category`);
    }
    
    // Check if already exists in custom categories
    if (existingCustomCategories.includes(trimmedName)) {
      errors.push(`Category "${trimmedName}" already exists`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  // Get category statistics
  static async getCategoryStats(userId: string): Promise<{
    totalCategories: number;
    defaultCategories: number;
    customCategories: number;
    canAddMore: boolean;
    remainingSlots: number;
  }> {
    const categories = await this.getUserCategories(userId);
    const canAddInfo = await this.canAddCustomCategory(userId);
    
    const defaultCount = categories.filter(cat => !cat.isCustom).length;
    const customCount = categories.filter(cat => cat.isCustom).length;
    
    return {
      totalCategories: categories.length,
      defaultCategories: defaultCount,
      customCategories: customCount,
      canAddMore: canAddInfo.canAdd,
      remainingSlots: canAddInfo.maxAllowed === -1 ? -1 : canAddInfo.maxAllowed - customCount,
    };
  }
}