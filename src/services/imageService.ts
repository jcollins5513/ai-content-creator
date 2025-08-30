import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteStorageFile, uploadUserImage, getFileDownloadURL } from '@/lib/storage';
import { ImageMetadata } from '@/types';

// Collection name
const IMAGES_COLLECTION = 'images';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: unknown): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp as string | number);
};

// Create image metadata in Firestore
export const createImageMetadata = async (
  userId: string,
  imageData: Omit<ImageMetadata, 'id'>
): Promise<ImageMetadata> => {
  try {
    const docRef = await addDoc(collection(db, IMAGES_COLLECTION), {
      ...imageData,
      userId,
      uploadedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...imageData,
    };
  } catch (error) {
    console.error('Error creating image metadata:', error);
    throw new Error('Failed to save image metadata');
  }
};

// Get all images for a user
export const getUserImages = async (userId: string): Promise<ImageMetadata[]> => {
  try {
    const q = query(
      collection(db, IMAGES_COLLECTION),
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        url: data.url,
        filename: data.filename,
        category: data.category,
        uploadedAt: convertTimestamp(data.uploadedAt),
        size: data.size,
        dimensions: data.dimensions,
        storagePath: data.storagePath || '',
      };
    });
  } catch (error) {
    console.error('Error fetching user images:', error);
    throw new Error('Failed to fetch images');
  }
};

// Get images by category for a user
export const getUserImagesByCategory = async (
  userId: string,
  category: string
): Promise<ImageMetadata[]> => {
  try {
    const q = query(
      collection(db, IMAGES_COLLECTION),
      where('userId', '==', userId),
      where('category', '==', category),
      orderBy('uploadedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        url: data.url,
        filename: data.filename,
        category: data.category,
        uploadedAt: convertTimestamp(data.uploadedAt),
        size: data.size,
        dimensions: data.dimensions,
        storagePath: data.storagePath || '',
      };
    });
  } catch (error) {
    console.error('Error fetching images by category:', error);
    throw new Error('Failed to fetch images');
  }
};

// Get single image by ID
export const getImageById = async (imageId: string): Promise<ImageMetadata | null> => {
  try {
    const docRef = doc(db, IMAGES_COLLECTION, imageId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        url: data.url,
        filename: data.filename,
        category: data.category,
        uploadedAt: convertTimestamp(data.uploadedAt),
        size: data.size,
        dimensions: data.dimensions,
        storagePath: data.storagePath || '',
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching image by ID:', error);
    throw new Error('Failed to fetch image');
  }
};

// Update image metadata
export const updateImageMetadata = async (
  imageId: string,
  updates: Partial<Omit<ImageMetadata, 'id' | 'uploadedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, IMAGES_COLLECTION, imageId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating image metadata:', error);
    throw new Error('Failed to update image');
  }
};

// Update image filename
export const updateImageFilename = async (
  imageId: string,
  newFilename: string
): Promise<void> => {
  try {
    await updateImageMetadata(imageId, { filename: newFilename });
  } catch (error) {
    console.error('Error updating image filename:', error);
    throw new Error('Failed to update image filename');
  }
};

// Move image to different category
export const moveImageToCategory = async (
  imageId: string,
  newCategory: string
): Promise<void> => {
  try {
    await updateImageMetadata(imageId, { category: newCategory });
  } catch (error) {
    console.error('Error moving image to category:', error);
    throw new Error('Failed to move image to category');
  }
};

