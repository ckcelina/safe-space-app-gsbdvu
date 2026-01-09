
/**
 * Topic-Specific Therapist Overrides
 * 
 * Maps topics to recommended therapist personas based on their specialties.
 * This configuration is used to suggest optimal therapists when users select specific topics.
 * 
 * USAGE:
 * - When a user selects a topic, check if there's a recommended therapist
 * - If current therapist differs from recommended, show a subtle suggestion
 * - User can accept or dismiss the suggestion
 * 
 * THERAPIST SPECIALTIES:
 * - dr_elias: Calm & Grounding - Best for anxiety, panic, overwhelm
 * - noah: Direct & Practical - Best for work stress, decision-making, problem-solving
 * - maya: Gentle & Validating - Best for relationships, emotional support, validation
 * - claire: Reflective & Insightful - Best for self-discovery, patterns, introspection
 * - ruth: Nurturing & Wise - Best for grief, trauma, emotional healing
 * - jordan: Encouraging & Uplifting - Best for motivation, confidence, growth
 * - aisha: Curious & Exploratory - Best for exploration, curiosity, new perspectives
 * - ken: Balanced & Analytical - Best for complex issues, logic + emotion balance
 */

export interface TopicTherapistOverride {
  topicName: string;
  recommendedTherapistId: string;
  reason: string; // Brief explanation for the suggestion
}

/**
 * Topic-to-Therapist mapping configuration
 * 
 * IMPORTANT: Topic names must match EXACTLY with:
 * 1. Topic names in the "persons" table (relationship_type = 'Topic')
 * 2. Subject names in chat messages
 * 3. Library topic titles (from libraryTopics.ts)
 */
