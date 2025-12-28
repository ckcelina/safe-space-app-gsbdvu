
// supabase/functions/generate-ai-response/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Check if we're in development mode (set via environment variable)
const IS_DEV = Deno.env.get("DEV_MODE") === "true";

// Timeout configuration (in milliseconds)
const OPENAI_TIMEOUT_MS = 18000; // 18 seconds (leave 2s buffer for processing)
const TOTAL_FUNCTION_TIMEOUT_MS = 20000; // 20 seconds total

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========== THERAPIST PERSONA DEFINITIONS ==========
// Therapist personas for conversational style (non-medical)
// Each persona includes style metadata to create distinct communication patterns

interface TherapistPersonaStyle {
  name: string;
  system_prompt: string;
  min_words?: number;
  max_words?: number;
  verbosity?: 'short' | 'medium' | 'long';
  pacing?: 'rapid' | 'steady' | 'slow';
  structure?: 'bullets' | 'paragraphs' | 'mixed';
  question_rate?: 'low' | 'medium' | 'high';
  empathy_level?: 'low' | 'medium' | 'high';
  directness?: 'low' | 'medium' | 'high';
  metaphor_use?: 'none' | 'light' | 'often';
  signoff_style?: 'none' | 'gentle' | 'encouraging';
  opening_style?: string;
  transition_phrases?: string[];
  closing_style?: string | null;
  forbidden_phrases?: string[];
}

const THERAPIST_PERSONAS: Record<string, TherapistPersonaStyle> = {
  dr_elias: {
    name: "Dr. Elias",
    system_prompt: `You are Dr. Elias. Speak slowly, calmly, and with emotional steadiness. Use grounding language, reassurance, and gentle perspective. Avoid urgency. Prioritize emotional safety and regulation. Do not diagnose or label the user.`,
    verbosity: 'medium',
    min_words: 120,
    max_words: 220,
    pacing: 'slow',
    structure: 'paragraphs',
    question_rate: 'low',
    empathy_level: 'high',
    directness: 'medium',
    metaphor_use: 'light',
    signoff_style: 'gentle',
    opening_style: "Let's take a breath for a moment.",
    closing_style: "We can take this one step at a time.",
  },
  noah: {
    name: "Noah",
    system_prompt: `You are Noah. Communicate clearly and practically. Ask clarifying questions when needed. Focus on structure, patterns, and actionable reflection. Be supportive but concise. Do not diagnose or label the user.`,
    verbosity: 'short',
    min_words: 70,
    max_words: 140,
    pacing: 'rapid',
    structure: 'bullets',
    question_rate: 'medium',
    empathy_level: 'medium',
    directness: 'high',
    metaphor_use: 'none',
    signoff_style: 'none',
    opening_style: "Okay. Here's the clean version:",
  },
  maya: {
    name: "Maya",
    system_prompt: `You are Maya. Lead with empathy and validation. Reflect emotions clearly and warmly. Avoid rushing solutions. Use gentle language and supportive framing. Do not diagnose or label the user.`,
    verbosity: 'medium',
    min_words: 140,
    max_words: 240,
    pacing: 'steady',
    structure: 'mixed',
    question_rate: 'medium',
    empathy_level: 'high',
    directness: 'low',
    metaphor_use: 'light',
    signoff_style: 'gentle',
    opening_style: "That sounds really heavy to carry.",
    closing_style: "I'm here with you in this.",
  },
  claire: {
    name: "Claire",
    system_prompt: `You are Claire. Ask thoughtful, reflective questions. Highlight patterns gently. Encourage self-awareness without judgment or pressure. Do not diagnose or label the user.`,
    verbosity: 'long',
    min_words: 200,
    max_words: 340,
    pacing: 'slow',
    structure: 'paragraphs',
    question_rate: 'high',
    empathy_level: 'medium',
    directness: 'medium',
    metaphor_use: 'often',
    signoff_style: 'none',
    opening_style: "Something in what you said feels important.",
  },
  ruth: {
    name: "Ruth",
    system_prompt: `You are Ruth. Speak with warmth, care, and emotional steadiness. Offer reassurance and gentle perspective. Avoid being patronizing. Do not diagnose or label the user.`,
    verbosity: 'long',
    min_words: 220,
    max_words: 380,
    pacing: 'slow',
    structure: 'paragraphs',
    question_rate: 'low',
    empathy_level: 'high',
    directness: 'medium',
    metaphor_use: 'often',
    signoff_style: 'encouraging',
    opening_style: "Oh love, of course you feel this way.",
    closing_style: "Be gentle with yourself today.",
  },
  jordan: {
    name: "Jordan",
    system_prompt: `You are Jordan. Be encouraging, affirming, and strength-focused. Highlight resilience and growth while staying emotionally respectful. Do not diagnose or label the user.`,
    verbosity: 'medium',
    min_words: 140,
    max_words: 260,
    pacing: 'rapid',
    structure: 'mixed',
    question_rate: 'low',
    empathy_level: 'high',
    directness: 'medium',
    metaphor_use: 'light',
    signoff_style: 'encouraging',
    opening_style: "I'm proud of you for saying that out loud.",
    closing_style: "You've got this—small steps count.",
  },
  aisha: {
    name: "Aisha",
    system_prompt: `You are Aisha. Lead with curiosity. Ask open-ended questions. Explore perspectives without steering or fixing. Encourage discovery. Do not diagnose or label the user.`,
    verbosity: 'medium',
    min_words: 160,
    max_words: 280,
    pacing: 'steady',
    structure: 'bullets',
    question_rate: 'high',
    empathy_level: 'medium',
    directness: 'low',
    metaphor_use: 'light',
    signoff_style: 'none',
    opening_style: "Can I get curious with you for a second?",
  },
  ken: {
    name: "Ken",
    system_prompt: `You are Ken. Balance emotional awareness with logical clarity. Integrate feelings and reasoning calmly. Maintain a composed, respectful tone. Do not diagnose or label the user.`,
    verbosity: 'medium',
    min_words: 160,
    max_words: 280,
    pacing: 'steady',
    structure: 'bullets',
    question_rate: 'medium',
    empathy_level: 'medium',
    directness: 'high',
    metaphor_use: 'none',
    signoff_style: 'none',
    opening_style: "Let's break this down logically:",
  },
};

function getPersonaSystemPrompt(personaId: string): string {
  const persona = THERAPIST_PERSONAS[personaId];
  return persona?.system_prompt || '';
}

function getPersonaStyleMetadata(personaId: string): TherapistPersonaStyle | null {
  return THERAPIST_PERSONAS[personaId] || null;
}

// ========== SAFE HELPERS ==========
function asText(value: any): string {
  try {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
      return value
        .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
        .filter(Boolean)
        .join(", ");
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  } catch {
    return "";
  }
}

function clean(value: any): string {
  // NEVER call .trim() on unknown types — we always convert to string first
  return asText(value).trim().replace(/\s+/g, " ");
}

function isDevEnv(): boolean {
  try {
    const env = (Deno.env.get("ENV") || "").toLowerCase();
    const nodeEnv = (Deno.env.get("NODE_ENV") || "").toLowerCase();
    return env === "dev" || nodeEnv !== "production";
  } catch {
    return true;
  }
}

// ========= YOUR EXISTING DATA (kept) =========
// Psychology facts database
const PSYCHOLOGY_FACTS = [
  "Did you know? Expressing gratitude regularly can actually rewire your brain to be more positive over time.",
  "Psychology fact: The brain processes emotional pain similarly to physical pain - that's why heartbreak can literally hurt.",
  "Interesting: Writing about difficult experiences for just 15-20 minutes can significantly improve mental health outcomes.",
  "Fun fact: Helping others releases endorphins, creating what's known as a 'helper's high'.",
  "Did you know? Mindfulness meditation can reduce anxiety by up to 38% when practiced regularly.",
  "Psychology insight: People who journal about their relationships tend to have better communication skills.",
  "Fact: Sleep is crucial for emotional regulation - even one night of poor sleep can make us more emotionally reactive.",
  "Cool fact: Hugs lasting 20 seconds or more release oxytocin, which reduces stress and increases bonding.",
  "Interesting: People who practice self-compassion have lower rates of anxiety and depression.",
  "Psychology tip: Naming your emotions (like 'I feel anxious') can reduce their intensity by up to 50%."
];

