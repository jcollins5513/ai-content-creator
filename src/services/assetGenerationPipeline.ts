import { 
  AssetGenerationRequest,
  GeneratedAsset,
  AssetGenerationPipeline,
  AssetGenerationStep,
  AssetGenerationProgress,
  StyleCoordinationRules,
  ContentTemplate,
  TemplateAnswers
} from '@/types/templates';

export class AssetGenerationPipelineService {
  private static instance: AssetGenerationPipelineService;

  static getInstance(): AssetGenerationPipelineService {
    if (!AssetGenerationPipelineService.instance) {
      AssetGenerationPipelineService.instance = new AssetGenerationPipelineService();
    }
    return AssetGenerationPipelineService.instance;
  }

  /**
   * Create a new asset generation pipeline
   */
  createPipeline(
    template: ContentTemplate,
    answers: TemplateAnswers,
    style: string,
    colorPalette: string[]
  ): AssetGenerationPipeline {
    const sessionId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const steps = this.createGenerationSteps(template, answers, style, colorPalette);
    const coordinationRules = this.createCoordinationRules(style);
    
    const progress: AssetGenerationProgress = {
      currentStep: 0,
      totalSteps: steps.length,
      currentAssetType: steps[0]?.type || 'background',
      status: 'idle',
      completedAssets: [],
      failedAssets: []
    };

    return {
      sessionId,
      steps,
      progress,
      coordinationRules
    };
  }

  /**
   * Create generation steps with proper sequencing
   */
  private createGenerationSteps(
    template: ContentTemplate,
    answers: TemplateAnswers,
    style: string,
    colorPalette: string[]
  ): AssetGenerationStep[] {
    const businessName = answers.business_name || answers.store_name || answers.restaurant_name || 'Business';
    const industry = template.industry;

    return [
      {
        id: 'background',
        type: 'background',
        name: 'Background Design',
        description: 'Creating the foundational background that sets the visual tone',
        status: 'pending',
        prompt: this.generateCoordinatedPrompt('background', template, answers, style, colorPalette),
        attempts: 0,
        maxAttempts: 3,
        dependencies: [],
        estimatedDuration: 45000, // 45 seconds
        sequenceIndex: 0
      },
      {
        id: 'logo',
        type: 'logo',
        name: 'Logo Elements',
        description: 'Generating brand identity elements that complement the background',
        status: 'pending',
        prompt: this.generateCoordinatedPrompt('logo', template, answers, style, colorPalette),
        attempts: 0,
        maxAttempts: 3,
        dependencies: ['background'],
        estimatedDuration: 50000, // 50 seconds
        sequenceIndex: 1
      },
      {
        id: 'text-overlay',
        type: 'text-overlay',
        name: 'Text Overlay Elements',
        description: 'Creating text containers and promotional elements',
        status: 'pending',
        prompt: this.generateCoordinatedPrompt('text-overlay', template, answers, style, colorPalette),
        attempts: 0,
        maxAttempts: 3,
        dependencies: ['background', 'logo'],
        estimatedDuration: 40000, // 40 seconds
        sequenceIndex: 2
      },
      {
        id: 'decorative',
        type: 'decorative',
        name: 'Decorative Elements',
        description: 'Adding finishing touches and complementary design elements',
        status: 'pending',
        prompt: this.generateCoordinatedPrompt('decorative', template, answers, style, colorPalette),
        attempts: 0,
        maxAttempts: 3,
        dependencies: ['background', 'logo', 'text-overlay'],
        estimatedDuration: 35000, // 35 seconds
        sequenceIndex: 3
      }
    ];
  }

