'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth';
import { TemplateWizard } from '@/components/content-generation';
import { TemplateAnswers, GeneratedAsset } from '@/types/templates';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';

export default function TemplateGeneratorPage() {
  const [showWizard, setShowWizard] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const handleTemplateComplete = (templateId: string, answers: TemplateAnswers, assets: GeneratedAsset[]) => {
    console.log('Template completed:', { templateId, answers, assets });
    
    showToast({
      type: 'success',
      title: 'Template Created Successfully!',
      message: `Your ${templateId} template has been created with ${assets.length} assets.`,
    });

    // TODO: Save template to user's library
    // TODO: Navigate to canvas editor with template assets
    
    setShowWizard(false);
  };

  const handleCancel = () => {
    setShowWizard(false);
  };

  if (showWizard) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <TemplateWizard
              onComplete={handleTemplateComplete}
              onCancel={handleCancel}
            />
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                AI Template Generator
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Create professional marketing templates with AI-powered design
              </p>
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
              >
                Start Creating Template
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Our AI-powered wizard guides you through creating custom templates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choose Template
              </h3>
              <p className="text-gray-600">
                Select from industry-specific templates or create your own
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Answer Questions
              </h3>
              <p className="text-gray-600">
                Tell us about your business and content needs
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choose Style
              </h3>
              <p className="text-gray-600">
                Select visual style and color palette that matches your brand
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Generation
              </h3>
              <p className="text-gray-600">
                AI creates custom backgrounds, logos, and design elements
              </p>
            </div>
          </div>
        </div>

        {/* Industry Templates Section */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Industry Templates
              </h2>
              <p className="text-lg text-gray-600">
                Pre-built templates optimized for different industries
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">🚗</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Automotive
                </h3>
                <p className="text-gray-600 mb-4">
                  Perfect for car dealerships, auto services, and vehicle promotions
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Vehicle showcase layouts</li>
                  <li>• Financing offer templates</li>
                  <li>• Service promotion designs</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Retail
                </h3>
                <p className="text-gray-600 mb-4">
                  Ideal for retail stores, boutiques, and e-commerce businesses
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Product showcase designs</li>
                  <li>• Sale and promotion layouts</li>
                  <li>• Brand story templates</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Restaurant
                </h3>
                <p className="text-gray-600 mb-4">
                  Great for restaurants, cafes, food trucks, and catering services
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Menu highlight designs</li>
                  <li>• Event promotion layouts</li>
                  <li>• Atmosphere showcase templates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Create Your Template?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Get started with AI-powered template generation in minutes
            </p>
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Launch Template Wizard
            </button>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ProtectedRoute>
  );
}