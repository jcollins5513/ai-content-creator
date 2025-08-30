'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageMetadata, ImageCategory } from '@/types';

interface ImageDetailsModalProps {
  image: ImageMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (imageId: string) => Promise<void>;
  onRename: (imageId: string, newFilename: string) => Promise<void>;
  onMove: (imageId: string, newCategory: string) => Promise<void>;
  availableCategories: ImageCategory[];
}

export const ImageDetailsModal: React.FC<ImageDetailsModalProps> = ({
  image,
  isOpen,
  onClose,
  onDelete,
  onRename,
  onMove,
  availableCategories,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  React.useEffect(() => {
    if (image) {
      setNewFilename(image.filename);
    }
  }, [image]);

  if (!isOpen || !image) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleRename = async () => {
    if (newFilename.trim() && newFilename !== image.filename) {
      try {
        await onRename(image.id, newFilename.trim());
        setIsRenaming(false);
      } catch (error) {
        console.error('Error renaming image:', error);
        setNewFilename(image.filename); // Reset on error
      }
    } else {
      setIsRenaming(false);
      setNewFilename(image.filename);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${image.filename}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(image.id);
      onClose();
    } catch (error) {
      console.error('Error deleting image:', error);
      setIsDeleting(false);
    }
  };

  const handleMove = async (newCategory: string) => {
    if (newCategory === image.category) return;

    setIsMoving(true);
    try {
      await onMove(image.id, newCategory);
    } catch (error) {
      console.error('Error moving image:', error);
    } finally {
      setIsMoving(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // const currentCategory = availableCategories.find(cat => cat.id === image.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Image Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-4rem)]">
          {/* Image Preview */}
          <div className="flex-1 bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-full max-h-full">
              <Image
                src={image.url}
                alt={image.filename}
                width={image.dimensions.width}
                height={image.dimensions.height}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>

          {/* Details Panel */}
          <div className="w-full lg:w-80 border-l bg-white overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Filename */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filename
                </label>
                {isRenaming ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newFilename}
                      onChange={(e) => setNewFilename(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRename}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsRenaming(false);
                          setNewFilename(image.filename);
                        }}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 break-all">{image.filename}</span>
                    <button
                      onClick={() => setIsRenaming(true)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                      title="Rename"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={image.category}
                  onChange={(e) => handleMove(e.target.value)}
                  disabled={isMoving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {availableCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} {category.isCustom ? '(Custom)' : ''}
                    </option>
                  ))}
                </select>
                {isMoving && (
                  <div className="mt-1 text-xs text-blue-600">Moving...</div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Properties</h3>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Dimensions</span>
                    <div className="font-medium">{image.dimensions.width} × {image.dimensions.height}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">File Size</span>
                    <div className="font-medium">{formatFileSize(image.size)}</div>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-gray-500">Uploaded</span>
                    <div className="font-medium">{formatDate(image.uploadedAt)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Actions</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Download
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(image.url);
                      // You might want to show a toast notification here
                    }}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Copy URL
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Image'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDetailsModal;