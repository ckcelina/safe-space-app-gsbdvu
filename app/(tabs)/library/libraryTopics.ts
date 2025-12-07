
export interface Topic {
  id: string;
  title: string;
  shortDescription: string;
  imagePrompt: string;
  content: {
    overview: string;
    symptoms: string[];
    effects: string[];
    coping: string[];
  };
}

export const libraryTopics: Topic[] = [
  {
    id: 'gad',
    title: 'Generalised Anxiety Disorder (GAD)',
    shortDescription: 'Persistent worry and tension that interferes with daily life, even when there is little or nothing to provoke it.',
    imagePrompt: 'A calm illustration of a person with swirling lines fading into clouds.',
    content: {
      overview: 'GAD is characterized by chronic anxiety, exaggerated worry, and tension, even when there is little or nothing to provoke it.',
      symptoms: ['Excessive worry', 'Restlessness', 'Fatigue', 'Difficulty concentrating', 'Muscle tension', 'Sleep disturbances'],
      effects: ['Difficulty maintaining relationships', 'Reduced work performance', 'Physical health issues', 'Social withdrawal'],
      coping: ['Cognitive behavioral therapy', 'Mindfulness practices', 'Regular exercise', 'Stress management techniques', 'Professional support'],
    },
  },
  {
    id: 'depression',
    title: 'Major Depressive Disorder',
    shortDescription: 'A mood disorder causing persistent feelings of sadness and loss of interest in activities once enjoyed.',
    imagePrompt: 'Pastel figure under a small rain cloud parting into light.',
    content: {
      overview: 'Major depression is a serious medical illness affecting how you feel, think, and handle daily activities.',
      symptoms: ['Persistent sadness', 'Loss of interest', 'Changes in appetite', 'Sleep problems', 'Fatigue', 'Feelings of worthlessness'],
      effects: ['Impaired daily functioning', 'Relationship difficulties', 'Physical health decline', 'Reduced quality of life'],
      coping: ['Therapy and counseling', 'Medication when appropriate', 'Regular routine', 'Social support', 'Self-care practices'],
    },
  },
  {
    id: 'bipolar',
    title: 'Bipolar Disorder',
    shortDescription: 'A condition marked by extreme mood swings including emotional highs (mania) and lows (depression).',
    imagePrompt: 'Two overlapping silhouettes with day/night colors blending.',
    content: {
      overview: 'Bipolar disorder causes unusual shifts in mood, energy, activity levels, and the ability to carry out day-to-day tasks.',
      symptoms: ['Mood swings', 'Manic episodes', 'Depressive episodes', 'Changes in energy', 'Impulsive behavior', 'Sleep changes'],
      effects: ['Relationship strain', 'Work or school problems', 'Risky behavior', 'Substance abuse risk'],
      coping: ['Medication management', 'Mood tracking', 'Regular sleep schedule', 'Therapy', 'Support groups'],
    },
  },
  {
    id: 'bpd',
    title: 'Borderline Personality Disorder (BPD)',
    shortDescription: 'A mental health disorder that impacts the way you think and feel about yourself and others, causing problems in everyday life.',
    imagePrompt: 'A heart made of puzzle pieces merging together.',
    content: {
      overview: 'BPD is characterized by ongoing instability in moods, behavior, self-image, and functioning.',
      symptoms: ['Intense emotions', 'Fear of abandonment', 'Unstable relationships', 'Impulsive actions', 'Self-harm', 'Identity disturbance'],
      effects: ['Relationship difficulties', 'Employment challenges', 'Legal problems', 'Self-destructive behavior'],
      coping: ['Dialectical behavior therapy', 'Emotion regulation skills', 'Mindfulness', 'Crisis management', 'Support networks'],
    },
  },
  {
    id: 'adhd',
    title: 'Attention-Deficit/Hyperactivity Disorder (ADHD)',
    shortDescription: 'A neurodevelopmental disorder characterized by inattention, hyperactivity, and impulsivity that interferes with functioning.',
    imagePrompt: 'A playful brain with orbiting icons organized into paths.',
    content: {
      overview: 'ADHD is one of the most common neurodevelopmental disorders of childhood, often lasting into adulthood.',
      symptoms: ['Difficulty focusing', 'Hyperactivity', 'Impulsiveness', 'Disorganization', 'Time management issues', 'Forgetfulness'],
      effects: ['Academic challenges', 'Work difficulties', 'Relationship problems', 'Low self-esteem'],
      coping: ['Medication', 'Behavioral therapy', 'Organization strategies', 'Time management tools', 'Exercise and routine'],
    },
  },
  {
    id: 'ocd',
    title: 'Obsessive-Compulsive Disorder (OCD)',
    shortDescription: 'A disorder characterized by unreasonable thoughts and fears (obsessions) that lead to repetitive behaviors (compulsions).',
    imagePrompt: 'Hands aligning objects into gentle symmetrical shapes.',
    content: {
      overview: 'OCD features a pattern of unwanted thoughts and fears that lead you to do repetitive behaviors.',
      symptoms: ['Intrusive thoughts', 'Compulsive behaviors', 'Excessive cleaning', 'Checking rituals', 'Counting', 'Ordering'],
      effects: ['Time-consuming rituals', 'Distress and anxiety', 'Impaired functioning', 'Social isolation'],
      coping: ['Exposure and response prevention', 'Cognitive behavioral therapy', 'Medication', 'Support groups', 'Stress management'],
    },
  },
  {
    id: 'ptsd',
    title: 'Post-Traumatic Stress Disorder (PTSD)',
    shortDescription: 'A disorder that develops in some people who have experienced a shocking, scary, or dangerous event.',
    imagePrompt: 'A person looking at a glowing window while soft shapes fade behind.',
    content: {
      overview: 'PTSD can occur in people who have experienced or witnessed a traumatic event.',
      symptoms: ['Flashbacks', 'Nightmares', 'Severe anxiety', 'Avoidance', 'Negative thoughts', 'Hypervigilance'],
      effects: ['Relationship problems', 'Work difficulties', 'Substance abuse risk', 'Depression and anxiety'],
      coping: ['Trauma-focused therapy', 'EMDR', 'Medication', 'Support groups', 'Grounding techniques'],
    },
  },
];
