
// supabase/functions/generate-ai-response/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Check if we're in development mode (set via environment variable)
const IS_DEV = Deno.env.get("DEV_MODE") === "true";

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
const CONDITION_INFO = {
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to detect if user is asking for advice
function isAskingForAdvice(message: string): boolean {
  const adviceKeywords = [
    "what should i do", "what can i do", "advice", "help me", 
    "suggestion", "what do you think", "how should i", "how can i",
    "what would you do", "need advice", "looking for advice",
    "any suggestions", "what's your advice", "guide me", "tell me what to do"
  ];
  
  const lowerMessage = message.toLowerCase();
  return adviceKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Helper function to detect if user wants to learn
function wantsToLearn(message: string): boolean {
  const learnKeywords = [
    "tell me about", "explain", "what is", "how does", 
    "psychology fact", "learn about", "teach me", "interesting fact",
    "did you know", "fun fact", "share something", "educational"
  ];
  
  const lowerMessage = message.toLowerCase();
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

  const lowerMessage = message.toLowerCase();
  
  for (const [condition, keywords] of Object.entries(conditionMap)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return condition;
    }
  }
  
  return null;
}

// Helper function to get a random psychology fact
function getRandomPsychologyFact(): string {
  return PSYCHOLOGY_FACTS[Math.floor(Math.random() * PSYCHOLOGY_FACTS.length)];
}

// Fetch person chat summary from Supabase
async function getPersonSummary(
  supabase: any,
  userId: string,
  personId: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('person_chat_summaries')
      .select('summary')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .single();

    if (error) {
      console.log('[Edge] Error fetching person summary:', error.message);
      return '';
    }

    return data?.summary || '';
  } catch (err) {
    console.log('[Edge] Exception in getPersonSummary:', err);
    return '';
  }
}

