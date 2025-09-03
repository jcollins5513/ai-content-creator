'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ContentTemplate, 
  TemplateAnswers, 
  GeneratedAsset, 
  AssetGenerationPipeline,
  AssetGenerationStep,
  AssetGenerationProgress
} from '@/types/templates';
import { useToast } from '@/hooks/useToast';
import { assetGenerationPipelineService } from '@/services/assetGenerationPipeline';
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

export const AssetGeneration: React.FC<AssetGenerationProps> = ({
  template,
  answers,
  style,
  colorPalette,
  onAssetsGenerated,
}) => {
  const [pipeline, setPipeline] = useState<AssetGenerationPipeline | null>(null);
  const [progress, setProgress] = useState<AssetGenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [editingStep, setEditingStep] = useState<AssetGenerationStep | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const { showToast } = useToast();

  const initializePipeline = useCallback(() => {
    if (!template) return;
    
    const newPipeline = assetGenerationPipelineService.createPipeline(
      template,
      answers,
      style,
      colorPalette
    );
    
    setPipeline(newPipeline);
    setProgress(newPipeline.progress);
    setGeneratedAssets([]);
  }, [template, answers, style, colorPalette]);

  useEffect(() => {
    if (template) {
      initializePipeline();
    }
  }, [template, style, colorPalette, initializePipeline]);

  const handleProgressUpdate = useCallback((newProgress: AssetGenerationProgress) => {
    setProgress(newProgress);
    setEstimatedTimeRemaining(newProgress.estimatedTimeRemaining || 0);
  }, []);

  const handleStepComplete = useCallback((step: AssetGenerationStep, asset: GeneratedAsset) => {
    setGeneratedAssets(prev => [...prev, asset]);
    
    showToast({
      type: 'success',
      title: 'Asset Generated',
      message: `Successfully generated ${step.name}!`,
    });
  }, [showToast]);

  const handleStepFailed = useCallback((step: AssetGenerationStep, error: string) => {
    showToast({
      type: 'error',
      title: 'Generation Failed',
      message: `Failed to generate ${step.name}: ${error}`,
    });
  }, [showToast]);

  const startGeneration = async () => {
    if (!pipeline || !template) return;

    setIsGenerating(true);
    setGeneratedAssets([]);

    try {
      const assets = await assetGenerationPipelineService.executePipeline(
        pipeline,
        handleProgressUpdate,
        handleStepComplete,
        handleStepFailed
      );

      if (assets.length > 0) {
        showToast({
          type: 'success',
          title: 'Pipeline Complete',
          message: `Successfully generated ${assets.length} coordinated assets!`,
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
      console.error('Pipeline execution error:', error);
      showToast({
        type: 'error',
        title: 'Pipeline Error',
        message: 'An error occurred during asset generation pipeline.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateAsset = async (stepId: string, customPrompt?: string) => {
    if (!pipeline) return;

    try {
      const asset = await assetGenerationPipelineService.regenerateAsset(
        pipeline,
        stepId,
        customPrompt
      );

      // Update local state
      setGeneratedAssets(prev => {
        const filtered = prev.filter(a => a.type !== asset.type);
        return [...filtered, asset];
      });

      showToast({
        type: 'success',
        title: 'Asset Regenerated',
        message: `Successfully regenerated ${asset.type.replace('-', ' ')}!`,
      });

    } catch (error) {
      console.error('Regeneration error:', error);
      showToast({
        type: 'error',
        title: 'Regeneration Failed',
        message: 'Failed to regenerate asset. Please try again.',
      });
    }
  };

  const handlePromptEdit = (step: AssetGenerationStep) => {
    setEditingStep(step);
  };

  const handlePromptSave = (newPrompt: string) => {
    if (editingStep && pipeline) {
      // Update the step in the pipeline
      const stepIndex = pipeline.steps.findIndex(s => s.id === editingStep.id);
      if (stepIndex >= 0) {
        pipeline.steps[stepIndex].customPrompt = newPrompt;
      }
    }
    setEditingStep(null);
  };

  const getStatusIcon = (status: AssetGenerationStep['status']) => {
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
      case 'skipped':
        return (
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!template || !pipeline) {
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
          Sequential Asset Generation Pipeline
        </h3>
        <p className="text-gray-600">
          AI will create coordinated visual assets for your {template.industry} template in sequence.
        </p>
      </div>

      {/* Progress Overview */}
      {progress && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Generation Progress
            </span>
            <span className="text-sm text-blue-700">
              {progress.currentStep + 1} of {progress.totalSteps} steps
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((progress.currentStep + 1) / progress.totalSteps) * 100}%` }}
            />
          </div>
          {isGenerating && estimatedTimeRemaining > 0 && (
            <div className="text-xs text-blue-600">
              Estimated time remaining: {formatTimeRemaining(estimatedTimeRemaining)}
            </div>
          )}
        </div>
      )}

      {/* Generation Steps */}
      <div className="space-y-4">
        {pipeline.steps.map((step) => (
          <div
            key={step.id}
            className={`
              flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200
              ${step.status === 'generating' ? 'bg-blue-50 border-blue-200 shadow-md' : 
                step.status === 'completed' ? 'bg-green-50 border-green-200' :
                step.status === 'failed' ? 'bg-red-50 border-red-200' :
                step.status === 'skipped' ? 'bg-yellow-50 border-yellow-200' :
                'bg-gray-50 border-gray-200'}
            `}
          >
            {getStatusIcon(step.status)}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">{step.name}</h4>
                {step.dependencies.length > 0 && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    Depends on: {step.dependencies.join(', ')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{step.description}</p>
              {step.attempts > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Attempt {step.attempts} of {step.maxAttempts}
                </p>
              )}
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
                  onClick={() => regenerateAsset(step.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              )}

              {step.status === 'completed' && step.asset && (
                <button
                  type="button"
                  onClick={() => regenerateAsset(step.id, step.customPrompt)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Regenerate
                </button>
              )}
            </div>

            {step.asset && (
              <div className="w-16 h-16 rounded-lg overflow-hidden border shadow-sm">
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
            Start Sequential Generation Pipeline
          </button>
        )}

        {isGenerating && progress && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Generating {progress.currentAssetType.replace('-', ' ')}...
            </div>
            <div className="text-xs text-gray-500">
              Sequential generation in progress. Each asset builds upon the previous ones.
            </div>
            {estimatedTimeRemaining > 0 && (
              <div className="text-xs text-blue-600">
                Estimated time remaining: {formatTimeRemaining(estimatedTimeRemaining)}
              </div>
            )}
          </div>
        )}

        {!isGenerating && generatedAssets.length > 0 && (
          <div className="space-y-4">
            <div className="text-green-600 font-medium">
              ✅ Generated {generatedAssets.length} coordinated assets successfully!
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

      {/* Enhanced Coordination Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Advanced Pipeline Coordination
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Sequential generation: Background → Logo → Text Overlays → Decorative Elements</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Each asset references previous elements for visual harmony</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Consistent color palette: {colorPalette.join(', ')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Style coordination: &quot;{style.replace('-', ' ')}&quot; across all elements</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Industry alignment: {template?.industry} business context</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Automatic retry logic with exponential backoff</span>
          </div>
        </div>
      </div>

      {/* Generated Assets Preview */}
      {generatedAssets.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            Generated Coordinated Assets
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedAssets
              .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
              .map((asset) => (
              <div key={asset.id} className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
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
                  <div className="text-xs text-blue-600">
                    Sequence #{asset.sequenceIndex + 1}
                  </div>
                  {asset.metadata.generationTime && (
                    <div className="text-xs text-gray-400">
                      {Math.round(asset.metadata.generationTime / 1000)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset Coordination Validation */}
      {generatedAssets.length > 0 && pipeline && (
        <div className="mt-6">
          {(() => {
            const validation = assetGenerationPipelineService.validateAssetCoordination(
              generatedAssets,
              pipeline.coordinationRules
            );
            
            return (
              <div className={`rounded-lg p-4 ${validation.isCoordinated ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <h5 className={`font-medium mb-2 ${validation.isCoordinated ? 'text-green-900' : 'text-yellow-900'}`}>
                  {validation.isCoordinated ? '✅ Assets are well coordinated' : '⚠️ Coordination issues detected'}
                </h5>
                {validation.issues.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Issues:</p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {validation.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validation.suggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">Suggestions:</p>
                    <ul className="text-sm text-blue-700 list-disc list-inside">
                      {validation.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Prompt Editor Modal */}
      {editingStep && (
        <PromptEditor
          assetType={editingStep.id}
          basePrompt={editingStep.customPrompt || editingStep.prompt}
          style={style}
          colorPalette={colorPalette}
          industry={template?.industry || 'business'}
          onPromptChange={handlePromptSave}
          onClose={() => setEditingStep(null)}
        />
      )}
    </div>
  );
};

export default AssetGeneration;