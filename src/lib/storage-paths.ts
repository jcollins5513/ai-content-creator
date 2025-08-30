// Storage path utilities for organized file management

export interface StoragePathConfig {
  userId: string;
  category?: string;
  filename?: string;
  designId?: string;
}

// Generate storage paths for different file types
export class StoragePaths {
  static userImages(userId: string, category: string, filename?: string): string {
    const basePath = `users/${userId}/images/${category}`;
    return filename ? `${basePath}/${filename}` : basePath;
  }
  
  static userThumbnails(userId: string, category: string, filename?: string): string {
    const basePath = `users/${userId}/thumbnails/${category}`;
    return filename ? `${basePath}/${filename}` : basePath;
  }
  
  static userExports(userId: string, designId?: string): string {
    const basePath = `users/${userId}/exports`;
    return designId ? `${basePath}/${designId}.png` : basePath;
  }
  
  static userProcessed(userId: string, filename?: string): string {
    const basePath = `users/${userId}/processed`;
    return filename ? `${basePath}/${filename}` : basePath;
  }
  
  // Extract user ID from storage path
  static extractUserId(path: string): string | null {
    const match = path.match(/^users\/([^\/]+)\//);
    return match ? match[1] : null;
  }
  
  // Extract category from image path
  static extractCategory(path: string): string | null {
    const match = path.match(/^users\/[^\/]+\/images\/([^\/]+)\//);
    return match ? match[1] : null;
  }
  
  // Extract filename from path
  static extractFilename(path: string): string | null {
    const parts = path.split('/');
    return parts.length > 0 ? parts[parts.length - 1] : null;
  }
  
  // Validate storage path format
  static isValidUserImagePath(path: string, userId: string): boolean {
    const pattern = new RegExp(`^users/${userId}/images/[^/]+/[^/]+$`);
    return pattern.test(path);
  }
  
  static isValidUserThumbnailPath(path: string, userId: string): boolean {
    const pattern = new RegExp(`^users/${userId}/thumbnails/[^/]+/[^/]+$`);
    return pattern.test(path);
  }
  
  static isValidUserExportPath(path: string, userId: string): boolean {
    const pattern = new RegExp(`^users/${userId}/exports/[^/]+\\.png$`);
    return pattern.test(path);
  }
  
  static isValidUserProcessedPath(path: string, userId: string): boolean {
    const pattern = new RegExp(`^users/${userId}/processed/[^/]+$`);
    return pattern.test(path);
  }
}

// Default folder structure for new users
export const DEFAULT_FOLDER_STRUCTURE = {
  images: ['Backgrounds', 'Logos/Branding', 'Marketing', 'Badges'],
  thumbnails: ['Backgrounds', 'Logos/Branding', 'Marketing', 'Badges'],
  exports: [],
  processed: []
};

// Storage quota limits (in bytes)
export const STORAGE_QUOTAS = {
  FREE_TIER: 100 * 1024 * 1024, // 100MB
  PREMIUM_TIER: 1024 * 1024 * 1024, // 1GB
} as const;

// File naming conventions
export const FILE_NAMING = {
  // Sanitize filename for storage
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  },
  
  // Generate thumbnail filename from original
  getThumbnailFilename: (originalFilename: string): string => {
    const parts = originalFilename.split('.');
    const extension = parts.pop();
    const name = parts.join('.');
    return `${name}_thumb.${extension}`;
  },
  
  // Generate processed filename from original
  getProcessedFilename: (originalFilename: string): string => {
    const parts = originalFilename.split('.');
    const extension = parts.pop();
    const name = parts.join('.');
    return `${name}_processed.${extension}`;
  }
};