// Condition information for education
const CONDITION_INFO: any = {
  narcissistic: {
    name: "Narcissistic Personality Traits",
    keyPoints: [
      "Often involves a pattern of grandiosity, need for admiration, and lack of empathy",
      "Can manifest as difficulty handling criticism and sense of entitlement",
      "Remember: You can't change someone else, but you can change how you respond",
      "Setting clear boundaries is crucial for self-protection"
    ],
    resources: "Consider reading 'Disarming the Narcissist' or speaking with a therapist specializing in personality disorders"
  },
  adhd: {
    name: "ADHD (Attention-Deficit/Hyperactivity Disorder)",
    keyPoints: [
      "A neurodevelopmental disorder affecting executive functions",
      "Can impact attention, impulse control, and emotional regulation",
      "Understanding the neurological basis helps reduce stigma",
      "Effective management often combines medication, therapy, and lifestyle adjustments"
    ],
    resources: "CHADD.org offers excellent resources, and Cognitive Behavioral Therapy adapted for ADHD can be very effective"
  },
  addiction: {
    name: "Addiction and Substance Use",
    keyPoints: [
      "Addiction is a complex brain disorder, not a moral failing",
      "Recovery is often non-linear with potential for relapse",
      "Support systems are crucial for long-term recovery",
      "Co-dependency can develop in relationships affected by addiction"
    ],
    resources: "SAMHSA National Helpline: 1-800-662-HELP (4357). Al-Anon and Nar-Anon provide support for loved ones"
  },
  bipolar: {
    name: "Bipolar Disorder",
    keyPoints: [
      "Involves periods of depression and mania/hypomania",
      "Medication adherence is often crucial for stability",
      "Mood tracking can help identify patterns and triggers",
      "Loved ones can learn to recognize early warning signs"
    ],
    resources: "The Depression and Bipolar Support Alliance (DBSA) offers excellent resources and support groups"
  },
  depression: {
    name: "Depression",
    keyPoints: [
      "More than just sadness - affects energy, motivation, and cognition",
      "Treatment is highly effective for most people",
      "Social support significantly improves recovery outcomes",
      "Small, consistent actions often work better than trying to make big changes"
    ],
    resources: "Therapy approaches like CBT are well-researched. National Suicide Prevention Lifeline: 988 (US and Canada)"
  },
  anxiety: {
    name: "Anxiety",
    keyPoints: [
      "Anxiety is the body's natural response to perceived threats",
      "Chronic anxiety can become debilitating if not managed",
      "Breathing exercises can quickly reduce anxiety symptoms",
      "Gradual exposure to feared situations can reduce anxiety over time"
    ],
    resources: "Apps like Calm or Headspace can teach mindfulness techniques that reduce anxiety"
  },
  ptsd: {
    name: "PTSD (Post-Traumatic Stress Disorder)",
    keyPoints: [
      "Can develop after experiencing or witnessing trauma",
      "Symptoms may include flashbacks, nightmares, and hypervigilance",
      "Trauma-focused therapies like EMDR can be very effective",
      "Healing is possible with proper support and treatment"
    ],
    resources: "Trauma-focused therapy and support groups can help. The PTSD Alliance offers great information"
  }
};

// ═══════════════════════════════════════════════════════════════════
// VENTING DETECTION & EMOTIONAL INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════
// Detects when the user is venting vs. actively seeking advice
// When venting: AI responds with acknowledgment, not solutions
// Respects emotional pauses and doesn't rush to fill silence
// ═══════════════════════════════════════════════════════════════════

interface VentingAnalysis {
  isVenting: boolean;
  isAskingForAdvice: boolean;
  emotionalIntensity: 'low' | 'medium' | 'high';
  needsSpace: boolean;
  reasoning: string;
}

/**
 * Analyze user message to detect venting vs. advice-seeking
 * 
 * VENTING INDICATORS:
 * - Emotional expression without questions
 * - Statements of frustration, overwhelm, or distress
 * - Narrative storytelling about difficult experiences
 * - Repetitive emotional themes
 * - No explicit request for solutions
 * 
 * ADVICE-SEEKING INDICATORS:
 * - Direct questions about what to do
 * - Explicit requests for suggestions or guidance
 * - "Should I..." or "How can I..." phrasing
 * - Asking for opinions or perspectives
 */
function analyzeVentingVsAdviceSeeking(message: string): VentingAnalysis {
  const lowerMessage = (message || "").toLowerCase();
  
  // ═══════════════════════════════════════════════════════════════════
  // ADVICE-SEEKING DETECTION
  // ═══════════════════════════════════════════════════════════════════
  const adviceKeywords = [
    "what should i do", "what can i do", "advice", "help me",
    "suggestion", "what do you think", "how should i", "how can i",
    "what would you do", "need advice", "looking for advice",
    "any suggestions", "what's your advice", "guide me", "tell me what to do",
    "what would you recommend", "what's the best way", "how do i handle"
  ];
  
  const isAskingForAdvice = adviceKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // ═══════════════════════════════════════════════════════════════════
  // VENTING DETECTION
  // ═══════════════════════════════════════════════════════════════════
  
  // Venting indicators: emotional expression without seeking solutions
  const ventingIndicators = [
    // Frustration expressions
    "i'm so tired of", "i can't stand", "i hate that", "i'm sick of",
    "this is ridiculous", "this is insane", "i can't believe",
    
    // Overwhelm expressions
    "i'm so overwhelmed", "i can't handle", "it's too much", "i'm drowning",
    "i can't take it anymore", "i'm at my limit", "i'm breaking down",
    
    // Emotional release
    "i just need to", "i need to vent", "i need to get this out",
    "i just have to say", "i'm just so", "i feel like",
    
    // Narrative storytelling (past tense, descriptive)
    "and then they", "and then he", "and then she", "so then",
    "after that", "the other day", "yesterday", "last week",
    
    // Emotional statements without questions
    "i'm just", "i feel", "i'm feeling", "it's like", "it feels like"
  ];
  
  const ventingIndicatorCount = ventingIndicators.filter(indicator => 
    lowerMessage.includes(indicator)
  ).length;
  
  // Check for questions (advice-seeking often includes questions)
  const hasQuestionMark = message.includes('?');
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'should', 'could', 'would'];
  const hasQuestionWord = questionWords.some(word => 
    lowerMessage.split(/\s+/).includes(word)
  );
  
  // ═══════════════════════════════════════════════════════════════════
  // EMOTIONAL INTENSITY DETECTION
  // ═══════════════════════════════════════════════════════════════════
  const highIntensityKeywords = [
    'overwhelmed', 'can\'t handle', 'breaking down', 'falling apart',
    'too much', 'drowning', 'suffocating', 'panic', 'terrified',
    'devastated', 'destroyed', 'shattered', 'hopeless', 'desperate',
    'can\'t take it', 'at my limit', 'losing it'
  ];
  
  const mediumIntensityKeywords = [
    'anxious', 'worried', 'scared', 'sad', 'hurt', 'angry',
    'frustrated', 'confused', 'lost', 'stuck', 'exhausted',
    'stressed', 'upset', 'disappointed', 'lonely', 'tired of'
  ];
  
  const hasHighIntensity = highIntensityKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasMediumIntensity = mediumIntensityKeywords.some(keyword => lowerMessage.includes(keyword));
  
  let emotionalIntensity: 'low' | 'medium' | 'high' = 'low';
  if (hasHighIntensity) {
    emotionalIntensity = 'high';
  } else if (hasMediumIntensity) {
    emotionalIntensity = 'medium';
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // DECISION LOGIC
  // ═══════════════════════════════════════════════════════════════════
  
  // If explicitly asking for advice, not venting
  if (isAskingForAdvice) {
    return {
      isVenting: false,
      isAskingForAdvice: true,
      emotionalIntensity,
      needsSpace: false,
      reasoning: 'User is explicitly asking for advice or guidance'
    };
  }
  
  // If high emotional intensity + no questions = likely venting
  if (emotionalIntensity === 'high' && !hasQuestionMark) {
    return {
      isVenting: true,
      isAskingForAdvice: false,
      emotionalIntensity,
      needsSpace: true,
      reasoning: 'High emotional intensity without questions - user needs acknowledgment and space'
    };
  }
  
  // If multiple venting indicators + no advice keywords = venting
  if (ventingIndicatorCount >= 2 && !isAskingForAdvice) {
    return {
      isVenting: true,
      isAskingForAdvice: false,
      emotionalIntensity,
      needsSpace: emotionalIntensity !== 'low',
      reasoning: 'Multiple venting indicators detected - user is expressing emotions, not seeking solutions'
    };
  }
  
  // If has question words but also venting indicators = mixed (lean toward venting if emotional)
  if (hasQuestionWord && ventingIndicatorCount >= 1 && emotionalIntensity !== 'low') {
    return {
      isVenting: true,
      isAskingForAdvice: false,
      emotionalIntensity,
      needsSpace: true,
      reasoning: 'Emotional expression with rhetorical questions - user needs validation first'
    };
  }
  
  // Default: not clearly venting or advice-seeking
  return {
    isVenting: false,
    isAskingForAdvice: false,
    emotionalIntensity,
    needsSpace: false,
    reasoning: 'Neutral message - respond naturally'
  };
}

/**
 * Build venting response guidance for the AI
 * When user is venting, AI should acknowledge, not solve
 */
function buildVentingResponseGuidance(analysis: VentingAnalysis): string {
  if (!analysis.isVenting) {
    return '';
  }
  
  let guidance = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑 VENTING DETECTED - CRITICAL RESPONSE GUIDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSIS: ${analysis.reasoning}
EMOTIONAL INTENSITY: ${analysis.emotionalIntensity.toUpperCase()}
NEEDS SPACE: ${analysis.needsSpace ? 'YES' : 'NO'}

⚠️ THE USER IS VENTING, NOT ASKING FOR ADVICE

RESPONSE REQUIREMENTS (FOLLOW STRICTLY):

✓ DO:
- Acknowledge what they're feeling
- Validate their emotional experience
- Use short, affirming statements
- Reflect back what you hear
- Allow space for silence
- Optional: Ask ONE gentle follow-up question ONLY if appropriate
- Use phrases like:
  * "That sounds really hard."
  * "I hear you."
  * "That makes complete sense."
  * "Of course you feel that way."
  * "I'm here with you."
  * "That's a lot to carry."

✗ DO NOT:
- Offer solutions or advice
- Use "you should" or "try this" language
- Rush to fix or problem-solve
- Ask multiple questions
- Provide lengthy responses
- Give suggestions unless explicitly asked
- Say things like:
  * "Have you tried..."
  * "What if you..."
  * "You should..."
  * "Maybe you could..."
  * "Here's what I'd do..."

`;

  // Add intensity-specific guidance
  if (analysis.emotionalIntensity === 'high') {
    guidance += `HIGH EMOTIONAL INTENSITY GUIDANCE:
⚠️ User is in acute distress - prioritize emotional safety
- Keep response VERY brief (20-40 words max)
- Focus ONLY on validation and grounding
- NO questions unless absolutely necessary
- Example: "I hear you. That's overwhelming. You're not alone in this."

`;
  } else if (analysis.emotionalIntensity === 'medium') {
    guidance += `MEDIUM EMOTIONAL INTENSITY GUIDANCE:
- Keep response brief (40-60 words)
- Balance validation with gentle presence
- ONE optional follow-up question if it helps them feel heard
- Example: "That sounds really frustrating. It makes sense you'd feel this way. What's the hardest part right now?"

`;
  } else {
    guidance += `LOW EMOTIONAL INTENSITY GUIDANCE:
- Keep response moderate (50-80 words)
- Validate and reflect back
- ONE optional follow-up question to deepen understanding
- Example: "I hear what you're saying. That situation sounds difficult. How are you holding up with all of this?"

`;
  }
  
  guidance += `SILENCE IS PART OF SAFETY:
- Don't rush to fill emotional pauses
- Brief responses are often more powerful than long ones
- The user needs to feel HEARD, not GUIDED
- Resist the urge to fix or solve

⚠️ THIS GUIDANCE OVERRIDES ALL OTHER INSTRUCTIONS
The user is venting. Your job is to witness, not to advise.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  return guidance;
}

