'use client';

import React, { useState, useEffect } from 'react';
// import { AssetGenerationRequest } from '@/types/templates';

interface PromptEditorProps {
  assetType: string;
  basePrompt: string;
  style: string;
  colorPalette: string[];
  industry: string;
  onPromptChange: (prompt: string) => void;
  onClose: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  assetType,
  basePrompt,
  style,
  colorPalette,
  industry,
  onPromptChange,
  onClose,
}) => {
  const [editedPrompt, setEditedPrompt] = useState(basePrompt);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setEditedPrompt(basePrompt);
  }, [basePrompt]);

  const handleSave = () => {
    onPromptChange(editedPrompt);
    onClose();
  };

  const handleReset = () => {
    setEditedPrompt(basePrompt);
  };

  const getPromptSuggestions = () => {
    const suggestions = {
      background: [
        'Add geometric patterns',
        'Include subtle texture',
        'Make it more abstract',
        'Add gradient effects',
        'Include industry-specific elements'
      ],
      logo: [
        'Make it more minimalist',
        'Add symbolic elements',
        'Include typography',
        'Make it more modern',
        'Add industry icons'
      ],
      'text-overlay': [
        'Add decorative borders',
        'Include call-to-action elements',
        'Make it more dynamic',
        'Add shadow effects',
        'Include promotional badges'
      ],
      decorative: [
        'Add flourishes',
        'Include geometric shapes',
        'Make it more ornate',
        'Add subtle patterns',
        'Include industry symbols'
      ]
    };

    return suggestions[assetType as keyof typeof suggestions] || [];
  };

  const addSuggestion = (suggestion: string) => {
    setEditedPrompt(prev => `${prev}. ${suggestion}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 capitalize">
                Edit {assetType.replace('-', ' ')} Prompt
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Customize the AI generation prompt to get exactly what you want
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Context Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Generation Context</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Asset Type:</span>
                <span className="ml-2 font-medium capitalize">{assetType.replace('-', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-600">Industry:</span>
                <span className="ml-2 font-medium capitalize">{industry}</span>
              </div>
              <div>
                <span className="text-gray-600">Style:</span>
                <span className="ml-2 font-medium">{style.replace('-', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-600">Colors:</span>
                <div className="flex items-center space-x-1 ml-2">
                  {colorPalette.slice(0, 3).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  {colorPalette.length > 3 && (
                    <span className="text-xs text-gray-500">+{colorPalette.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Generation Prompt
              </label>
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe what you want the AI to generate..."
              />
              <div className="text-xs text-gray-500 mt-1">
                {editedPrompt.length} characters
              </div>
            </div>

            {/* Quick Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-900">
                  Quick Suggestions
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {getPromptSuggestions().map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addSuggestion(suggestion)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Advanced Options</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Quality Keywords</label>
                    <div className="flex flex-wrap gap-2">
                      {['high quality', 'professional', 'detailed', 'crisp', 'clean'].map((keyword) => (
                        <button
                          key={keyword}
                          type="button"
                          onClick={() => addSuggestion(keyword)}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                          + {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Style Keywords</label>
                    <div className="flex flex-wrap gap-2">
                      {['modern', 'elegant', 'bold', 'minimalist', 'artistic'].map((keyword) => (
                        <button
                          key={keyword}
                          type="button"
                          onClick={() => addSuggestion(keyword)}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                          + {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset to Original
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;