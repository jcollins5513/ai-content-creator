import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  StorageReference,
} from 'firebase/storage';
import { storage } from './firebase';

// Storage path constants
export const STORAGE_PATHS = {
  USER_IMAGES: (userId: string, category: string) => `users/${userId}/images/${category}`,
  USER_THUMBNAILS: (userId: string, category: string) => `users/${userId}/thumbnails/${category}`,
  USER_EXPORTS: (userId: string) => `users/${userId}/exports`,
  USER_PROCESSED: (userId: string) => `users/${userId}/processed`,
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  THUMBNAIL: 1 * 1024 * 1024, // 1MB
  EXPORT: 20 * 1024 * 1024, // 20MB
} as const;

// Supported image types
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
] as const;

// Upload progress callback type
export type UploadProgressCallback = (progress: number) => void;

// Validate file type
export const isValidImageFile = (file: File): boolean => {
  return SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number]);
};

// Validate file size
export const isValidFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
};

// Upload image to user's category folder
export const uploadUserImage = async (
  userId: string,
  category: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; filename: string; path: string; storagePath: string }> => {
  if (!isValidImageFile(file)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are supported.');
  }
  
  if (!isValidFileSize(file, FILE_SIZE_LIMITS.IMAGE)) {
    throw new Error(`File size exceeds limit of ${FILE_SIZE_LIMITS.IMAGE / (1024 * 1024)}MB.`);
  }
  
  const filename = generateUniqueFilename(file.name);
  const imagePath = `${STORAGE_PATHS.USER_IMAGES(userId, category)}/${filename}`;
  const imageRef = ref(storage, imagePath);
  
  if (onProgress) {
    const uploadTask = uploadBytesResumable(imageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url, filename, path: imagePath, storagePath: imagePath });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } else {
    const result = await uploadBytes(imageRef, file);
    const url = await getDownloadURL(result.ref);
    return { url, filename, path: imagePath, storagePath: imagePath };
  }
};

// Upload thumbnail image
export const uploadThumbnail = async (
  userId: string,
  category: string,
  file: File,
  originalFilename: string
): Promise<{ url: string; path: string }> => {
  if (!isValidFileSize(file, FILE_SIZE_LIMITS.THUMBNAIL)) {
    throw new Error(`Thumbnail size exceeds limit of ${FILE_SIZE_LIMITS.THUMBNAIL / (1024 * 1024)}MB.`);
  }
  
  const thumbnailPath = `${STORAGE_PATHS.USER_THUMBNAILS(userId, category)}/${originalFilename}`;
  const thumbnailRef = ref(storage, thumbnailPath);
  
  const result = await uploadBytes(thumbnailRef, file);
  const url = await getDownloadURL(result.ref);
  
  return { url, path: thumbnailPath };
};

// Upload processed image (background removed)
export const uploadProcessedImage = async (
  userId: string,
  file: File,
  originalFilename: string
): Promise<{ url: string; path: string }> => {
  if (!isValidImageFile(file)) {
    throw new Error('Invalid file type for processed image.');
  }
  
  if (!isValidFileSize(file, FILE_SIZE_LIMITS.IMAGE)) {
    throw new Error(`Processed image size exceeds limit of ${FILE_SIZE_LIMITS.IMAGE / (1024 * 1024)}MB.`);
  }
  
  const processedPath = `${STORAGE_PATHS.USER_PROCESSED(userId)}/${originalFilename}`;
  const processedRef = ref(storage, processedPath);
  
  const result = await uploadBytes(processedRef, file);
  const url = await getDownloadURL(result.ref);
  
  return { url, path: processedPath };
};

// Upload exported design
export const uploadExportedDesign = async (
  userId: string,
  file: File,
  designId: string
): Promise<{ url: string; path: string }> => {
  if (!isValidFileSize(file, FILE_SIZE_LIMITS.EXPORT)) {
    throw new Error(`Export size exceeds limit of ${FILE_SIZE_LIMITS.EXPORT / (1024 * 1024)}MB.`);
  }
  
  const exportPath = `${STORAGE_PATHS.USER_EXPORTS(userId)}/${designId}.png`;
  const exportRef = ref(storage, exportPath);
  
  const result = await uploadBytes(exportRef, file);
  const url = await getDownloadURL(result.ref);
  
  return { url, path: exportPath };
};

// Delete file from storage
export const deleteStorageFile = async (path: string): Promise<void> => {
  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
};

// Get file metadata
export const getFileMetadata = async (path: string) => {
  const fileRef = ref(storage, path);
  return await getMetadata(fileRef);
};

// List all files in a user's category
export const listUserImages = async (userId: string, category: string): Promise<StorageReference[]> => {
  const categoryRef = ref(storage, STORAGE_PATHS.USER_IMAGES(userId, category));
  const result = await listAll(categoryRef);
  return result.items;
};

// Get download URL for existing file
export const getFileDownloadURL = async (path: string): Promise<string> => {
  const fileRef = ref(storage, path);
  return await getDownloadURL(fileRef);
};

// Move file to different category (copy and delete)
export const moveImageToCategory = async (
  userId: string,
  currentPath: string,
  newCategory: string,
  filename: string
): Promise<{ url: string; path: string }> => {
  // Get the current file
  const currentRef = ref(storage, currentPath);
  const currentUrl = await getDownloadURL(currentRef);
  
  // Download the file data
  const response = await fetch(currentUrl);
  const blob = await response.blob();
  const file = new File([blob], filename, { type: blob.type });
  
  // Upload to new category
  const newResult = await uploadUserImage(userId, newCategory, file);
  
  // Delete from old location
  await deleteObject(currentRef);
  
  return newResult;
};

// Clean up orphaned files (files without corresponding Firestore records)
export const cleanupOrphanedFiles = async (userId: string, validPaths: string[]): Promise<void> => {
  const userRef = ref(storage, `users/${userId}`);
  const result = await listAll(userRef);
  
  const deletePromises = result.items
    .filter(item => !validPaths.includes(item.fullPath))
    .map(item => deleteObject(item));
  
  await Promise.all(deletePromises);
};

// Get storage usage for user
export const getUserStorageUsage = async (userId: string): Promise<number> => {
  const userRef = ref(storage, `users/${userId}`);
  const result = await listAll(userRef);
  
  let totalSize = 0;
  const metadataPromises = result.items.map(async (item) => {
    const metadata = await getMetadata(item);
    return metadata.size;
  });
  
  const sizes = await Promise.all(metadataPromises);
  totalSize = sizes.reduce((sum, size) => sum + size, 0);
  
  return totalSize;
};