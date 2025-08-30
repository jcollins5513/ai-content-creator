// Default image categories
export const DEFAULT_IMAGE_CATEGORIES = [
  { id: 'backgrounds', name: 'Backgrounds', isCustom: false },
  { id: 'logos-branding', name: 'Logos/Branding', isCustom: false },
  { id: 'marketing', name: 'Marketing', isCustom: false },
  { id: 'badges', name: 'Badges', isCustom: false },
];

// Built-in content templates
export const BUILT_IN_TEMPLATES = {
  AUTOMOTIVE: 'automotive',
  RETAIL: 'retail',
  RESTAURANT: 'restaurant',
} as const;

// Canvas settings
export const DEFAULT_CANVAS_SIZE = {
  width: 800,
  height: 600,
};

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Subscription limits
export const FREE_TIER_LIMITS = {
  customCategories: 2,
  customTemplates: 2,
  contentGenerationsPerMonth: 50,
  storageLimit: 100 * 1024 * 1024, // 100MB
};

export const PREMIUM_TIER_LIMITS = {
  customCategories: 10,
  customTemplates: 20,
  contentGenerationsPerMonth: 1000,
  storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
};