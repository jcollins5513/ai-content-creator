'use client';

import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

interface MarketingAssetConfig {
  assetType: 'logo' | 'icon' | 'button' | 'banner' | 'badge' | 'frame' | 'divider' | 'pattern';
  style: 'modern' | 'vintage' | 'minimalist' | 'bold' | 'elegant' | 'playful';
  colorScheme: string[];
  size: 'small' | 'medium' | 'large';
  purpose: string;
  industry: string;
}

interface GeneratedMarketingAsset {
  id: string;
  url: string;
  prompt: string;
  config: MarketingAssetConfig;
  createdAt: Date;
}

interface MarketingAssetGeneratorProps {
  onAssetGenerated: (asset: GeneratedMarketingAsset) => void;
  onCancel: () => void;
}

export const MarketingAssetGenerator: React.FC<MarketingAssetGeneratorProps> = ({
  onAssetGenerated,
  onCancel
}) => {
  const [config, setConfig] = useState<MarketingAssetConfig>({
    assetType: 'logo',
    style: 'modern',
    colorScheme: ['#3B82F6', '#1E40AF'],
    size: 'medium',
    purpose: '',
    industry: 'business'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const assetTypes = [
    { value: 'logo', label: '🏷️ Logo', desc: 'Business logo or brand mark' },
    { value: 'icon', label: '🎯 Icon', desc: 'Simple icons and symbols' },
    { value: 'button', label: '🔘 Button', desc: 'Call-to-action buttons' },
    { value: 'banner', label: '📢 Banner', desc: 'Promotional banners' },
    { value: 'badge', label: '🏆 Badge', desc: 'Awards and certifications' },
    { value: 'frame', label: '🖼️ Frame', desc: 'Decorative frames' },
    { value: 'divider', label: '➖ Divider', desc: 'Section dividers' },
    { value: 'pattern', label: '🔳 Pattern', desc: 'Background patterns' }
  ];

  const styles = [
    { value: 'modern', label: 'Modern', desc: 'Clean, contemporary design' },
    { value: 'vintage', label: 'Vintage', desc: 'Classic, retro style' },
    { value: 'minimalist', label: 'Minimalist', desc: 'Simple, clean lines' },
    { value: 'bold', label: 'Bold', desc: 'Strong, impactful design' },
    { value: 'elegant', label: 'Elegant', desc: 'Sophisticated, refined' },
    { value: 'playful', label: 'Playful', desc: 'Fun, creative design' }
  ];

  const colorSchemes = [
    { name: 'Blue Professional', colors: ['#3B82F6', '#1E40AF'] },
    { name: 'Green Nature', colors: ['#10B981', '#059669'] },
    { name: 'Red Energy', colors: ['#EF4444', '#DC2626'] },
    { name: 'Purple Creative', colors: ['#8B5CF6', '#7C3AED'] },
    { name: 'Orange Warm', colors: ['#F97316', '#EA580C'] },
    { name: 'Gray Neutral', colors: ['#6B7280', '#4B5563'] },
    { name: 'Black & White', colors: ['#000000', '#FFFFFF'] },
    { name: 'Gold Luxury', colors: ['#F59E0B', '#D97706'] }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Food & Beverage', 'Automotive', 'Real Estate', 'Beauty',
    'Fitness', 'Travel', 'Entertainment', 'Professional Services'
  ];

  const generateStructuredPrompt = useCallback((config: MarketingAssetConfig): string => {
    const assetSpecs = {
      logo: {
        subject: 'professional business logo',
        constraints: 'scalable, memorable, works in black and white',
        format: 'vector-style, clean edges, transparent background'
      },
      icon: {
        subject: 'simple icon or symbol',
        constraints: 'recognizable at small sizes, universal meaning',
        format: 'line art or solid fill, transparent background'
      },
      button: {
        subject: 'call-to-action button design',
        constraints: 'clickable appearance, clear hierarchy',
        format: 'rounded corners, subtle shadow, web-ready'
      },
      banner: {
        subject: 'promotional banner element',
        constraints: 'eye-catching, space for text overlay',
        format: 'horizontal layout, marketing-focused'
      },
      badge: {
        subject: 'award or certification badge',
        constraints: 'trustworthy appearance, professional quality',
        format: 'circular or shield shape, premium look'
      },
      frame: {
        subject: 'decorative frame or border',
        constraints: 'complements content, not overwhelming',
        format: 'transparent center, ornamental edges'
      },
      divider: {
        subject: 'section divider or separator',
        constraints: 'subtle, enhances layout flow',
        format: 'horizontal line with decorative elements'
      },
      pattern: {
        subject: 'background pattern or texture',
        constraints: 'subtle, works behind text and images',
        format: 'seamless tile, low contrast'
      }
    };

    const sizeSpecs = {
      small: 'Size: 256x256px, optimized for small usage',
      medium: 'Size: 512x512px, standard marketing size',
      large: 'Size: 1024x1024px, high-resolution print quality'
    };

    const styleSpecs = {
      modern: 'clean lines, contemporary aesthetics, minimal details',
      vintage: 'classic design elements, aged appearance, traditional styling',
      minimalist: 'extremely simple, maximum white space, essential elements only',
      bold: 'strong visual impact, high contrast, commanding presence',
      elegant: 'sophisticated details, refined aesthetics, premium quality',
      playful: 'fun elements, creative shapes, approachable design'
    };

    const spec = assetSpecs[config.assetType];
    const colorHex = config.colorScheme.join(', ');

    return `Asset Type: ${config.assetType} - ${spec.subject}
Purpose: ${config.purpose || `${config.industry} marketing material`}
Industry: ${config.industry}
Style: ${config.style} - ${styleSpecs[config.style]}
Colors: ${colorHex}
${sizeSpecs[config.size]}
Format: ${spec.format}
Constraints: ${spec.constraints}, no text unless specified, transparent background where appropriate
Quality: high detail, professional marketing quality, commercial use ready`;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!config.purpose && !config.industry) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please specify the purpose or select an industry.'
      });
      return;
    }

    setIsGenerating(true);

    try {
      const structuredPrompt = generateStructuredPrompt(config);
      
      const response = await fetch('/api/generate-marketing-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: structuredPrompt,
          config: config
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate marketing asset');
      }

      const data = await response.json();
      
      const asset: GeneratedMarketingAsset = {
        id: `asset-${Date.now()}`,
        url: data.imageUrl,
        prompt: structuredPrompt,
        config: config,
        createdAt: new Date()
      };

      showToast({
        type: 'success',
        title: 'Asset Generated',
        message: 'Your marketing asset is ready!'
      });

      onAssetGenerated(asset);
    } catch (error) {
      console.error('Marketing asset generation error:', error);
      showToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate marketing asset. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [config, generateStructuredPrompt, showToast, onAssetGenerated]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generate Marketing Asset
        </h2>
        <p className="text-gray-600">
          Create individual marketing elements with structured prompts
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* Asset Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Asset Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {assetTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, assetType: type.value as any }))}
                className={`
                  px-3 py-3 rounded-lg border-2 transition-colors text-center
                  ${config.assetType === type.value 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose / Description
          </label>
          <input
            type="text"
            value={config.purpose}
            onChange={(e) => setConfig(prev => ({ ...prev, purpose: e.target.value }))}
            placeholder="e.g., 'Call now button for automotive dealership' or 'Premium badge for luxury brand'"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <select
            value={config.industry}
            onChange={(e) => setConfig(prev => ({ ...prev, industry: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {industries.map(industry => (
              <option key={industry} value={industry.toLowerCase()}>{industry}</option>
            ))}
          </select>
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Style
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {styles.map(style => (
              <button
                key={style.value}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, style: style.value as any }))}
                className={`
                  px-3 py-3 rounded-lg border-2 transition-colors text-center
                  ${config.style === style.value 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-medium text-sm">{style.label}</div>
                <div className="text-xs text-gray-500 mt-1">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Scheme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Color Scheme
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {colorSchemes.map(scheme => (
              <button
                key={scheme.name}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, colorScheme: scheme.colors }))}
                className={`
                  px-3 py-3 rounded-lg border-2 transition-colors
                  ${JSON.stringify(config.colorScheme) === JSON.stringify(scheme.colors)
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex space-x-1 mb-2 justify-center">
                  {scheme.colors.map(color => (
                    <div
                      key={color}
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-700">{scheme.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Size
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'small', label: 'Small', desc: '256px - Icons, buttons' },
              { value: 'medium', label: 'Medium', desc: '512px - Standard use' },
              { value: 'large', label: 'Large', desc: '1024px - Print quality' }
            ].map(size => (
              <button
                key={size.value}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, size: size.value as any }))}
                className={`
                  px-3 py-3 rounded-lg border-2 transition-colors text-center
                  ${config.size === size.value 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-medium text-sm">{size.label}</div>
                <div className="text-xs text-gray-500 mt-1">{size.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Prompt */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Generated Prompt Preview:</h4>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {generateStructuredPrompt(config)}
          </pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating Asset...</span>
            </div>
          ) : (
            'Generate Marketing Asset'
          )}
        </button>
      </div>
    </div>
  );
};

export default MarketingAssetGenerator;