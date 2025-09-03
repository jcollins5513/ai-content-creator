'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth';
import AssetLibrary from '@/components/content-generation/AssetLibrary';
import Link from 'next/link';

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

export default function AssetLibraryPage() {
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'background' | 'marketing-element' | 'logo' | 'composite'>('all');

  const handleAssetSelect = (asset: LibraryAsset) => {
    setSelectedAsset(asset);
  };

  const handleCloseModal = () => {
    setSelectedAsset(null);
  };

  const handleUseAsset = (asset: LibraryAsset) => {
    // Here you would implement the logic to use the asset
    // For now, we'll just download it
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = `${asset.name}.png`;
    link.click();
    setSelectedAsset(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                  AI Content Creator
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">Asset Library</span>
              </div>
              <div className="flex items-center space-x-3">
                <Link 
                  href="/background-generator"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Background
                </Link>
                <Link 
                  href="/marketing-assets"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Assets
                </Link>
                <Link 
                  href="/dashboard"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { key: 'all', label: 'All Assets', icon: '📁' },
                { key: 'background', label: 'Backgrounds', icon: '🖼️' },
                { key: 'marketing-element', label: 'Marketing Elements', icon: '🎨' },
                { key: 'logo', label: 'Logos', icon: '🏷️' },
                { key: 'composite', label: 'Composites', icon: '📸' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key as any)}
                  className={`
                    flex items-center space-x-2 py-4 border-b-2 transition-colors
                    ${filterType === tab.key 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AssetLibrary
            onAssetSelect={handleAssetSelect}
            filterType={filterType === 'all' ? undefined : filterType}
            showUpload={true}
          />
        </main>

        {/* Asset Detail Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedAsset.name}</h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="aspect-video rounded-lg overflow-hidden border mb-4">
                  <img
                    src={selectedAsset.url}
                    alt={selectedAsset.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="ml-2 capitalize">{selectedAsset.type.replace('-', ' ')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Style:</span>
                      <span className="ml-2">{selectedAsset.style}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Use Case:</span>
                      <span className="ml-2">{selectedAsset.businessUseCase}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Usage:</span>
                      <span className="ml-2">{selectedAsset.usageCount} times</span>
                    </div>
                  </div>

                  {selectedAsset.tags.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Tags:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedAsset.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-gray-700 text-sm">Generation Prompt:</span>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {selectedAsset.prompt}
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleUseAsset(selectedAsset)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Use This Asset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}