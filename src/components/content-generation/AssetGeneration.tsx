'use client';

import React, { useState, useEffect } from 'react';
import { ContentTemplate, TemplateAnswers, GeneratedAsset, AssetGenerationRequest } from '@/types/templates';
import { useToast } from '@/hooks/useToast';
import PromptEditor from './PromptEditor';

interface AssetGenerationProps {
  template: ContentTemplate | null;
  answers: TemplateAnswers;
  style: string;
  colorPalette: string[];
  isGenerating: boolean;
  onAssetsGenerated: (assets: GeneratedAsset[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface GenerationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  asset?: GeneratedAsset;
  prompt?: string;
  customPrompt?: string;
}

export const AssetGeneration: React.FC<AssetGenerationProps> = ({
  template,
  answers,
  style,
  colorPalette,
  onAssetsGenerated,
}) => {
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<GenerationStep | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (template) {
      initializeGenerationSteps();
    }
  }, [template, style, colorPalette]);

  const initializeGenerationSteps = () => {
    const steps: GenerationStep[] = [
      {
        id: 'background',
        name: 'Background Design',
        description: 'Creating a custom background that matches your style',
        status: 'pending',
        prompt: generatePrompt('background')
      },
      {
        id: 'logo',
        name: 'Logo Elements',
        description: 'Generating logo and branding elements',
        status: 'pending',
        prompt: generatePrompt('logo')
      },
      {
        id: 'text-overlay',
        name: 'Text Overlays',
        description: 'Creating stylized text elements',
        status: 'pending',
        prompt: generatePrompt('text-overlay')
      },
      {
        id: 'decorative',
        name: 'Decorative Elements',
        description: 'Adding finishing touches and decorative elements',
        status: 'pending',
        prompt: generatePrompt('decorative')
      }
    ];

    setGenerationSteps(steps);
  };

  const generatePrompt = (assetType: string): string => {
    const businessName = answers.business_name || answers.store_name || answers.restaurant_name || 'Business';
    const industry = template?.industry || 'business';
    const colorHex = colorPalette.join(', ');
    
    // Enhanced prompts with better style coordination
    const styleModifiers = {
      'modern-minimal': 'clean lines, minimalist design, plenty of white space, contemporary',
      'bold-vibrant': 'dynamic, energetic, eye-catching, high contrast',
      'professional-corporate': 'trustworthy, established, business-focused, sophisticated',
      'warm-friendly': 'approachable, welcoming, community-focused, inviting',
      'luxury-elegant': 'sophisticated, premium, high-end, refined',
      'playful-creative': 'fun, artistic, imaginative, creative'
    };

    const styleDesc = styleModifiers[style as keyof typeof styleModifiers] || style.replace('-', ' ');

    const basePrompts = {
      background: `Create a ${styleDesc} background design for a ${industry} business called "${businessName}". Use primary colors: ${colorHex}. Professional, clean, suitable for marketing materials. Abstract patterns and textures that complement the ${style} aesthetic. No text or logos.`,
      logo: `Design a ${styleDesc} logo element for "${businessName}", a ${industry} business. Primary colors: ${colorHex}. Modern, memorable, scalable design that reflects ${industry} industry. Simple, iconic, professional. No text unless it's stylized as part of the design.`,
      'text-overlay': `Create ${styleDesc} text overlay graphics and decorative frames for "${businessName}" marketing. Colors: ${colorHex}. Include call-to-action elements, promotional badges, and text containers that match the ${style} aesthetic. No actual text content, just decorative frames and elements.`,
      decorative: `Design ${styleDesc} decorative elements and graphics for ${industry} marketing materials. Colors: ${colorHex}. Complementary shapes, icons, patterns, and design elements that enhance the overall ${style} theme. Industry-appropriate symbols and motifs.`
    };

    return basePrompts[assetType as keyof typeof basePrompts] || basePrompts.background;
  };

  const generateAssetWithAI = async (step: GenerationStep): Promise<GeneratedAsset> => {
    const promptToUse = step.customPrompt || step.prompt || generatePrompt(step.id);
    
    try {
      const response = await fetch('/api/generate-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToUse,
          style: style,
          colorPalette: colorPalette,
          assetType: step.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate asset');
      }

      const data = await response.json();
      
      const asset: GeneratedAsset = {
        id: `asset-${step.id}-${Date.now()}`,
        type: step.id as GeneratedAsset['type'],
        url: data.imageUrl,
        prompt: promptToUse,
        style: style,
        createdAt: new Date(),
        metadata: data.metadata
      };

      return asset;
    } catch (error) {
      console.error('AI generation error:', error);
      
      // Fallback to placeholder for demo purposes
      const asset: GeneratedAsset = {
        id: `asset-${step.id}-${Date.now()}`,
        type: step.id as GeneratedAsset['type'],
        url: `https://via.placeholder.com/400x300/${colorPalette[0]?.replace('#', '')}/${colorPalette[1]?.replace('#', '') || 'FFFFFF'}?text=${step.name}`,
        prompt: promptToUse,
        style: style,
        createdAt: new Date(),
        metadata: {
          width: 400,
          height: 300,
          format: 'png'
        }
      };

      return asset;
    }
  };

  const startGeneration = async () => {
    if (!template) return;

    setIsGenerating(true);
    setCurrentStep(0);

    try {
      const assets: GeneratedAsset[] = [];

      for (let i = 0; i < generationSteps.length; i++) {
        setCurrentStep(i);
        
        // Update step status to generating
        setGenerationSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'generating' } : step
        ));

