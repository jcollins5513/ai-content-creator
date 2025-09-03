export interface TemplateQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'textarea' | 'multiselect';
  options?: string[];
  required: boolean;
  placeholder?: string;
  maxLength?: number;
}

export interface ContentTemplate {
  id: string;
  name: string;
  type: 'built-in' | 'custom';
  industry: string;
  description: string;
  questions: TemplateQuestion[];
  promptTemplate: string;
  isActive: boolean;
  createdAt: Date;
  userId?: string; // null for built-in templates
}

export interface TemplateAnswers {
  [questionId: string]: string | string[];
}

export interface GenerationWizardStep {
  id: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

export interface AssetGenerationRequest {
  type: 'background' | 'logo' | 'text-overlay' | 'decorative';
  prompt: string;
  style: string;
  colorPalette: string[];
  industry: string;
  sequenceIndex?: number;
  previousAssets?: GeneratedAsset[];
}

export interface GeneratedAsset {
  id: string;
  type: AssetGenerationRequest['type'];
  url: string;
  prompt: string;
  style: string;
  createdAt: Date;
  sequenceIndex: number;
  generationAttempt: number;
  metadata: {
    width: number;
    height: number;
    format: string;
    generationTime: number;
  };
}

export interface AssetGenerationProgress {
  currentStep: number;
  totalSteps: number;
  currentAssetType: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  completedAssets: GeneratedAsset[];
  failedAssets: string[];
  estimatedTimeRemaining?: number;
}

export interface AssetGenerationPipeline {
  sessionId: string;
  steps: AssetGenerationStep[];
  progress: AssetGenerationProgress;
  coordinationRules: StyleCoordinationRules;
}

export interface AssetGenerationStep {
  id: string;
  type: AssetGenerationRequest['type'];
  name: string;
  description: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'skipped';
  prompt: string;
  customPrompt?: string;
  asset?: GeneratedAsset;
  attempts: number;
  maxAttempts: number;
  dependencies: string[];
  estimatedDuration: number;
  sequenceIndex: number;
}

export interface StyleCoordinationRules {
  colorConsistency: boolean;
  styleConsistency: boolean;
  industryAlignment: boolean;
  visualHarmony: boolean;
  sequentialDependencies: Record<string, string[]>;
}

export interface TemplateGenerationSession {
  id: string;
  templateId: string;
  answers: TemplateAnswers;
  selectedStyle: string;
  colorPalette: string[];
  generatedAssets: GeneratedAsset[];
  status: 'in-progress' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}