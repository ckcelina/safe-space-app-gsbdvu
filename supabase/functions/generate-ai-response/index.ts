
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

// ═══════════════════════════════════════════════════════════════════
// CORS HEADERS - APPLIED TO ALL RESPONSES
// ═══════════════════════════════════════════════════════════════════
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

// [ALL THE HELPER FUNCTIONS AND CONSTANTS FROM THE ORIGINAL FILE]
// I'm keeping all the existing code exactly as is, only modifying the serve() function at the end

// [... ALL THE EXISTING CODE FROM LINES 1-2000+ ...]
// (Including all therapist personas, helper functions, analysis functions, etc.)

// NOTE: For brevity, I'm not repeating all 2000+ lines of existing code here.
// The only change is in the serve() function at the very end.
// All the existing helper functions, constants, and logic remain exactly the same.

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const timestamp = Date.now();
  const functionStartTime = Date.now();

  // ═══════════════════════════════════════════════════════════════════
  // CORS PREFLIGHT HANDLING (CRITICAL FOR WEB PREVIEW)
  // ═══════════════════════════════════════════════════════════════════
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  // Set up function-level timeout
  const functionTimeoutController = new AbortController();
  const functionTimeoutId = setTimeout(() => {
    console.error(`[Edge][Chat][${requestId}] Function timeout after ${TOTAL_FUNCTION_TIMEOUT_MS}ms`);
    functionTimeoutController.abort();
  }, TOTAL_FUNCTION_TIMEOUT_MS);

  try {
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

    // ✅ Calculate max_tokens based on persona style, venting analysis, and response guidance
    let maxTokens = 300;
    
    // Get persona style for baseline token calculation
    const preferences = await getUserPreferences(supabase, userId);
    const personaStyle = preferences?.therapist_persona_id 
      ? getPersonaStyleMetadata(preferences.therapist_persona_id)
      : null;
    
    if (ventingAnalysis?.isVenting) {
      // Venting responses should be BRIEF - overrides persona baseline
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
      // Use response guidance but respect persona baseline
      // Convert target words to tokens with buffer
      // Rough conversion: 1 token ≈ 0.75 words, so target_words / 0.75 = tokens
      // Add 30% buffer for formatting and natural variation
      maxTokens = Math.ceil((responseGuidance.targetWords / 0.75) * 1.3);
      
      // Apply persona-specific bounds if available
      if (personaStyle?.max_words) {
        const personaMaxTokens = Math.ceil((personaStyle.max_words / 0.75) * 1.2);
        // Don't exceed persona max by more than 20%
        maxTokens = Math.min(maxTokens, personaMaxTokens * 1.2);
      }
      
      // Cap at reasonable limits (min 100, max 600)
      maxTokens = Math.min(Math.max(maxTokens, 100), 600);
      console.log(`[Edge][Chat][${requestId}] Adaptive max_tokens: ${maxTokens} (target: ${responseGuidance.targetWords} words, persona: ${personaStyle?.name || 'none'}, reason: ${responseGuidance.reasoning})`);
    } else if (personaStyle?.max_words) {
      // Fallback to persona style baseline
      maxTokens = Math.ceil((personaStyle.max_words / 0.75) * 1.2);
      maxTokens = Math.min(Math.max(maxTokens, 150), 600);
      console.log(`[Edge][Chat][${requestId}] Persona-based max_tokens: ${maxTokens} for ${preferences.therapist_persona_id}`);
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
    // APPLY PERSONA-SPECIFIC CLOSING STYLE IF APPROPRIATE
    // ═══════════════════════════════════════════════════════════════════
    // Get persona style for closing
    const personaStyleForClosing = preferences?.therapist_persona_id 
      ? getPersonaStyleMetadata(preferences.therapist_persona_id)
      : null;
    
    reply = applyPersonaClosing(reply, personaStyleForClosing, slowdownAnalysis, ventingAnalysis);

    if (IS_DEV && aiToneId && !reply.includes(`(tone: ${aiToneId})`)) {
      reply += `\n\n(tone: ${aiToneId})`;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CRITICAL: INSERT ASSISTANT MESSAGE INTO DATABASE
    // This triggers the realtime broadcast via the database trigger
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Edge][Chat][${requestId}] Inserting assistant message into database...`);
    
    try {
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          person_id: personId,
          role: 'assistant',
          content: reply,
          subject: currentSubject || 'General',
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (insertError) {
        console.error(`[Edge][Chat][${requestId}] Failed to insert assistant message:`, insertError);
        // Don't fail the request - still return the reply
        // The client will handle this as a fallback
      } else {
        console.log(`[Edge][Chat][${requestId}] Assistant message inserted successfully:`, insertedMessage.id);
      }
    } catch (insertException: any) {
      console.error(`[Edge][Chat][${requestId}] Exception inserting assistant message:`, insertException);
      // Don't fail the request - still return the reply
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
