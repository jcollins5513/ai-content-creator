'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { uploadUserImage } from '@/lib/storage';
import { createImageMetadata } from '@/services/imageService';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/utils/constants';
import { ImageMetadata } from '@/types';

interface ImageUploadProps {
  category: string;
  onUploadComplete: (image: ImageMetadata) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  category,
  onUploadComplete,
  onUploadError,
  className = '',
}) => {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `Invalid file type. Only ${ALLOWED_IMAGE_TYPES.join(', ')} are supported.`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`;
    }
    
    return null;
  };

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
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!user) {
      onUploadError('User not authenticated');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    const uploadId = `${file.name}-${Date.now()}`;
    
    // Initialize upload progress
    setUploads(prev => new Map(prev.set(uploadId, {
      filename: file.name,
      progress: 0,
      status: 'uploading'
    })));

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      
      // Upload to Firebase Storage
      const { url, filename, storagePath } = await uploadUserImage(
        user.uid,
        category,
        file,
        (progress) => {
          setUploads(prev => new Map(prev.set(uploadId, {
            filename: file.name,
            progress,
            status: 'uploading'
          })));
        }
      );

      // Update status to processing
      setUploads(prev => new Map(prev.set(uploadId, {
        filename: file.name,
        progress: 100,
        status: 'processing'
      })));

      // Create metadata in Firestore
      const imageMetadata: Omit<ImageMetadata, 'id'> = {
        url,
        filename,
        category,
        uploadedAt: new Date(),
        size: file.size,
        dimensions,
        storagePath,
      };

      const createdImage = await createImageMetadata(user.uid, imageMetadata);

      // Update status to complete
      setUploads(prev => new Map(prev.set(uploadId, {
        filename: file.name,
        progress: 100,
        status: 'complete'
      })));

      onUploadComplete(createdImage);

      // Remove from uploads after a delay
      setTimeout(() => {
        setUploads(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploads(prev => new Map(prev.set(uploadId, {
        filename: file.name,
        progress: 0,
        status: 'error',
        error: errorMessage
      })));

      onUploadError(errorMessage);

      // Remove from uploads after a delay
      setTimeout(() => {
        setUploads(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }, 5000);
    }
  }, [user, category, onUploadComplete, onUploadError]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.forEach(uploadFile);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const activeUploads = Array.from(uploads.values());

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <div className="text-lg font-medium text-gray-700">
            Drop images here or click to browse
          </div>
          <div className="text-sm text-gray-500">
            Supports: {ALLOWED_IMAGE_TYPES.join(', ')} • Max size: {MAX_FILE_SIZE / (1024 * 1024)}MB
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {activeUploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Uploading...</h4>
          {activeUploads.map((upload, index) => (
            <div key={index} className="bg-white border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {upload.filename}
                </span>
                <span className="text-xs text-gray-500">
                  {upload.status === 'uploading' && `${Math.round(upload.progress)}%`}
                  {upload.status === 'processing' && 'Processing...'}
                  {upload.status === 'complete' && '✓ Complete'}
                  {upload.status === 'error' && '✗ Error'}
                </span>
              </div>
              
              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              
              {upload.status === 'processing' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full animate-pulse w-full" />
                </div>
              )}
              
              {upload.status === 'complete' && (
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full w-full" />
                </div>
              )}
              
              {upload.status === 'error' && (
                <div className="space-y-1">
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full w-full" />
                  </div>
                  {upload.error && (
                    <p className="text-xs text-red-600">{upload.error}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;