'use client';

import React, { useState } from 'react';
import { ImageMetadata, ImageCategory } from '@/types';
import ImageCard from './ImageCard';

interface ImageGridProps {
  images: ImageMetadata[];
  selectedImages?: string[];
  multiSelect?: boolean;
  onImageSelect?: (image: ImageMetadata) => void;
  onImageDelete: (imageId: string) => Promise<void>;
  onImageRename: (imageId: string, newFilename: string) => Promise<void>;
  onImageMove: (imageId: string, newCategory: string) => Promise<void>;
  onImageViewDetails?: (image: ImageMetadata) => void;
  availableCategories: ImageCategory[];
  className?: string;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selectedImages = [],
  multiSelect = false,
  onImageSelect,
  onImageDelete,
  onImageRename,
  onImageMove,
  onImageViewDetails,
  availableCategories,
  className = '',
}) => {
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);

  const handleImageSelect = (image: ImageMetadata) => {
    if (multiSelect) {
      const newSelected = new Set(selectedForBatch);
      if (newSelected.has(image.id)) {
        newSelected.delete(image.id);
      } else {
        newSelected.add(image.id);
      }
      setSelectedForBatch(newSelected);
      setShowBatchActions(newSelected.size > 0);
    } else if (onImageSelect) {
      onImageSelect(image);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedForBatch.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedForBatch.size} image(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedForBatch).map(imageId => 
        onImageDelete(imageId)
      );
      await Promise.all(deletePromises);
      setSelectedForBatch(new Set());
      setShowBatchActions(false);
    } catch (error) {
      console.error('Error batch deleting images:', error);
    }
  };

  const handleBatchMove = async (newCategory: string) => {
    if (selectedForBatch.size === 0) return;

    try {
      const movePromises = Array.from(selectedForBatch).map(imageId => 
        onImageMove(imageId, newCategory)
      );
      await Promise.all(movePromises);
      setSelectedForBatch(new Set());
      setShowBatchActions(false);
    } catch (error) {
      console.error('Error batch moving images:', error);
    }
  };

  const clearSelection = () => {
    setSelectedForBatch(new Set());
    setShowBatchActions(false);
  };

  const isImageSelected = (imageId: string): boolean => {
    if (multiSelect) {
      return selectedForBatch.has(imageId);
    }
    return selectedImages.includes(imageId);
  };

  return (
    <div className={className}>
      {/* Batch Actions Bar */}
      {showBatchActions && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedForBatch.size} image(s) selected
            </span>
            <div className="flex items-center space-x-2">
              {/* Move to Category Dropdown */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchMove(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-sm border border-blue-300 rounded px-2 py-1"
                defaultValue=""
              >
                <option value="" disabled>Move to...</option>
                {availableCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleBatchDelete}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              
              <button
                onClick={clearSelection}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-select Toggle */}
      {images.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={multiSelect}
                onChange={(e) => {
                  if (!e.target.checked) {
                    clearSelection();
                  }
                }}
                className="rounded border-gray-300"
                readOnly
              />
              <span>Multi-select mode</span>
            </label>
          </div>
          
          <div className="text-sm text-gray-500">
            {images.length} image(s)
          </div>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            selected={isImageSelected(image.id)}
            multiSelect={multiSelect}
            onSelect={() => handleImageSelect(image)}
            onDelete={() => onImageDelete(image.id)}
            onRename={(newFilename) => onImageRename(image.id, newFilename)}
            onMove={(newCategory) => onImageMove(image.id, newCategory)}
            onViewDetails={onImageViewDetails ? () => onImageViewDetails(image) : undefined}
            availableCategories={availableCategories}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageGrid;