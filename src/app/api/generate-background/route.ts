import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, config } = await request.json();

    if (!prompt || !config) {
      return NextResponse.json(
        { error: 'Missing required parameters: prompt and config' },
        { status: 400 }
      );
    }

    // Enhanced prompt for better background generation
    const enhancedPrompt = `${prompt}

Professional background generation requirements:
- Empty foreground space for product/subject placement
- Professional lighting and composition
- High commercial quality
- Suitable for marketing materials
- Clean, uncluttered composition
- Proper depth of field for subject placement`;

    // Style-specific generation parameters
    const generationConfig = {
      photorealistic: {
        model: "dall-e-3" as const,
        quality: "hd" as const,
        style: "natural" as const,
        size: "1024x1024" as const
      },
      cartoon: {
        model: "dall-e-3" as const,
        quality: "standard" as const,
        style: "vivid" as const,
        size: "1024x1024" as const
      },
      minimalist: {
        model: "dall-e-3" as const,
        quality: "standard" as const,
        style: "natural" as const,
        size: "1024x1024" as const
      },
      artistic: {
        model: "dall-e-3" as const,
        quality: "hd" as const,
        style: "vivid" as const,
        size: "1024x1024" as const
      }
    };

    const genConfig = generationConfig[config.style as keyof typeof generationConfig] || generationConfig.photorealistic;

    // Retry logic for better reliability
    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await openai.images.generate({
          model: genConfig.model,
          prompt: enhancedPrompt,
          n: 1,
          size: genConfig.size,
          quality: genConfig.quality,
          style: genConfig.style
        });

        const imageUrl = response.data?.[0]?.url;
        
        if (!imageUrl) {
          throw new Error('No image generated');
        }

        return NextResponse.json({
          success: true,
          imageUrl,
          prompt: enhancedPrompt,
          config,
          metadata: {
            width: 1024,
            height: 1024,
            format: 'png',
            style: config.style,
            businessUseCase: config.businessUseCase,
            environment: config.environment,
            timeOfDay: config.timeOfDay,
            generationTime: Date.now(),
            attempt: attempt + 1
          }
        });

      } catch (error) {
        lastError = error as Error;
        console.error(`Background generation attempt ${attempt + 1} failed:`, error);
        
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
    console.error('Background Generation API Error:', error);
    
    const errorObj = error as { status?: number; message?: string };
    
    if (errorObj.status === 400) {
      return NextResponse.json(
        { error: 'Invalid background generation request', details: errorObj.message },
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
        { error: 'Content policy violation. Please adjust your background requirements.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate background', details: errorObj.message },
      { status: 500 }
    );
  }
}