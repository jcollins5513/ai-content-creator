'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface LibraryAsset {
  id: string;
  type: 'background' | 'marketing-element' | 'logo' | 'composite';
  url: string;
  thumbnail: string;
  name: string;
  prompt: string;
  tags: string[];
  businessUseCase: string;
  style: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  usageCount: number;
  metadata: Record<string, any>;
}

interface AssetLibraryProps {
  onAssetSelect: (asset: LibraryAsset) => void;
  filterType?: 'background' | 'marketing-element' | 'logo' | 'composite';
  showUpload?: boolean;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onAssetSelect,
  filterType,
  showUpload = true
}) => {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'my-assets' | 'public-library'>('my-assets');
  const { user } = useAuth();
  const { showToast } = useToast();

  const loadAssets = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/asset-library?userId=${user.uid}&viewMode=${viewMode}&type=${filterType || 'all'}`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
      showToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load asset library'
      });
    } finally {
      setLoading(false);
    }
  }, [user, viewMode, filterType, showToast]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', filterType || 'marketing-element');
    formData.append('userId', user.uid);

    try {
      const response = await fetch('/api/asset-library/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Asset Uploaded',
          message: 'Asset added to your library'
        });
        loadAssets();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload asset'
      });
    }
  }, [user, filterType, showToast, loadAssets]);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.businessUseCase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => asset.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(assets.flatMap(asset => asset.tags)));

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'background': return '🖼️';
      case 'marketing-element': return '🎨';
      case 'logo': return '🏷️';
      case 'composite': return '📸';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Asset Library
        </h3>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('my-assets')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'my-assets' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Assets
            </button>
            <button
              onClick={() => setViewMode('public-library')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'public-library' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Public Library
            </button>
          </div>

          {/* Upload Button */}
          {showUpload && viewMode === 'my-assets' && (
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              Upload Asset
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(prev => prev.filter(t => t !== tag));
                  } else {
                    setSelectedTags(prev => [...prev, tag]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredAssets.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              onClick={() => onAssetSelect(asset)}
              className="group cursor-pointer bg-white rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="aspect-square rounded-t-lg overflow-hidden">
                <img
                  src={asset.thumbnail || asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{getAssetTypeIcon(asset.type)}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {asset.name}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{asset.businessUseCase}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{asset.style}</span>
                  <span>{asset.usageCount} uses</span>
                </div>
                {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{asset.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📁</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {viewMode === 'my-assets' ? 'No assets yet' : 'No public assets found'}
          </h4>
          <p className="text-gray-600 mb-4">
            {viewMode === 'my-assets' 
              ? 'Generate or upload your first asset to get started'
              : 'Try adjusting your search or filters'
            }
          </p>
          {showUpload && viewMode === 'my-assets' && (
            <label className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              Upload Your First Asset
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
};

export default AssetLibrary;