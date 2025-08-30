// User and Authentication Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  customImageCategories: string[];
  subscriptionPlan: 'free' | 'premium';
  createdAt: Date;
  lastLoginAt: Date;
  usageStats: {
    contentGenerations: number;
    designsCreated: number;
    imagesUploaded: number;
  };
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Image Management Types
export interface ImageMetadata {
  id: string;
  url: string;
  filename: string;
  category: string;
  uploadedAt: Date;
  size: number;
  dimensions: { width: number; height: number };
  storagePath: string;
}

export interface ImageCategory {
  id: string;
  name: string;
  isCustom: boolean;
}

// Content Generation Types
export interface TemplateQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'textarea';
  options?: string[];
  required: boolean;
}

export interface ContentTemplate {
  id: string;
  userId?: string; // null for built-in templates
  name: string;
  type: 'built-in' | 'custom';
  industry: string;
  description: string;
  questions: TemplateQuestion[];
  promptTemplate: string;
  isActive: boolean;
  createdAt: Date;
}

// Canvas and Design Types
export interface CanvasElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface TextElement extends CanvasElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageElement extends CanvasElement {
  type: 'image';
  imageUrl: string;
  opacity: number;
}

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
    createdAt: Date;
    updatedAt: Date;
    version: number;
    tags?: string[];
  };
}

// API Response Types
export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// Error Codes
export const ErrorCodes = {
  AUTH_REQUIRED: 'auth_required',
  QUOTA_EXCEEDED: 'quota_exceeded',
  INVALID_INPUT: 'invalid_input',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  STORAGE_LIMIT: 'storage_limit_exceeded'
} as const;