'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth';
import BackgroundGenerator from '@/components/content-generation/BackgroundGenerator';
import AssetCompositing from '@/components/content-generation/AssetCompositing';
import Link from 'next/link';

interface GeneratedBackground {
  id: string;
  url: string;
  prompt: string;
  config: any;
  createdAt: Date;
}

interface CompositingResult {
  compositeImageUrl: string;
  prompt: string;
  layout: any;
  assets: any;
}

export default function BackgroundGeneratorPage() {
  const [currentStep, setCurrentStep] = useState<'generate' | 'composite' | 'complete'>('generate');
  const [generatedBackground, setGeneratedBackground] = useState<GeneratedBackground | null>(null);
  const [finalResult, setFinalResult] = useState<CompositingResult | null>(null);

  const handleBackgroundGenerated = (background: GeneratedBackground) => {
    setGeneratedBackground(background);
    setCurrentStep('composite');
  };

  const handleCompositingComplete = (result: CompositingResult) => {
    setFinalResult(result);
    setCurrentStep('complete');
  };

  const handleStartOver = () => {
    setCurrentStep('generate');
    setGeneratedBackground(null);
    setFinalResult(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                  AI Content Creator
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">Background Generator</span>
              </div>
              <Link 
                href="/dashboard"
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Progress Indicator */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center space-x-8">
              <div className={`flex items-center space-x-2 ${currentStep === 'generate' ? 'text-blue-600' : currentStep === 'composite' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'generate' ? 'bg-blue-100 text-blue-600' : currentStep === 'composite' || currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  1
                </div>
                <span className="font-medium">Generate Background</span>
              </div>
              
              <div className={`w-16 h-0.5 ${currentStep === 'composite' || currentStep === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`} />
              
              <div className={`flex items-center space-x-2 ${currentStep === 'composite' ? 'text-blue-600' : currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'composite' ? 'bg-blue-100 text-blue-600' : currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  2
                </div>
                <span className="font-medium">Add Your Assets</span>
              </div>
              
              <div className={`w-16 h-0.5 ${currentStep === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`} />
              
              <div className={`flex items-center space-x-2 ${currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  3
                </div>
                <span className="font-medium">Final Result</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentStep === 'generate' && (
            <BackgroundGenerator
              onBackgroundGenerated={handleBackgroundGenerated}
              onCancel={() => window.history.back()}
            />
          )}

          {currentStep === 'composite' && generatedBackground && (
            <AssetCompositing
              backgroundAsset={{
                id: generatedBackground.id,
                type: 'background',
                url: generatedBackground.url,
                prompt: generatedBackground.prompt,
                style: generatedBackground.config.style,
                createdAt: generatedBackground.createdAt,
                sequenceIndex: 0,
                generationAttempt: 1,
                metadata: {
                  width: 1024,
                  height: 1024,
                  format: 'png',
                  generationTime: 0
                }
              }}
              industry={generatedBackground.config.businessUseCase}
              businessName="Your Business"
              onCompositingComplete={handleCompositingComplete}
              onBack={() => setCurrentStep('generate')}
            />
          )}

          {currentStep === 'complete' && finalResult && (
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Marketing Image is Ready!
                </h2>
                <p className="text-gray-600">
                  Professional quality image ready for your marketing materials
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <img
                  src={finalResult.compositeImageUrl}
                  alt="Final marketing image"
                  className="w-full rounded-lg"
                />
              </div>

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handleStartOver}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Another
                </button>
                <a
                  href={finalResult.compositeImageUrl}
                  download="marketing-image.png"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Download Image
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}