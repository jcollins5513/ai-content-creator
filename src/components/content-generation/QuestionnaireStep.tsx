'use client';

import React, { useState, useEffect } from 'react';
import { ContentTemplate, TemplateAnswers, TemplateQuestion } from '@/types/templates';

interface QuestionnaireStepProps {
  template: ContentTemplate | null;
  answers: TemplateAnswers;
  onAnswersComplete: (answers: TemplateAnswers) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const QuestionnaireStep: React.FC<QuestionnaireStepProps> = ({
  template,
  answers,
  onAnswersComplete,
}) => {
  const [currentAnswers, setCurrentAnswers] = useState<TemplateAnswers>(answers);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentAnswers(answers);
  }, [answers]);

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No template selected</p>
      </div>
    );
  }

  const handleInputChange = (questionId: string, value: string | string[]) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const validateAnswers = (): boolean => {
    const newErrors: Record<string, string> = {};

    template.questions.forEach(question => {
      if (question.required) {
        const answer = currentAnswers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || 
            (typeof answer === 'string' && answer.trim() === '')) {
          newErrors[question.id] = 'This field is required';
        }
      }

      // Validate text length
      if (question.maxLength && typeof currentAnswers[question.id] === 'string') {
        const text = currentAnswers[question.id] as string;
        if (text.length > question.maxLength) {
          newErrors[question.id] = `Maximum ${question.maxLength} characters allowed`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateAnswers()) {
      onAnswersComplete(currentAnswers);
    }
  };

  const renderQuestion = (question: TemplateQuestion) => {
    const value = currentAnswers[question.id] || '';
    const hasError = errors[question.id];

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            maxLength={question.maxLength}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
              ${hasError ? 'border-red-500' : 'border-gray-300'}
            `}
          />
        );

      case 'textarea':
        return (
          <div>
            <textarea
              value={value as string}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              placeholder={question.placeholder}
              maxLength={question.maxLength}
              rows={3}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                ${hasError ? 'border-red-500' : 'border-gray-300'}
              `}
            />
            {question.maxLength && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                {(value as string).length}/{question.maxLength}
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
              ${hasError ? 'border-red-500' : 'border-gray-300'}
            `}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedOptions = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => {
                    const newSelection = e.target.checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter(item => item !== option);
                    handleInputChange(question.id, newSelection);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tell us about your {template.industry} business
        </h3>
        <p className="text-gray-600">
          Answer these questions to help us create personalized content for you.
        </p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        {template.questions.map((question, index) => (
          <div key={question.id} className="space-y-2">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {index + 1}. {question.question}
                </span>
                {question.required && (
                  <span className="text-red-500 text-sm">*</span>
                )}
              </div>
              
              {renderQuestion(question)}
              
              {errors[question.id] && (
                <p className="text-red-500 text-sm mt-1">{errors[question.id]}</p>
              )}
            </label>
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-4">
          {Object.keys(currentAnswers).length} of {template.questions.filter(q => q.required).length} required questions answered
        </div>
        
        <button
          type="button"
          onClick={handleContinue}
          disabled={Object.keys(currentAnswers).length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continue to Style Selection
        </button>
      </div>
    </div>
  );
};

export default QuestionnaireStep;