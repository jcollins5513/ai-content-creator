import { removeBackground, Config } from '@imgly/background-removal';

// Configuration for the background removal model
const backgroundRemovalConfig: Config = {
  debug: process.env.NODE_ENV === 'development',
  model: 'isnet', // Options: 'isnet', 'isnet_fp16', 'isnet_quint8'
  output: {
    format: 'image/png',
    quality: 0.8,
  },
  progress: (key: string, current: number, total: number) => {
    console.log(`Loading ${key}: ${Math.round((current / total) * 100)}%`);
  },
};

// Progress callback type
export type BackgroundRemovalProgressCallback = (progress: number) => void;

// Result type
export interface BackgroundRemovalResult {
  processedImageUrl: string;
  processedBlob: Blob;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
}

// Error types
export class BackgroundRemovalError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'BackgroundRemovalError';
  }
}

// Check if background removal is supported in the current browser
export const isBackgroundRemovalSupported = (): boolean => {
  try {
    // Check for WebAssembly support
    if (typeof WebAssembly !== 'object') {
      return false;
    }

    // Check for required browser APIs
    if (!window.OffscreenCanvas && !document.createElement('canvas').getContext) {
      return false;
    }

    // Check for Blob and URL support
    if (!window.Blob || !window.URL || !window.URL.createObjectURL) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking background removal support:', error);
    return false;
  }
};

// Get image dimensions from file
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

// Convert blob to image dimensions
const getBlobDimensions = (blob: Blob): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load processed image for dimension calculation'));
    };
    
    img.src = url;
  });
};

// Main background removal function
export const processBackgroundRemoval = async (
  imageFile: File,
  onProgress?: BackgroundRemovalProgressCallback
): Promise<BackgroundRemovalResult> => {
  try {
    // Validate input
    if (!imageFile) {
      throw new BackgroundRemovalError('No image file provided');
    }

    // Check file type
    if (!imageFile.type.startsWith('image/')) {
      throw new BackgroundRemovalError('Invalid file type. Please provide an image file.');
    }

    // Check file size (limit to 10MB for performance)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      throw new BackgroundRemovalError('Image file is too large. Please use an image smaller than 10MB.');
    }

    // Check browser support
    if (!isBackgroundRemovalSupported()) {
      throw new BackgroundRemovalError('Background removal is not supported in this browser. Please use a modern browser with WebAssembly support.');
    }

    // Get original image dimensions
    const originalDimensions = await getImageDimensions(imageFile);

    // Set up progress tracking
    let modelLoadingProgress = 0;
    let processingProgress = 0;

    const config: Config = {
      ...backgroundRemovalConfig,
      progress: (key: string, current: number, total: number) => {
        const progress = (current / total) * 100;
        
        if (key.includes('model') || key.includes('wasm')) {
          modelLoadingProgress = progress * 0.7; // Model loading is 70% of total
        } else {
          processingProgress = progress * 0.3; // Processing is 30% of total
        }
        
        const totalProgress = modelLoadingProgress + processingProgress;
        onProgress?.(Math.min(totalProgress, 100));
      },
    };

    // Process the image
    const processedBlob = await removeBackground(imageFile, config);

    // Get processed image dimensions
    const processedDimensions = await getBlobDimensions(processedBlob);

    // Create URL for the processed image
    const processedImageUrl = URL.createObjectURL(processedBlob);

    // Final progress update
    onProgress?.(100);

    return {
      processedImageUrl,
      processedBlob,
      originalDimensions,
      processedDimensions,
    };

  } catch (error) {
    console.error('Background removal error:', error);
    
    if (error instanceof BackgroundRemovalError) {
      throw error;
    }
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('WebAssembly')) {
        throw new BackgroundRemovalError('WebAssembly is not supported in this browser. Please use a modern browser.', error);
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new BackgroundRemovalError('Failed to download the background removal model. Please check your internet connection.', error);
      }
      
      if (error.message.includes('memory') || error.message.includes('allocation')) {
        throw new BackgroundRemovalError('Not enough memory to process this image. Please try with a smaller image.', error);
      }
    }
    
    throw new BackgroundRemovalError('Failed to remove background. Please try again.', error as Error);
  }
};

// Cleanup function to revoke object URLs
export const cleanupBackgroundRemovalResult = (result: BackgroundRemovalResult): void => {
  try {
    URL.revokeObjectURL(result.processedImageUrl);
  } catch (error) {
    console.warn('Failed to cleanup background removal result:', error);
  }
};

// Utility function to convert processed result to File
export const convertResultToFile = (
  result: BackgroundRemovalResult,
  originalFilename: string
): File => {
  const filename = originalFilename.replace(/\.[^/.]+$/, '_no_bg.png');
  return new File([result.processedBlob], filename, {
    type: 'image/png',
    lastModified: Date.now(),
  });
};

// Preload the background removal model
export const preloadBackgroundRemovalModel = async (
  onProgress?: BackgroundRemovalProgressCallback
): Promise<void> => {
  try {
    // Create a small dummy image to trigger model loading
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 1, 1);
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create dummy image'));
        }
      }, 'image/png');
    });
    
    const dummyFile = new File([blob], 'dummy.png', { type: 'image/png' });
    
    const config: Config = {
      ...backgroundRemovalConfig,
      progress: (key: string, current: number, total: number) => {
        const progress = (current / total) * 100;
        onProgress?.(progress);
      },
    };
    
    // This will load the model but we don't need the result
    await removeBackground(dummyFile, config);
    
  } catch (error) {
    console.error('Failed to preload background removal model:', error);
    throw new BackgroundRemovalError('Failed to preload background removal model', error as Error);
  }
};