export const TOPIC_THERAPIST_OVERRIDES: TopicTherapistOverride[] = [
  // ANXIETY-RELATED → Dr. Elias (Calm & Grounding)
  {
    topicName: 'Anxiety',
    recommendedTherapistId: 'dr_elias',
    reason: 'Dr. Elias specializes in calming anxiety and reducing overwhelm',
  },
  {
    topicName: 'Social Anxiety',
    recommendedTherapistId: 'dr_elias',
    reason: 'Dr. Elias helps with grounding and managing social anxiety',
  },
  {
    topicName: 'Panic Disorder & Panic Attacks',
    recommendedTherapistId: 'dr_elias',
    reason: 'Dr. Elias specializes in calming panic and bringing emotional safety',
  },
  {
    topicName: 'Health Anxiety',
    recommendedTherapistId: 'dr_elias',
    reason: 'Dr. Elias helps reduce health-related worry and overwhelm',
  },
  {
    topicName: 'Generalised Anxiety Disorder (GAD)',
    recommendedTherapistId: 'dr_elias',
    reason: 'Dr. Elias specializes in managing persistent worry and tension',
  },
  {
    topicName: 'Understanding Persistent Worry (GAD)',
    recommendedTherapistId: 'dr_elias',
    reason: 'Dr. Elias specializes in managing persistent worry and tension',
  },
  {
    topicName: 'Understanding Social Anxiety',
    recommendedTherapistId: 'dr_elias',
    reason: 'Dr. Elias helps with grounding and managing social anxiety',
  },
  {
    topicName: 'Understanding Panic & Panic Attacks',
    recommendedTherapistId: 'dr_elias',
    reason: 'Dr. Elias specializes in calming panic and bringing emotional safety',
  },
  {
    topicName: 'Understanding Health Anxiety',
    recommendedTherapistId: 'dr_elias',
    reason: 'Dr. Elias helps reduce health-related worry and overwhelm',
  },

  // RELATIONSHIPS → Maya (Gentle & Validating)
  {
    topicName: 'Relationships',
    recommendedTherapistId: 'maya',
    reason: 'Maya specializes in relationship support and emotional validation',
  },
  {
    topicName: 'Romantic Relationships',
    recommendedTherapistId: 'maya',
    reason: 'Maya provides warm support for relationship challenges',
  },
  {
    topicName: 'Family Conflict',
    recommendedTherapistId: 'maya',
    reason: 'Maya helps navigate family dynamics with empathy',
  },
  {
    topicName: 'Breakups & Heartbreak',
    recommendedTherapistId: 'maya',
    reason: 'Maya offers gentle support during heartbreak',
  },
  {
    topicName: 'Improving Romantic Relationships',
    recommendedTherapistId: 'maya',
    reason: 'Maya provides warm support for relationship challenges',
  },
  {
    topicName: 'Navigating Family Conflict',
    recommendedTherapistId: 'maya',
    reason: 'Maya helps navigate family dynamics with empathy',
  },
  {
    topicName: 'Coping With Breakups & Heartbreak',
    recommendedTherapistId: 'maya',
    reason: 'Maya offers gentle support during heartbreak',
  },

  // WORK & CAREER → Noah (Direct & Practical)
  {
    topicName: 'Work & Career',
    recommendedTherapistId: 'noah',
    reason: 'Noah provides practical guidance for work challenges',
  },
  {
    topicName: 'Work Stress & Burnout',
    recommendedTherapistId: 'noah',
    reason: 'Noah helps untangle work stress with clear strategies',
  },
  {
    topicName: 'Procrastination',
    recommendedTherapistId: 'noah',
    reason: 'Noah offers structured approaches to overcome procrastination',
  },
  {
    topicName: 'Studies & School',
    recommendedTherapistId: 'noah',
    reason: 'Noah provides practical support for academic challenges',
  },
  {
    topicName: 'Managing Work Stress & Burnout',
    recommendedTherapistId: 'noah',
    reason: 'Noah helps untangle work stress with clear strategies',
  },
  {
    topicName: 'Overcoming Procrastination',
    recommendedTherapistId: 'noah',
    reason: 'Noah offers structured approaches to overcome procrastination',
  },
  {
    topicName: 'Managing Academic Stress',
    recommendedTherapistId: 'noah',
    reason: 'Noah provides practical support for academic challenges',
  },

  // GRIEF & TRAUMA → Ruth (Nurturing & Wise)
  {
    topicName: 'Grief',
    recommendedTherapistId: 'ruth',
    reason: 'Ruth offers nurturing support through grief and loss',
  },
  {
    topicName: 'Grief & Bereavement',
    recommendedTherapistId: 'ruth',
    reason: 'Ruth provides compassionate guidance through bereavement',
  },
  {
    topicName: 'Childhood Trauma',
    recommendedTherapistId: 'ruth',
    reason: 'Ruth offers wise, nurturing support for healing childhood wounds',
  },
  {
    topicName: 'Emotional Neglect',
    recommendedTherapistId: 'ruth',
    reason: 'Ruth helps heal emotional neglect with warmth and care',
  },
  {
    topicName: 'Understanding Grief & Bereavement',
    recommendedTherapistId: 'ruth',
    reason: 'Ruth provides compassionate guidance through bereavement',
  },
  {
    topicName: 'Understanding Childhood Trauma',
    recommendedTherapistId: 'ruth',
    reason: 'Ruth offers wise, nurturing support for healing childhood wounds',
  },
  {
    topicName: 'Understanding Emotional Neglect',
    recommendedTherapistId: 'ruth',
    reason: 'Ruth helps heal emotional neglect with warmth and care',
  },

  // SELF-WORTH & CONFIDENCE → Jordan (Encouraging & Uplifting)
  {
    topicName: 'Self-worth & Confidence',
    recommendedTherapistId: 'jordan',
    reason: 'Jordan helps rebuild confidence and self-belief',
  },
  {
    topicName: 'Low Self-Esteem',
    recommendedTherapistId: 'jordan',
    reason: 'Jordan focuses on strengths and building self-worth',
  },
  {
    topicName: 'Motivation',
    recommendedTherapistId: 'jordan',
    reason: 'Jordan provides encouraging support to rebuild momentum',
  },
  {
    topicName: 'Building Self-Esteem',
    recommendedTherapistId: 'jordan',
    reason: 'Jordan focuses on strengths and building self-worth',
  },

  // SELF-DISCOVERY & PATTERNS → Claire (Reflective & Insightful)
  {
    topicName: 'Perfectionism',
    recommendedTherapistId: 'claire',
    reason: 'Claire helps explore perfectionism patterns with insight',
  },
  {
    topicName: 'People-Pleasing',
    recommendedTherapistId: 'claire',
    reason: 'Claire guides reflection on people-pleasing behaviors',
  },
  {
    topicName: 'Attachment Patterns',
    recommendedTherapistId: 'claire',
    reason: 'Claire helps understand attachment patterns deeply',
  },
  {
    topicName: 'Understanding Perfectionism',
    recommendedTherapistId: 'claire',
    reason: 'Claire helps explore perfectionism patterns with insight',
  },
  {
    topicName: 'Understanding People-Pleasing',
    recommendedTherapistId: 'claire',
    reason: 'Claire guides reflection on people-pleasing behaviors',
  },
  {
    topicName: 'Understanding Anxious Attachment',
    recommendedTherapistId: 'claire',
    reason: 'Claire helps understand attachment patterns deeply',
  },
  {
    topicName: 'Understanding Avoidant Attachment',
    recommendedTherapistId: 'claire',
    reason: 'Claire helps understand attachment patterns deeply',
  },
  {
    topicName: 'Understanding Disorganised Attachment',
    recommendedTherapistId: 'claire',
    reason: 'Claire helps understand attachment patterns deeply',
  },

  // EXPLORATION & CURIOSITY → Aisha (Curious & Exploratory)
  {
    topicName: 'Identity',
    recommendedTherapistId: 'aisha',
    reason: 'Aisha explores identity questions with curiosity',
  },
  {
    topicName: 'Life Transitions',
    recommendedTherapistId: 'aisha',
    reason: 'Aisha helps explore new perspectives during transitions',
  },
  {
    topicName: 'Loneliness',
    recommendedTherapistId: 'aisha',
    reason: 'Aisha explores feelings of loneliness with openness',
  },
  {
    topicName: 'Understanding Loneliness',
    recommendedTherapistId: 'aisha',
    reason: 'Aisha explores feelings of loneliness with openness',
  },

  // COMPLEX ISSUES → Ken (Balanced & Analytical)
  {
    topicName: 'Depression',
    recommendedTherapistId: 'ken',
    reason: 'Ken balances emotion and logic to understand depression',
  },
  {
    topicName: 'Bipolar Disorder',
    recommendedTherapistId: 'ken',
    reason: 'Ken helps make sense of mood patterns analytically',
  },
  {
    topicName: 'OCD',
    recommendedTherapistId: 'ken',
    reason: 'Ken provides balanced support for OCD patterns',
  },
  {
    topicName: 'ADHD',
    recommendedTherapistId: 'ken',
    reason: 'Ken helps understand ADHD with logic and compassion',
  },
  {
    topicName: 'Understanding Depression',
    recommendedTherapistId: 'ken',
    reason: 'Ken balances emotion and logic to understand depression',
  },
  {
    topicName: 'Understanding Long-Term Low Mood (Dysthymia)',
    recommendedTherapistId: 'ken',
    reason: 'Ken balances emotion and logic to understand persistent low mood',
  },
  {
    topicName: 'Understanding Bipolar Patterns (Type 1)',
    recommendedTherapistId: 'ken',
    reason: 'Ken helps make sense of mood patterns analytically',
  },
  {
    topicName: 'Understanding Bipolar Patterns (Type 2)',
    recommendedTherapistId: 'ken',
    reason: 'Ken helps make sense of mood patterns analytically',
  },
  {
    topicName: 'Understanding OCD Patterns',
    recommendedTherapistId: 'ken',
    reason: 'Ken provides balanced support for OCD patterns',
  },
  {
    topicName: 'Understanding ADHD',
    recommendedTherapistId: 'ken',
    reason: 'Ken helps understand ADHD with logic and compassion',
  },
  {
    topicName: 'Understanding ADHD (Inattentive)',
    recommendedTherapistId: 'ken',
    reason: 'Ken helps understand ADHD with logic and compassion',
  },
  {
    topicName: 'Understanding ADHD (Hyperactive/Impulsive)',
    recommendedTherapistId: 'ken',
    reason: 'Ken helps understand ADHD with logic and compassion',
  },
  {
    topicName: 'Understanding ADHD (Combined)',
    recommendedTherapistId: 'ken',
    reason: 'Ken helps understand ADHD with logic and compassion',
  },
];

