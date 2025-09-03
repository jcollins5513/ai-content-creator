'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth';
import MarketingAssetGenerator from '@/components/content-generation/MarketingAssetGenerator';
import Link from 'next/link';

interface GeneratedMarketingAsset {
  id: string;
  url: string;
  prompt: string;
  config: any;
  createdAt: Date;
}

export default function MarketingAssetsPage() {
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedMarketingAsset[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleAssetGenerated = (asset: GeneratedMarketingAsset) => {
    setGeneratedAssets(prev => [asset, ...prev]);
    setShowGenerator(false);
  };

  const handleDeleteAsset = (assetId: string) => {
    setGeneratedAssets(prev => prev.filter(asset => asset.id !== assetId));
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
                <span className="text-gray-600">Marketing Assets</span>
              </div>
              <div className="flex items-center space-x-3">
                {!showGenerator && (
                  <button
                    onClick={() => setShowGenerator(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate New Asset
                  </button>
                )}
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showGenerator ? (
            <MarketingAssetGenerator
              onAssetGenerated={handleAssetGenerated}
              onCancel={() => setShowGenerator(false)}
            />
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Marketing Assets
                </h2>
                <p className="text-gray-600">
                  Generate and manage individual marketing elements like logos, buttons, banners, and more
                </p>
              </div>

              {/* Asset Types Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Asset Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: '🏷️', name: 'Logos', desc: 'Business logos and brand marks' },
                    { icon: '🎯', name: 'Icons', desc: 'Simple icons and symbols' },
                    { icon: '🔘', name: 'Buttons', desc: 'Call-to-action buttons' },
                    { icon: '📢', name: 'Banners', desc: 'Promotional banners' },
                    { icon: '🏆', name: 'Badges', desc: 'Awards and certifications' },
                    { icon: '🖼️', name: 'Frames', desc: 'Decorative frames' },
                    { icon: '➖', name: 'Dividers', desc: 'Section dividers' },
                    { icon: '🔳', name: 'Patterns', desc: 'Background patterns' }
                  ].map(type => (
                    <div key={type.name} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium text-gray-900 text-sm">{type.name}</div>
                      <div className="text-xs text-gray-600">{type.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Assets */}
              {generatedAssets.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Your Generated Assets</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {generatedAssets.map(asset => (
                        <div key={asset.id} className="group relative">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                            <img
                              src={asset.url}
                              alt={`${asset.config.assetType} asset`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                  {asset.config.assetType.replace('-', ' ')}
                                </p>
                                <p className="text-xs text-gray-600">{asset.config.style}</p>
                              </div>
                              <div className="flex space-x-1">
                                <a
                                  href={asset.url}
                                  download={`${asset.config.assetType}-${asset.id}.png`}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Download"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                                <button
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🎨</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assets generated yet</h3>
                    <p className="text-gray-600 mb-6">
                      Create your first marketing asset using our structured prompt generator
                    </p>
                    <button
                      onClick={() => setShowGenerator(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Generate Your First Asset
                    </button>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Structured Generation Features</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Structured prompts for consistent quality</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Industry-specific optimization</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Multiple style options</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Commercial-ready quality</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}