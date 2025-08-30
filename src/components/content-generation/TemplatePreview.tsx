'use client';

import React, { useState } from 'react';
import { ContentTemplate, TemplateAnswers, GeneratedAsset } from '@/types/templates';

interface TemplatePreviewProps {
  template: ContentTemplate | null;
  answers: TemplateAnswers;
  style: string;
  colorPalette: string[];
  generatedAssets: GeneratedAsset[];
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  answers,
  style,
  colorPalette,
  generatedAssets,
  onComplete,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No template selected</p>
      </div>
    );
  }

  const businessName = answers.business_name || answers.store_name || answers.restaurant_name || 'Your Business';

  const getAssetsByType = (type: string) => {
    return generatedAssets.filter(asset => asset.type === type);
  };

  const generateSampleContent = () => {
    const industry = template.industry;
    const businessType = answers.vehicle_type || answers.product_category || answers.cuisine_type || 'business';
    
    switch (industry) {
      case 'automotive':
        return `Discover amazing deals at ${businessName}! Specializing in ${businessType} with unbeatable prices and quality service. Visit us today!`;
      case 'retail':
        return `Shop the latest ${businessType} at ${businessName}! Quality products, great prices, and exceptional service. Your satisfaction is our priority.`;
      case 'restaurant':
        return `Experience authentic ${businessType} cuisine at ${businessName}! Fresh ingredients, amazing flavors, and a welcoming atmosphere await you.`;
      default:
        return `Welcome to ${businessName}! We're committed to providing you with exceptional service and quality products.`;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Your AI-Generated Template
        </h3>
        <p className="text-gray-600">
          Review your custom template and generated assets. You can use this template to create marketing materials.
        </p>
      </div>

      {/* Template Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Template Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Business Name:</span>
                <span className="font-medium">{businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Industry:</span>
                <span className="font-medium capitalize">{template.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Style:</span>
                <span className="font-medium">{style.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Assets Generated:</span>
                <span className="font-medium">{generatedAssets.length}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Color Palette</h4>
            <div className="flex space-x-2 mb-4">
              {colorPalette.map((color, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-full border border-gray-300"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500">
              {colorPalette.join(' • ')}
            </div>
          </div>
        </div>
      </div>

      {/* Sample Content Preview */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="font-medium text-gray-900 mb-4">Sample Marketing Content</h4>
        <div 
          className="rounded-lg p-6 text-center"
          style={{ 
            backgroundColor: colorPalette[colorPalette.length - 1] || '#f8f9fa',
            borderLeft: `4px solid ${colorPalette[0] || '#007bff'}`
          }}
        >
          <h5 className="text-xl font-bold mb-3" style={{ color: colorPalette[0] || '#007bff' }}>
            {businessName}
          </h5>
          <p className="text-gray-700 mb-4">
            {generateSampleContent()}
          </p>
          <div 
            className="inline-block px-6 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: colorPalette[1] || colorPalette[0] || '#007bff' }}
          >
            Learn More
          </div>
        </div>
      </div>

      {/* Generated Assets Gallery */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Generated Assets</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {generatedAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="group cursor-pointer"
            >
              <div className="aspect-square rounded-lg overflow-hidden border group-hover:shadow-md transition-shadow">
                <img
                  src={asset.url}
                  alt={asset.type}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {asset.type.replace('-', ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  {asset.metadata.width} × {asset.metadata.height}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['background', 'logo', 'text-overlay', 'decorative'].map((type) => {
          const assets = getAssetsByType(type);
          if (assets.length === 0) return null;

          return (
            <div key={type} className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3 capitalize">
                {type.replace('-', ' ')} Assets ({assets.length})
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {assets.map((asset) => (
                  <div key={asset.id} className="aspect-square rounded overflow-hidden border">
                    <img
                      src={asset.url}
                      alt={asset.type}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Usage Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-3">How to Use Your Template</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="font-medium">1.</span>
            <span>Your template assets have been saved to your library</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">2.</span>
            <span>Use the canvas editor to combine these assets with your content</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">3.</span>
            <span>Customize text, positioning, and add your own images</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">4.</span>
            <span>Export your finished designs for use in marketing campaigns</span>
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onComplete}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
        >
          Complete Template Creation
        </button>
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                  {selectedAsset.type.replace('-', ' ')} Asset
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={selectedAsset.url}
                    alt={selectedAsset.type}
                    className="w-full h-full object-contain bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium capitalize">{selectedAsset.type.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Style:</span>
                    <span className="ml-2 font-medium">{selectedAsset.style}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="ml-2 font-medium">
                      {selectedAsset.metadata.width} × {selectedAsset.metadata.height}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Format:</span>
                    <span className="ml-2 font-medium uppercase">{selectedAsset.metadata.format}</span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">Generation Prompt:</span>
                  <p className="mt-1 text-sm text-gray-800 bg-gray-50 p-3 rounded">
                    {selectedAsset.prompt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;