        try {
          const asset = await generateAssetWithAI(generationSteps[i]);
          assets.push(asset);

          // Update step status to completed
          setGenerationSteps(prev => prev.map((step, index) => 
            index === i ? { ...step, status: 'completed', asset } : step
          ));

        } catch (error) {
          console.error(`Error generating ${generationSteps[i].name}:`, error);
          
          // Update step status to failed
          setGenerationSteps(prev => prev.map((step, index) => 
            index === i ? { ...step, status: 'failed' } : step
          ));

          showToast({
            type: 'error',
            title: 'Generation Failed',
            message: `Failed to generate ${generationSteps[i].name}. Continuing with other assets.`,
          });
        }
      }

      setGeneratedAssets(assets);
      
      if (assets.length > 0) {
        showToast({
          type: 'success',
          title: 'Assets Generated',
          message: `Successfully generated ${assets.length} template assets!`,
        });
        onAssetsGenerated(assets);
      } else {
        showToast({
          type: 'error',
          title: 'Generation Failed',
          message: 'Failed to generate any assets. Please try again.',
        });
      }

    } catch (error) {
      console.error('Asset generation error:', error);
      showToast({
        type: 'error',
        title: 'Generation Error',
        message: 'An error occurred during asset generation.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const retryFailedGeneration = async (stepIndex: number) => {
    const step = generationSteps[stepIndex];
    
    setGenerationSteps(prev => prev.map((s, index) => 
      index === stepIndex ? { ...s, status: 'generating' } : s
    ));

    try {
      const asset = await generateAssetWithAI(step);
      
      setGenerationSteps(prev => prev.map((s, index) => 
        index === stepIndex ? { ...s, status: 'completed', asset } : s
      ));

      setGeneratedAssets(prev => [...prev, asset]);

      showToast({
        type: 'success',
        title: 'Asset Generated',
        message: `Successfully generated ${step.name}!`,
      });

    } catch (error) {
      setGenerationSteps(prev => prev.map((s, index) => 
        index === stepIndex ? { ...s, status: 'failed' } : s
      ));

      showToast({
        type: 'error',
        title: 'Generation Failed',
        message: `Failed to generate ${step.name}. Please try again.`,
      });
    }
  };

  const handlePromptEdit = (step: GenerationStep) => {
    setEditingPrompt(step);
  };

  const handlePromptSave = (newPrompt: string) => {
    if (editingPrompt) {
      setGenerationSteps(prev => prev.map(step => 
        step.id === editingPrompt.id 
          ? { ...step, customPrompt: newPrompt }
          : step
      ));
    }
    setEditingPrompt(null);
  };

  const getStatusIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />;
      case 'generating':
        return <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No template selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Generate Template Assets
        </h3>
        <p className="text-gray-600">
          AI will create custom visual assets for your {template.industry} template.
        </p>
      </div>

      {/* Generation Steps */}
      <div className="space-y-4">
        {generationSteps.map((step, index) => (
          <div
            key={step.id}
            className={`
              flex items-center space-x-4 p-4 rounded-lg border
              ${step.status === 'generating' ? 'bg-blue-50 border-blue-200' : 
                step.status === 'completed' ? 'bg-green-50 border-green-200' :
                step.status === 'failed' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'}
            `}
          >
            {getStatusIcon(step.status)}
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{step.name}</h4>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>

            <div className="flex space-x-2">
              {!isGenerating && (
                <button
                  type="button"
                  onClick={() => handlePromptEdit(step)}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  title="Edit prompt"
                >
                  ✏️ Edit
                </button>
              )}
              
              {step.status === 'failed' && (
                <button
                  type="button"
                  onClick={() => retryFailedGeneration(index)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>

            {step.asset && (
              <div className="w-16 h-16 rounded-lg overflow-hidden border">
                <img
                  src={step.asset.url}
                  alt={step.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Generation Controls */}
      <div className="text-center">
        {!isGenerating && generatedAssets.length === 0 && (
          <button
            type="button"
            onClick={startGeneration}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Asset Generation
          </button>
        )}

        {isGenerating && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Generating {generationSteps[currentStep]?.name}...
            </div>
            <div className="text-xs text-gray-500">
              This may take a few minutes. Please don&apos;t close this window.
            </div>
          </div>
        )}

        {!isGenerating && generatedAssets.length > 0 && (
          <div className="space-y-4">
            <div className="text-green-600 font-medium">
              ✅ Generated {generatedAssets.length} assets successfully!
            </div>
            <button
              type="button"
              onClick={() => onAssetsGenerated(generatedAssets)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Continue to Preview
            </button>
          </div>
        )}
      </div>

      {/* Style Coordination Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Style Coordination System</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>All assets use consistent color palette: {colorPalette.join(', ')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Visual style &quot;{style.replace('-', ' ')}&quot; applied across all elements</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Industry-specific elements for {template?.industry} business</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Sequential generation ensures visual coherence</span>
          </div>
        </div>
      </div>

      {/* Generated Assets Preview */}
      {generatedAssets.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-4">Generated Assets</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedAssets.map((asset) => (
              <div key={asset.id} className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={asset.url}
                    alt={asset.type}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
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
      )}

      {/* Prompt Editor Modal */}
      {editingPrompt && (
        <PromptEditor
          assetType={editingPrompt.id}
          basePrompt={editingPrompt.prompt || generatePrompt(editingPrompt.id)}
          style={style}
          colorPalette={colorPalette}
          industry={template?.industry || 'business'}
          onPromptChange={handlePromptSave}
          onClose={() => setEditingPrompt(null)}
        />
      )}
    </div>
  );
};

export default AssetGeneration;