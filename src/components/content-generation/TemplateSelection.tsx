'use client';

import React, { useState, useEffect } from 'react';
import { ContentTemplate } from '@/types/templates';
import { useToast } from '@/hooks/useToast';

interface TemplateSelectionProps {
  onTemplateSelect: (template: ContentTemplate) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Built-in templates
const BUILT_IN_TEMPLATES: Omit<ContentTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Automotive Dealership',
    type: 'built-in',
    industry: 'automotive',
    description: 'Perfect for car dealerships, auto services, and vehicle promotions',
    questions: [
      {
        id: 'business_name',
        question: 'What is your dealership or business name?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Smith Auto Group'
      },
      {
        id: 'vehicle_type',
        question: 'What type of vehicles do you specialize in?',
        type: 'select',
        options: ['New Cars', 'Used Cars', 'Luxury Vehicles', 'Trucks & SUVs', 'Electric Vehicles', 'All Types'],
        required: true
      },
      {
        id: 'key_features',
        question: 'What are your key selling points?',
        type: 'multiselect',
        options: ['Best Prices', 'Quality Guarantee', 'Financing Available', 'Trade-ins Welcome', 'Expert Service', 'Wide Selection'],
        required: true
      },
      {
        id: 'target_audience',
        question: 'Who is your target customer?',
        type: 'select',
        options: ['First-time Buyers', 'Families', 'Luxury Buyers', 'Business Owners', 'Young Professionals', 'All Customers'],
        required: true
      },
      {
        id: 'special_offer',
        question: 'Do you have any current promotions or special offers?',
        type: 'textarea',
        required: false,
        placeholder: 'e.g., 0% APR financing, $2000 cash back, free maintenance'
      }
    ],
    promptTemplate: 'Create marketing content for {business_name}, specializing in {vehicle_type}. Target audience: {target_audience}. Key features: {key_features}. Special offers: {special_offer}',
    isActive: true,
    userId: undefined
  },
  {
    name: 'Retail Store',
    type: 'built-in',
    industry: 'retail',
    description: 'Ideal for retail stores, boutiques, and e-commerce businesses',
    questions: [
      {
        id: 'store_name',
        question: 'What is your store name?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Fashion Forward Boutique'
      },
      {
        id: 'product_category',
        question: 'What type of products do you sell?',
        type: 'select',
        options: ['Clothing & Fashion', 'Electronics', 'Home & Garden', 'Beauty & Health', 'Sports & Outdoors', 'Books & Media', 'Other'],
        required: true
      },
      {
        id: 'store_style',
        question: 'How would you describe your store\'s style?',
        type: 'select',
        options: ['Modern & Trendy', 'Classic & Elegant', 'Casual & Friendly', 'Luxury & Premium', 'Eco-Friendly', 'Family-Oriented'],
        required: true
      },
      {
        id: 'unique_selling_points',
        question: 'What makes your store special?',
        type: 'multiselect',
        options: ['Competitive Prices', 'Unique Products', 'Excellent Service', 'Local Business', 'Sustainable Products', 'Expert Advice'],
        required: true
      },
      {
        id: 'current_promotion',
        question: 'Any current sales or promotions?',
        type: 'textarea',
        required: false,
        placeholder: 'e.g., 30% off all items, Buy 2 Get 1 Free, Free shipping'
      }
    ],
    promptTemplate: 'Create marketing content for {store_name}, a {store_style} {product_category} store. Unique selling points: {unique_selling_points}. Current promotion: {current_promotion}',
    isActive: true,
    userId: undefined
  },
  {
    name: 'Restaurant & Food Service',
    type: 'built-in',
    industry: 'restaurant',
    description: 'Great for restaurants, cafes, food trucks, and catering services',
    questions: [
      {
        id: 'restaurant_name',
        question: 'What is your restaurant name?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Bella Vista Italian Kitchen'
      },
      {
        id: 'cuisine_type',
        question: 'What type of cuisine do you serve?',
        type: 'select',
        options: ['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian', 'French', 'Fusion', 'Fast Food', 'Other'],
        required: true
      },
      {
        id: 'dining_style',
        question: 'What is your dining style?',
        type: 'select',
        options: ['Fine Dining', 'Casual Dining', 'Fast Casual', 'Food Truck', 'Cafe/Bistro', 'Takeout/Delivery', 'Catering'],
        required: true
      },
      {
        id: 'specialties',
        question: 'What are your signature dishes or specialties?',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., Wood-fired pizza, Fresh pasta, Craft cocktails'
      },
      {
        id: 'atmosphere',
        question: 'How would you describe your restaurant\'s atmosphere?',
        type: 'multiselect',
        options: ['Family-Friendly', 'Romantic', 'Casual', 'Upscale', 'Cozy', 'Modern', 'Traditional', 'Lively'],
        required: true
      },
      {
        id: 'special_events',
        question: 'Any special events, hours, or offers?',
        type: 'textarea',
        required: false,
        placeholder: 'e.g., Happy hour 4-6pm, Live music Fridays, Catering available'
      }
    ],
    promptTemplate: 'Create marketing content for {restaurant_name}, a {dining_style} {cuisine_type} restaurant. Atmosphere: {atmosphere}. Specialties: {specialties}. Special events: {special_events}',
    isActive: true,
    userId: undefined
  }
];

export const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  onTemplateSelect,
}) => {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Convert built-in templates to full ContentTemplate objects
      const builtInTemplates: ContentTemplate[] = BUILT_IN_TEMPLATES.map((template, index) => ({
        ...template,
        id: `built-in-${template.industry}-${index}`,
        createdAt: new Date(),
      }));

      // TODO: Load custom templates from Firestore
      // const customTemplates = await getCustomTemplates();
      
      setTemplates(builtInTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      showToast({
        type: 'error',
        title: 'Failed to load templates',
        message: 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: ContentTemplate) => {
    setSelectedTemplate(template);
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate);
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'automotive':
        return '🚗';
      case 'retail':
        return '🛍️';
      case 'restaurant':
        return '🍽️';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Choose Your Industry Template
        </h3>
        <p className="text-gray-600">
          Select a template that best matches your business type. We&apos;ll customize it based on your specific needs.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className={`
              relative p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
              ${selectedTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            {/* Selection Indicator */}
            {selectedTemplate?.id === template.id && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}

            {/* Template Content */}
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">{getIndustryIcon(template.industry)}</div>
              <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>

            {/* Template Stats */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Questions:</span>
                <span>{template.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Industry:</span>
                <span className="capitalize">{template.industry}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Template Option */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="text-2xl mb-2">➕</div>
        <h4 className="font-medium text-gray-900 mb-1">Create Custom Template</h4>
        <p className="text-sm text-gray-600 mb-3">
          Build your own template with custom questions
        </p>
        <button
          type="button"
          className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          onClick={() => {
            showToast({
              type: 'info',
              title: 'Coming Soon',
              message: 'Custom template creation will be available in a future update.',
            });
          }}
        >
          Create Custom
        </button>
      </div>

      {/* Continue Button */}
      {selectedTemplate && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleContinue}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue with {selectedTemplate.name}
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateSelection;