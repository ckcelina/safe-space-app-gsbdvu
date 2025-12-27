export interface Topic {
  id: string;
  title: string;
  shortDescription: string;
  imagePrompt: string;
  imageUrl: string;
  content: {
    overview: string;
    symptoms: string[];
    effects: string[];
    coping: string[];
  };
}

// Keep your full topic data exactly the same, but store it in a "raw" array
// so we can safely override ONLY the display titles for Apple review.
const libraryTopicsRaw: Topic[] = [
  // ANXIETY-RELATED
  {
    id: 'gad',
    title: 'Generalised Anxiety Disorder (GAD)',
    shortDescription:
      'Persistent worry and tension that interferes with daily life, even when there is little or nothing to provoke it.',
    imagePrompt:
      'Soft, calming illustration of a peaceful sunrise with gentle swirling translucent lines expressing worry releasing into an open sky. Pastel colors, warm lighting, serene and hopeful atmosphere. Educational, friendly, non-clinical style.',
    imageUrl:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'GAD is characterized by chronic anxiety, exaggerated worry, and tension, even when there is little or nothing to provoke it.',
      symptoms: [
        'Excessive worry',
        'Restlessness',
        'Fatigue',
        'Difficulty concentrating',
        'Muscle tension',
        'Sleep disturbances',
      ],
      effects: [
        'Difficulty maintaining relationships',
        'Reduced work performance',
        'Physical health issues',
        'Social withdrawal',
      ],
      coping: [
        'Cognitive behavioral therapy',
        'Mindfulness practices',
        'Regular exercise',
        'Stress management techniques',
        'Professional support',
      ],
    },
  },
  {
    id: 'social-anxiety',
    title: 'Social Anxiety',
    shortDescription:
      'Intense fear of social situations and being judged or negatively evaluated by others.',
    imagePrompt:
      'Gentle illustration of a person standing before soft silhouettes of others, pastel colors, gentle facial expression, supportive warm lighting. Calm, friendly, educational atmosphere. Non-threatening, peaceful style.',
    imageUrl:
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Social anxiety disorder involves overwhelming worry and self-consciousness about everyday social situations, often centered on a fear of being judged, embarrassed, or humiliated.',
      symptoms: [
        'Fear of social situations',
        'Excessive self-consciousness',
        'Physical symptoms (blushing, sweating)',
        'Avoidance of social events',
        'Difficulty making eye contact',
        'Fear of being judged',
      ],
      effects: [
        'Limited social connections',
        'Missed opportunities',
        'Isolation',
        'Impact on career advancement',
        'Low self-esteem',
      ],
      coping: [
        'Gradual exposure therapy',
        'Cognitive restructuring',
        'Social skills training',
        'Relaxation techniques',
        'Support groups',
      ],
    },
  },
  {
    id: 'panic-disorder',
    title: 'Panic Disorder & Panic Attacks',
    shortDescription:
      'Recurrent unexpected panic attacks and persistent concern about having more attacks.',
    imagePrompt:
      'Abstract soft illustration depicting sudden intensity transitioning into calm waves, peaceful pastel palette. Gentle flow from chaos to serenity. Warm, supportive, educational style. Non-scary, hopeful atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Panic disorder is characterized by sudden and repeated attacks of intense fear accompanied by physical symptoms. These attacks can occur unexpectedly and may lead to ongoing worry about future attacks.',
      symptoms: [
        'Rapid heartbeat',
        'Sweating',
        'Trembling',
        'Shortness of breath',
        'Chest pain',
        'Dizziness',
        'Fear of losing control',
        'Feeling of unreality',
      ],
      effects: [
        'Avoidance of places or situations',
        'Constant worry about attacks',
        'Impact on daily activities',
        'Development of agoraphobia',
      ],
      coping: [
        'Breathing exercises',
        'Cognitive behavioral therapy',
        'Panic-focused therapy',
        'Medication when appropriate',
        'Lifestyle modifications',
      ],
    },
  },
  {
    id: 'health-anxiety',
    title: 'Health Anxiety',
    shortDescription:
      'Excessive worry about having or developing a serious illness, despite medical reassurance.',
    imagePrompt:
      'Peaceful illustration of a person looking at subtle floating symbols of health (heart, lungs) dissolving into soft light. Non-clinical, gentle pastel style. Warm, reassuring, educational atmosphere. Calm and supportive.',
    imageUrl:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Health anxiety involves persistent worry about having a serious illness, often misinterpreting normal body sensations as signs of severe disease.',
      symptoms: [
        'Constant health worry',
        'Frequent body checking',
        'Seeking reassurance',
        'Avoiding medical information or excessive research',
        'Physical symptoms from anxiety',
        'Difficulty accepting medical reassurance',
      ],
      effects: [
        'Frequent doctor visits',
        'Strained relationships',
        'Reduced quality of life',
        'Financial burden from medical tests',
        'Increased stress',
      ],
      coping: [
        'Cognitive behavioral therapy',
        'Limiting health-related research',
        'Mindfulness practices',
        'Scheduled worry time',
        'Professional support',
      ],
    },
  },
  {
    id: 'separation-anxiety',
    title: 'Separation Anxiety',
    shortDescription:
      'Excessive fear or anxiety about separation from attachment figures or home.',
    imagePrompt:
      'Gentle illustration of two figures connected by a soft, glowing thread across peaceful clouds. Pastel colors, warm and reassuring lighting. Educational, friendly, supportive style. Calm and hopeful atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Separation anxiety involves excessive fear about being apart from loved ones or familiar environments, beyond what is expected for developmental level.',
      symptoms: [
        'Excessive distress when separated',
        'Worry about harm to loved ones',
        'Reluctance to be alone',
        'Physical symptoms when separation occurs',
        'Nightmares about separation',
        'Difficulty sleeping alone',
      ],
      effects: [
        'Difficulty with independence',
        'Impact on relationships',
        'School or work attendance issues',
        'Limited social activities',
      ],
      coping: [
        'Gradual exposure to separation',
        'Cognitive behavioral therapy',
        'Relaxation techniques',
        'Building independence skills',
        'Family therapy',
      ],
    },
  },

  // MOOD-RELATED
  {
    id: 'depression',
    title: 'Major Depressive Disorder',
    shortDescription:
      'A mood disorder causing persistent feelings of sadness and loss of interest in activities once enjoyed.',
    imagePrompt:
      'Soft pastel illustration of a figure under a small rain cloud parting into gentle light. Warm colors emerging, hopeful atmosphere. Educational, friendly, non-clinical style. Calm and supportive.',
    imageUrl:
      'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Major depression is a serious medical illness affecting how you feel, think, and handle daily activities.',
      symptoms: [
        'Persistent sadness',
        'Loss of interest',
        'Changes in appetite',
        'Sleep problems',
        'Fatigue',
        'Feelings of worthlessness',
      ],
      effects: [
        'Impaired daily functioning',
        'Relationship difficulties',
        'Physical health decline',
        'Reduced quality of life',
      ],
      coping: [
        'Therapy and counseling',
        'Medication when appropriate',
        'Regular routine',
        'Social support',
        'Self-care practices',
      ],
    },
  },
  {
    id: 'dysthymia',
    title: 'Persistent Depressive Disorder (Dysthymia)',
    shortDescription:
      'A chronic form of depression lasting for at least two years with less severe but persistent symptoms.',
    imagePrompt:
      'Gentle illustration of a figure walking through soft fog with warm light ahead. Pastel colors, peaceful journey, hopeful destination. Educational, friendly, supportive style. Calm atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Persistent depressive disorder is a continuous, long-term form of depression where mood is depressed most of the day, more days than not, for at least two years.',
      symptoms: [
        'Chronic low mood',
        'Low energy',
        'Poor concentration',
        'Feelings of hopelessness',
        'Changes in appetite',
        'Low self-esteem',
        'Difficulty making decisions',
      ],
      effects: [
        'Long-term impact on quality of life',
        'Relationship challenges',
        'Reduced productivity',
        'Increased risk of major depression',
      ],
      coping: [
        'Long-term therapy',
        'Medication management',
        'Lifestyle changes',
        'Building support networks',
        'Regular self-care',
      ],
    },
  },
  {
    id: 'bipolar-1',
    title: 'Bipolar I Disorder',
    shortDescription:
      'A condition marked by manic episodes lasting at least seven days, often alternating with depressive episodes.',
    imagePrompt:
      'Soft illustration of two overlapping silhouettes with day and night colors blending harmoniously. Pastel sunrise and moonlight merging peacefully. Educational, friendly, balanced style. Calm and supportive.',
    imageUrl:
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Bipolar I disorder is defined by manic episodes that last at least seven days or by manic symptoms severe enough to require immediate hospital care. Depressive episodes typically occur as well.',
      symptoms: [
        'Manic episodes',
        'Elevated mood',
        'Increased energy',
        'Decreased need for sleep',
        'Racing thoughts',
        'Risky behavior',
        'Depressive episodes',
      ],
      effects: [
        'Relationship strain',
        'Work or school disruption',
        'Financial problems',
        'Legal issues',
        'Hospitalization risk',
      ],
      coping: [
        'Medication management',
        'Mood stabilizers',
        'Regular sleep schedule',
        'Therapy',
        'Mood tracking',
        'Crisis planning',
      ],
    },
  },
  {
    id: 'bipolar-2',
    title: 'Bipolar II Disorder',
    shortDescription:
      'A pattern of depressive episodes and hypomanic episodes, but not full-blown manic episodes.',
    imagePrompt:
      'Gentle illustration of waves of color transitioning smoothly from warm to cool tones. Peaceful flow, pastel palette. Educational, friendly, balanced style. Calm and harmonious atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Bipolar II disorder involves a pattern of depressive episodes and hypomanic episodes, which are less severe than the manic episodes in Bipolar I disorder.',
      symptoms: [
        'Hypomanic episodes',
        'Elevated mood (less severe)',
        'Increased productivity',
        'Depressive episodes',
        'Mood swings',
        'Changes in sleep patterns',
      ],
      effects: [
        'Unpredictable mood changes',
        'Relationship challenges',
        'Work performance fluctuations',
        'Risk of major depression',
      ],
      coping: [
        'Medication management',
        'Psychotherapy',
        'Mood monitoring',
        'Regular routine',
        'Stress management',
        'Support groups',
      ],
    },
  },
  {
    id: 'cyclothymia',
    title: 'Cyclothymia',
    shortDescription:
      'A milder form of bipolar disorder with numerous periods of hypomanic and depressive symptoms.',
    imagePrompt:
      'Soft illustration of rolling hills in gentle pastel colors under a calm sky. Peaceful landscape, warm lighting. Educational, friendly, balanced style. Serene and supportive atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Cyclothymic disorder involves numerous periods of hypomanic symptoms and periods of depressive symptoms lasting for at least two years, though symptoms are less severe than bipolar disorder.',
      symptoms: [
        'Mild mood swings',
        'Periods of hypomania',
        'Periods of mild depression',
        'Unpredictable mood changes',
        'Emotional instability',
      ],
      effects: [
        'Relationship difficulties',
        'Unpredictable behavior',
        'Risk of developing bipolar disorder',
        'Impact on daily functioning',
      ],
      coping: [
        'Mood tracking',
        'Therapy',
        'Lifestyle stability',
        'Stress management',
        'Regular sleep patterns',
        'Medication if needed',
      ],
    },
  },

  // TRAUMA-RELATED
  {
    id: 'ptsd',
    title: 'Post-Traumatic Stress Disorder (PTSD)',
    shortDescription:
      'A disorder that develops in some people who have experienced a shocking, scary, or dangerous event.',
    imagePrompt:
      'Gentle illustration of a person looking at a glowing window while soft shapes fade peacefully behind. Warm light, pastel colors. Educational, friendly, hopeful style. Calm and supportive atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'PTSD can occur in people who have experienced or witnessed a traumatic event.',
      symptoms: [
        'Flashbacks',
        'Nightmares',
        'Severe anxiety',
        'Avoidance',
        'Negative thoughts',
        'Hypervigilance',
      ],
      effects: [
        'Relationship problems',
        'Work difficulties',
        'Substance abuse risk',
        'Depression and anxiety',
      ],
      coping: [
        'Trauma-focused therapy',
        'EMDR',
        'Medication',
        'Support groups',
        'Grounding techniques',
      ],
    },
  },
  {
    id: 'complex-ptsd',
    title: 'Complex PTSD',
    shortDescription:
      'A condition resulting from prolonged, repeated trauma, often involving interpersonal relationships.',
    imagePrompt:
      'Soft illustration of a figure emerging from layered, gentle shadows into warm light. Pastel colors, peaceful transition. Educational, friendly, hopeful style. Calm and supportive atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Complex PTSD develops from prolonged or repeated trauma, often in situations where escape is difficult or impossible, such as childhood abuse or domestic violence.',
      symptoms: [
        'Difficulty regulating emotions',
        'Negative self-perception',
        'Relationship difficulties',
        'Flashbacks',
        'Dissociation',
        'Loss of sense of self',
        'Difficulty trusting others',
      ],
      effects: [
        'Chronic relationship problems',
        'Identity issues',
        'Emotional dysregulation',
        'Difficulty with intimacy',
        'Self-destructive behavior',
      ],
      coping: [
        'Trauma-focused therapy',
        'DBT skills',
        'Building safety',
        'Emotion regulation techniques',
        'Long-term therapeutic support',
      ],
    },
  },
  {
    id: 'childhood-trauma',
    title: 'Childhood Trauma',
    shortDescription:
      'The lasting impact of distressing or harmful experiences during childhood years.',
    imagePrompt:
      'Gentle illustration of a small tree growing strong with protective, nurturing light around it. Pastel colors, warm and supportive atmosphere. Educational, friendly, hopeful style. Calm and peaceful.',
    imageUrl:
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Childhood trauma refers to experiences during childhood that are emotionally painful or distressing, which often have lasting effects into adulthood.',
      symptoms: [
        'Difficulty trusting others',
        'Emotional regulation challenges',
        'Relationship patterns',
        'Low self-worth',
        'Anxiety or depression',
        'Hypervigilance',
      ],
      effects: [
        'Impact on adult relationships',
        'Mental health challenges',
        'Physical health issues',
        'Difficulty with emotional intimacy',
      ],
      coping: [
        'Trauma therapy',
        'Inner child work',
        'Building secure attachments',
        'Self-compassion practices',
        'Support groups',
      ],
    },
  },
  {
    id: 'emotional-neglect',
    title: 'Emotional Neglect',
    shortDescription:
      'The experience of not having emotional needs met, particularly during childhood.',
    imagePrompt:
      'Gentle illustration of a caring hand reaching toward a small, glowing heart. Soft pastel colors, warm and nurturing light. Educational, friendly, supportive style. Calm and compassionate atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Emotional neglect occurs when emotional needs are consistently unmet, often leaving individuals feeling invisible or unimportant.',
      symptoms: [
        'Difficulty identifying emotions',
        'Feeling empty',
        'Low self-worth',
        'Difficulty asking for help',
        'Feeling disconnected',
        'Self-reliance to a fault',
      ],
      effects: [
        'Relationship difficulties',
        'Emotional numbness',
        'Difficulty with intimacy',
        'Chronic feelings of loneliness',
      ],
      coping: [
        'Therapy focused on emotional awareness',
        'Learning to identify needs',
        'Building emotional vocabulary',
        'Self-compassion',
        'Connecting with supportive people',
      ],
    },
  },

  // OBSESSIONS / COMPULSIONS
  {
    id: 'ocd',
    title: 'Obsessive-Compulsive Disorder (OCD)',
    shortDescription:
      'A disorder characterized by unreasonable thoughts and fears (obsessions) that lead to repetitive behaviors (compulsions).',
    imagePrompt:
      'Soft illustration of hands gently aligning objects into symmetrical shapes. Pastel colors, calm and organized atmosphere. Educational, friendly, non-judgmental style. Peaceful and supportive.',
    imageUrl:
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'OCD features a pattern of unwanted thoughts and fears that lead you to do repetitive behaviors.',
      symptoms: [
        'Intrusive thoughts',
        'Compulsive behaviors',
        'Excessive cleaning',
        'Checking rituals',
        'Counting',
        'Ordering',
      ],
      effects: [
        'Time-consuming rituals',
        'Distress and anxiety',
        'Impaired functioning',
        'Social isolation',
      ],
      coping: [
        'Exposure and response prevention',
        'Cognitive behavioral therapy',
        'Medication',
        'Support groups',
        'Stress management',
      ],
    },
  },
  {
    id: 'pure-o',
    title: 'Pure-O (Intrusive Thoughts)',
    shortDescription:
      'A form of OCD characterized primarily by intrusive, unwanted thoughts without visible compulsions.',
    imagePrompt:
      'Calm illustration of a peaceful mind with thought bubbles gently floating away like soft clouds. Pastel colors, serene sky. Educational, friendly, reassuring style. Calm and supportive atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'Pure-O refers to OCD where compulsions are primarily mental rather than physical. Individuals experience distressing intrusive thoughts but may not have obvious external rituals.',
      symptoms: [
        'Unwanted intrusive thoughts',
        'Mental compulsions',
        'Excessive rumination',
        'Thought suppression attempts',
        'Anxiety about thoughts',
        'Mental checking',
      ],
      effects: [
        'Significant distress',
        'Shame about thoughts',
        'Avoidance behaviors',
        'Impact on daily functioning',
        'Difficulty concentrating',
      ],
      coping: [
        'Exposure and response prevention',
        'Accepting thoughts without judgment',
        'Mindfulness',
        'Cognitive therapy',
        'Understanding thoughts are not actions',
      ],
    },
  },

  // PERSONALITY & RELATIONAL
  {
    id: 'bpd',
    title: 'Borderline Personality Disorder (BPD)',
    shortDescription:
      'A mental health disorder that impacts the way you think and feel about yourself and others, causing problems in everyday life.',
    imagePrompt:
      'Gentle illustration of a heart made of puzzle pieces merging together harmoniously. Soft pastel colors, warm light. Educational, friendly, hopeful style. Calm and supportive atmosphere.',
    imageUrl:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=600&fit=crop&q=80',
    content: {
      overview:
        'BPD is characterized by ongoing instability in moods, behavior, self-image, and functioning.',
      symptoms: [
        'Intense emotions',
        'Fear of abandonment',
        'Unstable relationships',
        'Impulsive actions',
        'Self-harm',
        'Identity disturbance',
      ],
      effects: [
        'Relationship difficulties',
        'Employment challenges',
        'Legal problems',
        'Self-destructive behavior',
      ],
      coping: [
        'Dialectical behavior therapy',
        'Emotion regulation skills',
        'Mindfulness',
        'Crisis management',
        'Support networks',
      ],
    },
  },

  // ... KEEP THE REST OF YOUR TOPICS EXACTLY AS YOU ALREADY HAVE THEM ...
  // (Paste the remainder of your existing topics here unchanged.)
];

