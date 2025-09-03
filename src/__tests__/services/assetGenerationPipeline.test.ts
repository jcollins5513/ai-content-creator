import { assetGenerationPipelineService } from '@/services/assetGenerationPipeline';
import { ContentTemplate, TemplateAnswers } from '@/types/templates';

// Mock fetch for testing
global.fetch = jest.fn();

describe('AssetGenerationPipelineService', () => {
  const mockTemplate: ContentTemplate = {
    id: 'test-template',
    name: 'Test Template',
    type: 'built-in',
    industry: 'automotive',
    description: 'Test template for automotive industry',
    questions: [],
    promptTemplate: 'Test prompt template',
    isActive: true,
    createdAt: new Date()
  };

  const mockAnswers: TemplateAnswers = {
    business_name: 'Test Auto Shop'
  };

  const mockStyle = 'modern-minimal';
  const mockColorPalette = ['#3B82F6', '#1E40AF'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPipeline', () => {
    it('should create a pipeline with correct structure', () => {
      const pipeline = assetGenerationPipelineService.createPipeline(
        mockTemplate,
        mockAnswers,
        mockStyle,
        mockColorPalette
      );

      expect(pipeline).toBeDefined();
      expect(pipeline.sessionId).toMatch(/^pipeline-/);
      expect(pipeline.steps).toHaveLength(4);
      expect(pipeline.progress.totalSteps).toBe(4);
      expect(pipeline.progress.currentStep).toBe(0);
      expect(pipeline.progress.status).toBe('idle');
      expect(pipeline.coordinationRules.colorConsistency).toBe(true);
      expect(pipeline.coordinationRules.styleConsistency).toBe(true);
    });

    it('should create steps in correct sequence', () => {
      const pipeline = assetGenerationPipelineService.createPipeline(
        mockTemplate,
        mockAnswers,
        mockStyle,
        mockColorPalette
      );

      const stepTypes = pipeline.steps.map(step => step.type);
      expect(stepTypes).toEqual(['background', 'logo', 'text-overlay', 'decorative']);

      const sequenceIndexes = pipeline.steps.map(step => step.sequenceIndex);
      expect(sequenceIndexes).toEqual([0, 1, 2, 3]);
    });

    it('should set correct dependencies', () => {
      const pipeline = assetGenerationPipelineService.createPipeline(
        mockTemplate,
        mockAnswers,
        mockStyle,
        mockColorPalette
      );

      expect(pipeline.steps[0].dependencies).toEqual([]); // background has no dependencies
      expect(pipeline.steps[1].dependencies).toEqual(['background']); // logo depends on background
      expect(pipeline.steps[2].dependencies).toEqual(['background', 'logo']); // text-overlay depends on both
      expect(pipeline.steps[3].dependencies).toEqual(['background', 'logo', 'text-overlay']); // decorative depends on all
    });
  });

  describe('validateAssetCoordination', () => {
    it('should validate coordinated assets correctly', () => {
      const mockAssets = [
        {
          id: 'asset-1',
          type: 'background' as const,
          url: 'test-url-1',
          prompt: 'test prompt',
          style: mockStyle,
          createdAt: new Date(),
          sequenceIndex: 0,
          generationAttempt: 1,
          metadata: { width: 1024, height: 1024, format: 'png', generationTime: 1000 }
        },
        {
          id: 'asset-2',
          type: 'logo' as const,
          url: 'test-url-2',
          prompt: 'test prompt',
          style: mockStyle,
          createdAt: new Date(),
          sequenceIndex: 1,
          generationAttempt: 1,
          metadata: { width: 1024, height: 1024, format: 'png', generationTime: 1000 }
        }
      ];

      const pipeline = assetGenerationPipelineService.createPipeline(
        mockTemplate,
        mockAnswers,
        mockStyle,
        mockColorPalette
      );

      const validation = assetGenerationPipelineService.validateAssetCoordination(
        mockAssets,
        pipeline.coordinationRules
      );

      expect(validation.isCoordinated).toBe(false); // Missing some asset types
      expect(validation.issues).toContain('Missing asset types: text-overlay, decorative');
    });

    it('should detect style inconsistencies', () => {
      const mockAssets = [
        {
          id: 'asset-1',
          type: 'background' as const,
          url: 'test-url-1',
          prompt: 'test prompt',
          style: 'modern-minimal',
          createdAt: new Date(),
          sequenceIndex: 0,
          generationAttempt: 1,
          metadata: { width: 1024, height: 1024, format: 'png', generationTime: 1000 }
        },
        {
          id: 'asset-2',
          type: 'logo' as const,
          url: 'test-url-2',
          prompt: 'test prompt',
          style: 'bold-vibrant', // Different style
          createdAt: new Date(),
          sequenceIndex: 1,
          generationAttempt: 1,
          metadata: { width: 1024, height: 1024, format: 'png', generationTime: 1000 }
        }
      ];

      const pipeline = assetGenerationPipelineService.createPipeline(
        mockTemplate,
        mockAnswers,
        mockStyle,
        mockColorPalette
      );

      const validation = assetGenerationPipelineService.validateAssetCoordination(
        mockAssets,
        pipeline.coordinationRules
      );

      expect(validation.isCoordinated).toBe(false);
      expect(validation.issues).toContain('Inconsistent styles detected across assets');
    });
  });

  describe('generateCoordinatedPrompt', () => {
    it('should generate different prompts for different asset types', () => {
      const pipeline = assetGenerationPipelineService.createPipeline(
        mockTemplate,
        mockAnswers,
        mockStyle,
        mockColorPalette
      );

      const backgroundPrompt = pipeline.steps[0].prompt;
      const logoPrompt = pipeline.steps[1].prompt;

      expect(backgroundPrompt).toContain('background');
      expect(backgroundPrompt).toContain('Test Auto Shop');
      expect(backgroundPrompt).toContain('automotive');
      
      expect(logoPrompt).toContain('logo');
      expect(logoPrompt).toContain('Test Auto Shop');
      expect(logoPrompt).toContain('automotive');
      
      expect(backgroundPrompt).not.toBe(logoPrompt);
    });

    it('should include style and color information in prompts', () => {
      const pipeline = assetGenerationPipelineService.createPipeline(
        mockTemplate,
        mockAnswers,
        mockStyle,
        mockColorPalette
      );

      pipeline.steps.forEach(step => {
        expect(step.prompt).toContain(mockColorPalette.join(', '));
        expect(step.prompt).toContain('modern minimal'); // style converted from kebab-case
      });
    });
  });
});