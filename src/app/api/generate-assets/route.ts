import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, colorPalette, assetType } = await request.json();

    if (!prompt || !style || !colorPalette || !assetType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Enhance the prompt with style and color information
    const enhancedPrompt = `${prompt}. Style: ${style}. Color palette: ${colorPalette.join(', ')}. High quality, professional, suitable for marketing materials. No text or words in the image.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image generated');
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: enhancedPrompt,
      metadata: {
        width: 1024,
        height: 1024,
        format: 'png'
      }
    });

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

    return NextResponse.json(
      { error: 'Failed to generate image', details: errorObj.message },
      { status: 500 }
    );
  }
}