  /**
   * Generate coordinated prompts that reference previous assets
   */
  private generateCoordinatedPrompt(
    assetType: string,
    template: ContentTemplate,
    answers: TemplateAnswers,
    style: string,
    colorPalette: string[],
    previousAssets?: GeneratedAsset[]
  ): string {
    const businessName = answers.business_name || answers.store_name || answers.restaurant_name || 'Business';
    const industry = template.industry;
    const colorHex = colorPalette.join(', ');
    
    // Style-specific modifiers for practical, usable designs
    const styleModifiers = {
      'modern-minimal': {
        background: 'subtle gradient or solid color',
        logo: 'simple lettermark or geometric symbol',
        textOverlay: 'clean rectangular frames and buttons',
        decorative: 'minimal lines and dots as accents'
      },
      'bold-vibrant': {
        background: 'vibrant gradient background',
        logo: 'strong, bold lettermark or symbol',
        textOverlay: 'high-contrast buttons and frames',
        decorative: 'bold accent lines and shapes'
      },
      'professional-corporate': {
        background: 'subtle corporate blue gradient',
        logo: 'professional lettermark or shield symbol',
        textOverlay: 'formal rectangular frames and buttons',
        decorative: 'conservative lines and professional accents'
      },
      'warm-friendly': {
        background: 'warm, welcoming gradient',
        logo: 'friendly rounded lettermark or symbol',
        textOverlay: 'rounded corner frames and buttons',
        decorative: 'soft curved lines and friendly accents'
      },
      'luxury-elegant': {
        background: 'sophisticated dark gradient',
        logo: 'elegant serif lettermark or refined symbol',
        textOverlay: 'premium bordered frames and buttons',
        decorative: 'elegant thin lines and refined accents'
      },
      'playful-creative': {
        background: 'creative colorful gradient',
        logo: 'artistic lettermark or creative symbol',
        textOverlay: 'creative shaped frames and buttons',
        decorative: 'artistic lines and creative accent elements'
      }
    };

    const modifiers = styleModifiers[style as keyof typeof styleModifiers] || {
      background: 'professional patterns',
      logo: 'clean symbols',
      textOverlay: 'simple frames',
      decorative: 'complementary elements'
    };

    // Build coordination context from previous assets
    let coordinationContext = '';
    if (previousAssets && previousAssets.length > 0) {
      const completedTypes = previousAssets.map(asset => asset.type);
      coordinationContext = ` Building upon the existing ${completedTypes.join(', ')} elements to maintain visual harmony and style consistency.`;
    }

    // Industry-specific photo-realistic backgrounds
    const industryBackgrounds = {
      'automotive': {
        subject: 'dealership showroom backdrop',
        environment: 'modern car showroom interior, polished tile floors, glass windows, professional lighting',
        lighting: 'soft key light from camera-left, practical warm lights in background, showroom lighting'
      },
      'real-estate': {
        subject: 'luxury home interior backdrop',
        environment: 'modern living room or kitchen, hardwood floors, large windows, contemporary furniture',
        lighting: 'natural window light, warm interior lighting, soft shadows'
      },
      'restaurant': {
        subject: 'restaurant interior backdrop',
        environment: 'modern restaurant dining area, clean tables, ambient lighting, professional kitchen background',
        lighting: 'warm ambient lighting, soft overhead lights, cozy atmosphere'
      },
      'retail': {
        subject: 'modern retail store backdrop',
        environment: 'clean retail space, polished floors, display areas, professional lighting',
        lighting: 'bright retail lighting, even illumination, clean shadows'
      },
      'healthcare': {
        subject: 'medical office backdrop',
        environment: 'clean medical facility, modern equipment, professional setting',
        lighting: 'clean white lighting, professional medical environment'
      },
      'business': {
        subject: 'corporate office backdrop',
        environment: 'modern office space, conference room, professional setting',
        lighting: 'professional office lighting, clean and bright'
      }
    };

    const config = industryBackgrounds[industry as keyof typeof industryBackgrounds] || industryBackgrounds.business;

    const basePrompts = {
      background: `Subject: ${config.subject}
Style: photo-real, shallow depth of field
Environment: ${config.environment}
Lighting: ${config.lighting}
Camera: 35mm, f/2.8, ISO 200, 1/125s
Constraints: no text, no people, no brand logos, no subjects, no vehicles, nothing in foreground, clean floor, neutral reflections, empty space for product placement
Quality: high detail, film grain subtle, professional photography
Composition: wide shot, plenty of empty space for compositing, clean background`,
      
      logo: `Create a simple transparent PNG logo placeholder frame. Clean white or transparent background. Simple geometric border or frame where a logo can be placed. No actual logo content, just a clean professional frame or container. Minimal design, suitable for business branding.`,
      
      'text-overlay': `Create clean text overlay elements for marketing materials. Transparent PNG format. Simple rectangular frames, call-to-action buttons, price tags, promotional banners in professional colors. No text content, just the frames and containers. Clean geometric shapes, modern design.`,
      
      decorative: `Create simple decorative overlay elements for professional marketing. Transparent PNG format. Clean lines, subtle geometric accents, professional dividers, corner elements. Minimal, clean, professional accent elements that complement main content without competing.`
    };

    return basePrompts[assetType as keyof typeof basePrompts] || basePrompts.background;
  }

