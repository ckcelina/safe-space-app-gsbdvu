
/**
 * Therapist Memory Profiles
 * Defines what each therapist remembers and how they recall information
 */

export interface TherapistMemoryProfile {
  therapistId: string;
  name: string;
  memoryBehavior: {
    remember: string[]; // What to track
    avoid: string[]; // What NOT to store
    recallStyle: 'gentle' | 'structured' | 'reflective' | 'analytical';
  };
  extractionRules: {
    maxKeyPoints: number;
    maxPatterns: number;
    focusAreas: string[];
  };
}

export const THERAPIST_MEMORY_PROFILES: Record<string, TherapistMemoryProfile> = {
  'dr-elias': {
    therapistId: 'dr-elias',
    name: 'Dr. Elias Chen',
    memoryBehavior: {
      remember: [
        'emotional patterns and triggers',
        'coping strategies that work',
        'progress milestones and growth',
        'recurring themes in feelings',
        'self-compassion practices tried',
        'grounding techniques that help'
      ],
      avoid: [
        'explicit trauma details',
        'medical diagnoses',
        'identifying information',
        'crisis event specifics',
        'self-harm methods'
      ],
      recallStyle: 'gentle',
    },
    extractionRules: {
      maxKeyPoints: 3,
      maxPatterns: 2,
      focusAreas: [
        'emotional growth',
        'behavioral patterns',
        'relationship dynamics',
        'self-compassion progress',
        'stress management strategies'
      ],
    },
  },
  'maya': {
    therapistId: 'maya',
    name: 'Maya Rodriguez',
    memoryBehavior: {
      remember: [
        'cognitive distortions identified',
        'thought patterns and triggers',
        'evidence-gathering successes',
        'reframing techniques that work',
        'anxiety triggers and responses',
        'progress in challenging thoughts'
      ],
      avoid: [
        'intrusive thought content',
        'panic attack details',
        'medication names',
        'diagnosis labels',
        'physical symptoms'
      ],
      recallStyle: 'analytical',
    },
    extractionRules: {
      maxKeyPoints: 3,
      maxPatterns: 2,
      focusAreas: [
        'thinking patterns',
        'cognitive distortions',
        'behavior changes',
        'skill application',
        'anxiety management'
      ],
    },
  },
  'jordan': {
    therapistId: 'jordan',
    name: 'Jordan Kim',
    memoryBehavior: {
      remember: [
        'communication patterns',
        'relationship insights',
        'conflict styles and triggers',
        'boundary-setting attempts',
        'connection needs and values',
        'successful communication strategies'
      ],
      avoid: [
        'partner identifying details',
        'intimate specifics',
        'legal matters',
        'abuse details',
        'family member names'
      ],
      recallStyle: 'structured',
    },
    extractionRules: {
      maxKeyPoints: 3,
      maxPatterns: 2,
      focusAreas: [
        'relationship patterns',
        'communication styles',
        'boundary work',
        'conflict resolution',
        'connection themes'
      ],
    },
  },
  'claire': {
    therapistId: 'claire',
    name: 'Claire Thompson',
    memoryBehavior: {
      remember: [
        'healing pace and preferences',
        'safety strategies that work',
        'trust-building progress',
        'shame themes and shifts',
        'emotional processing patterns',
        'moments of courage'
      ],
      avoid: [
        'trauma event details',
        'perpetrator information',
        'abuse specifics',
        'medical procedures',
        'legal case details'
      ],
      recallStyle: 'gentle',
    },
    extractionRules: {
      maxKeyPoints: 2,
      maxPatterns: 1,
      focusAreas: [
        'healing journey',
        'safety and trust',
        'shame work',
        'emotional processing',
        'self-worth progress'
      ],
    },
  },
  'noah': {
    therapistId: 'noah',
    name: 'Noah Patel',
    memoryBehavior: {
      remember: [
        'goals and action steps',
        'obstacles and solutions',
        'momentum patterns',
        'successful routines',
        'motivation strategies',
        'progress celebrations'
      ],
      avoid: [
        'failure details',
        'shame-inducing specifics',
        'medical conditions',
        'financial specifics',
        'employment details'
      ],
      recallStyle: 'reflective',
    },
    extractionRules: {
      maxKeyPoints: 3,
      maxPatterns: 2,
      focusAreas: [
        'goal progress',
        'action patterns',
        'obstacle management',
        'routine building',
        'motivation strategies'
      ],
    },
  },
};

export function getMemoryProfile(therapistId: string): TherapistMemoryProfile {
  return THERAPIST_MEMORY_PROFILES[therapistId] || THERAPIST_MEMORY_PROFILES['dr-elias'];
}
