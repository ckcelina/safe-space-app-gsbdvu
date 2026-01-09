
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
      remember: ['emotional patterns', 'coping strategies', 'progress milestones', 'recurring themes'],
      avoid: ['explicit trauma details', 'medical diagnoses', 'identifying information'],
      recallStyle: 'gentle',
    },
    extractionRules: {
      maxKeyPoints: 3,
      maxPatterns: 2,
      focusAreas: ['emotional growth', 'behavioral patterns', 'relationship dynamics'],
    },
  },
  'noah': {
    therapistId: 'noah',
    name: 'Noah Rivers',
    memoryBehavior: {
      remember: ['life goals', 'values', 'decision points', 'personal strengths'],
      avoid: ['crisis details', 'self-harm mentions', 'substance specifics'],
      recallStyle: 'reflective',
    },
    extractionRules: {
      maxKeyPoints: 2,
      maxPatterns: 2,
      focusAreas: ['personal values', 'life direction', 'self-discovery'],
    },
  },
  'maya': {
    therapistId: 'maya',
    name: 'Maya Patel',
    memoryBehavior: {
      remember: ['communication patterns', 'relationship insights', 'conflict styles', 'connection needs'],
      avoid: ['partner identifying details', 'intimate specifics', 'legal matters'],
      recallStyle: 'structured',
    },
    extractionRules: {
      maxKeyPoints: 3,
      maxPatterns: 2,
      focusAreas: ['relationship patterns', 'communication styles', 'attachment themes'],
    },
  },
  'claire': {
    therapistId: 'claire',
    name: 'Claire Dubois',
    memoryBehavior: {
      remember: ['anxiety triggers', 'calming techniques', 'worry patterns', 'safety strategies'],
      avoid: ['panic attack details', 'medication names', 'physical symptoms'],
      recallStyle: 'gentle',
    },
    extractionRules: {
      maxKeyPoints: 2,
      maxPatterns: 2,
      focusAreas: ['anxiety patterns', 'coping effectiveness', 'progress indicators'],
    },
  },
  'ruth': {
    therapistId: 'ruth',
    name: 'Ruth Goldstein',
    memoryBehavior: {
      remember: ['grief stages', 'memory themes', 'support systems', 'healing moments'],
      avoid: ['death details', 'funeral specifics', 'medical circumstances'],
      recallStyle: 'gentle',
    },
    extractionRules: {
      maxKeyPoints: 2,
      maxPatterns: 1,
      focusAreas: ['grief process', 'meaning-making', 'connection to deceased'],
    },
  },
  'jordan': {
    therapistId: 'jordan',
    name: 'Jordan Kim',
    memoryBehavior: {
      remember: ['identity exploration', 'self-expression', 'community connections', 'affirmation needs'],
      avoid: ['deadname', 'medical transition details', 'discrimination specifics'],
      recallStyle: 'reflective',
    },
    extractionRules: {
      maxKeyPoints: 3,
      maxPatterns: 2,
      focusAreas: ['identity journey', 'self-acceptance', 'authentic expression'],
    },
  },
  'aisha': {
    therapistId: 'aisha',
    name: 'Aisha Rahman',
    memoryBehavior: {
      remember: ['cultural values', 'family dynamics', 'identity balance', 'community ties'],
      avoid: ['family conflicts details', 'religious specifics', 'immigration status'],
      recallStyle: 'structured',
    },
    extractionRules: {
      maxKeyPoints: 3,
      maxPatterns: 2,
      focusAreas: ['cultural identity', 'value conflicts', 'belonging'],
    },
  },
  'ken': {
    therapistId: 'ken',
    name: 'Ken Tanaka',
    memoryBehavior: {
      remember: ['thought patterns', 'behavioral experiments', 'cognitive distortions', 'skill practice'],
      avoid: ['intrusive thought content', 'compulsion details', 'diagnosis labels'],
      recallStyle: 'analytical',
    },
    extractionRules: {
      maxKeyPoints: 3,
      maxPatterns: 2,
      focusAreas: ['thinking patterns', 'behavior changes', 'skill application'],
    },
  },
};

export function getMemoryProfile(therapistId: string): TherapistMemoryProfile {
  return THERAPIST_MEMORY_PROFILES[therapistId] || THERAPIST_MEMORY_PROFILES['dr-elias'];
}
