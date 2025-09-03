import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt,
      backgroundUrl,
      userAssets,
      layout,
      businessInfo
    } = await request.json();

    if (!prompt || !backgroundUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: prompt and backgroundUrl' },
        { status: 400 }
      );
    }

    // Enhanced compositing prompt for DALL-E
    const compositingPrompt = `${prompt}

Professional photo editing and compositing:
- Seamlessly integrate all provided elements
- Maintain consistent lighting and shadows
- Ensure realistic perspective and scale
- Professional marketing photography quality
- Clean, polished final result
- High resolution, commercial grade

Technical specifications:
- Photo-realistic rendering
- Proper depth of field
- Consistent color grading
- Professional lighting setup
- Marketing material quality`;

    // For now, we'll use DALL-E to generate a composite based on the description
    // In a production environment, you might want to use specialized compositing APIs
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: compositingPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural"
    });

    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No composite image generated');
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: compositingPrompt,
      layout,
      businessInfo,
      metadata: {
        width: 1024,
        height: 1024,
        format: 'png',
        compositeType: 'ai-generated',
        timestamp: Date.now()
      }
    });

  } catch (error: unknown) {
    console.error('Compositing API Error:', error);
    
    const errorObj = error as { status?: number; message?: string };
    
    if (errorObj.status === 400) {
      return NextResponse.json(
        { error: 'Invalid compositing request', details: errorObj.message },
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
        { error: 'Content policy violation. Please check your images and try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to composite assets', details: errorObj.message },
      { status: 500 }
    );
  }
}