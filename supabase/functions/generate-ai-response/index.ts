
// supabase/functions/generate-ai-response/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Check if we're in development mode (set via environment variable)
const IS_DEV = Deno.env.get("DEV_MODE") === "true";

// Timeout configuration (in milliseconds)
const OPENAI_TIMEOUT_MS = 30000; // 30 seconds hard timeout
const TOTAL_FUNCTION_TIMEOUT_MS = 35000; // 35 seconds total (5s buffer for DB operations)

// ═══════════════════════════════════════════════════════════════════
// CORS HEADERS - APPLIED TO ALL RESPONSES
// ═══════════════════════════════════════════════════════════════════
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

// ═══════════════════════════════════════════════════════════════════
// DEFAULT FALLBACK MESSAGE
// ═══════════════════════════════════════════════════════════════════
const DEFAULT_FALLBACK_MESSAGE = "I'm having a little trouble understanding. Could you please rephrase your question?";

// ═══════════════════════════════════════════════════════════════════
// THERAPIST PERSONA DEFINITIONS
// ═══════════════════════════════════════════════════════════════════
const THERAPIST_PERSONAS: Record<string, { name: string; systemPrompt: string }> = {
  dr_elias: {
    name: "Dr. Elias",
    systemPrompt: `You are Dr. Elias. Speak slowly, calmly, and with emotional steadiness. Use grounding language, reassurance, and gentle perspective. Avoid urgency. Prioritize emotional safety and regulation. Do not diagnose or label the user.`,
  },
  noah: {
    name: "Noah",
    systemPrompt: `You are Noah. Communicate clearly and practically. Ask clarifying questions when needed. Focus on structure, patterns, and actionable reflection. Be supportive but concise. Do not diagnose or label the user.`,
  },
  maya: {
    name: "Maya",
    systemPrompt: `You are Maya. Lead with empathy and validation. Reflect emotions clearly and warmly. Avoid rushing solutions. Use gentle language and supportive framing. Do not diagnose or label the user.`,
  },
  claire: {
    name: "Claire",
    systemPrompt: `You are Claire. Ask thoughtful, reflective questions. Highlight patterns gently. Encourage self-awareness without judgment or pressure. Do not diagnose or label the user.`,
  },
  ruth: {
    name: "Ruth",
    systemPrompt: `You are Ruth. Speak with warmth, care, and emotional steadiness. Offer reassurance and gentle perspective. Avoid being patronizing. Do not diagnose or label the user.`,
  },
  jordan: {
    name: "Jordan",
    systemPrompt: `You are Jordan. Be encouraging, affirming, and strength-focused. Highlight resilience and growth while staying emotionally respectful. Do not diagnose or label the user.`,
  },
  aisha: {
    name: "Aisha",
    systemPrompt: `You are Aisha. Lead with curiosity. Ask open-ended questions. Explore perspectives without steering or fixing. Encourage discovery. Do not diagnose or label the user.`,
  },
  ken: {
    name: "Ken",
    systemPrompt: `You are Ken. Balance emotional awareness with logical clarity. Integrate feelings and reasoning calmly. Maintain a composed, respectful tone. Do not diagnose or label the user.`,
  },
};

// ═══════════════════════════════════════════════════════════════════
// CRITICAL: DR. ELIAS IS THE DEFAULT PERSONA
// ═══════════════════════════════════════════════════════════════════
const DEFAULT_PERSONA_ID = "dr_elias";

