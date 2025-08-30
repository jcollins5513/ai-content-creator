import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { DEFAULT_IMAGE_CATEGORIES, SUBSCRIPTION_PLANS, FREE_TIER_LIMITS } from '@/types/firestore';

// User Profile Service Functions
export class UserProfileService {
  
  // Create a new user profile on first login
  static async createUserProfile(
    uid: string, 
    email: string, 
    displayName?: string
  ): Promise<UserProfile> {
    const userDocRef = doc(db, 'users', uid);
    
    // Check if profile already exists
    const existingDoc = await getDoc(userDocRef);
    if (existingDoc.exists()) {
      throw new Error('User profile already exists');
    }
    
    const newProfile: UserProfile = {
      uid,
      email,
      displayName,
      customImageCategories: [],
      subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      usageStats: {
        contentGenerations: 0,
        designsCreated: 0,
        imagesUploaded: 0,
      },
    };
    
    // Save to Firestore with server timestamps
    await setDoc(userDocRef, {
      ...newProfile,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    });
    
    return newProfile;
  }
  
  // Get user profile by UID
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    return {
      uid: userDoc.id,
      email: data.email,
      displayName: data.displayName,
      customImageCategories: data.customImageCategories || [],
      subscriptionPlan: data.subscriptionPlan || SUBSCRIPTION_PLANS.FREE,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      usageStats: data.usageStats || {
        contentGenerations: 0,
        designsCreated: 0,
        imagesUploaded: 0,
      },
    };
  }
  
  // Update user profile
  static async updateUserProfile(
    uid: string, 
    updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>
  ): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    
    // Convert Date objects to Timestamps for Firestore
    const firestoreUpdates: any = { ...updates };
    if (updates.lastLoginAt) {
      firestoreUpdates.lastLoginAt = Timestamp.fromDate(updates.lastLoginAt);
    }
    
    await updateDoc(userDocRef, firestoreUpdates);
  }
  
  // Update last login time
  static async updateLastLoginTime(uid: string): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      lastLoginAt: Timestamp.now(),
    });
  }
  
  // Get or create user profile (used during auth)
  static async getOrCreateUserProfile(
    uid: string, 
    email: string, 
    displayName?: string
  ): Promise<UserProfile> {
    let profile = await this.getUserProfile(uid);
    
    if (!profile) {
      profile = await this.createUserProfile(uid, email, displayName);
    } else {
      // Update last login time
      await this.updateLastLoginTime(uid);
      profile.lastLoginAt = new Date();
    }
    
    return profile;
  }

  // Usage Statistics Management
  static async incrementUsageStats(
    uid: string, 
    statType: keyof UserProfile['usageStats']
  ): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const currentStats = userDoc.data().usageStats || {
        contentGenerations: 0,
        designsCreated: 0,
        imagesUploaded: 0,
      };
      
      await updateDoc(userDocRef, {
        [`usageStats.${statType}`]: currentStats[statType] + 1,
      });
    }
  }
  
  // Check if user has reached free tier limits
  static async checkUsageLimits(uid: string): Promise<{
    canGenerateContent: boolean;
    canCreateCustomTemplate: boolean;
    canAddCustomCategory: boolean;
    remainingGenerations: number;
    customTemplatesUsed: number;
    customCategoriesUsed: number;
  }> {
    const profile = await this.getUserProfile(uid);
    
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // For premium users, no limits apply
    if (profile.subscriptionPlan === SUBSCRIPTION_PLANS.PREMIUM) {
      return {
        canGenerateContent: true,
        canCreateCustomTemplate: true,
        canAddCustomCategory: true,
        remainingGenerations: -1, // Unlimited
        customTemplatesUsed: profile.customImageCategories.length,
        customCategoriesUsed: profile.customImageCategories.length,
      };
    }
    
    // For free tier users, check limits
    const remainingGenerations = Math.max(
      0, 
      FREE_TIER_LIMITS.MONTHLY_CONTENT_GENERATIONS - profile.usageStats.contentGenerations
    );
    
    return {
      canGenerateContent: remainingGenerations > 0,
      canCreateCustomTemplate: profile.customImageCategories.length < FREE_TIER_LIMITS.CUSTOM_TEMPLATES,
      canAddCustomCategory: profile.customImageCategories.length < FREE_TIER_LIMITS.CUSTOM_CATEGORIES,
      remainingGenerations,
      customTemplatesUsed: profile.customImageCategories.length,
      customCategoriesUsed: profile.customImageCategories.length,
    };
  }
  
  // Reset monthly usage stats (would be called by a scheduled function)
  static async resetMonthlyUsage(uid: string): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      'usageStats.contentGenerations': 0,
    });
  }
  
  // Update subscription plan
  static async updateSubscriptionPlan(
    uid: string, 
    plan: 'free' | 'premium'
  ): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      subscriptionPlan: plan,
    });
  }
  
  // Get user's available image categories (default + custom)
  static async getUserImageCategories(uid: string): Promise<string[]> {
    const profile = await this.getUserProfile(uid);
    
    if (!profile) {
      return [...DEFAULT_IMAGE_CATEGORIES];
    }
    
    return [...DEFAULT_IMAGE_CATEGORIES, ...profile.customImageCategories];
  }
  
  // Validate user profile data
  static validateProfileData(data: Partial<UserProfile>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }
    
    if (data.customImageCategories) {
      if (data.customImageCategories.length > FREE_TIER_LIMITS.CUSTOM_CATEGORIES) {
        errors.push(`Cannot have more than ${FREE_TIER_LIMITS.CUSTOM_CATEGORIES} custom categories`);
      }
      
      // Check for duplicate categories
      const uniqueCategories = new Set(data.customImageCategories);
      if (uniqueCategories.size !== data.customImageCategories.length) {
        errors.push('Duplicate custom categories are not allowed');
      }
      
      // Check for conflicts with default categories
      const conflicts = data.customImageCategories.filter(cat => 
        DEFAULT_IMAGE_CATEGORIES.includes(cat as any)
      );
      if (conflicts.length > 0) {
        errors.push(`Custom categories cannot use default names: ${conflicts.join(', ')}`);
      }
    }
    
    if (data.subscriptionPlan && !Object.values(SUBSCRIPTION_PLANS).includes(data.subscriptionPlan)) {
      errors.push('Invalid subscription plan');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}