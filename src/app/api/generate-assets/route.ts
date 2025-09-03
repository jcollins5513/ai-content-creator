import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { 
      prompt, 
      style, 
      colorPalette, 
      assetType, 
      sequenceIndex = 0,
      previousAssets = []
    } = await request.json();

    if (!prompt || !style || !colorPalette || !assetType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Build coordination context from previous assets
    let coordinationContext = '';
    if (previousAssets.length > 0) {
      const completedTypes = previousAssets.map((asset: { type: string }) => asset.type);
      coordinationContext = ` This asset should harmonize with the existing ${completedTypes.join(', ')} elements while maintaining the ${style} aesthetic.`;
    }

    // Asset-specific generation parameters for practical, usable designs
    const assetConfig = {
      'background': {
        size: "1024x1024" as const,
        quality: "standard" as const,
        style: "natural" as const,
        additionalPrompt: "Simple, clean background. Subtle and professional. Should work well behind text and other content. No busy patterns or distracting elements."
      },
      'logo': {
        size: "1024x1024" as const,
        quality: "hd" as const,
        style: "natural" as const,
        additionalPrompt: "Simple, professional logo. Clean and readable. Should work at small sizes. Think corporate logo simplicity like FedEx or IBM."
      },
      'text-overlay': {
        size: "1024x1024" as const,
        quality: "standard" as const,
        style: "natural" as const,
        additionalPrompt: "Simple buttons and text frames. Clean rectangular shapes. Think website buttons and form elements. No decorative flourishes."
      },
      'decorative': {
        size: "1024x1024" as const,
        quality: "standard" as const,
        style: "natural" as const,
        additionalPrompt: "Minimal accent elements: simple lines, dots, basic shapes. Think website dividers and bullet points. Very subtle and clean."
      }
    };

    const config = assetConfig[assetType as keyof typeof assetConfig] || assetConfig.background;

    // Enhance the prompt for practical, usable marketing assets
    const enhancedPrompt = `${prompt}${coordinationContext} ${config.additionalPrompt} Colors: ${colorPalette.join(', ')}. Professional quality, clean, simple, usable for real marketing materials. No complex illustrations or artistic flourishes. Think corporate design standards. Sequence: ${sequenceIndex + 1}/4.`;

    // Add retry logic for better reliability
    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: config.size,
          quality: config.quality,
          style: config.style
        });

        const imageUrl = response.data?.[0]?.url;
        
        if (!imageUrl) {
          throw new Error('No image generated');
        }

        // Extract dimensions from size parameter
        const [width, height] = config.size.split('x').map(Number);

        return NextResponse.json({
          success: true,
          imageUrl,
          prompt: enhancedPrompt,
          assetType,
          sequenceIndex,
          metadata: {
            width,
            height,
            format: 'png',
            generationTime: Date.now(),
            attempt: attempt + 1,
            quality: config.quality,
            style: config.style
          }
        });

      } catch (error) {
        lastError = error as Error;
        console.error(`Generation attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on certain errors
        const errorObj = error as { status?: number; message?: string };
        if (errorObj.status === 400 || errorObj.status === 429) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // If we get here, all attempts failed
    throw lastError || new Error('All generation attempts failed');

  } catch (error: unknown) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI errors
    const errorObj = error as { status?: number; message?: string };
    
    if (errorObj.status === 400) {
      return NextResponse.json(
        { error: 'Invalid request to OpenAI API', details: errorObj.message },
        { status: 400 }
      );
    }
    
    if (errorObj.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (errorObj.message?.includes('content_policy_violation')) {
      return NextResponse.json(
        { error: 'Content policy violation. Please try a different prompt.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image', details: errorObj.message },
      { status: 500 }
    );
  }
}