  /**
   * Create style coordination rules
   */
  private createCoordinationRules(style: string): StyleCoordinationRules {
    return {
      colorConsistency: true,
      styleConsistency: true,
      industryAlignment: true,
      visualHarmony: true,
      sequentialDependencies: {
        'logo': ['background'],
        'text-overlay': ['background', 'logo'],
        'decorative': ['background', 'logo', 'text-overlay']
      }
    };
  }

  /**
   * Execute the generation pipeline sequentially
   */
  async executePipeline(
    pipeline: AssetGenerationPipeline,
    onProgress?: (progress: AssetGenerationProgress) => void,
    onStepComplete?: (step: AssetGenerationStep, asset: GeneratedAsset) => void,
    onStepFailed?: (step: AssetGenerationStep, error: string) => void
  ): Promise<GeneratedAsset[]> {
    const completedAssets: GeneratedAsset[] = [];
    
    pipeline.progress.status = 'generating';
    onProgress?.(pipeline.progress);

    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      
      // Update progress
      pipeline.progress.currentStep = i;
      pipeline.progress.currentAssetType = step.type;
      pipeline.progress.estimatedTimeRemaining = this.calculateRemainingTime(pipeline.steps, i);
      onProgress?.(pipeline.progress);

      // Check dependencies
      const dependenciesMet = this.checkDependencies(step, completedAssets);
      if (!dependenciesMet) {
        step.status = 'skipped';
        pipeline.progress.failedAssets.push(step.id);
        onStepFailed?.(step, 'Dependencies not met');
        continue;
      }

      // Generate asset with retries
      let asset: GeneratedAsset | null = null;
      let lastError = '';

      for (let attempt = 1; attempt <= step.maxAttempts; attempt++) {
        step.attempts = attempt;
        step.status = 'generating';
        
        try {
          // Update prompt with coordination context
          const coordinatedPrompt = this.generateCoordinatedPrompt(
            step.type,
            { industry: 'business' } as ContentTemplate, // Simplified for this context
            {},
            pipeline.coordinationRules.styleConsistency ? 'modern-minimal' : 'professional',
            ['#3B82F6', '#1E40AF'],
            completedAssets
          );

          asset = await this.generateSingleAsset({
            type: step.type,
            prompt: step.customPrompt || coordinatedPrompt,
            style: 'modern-minimal', // This should come from the pipeline context
            colorPalette: ['#3B82F6', '#1E40AF'], // This should come from the pipeline context
            industry: 'business',
            sequenceIndex: i,
            previousAssets: completedAssets
          });

          if (asset) {
            step.status = 'completed';
            step.asset = asset;
            completedAssets.push(asset);
            pipeline.progress.completedAssets.push(asset);
            onStepComplete?.(step, asset);
            break;
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Attempt ${attempt} failed for ${step.name}:`, error);
          
          if (attempt === step.maxAttempts) {
            step.status = 'failed';
            pipeline.progress.failedAssets.push(step.id);
            onStepFailed?.(step, lastError);
          }
        }
      }
    }

    pipeline.progress.status = completedAssets.length > 0 ? 'completed' : 'failed';
    pipeline.progress.currentStep = pipeline.steps.length;
    pipeline.progress.estimatedTimeRemaining = 0;
    onProgress?.(pipeline.progress);

    return completedAssets;
  }

  /**
   * Generate a single asset with enhanced coordination
   */
  private async generateSingleAsset(request: AssetGenerationRequest): Promise<GeneratedAsset> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/generate-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          style: request.style,
          colorPalette: request.colorPalette,
          assetType: request.type,
          sequenceIndex: request.sequenceIndex,
          previousAssets: request.previousAssets?.map(asset => ({
            type: asset.type,
            style: asset.style
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate asset');
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;
      
      const asset: GeneratedAsset = {
        id: `asset-${request.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: request.type,
        url: data.imageUrl,
        prompt: request.prompt,
        style: request.style,
        createdAt: new Date(),
        sequenceIndex: request.sequenceIndex || 0,
        generationAttempt: 1,
        metadata: {
          ...data.metadata,
          generationTime
        }
      };

      return asset;
    } catch (error) {
      console.error('Asset generation error:', error);
      throw error;
    }
  }

  /**
   * Regenerate a specific asset in the pipeline
   */
  async regenerateAsset(
    pipeline: AssetGenerationPipeline,
    stepId: string,
    customPrompt?: string
  ): Promise<GeneratedAsset> {
    const step = pipeline.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in pipeline`);
    }

    // Get completed assets up to this step for coordination
    const previousAssets = pipeline.progress.completedAssets.filter(
      asset => asset.sequenceIndex < (step.sequenceIndex || 0)
    );

    const request: AssetGenerationRequest = {
      type: step.type,
      prompt: customPrompt || step.prompt,
      style: 'modern-minimal', // This should come from pipeline context
      colorPalette: ['#3B82F6', '#1E40AF'], // This should come from pipeline context
      industry: 'business',
      sequenceIndex: pipeline.steps.indexOf(step),
      previousAssets
    };

    const asset = await this.generateSingleAsset(request);
    
    // Update the step and pipeline
    step.asset = asset;
    step.status = 'completed';
    step.attempts += 1;
    
    // Update or add to completed assets
    const existingIndex = pipeline.progress.completedAssets.findIndex(a => a.type === asset.type);
    if (existingIndex >= 0) {
      pipeline.progress.completedAssets[existingIndex] = asset;
    } else {
      pipeline.progress.completedAssets.push(asset);
    }

    return asset;
  }

  /**
   * Check if step dependencies are met
   */
  private checkDependencies(step: AssetGenerationStep, completedAssets: GeneratedAsset[]): boolean {
    if (step.dependencies.length === 0) {
      return true;
    }

    const completedTypes = new Set(completedAssets.map(asset => asset.type));
    return step.dependencies.every(dep => completedTypes.has(dep as GeneratedAsset['type']));
  }

  /**
   * Calculate estimated remaining time
   */
  private calculateRemainingTime(steps: AssetGenerationStep[], currentIndex: number): number {
    let remainingTime = 0;
    
    for (let i = currentIndex + 1; i < steps.length; i++) {
      remainingTime += steps[i].estimatedDuration;
    }
    
    return remainingTime;
  }

  /**
   * Validate asset coordination
   */
  validateAssetCoordination(
    assets: GeneratedAsset[],
    rules: StyleCoordinationRules
  ): {
    isCoordinated: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check style consistency
    if (rules.styleConsistency) {
      const styles = new Set(assets.map(asset => asset.style));
      if (styles.size > 1) {
        issues.push('Inconsistent styles detected across assets');
        suggestions.push('Regenerate assets with consistent style parameters');
      }
    }

    // Check sequence completeness
    const requiredTypes: GeneratedAsset['type'][] = ['background', 'logo', 'text-overlay', 'decorative'];
    const generatedTypes = new Set(assets.map(asset => asset.type));
    const missingTypes = requiredTypes.filter(type => !generatedTypes.has(type));
    
    if (missingTypes.length > 0) {
      issues.push(`Missing asset types: ${missingTypes.join(', ')}`);
      suggestions.push('Generate missing asset types for complete template');
    }

    // Check sequence order
    const sortedAssets = [...assets].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
    if (JSON.stringify(sortedAssets) !== JSON.stringify(assets)) {
      suggestions.push('Assets were generated out of sequence - coordination may be affected');
    }

    return {
      isCoordinated: issues.length === 0,
      issues,
      suggestions
    };
  }
}

export const assetGenerationPipelineService = AssetGenerationPipelineService.getInstance();