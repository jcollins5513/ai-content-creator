'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import { useToast } from '@/hooks/useToast';
import { getImageWithFreshURL } from '@/services/imageService';
import { ImageMetadata } from '@/types';

interface BackgroundRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedImage: ImageMetadata | null;
  onSaveProcessedImage: (processedFile: File, originalImage: ImageMetadata) => Promise<void>;
}

export const BackgroundRemovalModal: React.FC<BackgroundRemovalModalProps> = ({
  isOpen,
  onClose,
  selectedImage,
  onSaveProcessedImage,
}) => {
  const {
    isSupported,
    isModelLoaded,
    isProcessing,
    progress,
    error,
    result,
    processImage,
    clearResult,
    clearError,
    preloadModel,
    convertToFile,
  } = useBackgroundRemoval();

  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreload, setShowPreload] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (isProcessing || isSaving) return;
    clearResult();
    clearError();
    onClose();
  }, [isProcessing, isSaving, clearResult, clearError, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleClose]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClose]);

  // Process image when modal opens with selected image
  useEffect(() => {
    if (isOpen && selectedImage && !result && !isProcessing) {
      handleProcessImage();
    }
  }, [isOpen, selectedImage]);

  // Show preload option if model is not loaded
  useEffect(() => {
    if (isOpen && !isModelLoaded && isSupported) {
      setShowPreload(true);
    } else {
      setShowPreload(false);
    }
  }, [isOpen, isModelLoaded, isSupported]);

  const handleProcessImage = async () => {
    if (!selectedImage) return;

    try {
      // Get image with fresh download URL to avoid CORS issues
      const imageWithFreshURL = await getImageWithFreshURL(selectedImage.id);
      const imageUrl = imageWithFreshURL?.url || selectedImage.url;
      
      // Try multiple approaches to load the image
      let file: File;
      
      try {
        // First try: Use proxy to avoid CORS issues
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        const blob = await response.blob();
        file = new File([blob], selectedImage.filename, { type: blob.type });
      } catch (fetchError) {
        console.warn('Proxy fetch failed, trying direct fetch:', fetchError);
        
        // Fallback: Try direct fetch
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          file = new File([blob], selectedImage.filename, { type: blob.type });
        } catch (directFetchError) {
          console.warn('Direct fetch failed, trying image element approach:', directFetchError);
        }
        
        // Fallback: Use image element with canvas conversion
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = (error) => {
            console.error('Image load error:', error);
            reject(new Error('Failed to load image'));
          };
          img.src = imageUrl;
        });
        
        // Convert image to canvas and then to blob
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/png');
        });
        
        file = new File([blob], selectedImage.filename, { type: 'image/png' });
      }
      
      await processImage(file);
    } catch (err) {
      console.error('Error processing image:', err);
      showToast({
        type: 'error',
        title: 'Processing Failed',
        message: 'Failed to process the selected image. This may be due to CORS restrictions. Please try uploading a new image or contact support.',
      });
    }
  };

  const handlePreloadModel = async () => {
    try {
      await preloadModel();
      setShowPreload(false);
      showToast({
        type: 'success',
        title: 'Model Loaded',
        message: 'Background removal model is ready to use.',
      });
    } catch (err) {
      console.error('Error preloading model:', err);
      showToast({
        type: 'error',
        title: 'Model Loading Failed',
        message: 'Failed to load the background removal model. Please try again.',
      });
    }
  };

  const handleSave = async () => {
    if (!result || !selectedImage) return;

    setIsSaving(true);
    try {
      const processedFile = convertToFile(selectedImage.filename);
      if (!processedFile) {
        throw new Error('Failed to convert processed image to file');
      }

      await onSaveProcessedImage(processedFile, selectedImage);
      
      showToast({
        type: 'success',
        title: 'Image Saved',
        message: 'Background-removed image has been saved to your library.',
      });
      
      handleClose();
    } catch (err) {
      console.error('Error saving processed image:', err);
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save the processed image. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    clearResult();
    handleClose();
  };

  const handleRetry = () => {
    clearError();
    clearResult();
    handleProcessImage();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Remove Background
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing || isSaving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Browser Support Check */}
          {!isSupported && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Browser Not Supported</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Background removal requires a modern browser with WebAssembly support. 
                    Please use Chrome, Firefox, Safari, or Edge.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Model Preload Option */}
          {showPreload && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">First Time Setup</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      The background removal model needs to be downloaded first (~50MB). This only happens once.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePreloadModel}
                  disabled={isProcessing}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Load Model
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {progress < 70 ? 'Loading AI Model...' : 'Processing Image...'}
              </h3>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
              <p className="text-xs text-gray-500 mt-2">
                {progress < 70 
                  ? 'This may take a moment on first use...' 
                  : 'Almost done...'}
              </p>
            </div>
          )}

          {/* Image Comparison */}
          {selectedImage && result && !isProcessing && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Image */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Original</h3>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedImage.url}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {selectedImage.dimensions.width} × {selectedImage.dimensions.height}
                  </div>
                </div>

                {/* Processed Image */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Background Removed</h3>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                    {/* Checkerboard pattern for transparency */}
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #ccc 25%, transparent 25%), 
                          linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                          linear-gradient(45deg, transparent 75%, #ccc 75%), 
                          linear-gradient(-45deg, transparent 75%, #ccc 75%)
                        `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                    />
                    <img
                      src={result.processedImageUrl}
                      alt="Background removed"
                      className="w-full h-full object-contain relative z-10"
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {result.processedDimensions.width} × {result.processedDimensions.height}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSaving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isSaving ? 'Saving...' : 'Save to Library'}
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedImage && !isProcessing && !error && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Image Selected</h3>
              <p className="text-gray-600">Please select an image to remove its background.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundRemovalModal;