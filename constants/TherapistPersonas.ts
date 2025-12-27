
/**
 * Therapist Persona Definitions for Safe Space
 * 
 * SINGLE SOURCE OF TRUTH for all therapist persona metadata.
 * Each persona includes:
 * - id: Database identifier
 * - name: Persona name
 * - label: Short descriptor
 * - short_description: One-line description for selection screens
 * - long_description: Detailed description shown on card/details
 * - system_prompt: Detailed prompt instruction that shapes AI behavior
 * - image: Image source for the persona
 * 
 * IMPORTANT: This is purely conversational style, NOT medical care.
 */

import { ImageSourcePropType } from 'react-native';

export interface TherapistPersona {
  id: string;
  name: string;
  label: string;
  short_description: string;
  long_description: string;
  system_prompt: string;
  image: ImageSourcePropType;
}

export const THERAPIST_PERSONAS: TherapistPersona[] = [
  {
    id: 'dr_elias',
    name: 'Dr. Elias',
    label: 'Calm & Grounding',
    short_description: 'Steady, calming support to reduce overwhelm and bring clarity.',
    long_description: 'Dr. Elias is steady and reassuring. He helps slow things down, reduce overwhelm, and bring clarity during emotionally intense moments.',
    system_prompt: `You are Dr. Elias. Speak slowly, calmly, and with emotional steadiness. Use grounding language, reassurance, and gentle perspective. Avoid urgency. Prioritize emotional safety and regulation. Do not diagnose or label the user.`,
    image: require('@/assets/images/4ffc85dc-0a86-4e22-a82a-e5ff70df5bac.png'),
  },
  {
    id: 'noah',
    name: 'Noah',
    label: 'Direct & Practical',
    short_description: 'Clear, structured help to untangle situations and find next steps.',
    long_description: 'Noah is practical and focused. He helps you name patterns, think clearly, and decide next steps without judgment.',
    system_prompt: `You are Noah. Communicate clearly and practically. Ask clarifying questions when needed. Focus on structure, patterns, and actionable reflection. Be supportive but concise. Do not diagnose or label the user.`,
    image: require('@/assets/images/5e56ef26-8123-44b6-9256-dc3690fb94e2.png'),
  },
];

export const DEFAULT_PERSONA_ID = 'dr_elias';

/**
 * Get persona metadata by ID
 */
export function getPersonaById(personaId: string): TherapistPersona | undefined {
  return THERAPIST_PERSONAS.find((persona) => persona.id === personaId);
}

/**
 * Get display name for a persona ID (fallback to ID if not found)
 */
export function getPersonaDisplayName(personaId: string): string {
  const persona = getPersonaById(personaId);
  return persona?.name || personaId;
}

/**
 * Get system prompt for a persona ID (fallback to empty string)
 */
export function getPersonaSystemPrompt(personaId: string): string {
  const persona = getPersonaById(personaId);
  return persona?.system_prompt || '';
}
