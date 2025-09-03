import { useState, useCallback, useRef } from 'react';
import { 
  AssetGenerationPipeline,
  AssetGenerationProgress,
  AssetGenerationStep,
  GeneratedAsset,
  ContentTemplate,
  TemplateAnswers
} from '@/types/templates';
import { assetGenerationPipelineService } from '@/services/assetGenerationPipeline';

export interface UseAssetGenerationPipelineReturn {
  pipeline: AssetGenerationPipeline | null;
  progress: AssetGenerationProgress | null;
  isGenerating: boolean;
  generatedAssets: GeneratedAsset[];
  error: string | null;
  
  // Actions
  initializePipeline: (template: ContentTemplate, answers: TemplateAnswers, style: string, colorPalette: string[]) => void;
  startGeneration: () => Promise<GeneratedAsset[]>;
  regenerateAsset: (stepId: string, customPrompt?: string) => Promise<GeneratedAsset>;
  updateStepPrompt: (stepId: string, customPrompt: string) => void;
  resetPipeline: () => void;
  
  // Event handlers
  onProgressUpdate: (callback: (progress: AssetGenerationProgress) => void) => void;
  onStepComplete: (callback: (step: AssetGenerationStep, asset: GeneratedAsset) => void) => void;
  onStepFailed: (callback: (step: AssetGenerationStep, error: string) => void) => void;
}

export const useAssetGenerationPipeline = (): UseAssetGenerationPipelineReturn => {
  const [pipeline, setPipeline] = useState<AssetGenerationPipeline | null>(null);
  const [progress, setProgress] = useState<AssetGenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Event callback refs
  const progressCallbackRef = useRef<((progress: AssetGenerationProgress) => void) | null>(null);
  const stepCompleteCallbackRef = useRef<((step: AssetGenerationStep, asset: GeneratedAsset) => void) | null>(null);
  const stepFailedCallbackRef = useRef<((step: AssetGenerationStep, error: string) => void) | null>(null);

  const initializePipeline = useCallback((
    template: ContentTemplate,
    answers: TemplateAnswers,
    style: string,
    colorPalette: string[]
  ) => {
    try {
      const newPipeline = assetGenerationPipelineService.createPipeline(
        template,
        answers,
        style,
        colorPalette
      );
      
      setPipeline(newPipeline);
      setProgress(newPipeline.progress);
      setGeneratedAssets([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize pipeline');
    }
  }, []);

  const handleProgressUpdate = useCallback((newProgress: AssetGenerationProgress) => {
    setProgress(newProgress);
    progressCallbackRef.current?.(newProgress);
  }, []);

  const handleStepComplete = useCallback((step: AssetGenerationStep, asset: GeneratedAsset) => {
    setGeneratedAssets(prev => {
      // Remove any existing asset of the same type and add the new one
      const filtered = prev.filter(a => a.type !== asset.type);
      return [...filtered, asset].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
    });
    stepCompleteCallbackRef.current?.(step, asset);
  }, []);

  const handleStepFailed = useCallback((step: AssetGenerationStep, errorMessage: string) => {
    setError(`Failed to generate ${step.name}: ${errorMessage}`);
    stepFailedCallbackRef.current?.(step, errorMessage);
  }, []);

  const startGeneration = useCallback(async (): Promise<GeneratedAsset[]> => {
    if (!pipeline) {
      throw new Error('Pipeline not initialized');
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedAssets([]);

    try {
      const assets = await assetGenerationPipelineService.executePipeline(
        pipeline,
        handleProgressUpdate,
        handleStepComplete,
        handleStepFailed
      );

      return assets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Pipeline execution failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [pipeline, handleProgressUpdate, handleStepComplete, handleStepFailed]);

  const regenerateAsset = useCallback(async (stepId: string, customPrompt?: string): Promise<GeneratedAsset> => {
    if (!pipeline) {
      throw new Error('Pipeline not initialized');
    }

    try {
      const asset = await assetGenerationPipelineService.regenerateAsset(
        pipeline,
        stepId,
        customPrompt
      );

      // Update local state
      setGeneratedAssets(prev => {
        const filtered = prev.filter(a => a.type !== asset.type);
        return [...filtered, asset].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
      });

      return asset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Asset regeneration failed';
      setError(errorMessage);
      throw err;
    }
  }, [pipeline]);

  const updateStepPrompt = useCallback((stepId: string, customPrompt: string) => {
    if (!pipeline) return;

    const stepIndex = pipeline.steps.findIndex(s => s.id === stepId);
    if (stepIndex >= 0) {
      pipeline.steps[stepIndex].customPrompt = customPrompt;
      setPipeline({ ...pipeline });
    }
  }, [pipeline]);

  const resetPipeline = useCallback(() => {
    setPipeline(null);
    setProgress(null);
    setIsGenerating(false);
    setGeneratedAssets([]);
    setError(null);
  }, []);

  const onProgressUpdate = useCallback((callback: (progress: AssetGenerationProgress) => void) => {
    progressCallbackRef.current = callback;
  }, []);

  const onStepComplete = useCallback((callback: (step: AssetGenerationStep, asset: GeneratedAsset) => void) => {
    stepCompleteCallbackRef.current = callback;
  }, []);

  const onStepFailed = useCallback((callback: (step: AssetGenerationStep, error: string) => void) => {
    stepFailedCallbackRef.current = callback;
  }, []);

  return {
    pipeline,
    progress,
    isGenerating,
    generatedAssets,
    error,
    
    initializePipeline,
    startGeneration,
    regenerateAsset,
    updateStepPrompt,
    resetPipeline,
    
    onProgressUpdate,
    onStepComplete,
    onStepFailed
  };
};