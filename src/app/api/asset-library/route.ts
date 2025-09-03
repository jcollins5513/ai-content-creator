import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - in production, this would connect to your database
const mockAssets = [
  {
    id: 'bg-1',
    type: 'background',
    url: 'https://via.placeholder.com/1024x1024/3B82F6/FFFFFF?text=Automotive+Showroom',
    thumbnail: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=Automotive+Showroom',
    name: 'Automotive Showroom Background',
    prompt: 'Business Use Case: Automotive Dealership\nEnvironment: Interior - modern car showroom interior, polished tile floors, glass windows\nStyle: photorealistic\nLighting: soft key light from camera-left, practical warm lights in background\nCamera: 35mm, f/2.8, ISO 200, 1/125s\nConstraints: nothing in foreground, no text, no logos, empty space for product placement\nQuality: high detail, professional photography',
    tags: ['automotive', 'showroom', 'professional', 'interior'],
    businessUseCase: 'Automotive Dealership',
    style: 'photorealistic',
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-15'),
    usageCount: 45,
    metadata: { width: 1024, height: 1024, format: 'png' }
  },
  {
    id: 'bg-2',
    type: 'background',
    url: 'https://via.placeholder.com/1024x1024/10B981/FFFFFF?text=Restaurant+Interior',
    thumbnail: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Restaurant+Interior',
    name: 'Modern Restaurant Interior',
    prompt: 'Business Use Case: Restaurant/Food Service\nEnvironment: Interior - modern restaurant dining area, clean tables, ambient lighting\nStyle: photorealistic\nLighting: warm ambient lighting, soft overhead lights, cozy atmosphere\nCamera: 35mm, f/2.8, ISO 200, 1/125s\nConstraints: nothing in foreground, no text, no logos, empty space for product placement\nQuality: high detail, professional photography',
    tags: ['restaurant', 'dining', 'interior', 'modern'],
    businessUseCase: 'Restaurant/Food Service',
    style: 'photorealistic',
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-14'),
    usageCount: 32,
    metadata: { width: 1024, height: 1024, format: 'png' }
  },
  {
    id: 'logo-1',
    type: 'logo',
    url: 'https://via.placeholder.com/512x512/8B5CF6/FFFFFF?text=Modern+Logo',
    thumbnail: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Modern+Logo',
    name: 'Modern Business Logo',
    prompt: 'Asset Type: logo - professional business logo\nPurpose: Corporate branding for technology company\nIndustry: technology\nStyle: modern - clean lines, contemporary aesthetics, minimal details\nColors: #8B5CF6, #7C3AED\nSize: 512x512px, standard marketing size\nFormat: vector-style, clean edges, transparent background\nConstraints: scalable, memorable, works in black and white, no text unless specified\nQuality: high detail, professional marketing quality, commercial use ready',
    tags: ['logo', 'modern', 'technology', 'purple'],
    businessUseCase: 'Technology',
    style: 'modern',
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-13'),
    usageCount: 28,
    metadata: { width: 512, height: 512, format: 'png' }
  },
  {
    id: 'button-1',
    type: 'marketing-element',
    url: 'https://via.placeholder.com/400x100/EF4444/FFFFFF?text=Call+Now+Button',
    thumbnail: 'https://via.placeholder.com/300x300/EF4444/FFFFFF?text=Call+Now+Button',
    name: 'Call Now Button',
    prompt: 'Asset Type: button - call-to-action button design\nPurpose: Call now button for automotive dealership\nIndustry: automotive\nStyle: bold - strong visual impact, high contrast, commanding presence\nColors: #EF4444, #DC2626\nSize: 400x100px, standard marketing size\nFormat: rounded corners, subtle shadow, web-ready\nConstraints: clickable appearance, clear hierarchy, no text unless specified\nQuality: high detail, professional marketing quality, commercial use ready',
    tags: ['button', 'cta', 'automotive', 'red'],
    businessUseCase: 'Automotive',
    style: 'bold',
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-12'),
    usageCount: 19,
    metadata: { width: 400, height: 100, format: 'png' }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const viewMode = searchParams.get('viewMode') || 'my-assets';
    const type = searchParams.get('type') || 'all';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Filter assets based on view mode and type
    let filteredAssets = mockAssets;

    if (viewMode === 'my-assets') {
      // In production, filter by userId
      filteredAssets = mockAssets.filter(asset => asset.createdBy === userId || asset.createdBy === 'system');
    } else {
      // Public library - only public assets
      filteredAssets = mockAssets.filter(asset => asset.isPublic);
    }

    if (type !== 'all') {
      filteredAssets = filteredAssets.filter(asset => asset.type === type);
    }

    return NextResponse.json({
      success: true,
      assets: filteredAssets,
      total: filteredAssets.length
    });

  } catch (error) {
    console.error('Asset Library API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load assets' },
      { status: 500 }
    );
  }
}