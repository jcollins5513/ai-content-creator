import { GeneratedAsset } from '@/types/templates';

export interface UserAsset {
  id: string;
  type: 'photo' | 'logo' | 'text';
  url: string;
  name: string;
  hasTransparentBackground: boolean;
  metadata: {
    width: number;
    height: number;
    format: string;
  };
}

export interface CompositingRequest {
  backgroundAsset: GeneratedAsset;
  userAssets: UserAsset[];
  layout: CompositingLayout;
  businessInfo: {
    name: string;
    industry: string;
    tagline?: string;
    phone?: string;
    website?: string;
  };
}

export interface CompositingLayout {
  type: 'automotive-showcase' | 'real-estate-listing' | 'restaurant-promo' | 'retail-product' | 'business-card';
  mainAssetPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };
  logoPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  textAreas: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontWeight: string;
    color: string;
    alignment: 'left' | 'center' | 'right';
    content?: string;
  }>;
}

export interface CompositingResult {
  compositeImageUrl: string;
  prompt: string;
  layout: CompositingLayout;
  assets: {
    background: GeneratedAsset;
    userAssets: UserAsset[];
  };
}

export class AssetCompositingService {
  private static instance: AssetCompositingService;

  static getInstance(): AssetCompositingService {
    if (!AssetCompositingService.instance) {
      AssetCompositingService.instance = new AssetCompositingService();
    }
    return AssetCompositingService.instance;
  }

  /**
   * Generate AI compositing prompt for combining background with user assets
   */
  generateCompositingPrompt(request: CompositingRequest): string {
    const { backgroundAsset, userAssets, businessInfo, layout } = request;
    
    const mainAsset = userAssets.find(asset => asset.type === 'photo');
    const logoAsset = userAssets.find(asset => asset.type === 'logo');
    
    const industryInstructions = {
      'automotive': 'Place the vehicle prominently in the showroom, ensuring realistic lighting and reflections on the car surface. The vehicle should look naturally positioned in the space.',
      'real-estate': 'Integrate the home image seamlessly into the interior space, maintaining consistent lighting and perspective. The property should feel naturally part of the scene.',
      'restaurant': 'Position food items or restaurant elements naturally within the dining space, with appropriate lighting and atmosphere.',
      'retail': 'Place products naturally in the retail environment, with proper lighting and realistic positioning.',
      'business': 'Integrate business elements professionally within the office environment.'
    };

    const instruction = industryInstructions[businessInfo.industry as keyof typeof industryInstructions] || industryInstructions.business;

    let prompt = `Professional photo compositing task:

Background: Use the provided showroom/interior background image
Main Subject: ${mainAsset ? `Add the provided ${businessInfo.industry} image (${mainAsset.name})` : 'No main subject'}
Logo: ${logoAsset ? `Include the business logo (${logoAsset.name}) in the designated position` : 'No logo provided'}
Business: ${businessInfo.name}

Instructions:
${instruction}

Technical Requirements:
- Maintain realistic lighting consistency between all elements
- Ensure proper shadows and reflections
- Match color temperature across all elements
- Professional photography quality
- Clean, marketing-ready composition
- ${layout.type} layout style

Text Elements to Add:
- Business Name: "${businessInfo.name}"
${businessInfo.tagline ? `- Tagline: "${businessInfo.tagline}"` : ''}
${businessInfo.phone ? `- Phone: "${businessInfo.phone}"` : ''}
${businessInfo.website ? `- Website: "${businessInfo.website}"` : ''}

Style: Professional marketing material, photo-realistic, high-end commercial photography look`;

    return prompt;
  }

