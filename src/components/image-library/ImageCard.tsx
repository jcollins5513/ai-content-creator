'use client';

import React, { useState, useRef } from 'react';
import { ImageMetadata, ImageCategory } from '@/types';

interface ImageCardProps {
  image: ImageMetadata;
  selected?: boolean;
  multiSelect?: boolean;
  onSelect?: () => void;
  onDelete: () => Promise<void>;
  onRename: (newFilename: string) => Promise<void>;
  onMove: (newCategory: string) => Promise<void>;
  onViewDetails?: () => void;
  availableCategories: ImageCategory[];
  className?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  selected = false,
  multiSelect = false,
  onSelect,
  onDelete,
  onRename,
  onMove,
  onViewDetails,
  availableCategories,
  className = '',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFilename, setNewFilename] = useState(image.filename);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleImageClick = () => {
    if (multiSelect || onSelect) {
      onSelect?.();
    }
  };

  const handleRename = async () => {
    if (newFilename.trim() && newFilename !== image.filename) {
      try {
        await onRename(newFilename.trim());
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
      await onDelete();
    } catch (error) {
      console.error('Error deleting image:', error);
      setIsDeleting(false);
    }
  };

  const handleMove = async (newCategory: string) => {
    try {
      await onMove(newCategory);
      setShowMenu(false);
    } catch (error) {
      console.error('Error moving image:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  if (isDeleting) {
    return (
      <div className={`aspect-square bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
          <div className="text-xs text-gray-500">Deleting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative ${className}`}>
      {/* Selection Overlay */}
      {multiSelect && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleImageClick}
            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      {/* Menu Button */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
        >
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-20"
          >
            <div className="py-1">
              {onViewDetails && (
                <button
                  onClick={() => {
                    onViewDetails();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View Details
                </button>
              )}
              
              <button
                onClick={() => {
                  setIsRenaming(true);
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Rename
              </button>
              
              {/* Move to Category Submenu */}
              <div className="relative group/submenu">
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Move to Category →
                </button>
                <div className="absolute left-full top-0 w-48 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all">
                  <div className="py-1">
                    {availableCategories
                      .filter(cat => cat.id !== image.category)
                      .map(category => (
                        <button
                          key={category.id}
                          onClick={() => handleMove(category.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {category.name}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
              
              <hr className="my-1" />
              <button
                onClick={handleDelete}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Container */}
      <div
        className={`
          aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-all
          ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:shadow-md'}
          ${multiSelect ? '' : 'hover:scale-105'}
        `}
        onClick={handleImageClick}
      >
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse bg-gray-200 w-full h-full"></div>
              </div>
            )}
            <img
              src={image.url}
              alt={image.filename}
              className={`w-full h-full object-cover transition-opacity ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <div className="text-xs">Failed to load</div>
            </div>
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="mt-2 space-y-1">
        {isRenaming ? (
          <input
            type="text"
            value={newFilename}
            onChange={(e) => setNewFilename(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsRenaming(false);
                setNewFilename(image.filename);
              }
            }}
            className="w-full text-xs font-medium text-gray-900 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <div
            className="text-xs font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
            title={image.filename}
            onClick={() => setIsRenaming(true)}
          >
            {image.filename}
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-0.5">
          <div>{image.dimensions.width} × {image.dimensions.height}</div>
          <div>{formatFileSize(image.size)}</div>
          <div>{formatDate(image.uploadedAt)}</div>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;