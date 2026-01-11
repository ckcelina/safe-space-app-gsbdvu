
/**
 * Memory Extraction Utilities
 * Extracts safe, non-sensitive key points and patterns from conversations
 */

import { TherapistMemoryProfile } from './therapist-memory-profiles.ts';

interface ExtractionResult {
  keyPoints: string[];
  patterns: string[];
}

const SENSITIVE_KEYWORDS = [
  'suicide', 'self-harm', 'abuse', 'assault', 'medication', 'diagnosis',
  'address', 'phone', 'email', 'ssn', 'credit card', 'password',
];

/**
 * Check if text contains sensitive information that should not be stored
 */
function containsSensitiveInfo(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Extract safe key points and patterns using OpenAI
 */
export async function extractMemoryNotes(
  userMessage: string,
  aiResponse: string,
  profile: TherapistMemoryProfile,
  openaiApiKey: string
): Promise<ExtractionResult> {
  const systemPrompt = `You are a privacy-focused memory extraction assistant for ${profile.name}.

MEMORY BEHAVIOR:
- Remember: ${profile.memoryBehavior.remember.join(', ')}
- NEVER store: ${profile.memoryBehavior.avoid.join(', ')}
- Recall style: ${profile.memoryBehavior.recallStyle}

EXTRACTION RULES:
- Extract max ${profile.extractionRules.maxKeyPoints} key points
- Extract max ${profile.extractionRules.maxPatterns} patterns
- Focus on: ${profile.extractionRules.focusAreas.join(', ')}
- Keep each point under 50 characters
- Use general themes, NOT specific details
- NEVER include names, places, dates, or identifying info
- NEVER include crisis content, self-harm, or trauma details

Return JSON: { "keyPoints": ["..."], "patterns": ["..."] }`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `User: ${userMessage}\n\nAssistant: ${aiResponse}\n\nExtract safe memory notes.` },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Memory extraction failed:', response.status);
      return { keyPoints: [], patterns: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return { keyPoints: [], patterns: [] };
    }

    const parsed = JSON.parse(content);
    
    // Filter out any sensitive content
    const safeKeyPoints = (parsed.keyPoints || [])
      .filter((point: string) => !containsSensitiveInfo(point))
      .slice(0, profile.extractionRules.maxKeyPoints);
    
    const safePatterns = (parsed.patterns || [])
      .filter((pattern: string) => !containsSensitiveInfo(pattern))
      .slice(0, profile.extractionRules.maxPatterns);

    return {
      keyPoints: safeKeyPoints,
      patterns: safePatterns,
    };
  } catch (error) {
    console.error('Memory extraction error:', error);
    return { keyPoints: [], patterns: [] };
  }
}

/**
 * Format memory notes for context injection
 */
export function formatMemoryContext(
  keyPoints: string[],
  patterns: string[],
  recallStyle: string
): string {
  if (keyPoints.length === 0 && patterns.length === 0) {
    return '';
  }

  let context = '\n\n[CONVERSATION MEMORY - Private Notes]';
  
  if (recallStyle === 'gentle') {
    context += '\nYou may gently reference these themes if relevant:';
  } else if (recallStyle === 'structured') {
    context += '\nPrevious session themes to consider:';
  } else if (recallStyle === 'reflective') {
    context += '\nReflections from our journey together:';
  } else if (recallStyle === 'analytical') {
    context += '\nObserved patterns to build upon:';
  }

  if (keyPoints.length > 0) {
    context += '\n- Key themes: ' + keyPoints.join('; ');
  }
  
  if (patterns.length > 0) {
    context += '\n- Patterns noticed: ' + patterns.join('; ');
  }

  context += '\n(Use naturally, do not list these directly)';
  
  return context;
}
