'use client';

import React, { useState, useCallback } from 'react';
import { GeneratedAsset } from '@/types/templates';
import { UserAsset, CompositingRequest, CompositingLayout, CompositingResult, assetCompositingService } from '@/services/assetCompositing';
import { useToast } from '@/hooks/useToast';

interface AssetCompositingProps {
  backgroundAsset: GeneratedAsset;
  industry: string;
  businessName: string;
  onCompositingComplete: (result: CompositingResult) => void;
  onBack: () => void;
}

export const AssetCompositing: React.FC<AssetCompositingProps> = ({
  backgroundAsset,
  industry,
  businessName,
  onCompositingComplete,
  onBack
}) => {
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<CompositingLayout | null>(null);
  const [businessInfo, setBusinessInfo] = useState({
    name: businessName,
    industry: industry,
    tagline: '',
    phone: '',
    website: ''
  });
  const [isCompositing, setIsCompositing] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const { showToast } = useToast();

  const availableLayouts = assetCompositingService.getLayoutTemplates(industry);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, assetType: 'photo' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAsset(assetType);

    try {
      // Create a temporary URL for preview
      const url = URL.createObjectURL(file);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        const newAsset: UserAsset = {
          id: `${assetType}-${Date.now()}`,
          type: assetType,
          url: url,
          name: file.name,
          hasTransparentBackground: file.name.toLowerCase().includes('.png'), // Simple heuristic
          metadata: {
            width: img.width,
            height: img.height,
            format: file.type
          }
        };

        setUserAssets(prev => {
          // Remove existing asset of same type
          const filtered = prev.filter(asset => asset.type !== assetType);
          return [...filtered, newAsset];
        });

        showToast({
          type: 'success',
          title: 'Asset Uploaded',
          message: `${assetType === 'photo' ? 'Photo' : 'Logo'} uploaded successfully!`
        });
      };
      
      img.src = url;
    } catch (error) {
      console.error('Upload error:', error);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload asset. Please try again.'
      });
    } finally {
      setUploadingAsset(null);
    }
  }, [showToast]);

  const handleCompositing = useCallback(async () => {
    if (!selectedLayout) {
      showToast({
        type: 'error',
        title: 'Layout Required',
        message: 'Please select a layout template first.'
      });
      return;
    }

    // Validate assets
    const validation = assetCompositingService.validateUserAssets(userAssets);
    if (!validation.isValid) {
      showToast({
        type: 'error',
        title: 'Asset Validation Failed',
        message: validation.issues.join('. ')
      });
      return;
    }

    setIsCompositing(true);

    try {
      const request: CompositingRequest = {
        backgroundAsset,
        userAssets,
        layout: selectedLayout,
        businessInfo
      };

      const result = await assetCompositingService.requestCompositing(request);
      
      showToast({
        type: 'success',
        title: 'Compositing Complete',
        message: 'Your professional marketing image has been created!'
      });

      onCompositingComplete(result);
    } catch (error) {
      console.error('Compositing error:', error);
      showToast({
        type: 'error',
        title: 'Compositing Failed',
        message: 'Failed to create composite image. Please try again.'
      });
    } finally {
      setIsCompositing(false);
    }
  }, [selectedLayout, userAssets, backgroundAsset, businessInfo, showToast, onCompositingComplete]);

  const photoAsset = userAssets.find(asset => asset.type === 'photo');
  const logoAsset = userAssets.find(asset => asset.type === 'logo');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Create Professional Marketing Image
        </h3>
        <p className="text-gray-600">
          Upload your assets and we'll composite them with the generated background
        </p>
      </div>

      {/* Background Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Generated Background</h4>
        <div className="aspect-video rounded-lg overflow-hidden border">
          <img
            src={backgroundAsset.url}
            alt="Generated background"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {industry} showroom background - ready for your assets
        </p>
      </div>

      {/* Asset Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photo Upload */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Main Photo</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {photoAsset ? (
              <div className="space-y-3">
                <img
                  src={photoAsset.url}
                  alt={photoAsset.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-sm font-medium text-gray-900">{photoAsset.name}</p>
                <p className="text-xs text-gray-500">
                  {photoAsset.metadata.width} × {photoAsset.metadata.height}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600">Upload your main photo</p>
                <p className="text-xs text-gray-500">Vehicle, property, product, etc.</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'photo')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingAsset === 'photo'}
            />
            {uploadingAsset === 'photo' && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Business Logo</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {logoAsset ? (
              <div className="space-y-3">
                <img
                  src={logoAsset.url}
                  alt={logoAsset.name}
                  className="w-full h-32 object-contain rounded-lg"
                />
                <p className="text-sm font-medium text-gray-900">{logoAsset.name}</p>
                <p className="text-xs text-gray-500">
                  {logoAsset.metadata.width} × {logoAsset.metadata.height}
                </p>
                {!logoAsset.hasTransparentBackground && (
                  <p className="text-xs text-yellow-600">
                    💡 Consider using PNG with transparent background
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H9m12 0V9a2 2 0 00-2-2M5 21l14-14" />
                </svg>
                <p className="text-sm text-gray-600">Upload your logo</p>
                <p className="text-xs text-gray-500">PNG with transparent background preferred</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'logo')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingAsset === 'logo'}
            />
            {uploadingAsset === 'logo' && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Business Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={businessInfo.name}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your Business Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline (Optional)</label>
            <input
              type="text"
              value={businessInfo.tagline}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, tagline: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your tagline or slogan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
            <input
              type="text"
              value={businessInfo.phone}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
            <input
              type="text"
              value={businessInfo.website}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="www.yourbusiness.com"
            />
          </div>
        </div>
      </div>

      {/* Layout Selection */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Choose Layout</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableLayouts.map((layout, index) => (
            <div
              key={index}
              onClick={() => setSelectedLayout(layout)}
              className={`
                border-2 rounded-lg p-4 cursor-pointer transition-colors
                ${selectedLayout === layout 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <h5 className="font-medium text-gray-900 mb-2 capitalize">
                {layout.type.replace('-', ' ')}
              </h5>
              <div className="text-sm text-gray-600">
                Professional layout optimized for {industry} marketing
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Assets
        </button>

        <button
          type="button"
          onClick={handleCompositing}
          disabled={isCompositing || !selectedLayout || userAssets.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isCompositing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Composite...</span>
            </div>
          ) : (
            'Create Marketing Image'
          )}
        </button>
      </div>
    </div>
  );
};

export default AssetCompositing;