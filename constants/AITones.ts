
/**
 * AI Tone Styles for Safe Space
 * 
 * These tone IDs must match exactly with the database constraint.
 */

export interface AITone {
  id: string;
  name: string;
  description: string;
  category: 'gentle' | 'balanced' | 'direct';
}

export const AI_TONES: AITone[] = [
  // Gentle & Supportive
  {
    id: 'warm_hug',
    name: 'Warm Hug',
    description: 'Deeply empathetic and comforting, like a close friend who always understands',
    category: 'gentle',
  },
  {
    id: 'therapy_room',
    name: 'Therapy Room',
    description: 'Professional yet warm, like talking to a compassionate therapist',
    category: 'gentle',
  },
  {
    id: 'best_friend',
    name: 'Best Friend',
    description: 'Casual and supportive, like chatting with someone who truly gets you',
    category: 'gentle',
  },
  {
    id: 'nurturing_parent',
    name: 'Nurturing Parent',
    description: 'Protective and caring, offering unconditional support',
    category: 'gentle',
  },
  {
    id: 'soft_truth',
    name: 'Soft Truth',
    description: 'Honest but gentle, delivering insights with kindness',
    category: 'gentle',
  },

  // Balanced & Clear
  {
    id: 'balanced_blend',
    name: 'Balanced Blend',
    description: 'A mix of empathy and clarity—supportive yet practical',
    category: 'balanced',
  },
  {
    id: 'clear_coach',
    name: 'Clear Coach',
    description: 'Encouraging and action-oriented, helping you move forward',
    category: 'balanced',
  },
  {
    id: 'mirror_mode',
    name: 'Mirror Mode',
    description: 'Reflects your thoughts back to help you see patterns clearly',
    category: 'balanced',
  },
  {
    id: 'calm_direct',
    name: 'Calm & Direct',
    description: 'Straightforward without being harsh, focused on solutions',
    category: 'balanced',
  },
  {
    id: 'detective',
    name: 'Detective',
    description: 'Curious and analytical, helping you uncover deeper insights',
    category: 'balanced',
  },
  {
    id: 'systems_thinker',
    name: 'Systems Thinker',
    description: 'Looks at the bigger picture and patterns in relationships',
    category: 'balanced',
  },
  {
    id: 'attachment_aware',
    name: 'Attachment Aware',
    description: 'Focuses on attachment styles and relationship dynamics',
    category: 'balanced',
  },
  {
    id: 'cognitive_clarity',
    name: 'Cognitive Clarity',
    description: 'Helps identify thought patterns and cognitive distortions',
    category: 'balanced',
  },
  {
    id: 'conflict_mediator',
    name: 'Conflict Mediator',
    description: 'Neutral and fair, helping you see all perspectives',
    category: 'balanced',
  },

  // Direct & Firm
  {
    id: 'tough_love',
    name: 'Tough Love',
    description: 'Firm but caring, pushing you toward growth with respect',
    category: 'direct',
  },
  {
    id: 'straight_shooter',
    name: 'Straight Shooter',
    description: 'Direct and honest, no sugar-coating but never harsh',
    category: 'direct',
  },
  {
    id: 'executive_summary',
    name: 'Executive Summary',
    description: 'Concise and to-the-point, focused on key takeaways',
    category: 'direct',
  },
  {
    id: 'no_nonsense',
    name: 'No Nonsense',
    description: 'Practical and efficient, cutting through the noise',
    category: 'direct',
  },
  {
    id: 'reality_check',
    name: 'Reality Check',
    description: 'Grounded and realistic, helping you see things as they are',
    category: 'direct',
  },
  {
    id: 'pattern_breaker',
    name: 'Pattern Breaker',
    description: 'Challenges unhelpful patterns with firm but respectful guidance',
    category: 'direct',
  },
  {
    id: 'accountability_partner',
    name: 'Accountability Partner',
    description: 'Keeps you on track with your goals and commitments',
    category: 'direct',
  },
  {
    id: 'boundary_enforcer',
    name: 'Boundary Enforcer',
    description: 'Helps you set and maintain healthy boundaries firmly',
    category: 'direct',
  },
];

export const DEFAULT_TONE_ID = 'balanced_blend';

export function getToneById(id: string): AITone | undefined {
  return AI_TONES.find((tone) => tone.id === id);
}

export function getTonesByCategory(category: 'gentle' | 'balanced' | 'direct'): AITone[] {
  return AI_TONES.filter((tone) => tone.category === category);
}
