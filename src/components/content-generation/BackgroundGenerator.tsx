'use client';

import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

interface BackgroundConfig {
  businessUseCase: string;
  environment: 'inside' | 'outside';
  timeOfDay: 'day' | 'night' | 'golden-hour' | 'blue-hour';
  style: 'photorealistic' | 'cartoon' | 'minimalist' | 'artistic';
  includeSubjects: boolean;
  subjectTypes: string[];
}

interface GeneratedBackground {
  id: string;
  url: string;
  prompt: string;
  config: BackgroundConfig;
  createdAt: Date;
}

interface BackgroundGeneratorProps {
  onBackgroundGenerated: (background: GeneratedBackground) => void;
  onCancel: () => void;
}

export const BackgroundGenerator: React.FC<BackgroundGeneratorProps> = ({
  onBackgroundGenerated,
  onCancel
}) => {
  const [config, setConfig] = useState<BackgroundConfig>({
    businessUseCase: '',
    environment: 'inside',
    timeOfDay: 'day',
    style: 'photorealistic',
    includeSubjects: false,
    subjectTypes: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const businessUseCases = [
    'Restaurant/Food Service',
    'Automotive Dealership',
    'Real Estate',
    'Retail Store',
    'Medical/Healthcare',
    'Beauty/Salon',
    'Fitness/Gym',
    'Office/Corporate',
    'Event Venue',
    'Hotel/Hospitality',
    'Education/School',
    'Manufacturing/Industrial'
  ];

  const subjectOptions = {
    inside: ['People in background', 'Pets/Animals', 'Furniture/Decor', 'Equipment/Tools'],
    outside: ['People in background', 'Pets/Animals', 'Vehicles', 'Nature elements', 'Buildings/Architecture']
  };

  const generateStructuredPrompt = useCallback((config: BackgroundConfig): string => {
    const environmentDetails = {
      inside: {
        'Restaurant/Food Service': 'modern restaurant interior, dining tables, kitchen background',
        'Automotive Dealership': 'car showroom interior, polished floors, glass windows',
        'Real Estate': 'luxury home interior, living room or kitchen',
        'Retail Store': 'modern retail space, clean displays, shopping area',
        'Medical/Healthcare': 'medical office, clean facility, professional equipment',
        'Beauty/Salon': 'modern salon interior, styling stations, mirrors',
        'Fitness/Gym': 'gym interior, exercise equipment, workout space',
        'Office/Corporate': 'modern office space, conference room, professional setting',
        'Event Venue': 'event hall, banquet room, celebration space',
        'Hotel/Hospitality': 'hotel lobby, guest room, hospitality setting',
        'Education/School': 'classroom, library, educational facility',
        'Manufacturing/Industrial': 'factory floor, warehouse, industrial setting'
      },
      outside: {
        'Restaurant/Food Service': 'outdoor dining patio, garden restaurant, street cafe',
        'Automotive Dealership': 'car lot exterior, dealership building, parking area',
        'Real Estate': 'luxury home exterior, front yard, property grounds',
        'Retail Store': 'shopping center exterior, storefront, commercial area',
        'Medical/Healthcare': 'medical building exterior, healthcare campus',
        'Beauty/Salon': 'salon storefront, commercial building exterior',
        'Fitness/Gym': 'outdoor fitness area, sports facility exterior',
        'Office/Corporate': 'corporate building exterior, business district',
        'Event Venue': 'outdoor event space, garden venue, celebration area',
        'Hotel/Hospitality': 'hotel exterior, resort grounds, hospitality venue',
        'Education/School': 'school campus, educational building exterior',
        'Manufacturing/Industrial': 'industrial complex exterior, factory grounds'
      }
    };

    const lightingSetup = {
      day: 'natural daylight, bright and clear, soft shadows',
      night: 'artificial lighting, warm interior lights, evening atmosphere',
      'golden-hour': 'golden hour lighting, warm sunset glow, dramatic shadows',
      'blue-hour': 'blue hour lighting, twilight atmosphere, ambient lighting'
    };

    const cameraSettings = {
      photorealistic: 'Camera: 35mm, f/2.8, ISO 200, 1/125s',
      cartoon: 'Camera: wide angle, bright and colorful, illustration style',
      minimalist: 'Camera: clean composition, simple framing, minimal elements',
      artistic: 'Camera: creative angle, artistic composition, stylized view'
    };

    const environment = environmentDetails[config.environment][config.businessUseCase as keyof typeof environmentDetails[typeof config.environment]] || 'professional business setting';
    
    let includeSection = '';
    if (config.includeSubjects && config.subjectTypes.length > 0) {
      includeSection = `Include: ${config.subjectTypes.join(', ')} in background only`;
    }

    return `Business Use Case: ${config.businessUseCase}
Environment: ${config.environment === 'inside' ? 'Interior' : 'Exterior'} - ${environment}
Style: ${config.style}
Lighting: ${lightingSetup[config.timeOfDay]}
${cameraSettings[config.style]}
Constraints: nothing in foreground, no text, no logos, empty space for product placement
${includeSection}
Quality: high detail, professional photography${config.style === 'cartoon' ? ', illustration quality' : ''}`;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!config.businessUseCase) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please select a business use case.'
      });
      return;
    }

    setIsGenerating(true);

    try {
      const structuredPrompt = generateStructuredPrompt(config);
      
      const response = await fetch('/api/generate-background', {
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
        throw new Error(errorData.error || 'Failed to generate background');
      }

      const data = await response.json();
      
      const background: GeneratedBackground = {
        id: `bg-${Date.now()}`,
        url: data.imageUrl,
        prompt: structuredPrompt,
        config: config,
        createdAt: new Date()
      };

      showToast({
        type: 'success',
        title: 'Background Generated',
        message: 'Your professional background is ready!'
      });

      onBackgroundGenerated(background);
    } catch (error) {
      console.error('Background generation error:', error);
      showToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate background. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [config, generateStructuredPrompt, showToast, onBackgroundGenerated]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generate Professional Background
        </h2>
        <p className="text-gray-600">
          Create a custom background for your marketing materials
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* Business Use Case */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What is this background for?
          </label>
          <select
            value={config.businessUseCase}
            onChange={(e) => setConfig(prev => ({ ...prev, businessUseCase: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select business type...</option>
            {businessUseCases.map(useCase => (
              <option key={useCase} value={useCase}>{useCase}</option>
            ))}
          </select>
        </div>

        {/* Environment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Environment
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, environment: 'inside' }))}
              className={`
                px-4 py-3 rounded-lg border-2 transition-colors
                ${config.environment === 'inside' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              🏢 Inside
            </button>
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, environment: 'outside' }))}
              className={`
                px-4 py-3 rounded-lg border-2 transition-colors
                ${config.environment === 'outside' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              🌳 Outside
            </button>
          </div>
        </div>

        {/* Time of Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time of Day
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'day', label: '☀️ Day', desc: 'Bright daylight' },
              { value: 'night', label: '🌙 Night', desc: 'Evening lights' },
              { value: 'golden-hour', label: '🌅 Golden Hour', desc: 'Sunset glow' },
              { value: 'blue-hour', label: '🌆 Blue Hour', desc: 'Twilight' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, timeOfDay: option.value as any }))}
                className={`
                  px-3 py-3 rounded-lg border-2 transition-colors text-center
                  ${config.timeOfDay === option.value 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Style
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'photorealistic', label: '📸 Photo-realistic', desc: 'Professional photo' },
              { value: 'cartoon', label: '🎨 Cartoon', desc: 'Illustrated style' },
              { value: 'minimalist', label: '⚪ Minimalist', desc: 'Clean & simple' },
              { value: 'artistic', label: '🖼️ Artistic', desc: 'Creative style' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, style: option.value as any }))}
                className={`
                  px-3 py-3 rounded-lg border-2 transition-colors text-center
                  ${config.style === option.value 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Include Subjects */}
        <div>
          <div className="flex items-center space-x-3 mb-3">
            <input
              type="checkbox"
              id="includeSubjects"
              checked={config.includeSubjects}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                includeSubjects: e.target.checked,
                subjectTypes: e.target.checked ? prev.subjectTypes : []
              }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeSubjects" className="text-sm font-medium text-gray-700">
              Include subjects in background?
            </label>
          </div>
          
          {config.includeSubjects && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {subjectOptions[config.environment].map(subject => (
                <label key={subject} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.subjectTypes.includes(subject)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig(prev => ({ 
                          ...prev, 
                          subjectTypes: [...prev.subjectTypes, subject]
                        }));
                      } else {
                        setConfig(prev => ({ 
                          ...prev, 
                          subjectTypes: prev.subjectTypes.filter(s => s !== subject)
                        }));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{subject}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Preview Prompt */}
        {config.businessUseCase && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Generated Prompt Preview:</h4>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {generateStructuredPrompt(config)}
            </pre>
          </div>
        )}
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
          disabled={isGenerating || !config.businessUseCase}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating Background...</span>
            </div>
          ) : (
            'Generate Background'
          )}
        </button>
      </div>
    </div>
  );
};

export default BackgroundGenerator;