// Helper function to detect if user is asking for advice (kept for backward compatibility)
function isAskingForAdvice(message: string): boolean {
  const analysis = analyzeVentingVsAdviceSeeking(message);
  return analysis.isAskingForAdvice;
}

// Helper function to detect if user wants to learn
function wantsToLearn(message: string): boolean {
  const learnKeywords = [
    "tell me about", "explain", "what is", "how does",
    "psychology fact", "learn about", "teach me", "interesting fact",
    "did you know", "fun fact", "share something", "educational"
  ];
  const lowerMessage = (message || "").toLowerCase();
  return learnKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Helper function to detect mental health conditions
function detectCondition(message: string): string | null {
  const conditionMap: Record<string, string[]> = {
    narcissistic: ["narcissist", "narcissistic", "self-absorbed", "grandiose", "lack empathy", "entitled"],
    adhd: ["adhd", "attention deficit", "hyperactive", "can't focus", "distracted", "impulsive"],
    addiction: ["addiction", "addicted", "alcohol", "drugs", "substance", "sobriety", "relapse", "alcoholic"],
    bipolar: ["bipolar", "manic", "mania", "depressive episode", "mood swings", "bipolar disorder"],
    depression: ["depressed", "depression", "hopeless", "can't get out of bed", "suicidal", "sad all the time"],
    anxiety: ["anxiety", "anxious", "panic attack", "worried", "stressed", "overwhelmed"],
    ptsd: ["ptsd", "trauma", "flashback", "nightmare", "traumatic", "triggered"],
    ocd: ["ocd", "obsessive", "compulsive", "ritual", "obsession"],
    autism: ["autism", "autistic", "asperger", "on the spectrum", "neurodivergent"],
    bpd: ["bpd", "borderline", "emotional instability", "fear of abandonment"]
  };

  const lowerMessage = (message || "").toLowerCase();
  for (const [condition, keywords] of Object.entries(conditionMap)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) return condition;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// NEW: ADAPTIVE RESPONSE LENGTH & EMOTIONAL PACING
// ═══════════════════════════════════════════════════════════════════
// Analyzes user input to determine appropriate response length and pacing
// Prevents overwhelming users with excessive text or emotional intensity
// ═══════════════════════════════════════════════════════════════════

interface ResponseLengthGuidance {
  targetWords: number;
  maxQuestions: number;
  pacing: 'slow' | 'steady' | 'rapid';
  emotionalIntensity: 'low' | 'medium' | 'high';
  reasoning: string;
}

/**
 * Analyze user input to determine appropriate response length and pacing
 * 
 * RULES:
 * - Short user input → short response
 * - Emotional user input → slow down, don't expand
 * - Avoid multi-paragraph responses unless user asks for depth
 * - Max 1 question per response unless clarification required
 */
function analyzeUserInputForResponseGuidance(userMessage: string): ResponseLengthGuidance {
  const wordCount = userMessage.trim().split(/\s+/).length;
  const lowerMessage = userMessage.toLowerCase();
  
  // Detect emotional intensity
  const highEmotionKeywords = [
    'overwhelmed', 'can\'t handle', 'breaking down', 'falling apart',
    'too much', 'drowning', 'suffocating', 'panic', 'terrified',
    'devastated', 'destroyed', 'shattered', 'hopeless', 'desperate'
  ];
  
  const mediumEmotionKeywords = [
    'anxious', 'worried', 'scared', 'sad', 'hurt', 'angry',
    'frustrated', 'confused', 'lost', 'stuck', 'exhausted',
    'stressed', 'upset', 'disappointed', 'lonely'
  ];
  
  const hasHighEmotion = highEmotionKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasMediumEmotion = mediumEmotionKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Detect if user is asking for depth
  const askingForDepth = 
    lowerMessage.includes('explain') ||
    lowerMessage.includes('tell me more') ||
    lowerMessage.includes('help me understand') ||
    lowerMessage.includes('why') ||
    lowerMessage.includes('how does');
  
  // Detect if user is asking multiple questions (needs clarification)
  const questionCount = (userMessage.match(/\?/g) || []).length;
  
  // ═══════════════════════════════════════════════════════════════════
  // DECISION LOGIC
  // ═══════════════════════════════════════════════════════════════════
  
  // CASE 1: Very short input (1-5 words) → Very short response
  if (wordCount <= 5) {
    return {
      targetWords: 30,
      maxQuestions: 1,
      pacing: 'steady',
      emotionalIntensity: 'low',
      reasoning: 'User input is very short - matching with brief response'
    };
  }
  
  // CASE 2: Short input (6-15 words) → Short response
  if (wordCount <= 15) {
    return {
      targetWords: 50,
      maxQuestions: 1,
      pacing: 'steady',
      emotionalIntensity: hasMediumEmotion ? 'medium' : 'low',
      reasoning: 'User input is short - keeping response concise'
    };
  }
  
  // CASE 3: High emotional intensity → Slow down, don't expand
  if (hasHighEmotion) {
    return {
      targetWords: 60,
      maxQuestions: 1,
      pacing: 'slow',
      emotionalIntensity: 'high',
      reasoning: 'High emotional intensity detected - slowing down and staying brief'
    };
  }
  
  // CASE 4: Medium emotional intensity → Moderate response
  if (hasMediumEmotion) {
    return {
      targetWords: 80,
      maxQuestions: 1,
      pacing: 'steady',
      emotionalIntensity: 'medium',
      reasoning: 'Medium emotional intensity - balanced response'
    };
  }
  
  // CASE 5: User asking for depth → Allow longer response
  if (askingForDepth) {
    return {
      targetWords: 150,
      maxQuestions: 1,
      pacing: 'steady',
      emotionalIntensity: 'low',
      reasoning: 'User explicitly asking for depth - providing detailed response'
    };
  }
  
  // CASE 6: User asking multiple questions → Allow 2-3 questions for clarification
  if (questionCount >= 2) {
    return {
      targetWords: 100,
      maxQuestions: 3,
      pacing: 'steady',
      emotionalIntensity: 'low',
      reasoning: 'User asking multiple questions - clarification needed'
    };
  }
  
  // CASE 7: Medium-length input (16-40 words) → Balanced response
  if (wordCount <= 40) {
    return {
      targetWords: 100,
      maxQuestions: 1,
      pacing: 'steady',
      emotionalIntensity: 'low',
      reasoning: 'Medium-length input - balanced response'
    };
  }
  
  // CASE 8: Long input (40+ words) → Thoughtful but not excessive response
  return {
    targetWords: 120,
    maxQuestions: 1,
    pacing: 'steady',
    emotionalIntensity: 'low',
    reasoning: 'Long input - thoughtful response without overwhelming'
  };
}

/**
 * Build response guidance instructions for the AI
 */
function buildResponseGuidanceInstructions(guidance: ResponseLengthGuidance): string {
  let instructions = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ RESPONSE LENGTH & PACING GUIDANCE (CRITICAL - FOLLOW STRICTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSIS: ${guidance.reasoning}

RESPONSE REQUIREMENTS:
- Target length: ~${guidance.targetWords} words (±20%)
- Maximum questions: ${guidance.maxQuestions}
- Pacing: ${guidance.pacing}
- Emotional intensity: ${guidance.emotionalIntensity}

`;

  // Add pacing-specific instructions
  if (guidance.pacing === 'slow') {
    instructions += `PACING INSTRUCTIONS (SLOW):
- Use shorter, calmer sentences
- Pause between thoughts with line breaks
- Prioritize emotional grounding over information
- Speak slowly and gently
- Example: "That sounds really hard. [pause] Let's take this one step at a time."

`;
  } else if (guidance.pacing === 'rapid') {
    instructions += `PACING INSTRUCTIONS (RAPID):
- Be direct and efficient
- Get to the point quickly
- Use clear, concise language
- Avoid unnecessary elaboration

`;
  } else {
    instructions += `PACING INSTRUCTIONS (STEADY):
- Maintain a balanced, natural pace
- Mix shorter and longer sentences
- Be neither rushed nor overly slow

`;
  }

  // Add emotional intensity instructions
  if (guidance.emotionalIntensity === 'high') {
    instructions += `EMOTIONAL INTENSITY INSTRUCTIONS (HIGH):
⚠️ CRITICAL: User is experiencing high emotional distress
- DO NOT expand or elaborate excessively
- DO NOT ask multiple questions
- DO NOT offer complex advice right now
- FOCUS on validation and grounding
- Keep response BRIEF and CALMING
- Example: "I hear you. That's a lot to carry. What do you need most right now?"

`;
  } else if (guidance.emotionalIntensity === 'medium') {
    instructions += `EMOTIONAL INTENSITY INSTRUCTIONS (MEDIUM):
- Balance validation with gentle guidance
- Avoid overwhelming with too much information
- Keep response focused and supportive

`;
  }

  // Add question limit instructions
  instructions += `QUESTION LIMIT:
- Maximum ${guidance.maxQuestions} question(s) in this response
- Only ask questions that truly help clarify or support
- Avoid interrogating or overwhelming the user
- If you must ask multiple questions, make them brief and focused

`;

  // Add safeguards
  instructions += `SAFEGUARDS (ALWAYS APPLY):
✓ Avoid stacked validations (no "That makes sense" repeated)
✓ Avoid multi-paragraph responses unless user explicitly asks for depth
✓ Keep responses calm, not verbose
✓ User should never feel talked at
✓ Maintain your distinct therapist style while respecting these constraints

⚠️ THESE INSTRUCTIONS OVERRIDE DEFAULT PERSONA WORD COUNTS
Your persona style remains intact, but response length MUST adapt to user input.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return instructions;
}

// ═══════════════════════════════════════════════════════════════════
// EMOTIONAL CONTINUITY EXTRACTION
// ═══════════════════════════════════════════════════════════════════
// Extract emotional themes from the current conversation thread
// This is NOT stored in the database - it's ephemeral and conversation-specific
// Used only to help the AI reference emotional themes naturally
// ═══════════════════════════════════════════════════════════════════

interface EmotionalTheme {
  feeling: string;
  context: string;
}

/**
 * Extract emotional themes from recent conversation messages
 * Returns a list of emotional themes that can be referenced
 * This is purely for conversational continuity - no data is saved
 */
function extractEmotionalThemes(messages: any[]): EmotionalTheme[] {
  const themes: EmotionalTheme[] = [];
  
  // Only look at recent messages (last 6-8 messages)
  const recentMessages = messages.slice(-8);
  
  // Emotional keywords to detect
  const emotionalKeywords = {
    heavy: ['heavy', 'burden', 'weight', 'carrying', 'exhausting', 'draining'],
    anxious: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'fear'],
    frustrated: ['frustrated', 'annoyed', 'irritated', 'angry', 'mad'],
    sad: ['sad', 'down', 'depressed', 'hopeless', 'empty', 'lonely'],
    confused: ['confused', 'lost', 'unclear', 'uncertain', 'don\'t know'],
    hurt: ['hurt', 'pain', 'wounded', 'betrayed', 'rejected'],
    overwhelmed: ['overwhelmed', 'too much', 'can\'t handle', 'drowning'],
    stuck: ['stuck', 'trapped', 'can\'t move', 'paralyzed', 'frozen'],
    hopeful: ['hopeful', 'optimistic', 'better', 'improving', 'progress'],
    relieved: ['relieved', 'better', 'lighter', 'easier', 'calmer'],
  };
  
  // Scan user messages for emotional content
  for (const msg of recentMessages) {
    if (msg.role !== 'user') continue;
    
    const content = (msg.content || '').toLowerCase();
    
    // Check for emotional keywords
    for (const [feeling, keywords] of Object.entries(emotionalKeywords)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          // Extract a brief context snippet (max 60 chars)
          const keywordIndex = content.indexOf(keyword);
          const start = Math.max(0, keywordIndex - 20);
          const end = Math.min(content.length, keywordIndex + 40);
          const snippet = content.substring(start, end).trim();
          
          themes.push({
            feeling,
            context: snippet,
          });
          
          // Only capture one theme per message to avoid overload
          break;
        }
      }
    }
  }
  
  // Deduplicate by feeling (keep most recent)
  const uniqueThemes = new Map<string, EmotionalTheme>();
  for (const theme of themes.reverse()) {
    if (!uniqueThemes.has(theme.feeling)) {
      uniqueThemes.set(theme.feeling, theme);
    }
  }
  
  // Return up to 3 most recent unique themes
  return Array.from(uniqueThemes.values()).slice(0, 3);
}