/**
 * Get recommended therapist for a topic
 * 
 * @param topicName - The name of the topic (must match exactly)
 * @returns TopicTherapistOverride if found, undefined otherwise
 */
export function getRecommendedTherapistForTopic(topicName: string): TopicTherapistOverride | undefined {
  if (!topicName || !topicName.trim()) {
    return undefined;
  }

  // Exact match (case-sensitive)
  const exactMatch = TOPIC_THERAPIST_OVERRIDES.find(
    (override) => override.topicName === topicName
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Fallback: Case-insensitive match
  const caseInsensitiveMatch = TOPIC_THERAPIST_OVERRIDES.find(
    (override) => override.topicName.toLowerCase() === topicName.toLowerCase()
  );

  return caseInsensitiveMatch;
}

/**
 * Check if current therapist is optimal for the topic
 * 
 * @param topicName - The name of the topic
 * @param currentTherapistId - The current therapist persona ID
 * @returns true if current therapist is optimal, false if a different therapist is recommended
 */
export function isTherapistOptimalForTopic(topicName: string, currentTherapistId: string): boolean {
  const recommendation = getRecommendedTherapistForTopic(topicName);
  
  if (!recommendation) {
    // No specific recommendation for this topic - current therapist is fine
    return true;
  }

  return recommendation.recommendedTherapistId === currentTherapistId;
}

/**
 * Get all topics that recommend a specific therapist
 * 
 * @param therapistId - The therapist persona ID
 * @returns Array of topic names that recommend this therapist
 */
export function getTopicsForTherapist(therapistId: string): string[] {
  return TOPIC_THERAPIST_OVERRIDES
    .filter((override) => override.recommendedTherapistId === therapistId)
    .map((override) => override.topicName);
}
