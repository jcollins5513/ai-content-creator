'use client';

import React, { useState, useEffect } from 'react';
import { useImages } from '@/hooks/useImages';
import { useImageCategories } from '@/hooks/useImageCategories';
import { useToast } from '@/hooks/useToast';
import { ImageMetadata, ImageCategory } from '@/types';
import { DEFAULT_IMAGE_CATEGORIES } from '@/utils/constants';
import ImageUpload from './ImageUpload';
import ImageGrid from './ImageGrid';
import CategoryTabs from './CategoryTabs';
import ImageDetailsModal from './ImageDetailsModal';
import { ToastContainer } from '@/components/ui/Toast';

interface ImageLibraryProps {
  onImageSelect?: (image: ImageMetadata) => void;
  selectedImages?: string[];
  multiSelect?: boolean;
  className?: string;
}

export const ImageLibrary: React.FC<ImageLibraryProps> = ({
  onImageSelect,
  selectedImages = [],
  multiSelect = false,
  className = '',
}) => {
  const { 
    images, 
    loading, 
    error, 
    getImagesByCategory, 
    deleteImageById, 
    renameImage, 
    moveImage,
    refreshImages 
  } = useImages();
  
  const { categories } = useImageCategories();
  const { toasts, showToast, removeToast } = useToast();
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categoryImages, setCategoryImages] = useState<ImageMetadata[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedImageForDetails, setSelectedImageForDetails] = useState<ImageMetadata | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Combine default and custom categories
  const allCategories: ImageCategory[] = [
    { id: 'all', name: 'All Images', isCustom: false },
    ...DEFAULT_IMAGE_CATEGORIES,
    ...categories.filter(cat => cat.isCustom).map(cat => ({
      id: cat.name.toLowerCase().replace(/\s+/g, '-'),
      name: cat.name,
      isCustom: cat.isCustom,
    })),
  ];

  // Load images for active category
  useEffect(() => {
    const loadCategoryImages = async () => {
      if (activeCategory === 'all') {
        setCategoryImages(images);
        return;
      }

      setCategoryLoading(true);
      try {
        const categoryImgs = await getImagesByCategory(activeCategory);
        setCategoryImages(categoryImgs);
      } catch (err) {
        console.error('Error loading category images:', err);
        setCategoryImages([]);
      } finally {
        setCategoryLoading(false);
      }
    };

    loadCategoryImages();
  }, [activeCategory, images, getImagesByCategory]);

  const handleUploadComplete = (image: ImageMetadata) => {
    refreshImages();
    // If we're viewing the category where the image was uploaded, refresh that view
    if (activeCategory === image.category || activeCategory === 'all') {
      if (activeCategory === 'all') {
        setCategoryImages(prev => [image, ...prev]);
      } else {
        setCategoryImages(prev => [image, ...prev]);
      }
    }
    
    showToast({
      type: 'success',
      title: 'Image uploaded successfully',
      message: `${image.filename} has been added to your library.`,
    });
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    showToast({
      type: 'error',
      title: 'Upload failed',
      message: error,
    });
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      const imageToDelete = categoryImages.find(img => img.id === imageId);
      await deleteImageById(imageId);
      setCategoryImages(prev => prev.filter(img => img.id !== imageId));
      
      showToast({
        type: 'success',
        title: 'Image deleted',
        message: imageToDelete ? `${imageToDelete.filename} has been deleted.` : 'Image has been deleted.',
      });
    } catch (err) {
      console.error('Error deleting image:', err);
      showToast({
        type: 'error',
        title: 'Delete failed',
        message: err instanceof Error ? err.message : 'Failed to delete image.',
      });
    }
  };

  const handleImageRename = async (imageId: string, newFilename: string) => {
    try {
      await renameImage(imageId, newFilename);
      setCategoryImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, filename: newFilename } : img
      ));
      
      showToast({
        type: 'success',
        title: 'Image renamed',
        message: `Image renamed to ${newFilename}.`,
      });
    } catch (err) {
      console.error('Error renaming image:', err);
      showToast({
        type: 'error',
        title: 'Rename failed',
        message: err instanceof Error ? err.message : 'Failed to rename image.',
      });
    }
  };

  const handleImageMove = async (imageId: string, newCategory: string) => {
    try {
      await moveImage(imageId, newCategory);
      // Remove from current view if it's not 'all' and the image moved to a different category
      if (activeCategory !== 'all' && activeCategory !== newCategory) {
        setCategoryImages(prev => prev.filter(img => img.id !== imageId));
      } else {
        // Update the category in the current view
        setCategoryImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, category: newCategory } : img
        ));
      }
      
      // Update the selected image for details if it's the same one
      if (selectedImageForDetails && selectedImageForDetails.id === imageId) {
        setSelectedImageForDetails(prev => prev ? { ...prev, category: newCategory } : null);
      }
      
      const categoryName = allCategories.find(cat => cat.id === newCategory)?.name || newCategory;
      showToast({
        type: 'success',
        title: 'Image moved',
        message: `Image moved to ${categoryName}.`,
      });
    } catch (err) {
      console.error('Error moving image:', err);
      showToast({
        type: 'error',
        title: 'Move failed',
        message: err instanceof Error ? err.message : 'Failed to move image.',
      });
    }
  };

  const handleViewDetails = (image: ImageMetadata) => {
    setSelectedImageForDetails(image);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedImageForDetails(null);
  };

  const getUploadCategory = (): string => {
    // If we're viewing 'all', default to the first default category
    if (activeCategory === 'all') {
      return DEFAULT_IMAGE_CATEGORIES[0].id;
    }
    return activeCategory;
  };

  const isLoading = loading || categoryLoading;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Image Library</h2>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showUpload ? 'Hide Upload' : 'Upload Images'}
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="p-4 border-b bg-gray-50">
          <ImageUpload
            category={getUploadCategory()}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </div>
      )}

      {/* Category Tabs */}
      <CategoryTabs
        categories={allCategories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        className="border-b"
      />

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {/* Image Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading images...</span>
          </div>
        ) : categoryImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📷</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeCategory === 'all' ? 'No images yet' : `No images in ${allCategories.find(cat => cat.id === activeCategory)?.name}`}
            </h3>
            <p className="text-gray-500 mb-4">
              Upload some images to get started with your designs.
            </p>
            {!showUpload && (
              <button
                onClick={() => setShowUpload(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Images
              </button>
            )}
          </div>
        ) : (
          <ImageGrid
            images={categoryImages}
            selectedImages={selectedImages}
            multiSelect={multiSelect}
            onImageSelect={onImageSelect}
            onImageDelete={handleImageDelete}
            onImageRename={handleImageRename}
            onImageMove={handleImageMove}
            onImageViewDetails={handleViewDetails}
            availableCategories={allCategories.filter(cat => cat.id !== 'all')}
          />
        )}
      </div>

      {/* Image Details Modal */}
      <ImageDetailsModal
        image={selectedImageForDetails}
        isOpen={showDetailsModal}
        onClose={handleCloseDetails}
        onDelete={handleImageDelete}
        onRename={handleImageRename}
        onMove={handleImageMove}
        availableCategories={allCategories.filter(cat => cat.id !== 'all')}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ImageLibrary;