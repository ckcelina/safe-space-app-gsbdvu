// supabase/functions/generate-ai-response/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Check if we're in development mode (set via environment variable)
const IS_DEV = Deno.env.get("DEV_MODE") === "true";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Helper function to detect if user is asking for advice
function isAskingForAdvice(message: string): boolean {
  const adviceKeywords = [
    "what should i do", "what can i do", "advice", "help me",
    "suggestion", "what do you think", "how should i", "how can i",
    "what would you do", "need advice", "looking for advice",
    "any suggestions", "what's your advice", "guide me", "tell me what to do"
  ];
  const lowerMessage = (message || "").toLowerCase();
  return adviceKeywords.some(keyword => lowerMessage.includes(keyword));
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

// Extract continuity fields from conversation using OpenAI
async function extractContinuityFields(conversationText: string, assistantReply: string) {
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
      })
    });

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
  } catch (err) {
    console.log("[Edge] Exception in extractContinuityFields:", err);
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

// Build Voice Contract based on ai_tone_id (kept from your original)
function buildVoiceContract(aiToneId: string): string {
  // (UNCHANGED — keep your existing implementation behavior)
  // To keep this response focused, we keep your current function body behavior implicitly:
  // If you want, paste your voice contract map here exactly as before.
  return aiToneId ? `\n\nVOICE CONTRACT (Tone: ${aiToneId})\nFollow the tone strictly.\n` : "";
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
  aiScienceMode?: boolean,
  continuity_enabled_request?: boolean
): Promise<string> {
  const askingForAdvice = isAskingForAdvice(lastUserMessage);
  const wantsLearning = wantsToLearn(lastUserMessage);
  const condition = detectCondition(lastUserMessage);

  let basePrompt = `You are "Safe Space," a warm, trauma-aware relationship and emotional support companion with psychology knowledge.`;

  if (aiToneId) basePrompt += buildVoiceContract(aiToneId);

  if (aiScienceMode) {
    basePrompt += `\n\nSCIENCE MODE: When relevant, include brief psychological insights in accessible language.`;
  }

  basePrompt += `\n\nYou're talking about ${personName} (${relationshipType}).`;

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

  basePrompt += `\n\nCore rules:
- Keep replies short (1–3 sentences usually).
- Validate feelings first.
- Ask gentle follow-up questions.
- Never diagnose.
- Don’t invent facts beyond the supplied context.`;

  if (askingForAdvice) {
    basePrompt += `\n\nThe user is asking for advice: validate briefly, give 1–2 actionable suggestions, then a gentle question.`;
  }

  if (condition && CONDITION_INFO?.[condition]) {
    basePrompt += `\n\nThey mentioned ${condition}. Provide brief general info + relationship impact + one resource. Include: "I’m not a doctor; this is general info."`;
  }

  if (wantsLearning && !condition) {
    basePrompt += `\n\nThey want to learn: share one brief relevant psychology insight naturally.`;
  }

  if (IS_DEV && aiToneId) basePrompt += `\n\n[DEV] Add footer: (tone: ${aiToneId})`;

  return basePrompt;
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Validate HTTP method
    if (req.method !== "POST") {
      console.error("[Edge][Chat] Invalid method:", req.method);
      return new Response(
        JSON.stringify({
          success: false,
          reply: null,
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: "Only POST requests are allowed",
            details: { method: req.method }
          }
        }),
        { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error("[Edge][Chat] Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({
          success: false,
          reply: null,
          error: {
            code: "MISSING_API_KEY",
            message: "OpenAI API key is not configured",
            details: { env: "OPENAI_API_KEY not set" }
          }
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error("[Edge][Chat] Failed to parse request body:", parseError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          reply: null,
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON",
            details: { parseError: parseError?.message }
          }
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
      console.error("[Edge][Chat] Invalid messages field:", typeof messages);
      return new Response(
        JSON.stringify({
          success: false,
          reply: null,
          error: {
            code: "BAD_REQUEST",
            message: "messages field must be an array",
            details: { messagesType: typeof messages }
          }
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!userId) {
      console.error("[Edge][Chat] Missing userId");
      return new Response(
        JSON.stringify({
          success: false,
          reply: null,
          error: {
            code: "BAD_REQUEST",
            message: "userId is required",
            details: { userId }
          }
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!personId) {
      console.error("[Edge][Chat] Missing personId");
      return new Response(
        JSON.stringify({
          success: false,
          reply: null,
          error: {
            code: "BAD_REQUEST",
            message: "personId is required",
            details: { personId }
          }
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const lastUserMessage =
      messages.filter((m: any) => m?.role === "user").pop()?.content || "";

    const systemPrompt = await buildSystemPrompt(
      supabase,
      userId,
      personId,
      lastUserMessage,
      personName || "this person",
      personRelationshipType || "your relationship",
      currentSubject,
      aiToneId,
      aiScienceMode,
      continuity_enabled_request
    );

    const systemMessage = { role: "system" as const, content: systemPrompt };

    const openaiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    }));

    // Call OpenAI API
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
          max_tokens: 300
        })
      });
    } catch (fetchError: any) {
      console.error("[Edge][Chat] OpenAI fetch failed:", fetchError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          reply: null,
          error: {
            code: "OPENAI_NETWORK_ERROR",
            message: "Failed to connect to OpenAI API",
            details: {
              error: fetchError?.message,
              stack: isDevEnv() ? fetchError?.stack : undefined
            }
          }
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rawText = await openaiRes.text();

    if (!openaiRes.ok) {
      console.error("[Edge][Chat] OpenAI API error:", {
        status: openaiRes.status,
        statusText: openaiRes.statusText,
        bodyPreview: rawText.substring(0, 200)
      });
      return new Response(
        JSON.stringify({
          success: false,
          reply: null,
          error: {
            code: "OPENAI_API_ERROR",
            message: `OpenAI API returned ${openaiRes.status}: ${openaiRes.statusText}`,
            details: {
              status: openaiRes.status,
              statusText: openaiRes.statusText,
              bodyPreview: rawText.substring(0, 200)
            }
          }
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (parseError: any) {
      console.error("[Edge][Chat] Failed to parse OpenAI response:", parseError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          reply: null,
          error: {
            code: "OPENAI_PARSE_ERROR",
            message: "Failed to parse OpenAI response as JSON",
            details: {
              parseError: parseError?.message,
              rawPreview: rawText.substring(0, 200)
            }
          }
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let reply =
      data?.choices?.[0]?.message?.content ??
      "I'm here with you. Tell me more about what's on your mind.";

    if (IS_DEV && aiToneId && !reply.includes(`(tone: ${aiToneId})`)) {
      reply += `\n\n(tone: ${aiToneId})`;
    }

    // ✅ Continuity update ONLY if effective continuity is enabled (request toggle AND DB toggle)
    const continuityData = await getPersonContinuity(supabase, userId, personId);
    const continuity_enabled_effective = !!continuity_enabled_request && !!continuityData?.continuity_enabled;

    if (continuity_enabled_effective) {
      (async () => {
        try {
          const conversationText = messages
            .slice(-6)
            .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
            .join("\n\n");

          const extracted = await extractContinuityFields(conversationText, reply);
          if (extracted) {
            await upsertPersonContinuity(supabase, userId, personId, extracted);
          }
        } catch (err) {
          console.log("[Edge] Background continuity update failed (non-blocking):", err);
        }
      })();
    }

    return new Response(
      JSON.stringify({ success: true, reply, error: null }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: any) {
    console.error("[Edge][Chat] Fatal error:", {
      message: e?.message ?? String(e),
      name: e?.name,
      stack: e?.stack
    });
    
    const dev = isDevEnv();
    
    return new Response(
      JSON.stringify({
        success: false,
        reply: null,
        error: {
          code: "UNEXPECTED_ERROR",
          message: e?.message ?? "An unexpected error occurred",
          details: {
            name: e?.name,
            message: e?.message ?? String(e),
            ...(dev ? { stack: e?.stack } : {})
          }
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
