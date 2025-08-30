import { Timestamp } from 'firebase/firestore';

// User Profile Model
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  customImageCategories: string[];
  subscriptionPlan: 'free' | 'premium';
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  usageStats: {
    contentGenerations: number;
    designsCreated: number;
    imagesUploaded: number;
  };
}

// Template Question Model
export interface TemplateQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'textarea';
  options?: string[];
  required: boolean;
}

// Content Template Model
export interface ContentTemplate {
  id: string;
  userId?: string; // null for built-in templates
  name: string;
  industry: string;
  description: string;
  questions: TemplateQuestion[];
  promptTemplate: string;
  isActive: boolean;
  createdAt: Timestamp;
}

// Canvas Element Models
export interface BaseCanvasElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface TextElement extends BaseCanvasElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseCanvasElement {
  type: 'image';
  imageUrl: string;
  opacity: number;
}

export type CanvasElement = TextElement | ImageElement;

// Design Project Model
export interface DesignProject {
  id: string;
  userId: string;
  name: string;
  templateUsed?: string;
  canvasSettings: {
    width: number;
    height: number;
    backgroundColor?: string;
    backgroundImage?: string;
  };
  elements: CanvasElement[];
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    version: number;
    tags?: string[];
  };
}

// Image Metadata Model
export interface ImageMetadata {
  id: string;
  userId: string;
  filename: string;
  category: string;
  storageUrl: string;
  metadata: {
    size: number;
    dimensions: { width: number; height: number };
    uploadedAt: Timestamp;
  };
}

// Collection Names Constants
export const COLLECTIONS = {
  USERS: 'users',
  TEMPLATES: 'templates',
  DESIGNS: 'designs',
  IMAGES: 'images',
} as const;

// Default Image Categories
export const DEFAULT_IMAGE_CATEGORIES = [
  'Backgrounds',
  'Logos/Branding', 
  'Marketing',
  'Badges'
] as const;

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PREMIUM: 'premium'
} as const;

// Usage Limits for Free Tier
export const FREE_TIER_LIMITS = {
  CUSTOM_TEMPLATES: 2,
  CUSTOM_CATEGORIES: 2,
  MONTHLY_CONTENT_GENERATIONS: 50,
  STORAGE_MB: 100
} as const;