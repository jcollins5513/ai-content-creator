import { 
  ContentTemplate, 
  TemplateAnswers, 
  GeneratedAsset, 
  TemplateGenerationSession,
  AssetGenerationRequest 
} from '@/types/templates';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class TemplateGenerationService {
  private static instance: TemplateGenerationService;

  static getInstance(): TemplateGenerationService {
    if (!TemplateGenerationService.instance) {
      TemplateGenerationService.instance = new TemplateGenerationService();
    }
    return TemplateGenerationService.instance;
  }

  /**
   * Create a new template generation session
   */
  async createSession(
    userId: string,
    templateId: string,
    answers: TemplateAnswers,
    style: string,
    colorPalette: string[]
  ): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: Omit<TemplateGenerationSession, 'id' | 'createdAt' | 'updatedAt'> = {
      templateId,
      answers,
      selectedStyle: style,
      colorPalette,
      generatedAssets: [],
      status: 'in-progress'
    };

    const sessionRef = doc(collection(db, 'users', userId, 'generationSessions'), sessionId);
    
    await setDoc(sessionRef, {
      ...session,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return sessionId;
  }

  /**
   * Update session with generated assets
   */
  async updateSessionAssets(
    userId: string,
    sessionId: string,
    assets: GeneratedAsset[]
  ): Promise<void> {
    const sessionRef = doc(db, 'users', userId, 'generationSessions', sessionId);
    
    await updateDoc(sessionRef, {
      generatedAssets: assets,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Complete a generation session
   */
  async completeSession(
    userId: string,
    sessionId: string
  ): Promise<void> {
    const sessionRef = doc(db, 'users', userId, 'generationSessions', sessionId);
    
    await updateDoc(sessionRef, {
      status: 'completed',
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Get session data
   */
  async getSession(
    userId: string,
    sessionId: string
  ): Promise<TemplateGenerationSession | null> {
    const sessionRef = doc(db, 'users', userId, 'generationSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      return null;
    }

    const data = sessionDoc.data();
    return {
      id: sessionDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as TemplateGenerationSession;
  }

  /**
   * Generate coordinated prompts for all asset types
   */
  generateCoordinatedPrompts(
    template: ContentTemplate,
    answers: TemplateAnswers,
    style: string,
    colorPalette: string[]
  ): Record<string, string> {
    const businessName = answers.business_name || answers.store_name || answers.restaurant_name || 'Business';
    const industry = template.industry;
    const colorHex = colorPalette.join(', ');
    
    // Style-specific modifiers for better coordination
    const styleModifiers = {
      'modern-minimal': {
        background: 'clean geometric patterns, minimalist design, subtle gradients',
        logo: 'simple iconic shapes, clean typography, minimal elements',
        textOverlay: 'clean frames, minimal borders, geometric shapes',
        decorative: 'simple geometric elements, clean lines, minimal patterns'
      },
      'bold-vibrant': {
        background: 'dynamic patterns, energetic designs, high contrast elements',
        logo: 'bold shapes, strong typography, dynamic elements',
        textOverlay: 'bold frames, dynamic borders, energetic elements',
        decorative: 'vibrant shapes, dynamic patterns, energetic graphics'
      },
      'professional-corporate': {
        background: 'subtle patterns, professional textures, corporate elements',
        logo: 'trustworthy symbols, professional typography, established feel',
        textOverlay: 'professional frames, corporate borders, business elements',
        decorative: 'professional icons, corporate patterns, business graphics'
      },
      'warm-friendly': {
        background: 'organic patterns, welcoming textures, community elements',
        logo: 'friendly symbols, approachable typography, welcoming feel',
        textOverlay: 'warm frames, friendly borders, inviting elements',
        decorative: 'organic shapes, friendly patterns, welcoming graphics'
      },
      'luxury-elegant': {
        background: 'sophisticated patterns, premium textures, elegant elements',
        logo: 'refined symbols, elegant typography, premium feel',
        textOverlay: 'elegant frames, sophisticated borders, premium elements',
        decorative: 'refined shapes, elegant patterns, luxury graphics'
      },
      'playful-creative': {
        background: 'artistic patterns, creative textures, imaginative elements',
        logo: 'creative symbols, artistic typography, imaginative feel',
        textOverlay: 'artistic frames, creative borders, imaginative elements',
        decorative: 'creative shapes, artistic patterns, imaginative graphics'
      }
    };

    const modifiers = styleModifiers[style as keyof typeof styleModifiers] || {
      background: 'professional patterns',
      logo: 'clean symbols',
      textOverlay: 'simple frames',
      decorative: 'complementary elements'
    };

    return {
      background: `Create a ${modifiers.background} background design for "${businessName}", a ${industry} business. Use primary colors: ${colorHex}. Professional, clean, suitable for marketing materials. ${style.replace('-', ' ')} aesthetic. No text or logos.`,
      
      logo: `Design ${modifiers.logo} for "${businessName}", a ${industry} business. Primary colors: ${colorHex}. Modern, memorable, scalable design that reflects ${industry} industry. ${style.replace('-', ' ')} style. Simple, iconic, professional. No text unless stylized.`,
      
      'text-overlay': `Create ${modifiers.textOverlay} for "${businessName}" marketing materials. Colors: ${colorHex}. Include call-to-action containers, promotional badges, and text frames that match the ${style.replace('-', ' ')} aesthetic. No actual text content, just decorative frames.`,
      
      decorative: `Design ${modifiers.decorative} for ${industry} marketing materials. Colors: ${colorHex}. Complementary shapes, icons, patterns that enhance the ${style.replace('-', ' ')} theme. Industry-appropriate symbols and motifs for ${industry} business.`
    };
  }

  /**
   * Validate style coordination across assets
   */
  validateStyleCoordination(
    assets: GeneratedAsset[],
    expectedStyle: string,
    expectedColors: string[]
  ): {
    isCoordinated: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check if all assets use the same style
    const styles = new Set(assets.map(asset => asset.style));
    if (styles.size > 1) {
      issues.push('Inconsistent styles detected across assets');
      suggestions.push('Regenerate assets with consistent style parameters');
    }

    // Check asset type coverage
    const requiredTypes = ['background', 'logo', 'text-overlay', 'decorative'];
    const generatedTypes = new Set(assets.map(asset => asset.type));
    const missingTypes = requiredTypes.filter(type => !generatedTypes.has(type as GeneratedAsset['type']));
    
    if (missingTypes.length > 0) {
      issues.push(`Missing asset types: ${missingTypes.join(', ')}`);
      suggestions.push('Generate missing asset types for complete template');
    }

    // Provide coordination suggestions
    if (assets.length > 0) {
      suggestions.push('Review generated assets for visual harmony');
      suggestions.push('Consider regenerating individual assets if they don\'t match the overall theme');
    }

    return {
      isCoordinated: issues.length === 0,
      issues,
      suggestions
    };
  }
}

export const templateGenerationService = TemplateGenerationService.getInstance();