import { useState, useCallback } from 'react';
import { 
  ContentTemplate, 
  TemplateAnswers, 
  GeneratedAsset, 
  TemplateGenerationSession 
} from '@/types/templates';
import { templateGenerationService } from '@/services/templateGeneration';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export const useTemplateGeneration = () => {
  const [currentSession, setCurrentSession] = useState<TemplateGenerationSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { user } = useAuth();
  const { showToast } = useToast();

  const createSession = useCallback(async (
    template: ContentTemplate,
    answers: TemplateAnswers,
    style: string,
    colorPalette: string[]
  ): Promise<string | null> => {
    if (!user) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to create templates.',
      });
      return null;
    }

    try {
      const sessionId = await templateGenerationService.createSession(
        user.uid,
        template.id,
        answers,
        style,
        colorPalette
      );

      const session = await templateGenerationService.getSession(user.uid, sessionId);
      setCurrentSession(session);

      return sessionId;
    } catch (error) {
      console.error('Error creating generation session:', error);
      showToast({
        type: 'error',
        title: 'Session Creation Failed',
        message: 'Failed to create generation session. Please try again.',
      });
      return null;
    }
  }, [user, showToast]);

  const generateCoordinatedAssets = useCallback(async (
    template: ContentTemplate,
    answers: TemplateAnswers,
    style: string,
    colorPalette: string[]
  ): Promise<GeneratedAsset[]> => {
    if (!user || !currentSession) {
      throw new Error('No active session');
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Generate coordinated prompts
      const prompts = templateGenerationService.generateCoordinatedPrompts(
        template,
        answers,
        style,
        colorPalette
      );

      const assets: GeneratedAsset[] = [];
      const assetTypes = ['background', 'logo', 'text-overlay', 'decorative'];

      for (let i = 0; i < assetTypes.length; i++) {
        const assetType = assetTypes[i];
        setGenerationProgress((i / assetTypes.length) * 100);

        try {
          const response = await fetch('/api/generate-assets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: prompts[assetType],
              style: style,
              colorPalette: colorPalette,
              assetType: assetType
            }),
          });

          if (response.ok) {
            const data = await response.json();
            
            const asset: GeneratedAsset = {
              id: `asset-${assetType}-${Date.now()}`,
              type: assetType as GeneratedAsset['type'],
              url: data.imageUrl,
              prompt: prompts[assetType],
              style: style,
              createdAt: new Date(),
              metadata: data.metadata
            };

            assets.push(asset);
          } else {
            console.warn(`Failed to generate ${assetType} asset`);
          }
        } catch (error) {
          console.error(`Error generating ${assetType}:`, error);
        }
      }

      setGenerationProgress(100);

      // Update session with generated assets
      await templateGenerationService.updateSessionAssets(
        user.uid,
        currentSession.id,
        assets
      );

      // Validate coordination
      const validation = templateGenerationService.validateStyleCoordination(
        assets,
        style,
        colorPalette
      );

      if (!validation.isCoordinated) {
        showToast({
          type: 'warning',
          title: 'Style Coordination Issues',
          message: validation.issues.join('. '),
        });
      }

      return assets;
    } catch (error) {
      console.error('Error generating coordinated assets:', error);
      showToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate coordinated assets. Please try again.',
      });
      return [];
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [user, currentSession, showToast]);

  const completeSession = useCallback(async (): Promise<void> => {
    if (!user || !currentSession) {
      return;
    }

    try {
      await templateGenerationService.completeSession(user.uid, currentSession.id);
      
      showToast({
        type: 'success',
        title: 'Template Completed',
        message: 'Your AI-generated template has been saved successfully!',
      });
    } catch (error) {
      console.error('Error completing session:', error);
      showToast({
        type: 'error',
        title: 'Completion Failed',
        message: 'Failed to complete template session.',
      });
    }
  }, [user, currentSession, showToast]);

  const getCoordinatedPrompts = useCallback((
    template: ContentTemplate,
    answers: TemplateAnswers,
    style: string,
    colorPalette: string[]
  ) => {
    return templateGenerationService.generateCoordinatedPrompts(
      template,
      answers,
      style,
      colorPalette
    );
  }, []);

  return {
    currentSession,
    isGenerating,
    generationProgress,
    createSession,
    generateCoordinatedAssets,
    completeSession,
    getCoordinatedPrompts,
    setCurrentSession
  };
};