// Fetch person memories from Supabase
async function getPersonMemories(
  supabase: any,
  userId: string,
  personId: string,
  limit: number = 15
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('person_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .order('importance', { ascending: false })
      .order('last_mentioned_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.log('[Edge] Error fetching person memories:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.log('[Edge] Exception in getPersonMemories:', err);
    return [];
  }
}

/**
 * Build Voice Contract based on ai_tone_id
 * This creates strongly differentiated behavioral rules for each tone
 */
function buildVoiceContract(aiToneId: string): string {
  // Define voice contracts with specific behavioral rules
  const voiceContracts: Record<string, {
    pacing: string;
    directness: string;
    structure: string;
    questionBehavior: string;
  }> = {
    // GENTLE TONES
    'warm_hug': {
      pacing: 'Detailed and unhurried - take time to validate fully',
      directness: 'Extremely soft and gentle - never abrupt',
      structure: 'Flowing narrative with warm transitions',
      questionBehavior: 'Ask gentle, open-ended questions after extensive validation'
    },
    'therapy_room': {
      pacing: 'Measured and thoughtful - allow space for reflection',
      directness: 'Indirect and exploratory - guide rather than tell',
      structure: 'Reflective paragraphs with thoughtful questions',
      questionBehavior: 'Lead with reflective questions to deepen understanding'
    },
    'best_friend': {
      pacing: 'Conversational and natural - not too long, not too short',
      directness: 'Casual and relatable - friendly honesty',
      structure: 'Natural conversation flow with relatable language',
      questionBehavior: 'Ask questions like a friend would - curious but not pushy'
    },
    'nurturing_parent': {
      pacing: 'Caring and thorough - ensure they feel supported',
      directness: 'Protective and reassuring - firm when needed for their wellbeing',
      structure: 'Warm narrative with unconditional support',
      questionBehavior: 'Ask caring questions that show you want to understand and help'
    },
    'soft_truth': {
      pacing: 'Balanced - enough detail to be clear, not overwhelming',
      directness: 'Honest but wrapped in kindness - truth with compassion',
      structure: 'Gentle observations followed by supportive insights',
      questionBehavior: 'Ask questions that help them see truth gently'
    },

    // BALANCED TONES
    'balanced_blend': {
      pacing: 'Moderate - adapt length to what the situation needs',
      directness: 'Clear but kind - honest without harshness',
      structure: 'Mix of validation, insight, and practical guidance',
      questionBehavior: 'Ask clarifying questions when needed, offer guidance when clear'
    },
    'clear_coach': {
      pacing: 'Efficient and structured - get to actionable steps quickly',
      directness: 'Direct and encouraging - clear about what to do',
      structure: 'Numbered steps, bullet points, clear action items',
      questionBehavior: 'Ask focused questions to clarify goals, then provide steps'
    },
    'mirror_mode': {
      pacing: 'Reflective and patient - let them process',
      directness: 'Neutral and observational - reflect without judging',
      structure: 'Reflective statements followed by exploratory questions',
      questionBehavior: 'Ask questions constantly - you are the mirror, they find answers'
    },
    'calm_direct': {
      pacing: 'Concise and focused - no unnecessary elaboration',
      directness: 'Straightforward and calm - say what needs to be said',
      structure: 'Clear statements with minimal softening',
      questionBehavior: 'Ask only essential clarifying questions, then state observations'
    },
    'detective': {
      pacing: 'Investigative and thorough - explore before concluding',
      directness: 'Curious and analytical - seek to understand fully',
      structure: 'Series of clarifying questions with brief observations',
      questionBehavior: 'Lead with questions - gather information before offering insights'
    },
    'systems_thinker': {
      pacing: 'Thoughtful and comprehensive - see the full picture',
      directness: 'Analytical but accessible - explain patterns clearly',
      structure: 'Pattern observations with systemic connections',
      questionBehavior: 'Ask questions that reveal patterns and connections'
    },
    'attachment_aware': {
      pacing: 'Balanced - enough detail to explain attachment concepts',
      directness: 'Educational and supportive - teach while guiding',
      structure: 'Attachment insights followed by practical application',
      questionBehavior: 'Ask questions about attachment needs and patterns'
    },
    'cognitive_clarity': {
      pacing: 'Focused and clear - identify thoughts, offer reframes',
      directness: 'Gently challenging - question thoughts without dismissing feelings',
      structure: 'Thought identification followed by alternative perspectives',
      questionBehavior: 'Ask questions that examine evidence and alternative views'
    },
    'conflict_mediator': {
      pacing: 'Measured and balanced - give all perspectives fair time',
      directness: 'Neutral and fair - avoid taking sides',
      structure: 'Multiple perspectives presented with balanced language',
      questionBehavior: 'Ask questions that reveal other perspectives'
    },

    // DIRECT TONES
    'tough_love': {
      pacing: 'Direct and to the point - no unnecessary softening',
      directness: 'Firm and honest - say hard truths with care',
      structure: 'Brief validation followed by direct challenge',
      questionBehavior: 'Ask pointed questions that push growth - minimal hand-holding'
    },
    'straight_shooter': {
      pacing: 'Brief and punchy - get to the point immediately',
      directness: 'Blunt and honest - no sugar-coating',
      structure: 'Short, direct statements with minimal elaboration',
      questionBehavior: 'Rarely ask questions - state what you observe directly'
    },
    'executive_summary': {
      pacing: 'Extremely concise - bullet points and key takeaways only',
      directness: 'Matter-of-fact and efficient - focus on decisions',
      structure: 'Bullets, numbered lists, clear action items',
      questionBehavior: 'Ask only decision-critical questions, then summarize'
    },
    'no_nonsense': {
      pacing: 'Efficient and practical - no fluff',
      directness: 'Straightforward and pragmatic - focus on what works',
      structure: 'Simple, clear statements focused on solutions',
      questionBehavior: 'Ask only practical questions - skip emotional processing'
    },
    'reality_check': {
      pacing: 'Direct but not rushed - ensure reality is clear',
      directness: 'Honest and grounded - point out what is, not what they wish',
      structure: 'Reality statements with firm but compassionate delivery',
      questionBehavior: 'Ask questions that ground them in reality'
    },
    'pattern_breaker': {
      pacing: 'Persistent and focused - keep attention on patterns',
      directness: 'Challenging and firm - name patterns clearly',
      structure: 'Pattern identification followed by challenge to change',
      questionBehavior: 'Ask questions that highlight patterns and push for change'
    },
    'accountability_partner': {
      pacing: 'Focused on commitments - check progress directly',
      directness: 'Firm about follow-through - hold them accountable',
      structure: 'Progress check followed by next commitment',
      questionBehavior: 'Ask about what they committed to and what they actually did'
    },
    'boundary_enforcer': {
      pacing: 'Clear and firm - boundaries need strong language',
      directness: 'Direct about boundaries - no softening boundary violations',
      structure: 'Boundary statements with firm support for self-protection',
      questionBehavior: 'Ask questions that clarify boundaries and rights'
    }
  };

  const contract = voiceContracts[aiToneId];
  
  if (!contract) {
    // Fallback to balanced blend
    const defaultContract = voiceContracts['balanced_blend'];
    return `
═══════════════════════════════════════════════════════════
VOICE CONTRACT (Tone: balanced_blend - DEFAULT FALLBACK)
═══════════════════════════════════════════════════════════
• PACING: ${defaultContract.pacing}
• DIRECTNESS: ${defaultContract.directness}
• STRUCTURE: ${defaultContract.structure}
• QUESTION BEHAVIOR: ${defaultContract.questionBehavior}

YOU MUST STRICTLY FOLLOW THESE RULES IN EVERY RESPONSE.
═══════════════════════════════════════════════════════════`;
  }

  return `
═══════════════════════════════════════════════════════════
VOICE CONTRACT (Tone: ${aiToneId})
═══════════════════════════════════════════════════════════
• PACING: ${contract.pacing}
• DIRECTNESS: ${contract.directness}
• STRUCTURE: ${contract.structure}
• QUESTION BEHAVIOR: ${contract.questionBehavior}

YOU MUST STRICTLY FOLLOW THESE RULES IN EVERY RESPONSE.
═══════════════════════════════════════════════════════════`;
}

// Build dynamic system prompt based on conversation context
async function buildSystemPrompt(
  supabase: any,
  userId: string,
  personId: string,
  lastUserMessage: string,
  personName: string,
  relationshipType: string,
  currentSubject?: string,
  aiToneId?: string,
  aiScienceMode?: boolean
): Promise<string> {
  const askingForAdvice = isAskingForAdvice(lastUserMessage);
  const wantsLearning = wantsToLearn(lastUserMessage);
  const condition = detectCondition(lastUserMessage);
  
  // ORDER 1: Safe Space identity + safety rules
  let basePrompt = `You are "Safe Space," a warm, trauma-aware relationship and emotional support companion with psychology knowledge.`;

  // ORDER 2: VOICE CONTRACT - This is the key enhancement for tone differentiation
  if (aiToneId) {
    basePrompt += buildVoiceContract(aiToneId);
  }

  // ORDER 2b: Science mode (if enabled)
  if (aiScienceMode) {
    basePrompt += `\n\n🔬 SCIENCE MODE ENABLED: When relevant, include brief psychological insights, research findings, or therapeutic concepts. Keep it accessible and conversational. Examples: "Research shows that...", "Attachment theory suggests...", "Neuroscience tells us..."`;
  }

  // ORDER 3: "You are chatting about: {personName}"
  basePrompt += `\n\nYou're talking about ${personName} (${relationshipType}).`;

  // ORDER 4: "Conversation summary so far: {summary}" (if exists)
  // FETCH SUMMARY HERE
  const summary = await getPersonSummary(supabase, userId, personId);
  if (summary && summary.trim()) {
    basePrompt += `\n\nConversation summary so far:\n${summary}`;
  }

  // Inject subject into AI prompt
  if (currentSubject && currentSubject !== 'General') {
    basePrompt += `\n\nCurrent focus of this conversation: ${currentSubject}. Please tailor your response to this subject.`;
  }

  // ORDER 5: "Known memories about this person/topic: …" bullets
  // FETCH MEMORIES HERE
  const memories = await getPersonMemories(supabase, userId, personId, 15);
  if (memories.length > 0) {
    basePrompt += `\n\nKnown memories about this person/topic:`;
    memories.forEach((memory: any) => {
      basePrompt += `\n- ${memory.key}: ${memory.value}`;
    });
  }

  // Core response rules (always apply)
  basePrompt += `\n\nCore response rules:
1. Keep replies SHORT: 1–3 sentences maximum (unless providing educational information, then 3-5 sentences).
2. Speak like a caring human friend — natural, simple, and conversational.
3. Show curiosity: ask gentle follow-up questions.
4. Validate feelings first before offering information.
5. Mirror the user's tone — if they are sad, be soft; if curious, be engaging.`;

  // Advice mode
  if (askingForAdvice) {
    basePrompt += `\n\nThe user is asking for advice. Provide:
1. One sentence of validation/empathy
2. 1-2 practical, actionable suggestions
3. Keep it realistic and relationship-focused
Example: "That sounds really challenging. Have you considered setting a gentle boundary about this? Sometimes expressing your needs clearly but kindly can help."`;
  }
  
  // Condition education mode
  if (condition && CONDITION_INFO[condition as keyof typeof CONDITION_INFO]) {
    const info = CONDITION_INFO[condition as keyof typeof CONDITION_INFO];
    basePrompt += `\n\nThe user mentioned ${condition}. Briefly share:
1. What it generally involves (1-2 sentences)
2. One way it might affect relationships
3. One resource or coping strategy
4. Always add: "Remember, I'm not a doctor - this is general info. A mental health professional can provide personalized guidance."`;
  }
  
  // Learning mode
  if (wantsLearning && !condition) {
    basePrompt += `\n\nThe user wants to learn. You can share a brief psychology fact if relevant, but keep it conversational.
Example: "That's a great question! Did you know that expressing gratitude regularly can actually rewire your brain to be more positive over time?"`;
  }
  
  // Normal conversation mode enhancements
  if (!askingForAdvice && !condition && !wantsLearning) {
    // Occasionally share psychology facts naturally (about 20% of the time)
    basePrompt += `\n\nIf the conversation naturally allows, you can occasionally share a brief psychology fact to help the user learn something helpful. But only if it fits naturally - don't force it.`;
  }
  
  // ORDER 6: Non-hallucination guardrails
  basePrompt += `\n\nImportant guidelines:
- NEVER diagnose anyone
- ALWAYS encourage professional help for serious concerns
- Focus on relationships and communication
- Be trauma-informed and non-judgmental
- If someone mentions self-harm or crisis, prioritize safety and provide crisis resources
- Keep all responses warm, human, and conversational
- ONLY use information from the conversation summary and known memories above - do not invent or assume facts`;

  // DEV-ONLY: Add tone signature request to system prompt
  if (IS_DEV && aiToneId) {
    basePrompt += `\n\n[DEV MODE] After your response, add a footer line: "(tone: ${aiToneId})"`;
  }
  
  return basePrompt;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        } 
      },
    );
  }

  if (!OPENAI_API_KEY) {
    console.error("[Edge] Missing OPENAI_API_KEY");
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: missing OPENAI_API_KEY" }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        } 
      },
    );
  }

  // Parse incoming JSON safely
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[Edge] Failed to parse request JSON:", err);
    return new Response(
      JSON.stringify({ error: "Invalid JSON body from client" }),
      { 
        status: 400, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        } 
      },
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

  if (!Array.isArray(messages)) {
    console.error("[Edge] Missing or invalid 'messages' array in request body");
    return new Response(
      JSON.stringify({ error: "Missing or invalid 'messages' in request body" }),
      { 
        status: 400, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        } 
      },
    );
  }

  if (!userId) {
    console.error("[Edge] Missing userId in request body");
    return new Response(
      JSON.stringify({ error: "Missing userId in request body" }),
      { 
        status: 400, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        } 
      },
    );
  }

  // DEV-ONLY: Runtime log of AI preferences
  if (IS_DEV) {
    console.debug(`[AI] tone=${aiToneId || 'none'} science=${aiScienceMode || false} person=${personName || 'unknown'}`);
  }

  // Initialize Supabase client with service role key for server-side access
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get the last user message for context analysis
  const lastUserMessage = messages
    .filter((msg: any) => msg.role === "user")
    .pop()?.content || "";

  // Build dynamic system prompt based on context (including summary and memories)
  const systemPrompt = await buildSystemPrompt(
    supabase,
    userId,
    personId,
    lastUserMessage,
    personName || "this person",
    personRelationshipType || "your relationship",
    currentSubject,
    aiToneId,
    aiScienceMode
  );

  const systemMessage = {
    role: "system" as const,
    content: systemPrompt,
  };

  // Convert messages to OpenAI format
  const openaiMessages = messages.map((msg: any) => ({
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content,
  }));

  try {
    // Call OpenAI
    const openaiRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [systemMessage, ...openaiMessages],
        temperature: 0.7,
        max_tokens: 300, // Slightly increased for educational content
      }),
    });

    const rawText = await openaiRes.text();

    if (!openaiRes.ok) {
      console.error(
        "[Edge] OpenAI returned non-2xx:",
        openaiRes.status,
        rawText,
      );
      return new Response(
        JSON.stringify({
          error: "OpenAI API error",
          status: openaiRes.status,
          details: rawText || "No response body",
        }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders,
          } 
        },
      );
    }

    let data: any;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (err) {
      console.error("[Edge] Failed to parse OpenAI JSON:", err, rawText);
      return new Response(
        JSON.stringify({
          error: "Failed to parse OpenAI response",
          details: rawText || "Empty response body",
        }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders,
          } 
        },
      );
    }

    let reply =
      data?.choices?.[0]?.message?.content ??
      "I'm here with you. Tell me more about what's on your mind.";

    // DEV-ONLY: If the model didn't include the tone signature, append it manually
    // (This ensures verification even if the model ignores the instruction)
    if (IS_DEV && aiToneId && !reply.includes(`(tone: ${aiToneId})`)) {
      reply += `\n\n(tone: ${aiToneId})`;
    }

    return new Response(
      JSON.stringify({ reply }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        } 
      },
    );
  } catch (err) {
    console.error("[Edge] Unexpected error while calling OpenAI:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected server error", details: String(err) }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        } 
      },
    );
  }
});
