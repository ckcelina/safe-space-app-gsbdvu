
/**
 * Settings Constants
 * 
 * Constants used across the settings screen.
 */

import type { ThemeKey } from '@/contexts/ThemeContext';

// Personalization options
export const CONVERSATION_STYLES = [
  'Calm & grounding',
  'Direct & practical',
  'Gentle & supportive',
  'Curious & reflective',
];

export const STRESS_RESPONSES = [
  'Reassurance',
  'Clear steps and structure',
  'Space to think',
  'Validation and empathy',
];

export const PROCESSING_STYLES = [
  'Internally first',
  'Talking helps me process',
  'Logic first, feelings later',
  'Slowly over time',
];

export const DECISION_STYLES = [
  'Fast and decisive',
  'I weigh pros/cons carefully',
  'I need time and reflection',
  'I prefer guidance and options',
];

// AI Preference options for Updates Over Time
export const AI_PREFERENCE_OPTIONS = [
  'Be more gentle',
  'Be more direct',
  'Ask more questions',
  'Give shorter responses',
  'Give more structure/steps',
];

// Theme options
export const THEMES: { key: ThemeKey; name: string }[] = [
  { key: 'OceanBlue', name: 'Ocean Blue' },
  { key: 'SoftRose', name: 'Soft Rose' },
  { key: 'ForestGreen', name: 'Forest Green' },
  { key: 'SunnyYellow', name: 'Sunny Yellow' },
];