  /**
   * Get predefined layouts for different industries
   */
  getLayoutTemplates(industry: string): CompositingLayout[] {
    const layouts: Record<string, CompositingLayout[]> = {
      'automotive': [
        {
          type: 'automotive-showcase',
          mainAssetPosition: { x: 0.6, y: 0.3, width: 0.35, height: 0.4 },
          logoPosition: { x: 0.05, y: 0.05, width: 0.25, height: 0.15 },
          textAreas: [
            {
              id: 'title',
              x: 0.05,
              y: 0.25,
              width: 0.4,
              height: 0.1,
              fontSize: 32,
              fontWeight: 'bold',
              color: '#000000',
              alignment: 'left'
            },
            {
              id: 'price',
              x: 0.05,
              y: 0.4,
              width: 0.3,
              height: 0.08,
              fontSize: 24,
              fontWeight: 'normal',
              color: '#333333',
              alignment: 'left'
            },
            {
              id: 'contact',
              x: 0.05,
              y: 0.85,
              width: 0.4,
              height: 0.06,
              fontSize: 16,
              fontWeight: 'normal',
              color: '#666666',
              alignment: 'left'
            }
          ]
        }
      ],
      'real-estate': [
        {
          type: 'real-estate-listing',
          mainAssetPosition: { x: 0.5, y: 0.1, width: 0.45, height: 0.5 },
          logoPosition: { x: 0.05, y: 0.05, width: 0.2, height: 0.1 },
          textAreas: [
            {
              id: 'title',
              x: 0.05,
              y: 0.2,
              width: 0.4,
              height: 0.12,
              fontSize: 28,
              fontWeight: 'bold',
              color: '#2c3e50',
              alignment: 'left'
            },
            {
              id: 'price',
              x: 0.05,
              y: 0.35,
              width: 0.35,
              height: 0.1,
              fontSize: 32,
              fontWeight: 'bold',
              color: '#e74c3c',
              alignment: 'left'
            },
            {
              id: 'features',
              x: 0.05,
              y: 0.5,
              width: 0.4,
              height: 0.25,
              fontSize: 14,
              fontWeight: 'normal',
              color: '#34495e',
              alignment: 'left'
            },
            {
              id: 'contact',
              x: 0.05,
              y: 0.8,
              width: 0.4,
              height: 0.08,
              fontSize: 16,
              fontWeight: 'normal',
              color: '#7f8c8d',
              alignment: 'left'
            }
          ]
        }
      ]
    };

    return layouts[industry] || layouts['automotive'];
  }

  /**
   * Validate user assets for compositing
   */
  validateUserAssets(assets: UserAsset[]): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for main photo asset
    const photoAssets = assets.filter(asset => asset.type === 'photo');
    if (photoAssets.length === 0) {
      issues.push('No main photo provided');
      suggestions.push('Upload a photo of your product, vehicle, or property');
    }

    // Check for logo
    const logoAssets = assets.filter(asset => asset.type === 'logo');
    if (logoAssets.length === 0) {
      suggestions.push('Consider adding your business logo for branding');
    }

    // Check image quality
    assets.forEach(asset => {
      if (asset.metadata.width < 500 || asset.metadata.height < 500) {
        issues.push(`${asset.name} resolution is too low (${asset.metadata.width}x${asset.metadata.height})`);
        suggestions.push('Use higher resolution images (at least 1000x1000 pixels)');
      }

      if (!asset.hasTransparentBackground && asset.type === 'logo') {
        suggestions.push(`Consider removing background from ${asset.name} for better integration`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Generate compositing request for AI
   */
  async requestCompositing(request: CompositingRequest): Promise<CompositingResult> {
    const prompt = this.generateCompositingPrompt(request);
    
    try {
      const response = await fetch('/api/composite-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          backgroundUrl: request.backgroundAsset.url,
          userAssets: request.userAssets.map(asset => ({
            url: asset.url,
            type: asset.type,
            position: request.layout.mainAssetPosition
          })),
          layout: request.layout,
          businessInfo: request.businessInfo
        }),
      });

      if (!response.ok) {
        throw new Error('Compositing request failed');
      }

      const data = await response.json();
      
      return {
        compositeImageUrl: data.imageUrl,
        prompt,
        layout: request.layout,
        assets: {
          background: request.backgroundAsset,
          userAssets: request.userAssets
        }
      };

    } catch (error) {
      console.error('Compositing error:', error);
      throw new Error('Failed to composite assets');
    }
  }
}

export const assetCompositingService = AssetCompositingService.getInstance();