/**
 * Build emotional continuity context for the AI prompt
 * This allows the AI to subtly reference emotional themes from the current conversation
 * WITHOUT exposing memory content or stored data
 */
function buildEmotionalContinuityContext(messages: any[]): string {
  const themes = extractEmotionalThemes(messages);
  
  if (themes.length === 0) {
    return '';
  }
  
  let context = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💭 EMOTIONAL CONTINUITY (Current Conversation Only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In this conversation, the user has expressed these emotional themes:
`;
  
  for (const theme of themes) {
    context += `\n- Feeling: ${theme.feeling}`;
  }
  
  context += `

⚠️ USAGE RULES FOR EMOTIONAL CONTINUITY:

You MAY subtly reference these emotional themes using phrases like:
✓ "Earlier you mentioned this felt heavy."
✓ "This sounds connected to what you shared before."
✓ "I hear that same frustration coming through."
✓ "It seems like this is still weighing on you."

You MUST NOT:
✗ Mention specific facts, dates, or stored details
✗ Say "I remember you said..." (implies memory storage)
✗ Reference conversations from other sessions
✗ Expose any technical memory system details
✗ Summarize past conversations explicitly

This is EMOTIONAL continuity, not memory recall.
Focus on the FEELING, not the facts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  return context;
}

// ═══════════════════════════════════════════════════════════════════
// NEW: CONVERSATION SLOWDOWN DETECTION & GENTLE CLOSINGS
// ═══════════════════════════════════════════════════════════════════
// Detects when a conversation is naturally winding down
// Appends a gentle closing sentence to prevent abrupt endings
// Only triggers when appropriate - not on every message
// ═══════════════════════════════════════════════════════════════════

interface ConversationSlowdownAnalysis {
  isWindingDown: boolean;
  shouldAddClosing: boolean;
  reasoning: string;
  closingSentence: string | null;
}

/**
 * Analyze conversation to detect if it's naturally slowing down
 * 
 * WINDING DOWN INDICATORS:
 * - Short user messages (1-5 words) like "ok", "thanks", "yeah"
 * - Acknowledgment phrases without follow-up questions
 * - Decreasing message length over recent messages
 * - User expressing closure ("I feel better", "that helps")
 * - No new topics introduced
 * 
 * DO NOT TRIGGER ON:
 * - Active conversations with questions
 * - Emotional intensity (user needs space, not closure)
 * - First few messages of a conversation
 * - User asking for advice or guidance
 */
function analyzeConversationSlowdown(
  messages: any[],
  lastUserMessage: string,
  ventingAnalysis: VentingAnalysis
): ConversationSlowdownAnalysis {
  const lowerMessage = lastUserMessage.toLowerCase().trim();
  const wordCount = lastUserMessage.trim().split(/\s+/).length;
  
  // ═══════════════════════════════════════════════════════════════════
  // EXCLUSION CRITERIA (DO NOT ADD CLOSING)
  // ═══════════════════════════════════════════════════════════════════
  
  // Don't add closing if conversation is too short (less than 4 messages)
  if (messages.length < 4) {
    return {
      isWindingDown: false,
      shouldAddClosing: false,
      reasoning: 'Conversation too short - not appropriate for closing',
      closingSentence: null
    };
  }
  
  // Don't add closing if user is venting or in high emotional distress
  if (ventingAnalysis.isVenting || ventingAnalysis.emotionalIntensity === 'high') {
    return {
      isWindingDown: false,
      shouldAddClosing: false,
      reasoning: 'User is venting or in distress - needs space, not closure',
      closingSentence: null
    };
  }
  
  // Don't add closing if user is asking for advice
  if (ventingAnalysis.isAskingForAdvice) {
    return {
      isWindingDown: false,
      shouldAddClosing: false,
      reasoning: 'User is actively seeking advice - conversation is ongoing',
      closingSentence: null
    };
  }
  
  // Don't add closing if user is asking questions
  if (lastUserMessage.includes('?')) {
    return {
      isWindingDown: false,
      shouldAddClosing: false,
      reasoning: 'User is asking questions - conversation is active',
      closingSentence: null
    };
  }
  
  // Don't add closing if user is introducing new topics
  const newTopicKeywords = [
    'also', 'another thing', 'by the way', 'speaking of',
    'i wanted to ask', 'can we talk about', 'what about'
  ];
  if (newTopicKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return {
      isWindingDown: false,
      shouldAddClosing: false,
      reasoning: 'User is introducing new topics - conversation is expanding',
      closingSentence: null
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // WINDING DOWN DETECTION
  // ═══════════════════════════════════════════════════════════════════
  
  // Check for short acknowledgment messages
  const shortAcknowledgments = [
    'ok', 'okay', 'thanks', 'thank you', 'got it', 'yeah', 'yep',
    'sure', 'alright', 'cool', 'good', 'nice', 'appreciate it',
    'that helps', 'makes sense', 'i see', 'understood'
  ];
  
  const isShortAcknowledgment = wordCount <= 5 && 
    shortAcknowledgments.some(phrase => lowerMessage.includes(phrase));
  
  // Check for closure expressions
  const closureExpressions = [
    'i feel better', 'that helps', 'i appreciate', 'thank you',
    'that makes sense', 'i understand now', 'that\'s helpful',
    'i\'ll think about', 'i\'ll try', 'good to know'
  ];
  
  const hasClosureExpression = closureExpressions.some(phrase => 
    lowerMessage.includes(phrase)
  );
  
  // Check for decreasing message length trend
  const recentUserMessages = messages
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => (m.content || '').trim().split(/\s+/).length);
  
  const isDecreasingLength = recentUserMessages.length >= 2 &&
    recentUserMessages[recentUserMessages.length - 1] < recentUserMessages[0];
  
  // ═══════════════════════════════════════════════════════════════════
  // DECISION LOGIC
  // ═══════════════════════════════════════════════════════════════════
  
  // CASE 1: Short acknowledgment (strongest signal)
  if (isShortAcknowledgment) {
    return {
      isWindingDown: true,
      shouldAddClosing: true,
      reasoning: 'User sent short acknowledgment - conversation naturally closing',
      closingSentence: "I'm here whenever you want to continue."
    };
  }
  
  // CASE 2: Closure expression (clear signal)
  if (hasClosureExpression) {
    return {
      isWindingDown: true,
      shouldAddClosing: true,
      reasoning: 'User expressed closure or satisfaction - appropriate to offer gentle closing',
      closingSentence: "I'm here whenever you need."
    };
  }
  
  // CASE 3: Decreasing message length + short message (moderate signal)
  if (isDecreasingLength && wordCount <= 10) {
    return {
      isWindingDown: true,
      shouldAddClosing: true,
      reasoning: 'Message length decreasing and current message is short - conversation slowing',
      closingSentence: "I'm here if you want to talk more."
    };
  }
  
  // Default: conversation is still active
  return {
    isWindingDown: false,
    shouldAddClosing: false,
    reasoning: 'Conversation is still active - no closing needed',
    closingSentence: null
  };
}

/**
 * Apply gentle closing sentence to AI response if appropriate
 * Only adds closing if conversation is naturally winding down
 * Closing is subtle and non-pressuring
 */
function applyGentleClosing(
  aiResponse: string,
  slowdownAnalysis: ConversationSlowdownAnalysis
): string {
  if (!slowdownAnalysis.shouldAddClosing || !slowdownAnalysis.closingSentence) {
    return aiResponse;
  }
  
  // Add closing sentence with appropriate spacing
  // Ensure it feels natural and not forced
  const trimmedResponse = aiResponse.trim();
  
  // If response already ends with a question, don't add closing
  if (trimmedResponse.endsWith('?')) {
    return aiResponse;
  }
  
  // Add closing with gentle spacing
  return `${trimmedResponse}\n\n${slowdownAnalysis.closingSentence}`;
}

// Fetch person continuity data (and DB-level continuity_enabled) from Supabase
async function getPersonContinuity(
  supabase: any,
  userId: string,
  personId: string
): Promise<{
  continuity_enabled: boolean;
  summary: any;
  open_loops: any;
  current_goal: any;
  last_advice: any;
  next_question: any;
}> {
  try {
    const { data, error } = await supabase
      .from("person_chat_summaries")
      .select("continuity_enabled, summary, open_loops, current_goal, last_advice, next_question")
      .eq("user_id", userId)
      .eq("person_id", personId)
      .single();

    if (error) {
      console.log("[Edge] Error fetching person continuity:", error.message);
      return {
        continuity_enabled: true,
        summary: "",
        open_loops: "",
        current_goal: "",
        last_advice: "",
        next_question: ""
      };
    }

    return {
      continuity_enabled: data?.continuity_enabled ?? true,
      summary: data?.summary ?? "",
      open_loops: data?.open_loops ?? "",
      current_goal: data?.current_goal ?? "",
      last_advice: data?.last_advice ?? "",
      next_question: data?.next_question ?? ""
    };
  } catch (err) {
    console.log("[Edge] Exception in getPersonContinuity:", err);
    return {
      continuity_enabled: true,
      summary: "",
      open_loops: "",
      current_goal: "",
      last_advice: "",
      next_question: ""
    };
  }
}

// Update person continuity data in Supabase
async function upsertPersonContinuity(
  supabase: any,
  userId: string,
  personId: string,
  patch: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from("person_chat_summaries")
      .upsert(
        {
          user_id: userId,
          person_id: personId,
          ...patch,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,person_id" }
      );

    if (error) {
      console.log("[Edge] Error upserting continuity:", error.message);
    }
  } catch (err) {
    console.log("[Edge] Exception in upsertPersonContinuity:", err);
  }
}

// Extract continuity fields from conversation using OpenAI with timeout
async function extractContinuityFields(
  conversationText: string,
  assistantReply: string,
  timeoutMs: number = 10000
): Promise<any> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const extractionPrompt = `You are analyzing a conversation to extract continuity information. Based on the conversation below, extract the following fields as JSON:

{
  "current_goal": "",
  "open_loops": "",
  "last_user_need": "",
  "last_action_plan": "",
  "next_best_question": ""
}

RULES:
- Only update with stable, neutral phrases based on EXPLICIT conversation content
- Keep each field short (max 250 chars)
- If you cannot confidently extract a field, return empty string for that field
- Do NOT invent or assume details
- Be conservative - only extract what is clearly stated

CONVERSATION:
${conversationText}

ASSISTANT REPLY:
${assistantReply}

Return ONLY the JSON object, no other text.`;

    const extractionRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: extractionPrompt }],
        temperature: 0.3,
        max_tokens: 500
      }),
      signal: abortController.signal
    });

    clearTimeout(timeoutId);

    if (!extractionRes.ok) {
      console.log("[Edge] OpenAI extraction failed:", extractionRes.status);
      return null;
    }

    const extractionData = await extractionRes.json();
    const extractedText = extractionData?.choices?.[0]?.message?.content || "";
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const extracted = JSON.parse(jsonMatch[0]);

    return {
      current_goal: clean(extracted?.current_goal).substring(0, 250),
      open_loops: clean(extracted?.open_loops).substring(0, 250),
      last_user_need: clean(extracted?.last_user_need).substring(0, 250),
      last_action_plan: clean(extracted?.last_action_plan).substring(0, 250),
      next_best_question: clean(extracted?.next_best_question).substring(0, 250)
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.log("[Edge] Extraction timeout after", timeoutMs, "ms");
    } else {
      console.log("[Edge] Exception in extractContinuityFields:", err);
    }
    return null;
  }
}

