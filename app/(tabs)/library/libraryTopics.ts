
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

export const libraryTopics: Topic[] = [
  // ANXIETY-RELATED
  {
    id: 'gad',
    title: 'Persistent Worry & Tension',
    shortDescription: 'Ongoing worry and tension that interferes with daily life, even when there is little or nothing to provoke it.',
    imagePrompt: 'Soft, calming illustration of a peaceful sunrise with gentle swirling translucent lines expressing worry releasing into an open sky. Pastel colors, warm lighting, serene and hopeful atmosphere. Educational, friendly, non-clinical style.',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Persistent worry and tension (often called Generalised Anxiety Disorder or GAD) is characterized by chronic anxiety, exaggerated worry, and tension, even when there is little or nothing to provoke it.',
      symptoms: ['Excessive worry', 'Restlessness', 'Fatigue', 'Difficulty concentrating', 'Muscle tension', 'Sleep disturbances'],
      effects: ['Difficulty maintaining relationships', 'Reduced work performance', 'Physical health issues', 'Social withdrawal'],
      coping: ['Cognitive behavioral therapy', 'Mindfulness practices', 'Regular exercise', 'Stress management techniques', 'Professional support'],
    },
  },
  {
    id: 'social-anxiety',
    title: 'Fear of Social Situations',
    shortDescription: 'Intense fear of social situations and being judged or negatively evaluated by others.',
    imagePrompt: 'Gentle illustration of a person standing before soft silhouettes of others, pastel colors, gentle facial expression, supportive warm lighting. Calm, friendly, educational atmosphere. Non-threatening, peaceful style.',
    imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Fear of social situations (social anxiety) involves overwhelming worry and self-consciousness about everyday social situations, often centered on a fear of being judged, embarrassed, or humiliated.',
      symptoms: ['Fear of social situations', 'Excessive self-consciousness', 'Physical symptoms (blushing, sweating)', 'Avoidance of social events', 'Difficulty making eye contact', 'Fear of being judged'],
      effects: ['Limited social connections', 'Missed opportunities', 'Isolation', 'Impact on career advancement', 'Low self-esteem'],
      coping: ['Gradual exposure therapy', 'Cognitive restructuring', 'Social skills training', 'Relaxation techniques', 'Support groups'],
    },
  },
  {
    id: 'panic-disorder',
    title: 'Sudden Intense Fear & Panic',
    shortDescription: 'Recurrent unexpected episodes of intense fear and persistent concern about having more attacks.',
    imagePrompt: 'Abstract soft illustration depicting sudden intensity transitioning into calm waves, peaceful pastel palette. Gentle flow from chaos to serenity. Warm, supportive, educational style. Non-scary, hopeful atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Sudden intense fear and panic (panic disorder) is characterized by sudden and repeated attacks of intense fear accompanied by physical symptoms. These attacks can occur unexpectedly and may lead to ongoing worry about future attacks.',
      symptoms: ['Rapid heartbeat', 'Sweating', 'Trembling', 'Shortness of breath', 'Chest pain', 'Dizziness', 'Fear of losing control', 'Feeling of unreality'],
      effects: ['Avoidance of places or situations', 'Constant worry about attacks', 'Impact on daily activities', 'Development of agoraphobia'],
      coping: ['Breathing exercises', 'Cognitive behavioral therapy', 'Panic-focused therapy', 'Medication when appropriate', 'Lifestyle modifications'],
    },
  },
  {
    id: 'health-anxiety',
    title: 'Excessive Worry About Health',
    shortDescription: 'Ongoing worry about having or developing a serious illness, despite medical reassurance.',
    imagePrompt: 'Peaceful illustration of a person looking at subtle floating symbols of health (heart, lungs) dissolving into soft light. Non-clinical, gentle pastel style. Warm, reassuring, educational atmosphere. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Excessive worry about health (health anxiety) involves persistent worry about having a serious illness, often misinterpreting normal body sensations as signs of severe disease.',
      symptoms: ['Constant health worry', 'Frequent body checking', 'Seeking reassurance', 'Avoiding medical information or excessive research', 'Physical symptoms from anxiety', 'Difficulty accepting medical reassurance'],
      effects: ['Frequent doctor visits', 'Strained relationships', 'Reduced quality of life', 'Financial burden from medical tests', 'Increased stress'],
      coping: ['Cognitive behavioral therapy', 'Limiting health-related research', 'Mindfulness practices', 'Scheduled worry time', 'Professional support'],
    },
  },
  {
    id: 'separation-anxiety',
    title: 'Fear of Being Apart from Loved Ones',
    shortDescription: 'Excessive fear or anxiety about separation from attachment figures or home.',
    imagePrompt: 'Gentle illustration of two figures connected by a soft, glowing thread across peaceful clouds. Pastel colors, warm and reassuring lighting. Educational, friendly, supportive style. Calm and hopeful atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Fear of being apart from loved ones (separation anxiety) involves excessive fear about being apart from loved ones or familiar environments, beyond what is expected for developmental level.',
      symptoms: ['Excessive distress when separated', 'Worry about harm to loved ones', 'Reluctance to be alone', 'Physical symptoms when separation occurs', 'Nightmares about separation', 'Difficulty sleeping alone'],
      effects: ['Difficulty with independence', 'Impact on relationships', 'School or work attendance issues', 'Limited social activities'],
      coping: ['Gradual exposure to separation', 'Cognitive behavioral therapy', 'Relaxation techniques', 'Building independence skills', 'Family therapy'],
    },
  },

  // MOOD-RELATED
  {
    id: 'depression',
    title: 'Low Mood & Emotional Numbness',
    shortDescription: 'Ongoing feelings of sadness, emptiness, and loss of interest in activities once enjoyed.',
    imagePrompt: 'Soft pastel illustration of a figure under a small rain cloud parting into gentle light. Warm colors emerging, hopeful atmosphere. Educational, friendly, non-clinical style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Low mood and emotional numbness (depression) is a serious condition affecting how you feel, think, and handle daily activities, characterized by persistent sadness and loss of interest.',
      symptoms: ['Persistent sadness', 'Loss of interest', 'Changes in appetite', 'Sleep problems', 'Fatigue', 'Feelings of worthlessness'],
      effects: ['Impaired daily functioning', 'Relationship difficulties', 'Physical health decline', 'Reduced quality of life'],
      coping: ['Therapy and counseling', 'Medication when appropriate', 'Regular routine', 'Social support', 'Self-care practices'],
    },
  },
  {
    id: 'dysthymia',
    title: 'Long-Term Low Mood',
    shortDescription: 'A chronic form of low mood lasting for at least two years with persistent but less severe symptoms.',
    imagePrompt: 'Gentle illustration of a figure walking through soft fog with warm light ahead. Pastel colors, peaceful journey, hopeful destination. Educational, friendly, supportive style. Calm atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Long-term low mood (persistent depressive disorder or dysthymia) is a continuous, long-term form of depression where mood is depressed most of the day, more days than not, for at least two years.',
      symptoms: ['Chronic low mood', 'Low energy', 'Poor concentration', 'Feelings of hopelessness', 'Changes in appetite', 'Low self-esteem', 'Difficulty making decisions'],
      effects: ['Long-term impact on quality of life', 'Relationship challenges', 'Reduced productivity', 'Increased risk of major depression'],
      coping: ['Long-term therapy', 'Medication management', 'Lifestyle changes', 'Building support networks', 'Regular self-care'],
    },
  },
  {
    id: 'bipolar-1',
    title: 'Intense Mood Highs & Lows',
    shortDescription: 'A pattern marked by intense high-energy episodes lasting at least seven days, often alternating with low mood.',
    imagePrompt: 'Soft illustration of two overlapping silhouettes with day and night colors blending harmoniously. Pastel sunrise and moonlight merging peacefully. Educational, friendly, balanced style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Intense mood highs and lows (Bipolar I disorder) is defined by manic episodes that last at least seven days or by manic symptoms severe enough to require immediate hospital care. Depressive episodes typically occur as well.',
      symptoms: ['Manic episodes', 'Elevated mood', 'Increased energy', 'Decreased need for sleep', 'Racing thoughts', 'Risky behavior', 'Depressive episodes'],
      effects: ['Relationship strain', 'Work or school disruption', 'Financial problems', 'Legal issues', 'Hospitalization risk'],
      coping: ['Medication management', 'Mood stabilizers', 'Regular sleep schedule', 'Therapy', 'Mood tracking', 'Crisis planning'],
    },
  },
  {
    id: 'bipolar-2',
    title: 'Mood Swings Between Low & Elevated',
    shortDescription: 'A pattern of low mood episodes and elevated mood episodes, but not full-blown manic episodes.',
    imagePrompt: 'Gentle illustration of waves of color transitioning smoothly from warm to cool tones. Peaceful flow, pastel palette. Educational, friendly, balanced style. Calm and harmonious atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Mood swings between low and elevated (Bipolar II disorder) involves a pattern of depressive episodes and hypomanic episodes, which are less severe than the manic episodes in Bipolar I disorder.',
      symptoms: ['Hypomanic episodes', 'Elevated mood (less severe)', 'Increased productivity', 'Depressive episodes', 'Mood swings', 'Changes in sleep patterns'],
      effects: ['Unpredictable mood changes', 'Relationship challenges', 'Work performance fluctuations', 'Risk of major depression'],
      coping: ['Medication management', 'Psychotherapy', 'Mood monitoring', 'Regular routine', 'Stress management', 'Support groups'],
    },
  },
  {
    id: 'cyclothymia',
    title: 'Frequent Mood Fluctuations',
    shortDescription: 'Numerous periods of elevated and low mood symptoms that are milder but persistent.',
    imagePrompt: 'Soft illustration of rolling hills in gentle pastel colors under a calm sky. Peaceful landscape, warm lighting. Educational, friendly, balanced style. Serene and supportive atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Frequent mood fluctuations (cyclothymia) involves numerous periods of hypomanic symptoms and periods of depressive symptoms lasting for at least two years, though symptoms are less severe than bipolar disorder.',
      symptoms: ['Mild mood swings', 'Periods of hypomania', 'Periods of mild depression', 'Unpredictable mood changes', 'Emotional instability'],
      effects: ['Relationship difficulties', 'Unpredictable behavior', 'Risk of developing bipolar disorder', 'Impact on daily functioning'],
      coping: ['Mood tracking', 'Therapy', 'Lifestyle stability', 'Stress management', 'Regular sleep patterns', 'Medication if needed'],
    },
  },

  // TRAUMA-RELATED
  {
    id: 'ptsd',
    title: 'Living with Traumatic Memories',
    shortDescription: 'Ongoing impact from experiencing or witnessing a shocking, scary, or dangerous event.',
    imagePrompt: 'Gentle illustration of a person looking at a glowing window while soft shapes fade peacefully behind. Warm light, pastel colors. Educational, friendly, hopeful style. Calm and supportive atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Living with traumatic memories (PTSD) can occur in people who have experienced or witnessed a traumatic event.',
      symptoms: ['Flashbacks', 'Nightmares', 'Severe anxiety', 'Avoidance', 'Negative thoughts', 'Hypervigilance'],
      effects: ['Relationship problems', 'Work difficulties', 'Substance abuse risk', 'Depression and anxiety'],
      coping: ['Trauma-focused therapy', 'EMDR', 'Medication', 'Support groups', 'Grounding techniques'],
    },
  },
  {
    id: 'complex-ptsd',
    title: 'Impact of Prolonged Trauma',
    shortDescription: 'The lasting effects of prolonged, repeated trauma, often involving interpersonal relationships.',
    imagePrompt: 'Soft illustration of a figure emerging from layered, gentle shadows into warm light. Pastel colors, peaceful transition. Educational, friendly, hopeful style. Calm and supportive atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Impact of prolonged trauma (Complex PTSD) develops from prolonged or repeated trauma, often in situations where escape is difficult or impossible, such as childhood abuse or domestic violence.',
      symptoms: ['Difficulty regulating emotions', 'Negative self-perception', 'Relationship difficulties', 'Flashbacks', 'Dissociation', 'Loss of sense of self', 'Difficulty trusting others'],
      effects: ['Chronic relationship problems', 'Identity issues', 'Emotional dysregulation', 'Difficulty with intimacy', 'Self-destructive behavior'],
      coping: ['Trauma-focused therapy', 'DBT skills', 'Building safety', 'Emotion regulation techniques', 'Long-term therapeutic support'],
    },
  },
  {
    id: 'childhood-trauma',
    title: 'Healing from Childhood Experiences',
    shortDescription: 'The lasting impact of distressing or harmful experiences during childhood years.',
    imagePrompt: 'Gentle illustration of a small tree growing strong with protective, nurturing light around it. Pastel colors, warm and supportive atmosphere. Educational, friendly, hopeful style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Healing from childhood experiences refers to addressing experiences during childhood that were emotionally painful or distressing, which often have lasting effects into adulthood.',
      symptoms: ['Difficulty trusting others', 'Emotional regulation challenges', 'Relationship patterns', 'Low self-worth', 'Anxiety or depression', 'Hypervigilance'],
      effects: ['Impact on adult relationships', 'Mental health challenges', 'Physical health issues', 'Difficulty with emotional intimacy'],
      coping: ['Trauma therapy', 'Inner child work', 'Building secure attachments', 'Self-compassion practices', 'Support groups'],
    },
  },
  {
    id: 'emotional-neglect',
    title: 'Growing Up Emotionally Unseen',
    shortDescription: 'The experience of not having emotional needs met, particularly during childhood.',
    imagePrompt: 'Gentle illustration of a caring hand reaching toward a small, glowing heart. Soft pastel colors, warm and nurturing light. Educational, friendly, supportive style. Calm and compassionate atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Growing up emotionally unseen (emotional neglect) occurs when emotional needs are consistently unmet, often leaving individuals feeling invisible or unimportant.',
      symptoms: ['Difficulty identifying emotions', 'Feeling empty', 'Low self-worth', 'Difficulty asking for help', 'Feeling disconnected', 'Self-reliance to a fault'],
      effects: ['Relationship difficulties', 'Emotional numbness', 'Difficulty with intimacy', 'Chronic feelings of loneliness'],
      coping: ['Therapy focused on emotional awareness', 'Learning to identify needs', 'Building emotional vocabulary', 'Self-compassion', 'Connecting with supportive people'],
    },
  },

  // OBSESSIONS / COMPULSIONS
  {
    id: 'ocd',
    title: 'Intrusive Thoughts & Repetitive Behaviors',
    shortDescription: 'Experiencing unreasonable thoughts and fears that lead to repetitive behaviors.',
    imagePrompt: 'Soft illustration of hands gently aligning objects into symmetrical shapes. Pastel colors, calm and organized atmosphere. Educational, friendly, non-judgmental style. Peaceful and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Intrusive thoughts and repetitive behaviors (OCD) features a pattern of unwanted thoughts and fears that lead you to do repetitive behaviors.',
      symptoms: ['Intrusive thoughts', 'Compulsive behaviors', 'Excessive cleaning', 'Checking rituals', 'Counting', 'Ordering'],
      effects: ['Time-consuming rituals', 'Distress and anxiety', 'Impaired functioning', 'Social isolation'],
      coping: ['Exposure and response prevention', 'Cognitive behavioral therapy', 'Medication', 'Support groups', 'Stress management'],
    },
  },
  {
    id: 'pure-o',
    title: 'Unwanted Intrusive Thoughts',
    shortDescription: 'Experiencing distressing intrusive thoughts without visible compulsions.',
    imagePrompt: 'Calm illustration of a peaceful mind with thought bubbles gently floating away like soft clouds. Pastel colors, serene sky. Educational, friendly, reassuring style. Calm and supportive atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Unwanted intrusive thoughts (Pure-O) refers to experiencing distressing intrusive thoughts where compulsions are primarily mental rather than physical. Individuals experience distressing intrusive thoughts but may not have obvious external rituals.',
      symptoms: ['Unwanted intrusive thoughts', 'Mental compulsions', 'Excessive rumination', 'Thought suppression attempts', 'Anxiety about thoughts', 'Mental checking'],
      effects: ['Significant distress', 'Shame about thoughts', 'Avoidance behaviors', 'Impact on daily functioning', 'Difficulty concentrating'],
      coping: ['Exposure and response prevention', 'Accepting thoughts without judgment', 'Mindfulness', 'Cognitive therapy', 'Understanding thoughts are not actions'],
    },
  },

  // PERSONALITY & RELATIONAL
  {
    id: 'bpd',
    title: 'Intense Emotions & Relationship Patterns',
    shortDescription: 'Experiencing intense emotions and challenges in relationships that impact daily life.',
    imagePrompt: 'Gentle illustration of a heart made of puzzle pieces merging together harmoniously. Soft pastel colors, warm light. Educational, friendly, hopeful style. Calm and supportive atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Intense emotions and relationship patterns (BPD) is characterized by ongoing instability in moods, behavior, self-image, and functioning.',
      symptoms: ['Intense emotions', 'Fear of abandonment', 'Unstable relationships', 'Impulsive actions', 'Self-harm', 'Identity disturbance'],
      effects: ['Relationship difficulties', 'Employment challenges', 'Legal problems', 'Self-destructive behavior'],
      coping: ['Dialectical behavior therapy', 'Emotion regulation skills', 'Mindfulness', 'Crisis management', 'Support networks'],
    },
  },
  {
    id: 'narcissistic-patterns',
    title: 'Self-Focused Relationship Patterns',
    shortDescription: 'Patterns of grandiosity, need for admiration, and difficulty with empathy that impact relationships.',
    imagePrompt: 'Soft illustration of a mirror reflecting balanced, gentle light in pastel tones. Calm and harmonious atmosphere. Educational, friendly, non-judgmental style. Peaceful and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Self-focused relationship patterns (narcissistic patterns) involve a pervasive pattern of grandiosity, need for admiration, and lack of empathy. Understanding these patterns can help in relationships and personal growth.',
      symptoms: ['Grandiose sense of self', 'Need for admiration', 'Lack of empathy', 'Sense of entitlement', 'Exploitative behavior', 'Difficulty with criticism'],
      effects: ['Relationship difficulties', 'Workplace conflicts', 'Emotional distress in others', 'Difficulty maintaining long-term relationships'],
      coping: ['Therapy focused on empathy', 'Self-reflection', 'Understanding impact on others', 'Building genuine self-esteem', 'Developing emotional awareness'],
    },
  },
  {
    id: 'avoidant-patterns',
    title: 'Fear of Rejection & Social Withdrawal',
    shortDescription: 'Patterns of social inhibition, feelings of inadequacy, and hypersensitivity to criticism.',
    imagePrompt: 'Gentle illustration of a figure stepping out from behind a soft curtain toward warm, welcoming light. Pastel colors, hopeful atmosphere. Educational, friendly, encouraging style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Fear of rejection and social withdrawal (avoidant patterns) involve pervasive social inhibition, feelings of inadequacy, and extreme sensitivity to negative evaluation.',
      symptoms: ['Avoidance of social situations', 'Fear of criticism', 'Feelings of inadequacy', 'Reluctance to take risks', 'Preoccupation with rejection', 'Low self-esteem'],
      effects: ['Limited social connections', 'Missed opportunities', 'Isolation', 'Career limitations', 'Loneliness'],
      coping: ['Gradual exposure therapy', 'Building self-esteem', 'Cognitive restructuring', 'Social skills training', 'Supportive therapy'],
    },
  },
  {
    id: 'dependent-patterns',
    title: 'Difficulty with Independence',
    shortDescription: 'Patterns of excessive need to be taken care of, leading to submissive and clinging behavior.',
    imagePrompt: 'Gentle illustration of a person standing independently with soft, supportive light around them. Pastel colors, warm and empowering atmosphere. Educational, friendly, encouraging style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Difficulty with independence (dependent patterns) involves an excessive need to be taken care of, leading to submissive, clinging behavior and fears of separation.',
      symptoms: ['Difficulty making decisions', 'Need for reassurance', 'Fear of being alone', 'Difficulty disagreeing', 'Urgently seeking new relationships when one ends', 'Submissive behavior'],
      effects: ['Unhealthy relationships', 'Difficulty with independence', 'Vulnerability to exploitation', 'Low self-confidence'],
      coping: ['Building independence skills', 'Assertiveness training', 'Cognitive therapy', 'Developing self-reliance', 'Healthy boundary setting'],
    },
  },

  // NEURODEVELOPMENTAL
  {
    id: 'adhd',
    title: 'Difficulty with Focus & Restlessness',
    shortDescription: 'Challenges with attention, hyperactivity, and impulsivity that interfere with daily functioning.',
    imagePrompt: 'Playful illustration of a brain with orbiting icons organized into gentle paths. Soft pastel colors, dynamic yet calm. Educational, friendly, positive style. Supportive and encouraging atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Difficulty with focus and restlessness (ADHD) is one of the most common neurodevelopmental differences, often lasting into adulthood.',
      symptoms: ['Difficulty focusing', 'Hyperactivity', 'Impulsiveness', 'Disorganization', 'Time management issues', 'Forgetfulness'],
      effects: ['Academic challenges', 'Work difficulties', 'Relationship problems', 'Low self-esteem'],
      coping: ['Medication', 'Behavioral therapy', 'Organization strategies', 'Time management tools', 'Exercise and routine'],
    },
  },
  {
    id: 'adhd-inattentive',
    title: 'Difficulty Sustaining Attention',
    shortDescription: 'Challenges primarily with maintaining focus and organization, without significant hyperactivity.',
    imagePrompt: 'Peaceful illustration of a figure organizing floating thoughts into gentle patterns. Soft pastel colors, calm and focused atmosphere. Educational, friendly, supportive style. Serene and encouraging.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Difficulty sustaining attention (inattentive type ADHD) involves primarily symptoms of inattention, such as difficulty focusing, forgetfulness, and disorganization, without prominent hyperactivity.',
      symptoms: ['Difficulty sustaining attention', 'Easily distracted', 'Forgetfulness', 'Losing things', 'Difficulty organizing', 'Avoiding tasks requiring sustained focus'],
      effects: ['Academic or work underperformance', 'Missed deadlines', 'Disorganization', 'Feeling overwhelmed'],
      coping: ['External organization systems', 'Breaking tasks into steps', 'Timers and reminders', 'Medication', 'Cognitive strategies'],
    },
  },
  {
    id: 'adhd-hyperactive',
    title: 'Restlessness & Impulsivity',
    shortDescription: 'Challenges primarily with hyperactivity and impulsivity, with less prominent inattention.',
    imagePrompt: 'Dynamic illustration of energy flowing into organized, purposeful channels. Soft pastel colors, balanced movement. Educational, friendly, positive style. Calm yet energetic atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Restlessness and impulsivity (hyperactive-impulsive type ADHD) involves primarily symptoms of hyperactivity and impulsivity, such as fidgeting, difficulty staying seated, and acting without thinking.',
      symptoms: ['Fidgeting', 'Difficulty staying seated', 'Excessive talking', 'Interrupting others', 'Difficulty waiting turn', 'Acting without thinking'],
      effects: ['Social difficulties', 'Impulsive decisions', 'Relationship challenges', 'Risk-taking behavior'],
      coping: ['Physical activity', 'Mindfulness practices', 'Impulse control strategies', 'Medication', 'Behavioral therapy'],
    },
  },
  {
    id: 'adhd-combined',
    title: 'Focus & Restlessness Challenges',
    shortDescription: 'Significant challenges with both attention and hyperactivity-impulsivity.',
    imagePrompt: 'Balanced illustration of a figure with organized energy and focused calm. Soft pastel colors, harmonious atmosphere. Educational, friendly, supportive style. Peaceful yet dynamic.',
    imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Focus and restlessness challenges (combined type ADHD) involves significant symptoms of both inattention and hyperactivity-impulsivity, making it the most common presentation of ADHD.',
      symptoms: ['Inattention', 'Hyperactivity', 'Impulsivity', 'Disorganization', 'Restlessness', 'Difficulty with focus and sitting still'],
      effects: ['Multiple areas of life affected', 'Academic and work challenges', 'Relationship difficulties', 'Low self-esteem'],
      coping: ['Comprehensive treatment approach', 'Medication', 'Behavioral strategies', 'Organization systems', 'Exercise', 'Therapy'],
    },
  },
  {
    id: 'autism-spectrum',
    title: 'Unique Ways of Experiencing the World',
    shortDescription: 'Different ways of communicating, interacting socially, and experiencing the world.',
    imagePrompt: 'Unique, beautiful illustration of interconnected shapes forming a gentle pattern in soft colors. Pastel palette, harmonious design. Educational, friendly, celebrating diversity style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Unique ways of experiencing the world (autism spectrum) is a developmental difference that affects how people communicate, interact socially, and experience the world. It presents differently in each individual.',
      symptoms: ['Differences in social communication', 'Repetitive behaviors', 'Sensory sensitivities', 'Focused interests', 'Preference for routine', 'Unique strengths and challenges'],
      effects: ['Social interaction differences', 'Communication challenges', 'Sensory overwhelm', 'Unique perspectives and abilities'],
      coping: ['Understanding individual needs', 'Sensory accommodations', 'Clear communication', 'Respecting differences', 'Building on strengths', 'Supportive environments'],
    },
  },

  // DISSOCIATION
  {
    id: 'dissociation-depersonalization',
    title: 'Feeling Detached from Yourself',
    shortDescription: 'Feeling disconnected from oneself, as if observing from outside one&apos;s body or mind.',
    imagePrompt: 'Gentle illustration of a translucent figure reconnecting with soft, grounding light. Pastel colors, warm and reassuring atmosphere. Educational, friendly, supportive style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Feeling detached from yourself (depersonalization) involves feeling detached from oneself, experiencing a sense of unreality about one&apos;s own existence, thoughts, or body.',
      symptoms: ['Feeling detached from self', 'Observing self from outside', 'Emotional numbness', 'Feeling robotic', 'Distorted sense of time', 'Feeling unreal'],
      effects: ['Distress and anxiety', 'Difficulty connecting with others', 'Impact on daily functioning', 'Feeling disconnected from life'],
      coping: ['Grounding techniques', 'Mindfulness', 'Therapy', 'Reducing stress', 'Sensory awareness exercises', 'Understanding triggers'],
    },
  },
  {
    id: 'derealisation',
    title: 'Feeling the World is Unreal',
    shortDescription: 'Feeling that the world around you is unreal, dreamlike, or distorted.',
    imagePrompt: 'Gentle illustration of a person touching solid, real objects that glow with reassuring warmth. Soft pastel colors, grounding atmosphere. Educational, friendly, supportive style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Feeling the world is unreal (derealization) involves feeling that the external world is strange, unreal, or dreamlike, as if viewing it through a fog or from a distance.',
      symptoms: ['World feels unreal', 'Surroundings seem distorted', 'Visual distortions', 'Feeling in a dream', 'Emotional detachment from environment', 'Time distortion'],
      effects: ['Anxiety about reality', 'Difficulty functioning', 'Social withdrawal', 'Fear of losing touch with reality'],
      coping: ['Grounding techniques', 'Focusing on senses', 'Therapy', 'Stress reduction', 'Reality testing', 'Understanding it&apos;s temporary'],
    },
  },

  // EATING & BODY IMAGE
  {
    id: 'disordered-eating',
    title: 'Struggling with Food & Eating',
    shortDescription: 'Irregular eating patterns and unhealthy relationships with food.',
    imagePrompt: 'Gentle illustration of a balanced plate with nourishing colors and soft light. Pastel tones, warm and peaceful atmosphere. Educational, friendly, non-judgmental style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Struggling with food and eating (disordered eating) refers to a range of irregular eating behaviors that may not warrant a diagnosis of a specific eating disorder but still negatively impact health and wellbeing.',
      symptoms: ['Restrictive eating', 'Binge eating', 'Chronic dieting', 'Food preoccupation', 'Guilt around eating', 'Rigid food rules'],
      effects: ['Nutritional deficiencies', 'Physical health issues', 'Emotional distress', 'Social impact', 'Body image concerns'],
      coping: ['Intuitive eating', 'Therapy', 'Nutritional counseling', 'Challenging food rules', 'Self-compassion', 'Addressing underlying issues'],
    },
  },
  {
    id: 'body-image',
    title: 'Negative Feelings About Your Body',
    shortDescription: 'Persistent negative thoughts and feelings about one&apos;s physical appearance that impact wellbeing.',
    imagePrompt: 'Gentle illustration of a figure looking at a kind, accepting reflection in soft light. Pastel colors, warm and compassionate atmosphere. Educational, friendly, supportive style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Negative feelings about your body (body image issues) involve persistent negative thoughts and feelings about one&apos;s appearance, which can significantly impact mental health and quality of life.',
      symptoms: ['Negative self-perception', 'Constant comparison', 'Avoidance of mirrors or photos', 'Preoccupation with appearance', 'Body checking', 'Distorted view of body'],
      effects: ['Low self-esteem', 'Social anxiety', 'Depression', 'Avoidance of activities', 'Relationship difficulties'],
      coping: ['Cognitive restructuring', 'Body neutrality practices', 'Media literacy', 'Self-compassion', 'Therapy', 'Focusing on function over form'],
    },
  },
  {
    id: 'emotional-eating',
    title: 'Using Food to Cope with Emotions',
    shortDescription: 'Turning to food to manage emotions rather than to satisfy physical hunger.',
    imagePrompt: 'Gentle illustration of a heart being nourished by warm, comforting light. Soft pastel colors, caring atmosphere. Educational, friendly, compassionate style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Using food to cope with emotions (emotional eating) involves eating in response to emotions rather than physical hunger, often as a way to cope with stress, sadness, or other feelings.',
      symptoms: ['Eating when not hungry', 'Eating in response to emotions', 'Craving specific comfort foods', 'Eating to feel better', 'Guilt after eating', 'Loss of control around food'],
      effects: ['Weight fluctuations', 'Guilt and shame', 'Not addressing underlying emotions', 'Physical discomfort', 'Cycle of emotional eating'],
      coping: ['Identifying triggers', 'Alternative coping strategies', 'Mindful eating', 'Emotional awareness', 'Therapy', 'Self-compassion'],
    },
  },

  // SELF-RELATED
  {
    id: 'low-self-esteem',
    title: 'Struggling with Self-Worth',
    shortDescription: 'A negative view of oneself, characterized by lack of confidence and feelings of inadequacy.',
    imagePrompt: 'Gentle illustration of a small light growing brighter and stronger within a figure. Soft pastel colors, empowering atmosphere. Educational, friendly, encouraging style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Struggling with self-worth (low self-esteem) involves a negative overall opinion of oneself, undervaluing one&apos;s worth, and lacking confidence in one&apos;s abilities.',
      symptoms: ['Negative self-talk', 'Difficulty accepting compliments', 'Comparing self to others', 'Fear of failure', 'People-pleasing', 'Difficulty setting boundaries'],
      effects: ['Missed opportunities', 'Relationship difficulties', 'Anxiety and depression', 'Difficulty asserting needs', 'Vulnerability to criticism'],
      coping: ['Challenging negative thoughts', 'Building self-compassion', 'Celebrating achievements', 'Therapy', 'Setting small goals', 'Positive affirmations'],
    },
  },
  {
    id: 'perfectionism',
    title: 'Never Feeling Good Enough',
    shortDescription: 'Setting unrealistically high standards and being overly critical of oneself when those standards aren&apos;t met.',
    imagePrompt: 'Beautiful illustration of an imperfect shape glowing with acceptance and warmth. Soft pastel colors, peaceful atmosphere. Educational, friendly, compassionate style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Never feeling good enough (perfectionism) involves setting excessively high standards for oneself and being overly critical when those standards are not met, often leading to stress and dissatisfaction.',
      symptoms: ['Unrealistic standards', 'Fear of failure', 'Procrastination', 'All-or-nothing thinking', 'Excessive self-criticism', 'Difficulty delegating'],
      effects: ['Chronic stress', 'Burnout', 'Anxiety and depression', 'Relationship strain', 'Reduced productivity', 'Difficulty enjoying achievements'],
      coping: ['Setting realistic goals', 'Embracing imperfection', 'Self-compassion', 'Cognitive restructuring', 'Celebrating progress', 'Therapy'],
    },
  },
  {
    id: 'people-pleasing',
    title: 'Always Putting Others First',
    shortDescription: 'Prioritizing others&apos; needs and approval over one&apos;s own wellbeing and authentic desires.',
    imagePrompt: 'Gentle illustration of a figure standing centered with soft boundaries around them. Pastel colors, empowering atmosphere. Educational, friendly, supportive style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Always putting others first (people-pleasing) involves consistently prioritizing others&apos; needs, opinions, and feelings over one&apos;s own, often at the expense of personal wellbeing.',
      symptoms: ['Difficulty saying no', 'Seeking approval', 'Avoiding conflict', 'Neglecting own needs', 'Feeling responsible for others&apos; emotions', 'Difficulty expressing opinions'],
      effects: ['Resentment', 'Burnout', 'Loss of identity', 'Unbalanced relationships', 'Anxiety', 'Difficulty with authenticity'],
      coping: ['Learning to say no', 'Setting boundaries', 'Identifying own needs', 'Assertiveness training', 'Self-compassion', 'Therapy'],
    },
  },
  {
    id: 'burnout',
    title: 'Feeling Completely Exhausted',
    shortDescription: 'Physical, emotional, and mental exhaustion caused by prolonged stress, often work-related.',
    imagePrompt: 'Gentle illustration of a tired figure resting in a peaceful, restorative space with soft light. Pastel colors, calm atmosphere. Educational, friendly, nurturing style. Peaceful and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Feeling completely exhausted (burnout) is a state of physical, emotional, and mental exhaustion caused by prolonged or excessive stress, particularly in work or caregiving contexts.',
      symptoms: ['Chronic fatigue', 'Cynicism', 'Reduced performance', 'Emotional exhaustion', 'Detachment', 'Lack of motivation', 'Physical symptoms'],
      effects: ['Decreased productivity', 'Health problems', 'Relationship strain', 'Depression and anxiety', 'Reduced quality of life'],
      coping: ['Setting boundaries', 'Rest and recovery', 'Stress management', 'Seeking support', 'Reevaluating priorities', 'Professional help'],
    },
  },
  {
    id: 'compassion-fatigue',
    title: 'Exhaustion from Caring for Others',
    shortDescription: 'Emotional and physical exhaustion from caring for others, common in helping professions.',
    imagePrompt: 'Gentle illustration of a caregiver being cared for by warm, nurturing light. Soft pastel colors, restorative atmosphere. Educational, friendly, compassionate style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Exhaustion from caring for others (compassion fatigue) is the emotional and physical exhaustion that can occur from caring for others who are suffering, particularly common in healthcare, social work, and caregiving roles.',
      symptoms: ['Emotional numbness', 'Reduced empathy', 'Exhaustion', 'Irritability', 'Difficulty concentrating', 'Feeling overwhelmed', 'Physical symptoms'],
      effects: ['Reduced quality of care', 'Personal relationship strain', 'Health problems', 'Job dissatisfaction', 'Risk of burnout'],
      coping: ['Self-care practices', 'Setting boundaries', 'Peer support', 'Supervision', 'Mindfulness', 'Taking breaks', 'Therapy'],
    },
  },

  // RELATIONSHIPS & FAMILY
  {
    id: 'romantic-difficulties',
    title: 'Challenges in Romantic Relationships',
    shortDescription: 'Difficulties in romantic partnerships including communication issues, conflict, and intimacy concerns.',
    imagePrompt: 'Gentle illustration of two figures facing each other with a soft bridge of light between them. Pastel colors, warm and hopeful atmosphere. Educational, friendly, supportive style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Challenges in romantic relationships encompass a range of difficulties that can arise in intimate partnerships, from communication problems to conflicts about values or intimacy.',
      symptoms: ['Communication breakdown', 'Frequent conflicts', 'Emotional distance', 'Trust issues', 'Intimacy problems', 'Unmet needs'],
      effects: ['Relationship dissatisfaction', 'Emotional distress', 'Impact on mental health', 'Potential relationship breakdown'],
      coping: ['Couples therapy', 'Communication skills', 'Active listening', 'Conflict resolution', 'Quality time', 'Individual therapy'],
    },
  },
  {
    id: 'attachment-anxious',
    title: 'Fear of Abandonment in Relationships',
    shortDescription: 'An attachment pattern characterized by fear of abandonment and need for constant reassurance.',
    imagePrompt: 'Gentle illustration of a figure being held by secure, reassuring light. Soft pastel colors, safe atmosphere. Educational, friendly, supportive style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Fear of abandonment in relationships (anxious attachment) involves a pattern of seeking closeness and reassurance in relationships, often accompanied by fear of abandonment and worry about the relationship.',
      symptoms: ['Fear of abandonment', 'Need for reassurance', 'Relationship anxiety', 'Preoccupation with partner', 'Difficulty with independence', 'Sensitivity to rejection'],
      effects: ['Relationship strain', 'Emotional exhaustion', 'Pushing partners away', 'Difficulty with trust', 'Anxiety'],
      coping: ['Understanding attachment patterns', 'Building self-soothing skills', 'Therapy', 'Communication', 'Working on self-worth', 'Mindfulness'],
    },
  },
  {
    id: 'attachment-avoidant',
    title: 'Discomfort with Emotional Closeness',
    shortDescription: 'An attachment pattern characterized by discomfort with closeness and emotional intimacy.',
    imagePrompt: 'Gentle illustration of a figure slowly opening a door to safe connection. Soft pastel colors, hopeful atmosphere. Educational, friendly, encouraging style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Discomfort with emotional closeness (avoidant attachment) involves a pattern of maintaining emotional distance in relationships, discomfort with intimacy, and strong emphasis on independence.',
      symptoms: ['Discomfort with closeness', 'Difficulty expressing emotions', 'Valuing independence highly', 'Avoiding vulnerability', 'Emotional distance', 'Difficulty with commitment'],
      effects: ['Relationship difficulties', 'Loneliness', 'Missed intimacy', 'Partner frustration', 'Difficulty forming deep connections'],
      coping: ['Understanding attachment patterns', 'Gradually increasing vulnerability', 'Therapy', 'Communication', 'Recognizing needs for connection', 'Building trust'],
    },
  },
  {
    id: 'attachment-disorganised',
    title: 'Conflicted Feelings About Closeness',
    shortDescription: 'An attachment pattern characterized by inconsistent behavior and difficulty with trust and intimacy.',
    imagePrompt: 'Gentle illustration of a figure finding balance between connection and safety in soft light. Pastel colors, peaceful atmosphere. Educational, friendly, supportive style. Calm and hopeful.',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Conflicted feelings about closeness (disorganized attachment) involves inconsistent patterns in relationships, often stemming from trauma or unpredictable caregiving, leading to both desire for and fear of closeness.',
      symptoms: ['Inconsistent behavior', 'Fear of intimacy and abandonment', 'Difficulty trusting', 'Emotional dysregulation', 'Push-pull dynamics', 'Confusion about relationships'],
      effects: ['Chaotic relationships', 'Emotional distress', 'Difficulty maintaining relationships', 'Trust issues', 'Mental health challenges'],
      coping: ['Trauma-informed therapy', 'Building secure relationships', 'Understanding patterns', 'Emotion regulation', 'Creating safety', 'Long-term support'],
    },
  },
  {
    id: 'family-conflict',
    title: 'Tension & Conflict in Family',
    shortDescription: 'Ongoing disagreements, tension, or dysfunction within family relationships.',
    imagePrompt: 'Gentle illustration of a family tree with branches reconnecting through soft light. Pastel colors, hopeful atmosphere. Educational, friendly, peaceful style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Tension and conflict in family involves ongoing disagreements, tension, or dysfunction within family relationships, which can significantly impact mental health and wellbeing.',
      symptoms: ['Frequent arguments', 'Communication breakdown', 'Tension', 'Avoidance', 'Resentment', 'Emotional distress'],
      effects: ['Stress and anxiety', 'Impact on mental health', 'Strained relationships', 'Difficulty with boundaries', 'Emotional exhaustion'],
      coping: ['Family therapy', 'Setting boundaries', 'Communication skills', 'Individual therapy', 'Taking space when needed', 'Conflict resolution'],
    },
  },
  {
    id: 'toxic-relationships',
    title: 'Harmful Relationship Patterns',
    shortDescription: 'Relationships characterized by manipulation, control, or consistent negativity that harm wellbeing.',
    imagePrompt: 'Gentle illustration of a figure stepping away from shadows into protective, empowering light. Pastel colors, hopeful atmosphere. Educational, friendly, supportive style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Harmful relationship patterns (toxic relationships) involve patterns of behavior that are harmful to one&apos;s mental, emotional, or physical wellbeing, including manipulation, control, or consistent negativity.',
      symptoms: ['Feeling drained', 'Walking on eggshells', 'Manipulation', 'Lack of respect', 'Control', 'Constant criticism', 'Feeling worse after interactions'],
      effects: ['Decreased self-esteem', 'Anxiety and depression', 'Isolation', 'Physical health issues', 'Loss of identity'],
      coping: ['Recognizing patterns', 'Setting boundaries', 'Seeking support', 'Considering ending relationship', 'Therapy', 'Building self-worth'],
    },
  },
  {
    id: 'breakups-heartbreak',
    title: 'Healing from Heartbreak',
    shortDescription: 'The emotional pain and adjustment process following the end of a romantic relationship.',
    imagePrompt: 'Gentle illustration of a heart healing with soft, nurturing light surrounding it. Pastel colors, hopeful atmosphere. Educational, friendly, compassionate style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Healing from heartbreak (breakups) involves the emotional pain and adjustment process that follows the end of a romantic relationship, which can be a significant life stressor.',
      symptoms: ['Sadness and grief', 'Difficulty concentrating', 'Changes in appetite or sleep', 'Loneliness', 'Anger', 'Rumination', 'Physical pain'],
      effects: ['Emotional distress', 'Impact on daily functioning', 'Social withdrawal', 'Temporary depression', 'Loss of identity'],
      coping: ['Allowing grief', 'Social support', 'Self-care', 'No contact period', 'Therapy', 'New routines', 'Time and patience'],
    },
  },
  {
    id: 'loneliness',
    title: 'Feeling Alone & Disconnected',
    shortDescription: 'A subjective feeling of being alone or disconnected from others, regardless of social contact.',
    imagePrompt: 'Gentle illustration of a figure reaching out to welcoming connections of light. Soft pastel colors, hopeful atmosphere. Educational, friendly, supportive style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Feeling alone and disconnected (loneliness) is the subjective feeling of being alone, isolated, or disconnected from others, which can occur even when surrounded by people.',
      symptoms: ['Feeling isolated', 'Lack of meaningful connection', 'Emptiness', 'Difficulty connecting', 'Social anxiety', 'Feeling misunderstood'],
      effects: ['Depression', 'Anxiety', 'Physical health issues', 'Reduced quality of life', 'Impact on self-esteem'],
      coping: ['Reaching out to others', 'Joining groups or activities', 'Volunteering', 'Therapy', 'Building quality connections', 'Self-compassion'],
    },
  },

  // WORK / STUDY
  {
    id: 'work-stress-burnout',
    title: 'Workplace Stress & Exhaustion',
    shortDescription: 'Chronic workplace stress leading to physical and emotional exhaustion.',
    imagePrompt: 'Gentle illustration of a figure finding balance between work and rest in peaceful harmony. Soft pastel colors, calm atmosphere. Educational, friendly, supportive style. Peaceful and balanced.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Workplace stress and exhaustion (work burnout) result from chronic workplace stress that hasn&apos;t been successfully managed, leading to exhaustion, cynicism, and reduced professional efficacy.',
      symptoms: ['Chronic fatigue', 'Reduced performance', 'Cynicism about work', 'Irritability', 'Difficulty concentrating', 'Physical symptoms', 'Detachment'],
      effects: ['Health problems', 'Decreased productivity', 'Job dissatisfaction', 'Relationship strain', 'Mental health issues'],
      coping: ['Setting work boundaries', 'Time management', 'Stress reduction techniques', 'Taking breaks', 'Seeking support', 'Considering job changes'],
    },
  },
  {
    id: 'procrastination',
    title: 'Difficulty Starting & Completing Tasks',
    shortDescription: 'Delaying or postponing tasks despite knowing there may be negative consequences.',
    imagePrompt: 'Gentle illustration of a figure taking the first step on an encouraging path forward. Soft pastel colors, hopeful atmosphere. Educational, friendly, motivating style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Difficulty starting and completing tasks (procrastination) involves voluntarily delaying tasks despite expecting to be worse off for the delay, often driven by anxiety, perfectionism, or difficulty with self-regulation.',
      symptoms: ['Delaying tasks', 'Last-minute rushing', 'Guilt and stress', 'Difficulty starting', 'Distraction-seeking', 'Avoidance'],
      effects: ['Increased stress', 'Reduced quality of work', 'Missed opportunities', 'Guilt and shame', 'Impact on goals'],
      coping: ['Breaking tasks into steps', 'Time management techniques', 'Addressing underlying anxiety', 'Self-compassion', 'Accountability', 'Understanding triggers'],
    },
  },
  {
    id: 'academic-stress',
    title: 'Pressure & Stress from Studies',
    shortDescription: 'Stress related to educational demands, performance pressure, and academic expectations.',
    imagePrompt: 'Gentle illustration of a student surrounded by supportive, organized light and calm energy. Soft pastel colors, peaceful atmosphere. Educational, friendly, encouraging style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Pressure and stress from studies (academic stress) involves the pressure and anxiety related to educational demands, including exams, assignments, grades, and future career concerns.',
      symptoms: ['Anxiety about performance', 'Difficulty concentrating', 'Sleep problems', 'Overwhelm', 'Perfectionism', 'Physical symptoms', 'Avoidance'],
      effects: ['Reduced academic performance', 'Mental health issues', 'Physical health problems', 'Social withdrawal', 'Burnout'],
      coping: ['Time management', 'Study strategies', 'Stress management', 'Seeking academic support', 'Self-care', 'Realistic expectations', 'Counseling'],
    },
  },

  // GRIEF & LOSS
  {
    id: 'grief-bereavement',
    title: 'Coping with Loss & Grief',
    shortDescription: 'The natural response to loss, particularly the death of a loved one.',
    imagePrompt: 'Gentle illustration of a figure holding memories like soft lights in a peaceful space. Pastel colors, warm atmosphere. Educational, friendly, compassionate style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Coping with loss and grief (bereavement) is the natural response to loss, particularly the death of someone or something to which a bond was formed. It involves a range of emotions and is a highly individual process.',
      symptoms: ['Sadness', 'Yearning', 'Anger', 'Guilt', 'Numbness', 'Physical symptoms', 'Difficulty accepting loss', 'Changes in sleep or appetite'],
      effects: ['Emotional pain', 'Difficulty functioning', 'Social withdrawal', 'Physical health impact', 'Changes in identity'],
      coping: ['Allowing grief process', 'Social support', 'Grief counseling', 'Self-care', 'Memorializing', 'Patience with process', 'Support groups'],
    },
  },
  {
    id: 'ambiguous-loss',
    title: 'Loss Without Closure',
    shortDescription: 'Loss without closure or clear understanding, such as estrangement or missing persons.',
    imagePrompt: 'Gentle illustration of a figure holding space for uncertainty with patient light. Soft pastel colors, peaceful atmosphere. Educational, friendly, compassionate style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Loss without closure (ambiguous loss) is a loss that occurs without closure or clear understanding, such as when a loved one is physically present but psychologically absent, or physically absent with unclear circumstances.',
      symptoms: ['Confusion', 'Difficulty grieving', 'Ongoing uncertainty', 'Guilt', 'Anxiety', 'Difficulty moving forward', 'Conflicting emotions'],
      effects: ['Prolonged distress', 'Difficulty with closure', 'Relationship strain', 'Mental health challenges', 'Feeling stuck'],
      coping: ['Accepting uncertainty', 'Finding meaning', 'Support groups', 'Therapy', 'Creating rituals', 'Self-compassion', 'Building resilience'],
    },
  },

  // ADDICTION & HABITS
  {
    id: 'substance-use',
    title: 'Struggling with Substance Use',
    shortDescription: 'Problematic use of substances that interferes with health, relationships, and daily functioning.',
    imagePrompt: 'Gentle illustration of a figure choosing a path toward health and freedom in soft light. Pastel colors, hopeful atmosphere. Educational, friendly, supportive style. Calm and encouraging.',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Struggling with substance use (substance use disorder) involves a problematic pattern of substance use leading to significant impairment or distress. Recovery is possible with appropriate support and treatment.',
      symptoms: ['Inability to control use', 'Continued use despite problems', 'Tolerance', 'Withdrawal symptoms', 'Neglecting responsibilities', 'Cravings'],
      effects: ['Health problems', 'Relationship difficulties', 'Financial issues', 'Legal problems', 'Mental health challenges', 'Impact on work or school'],
      coping: ['Professional treatment', 'Support groups', 'Therapy', 'Harm reduction', 'Building support network', 'Addressing underlying issues', 'Developing coping skills'],
    },
  },
  {
    id: 'alcohol-misuse',
    title: 'Problematic Alcohol Use',
    shortDescription: 'Alcohol use that negatively impacts health, relationships, or daily life.',
    imagePrompt: 'Gentle illustration of a figure stepping toward clarity and health with supportive light. Soft pastel colors, hopeful atmosphere. Educational, friendly, encouraging style. Calm and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Problematic alcohol use (alcohol misuse) ranges from risky drinking to alcohol use disorder, involving patterns of alcohol use that cause health or social problems.',
      symptoms: ['Drinking more than intended', 'Inability to cut down', 'Time spent drinking or recovering', 'Cravings', 'Neglecting responsibilities', 'Continued use despite problems'],
      effects: ['Health problems', 'Relationship issues', 'Work or school problems', 'Legal issues', 'Mental health challenges', 'Financial difficulties'],
      coping: ['Professional help', 'Support groups (AA, SMART Recovery)', 'Therapy', 'Medical support', 'Identifying triggers', 'Building sober support network'],
    },
  },
  {
    id: 'nicotine-dependence',
    title: 'Struggling to Quit Smoking/Vaping',
    shortDescription: 'Physical and psychological dependence on nicotine from tobacco or vaping products.',
    imagePrompt: 'Gentle illustration of a figure breathing freely in clean, refreshing air with soft light. Pastel colors, peaceful atmosphere. Educational, friendly, encouraging style. Calm and supportive.',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Struggling to quit smoking or vaping (nicotine dependence) involves physical and psychological addiction to nicotine, making it difficult to quit despite knowing the health risks.',
      symptoms: ['Cravings', 'Withdrawal symptoms', 'Difficulty quitting', 'Using despite health problems', 'Tolerance', 'Irritability when unable to use'],
      effects: ['Health problems', 'Financial cost', 'Social limitations', 'Reduced quality of life', 'Anxiety about quitting'],
      coping: ['Nicotine replacement therapy', 'Medication', 'Behavioral therapy', 'Support groups', 'Identifying triggers', 'Gradual reduction', 'Professional support'],
    },
  },
  {
    id: 'behavioral-addictions',
    title: 'Compulsive Behaviors & Habits',
    shortDescription: 'Compulsive engagement in rewarding behaviors despite negative consequences, such as gaming, social media, or gambling.',
    imagePrompt: 'Gentle illustration of a figure finding balance and freedom from compulsive patterns in calm light. Soft pastel colors, peaceful atmosphere. Educational, friendly, supportive style. Calm and hopeful.',
    imageUrl: 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&h=600&fit=crop&q=80',
    content: {
      overview: 'Compulsive behaviors and habits (behavioral addictions) involve compulsive engagement in rewarding non-substance-related behaviors, such as gaming, internet use, gambling, or pornography, despite negative consequences.',
      symptoms: ['Preoccupation with behavior', 'Loss of control', 'Continued engagement despite problems', 'Withdrawal symptoms', 'Tolerance', 'Neglecting responsibilities'],
      effects: ['Relationship problems', 'Work or school issues', 'Financial difficulties', 'Mental health challenges', 'Physical health problems', 'Social isolation'],
      coping: ['Therapy (CBT, DBT)', 'Support groups', 'Setting limits', 'Identifying triggers', 'Developing alternative activities', 'Addressing underlying issues', 'Professional help'],
    },
  },
];
