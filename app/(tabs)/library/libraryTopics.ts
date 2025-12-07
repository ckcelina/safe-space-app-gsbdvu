
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
  // ANXIETY-RELATED
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
    id: 'social-anxiety',
    title: 'Social Anxiety',
    shortDescription: 'Intense fear of social situations and being judged or negatively evaluated by others.',
    imagePrompt: 'A gentle figure surrounded by soft, protective bubbles in pastel colors.',
    content: {
      overview: 'Social anxiety disorder involves overwhelming worry and self-consciousness about everyday social situations, often centered on a fear of being judged, embarrassed, or humiliated.',
      symptoms: ['Fear of social situations', 'Excessive self-consciousness', 'Physical symptoms (blushing, sweating)', 'Avoidance of social events', 'Difficulty making eye contact', 'Fear of being judged'],
      effects: ['Limited social connections', 'Missed opportunities', 'Isolation', 'Impact on career advancement', 'Low self-esteem'],
      coping: ['Gradual exposure therapy', 'Cognitive restructuring', 'Social skills training', 'Relaxation techniques', 'Support groups'],
    },
  },
  {
    id: 'panic-disorder',
    title: 'Panic Disorder & Panic Attacks',
    shortDescription: 'Recurrent unexpected panic attacks and persistent concern about having more attacks.',
    imagePrompt: 'A person breathing calmly with waves of soft color flowing outward.',
    content: {
      overview: 'Panic disorder is characterized by sudden and repeated attacks of intense fear accompanied by physical symptoms. These attacks can occur unexpectedly and may lead to ongoing worry about future attacks.',
      symptoms: ['Rapid heartbeat', 'Sweating', 'Trembling', 'Shortness of breath', 'Chest pain', 'Dizziness', 'Fear of losing control', 'Feeling of unreality'],
      effects: ['Avoidance of places or situations', 'Constant worry about attacks', 'Impact on daily activities', 'Development of agoraphobia'],
      coping: ['Breathing exercises', 'Cognitive behavioral therapy', 'Panic-focused therapy', 'Medication when appropriate', 'Lifestyle modifications'],
    },
  },
  {
    id: 'health-anxiety',
    title: 'Health Anxiety',
    shortDescription: 'Excessive worry about having or developing a serious illness, despite medical reassurance.',
    imagePrompt: 'A peaceful heart surrounded by gentle, protective light rays.',
    content: {
      overview: 'Health anxiety involves persistent worry about having a serious illness, often misinterpreting normal body sensations as signs of severe disease.',
      symptoms: ['Constant health worry', 'Frequent body checking', 'Seeking reassurance', 'Avoiding medical information or excessive research', 'Physical symptoms from anxiety', 'Difficulty accepting medical reassurance'],
      effects: ['Frequent doctor visits', 'Strained relationships', 'Reduced quality of life', 'Financial burden from medical tests', 'Increased stress'],
      coping: ['Cognitive behavioral therapy', 'Limiting health-related research', 'Mindfulness practices', 'Scheduled worry time', 'Professional support'],
    },
  },
  {
    id: 'separation-anxiety',
    title: 'Separation Anxiety',
    shortDescription: 'Excessive fear or anxiety about separation from attachment figures or home.',
    imagePrompt: 'Two figures connected by a gentle, glowing thread across soft clouds.',
    content: {
      overview: 'Separation anxiety involves excessive fear about being apart from loved ones or familiar environments, beyond what is expected for developmental level.',
      symptoms: ['Excessive distress when separated', 'Worry about harm to loved ones', 'Reluctance to be alone', 'Physical symptoms when separation occurs', 'Nightmares about separation', 'Difficulty sleeping alone'],
      effects: ['Difficulty with independence', 'Impact on relationships', 'School or work attendance issues', 'Limited social activities'],
      coping: ['Gradual exposure to separation', 'Cognitive behavioral therapy', 'Relaxation techniques', 'Building independence skills', 'Family therapy'],
    },
  },

  // MOOD-RELATED
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
    id: 'dysthymia',
    title: 'Persistent Depressive Disorder (Dysthymia)',
    shortDescription: 'A chronic form of depression lasting for at least two years with less severe but persistent symptoms.',
    imagePrompt: 'A figure walking through gentle fog with soft light ahead.',
    content: {
      overview: 'Persistent depressive disorder is a continuous, long-term form of depression where mood is depressed most of the day, more days than not, for at least two years.',
      symptoms: ['Chronic low mood', 'Low energy', 'Poor concentration', 'Feelings of hopelessness', 'Changes in appetite', 'Low self-esteem', 'Difficulty making decisions'],
      effects: ['Long-term impact on quality of life', 'Relationship challenges', 'Reduced productivity', 'Increased risk of major depression'],
      coping: ['Long-term therapy', 'Medication management', 'Lifestyle changes', 'Building support networks', 'Regular self-care'],
    },
  },
  {
    id: 'bipolar-1',
    title: 'Bipolar I Disorder',
    shortDescription: 'A condition marked by manic episodes lasting at least seven days, often alternating with depressive episodes.',
    imagePrompt: 'Two overlapping silhouettes with day and night colors blending harmoniously.',
    content: {
      overview: 'Bipolar I disorder is defined by manic episodes that last at least seven days or by manic symptoms severe enough to require immediate hospital care. Depressive episodes typically occur as well.',
      symptoms: ['Manic episodes', 'Elevated mood', 'Increased energy', 'Decreased need for sleep', 'Racing thoughts', 'Risky behavior', 'Depressive episodes'],
      effects: ['Relationship strain', 'Work or school disruption', 'Financial problems', 'Legal issues', 'Hospitalization risk'],
      coping: ['Medication management', 'Mood stabilizers', 'Regular sleep schedule', 'Therapy', 'Mood tracking', 'Crisis planning'],
    },
  },
  {
    id: 'bipolar-2',
    title: 'Bipolar II Disorder',
    shortDescription: 'A pattern of depressive episodes and hypomanic episodes, but not full-blown manic episodes.',
    imagePrompt: 'Gentle waves of color transitioning smoothly from warm to cool tones.',
    content: {
      overview: 'Bipolar II disorder involves a pattern of depressive episodes and hypomanic episodes, which are less severe than the manic episodes in Bipolar I disorder.',
      symptoms: ['Hypomanic episodes', 'Elevated mood (less severe)', 'Increased productivity', 'Depressive episodes', 'Mood swings', 'Changes in sleep patterns'],
      effects: ['Unpredictable mood changes', 'Relationship challenges', 'Work performance fluctuations', 'Risk of major depression'],
      coping: ['Medication management', 'Psychotherapy', 'Mood monitoring', 'Regular routine', 'Stress management', 'Support groups'],
    },
  },
  {
    id: 'cyclothymia',
    title: 'Cyclothymia',
    shortDescription: 'A milder form of bipolar disorder with numerous periods of hypomanic and depressive symptoms.',
    imagePrompt: 'Soft rolling hills in pastel colors under a calm sky.',
    content: {
      overview: 'Cyclothymic disorder involves numerous periods of hypomanic symptoms and periods of depressive symptoms lasting for at least two years, though symptoms are less severe than bipolar disorder.',
      symptoms: ['Mild mood swings', 'Periods of hypomania', 'Periods of mild depression', 'Unpredictable mood changes', 'Emotional instability'],
      effects: ['Relationship difficulties', 'Unpredictable behavior', 'Risk of developing bipolar disorder', 'Impact on daily functioning'],
      coping: ['Mood tracking', 'Therapy', 'Lifestyle stability', 'Stress management', 'Regular sleep patterns', 'Medication if needed'],
    },
  },

  // TRAUMA-RELATED
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
  {
    id: 'complex-ptsd',
    title: 'Complex PTSD',
    shortDescription: 'A condition resulting from prolonged, repeated trauma, often involving interpersonal relationships.',
    imagePrompt: 'A figure emerging from layered, soft shadows into gentle light.',
    content: {
      overview: 'Complex PTSD develops from prolonged or repeated trauma, often in situations where escape is difficult or impossible, such as childhood abuse or domestic violence.',
      symptoms: ['Difficulty regulating emotions', 'Negative self-perception', 'Relationship difficulties', 'Flashbacks', 'Dissociation', 'Loss of sense of self', 'Difficulty trusting others'],
      effects: ['Chronic relationship problems', 'Identity issues', 'Emotional dysregulation', 'Difficulty with intimacy', 'Self-destructive behavior'],
      coping: ['Trauma-focused therapy', 'DBT skills', 'Building safety', 'Emotion regulation techniques', 'Long-term therapeutic support'],
    },
  },
  {
    id: 'childhood-trauma',
    title: 'Childhood Trauma',
    shortDescription: 'The lasting impact of distressing or harmful experiences during childhood years.',
    imagePrompt: 'A small tree growing strong with protective, nurturing light around it.',
    content: {
      overview: 'Childhood trauma refers to experiences during childhood that are emotionally painful or distressing, which often have lasting effects into adulthood.',
      symptoms: ['Difficulty trusting others', 'Emotional regulation challenges', 'Relationship patterns', 'Low self-worth', 'Anxiety or depression', 'Hypervigilance'],
      effects: ['Impact on adult relationships', 'Mental health challenges', 'Physical health issues', 'Difficulty with emotional intimacy'],
      coping: ['Trauma therapy', 'Inner child work', 'Building secure attachments', 'Self-compassion practices', 'Support groups'],
    },
  },
  {
    id: 'emotional-neglect',
    title: 'Emotional Neglect',
    shortDescription: 'The experience of not having emotional needs met, particularly during childhood.',
    imagePrompt: 'A gentle hand reaching toward a small, glowing heart.',
    content: {
      overview: 'Emotional neglect occurs when emotional needs are consistently unmet, often leaving individuals feeling invisible or unimportant.',
      symptoms: ['Difficulty identifying emotions', 'Feeling empty', 'Low self-worth', 'Difficulty asking for help', 'Feeling disconnected', 'Self-reliance to a fault'],
      effects: ['Relationship difficulties', 'Emotional numbness', 'Difficulty with intimacy', 'Chronic feelings of loneliness'],
      coping: ['Therapy focused on emotional awareness', 'Learning to identify needs', 'Building emotional vocabulary', 'Self-compassion', 'Connecting with supportive people'],
    },
  },

  // OBSESSIONS / COMPULSIONS
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
    id: 'pure-o',
    title: 'Pure-O (Intrusive Thoughts)',
    shortDescription: 'A form of OCD characterized primarily by intrusive, unwanted thoughts without visible compulsions.',
    imagePrompt: 'A calm mind with thought bubbles gently floating away like clouds.',
    content: {
      overview: 'Pure-O refers to OCD where compulsions are primarily mental rather than physical. Individuals experience distressing intrusive thoughts but may not have obvious external rituals.',
      symptoms: ['Unwanted intrusive thoughts', 'Mental compulsions', 'Excessive rumination', 'Thought suppression attempts', 'Anxiety about thoughts', 'Mental checking'],
      effects: ['Significant distress', 'Shame about thoughts', 'Avoidance behaviors', 'Impact on daily functioning', 'Difficulty concentrating'],
      coping: ['Exposure and response prevention', 'Accepting thoughts without judgment', 'Mindfulness', 'Cognitive therapy', 'Understanding thoughts are not actions'],
    },
  },

  // PERSONALITY & RELATIONAL
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
    id: 'narcissistic-patterns',
    title: 'Narcissistic Personality Patterns',
    shortDescription: 'Patterns of grandiosity, need for admiration, and lack of empathy that impact relationships.',
    imagePrompt: 'A mirror reflecting soft, balanced light in pastel tones.',
    content: {
      overview: 'Narcissistic patterns involve a pervasive pattern of grandiosity, need for admiration, and lack of empathy. Understanding these patterns can help in relationships and personal growth.',
      symptoms: ['Grandiose sense of self', 'Need for admiration', 'Lack of empathy', 'Sense of entitlement', 'Exploitative behavior', 'Difficulty with criticism'],
      effects: ['Relationship difficulties', 'Workplace conflicts', 'Emotional distress in others', 'Difficulty maintaining long-term relationships'],
      coping: ['Therapy focused on empathy', 'Self-reflection', 'Understanding impact on others', 'Building genuine self-esteem', 'Developing emotional awareness'],
    },
  },
  {
    id: 'avoidant-patterns',
    title: 'Avoidant Personality Patterns',
    shortDescription: 'Patterns of social inhibition, feelings of inadequacy, and hypersensitivity to criticism.',
    imagePrompt: 'A figure stepping out from behind a soft curtain toward gentle light.',
    content: {
      overview: 'Avoidant personality patterns involve pervasive social inhibition, feelings of inadequacy, and extreme sensitivity to negative evaluation.',
      symptoms: ['Avoidance of social situations', 'Fear of criticism', 'Feelings of inadequacy', 'Reluctance to take risks', 'Preoccupation with rejection', 'Low self-esteem'],
      effects: ['Limited social connections', 'Missed opportunities', 'Isolation', 'Career limitations', 'Loneliness'],
      coping: ['Gradual exposure therapy', 'Building self-esteem', 'Cognitive restructuring', 'Social skills training', 'Supportive therapy'],
    },
  },
  {
    id: 'dependent-patterns',
    title: 'Dependent Personality Patterns',
    shortDescription: 'Patterns of excessive need to be taken care of, leading to submissive and clinging behavior.',
    imagePrompt: 'A person standing independently with gentle support around them.',
    content: {
      overview: 'Dependent personality patterns involve an excessive need to be taken care of, leading to submissive, clinging behavior and fears of separation.',
      symptoms: ['Difficulty making decisions', 'Need for reassurance', 'Fear of being alone', 'Difficulty disagreeing', 'Urgently seeking new relationships when one ends', 'Submissive behavior'],
      effects: ['Unhealthy relationships', 'Difficulty with independence', 'Vulnerability to exploitation', 'Low self-confidence'],
      coping: ['Building independence skills', 'Assertiveness training', 'Cognitive therapy', 'Developing self-reliance', 'Healthy boundary setting'],
    },
  },

  // NEURODEVELOPMENTAL
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
    id: 'adhd-inattentive',
    title: 'ADHD (Inattentive Type)',
    shortDescription: 'ADHD characterized primarily by difficulty sustaining attention and organization, without significant hyperactivity.',
    imagePrompt: 'A peaceful figure organizing floating thoughts into gentle patterns.',
    content: {
      overview: 'Inattentive type ADHD involves primarily symptoms of inattention, such as difficulty focusing, forgetfulness, and disorganization, without prominent hyperactivity.',
      symptoms: ['Difficulty sustaining attention', 'Easily distracted', 'Forgetfulness', 'Losing things', 'Difficulty organizing', 'Avoiding tasks requiring sustained focus'],
      effects: ['Academic or work underperformance', 'Missed deadlines', 'Disorganization', 'Feeling overwhelmed'],
      coping: ['External organization systems', 'Breaking tasks into steps', 'Timers and reminders', 'Medication', 'Cognitive strategies'],
    },
  },
  {
    id: 'adhd-hyperactive',
    title: 'ADHD (Hyperactive-Impulsive Type)',
    shortDescription: 'ADHD characterized primarily by hyperactivity and impulsivity, with less prominent inattention.',
    imagePrompt: 'Dynamic energy flowing into organized, purposeful channels.',
    content: {
      overview: 'Hyperactive-impulsive type ADHD involves primarily symptoms of hyperactivity and impulsivity, such as fidgeting, difficulty staying seated, and acting without thinking.',
      symptoms: ['Fidgeting', 'Difficulty staying seated', 'Excessive talking', 'Interrupting others', 'Difficulty waiting turn', 'Acting without thinking'],
      effects: ['Social difficulties', 'Impulsive decisions', 'Relationship challenges', 'Risk-taking behavior'],
      coping: ['Physical activity', 'Mindfulness practices', 'Impulse control strategies', 'Medication', 'Behavioral therapy'],
    },
  },
  {
    id: 'adhd-combined',
    title: 'ADHD (Combined Type)',
    shortDescription: 'ADHD with significant symptoms of both inattention and hyperactivity-impulsivity.',
    imagePrompt: 'A balanced figure with organized energy and focused calm.',
    content: {
      overview: 'Combined type ADHD involves significant symptoms of both inattention and hyperactivity-impulsivity, making it the most common presentation of ADHD.',
      symptoms: ['Inattention', 'Hyperactivity', 'Impulsivity', 'Disorganization', 'Restlessness', 'Difficulty with focus and sitting still'],
      effects: ['Multiple areas of life affected', 'Academic and work challenges', 'Relationship difficulties', 'Low self-esteem'],
      coping: ['Comprehensive treatment approach', 'Medication', 'Behavioral strategies', 'Organization systems', 'Exercise', 'Therapy'],
    },
  },
  {
    id: 'autism-spectrum',
    title: 'Autism Spectrum',
    shortDescription: 'A developmental condition affecting communication, social interaction, and behavior in diverse ways.',
    imagePrompt: 'A unique, beautiful pattern of interconnected shapes in soft colors.',
    content: {
      overview: 'Autism spectrum disorder is a developmental condition that affects how people communicate, interact socially, and experience the world. It presents differently in each individual.',
      symptoms: ['Differences in social communication', 'Repetitive behaviors', 'Sensory sensitivities', 'Focused interests', 'Preference for routine', 'Unique strengths and challenges'],
      effects: ['Social interaction differences', 'Communication challenges', 'Sensory overwhelm', 'Unique perspectives and abilities'],
      coping: ['Understanding individual needs', 'Sensory accommodations', 'Clear communication', 'Respecting differences', 'Building on strengths', 'Supportive environments'],
    },
  },

  // DISSOCIATION
  {
    id: 'dissociation-depersonalization',
    title: 'Dissociation & Depersonalisation',
    shortDescription: 'Feeling detached from oneself, as if observing from outside one&apos;s body or mind.',
    imagePrompt: 'A translucent figure gently reconnecting with a soft, grounding light.',
    content: {
      overview: 'Depersonalization involves feeling detached from oneself, experiencing a sense of unreality about one&apos;s own existence, thoughts, or body.',
      symptoms: ['Feeling detached from self', 'Observing self from outside', 'Emotional numbness', 'Feeling robotic', 'Distorted sense of time', 'Feeling unreal'],
      effects: ['Distress and anxiety', 'Difficulty connecting with others', 'Impact on daily functioning', 'Feeling disconnected from life'],
      coping: ['Grounding techniques', 'Mindfulness', 'Therapy', 'Reducing stress', 'Sensory awareness exercises', 'Understanding triggers'],
    },
  },
  {
    id: 'derealisation',
    title: 'Derealisation',
    shortDescription: 'Feeling that the world around you is unreal, dreamlike, or distorted.',
    imagePrompt: 'A person touching solid, real objects that glow with reassuring warmth.',
    content: {
      overview: 'Derealization involves feeling that the external world is strange, unreal, or dreamlike, as if viewing it through a fog or from a distance.',
      symptoms: ['World feels unreal', 'Surroundings seem distorted', 'Visual distortions', 'Feeling in a dream', 'Emotional detachment from environment', 'Time distortion'],
      effects: ['Anxiety about reality', 'Difficulty functioning', 'Social withdrawal', 'Fear of losing touch with reality'],
      coping: ['Grounding techniques', 'Focusing on senses', 'Therapy', 'Stress reduction', 'Reality testing', 'Understanding it&apos;s temporary'],
    },
  },

  // EATING & BODY IMAGE
  {
    id: 'disordered-eating',
    title: 'Disordered Eating',
    shortDescription: 'Irregular eating patterns and unhealthy relationships with food that may not meet full criteria for an eating disorder.',
    imagePrompt: 'A balanced plate with gentle, nourishing colors and soft light.',
    content: {
      overview: 'Disordered eating refers to a range of irregular eating behaviors that may not warrant a diagnosis of a specific eating disorder but still negatively impact health and wellbeing.',
      symptoms: ['Restrictive eating', 'Binge eating', 'Chronic dieting', 'Food preoccupation', 'Guilt around eating', 'Rigid food rules'],
      effects: ['Nutritional deficiencies', 'Physical health issues', 'Emotional distress', 'Social impact', 'Body image concerns'],
      coping: ['Intuitive eating', 'Therapy', 'Nutritional counseling', 'Challenging food rules', 'Self-compassion', 'Addressing underlying issues'],
    },
  },
  {
    id: 'body-image',
    title: 'Body Image Issues',
    shortDescription: 'Negative thoughts and feelings about one&apos;s physical appearance that impact self-esteem and wellbeing.',
    imagePrompt: 'A figure looking at a kind, accepting reflection in soft light.',
    content: {
      overview: 'Body image issues involve persistent negative thoughts and feelings about one&apos;s appearance, which can significantly impact mental health and quality of life.',
      symptoms: ['Negative self-perception', 'Constant comparison', 'Avoidance of mirrors or photos', 'Preoccupation with appearance', 'Body checking', 'Distorted view of body'],
      effects: ['Low self-esteem', 'Social anxiety', 'Depression', 'Avoidance of activities', 'Relationship difficulties'],
      coping: ['Cognitive restructuring', 'Body neutrality practices', 'Media literacy', 'Self-compassion', 'Therapy', 'Focusing on function over form'],
    },
  },
  {
    id: 'emotional-eating',
    title: 'Emotional Eating',
    shortDescription: 'Using food to cope with emotions rather than to satisfy physical hunger.',
    imagePrompt: 'A heart being gently nourished by warm, comforting light.',
    content: {
      overview: 'Emotional eating involves eating in response to emotions rather than physical hunger, often as a way to cope with stress, sadness, or other feelings.',
      symptoms: ['Eating when not hungry', 'Eating in response to emotions', 'Craving specific comfort foods', 'Eating to feel better', 'Guilt after eating', 'Loss of control around food'],
      effects: ['Weight fluctuations', 'Guilt and shame', 'Not addressing underlying emotions', 'Physical discomfort', 'Cycle of emotional eating'],
      coping: ['Identifying triggers', 'Alternative coping strategies', 'Mindful eating', 'Emotional awareness', 'Therapy', 'Self-compassion'],
    },
  },

  // SELF-RELATED
  {
    id: 'low-self-esteem',
    title: 'Low Self-Esteem',
    shortDescription: 'A negative view of oneself, characterized by lack of confidence and feelings of inadequacy.',
    imagePrompt: 'A small light growing brighter and stronger within a gentle figure.',
    content: {
      overview: 'Low self-esteem involves a negative overall opinion of oneself, undervaluing one&apos;s worth, and lacking confidence in one&apos;s abilities.',
      symptoms: ['Negative self-talk', 'Difficulty accepting compliments', 'Comparing self to others', 'Fear of failure', 'People-pleasing', 'Difficulty setting boundaries'],
      effects: ['Missed opportunities', 'Relationship difficulties', 'Anxiety and depression', 'Difficulty asserting needs', 'Vulnerability to criticism'],
      coping: ['Challenging negative thoughts', 'Building self-compassion', 'Celebrating achievements', 'Therapy', 'Setting small goals', 'Positive affirmations'],
    },
  },
  {
    id: 'perfectionism',
    title: 'Perfectionism',
    shortDescription: 'Setting unrealistically high standards and being overly critical of oneself when those standards aren&apos;t met.',
    imagePrompt: 'A beautiful, imperfect shape glowing with acceptance and warmth.',
    content: {
      overview: 'Perfectionism involves setting excessively high standards for oneself and being overly critical when those standards are not met, often leading to stress and dissatisfaction.',
      symptoms: ['Unrealistic standards', 'Fear of failure', 'Procrastination', 'All-or-nothing thinking', 'Excessive self-criticism', 'Difficulty delegating'],
      effects: ['Chronic stress', 'Burnout', 'Anxiety and depression', 'Relationship strain', 'Reduced productivity', 'Difficulty enjoying achievements'],
      coping: ['Setting realistic goals', 'Embracing imperfection', 'Self-compassion', 'Cognitive restructuring', 'Celebrating progress', 'Therapy'],
    },
  },
  {
    id: 'people-pleasing',
    title: 'People-Pleasing',
    shortDescription: 'Prioritizing others&apos; needs and approval over one&apos;s own wellbeing and authentic desires.',
    imagePrompt: 'A figure standing centered with gentle boundaries around them.',
    content: {
      overview: 'People-pleasing involves consistently prioritizing others&apos; needs, opinions, and feelings over one&apos;s own, often at the expense of personal wellbeing.',
      symptoms: ['Difficulty saying no', 'Seeking approval', 'Avoiding conflict', 'Neglecting own needs', 'Feeling responsible for others&apos; emotions', 'Difficulty expressing opinions'],
      effects: ['Resentment', 'Burnout', 'Loss of identity', 'Unbalanced relationships', 'Anxiety', 'Difficulty with authenticity'],
      coping: ['Learning to say no', 'Setting boundaries', 'Identifying own needs', 'Assertiveness training', 'Self-compassion', 'Therapy'],
    },
  },
  {
    id: 'burnout',
    title: 'Burnout',
    shortDescription: 'Physical, emotional, and mental exhaustion caused by prolonged stress, often work-related.',
    imagePrompt: 'A tired figure resting in a peaceful, restorative space with soft light.',
    content: {
      overview: 'Burnout is a state of physical, emotional, and mental exhaustion caused by prolonged or excessive stress, particularly in work or caregiving contexts.',
      symptoms: ['Chronic fatigue', 'Cynicism', 'Reduced performance', 'Emotional exhaustion', 'Detachment', 'Lack of motivation', 'Physical symptoms'],
      effects: ['Decreased productivity', 'Health problems', 'Relationship strain', 'Depression and anxiety', 'Reduced quality of life'],
      coping: ['Setting boundaries', 'Rest and recovery', 'Stress management', 'Seeking support', 'Reevaluating priorities', 'Professional help'],
    },
  },
  {
    id: 'compassion-fatigue',
    title: 'Compassion Fatigue',
    shortDescription: 'Emotional and physical exhaustion from caring for others, common in helping professions.',
    imagePrompt: 'A caregiver being gently cared for by warm, nurturing light.',
    content: {
      overview: 'Compassion fatigue is the emotional and physical exhaustion that can occur from caring for others who are suffering, particularly common in healthcare, social work, and caregiving roles.',
      symptoms: ['Emotional numbness', 'Reduced empathy', 'Exhaustion', 'Irritability', 'Difficulty concentrating', 'Feeling overwhelmed', 'Physical symptoms'],
      effects: ['Reduced quality of care', 'Personal relationship strain', 'Health problems', 'Job dissatisfaction', 'Risk of burnout'],
      coping: ['Self-care practices', 'Setting boundaries', 'Peer support', 'Supervision', 'Mindfulness', 'Taking breaks', 'Therapy'],
    },
  },

  // RELATIONSHIPS & FAMILY
  {
    id: 'romantic-difficulties',
    title: 'Romantic Relationship Difficulties',
    shortDescription: 'Challenges in romantic partnerships including communication issues, conflict, and intimacy concerns.',
    imagePrompt: 'Two figures facing each other with a gentle bridge of light between them.',
    content: {
      overview: 'Romantic relationship difficulties encompass a range of challenges that can arise in intimate partnerships, from communication problems to conflicts about values or intimacy.',
      symptoms: ['Communication breakdown', 'Frequent conflicts', 'Emotional distance', 'Trust issues', 'Intimacy problems', 'Unmet needs'],
      effects: ['Relationship dissatisfaction', 'Emotional distress', 'Impact on mental health', 'Potential relationship breakdown'],
      coping: ['Couples therapy', 'Communication skills', 'Active listening', 'Conflict resolution', 'Quality time', 'Individual therapy'],
    },
  },
  {
    id: 'attachment-anxious',
    title: 'Attachment Issues (Anxious)',
    shortDescription: 'An attachment style characterized by fear of abandonment and need for constant reassurance in relationships.',
    imagePrompt: 'A figure being gently held by secure, reassuring light.',
    content: {
      overview: 'Anxious attachment involves a pattern of seeking closeness and reassurance in relationships, often accompanied by fear of abandonment and worry about the relationship.',
      symptoms: ['Fear of abandonment', 'Need for reassurance', 'Relationship anxiety', 'Preoccupation with partner', 'Difficulty with independence', 'Sensitivity to rejection'],
      effects: ['Relationship strain', 'Emotional exhaustion', 'Pushing partners away', 'Difficulty with trust', 'Anxiety'],
      coping: ['Understanding attachment patterns', 'Building self-soothing skills', 'Therapy', 'Communication', 'Working on self-worth', 'Mindfulness'],
    },
  },
  {
    id: 'attachment-avoidant',
    title: 'Attachment Issues (Avoidant)',
    shortDescription: 'An attachment style characterized by discomfort with closeness and emotional intimacy.',
    imagePrompt: 'A figure slowly opening a door to gentle, safe connection.',
    content: {
      overview: 'Avoidant attachment involves a pattern of maintaining emotional distance in relationships, discomfort with intimacy, and strong emphasis on independence.',
      symptoms: ['Discomfort with closeness', 'Difficulty expressing emotions', 'Valuing independence highly', 'Avoiding vulnerability', 'Emotional distance', 'Difficulty with commitment'],
      effects: ['Relationship difficulties', 'Loneliness', 'Missed intimacy', 'Partner frustration', 'Difficulty forming deep connections'],
      coping: ['Understanding attachment patterns', 'Gradually increasing vulnerability', 'Therapy', 'Communication', 'Recognizing needs for connection', 'Building trust'],
    },
  },
  {
    id: 'attachment-disorganised',
    title: 'Attachment Issues (Disorganised)',
    shortDescription: 'An attachment style characterized by inconsistent behavior and difficulty with trust and intimacy.',
    imagePrompt: 'A figure finding balance between connection and safety in soft light.',
    content: {
      overview: 'Disorganized attachment involves inconsistent patterns in relationships, often stemming from trauma or unpredictable caregiving, leading to both desire for and fear of closeness.',
      symptoms: ['Inconsistent behavior', 'Fear of intimacy and abandonment', 'Difficulty trusting', 'Emotional dysregulation', 'Push-pull dynamics', 'Confusion about relationships'],
      effects: ['Chaotic relationships', 'Emotional distress', 'Difficulty maintaining relationships', 'Trust issues', 'Mental health challenges'],
      coping: ['Trauma-informed therapy', 'Building secure relationships', 'Understanding patterns', 'Emotion regulation', 'Creating safety', 'Long-term support'],
    },
  },
  {
    id: 'family-conflict',
    title: 'Family Conflict',
    shortDescription: 'Ongoing disagreements, tension, or dysfunction within family relationships.',
    imagePrompt: 'A family tree with branches gently reconnecting through soft light.',
    content: {
      overview: 'Family conflict involves ongoing disagreements, tension, or dysfunction within family relationships, which can significantly impact mental health and wellbeing.',
      symptoms: ['Frequent arguments', 'Communication breakdown', 'Tension', 'Avoidance', 'Resentment', 'Emotional distress'],
      effects: ['Stress and anxiety', 'Impact on mental health', 'Strained relationships', 'Difficulty with boundaries', 'Emotional exhaustion'],
      coping: ['Family therapy', 'Setting boundaries', 'Communication skills', 'Individual therapy', 'Taking space when needed', 'Conflict resolution'],
    },
  },
  {
    id: 'toxic-relationships',
    title: 'Toxic / Difficult Relationships',
    shortDescription: 'Relationships characterized by manipulation, control, or consistent negativity that harm wellbeing.',
    imagePrompt: 'A figure stepping away from shadows into protective, empowering light.',
    content: {
      overview: 'Toxic relationships involve patterns of behavior that are harmful to one&apos;s mental, emotional, or physical wellbeing, including manipulation, control, or consistent negativity.',
      symptoms: ['Feeling drained', 'Walking on eggshells', 'Manipulation', 'Lack of respect', 'Control', 'Constant criticism', 'Feeling worse after interactions'],
      effects: ['Decreased self-esteem', 'Anxiety and depression', 'Isolation', 'Physical health issues', 'Loss of identity'],
      coping: ['Recognizing patterns', 'Setting boundaries', 'Seeking support', 'Considering ending relationship', 'Therapy', 'Building self-worth'],
    },
  },
  {
    id: 'breakups-heartbreak',
    title: 'Breakups & Heartbreak',
    shortDescription: 'The emotional pain and adjustment process following the end of a romantic relationship.',
    imagePrompt: 'A heart gently healing with soft, nurturing light surrounding it.',
    content: {
      overview: 'Breakups and heartbreak involve the emotional pain and adjustment process that follows the end of a romantic relationship, which can be a significant life stressor.',
      symptoms: ['Sadness and grief', 'Difficulty concentrating', 'Changes in appetite or sleep', 'Loneliness', 'Anger', 'Rumination', 'Physical pain'],
      effects: ['Emotional distress', 'Impact on daily functioning', 'Social withdrawal', 'Temporary depression', 'Loss of identity'],
      coping: ['Allowing grief', 'Social support', 'Self-care', 'No contact period', 'Therapy', 'New routines', 'Time and patience'],
    },
  },
  {
    id: 'loneliness',
    title: 'Loneliness',
    shortDescription: 'A subjective feeling of being alone or disconnected from others, regardless of social contact.',
    imagePrompt: 'A figure reaching out to gentle, welcoming connections of light.',
    content: {
      overview: 'Loneliness is the subjective feeling of being alone, isolated, or disconnected from others, which can occur even when surrounded by people.',
      symptoms: ['Feeling isolated', 'Lack of meaningful connection', 'Emptiness', 'Difficulty connecting', 'Social anxiety', 'Feeling misunderstood'],
      effects: ['Depression', 'Anxiety', 'Physical health issues', 'Reduced quality of life', 'Impact on self-esteem'],
      coping: ['Reaching out to others', 'Joining groups or activities', 'Volunteering', 'Therapy', 'Building quality connections', 'Self-compassion'],
    },
  },

  // WORK / STUDY
  {
    id: 'work-stress-burnout',
    title: 'Work Stress & Burnout',
    shortDescription: 'Chronic workplace stress leading to physical and emotional exhaustion.',
    imagePrompt: 'A figure finding balance between work and rest in peaceful harmony.',
    content: {
      overview: 'Work stress and burnout result from chronic workplace stress that hasn&apos;t been successfully managed, leading to exhaustion, cynicism, and reduced professional efficacy.',
      symptoms: ['Chronic fatigue', 'Reduced performance', 'Cynicism about work', 'Irritability', 'Difficulty concentrating', 'Physical symptoms', 'Detachment'],
      effects: ['Health problems', 'Decreased productivity', 'Job dissatisfaction', 'Relationship strain', 'Mental health issues'],
      coping: ['Setting work boundaries', 'Time management', 'Stress reduction techniques', 'Taking breaks', 'Seeking support', 'Considering job changes'],
    },
  },
  {
    id: 'procrastination',
    title: 'Procrastination',
    shortDescription: 'Delaying or postponing tasks despite knowing there may be negative consequences.',
    imagePrompt: 'A figure taking the first step on a gentle, encouraging path forward.',
    content: {
      overview: 'Procrastination involves voluntarily delaying tasks despite expecting to be worse off for the delay, often driven by anxiety, perfectionism, or difficulty with self-regulation.',
      symptoms: ['Delaying tasks', 'Last-minute rushing', 'Guilt and stress', 'Difficulty starting', 'Distraction-seeking', 'Avoidance'],
      effects: ['Increased stress', 'Reduced quality of work', 'Missed opportunities', 'Guilt and shame', 'Impact on goals'],
      coping: ['Breaking tasks into steps', 'Time management techniques', 'Addressing underlying anxiety', 'Self-compassion', 'Accountability', 'Understanding triggers'],
    },
  },
  {
    id: 'academic-stress',
    title: 'Academic Stress',
    shortDescription: 'Stress related to educational demands, performance pressure, and academic expectations.',
    imagePrompt: 'A student surrounded by supportive, organized light and calm energy.',
    content: {
      overview: 'Academic stress involves the pressure and anxiety related to educational demands, including exams, assignments, grades, and future career concerns.',
      symptoms: ['Anxiety about performance', 'Difficulty concentrating', 'Sleep problems', 'Overwhelm', 'Perfectionism', 'Physical symptoms', 'Avoidance'],
      effects: ['Reduced academic performance', 'Mental health issues', 'Physical health problems', 'Social withdrawal', 'Burnout'],
      coping: ['Time management', 'Study strategies', 'Stress management', 'Seeking academic support', 'Self-care', 'Realistic expectations', 'Counseling'],
    },
  },

  // GRIEF & LOSS
  {
    id: 'grief-bereavement',
    title: 'Grief & Bereavement',
    shortDescription: 'The natural response to loss, particularly the death of a loved one.',
    imagePrompt: 'A figure holding memories like gentle lights in a peaceful space.',
    content: {
      overview: 'Grief is the natural response to loss, particularly the death of someone or something to which a bond was formed. It involves a range of emotions and is a highly individual process.',
      symptoms: ['Sadness', 'Yearning', 'Anger', 'Guilt', 'Numbness', 'Physical symptoms', 'Difficulty accepting loss', 'Changes in sleep or appetite'],
      effects: ['Emotional pain', 'Difficulty functioning', 'Social withdrawal', 'Physical health impact', 'Changes in identity'],
      coping: ['Allowing grief process', 'Social support', 'Grief counseling', 'Self-care', 'Memorializing', 'Patience with process', 'Support groups'],
    },
  },
  {
    id: 'ambiguous-loss',
    title: 'Ambiguous Loss',
    shortDescription: 'Loss without closure or clear understanding, such as estrangement or missing persons.',
    imagePrompt: 'A figure holding space for uncertainty with gentle, patient light.',
    content: {
      overview: 'Ambiguous loss is a loss that occurs without closure or clear understanding, such as when a loved one is physically present but psychologically absent, or physically absent with unclear circumstances.',
      symptoms: ['Confusion', 'Difficulty grieving', 'Ongoing uncertainty', 'Guilt', 'Anxiety', 'Difficulty moving forward', 'Conflicting emotions'],
      effects: ['Prolonged distress', 'Difficulty with closure', 'Relationship strain', 'Mental health challenges', 'Feeling stuck'],
      coping: ['Accepting uncertainty', 'Finding meaning', 'Support groups', 'Therapy', 'Creating rituals', 'Self-compassion', 'Building resilience'],
    },
  },

  // ADDICTION & HABITS
  {
    id: 'substance-use',
    title: 'Substance Use & Addiction',
    shortDescription: 'Problematic use of substances that interferes with health, relationships, and daily functioning.',
    imagePrompt: 'A figure choosing a path toward health and freedom in gentle light.',
    content: {
      overview: 'Substance use disorder involves a problematic pattern of substance use leading to significant impairment or distress. Recovery is possible with appropriate support and treatment.',
      symptoms: ['Inability to control use', 'Continued use despite problems', 'Tolerance', 'Withdrawal symptoms', 'Neglecting responsibilities', 'Cravings'],
      effects: ['Health problems', 'Relationship difficulties', 'Financial issues', 'Legal problems', 'Mental health challenges', 'Impact on work or school'],
      coping: ['Professional treatment', 'Support groups', 'Therapy', 'Harm reduction', 'Building support network', 'Addressing underlying issues', 'Developing coping skills'],
    },
  },
  {
    id: 'alcohol-misuse',
    title: 'Alcohol Misuse',
    shortDescription: 'Problematic alcohol use that negatively impacts health, relationships, or daily life.',
    imagePrompt: 'A figure stepping toward clarity and health with supportive light.',
    content: {
      overview: 'Alcohol misuse ranges from risky drinking to alcohol use disorder, involving patterns of alcohol use that cause health or social problems.',
      symptoms: ['Drinking more than intended', 'Inability to cut down', 'Time spent drinking or recovering', 'Cravings', 'Neglecting responsibilities', 'Continued use despite problems'],
      effects: ['Health problems', 'Relationship issues', 'Work or school problems', 'Legal issues', 'Mental health challenges', 'Financial difficulties'],
      coping: ['Professional help', 'Support groups (AA, SMART Recovery)', 'Therapy', 'Medical support', 'Identifying triggers', 'Building sober support network'],
    },
  },
  {
    id: 'nicotine-dependence',
    title: 'Nicotine Dependence',
    shortDescription: 'Physical and psychological dependence on nicotine from tobacco or vaping products.',
    imagePrompt: 'A figure breathing freely in clean, refreshing air with soft light.',
    content: {
      overview: 'Nicotine dependence involves physical and psychological addiction to nicotine, making it difficult to quit despite knowing the health risks.',
      symptoms: ['Cravings', 'Withdrawal symptoms', 'Difficulty quitting', 'Using despite health problems', 'Tolerance', 'Irritability when unable to use'],
      effects: ['Health problems', 'Financial cost', 'Social limitations', 'Reduced quality of life', 'Anxiety about quitting'],
      coping: ['Nicotine replacement therapy', 'Medication', 'Behavioral therapy', 'Support groups', 'Identifying triggers', 'Gradual reduction', 'Professional support'],
    },
  },
  {
    id: 'behavioral-addictions',
    title: 'Behavioural Addictions',
    shortDescription: 'Compulsive engagement in rewarding behaviors despite negative consequences, such as gaming, social media, or gambling.',
    imagePrompt: 'A figure finding balance and freedom from compulsive patterns in calm light.',
    content: {
      overview: 'Behavioral addictions involve compulsive engagement in rewarding non-substance-related behaviors, such as gaming, internet use, gambling, or pornography, despite negative consequences.',
      symptoms: ['Preoccupation with behavior', 'Loss of control', 'Continued engagement despite problems', 'Withdrawal symptoms', 'Tolerance', 'Neglecting responsibilities'],
      effects: ['Relationship problems', 'Work or school issues', 'Financial difficulties', 'Mental health challenges', 'Physical health problems', 'Social isolation'],
      coping: ['Therapy (CBT, DBT)', 'Support groups', 'Setting limits', 'Identifying triggers', 'Developing alternative activities', 'Addressing underlying issues', 'Professional help'],
    },
  },
];