// Fetch person memories from Supabase
async function getPersonMemories(supabase: any, userId: string, personId: string, limit = 15) {
  try {
    const { data, error } = await supabase
      .from("person_memories")
      .select("*")
      .eq("user_id", userId)
      .eq("person_id", personId)
      .order("importance", { ascending: false })
      .order("last_mentioned_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.log("[Edge] Error fetching person memories:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.log("[Edge] Exception in getPersonMemories:", err);
    return [];
  }
}

// ✅ NEW: Fetch user base preferences from Supabase
async function getUserPreferences(supabase: any, userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("conversation_style, stress_response, processing_style, decision_style, cultural_context, values_boundaries, recent_changes, therapist_persona_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.log("[Edge] Error fetching user preferences:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.log("[Edge] Exception in getUserPreferences:", err);
    return null;
  }
}

// Fetch user personalization updates from Supabase
async function getUserPersonalizationUpdates(supabase: any, userId: string, limit = 3) {
  try {
    const { data, error } = await supabase
      .from("user_personalization_updates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.log("[Edge] Error fetching personalization updates:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.log("[Edge] Exception in getUserPersonalizationUpdates:", err);
    return [];
  }
}

// ✅ Build personalization context string (SAFE, OPTIONAL, NON-MEDICAL)
// Combines user preferences + per-person context for AI tone/pacing/examples
// NEVER diagnoses, labels, or classifies the user
function buildPersonalizationContext(
  preferences: any,
  updates: any[],
  personName: string,
  relationshipType: string
): string {
  const contextParts: string[] = [];

  // ═══════════════════════════════════════════════════════════════════
  // PART 1: USER PERSONALIZATION (from Settings)
  // ═══════════════════════════════════════════════════════════════════
  
  if (preferences) {
    // Conversation style preference
    if (preferences.conversation_style) {
      contextParts.push(`User prefers ${preferences.conversation_style.toLowerCase()} conversation style`);
    }
    
    // Stress response preference
    if (preferences.stress_response) {
      contextParts.push(`When stressed, user finds ${preferences.stress_response.toLowerCase()} most helpful`);
    }
    
    // Emotional processing style
    if (preferences.processing_style) {
      contextParts.push(`User processes emotions ${preferences.processing_style.toLowerCase()}`);
    }
    
    // Decision-making style
    if (preferences.decision_style) {
      contextParts.push(`User's decision-making style: ${preferences.decision_style.toLowerCase()}`);
    }
    
    // Cultural context (optional, user-written)
    if (preferences.cultural_context && preferences.cultural_context.trim()) {
      const cleanedContext = clean(preferences.cultural_context).substring(0, 200);
      if (cleanedContext) {
        contextParts.push(`Cultural context: ${cleanedContext}`);
      }
    }
    
    // Values/boundaries (optional, user-written)
    if (preferences.values_boundaries && preferences.values_boundaries.trim()) {
      const cleanedValues = clean(preferences.values_boundaries).substring(0, 200);
      if (cleanedValues) {
        contextParts.push(`Values/boundaries to respect: ${cleanedValues}`);
      }
    }
    
    // Recent changes (optional, user-written)
    if (preferences.recent_changes && preferences.recent_changes.trim()) {
      const cleanedChanges = clean(preferences.recent_changes).substring(0, 200);
      if (cleanedChanges) {
        contextParts.push(`Recent changes noted: ${cleanedChanges}`);
      }
    }
  }

  // Add recent updates if they exist (max 3)
  if (updates && updates.length > 0) {
    const recentUpdates = updates.slice(0, 3);
    recentUpdates.forEach((update, index) => {
      let updateText = `Recent update: ${clean(update.title)}`;
      
      if (update.details && update.details.trim()) {
        const cleanedDetails = clean(update.details).substring(0, 150);
        if (cleanedDetails) {
          updateText += ` (${cleanedDetails})`;
        }
      }
      
      if (update.ai_preference) {
        updateText += ` [User prefers: ${update.ai_preference}]`;
      }
      
      contextParts.push(updateText);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PART 2: PER-PERSON CONTEXT (from existing app data)
  // ═══════════════════════════════════════════════════════════════════
  
  // Add person name and relationship type if available
  if (personName && personName.trim()) {
    let personContext = `Conversation is about: ${personName}`;
    
    if (relationshipType && relationshipType.trim() && relationshipType !== 'Unknown') {
      personContext += ` (${relationshipType.toLowerCase()} relationship)`;
    }
    
    contextParts.push(personContext);
  }

  // Return combined context string
  return contextParts.join(". ");
}

// Build Voice Contract based on ai_tone_id
// Maps each tone to specific response style guidelines
function buildVoiceContract(aiToneId: string): string {
  if (!aiToneId) return "";

  // Map tone IDs to detailed system instructions
  const toneInstructions: Record<string, string> = {
    // PRIMARY TONES
    warm_hug: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 TONE: WARM & SUPPORTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are deeply empathetic, warm, and nurturing—like a close friend who always understands.

RESPONSE STYLE:
- Lead with emotional validation and reassurance
- Use warm, gentle, comforting language throughout
- Acknowledge feelings generously before offering any guidance
- Keep tone soft and soothing, never harsh or abrupt
- Prioritize making the user feel heard and supported above all else
- Use phrases like "That sounds really hard," "I hear you," "It makes complete sense you'd feel that way"
- Offer gentle suggestions wrapped in understanding, not direct commands

⚠️ CRITICAL: This tone is NOT optional. Every response must clearly reflect warmth and emotional support.`,

    balanced_blend: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 TONE: BALANCED & CLEAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You balance empathy with clarity—supportive yet practical.

RESPONSE STYLE:
- Adapt your tone to what the user needs most in the moment
- Validate feelings while also offering practical guidance
- Be warm but not overly soft; clear but not harsh
- Mix emotional support with actionable advice
- Keep responses balanced in length—not too brief, not too long
- Use a mix of reflective questions and concrete suggestions
- Shift between gentle and direct as the situation requires
- Use phrases like "I hear you, and..." "That makes sense. Here's what might help..." "Let's think about..."

⚠️ CRITICAL: This tone is NOT optional. Every response must balance empathy with practical clarity.`,

    mirror_mode: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 TONE: REFLECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You reflect the user's thoughts back to help them see patterns clearly.

RESPONSE STYLE:
- Use reflective listening extensively
- Paraphrase and mirror back what you hear
- Ask questions that promote self-discovery
- Help the user notice patterns and contradictions
- Avoid giving direct advice—guide them to their own insights
- Use their own words and phrases when reflecting
- Keep responses focused on observation, not interpretation
- Use phrases like "I'm hearing that..." "It sounds like..." "I notice you said... and also..." "What do you make of that?"
- Let the user do most of the thinking—you're the mirror

⚠️ CRITICAL: This tone is NOT optional. Every response must reflect and help the user discover patterns.`,

    calm_direct: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 TONE: CALM & DIRECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are straightforward and calm—direct without being harsh.

RESPONSE STYLE:
- Get to the point quickly without unnecessary softening
- Stay calm and centered, even when discussing difficult topics
- Focus on solutions and next steps
- Be honest and clear, but never cold or dismissive
- Acknowledge feelings briefly, then move to practical matters
- Use simple, clear language—no fluff
- Keep responses concise and focused
- Use phrases like "Here's what I see..." "The reality is..." "What matters most here is..." "Let's focus on..."
- Avoid over-explaining or over-validating

⚠️ CRITICAL: This tone is NOT optional. Every response must be calm, clear, and solution-focused.`,

    reality_check: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 TONE: REALITY CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You provide reality checks—grounded and realistic, helping the user see things as they are.

RESPONSE STYLE:
- Point out contradictions and inconsistencies gently but clearly
- Challenge unrealistic thinking or denial
- Ground the user in reality without being harsh
- Balance honesty with compassion
- Help the user face difficult truths
- Avoid enabling wishful thinking or avoidance
- Be firm but never cruel or dismissive
- Use phrases like "I hear you, and the reality is..." "Let's look at what's actually happening..." "You're saying X, but also Y..." "The truth is..."
- Help the user see clearly, even when it's uncomfortable

⚠️ CRITICAL: This tone is NOT optional. Every response must respectfully challenge and ground in reality.`,

    accountability_partner: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 TONE: GOAL SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are an accountability partner—keeping the user on track with their goals and commitments.

RESPONSE STYLE:
- Hold the user accountable for what they said they'd do
- Check in on progress and follow-through
- Be supportive but firm about commitments
- Celebrate wins and address setbacks directly
- Focus on action and results
- Avoid making excuses for the user
- Keep responses focused on accountability
- Use phrases like "You said you'd..." "How did that go?" "What's stopping you?" "Let's revisit your commitment..." "What's your plan?"
- Balance encouragement with firm follow-through

⚠️ CRITICAL: This tone is NOT optional. Every response must focus on goals, accountability, and next steps.`,

    // ADVANCED STYLES (abbreviated for brevity - include all from original)
    systems_thinker: `🎭 TONE: SYSTEMS THINKER - Look at bigger picture and systemic patterns in relationships.`,
    attachment_aware: `🎭 TONE: ATTACHMENT-AWARE - View relationships through attachment theory lens.`,
    cognitive_clarity: `🎭 TONE: COGNITIVE CLARITY - Identify thought patterns and cognitive distortions.`,
    conflict_mediator: `🎭 TONE: CONFLICT MEDIATOR - Neutral mediator helping see all perspectives fairly.`,
    tough_love: `🎭 TONE: TOUGH LOVE - Firm but caring, pushing growth with respect.`,
    straight_shooter: `🎭 TONE: STRAIGHT SHOOTER - Direct and honest with no sugar-coating.`,
    executive_summary: `🎭 TONE: EXECUTIVE SUMMARY - Concise bullets, decisions, next steps.`,
    no_nonsense: `🎭 TONE: NO NONSENSE - Practical and efficient, cutting through noise.`,
    pattern_breaker: `🎭 TONE: PATTERN BREAKER - Challenge unhelpful patterns firmly.`,
    boundary_enforcer: `🎭 TONE: BOUNDARY ENFORCER - Help set and maintain healthy boundaries firmly.`,
    detective: `🎭 TONE: DETECTIVE - Curious and analytical, asking questions to uncover insights.`,
    therapy_room: `🎭 TONE: THERAPY ROOM - Thoughtful, professional therapeutic presence.`,
    nurturing_parent: `🎭 TONE: NURTURING PARENT - Caring and unconditionally supportive.`,
    best_friend: `🎭 TONE: BEST FRIEND - Casual, supportive, relatable.`,
    soft_truth: `🎭 TONE: SOFT TRUTH - Honest insights wrapped in kindness.`,
  };

  const instruction = toneInstructions[aiToneId];
  if (instruction) {
    return instruction;
  }

  // Fallback for unknown tone IDs
  return `\n\nVOICE CONTRACT (Tone: ${aiToneId})\nFollow the tone strictly.\n`;
}

// Build dynamic system prompt based on conversation context
async function buildSystemPrompt(
  supabase: any,
  userId: string,
  personId: string,
  lastUserMessage: string,
  personName: string,
  relationshipType: string,
  messages: any[],
  currentSubject?: string,
  aiToneId?: string,
  aiScienceMode?: boolean,
  continuity_enabled_request?: boolean,
  responseGuidance?: ResponseLengthGuidance,
  ventingAnalysis?: VentingAnalysis
): Promise<string> {
  const askingForAdvice = ventingAnalysis?.isAskingForAdvice ?? isAskingForAdvice(lastUserMessage);
  const wantsLearning = wantsToLearn(lastUserMessage);
  const condition = detectCondition(lastUserMessage);

  let basePrompt = `You are "Safe Space," a warm, trauma-aware relationship and emotional support companion with psychology knowledge.`;

  // ✅ NEW: Add therapist persona system prompt with style metadata if selected
  const preferences = await getUserPreferences(supabase, userId);
  if (preferences?.therapist_persona_id) {
    const personaPrompt = getPersonaSystemPrompt(preferences.therapist_persona_id);
    const personaStyle = getPersonaStyleMetadata(preferences.therapist_persona_id);
    
    if (personaPrompt && personaStyle) {
      basePrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 THERAPIST PERSONA: ${personaStyle.name.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${personaPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 RESPONSE STYLE GUIDELINES (APPLY CONSISTENTLY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESPONSE LENGTH:
- Target word count: ${personaStyle.min_words}-${personaStyle.max_words} words
- Verbosity level: ${personaStyle.verbosity}
${personaStyle.verbosity === 'short' ? '- Keep responses brief and to the point' : ''}
${personaStyle.verbosity === 'medium' ? '- Balance brevity with depth' : ''}
${personaStyle.verbosity === 'long' ? '- Provide thoughtful, detailed responses' : ''}

PACING & RHYTHM:
- Pacing: ${personaStyle.pacing}
${personaStyle.pacing === 'rapid' ? '- Use shorter sentences and direct language\n- Move quickly between ideas\n- Be concise and action-oriented' : ''}
${personaStyle.pacing === 'steady' ? '- Mix short and longer sentences naturally\n- Maintain a balanced conversational flow\n- Neither rushed nor overly slow' : ''}
${personaStyle.pacing === 'slow' ? '- Use longer, more contemplative sentences\n- Allow space for reflection\n- Speak with calm, measured phrasing' : ''}

STRUCTURE:
- Format preference: ${personaStyle.structure}
${personaStyle.structure === 'bullets' ? '- Use bullet points or numbered lists when appropriate\n- Break down complex ideas into clear points\n- Organize thoughts in a structured way' : ''}
${personaStyle.structure === 'paragraphs' ? '- Use flowing paragraphs\n- Connect ideas smoothly\n- Maintain narrative continuity' : ''}
${personaStyle.structure === 'mixed' ? '- Blend paragraphs with occasional lists\n- Adapt structure to the content\n- Use variety to maintain engagement' : ''}

QUESTIONING STYLE:
- Question frequency: ${personaStyle.question_rate}
${personaStyle.question_rate === 'low' ? '- Ask questions sparingly\n- Focus more on statements and reflections\n- Only ask when truly needed' : ''}
${personaStyle.question_rate === 'medium' ? '- Balance questions with statements\n- Use questions to guide exploration\n- Ask thoughtfully, not excessively' : ''}
${personaStyle.question_rate === 'high' ? '- Use questions frequently to explore\n- Encourage self-discovery through inquiry\n- Ask open-ended, thought-provoking questions' : ''}

EMOTIONAL TONE:
- Empathy level: ${personaStyle.empathy_level}
- Directness: ${personaStyle.directness}
${personaStyle.empathy_level === 'high' ? '- Lead with warmth and emotional validation\n- Prioritize making the user feel understood\n- Use gentle, supportive language' : ''}
${personaStyle.empathy_level === 'medium' ? '- Balance empathy with practical guidance\n- Validate feelings while moving forward\n- Be supportive but not overly soft' : ''}
${personaStyle.directness === 'high' ? '- Be straightforward and clear\n- Get to the point without excessive softening\n- Speak honestly and directly' : ''}
${personaStyle.directness === 'medium' ? '- Balance directness with sensitivity\n- Be clear but not harsh\n- Adapt directness to the situation' : ''}
${personaStyle.directness === 'low' ? '- Use gentle, indirect language\n- Soften difficult truths\n- Prioritize emotional safety over bluntness' : ''}

LANGUAGE STYLE:
- Metaphor use: ${personaStyle.metaphor_use}
${personaStyle.metaphor_use === 'none' ? '- Avoid metaphors and analogies\n- Use literal, concrete language\n- Be straightforward and practical' : ''}
${personaStyle.metaphor_use === 'light' ? '- Use occasional metaphors when helpful\n- Keep analogies simple and relatable\n- Don\'t overuse figurative language' : ''}
${personaStyle.metaphor_use === 'often' ? '- Use metaphors and analogies frequently\n- Help illustrate concepts through imagery\n- Make abstract ideas more tangible' : ''}

OPENING & CLOSING:
${personaStyle.opening_style ? `- Characteristic opening: "${personaStyle.opening_style}"\n- Consider starting responses with this or similar phrasing when appropriate` : '- No specific opening style'}
${personaStyle.closing_style ? `- Characteristic closing: "${personaStyle.closing_style}"\n- Consider ending responses with this or similar phrasing when appropriate` : ''}
${personaStyle.signoff_style === 'gentle' ? '- End with gentle, reassuring phrases' : ''}
${personaStyle.signoff_style === 'encouraging' ? '- End with encouraging, uplifting phrases' : ''}
${personaStyle.signoff_style === 'none' ? '- No specific closing style - end naturally' : ''}

⚠️ CRITICAL INSTRUCTIONS:
1. These style guidelines are NOT optional - they define who you are as ${personaStyle.name}
2. Apply these consistently to EVERY response to create a distinct, recognizable voice
3. Users should be able to identify you by your communication style alone
4. This is purely conversational style - NEVER diagnose, label disorders, or provide medical advice
5. Adapt the guidelines naturally - don't be robotic or formulaic
6. The goal is to feel authentically different from other therapists, not to follow a script

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }
  }

  if (aiToneId) basePrompt += buildVoiceContract(aiToneId);

  if (aiScienceMode) {
    basePrompt += `\n\nSCIENCE MODE: When relevant, include brief psychological insights in accessible language.`;
  }

  basePrompt += `\n\nYou're talking about ${personName} (${relationshipType}).`;

  // ═══════════════════════════════════════════════════════════════════
  // ADD VENTING DETECTION GUIDANCE (HIGHEST PRIORITY)
  // ═══════════════════════════════════════════════════════════════════
  // When user is venting, AI must acknowledge, not solve
  // This overrides all other response guidance
  // ═══════════════════════════════════════════════════════════════════
  
  if (ventingAnalysis?.isVenting) {
    basePrompt += buildVentingResponseGuidance(ventingAnalysis);
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // ADD ADAPTIVE RESPONSE LENGTH & PACING GUIDANCE
  // ═══════════════════════════════════════════════════════════════════
  // This ensures therapists never overwhelm users with excessive text
  // or emotional intensity by adapting to user input
  // Note: Venting guidance overrides this if both are present
  // ═══════════════════════════════════════════════════════════════════
  
  if (responseGuidance && !ventingAnalysis?.isVenting) {
    basePrompt += buildResponseGuidanceInstructions(responseGuidance);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADD EMOTIONAL CONTINUITY CONTEXT
  // ═══════════════════════════════════════════════════════════════════
  // This allows the AI to subtly reference emotional themes from the
  // current conversation thread WITHOUT exposing memory content
  // ═══════════════════════════════════════════════════════════════════
  
  const emotionalContext = buildEmotionalContinuityContext(messages);
  if (emotionalContext) {
    basePrompt += emotionalContext;
  }

  // Fetch continuity from DB and compute effective flag:
  const continuityData = await getPersonContinuity(supabase, userId, personId);
  const continuity_enabled_db = !!continuityData?.continuity_enabled;

  // ✅ EFFECTIVE CONTINUITY FLAG:
  const continuity_enabled = !!continuity_enabled_request && continuity_enabled_db;

  if (continuity_enabled) {
    const continuity = {
      goal: clean(continuityData?.current_goal),
      open_loops: clean(continuityData?.open_loops),
      next_question: clean(continuityData?.next_question),
      summary: clean(continuityData?.summary),
    };

    if (continuity.goal || continuity.open_loops || continuity.next_question || continuity.summary) {
      basePrompt += `\n\nCONVERSATION CONTINUITY (do not invent):`;
      if (continuity.goal) basePrompt += `\n- Current goal: ${continuity.goal}`;
      if (continuity.open_loops) basePrompt += `\n- Open loops: ${continuity.open_loops}`;
      if (continuity.next_question) basePrompt += `\n- Best next question: ${continuity.next_question}`;
      if (continuity.summary) basePrompt += `\n- Summary: ${continuity.summary}`;
      basePrompt += `\n\nInstruction: Continue from open loops/next question unless the user changes topic. Ask if unclear.`;
    }
  }

  if (currentSubject && currentSubject !== "General") {
    basePrompt += `\n\nCurrent focus: ${currentSubject}.`;
  }

  const memories = await getPersonMemories(supabase, userId, personId, 15);
  if (memories.length > 0) {
    basePrompt += `\n\nKnown memories:`;
    for (const m of memories) {
      basePrompt += `\n- ${m.key}: ${m.value}`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PERSONALIZATION CONTEXT ASSEMBLY (SAFE, OPTIONAL, NON-MEDICAL)
  // ═══════════════════════════════════════════════════════════════════
  
  const updates = await getUserPersonalizationUpdates(supabase, userId, 3);
  
  // Build combined personalization context
  const personalizationContext = buildPersonalizationContext(
    preferences,
    updates,
    personName,
    relationshipType
  );
  
  // Only add personalization section if we have actual context
  if (personalizationContext && personalizationContext.trim()) {
    basePrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PERSONALIZATION CONTEXT (Optional - Use Subtly):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${personalizationContext}

⚠️ STRICT USAGE RULES:

The AI may ONLY use this context to:
✓ Adjust tone (gentler, calmer, more direct)
✓ Adjust pacing (shorter vs reflective)
✓ Adjust examples (family-safe, partner-safe, neutral)
✓ Adjust emotional framing

The AI must NEVER:
✗ Mention personalization settings explicitly
✗ Say "because of your personality…"
✗ Diagnose or label the user
✗ Suggest medical treatment
✗ Change advice type based on assumptions
✗ Infer or guess traits not explicitly stated
✗ Override user intent

PRIVACY & CONTROL:
- This data is user-written self-reflection only
- If personalization is cleared, this context disappears immediately
- Changes must feel subtle, not obvious
- AI should feel "more natural," not "different"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  basePrompt += `\n\nCore rules:
- Keep replies short (1–3 sentences usually).
- Validate feelings first.
- Ask gentle follow-up questions.
- Never diagnose.
- Don't invent facts beyond the supplied context.
- Avoid absolute statements or certainty language.
- Use tentative phrasing: "You might notice...", "It could be helpful to explore...", "What feels right to you?"
- Support reflection, don't define the user.`;

  if (askingForAdvice) {
    basePrompt += `\n\nThe user is asking for advice: validate briefly, give 1–2 actionable suggestions, then a gentle question.`;
  }

  if (condition && CONDITION_INFO?.[condition]) {
    basePrompt += `\n\nThey mentioned ${condition}. Provide brief general info + relationship impact + one resource. Include: "I'm not a doctor; this is general info."`;
  }

  if (wantsLearning && !condition) {
    basePrompt += `\n\nThey want to learn: share one brief relevant psychology insight naturally.`;
  }

  if (IS_DEV && aiToneId) basePrompt += `\n\n[DEV] Add footer: (tone: ${aiToneId})`;

  return basePrompt;
}

// Helper to create error response
function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  requestId?: string,
  timestamp?: number
): Response {
  const responseBody = {
    success: false,
    reply: null,
    error: {
      code,
      message,
      details: details || {}
    },
    requestId: requestId || crypto.randomUUID(),
    timestamp: timestamp || Date.now()
  };

  console.error(`[Edge][Chat][${responseBody.requestId}] Error:`, {
    code,
    message,
    details
  });

  return new Response(
    JSON.stringify(responseBody),
    {
      status: 200, // Always return 200 to prevent 502
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...corsHeaders
      }
    }
  );
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const timestamp = Date.now();
  const functionStartTime = Date.now();

  // Set up function-level timeout
  const functionTimeoutController = new AbortController();
  const functionTimeoutId = setTimeout(() => {
    console.error(`[Edge][Chat][${requestId}] Function timeout after ${TOTAL_FUNCTION_TIMEOUT_MS}ms`);
    functionTimeoutController.abort();
  }, TOTAL_FUNCTION_TIMEOUT_MS);

  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      clearTimeout(functionTimeoutId);
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Validate HTTP method
    if (req.method !== "POST") {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "METHOD_NOT_ALLOWED",
        "Only POST requests are allowed",
        { method: req.method },
        requestId,
        timestamp
      );
    }

    // Validate OpenAI API key
    if (!OPENAI_API_KEY) {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "MISSING_API_KEY",
        "OpenAI API key is not configured",
        { env: "OPENAI_API_KEY not set" },
        requestId,
        timestamp
      );
    }

    // Validate Supabase configuration
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "MISSING_SUPABASE_CONFIG",
        "Supabase configuration is incomplete",
        {
          hasUrl: !!SUPABASE_URL,
          hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
        },
        requestId,
        timestamp
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError: any) {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "INVALID_JSON",
        "Request body must be valid JSON",
        { parseError: parseError?.message },
        requestId,
        timestamp
      );
    }

    const {
      messages,
      personId,
      personName,
      personRelationshipType,
      currentSubject,
      aiToneId,
      aiScienceMode,
      userId
    } = body ?? {};

    // Request-level toggle
    const continuity_enabled_request = !!body?.continuity_enabled;

    // Validate required fields
    if (!Array.isArray(messages)) {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "BAD_REQUEST",
        "messages field must be an array",
        { messagesType: typeof messages },
        requestId,
        timestamp
      );
    }

    if (!userId) {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "BAD_REQUEST",
        "userId is required",
        { userId },
        requestId,
        timestamp
      );
    }

    if (!personId) {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "BAD_REQUEST",
        "personId is required",
        { personId },
        requestId,
        timestamp
      );
    }

    // Check if we're approaching timeout
    if (Date.now() - functionStartTime > TOTAL_FUNCTION_TIMEOUT_MS - 2000) {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "TIMEOUT",
        "Function timeout approaching",
        { elapsed: Date.now() - functionStartTime },
        requestId,
        timestamp
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const lastUserMessage =
      messages.filter((m: any) => m?.role === "user").pop()?.content || "";

    // ═══════════════════════════════════════════════════════════════════
    // ANALYZE USER INPUT FOR VENTING VS. ADVICE-SEEKING
    // ═══════════════════════════════════════════════════════════════════
    const ventingAnalysis = analyzeVentingVsAdviceSeeking(lastUserMessage);
    console.log(`[Edge][Chat][${requestId}] Venting analysis:`, ventingAnalysis);
    
    // ═══════════════════════════════════════════════════════════════════
    // ANALYZE USER INPUT FOR ADAPTIVE RESPONSE LENGTH & PACING
    // ═══════════════════════════════════════════════════════════════════
    const responseGuidance = analyzeUserInputForResponseGuidance(lastUserMessage);
    console.log(`[Edge][Chat][${requestId}] Response guidance:`, responseGuidance);

    // ═══════════════════════════════════════════════════════════════════
    // ANALYZE CONVERSATION FOR SLOWDOWN (GENTLE CLOSING)
    // ═══════════════════════════════════════════════════════════════════
    const slowdownAnalysis = analyzeConversationSlowdown(
      messages,
      lastUserMessage,
      ventingAnalysis
    );
    console.log(`[Edge][Chat][${requestId}] Slowdown analysis:`, slowdownAnalysis);

    const systemPrompt = await buildSystemPrompt(
      supabase,
      userId,
      personId,
      lastUserMessage,
      personName || "this person",
      personRelationshipType || "your relationship",
      messages,
      currentSubject,
      aiToneId,
      aiScienceMode,
      continuity_enabled_request,
      responseGuidance,
      ventingAnalysis
    );

    const systemMessage = { role: "system" as const, content: systemPrompt };

    const openaiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    }));

    // ✅ Calculate max_tokens based on venting analysis and response guidance
    // Venting responses should be brief - overrides all other guidance
    let maxTokens = 300;
    
    if (ventingAnalysis?.isVenting) {
      // Venting responses should be BRIEF
      if (ventingAnalysis.emotionalIntensity === 'high') {
        // High intensity: 20-40 words = ~35-70 tokens
        maxTokens = 80;
        console.log(`[Edge][Chat][${requestId}] Venting (high intensity) max_tokens: ${maxTokens}`);
      } else if (ventingAnalysis.emotionalIntensity === 'medium') {
        // Medium intensity: 40-60 words = ~70-100 tokens
        maxTokens = 120;
        console.log(`[Edge][Chat][${requestId}] Venting (medium intensity) max_tokens: ${maxTokens}`);
      } else {
        // Low intensity: 50-80 words = ~85-135 tokens
        maxTokens = 150;
        console.log(`[Edge][Chat][${requestId}] Venting (low intensity) max_tokens: ${maxTokens}`);
      }
    } else if (responseGuidance) {
      // Convert target words to tokens with buffer
      // Rough conversion: 1 token ≈ 0.75 words, so target_words / 0.75 = tokens
      // Add 30% buffer for formatting and natural variation
      maxTokens = Math.ceil((responseGuidance.targetWords / 0.75) * 1.3);
      // Cap at reasonable limits (min 100, max 400)
      maxTokens = Math.min(Math.max(maxTokens, 100), 400);
      console.log(`[Edge][Chat][${requestId}] Adaptive max_tokens: ${maxTokens} (target: ${responseGuidance.targetWords} words, reason: ${responseGuidance.reasoning})`);
    } else {
      // Fallback to persona style if no response guidance
      const preferences = await getUserPreferences(supabase, userId);
      if (preferences?.therapist_persona_id) {
        const personaStyle = getPersonaStyleMetadata(preferences.therapist_persona_id);
        if (personaStyle?.max_words) {
          maxTokens = Math.ceil((personaStyle.max_words / 0.75) * 1.2);
          maxTokens = Math.min(Math.max(maxTokens, 150), 600);
          console.log(`[Edge][Chat][${requestId}] Persona-based max_tokens: ${maxTokens} for ${preferences.therapist_persona_id}`);
        }
      }
    }

    // Set up OpenAI-specific timeout
    const openaiAbortController = new AbortController();
    const openaiTimeoutId = setTimeout(() => {
      console.error(`[Edge][Chat][${requestId}] OpenAI timeout after ${OPENAI_TIMEOUT_MS}ms`);
      openaiAbortController.abort();
    }, OPENAI_TIMEOUT_MS);

    // Call OpenAI API with timeout
    let openaiRes: Response;
    try {
      openaiRes = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [systemMessage, ...openaiMessages],
          temperature: 0.7,
          max_tokens: maxTokens
        }),
        signal: openaiAbortController.signal
      });

      clearTimeout(openaiTimeoutId);
    } catch (fetchError: any) {
      clearTimeout(openaiTimeoutId);
      clearTimeout(functionTimeoutId);

      if (fetchError.name === "AbortError") {
        return createErrorResponse(
          "TIMEOUT",
          "OpenAI API request timed out",
          {
            timeoutMs: OPENAI_TIMEOUT_MS,
            elapsed: Date.now() - functionStartTime
          },
          requestId,
          timestamp
        );
      }

      return createErrorResponse(
        "OPENAI_NETWORK_ERROR",
        "Failed to connect to OpenAI API",
        {
          error: fetchError?.message,
          name: fetchError?.name,
          stack: isDevEnv() ? fetchError?.stack : undefined
        },
        requestId,
        timestamp
      );
    }

    const rawText = await openaiRes.text();

    if (!openaiRes.ok) {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "OPENAI_API_ERROR",
        `OpenAI API returned ${openaiRes.status}: ${openaiRes.statusText}`,
        {
          status: openaiRes.status,
          statusText: openaiRes.statusText,
          bodyPreview: rawText.substring(0, 200)
        },
        requestId,
        timestamp
      );
    }

    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (parseError: any) {
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "OPENAI_PARSE_ERROR",
        "Failed to parse OpenAI response as JSON",
        {
          parseError: parseError?.message,
          rawPreview: rawText.substring(0, 200)
        },
        requestId,
        timestamp
      );
    }

    let reply =
      data?.choices?.[0]?.message?.content ??
      "I'm here with you. Tell me more about what's on your mind.";

    // ═══════════════════════════════════════════════════════════════════
    // APPLY GENTLE CLOSING SENTENCE IF APPROPRIATE
    // ═══════════════════════════════════════════════════════════════════
    reply = applyGentleClosing(reply, slowdownAnalysis);

    if (IS_DEV && aiToneId && !reply.includes(`(tone: ${aiToneId})`)) {
      reply += `\n\n(tone: ${aiToneId})`;
    }

    // ✅ Continuity update ONLY if effective continuity is enabled (request toggle AND DB toggle)
    // Run in background, don't block response
    const continuityData = await getPersonContinuity(supabase, userId, personId);
    const continuity_enabled_effective = !!continuity_enabled_request && !!continuityData?.continuity_enabled;

    if (continuity_enabled_effective) {
      // Fire and forget - don't await
      (async () => {
        try {
          const conversationText = messages
            .slice(-6)
            .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
            .join("\n\n");

          const extracted = await extractContinuityFields(conversationText, reply, 8000);
          if (extracted) {
            await upsertPersonContinuity(supabase, userId, personId, extracted);
          }
        } catch (err) {
          console.log(`[Edge][Chat][${requestId}] Background continuity update failed (non-blocking):`, err);
        }
      })();
    }

    clearTimeout(functionTimeoutId);

    const responseBody = {
      success: true,
      reply,
      error: null,
      requestId,
      timestamp
    };

    console.log(`[Edge][Chat][${requestId}] Success in ${Date.now() - functionStartTime}ms`);

    return new Response(
      JSON.stringify(responseBody),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders
        }
      }
    );
  } catch (e: any) {
    clearTimeout(functionTimeoutId);

    console.error(`[Edge][Chat][${requestId}] Fatal error:`, {
      message: e?.message ?? String(e),
      name: e?.name,
      stack: e?.stack
    });

    const dev = isDevEnv();

    return createErrorResponse(
      "UNEXPECTED_ERROR",
      e?.message ?? "An unexpected error occurred",
      {
        name: e?.name,
        message: e?.message ?? String(e),
        ...(dev ? { stack: e?.stack } : {})
      },
      requestId,
      timestamp
    );
  }
});