// Delete image (both metadata and storage file)
export const deleteImage = async (imageId: string): Promise<void> => {
  try {
    // First get the image metadata to get the storage path
    const image = await getImageById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    // Delete from Storage first
    if (image.storagePath) {
      try {
        await deleteStorageFile(image.storagePath);
      } catch (storageError) {
        console.error('Error deleting storage file:', storageError);
        // Continue with Firestore deletion even if storage deletion fails
      }
    }

    // Delete from Firestore
    const docRef = doc(db, IMAGES_COLLECTION, imageId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

// Get user's total storage usage
export const getUserStorageUsage = async (userId: string): Promise<number> => {
  try {
    const images = await getUserImages(userId);
    return images.reduce((total, image) => total + image.size, 0);
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    throw new Error('Failed to calculate storage usage');
  }
};

// Get images count by category for a user
export const getImageCountByCategory = async (
  userId: string
): Promise<Record<string, number>> => {
  try {
    const images = await getUserImages(userId);
    const counts: Record<string, number> = {};
    
    images.forEach(image => {
      counts[image.category] = (counts[image.category] || 0) + 1;
    });
    
    return counts;
  } catch (error) {
    console.error('Error getting image counts by category:', error);
    throw new Error('Failed to get image counts');
  }
};

// Validate image ownership
export const validateImageOwnership = async (
  imageId: string,
  userId: string
): Promise<boolean> => {
  try {
    const image = await getImageById(imageId);
    if (!image) return false;
    
    // Check if the image belongs to the user by querying with both conditions
    const q = query(
      collection(db, IMAGES_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.some(doc => doc.id === imageId);
  } catch (error) {
    console.error('Error validating image ownership:', error);
    return false;
  }
};

// Batch operations for multiple images
export const batchDeleteImages = async (imageIds: string[]): Promise<void> => {
  try {
    const deletePromises = imageIds.map(id => deleteImage(id));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error batch deleting images:', error);
    throw new Error('Failed to delete images');
  }
};

export const batchMoveImages = async (
  imageIds: string[],
  newCategory: string
): Promise<void> => {
  try {
    const movePromises = imageIds.map(id => moveImageToCategory(id, newCategory));
    await Promise.all(movePromises);
  } catch (error) {
    console.error('Error batch moving images:', error);
    throw new Error('Failed to move images');
  }
};

// Upload image to storage and create metadata
export const uploadImageToStorage = async (
  file: File,
  category: string,
  userId?: string
): Promise<ImageMetadata> => {
  if (!userId) {
    throw new Error('User ID is required for image upload');
  }

  try {
    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    
    // Upload to storage
    const { url, filename, storagePath } = await uploadUserImage(userId, category, file);
    
    // Create metadata in Firestore
    const imageData: Omit<ImageMetadata, 'id'> = {
      url,
      filename,
      category,
      uploadedAt: new Date(),
      size: file.size,
      dimensions,
      storagePath,
    };
    
    const imageMetadata = await createImageMetadata(userId, imageData);
    return imageMetadata;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw new Error('Failed to upload image');
  }
};

// Helper function to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension calculation'));
    };
    
    img.src = url;
  });
};

// Refresh download URL for an image (useful for CORS issues)
export const refreshImageDownloadURL = async (imageId: string): Promise<string> => {
  try {
    const image = await getImageById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    // Generate a fresh download URL using the storage path
    const freshUrl = await getFileDownloadURL(image.storagePath);
    
    // Update the image document with the new URL
    const imageRef = doc(db, IMAGES_COLLECTION, imageId);
    await updateDoc(imageRef, {
      url: freshUrl,
      updatedAt: serverTimestamp(),
    });

    return freshUrl;
  } catch (error) {
    console.error('Error refreshing image download URL:', error);
    throw new Error('Failed to refresh download URL');
  }
};

// Get image with fresh download URL (handles CORS issues)
export const getImageWithFreshURL = async (imageId: string): Promise<ImageMetadata | null> => {
  try {
    const image = await getImageById(imageId);
    if (!image) return null;

    // Try to get a fresh download URL
    try {
      const freshUrl = await getFileDownloadURL(image.storagePath);
      return {
        ...image,
        url: freshUrl,
      };
    } catch (urlError) {
      console.warn('Could not refresh URL, using stored URL:', urlError);
      return image;
    }
  } catch (error) {
    console.error('Error getting image with fresh URL:', error);
    return null;
  }
};