// Helper to create error response with CORS headers
function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  requestId?: string,
  timestamp?: number
): Response {
  const responseBody = {
    ok: false,
    data: null,
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

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const timestamp = Date.now();
  const functionStartTime = Date.now();

  console.log(`[Edge][Chat][${requestId}] Request started`);

  // ═══════════════════════════════════════════════════════════════════
  // CORS PREFLIGHT HANDLING (CRITICAL FOR WEB PREVIEW)
  // ═══════════════════════════════════════════════════════════════════
  if (req.method === "OPTIONS") {
    console.log(`[Edge][Chat][${requestId}] CORS preflight request`);
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
      console.log(`[Edge][Chat][${requestId}] Invalid method: ${req.method}`);
      return createErrorResponse(
        "METHOD_NOT_ALLOWED",
        "Only POST requests are allowed",
        { method: req.method },
        requestId,
        timestamp
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // CRITICAL: VALIDATE OPENAI_API_KEY FIRST
    // ═══════════════════════════════════════════════════════════════════
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] ❌ CRITICAL: OPENAI_API_KEY is not configured!`);
      console.error(`[Edge][Chat][${requestId}] 📝 To fix this:`);
      console.error(`[Edge][Chat][${requestId}]    1. Go to Supabase Dashboard`);
      console.error(`[Edge][Chat][${requestId}]    2. Navigate to Edge Functions → Secrets`);
      console.error(`[Edge][Chat][${requestId}]    3. Add/Update OPENAI_API_KEY with a valid OpenAI API key`);
      console.error(`[Edge][Chat][${requestId}]    4. Get your key from: https://platform.openai.com/api-keys`);
      
      return createErrorResponse(
        "MISSING_API_KEY",
        "OpenAI API key is not configured. Please contact support to set up the OPENAI_API_KEY environment variable.",
        { 
          env: "OPENAI_API_KEY not set",
          hint: "Administrator: Go to Supabase Dashboard > Edge Functions > Secrets and add OPENAI_API_KEY",
          docsUrl: "https://platform.openai.com/api-keys"
        },
        requestId,
        timestamp
      );
    }

    // Validate that the API key looks correct (starts with sk-)
    if (!OPENAI_API_KEY.startsWith('sk-')) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] ❌ CRITICAL: OPENAI_API_KEY format is invalid!`);
      console.error(`[Edge][Chat][${requestId}] Expected format: sk-...`);
      console.error(`[Edge][Chat][${requestId}] Current format: ${OPENAI_API_KEY.substring(0, 8)}...`);
      
      return createErrorResponse(
        "INVALID_API_KEY_FORMAT",
        "OpenAI API key format is invalid. Please contact support to update the OPENAI_API_KEY.",
        { 
          hint: "OpenAI API keys should start with 'sk-'",
          currentPrefix: OPENAI_API_KEY.substring(0, 8),
          docsUrl: "https://platform.openai.com/api-keys"
        },
        requestId,
        timestamp
      );
    }

    console.log(`[Edge][Chat][${requestId}] ✅ OpenAI API key validated (format: sk-...)`);

    // Validate Supabase configuration
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] Missing Supabase configuration`);
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

    // ═══════════════════════════════════════════════════════════════════
    // FIXED: PROPER AUTH VALIDATION WITH SERVICE ROLE CLIENT
    // ═══════════════════════════════════════════════════════════════════
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    
    if (!authHeader) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] Missing Authorization header`);
      console.log(`[Edge][Chat][${requestId}] Available headers:`, Array.from(req.headers.keys()));
      return createErrorResponse(
        "UNAUTHORIZED",
        "Missing Authorization header",
        { hint: "Please ensure you are logged in" },
        requestId,
        timestamp
      );
    }

    // Extract token from "Bearer <token>" format
    let token = authHeader.trim();
    
    // Remove "Bearer " prefix if present (case-insensitive)
    if (token.toLowerCase().startsWith("bearer ")) {
      token = token.substring(7).trim();
    }
    
    if (!token || token.length < 20) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] Invalid auth token format`);
      return createErrorResponse(
        "UNAUTHORIZED",
        "Invalid Authorization header format",
        { hint: "Expected format: Bearer <token>" },
        requestId,
        timestamp
      );
    }

    console.log(`[Edge][Chat][${requestId}] Auth token extracted (length: ${token.length})`);

    // ═══════════════════════════════════════════════════════════════════
    // CRITICAL FIX: Create Supabase client with BOTH service role AND user token
    // This allows us to:
    // 1. Validate the user's JWT token
    // 2. Use service role permissions for database operations
    // ═══════════════════════════════════════════════════════════════════
    
    // First, create a client to validate the user token
    const authClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    
    console.log(`[Edge][Chat][${requestId}] Validating user token...`);
    
    // Validate the user's token using service role client
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] Auth validation failed:`, authError?.message);
      return createErrorResponse(
        "UNAUTHORIZED",
        "Invalid or expired authentication token",
        { 
          hint: "Please log in again",
          authError: authError?.message 
        },
        requestId,
        timestamp
      );
    }

    console.log(`[Edge][Chat][${requestId}] User authenticated: ${user.id}`);

    // Now create a service role client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError: any) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] JSON parse error:`, parseError?.message);
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
      userId,
      therapistPersonaId,
    } = body ?? {};

    // ═══════════════════════════════════════════════════════════════════
    // VALIDATE REQUIRED INPUTS
    // ═══════════════════════════════════════════════════════════════════
    
    if (!Array.isArray(messages)) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] Invalid messages field:`, typeof messages);
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
      console.error(`[Edge][Chat][${requestId}] Missing userId`);
      return createErrorResponse(
        "BAD_REQUEST",
        "userId is required",
        { userId },
        requestId,
        timestamp
      );
    }

    // Verify userId matches authenticated user
    if (userId !== user.id) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] userId mismatch: ${userId} !== ${user.id}`);
      return createErrorResponse(
        "FORBIDDEN",
        "User ID does not match authenticated user",
        { providedUserId: userId, authenticatedUserId: user.id },
        requestId,
        timestamp
      );
    }

    if (!personId) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] Missing personId`);
      return createErrorResponse(
        "BAD_REQUEST",
        "personId is required",
        { personId },
        requestId,
        timestamp
      );
    }

    console.log(`[Edge][Chat][${requestId}] Validated inputs - userId: ${userId}, personId: ${personId}, messages: ${messages.length}`);

    // ═══════════════════════════════════════════════════════════════════
    // RATE LIMITING - Prevent API abuse and control costs
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Edge][Chat][${requestId}] Checking rate limits...`);

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentMessages, error: rateLimitError } = await supabase
      .from('messages')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'user')
      .gte('created_at', oneMinuteAgo);

    if (rateLimitError) {
      console.warn(`[Edge][Chat][${requestId}] Rate limit check failed:`, rateLimitError.message);
      // Continue anyway - don't block on rate limit check failure
    } else if (recentMessages && recentMessages.length > 15) {
      clearTimeout(functionTimeoutId);
      console.warn(`[Edge][Chat][${requestId}] Rate limit exceeded: ${recentMessages.length} messages in last minute`);
      return createErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        "You're sending messages too quickly. Please wait a moment and try again.",
        {
          limit: 15,
          window: '1 minute',
          current: recentMessages.length
        },
        requestId,
        timestamp
      );
    }

    console.log(`[Edge][Chat][${requestId}] Rate limit check passed (${recentMessages?.length || 0}/15 messages in last minute)`);

    // ═══════════════════════════════════════════════════════════════════
    // GET THERAPIST PERSONA - DR. ELIAS IS DEFAULT
    // ═══════════════════════════════════════════════════════════════════
    const personaId = therapistPersonaId || DEFAULT_PERSONA_ID;
    const persona = THERAPIST_PERSONAS[personaId] || THERAPIST_PERSONAS[DEFAULT_PERSONA_ID];
    
    console.log(`[Edge][Chat][${requestId}] Therapist persona selected:`, {
      requestedPersonaId: therapistPersonaId,
      resolvedPersonaId: personaId,
      personaName: persona.name,
      isDefault: personaId === DEFAULT_PERSONA_ID,
    });

    // Build comprehensive system prompt
    let systemPrompt = `You are "${persona.name}," a warm, trauma-aware relationship and emotional support companion.

You're talking about ${personName || 'this person'} (${personRelationshipType || 'relationship'}).

${persona.systemPrompt}

Core rules:
- Keep replies short (1–3 sentences usually).
- Validate feelings first.
- Ask gentle follow-up questions (max 1 per response).
- Never diagnose.
- Don't invent facts.
- Use tentative phrasing: "You might notice...", "It could be helpful to explore...", "What feels right to you?"
- Support reflection, don't define the user.`;

    // Add subject context if provided
    if (currentSubject && currentSubject.trim() && currentSubject !== 'General') {
      systemPrompt += `

Current conversation focus: ${currentSubject}
Please tailor your response to this specific subject.`;
    }

    const systemMessage = { role: "system" as const, content: systemPrompt };

    const openaiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    }));

    // ═══════════════════════════════════════════════════════════════════
    // CALL OPENAI API WITH TIMEOUT
    // ═══════════════════════════════════════════════════════════════════
    
    const openaiStartTime = Date.now();
    const openaiAbortController = new AbortController();
    const openaiTimeoutId = setTimeout(() => {
      console.error(`[Edge][Chat][${requestId}] OpenAI timeout after ${OPENAI_TIMEOUT_MS}ms`);
      openaiAbortController.abort();
    }, OPENAI_TIMEOUT_MS);

    let openaiRes: Response;
    try {
      console.log(`[Edge][Chat][${requestId}] Calling OpenAI API with persona: ${persona.name}...`);
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
        }),
        signal: openaiAbortController.signal
      });

      clearTimeout(openaiTimeoutId);
      const openaiLatency = Date.now() - openaiStartTime;
      console.log(`[Edge][Chat][${requestId}] OpenAI API responded with status: ${openaiRes.status} (latency: ${openaiLatency}ms)`);
    } catch (fetchError: any) {
      clearTimeout(openaiTimeoutId);
      clearTimeout(functionTimeoutId);

      if (fetchError.name === "AbortError") {
        console.error(`[Edge][Chat][${requestId}] OpenAI request aborted (timeout)`);
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

      console.error(`[Edge][Chat][${requestId}] OpenAI network error:`, fetchError?.message);
      return createErrorResponse(
        "OPENAI_NETWORK_ERROR",
        "Failed to connect to OpenAI API",
        {
          error: fetchError?.message,
          name: fetchError?.name
        },
        requestId,
        timestamp
      );
    }

    const rawText = await openaiRes.text();

    if (!openaiRes.ok) {
      clearTimeout(functionTimeoutId);
      console.error(`[Edge][Chat][${requestId}] ❌ OpenAI API error: ${openaiRes.status} ${openaiRes.statusText}`);
      console.error(`[Edge][Chat][${requestId}] Response body:`, rawText.substring(0, 500));
      
      // Check if it's an authentication error
      if (openaiRes.status === 401) {
        console.error(`[Edge][Chat][${requestId}] 🔑 AUTHENTICATION ERROR - Invalid OpenAI API Key!`);
        console.error(`[Edge][Chat][${requestId}] 📝 To fix this:`);
        console.error(`[Edge][Chat][${requestId}]    1. Go to https://platform.openai.com/api-keys`);
        console.error(`[Edge][Chat][${requestId}]    2. Create a new API key or verify your existing key`);
        console.error(`[Edge][Chat][${requestId}]    3. Go to Supabase Dashboard > Edge Functions > Secrets`);
        console.error(`[Edge][Chat][${requestId}]    4. Update OPENAI_API_KEY with the correct key`);
        console.error(`[Edge][Chat][${requestId}]    5. The key should start with 'sk-' and be about 50+ characters`);
        
        return createErrorResponse(
          "OPENAI_AUTH_ERROR",
          "The OpenAI API key is invalid or expired. Please contact support to update the API key.",
          {
            status: 401,
            statusText: "Unauthorized",
            hint: "Administrator: Update OPENAI_API_KEY in Supabase Edge Functions Secrets",
            docsUrl: "https://platform.openai.com/api-keys",
            bodyPreview: rawText.substring(0, 200)
          },
          requestId,
          timestamp
        );
      }
      
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
      console.error(`[Edge][Chat][${requestId}] Failed to parse OpenAI response as JSON`);
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

    // Extract reply text
    let replyText = data?.choices?.[0]?.message?.content || '';

    // CRITICAL: If reply is empty, use fallback
    if (!replyText || replyText.trim().length === 0) {
      console.warn(`[Edge][Chat][${requestId}] Empty reply detected - using fallback message`);
      replyText = DEFAULT_FALLBACK_MESSAGE;
    }

    console.log(`[Edge][Chat][${requestId}] Final reply length: ${replyText.length} characters`);

    // ═══════════════════════════════════════════════════════════════════
    // INSERT ASSISTANT MESSAGE INTO DATABASE (SOURCE OF TRUTH)
    // ═══════════════════════════════════════════════════════════════════
    
    console.log(`[Edge][Chat][${requestId}] Inserting assistant message into database...`);
    const dbInsertStartTime = Date.now();
    
    const { data: assistantMessage, error: insertError } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        person_id: personId,
        role: "assistant",
        content: replyText,
        subject: currentSubject || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    const dbInsertLatency = Date.now() - dbInsertStartTime;

    if (insertError) {
      console.error(`[Edge][Chat][${requestId}] DB insert failed (latency: ${dbInsertLatency}ms):`, insertError);
      clearTimeout(functionTimeoutId);
      return createErrorResponse(
        "DB_INSERT_ERROR",
        "Failed to save assistant message to database",
        {
          error: insertError.message,
          code: insertError.code,
          details: insertError.details
        },
        requestId,
        timestamp
      );
    }

    console.log(`[Edge][Chat][${requestId}] DB insert success (latency: ${dbInsertLatency}ms) - message ID: ${assistantMessage.id}`);

    clearTimeout(functionTimeoutId);

    const totalLatency = Date.now() - functionStartTime;
    const openaiLatency = Date.now() - openaiStartTime;

    // ═══════════════════════════════════════════════════════════════════
    // RETURN GUARANTEED RESPONSE SHAPE
    // ═══════════════════════════════════════════════════════════════════
    
    const responseBody = {
      ok: true,
      data: {
        replyText,
        assistantMessage
      },
      error: null,
      requestId,
      timestamp,
      latency: {
        total: totalLatency,
        openai: openaiLatency,
        dbInsert: dbInsertLatency
      }
    };

    console.log(`[Edge][Chat][${requestId}] ✅ Success - Total: ${totalLatency}ms, OpenAI: ${openaiLatency}ms, DB: ${dbInsertLatency}ms, Persona: ${persona.name}`);

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

    return createErrorResponse(
      "UNEXPECTED_ERROR",
      e?.message ?? "An unexpected error occurred",
      {
        name: e?.name,
        message: e?.message ?? String(e)
      },
      requestId,
      timestamp
    );
  }
});