// Apple-safe display titles (keeps IDs stable; only changes what users see)
const APPLE_SAFE_TITLE_BY_ID: Record<string, string> = {
  // Anxiety
  gad: 'Understanding Persistent Worry (GAD)',
  'social-anxiety': 'Understanding Social Anxiety',
  'panic-disorder': 'Understanding Panic & Panic Attacks',
  'health-anxiety': 'Understanding Health Anxiety',
  'separation-anxiety': 'Understanding Separation Anxiety',

  // Mood
  depression: 'Understanding Depression',
  dysthymia: 'Understanding Long-Term Low Mood (Dysthymia)',
  'bipolar-1': 'Understanding Bipolar Patterns (Type 1)',
  'bipolar-2': 'Understanding Bipolar Patterns (Type 2)',
  cyclothymia: 'Understanding Mood Cycling (Cyclothymia)',

  // Trauma
  ptsd: 'Understanding Trauma Responses (PTSD)',
  'complex-ptsd': 'Understanding Complex Trauma (C-PTSD)',
  'childhood-trauma': 'Understanding Childhood Trauma',
  'emotional-neglect': 'Understanding Emotional Neglect',

  // OCD / intrusive thoughts
  ocd: 'Understanding OCD Patterns',
  'pure-o': 'Understanding Intrusive Thoughts (Pure-O)',

  // Personality / relational
  bpd: 'Understanding Emotional Intensity (BPD)',
  'narcissistic-patterns': 'Understanding Narcissistic Patterns',
  'avoidant-patterns': 'Understanding Avoidant Patterns',
  'dependent-patterns': 'Understanding Dependent Patterns',

  // Neurodevelopmental
  adhd: 'Understanding ADHD',
  'adhd-inattentive': 'Understanding ADHD (Inattentive)',
  'adhd-hyperactive': 'Understanding ADHD (Hyperactive/Impulsive)',
  'adhd-combined': 'Understanding ADHD (Combined)',
  'autism-spectrum': 'Understanding Autism Spectrum',

  // Dissociation
  'dissociation-depersonalization':
    'Understanding Dissociation & Depersonalisation',
  derealisation: 'Understanding Derealisation',

  // Eating / body image
  'disordered-eating': 'Understanding Disordered Eating',
  'body-image': 'Understanding Body Image Concerns',
  'emotional-eating': 'Understanding Emotional Eating',

  // Self
  'low-self-esteem': 'Building Self-Esteem',
  perfectionism: 'Understanding Perfectionism',
  'people-pleasing': 'Understanding People-Pleasing',
  burnout: 'Understanding Burnout',
  'compassion-fatigue': 'Understanding Compassion Fatigue',

  // Relationships / family
  'romantic-difficulties': 'Improving Romantic Relationships',
  'attachment-anxious': 'Understanding Anxious Attachment',
  'attachment-avoidant': 'Understanding Avoidant Attachment',
  'attachment-disorganised': 'Understanding Disorganised Attachment',
  'family-conflict': 'Navigating Family Conflict',
  'toxic-relationships': 'Navigating Difficult Relationships',
  'breakups-heartbreak': 'Coping With Breakups & Heartbreak',
  loneliness: 'Understanding Loneliness',

  // Work / study
  'work-stress-burnout': 'Managing Work Stress & Burnout',
  procrastination: 'Overcoming Procrastination',
  'academic-stress': 'Managing Academic Stress',

  // Grief
  'grief-bereavement': 'Understanding Grief & Bereavement',
  'ambiguous-loss': 'Understanding Ambiguous Loss',

  // Addiction / habits
  'substance-use': 'Understanding Substance Use & Recovery',
  'alcohol-misuse': 'Understanding Alcohol Misuse',
  'nicotine-dependence': 'Understanding Nicotine Dependence',
  'behavioral-addictions': 'Understanding Behavioural Addictions',
};

// Export the same name as before so nothing else breaks.
// Only the visible title changes.
export const libraryTopics: Topic[] = libraryTopicsRaw.map((t) => ({
  ...t,
  title: APPLE_SAFE_TITLE_BY_ID[t.id] ?? t.title,
}));