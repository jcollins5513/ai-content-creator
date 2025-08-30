'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  processBackgroundRemoval,
  preloadBackgroundRemovalModel,
  cleanupBackgroundRemovalResult,
  convertResultToFile,
  isBackgroundRemovalSupported,
  BackgroundRemovalResult,
  BackgroundRemovalError,
} from '@/services/backgroundRemoval';

interface UseBackgroundRemovalReturn {
  isSupported: boolean;
  isModelLoaded: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
  result: BackgroundRemovalResult | null;
  processImage: (file: File) => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
  preloadModel: () => Promise<void>;
  convertToFile: (originalFilename: string) => File | null;
}

export const useBackgroundRemoval = (): UseBackgroundRemovalReturn => {
  const [isSupported] = useState(() => isBackgroundRemovalSupported());
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackgroundRemovalResult | null>(null);
  
  // Keep track of the current result to clean up URLs
  const currentResultRef = useRef<BackgroundRemovalResult | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (currentResultRef.current) {
      cleanupBackgroundRemovalResult(currentResultRef.current);
      currentResultRef.current = null;
    }
  }, []);

  // Clear result and cleanup
  const clearResult = useCallback(() => {
    cleanup();
    setResult(null);
    setProgress(0);
  }, [cleanup]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Preload model
  const preloadModel = useCallback(async () => {
    if (!isSupported || isModelLoaded) {
      return;
    }

    try {
      setError(null);
      setProgress(0);
      
      await preloadBackgroundRemovalModel((progress) => {
        setProgress(progress);
      });
      
      setIsModelLoaded(true);
      setProgress(100);
      
      // Reset progress after a delay
      setTimeout(() => {
        setProgress(0);
      }, 1000);
      
    } catch (err) {
      const errorMessage = err instanceof BackgroundRemovalError 
        ? err.message 
        : 'Failed to preload background removal model';
      setError(errorMessage);
      console.error('Model preload error:', err);
    }
  }, [isSupported, isModelLoaded]);

  // Process image
  const processImage = useCallback(async (file: File) => {
    if (!isSupported) {
      setError('Background removal is not supported in this browser');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      setProgress(0);
      
      // Clear previous result
      clearResult();

      const newResult = await processBackgroundRemoval(file, (progress) => {
        setProgress(progress);
      });

      // Store reference for cleanup
      currentResultRef.current = newResult;
      setResult(newResult);
      setIsModelLoaded(true); // Model is loaded after first successful processing

    } catch (err) {
      const errorMessage = err instanceof BackgroundRemovalError 
        ? err.message 
        : 'Failed to remove background from image';
      setError(errorMessage);
      console.error('Background removal error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isSupported, clearResult]);

  // Convert result to file
  const convertToFile = useCallback((originalFilename: string): File | null => {
    if (!result) {
      return null;
    }
    
    try {
      return convertResultToFile(result, originalFilename);
    } catch (err) {
      console.error('Failed to convert result to file:', err);
      setError('Failed to convert processed image to file');
      return null;
    }
  }, [result]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Update current result ref when result changes
  useEffect(() => {
    currentResultRef.current = result;
  }, [result]);

  return {
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
  };
};