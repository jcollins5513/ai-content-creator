'use client';

import React, { useState } from 'react';
import { ContentTemplate, TemplateAnswers } from '@/types/templates';

interface StyleSelectionProps {
  template: ContentTemplate | null;
  answers: TemplateAnswers;
  onStyleSelect: (style: string, colorPalette: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface StyleOption {
  id: string;
  name: string;
  description: string;
  preview: string;
  colorPalettes: {
    name: string;
    colors: string[];
  }[];
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'modern-minimal',
    name: 'Modern & Minimal',
    description: 'Clean lines, plenty of white space, contemporary feel',
    preview: '🎨',
    colorPalettes: [
      { name: 'Monochrome', colors: ['#000000', '#FFFFFF', '#808080', '#F5F5F5'] },
      { name: 'Blue Accent', colors: ['#2563EB', '#FFFFFF', '#F8FAFC', '#E2E8F0'] },
      { name: 'Green Accent', colors: ['#059669', '#FFFFFF', '#F0FDF4', '#D1FAE5'] },
    ]
  },
  {
    id: 'bold-vibrant',
    name: 'Bold & Vibrant',
    description: 'Eye-catching colors, dynamic layouts, energetic feel',
    preview: '⚡',
    colorPalettes: [
      { name: 'Electric', colors: ['#7C3AED', '#F59E0B', '#EF4444', '#FFFFFF'] },
      { name: 'Sunset', colors: ['#F97316', '#EAB308', '#DC2626', '#FFFFFF'] },
      { name: 'Ocean', colors: ['#0EA5E9', '#06B6D4', '#8B5CF6', '#FFFFFF'] },
    ]
  },
  {
    id: 'professional-corporate',
    name: 'Professional & Corporate',
    description: 'Trustworthy, established, business-focused appearance',
    preview: '💼',
    colorPalettes: [
      { name: 'Navy Blue', colors: ['#1E3A8A', '#3B82F6', '#FFFFFF', '#F1F5F9'] },
      { name: 'Charcoal', colors: ['#374151', '#6B7280', '#FFFFFF', '#F9FAFB'] },
      { name: 'Forest', colors: ['#065F46', '#059669', '#FFFFFF', '#ECFDF5'] },
    ]
  },
  {
    id: 'warm-friendly',
    name: 'Warm & Friendly',
    description: 'Approachable, welcoming, community-focused feel',
    preview: '🤝',
    colorPalettes: [
      { name: 'Warm Earth', colors: ['#92400E', '#F59E0B', '#FEF3C7', '#FFFFFF'] },
      { name: 'Coral', colors: ['#DC2626', '#F87171', '#FEE2E2', '#FFFFFF'] },
      { name: 'Sage', colors: ['#059669', '#34D399', '#D1FAE5', '#FFFFFF'] },
    ]
  },
  {
    id: 'luxury-elegant',
    name: 'Luxury & Elegant',
    description: 'Sophisticated, premium, high-end aesthetic',
    preview: '👑',
    colorPalettes: [
      { name: 'Gold & Black', colors: ['#000000', '#D4AF37', '#FFFFFF', '#F7F7F7'] },
      { name: 'Deep Purple', colors: ['#581C87', '#A855F7', '#FFFFFF', '#FAF5FF'] },
      { name: 'Platinum', colors: ['#374151', '#9CA3AF', '#FFFFFF', '#F9FAFB'] },
    ]
  },
  {
    id: 'playful-creative',
    name: 'Playful & Creative',
    description: 'Fun, artistic, imaginative, perfect for creative businesses',
    preview: '🎭',
    colorPalettes: [
      { name: 'Rainbow', colors: ['#EC4899', '#8B5CF6', '#06B6D4', '#F59E0B'] },
      { name: 'Pastel', colors: ['#F3E8FF', '#DBEAFE', '#D1FAE5', '#FEF3C7'] },
      { name: 'Neon', colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#000000'] },
    ]
  }
];

export const StyleSelection: React.FC<StyleSelectionProps> = ({
  template,
  answers,
  onStyleSelect,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedPalette, setSelectedPalette] = useState<string[]>([]);

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No template selected</p>
      </div>
    );
  }

  const handleStyleClick = (styleId: string) => {
    setSelectedStyle(styleId);
    setSelectedPalette([]); // Reset palette when style changes
  };

  const handlePaletteClick = (colors: string[]) => {
    setSelectedPalette(colors);
  };

  const handleContinue = () => {
    if (selectedStyle && selectedPalette.length > 0) {
      onStyleSelect(selectedStyle, selectedPalette);
    }
  };

  const selectedStyleOption = STYLE_OPTIONS.find(style => style.id === selectedStyle);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Choose Your Visual Style
        </h3>
        <p className="text-gray-600">
          Select a style that matches your brand personality and target audience.
        </p>
      </div>

      {/* Style Selection */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Visual Style</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STYLE_OPTIONS.map((style) => (
            <div
              key={style.id}
              onClick={() => handleStyleClick(style.id)}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                ${selectedStyle === style.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {/* Selection Indicator */}
              {selectedStyle === style.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="text-center">
                <div className="text-2xl mb-2">{style.preview}</div>
                <h5 className="font-semibold text-gray-900 mb-1">{style.name}</h5>
                <p className="text-sm text-gray-600">{style.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Palette Selection */}
      {selectedStyleOption && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Color Palette</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedStyleOption.colorPalettes.map((palette, index) => (
              <div
                key={index}
                onClick={() => handlePaletteClick(palette.colors)}
                className={`
                  relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                  ${JSON.stringify(selectedPalette) === JSON.stringify(palette.colors)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {/* Selection Indicator */}
                {JSON.stringify(selectedPalette) === JSON.stringify(palette.colors) && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <h6 className="font-medium text-gray-900 mb-3">{palette.name}</h6>
                  <div className="flex justify-center space-x-1 mb-2">
                    {palette.colors.map((color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="w-8 h-8 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {palette.colors.join(' • ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Style Preview */}
      {selectedStyle && selectedPalette.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Style Preview & Coordination</h4>
          
          {/* Visual Preview */}
          <div className="bg-white rounded-lg p-6 border mb-4" style={{ 
            borderColor: selectedPalette[0],
            background: `linear-gradient(135deg, ${selectedPalette[selectedPalette.length - 1]} 0%, white 100%)`
          }}>
            <div className="text-center">
              <h5 className="text-xl font-bold mb-2" style={{ color: selectedPalette[0] }}>
                {answers.business_name || answers.store_name || answers.restaurant_name || 'Your Business Name'}
              </h5>
              <p className="text-gray-600 mb-4">
                Sample marketing content with your selected style
              </p>
              <div 
                className="inline-block px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: selectedPalette[1] || selectedPalette[0] }}
              >
                Call to Action
              </div>
            </div>
          </div>

          {/* Style Coordination Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Style Coordination System</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• All AI-generated assets will use this exact color palette</div>
              <div>• Visual elements will maintain {selectedStyleOption?.name.toLowerCase()} aesthetic</div>
              <div>• Background, logo, and decorative elements will be visually coherent</div>
              <div>• Industry-specific elements will complement the chosen style</div>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedStyle && selectedPalette.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleContinue}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Asset Generation
          </button>
        </div>
      )}
    </div>
  );
};

export default StyleSelection;