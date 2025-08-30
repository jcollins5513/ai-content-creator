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
  component: React.ComponentType<any>;
}

export interface AssetGenerationRequest {
  type: 'background' | 'logo' | 'text-overlay' | 'decorative';
  prompt: string;
  style: string;
  colorPalette: string[];
  industry: string;
}

export interface GeneratedAsset {
  id: string;
  type: AssetGenerationRequest['type'];
  url: string;
  prompt: string;
  style: string;
  createdAt: Date;
  metadata: {
    width: number;
    height: number;
    format: string;
  };
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