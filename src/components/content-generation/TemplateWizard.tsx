'use client';

import React, { useState, useCallback } from 'react';
import { ContentTemplate, TemplateAnswers, GenerationWizardStep, GeneratedAsset } from '@/types/templates';
import { useToast } from '@/hooks/useToast';
import TemplateSelection from './TemplateSelection';
import QuestionnaireStep from './QuestionnaireStep';
import StyleSelection from './StyleSelection';
import AssetGeneration from './AssetGeneration';
import TemplatePreview from './TemplatePreview';

interface TemplateWizardProps {
  onComplete: (templateId: string, answers: TemplateAnswers, assets: GeneratedAsset[]) => void;
  onCancel: () => void;
  className?: string;
}

export const TemplateWizard: React.FC<TemplateWizardProps> = ({
  onComplete,
  onCancel,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [answers, setAnswers] = useState<TemplateAnswers>({});
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const steps: GenerationWizardStep[] = [
    {
      id: 'template-selection',
      title: 'Choose Template',
      description: 'Select an industry template or create a custom one',
      component: TemplateSelection,
    },
    {
      id: 'questionnaire',
      title: 'Business Details',
      description: 'Tell us about your business and content needs',
      component: QuestionnaireStep,
    },
    {
      id: 'style-selection',
      title: 'Visual Style',
      description: 'Choose the visual style and color palette',
      component: StyleSelection,
    },
    {
      id: 'asset-generation',
      title: 'Generate Assets',
      description: 'AI will create your template assets',
      component: AssetGeneration,
    },
    {
      id: 'preview',
      title: 'Preview & Finalize',
      description: 'Review your generated template',
      component: TemplatePreview,
    },
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleTemplateSelect = useCallback((template: ContentTemplate) => {
    setSelectedTemplate(template);
    setAnswers({});
    handleNext();
  }, [handleNext]);

  const handleAnswersComplete = useCallback((newAnswers: TemplateAnswers) => {
    setAnswers(newAnswers);
    handleNext();
  }, [handleNext]);

  const handleStyleSelect = useCallback((style: string, palette: string[]) => {
    setSelectedStyle(style);
    setColorPalette(palette);
    handleNext();
  }, [handleNext]);

  const handleAssetsGenerated = useCallback((assets: GeneratedAsset[]) => {
    setGeneratedAssets(assets);
    handleNext();
  }, [handleNext]);

  const handleComplete = useCallback(() => {
    if (selectedTemplate) {
      onComplete(selectedTemplate.id, answers, generatedAssets);
    }
  }, [selectedTemplate, answers, generatedAssets, onComplete]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return selectedTemplate !== null;
      case 1:
        return selectedTemplate && Object.keys(answers).length > 0;
      case 2:
        return selectedStyle !== '' && colorPalette.length > 0;
      case 3:
        return generatedAssets.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedTemplate, answers, selectedStyle, colorPalette, generatedAssets]);

  const getCurrentStepComponent = () => {
    const StepComponent = steps[currentStep].component;
    const commonProps = {
      onNext: handleNext,
      onPrevious: handlePrevious,
    };

    switch (currentStep) {
      case 0:
        return (
          <StepComponent
            {...commonProps}
            onTemplateSelect={handleTemplateSelect}
          />
        );
      case 1:
        return (
          <StepComponent
            {...commonProps}
            template={selectedTemplate}
            answers={answers}
            onAnswersComplete={handleAnswersComplete}
          />
        );
      case 2:
        return (
          <StepComponent
            {...commonProps}
            template={selectedTemplate}
            answers={answers}
            onStyleSelect={handleStyleSelect}
          />
        );
      case 3:
        return (
          <StepComponent
            {...commonProps}
            template={selectedTemplate}
            answers={answers}
            style={selectedStyle}
            colorPalette={colorPalette}
            isGenerating={isGenerating}
            onAssetsGenerated={handleAssetsGenerated}
          />
        );
      case 4:
        return (
          <StepComponent
            {...commonProps}
            template={selectedTemplate}
            answers={answers}
            style={selectedStyle}
            colorPalette={colorPalette}
            generatedAssets={generatedAssets}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Template Generator</h1>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Info */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600">
            {steps[currentStep].description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6 min-h-[500px]">
        {getCurrentStepComponent()}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {currentStep === steps.length - 1 ? (
          <button
            type="button"
            onClick={handleComplete}
            disabled={!canProceed()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Complete Template
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplateWizard;