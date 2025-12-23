
// Supabase Edge Function: extract-memories
// This function extracts stable facts from user messages using OpenAI
// and returns them in a structured format for storage in person_memories table.
// ALSO extracts conversation continuity data for natural conversation flow.
//
// CRITICAL: This function ALWAYS returns HTTP 200 with JSON response
// Errors are communicated via the "error" field in the response body
// NEVER returns 4xx/5xx status codes
// NEVER throws uncaught errors

import { serve } from 'jsr:@std/http@0.224.5/server';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface RequestBody {
  personName: string;
  recentUserMessages: string[];
  lastAssistantMessage?: string;
  existingMemories: {
    key: string;
    value: string;
    category: string;
  }[];
  userId?: string;
  personId?: string;
}

interface ContinuityData {
  summary_update: string;
  open_loops: string[];
  current_goal: string;
  last_advice: string;
  next_question: string;
}

interface MemoryExtractionResult {
  memories: any[];
  mentioned_keys: any[];
  continuity?: ContinuityData;
  error: string | null;
}

// Memory extraction system prompt
const EXTRACTION_SYSTEM_PROMPT = `You are a memory extraction system. Your job is to extract ONLY stable, factual information explicitly stated by the user.

EXTRACTION RULES:
1. Extract ONLY facts explicitly stated by the user
2. NEVER guess, infer, or assume information
3. NEVER store emotions, insults, or one-off events
4. Keys must be short snake_case (e.g., "favorite_food", "works_at")
5. Values must be concise (max ~180 characters)
6. Only extract information that is likely to remain stable over time

MEMORY CATEGORIES:
- identity: Basic facts about the person (age, occupation, location, etc.)
- relationship: How they relate to the user (e.g., "married for 5 years")
- history: Past events or background (e.g., "grew up in Boston")
- preferences: Likes, dislikes, habits (e.g., "loves hiking")
- boundaries: Stated limits or rules (e.g., "doesn't like being called after 9pm")
- loss_grief: Information about loss or death
- conflict_patterns: Recurring issues or patterns
- goals: Stated goals or aspirations
- context: Other relevant stable context

SPECIAL CASE - DECEASED:
If the user explicitly states the person is deceased (e.g., "he passed away", "she died"), extract:
{
  "category": "loss_grief",
  "key": "is_deceased",
  "value": "true",
  "importance": 5,
  "confidence": 5
}

OUTPUT FORMAT:
Return ONLY valid JSON in this exact format:
{
  "memories": [
    {
      "category": "identity",
      "key": "occupation",
      "value": "software engineer",
      "importance": 3,
      "confidence": 4
    }
  ],
  "mentioned_keys": ["occupation", "favorite_hobby"]
}

- memories: Array of NEW facts to store (can be empty)
- mentioned_keys: Array of existing memory keys that were mentioned in this conversation (for updating last_mentioned_at)
- importance: 1-5 (how important this fact is)
- confidence: 1-5 (how confident you are this is accurate)

EXAMPLES:

User: "My mom loves gardening and she's been doing it for 20 years"
Output:
{
  "memories": [
    {
      "category": "preferences",
      "key": "loves_gardening",
      "value": "has been gardening for 20 years",
      "importance": 3,
      "confidence": 5
    }
  ],
  "mentioned_keys": []
}

User: "He works at Google as a product manager"
Output:
{
  "memories": [
    {
      "category": "identity",
      "key": "occupation",
      "value": "product manager at Google",
      "importance": 4,
      "confidence": 5
    }
  ],
  "mentioned_keys": []
}

User: "She passed away last year"
Output:
{
  "memories": [
    {
      "category": "loss_grief",
      "key": "is_deceased",
      "value": "true",
      "importance": 5,
      "confidence": 5
    },
    {
      "category": "loss_grief",
      "key": "time_of_death",
      "value": "last year",
      "importance": 4,
      "confidence": 5
    }
  ],
  "mentioned_keys": []
}

User: "I'm so angry at him right now"
Output:
{
  "memories": [],
  "mentioned_keys": []
}
(Emotions are NOT stored)

User: "We talked about his job today"
Output:
{
  "memories": [],
  "mentioned_keys": ["occupation"]
}
(No new facts, but "occupation" was mentioned)`;

// Conversation continuity extraction prompt
const CONTINUITY_SYSTEM_PROMPT = `You are a conversation continuity analyzer. Your job is to extract conversation state to help the AI continue naturally.

EXTRACTION RULES:
1. Extract ONLY from what was explicitly discussed
2. NEVER invent or assume information
3. Keep everything concise and factual
4. Use neutral, non-judgmental language

OUTPUT FORMAT:
Return ONLY valid JSON in this exact format:
{
  "summary_update": "Brief 2-3 sentence summary of recent conversation",
  "open_loops": ["Unresolved topic 1", "Unresolved topic 2"],
  "current_goal": "What the user wants right now (if stated)",
  "last_advice": "Last 1-2 pieces of advice given (brief bullets)",
  "next_question": "Best follow-up question to continue naturally"
}

FIELD GUIDELINES:

summary_update:
- 2-3 sentences max
- Focus on key themes and emotional tone
- Example: "User is struggling with their partner's lack of communication. They feel unheard and are considering having a difficult conversation."

open_loops (max 8 items):
- Unresolved questions or topics the user is still processing
- Things they mentioned but didn't fully explore
- Example: ["How to start the conversation", "Whether timing is right", "What to say if partner gets defensive"]

current_goal:
- What the user wants to achieve RIGHT NOW (if stated)
- Leave empty if unclear
- Example: "Wants to have a calm conversation with partner about communication"

last_advice:
- Last 1-2 pieces of advice the AI gave (brief bullets)
- Keep it short and actionable
- Example: "• Try using 'I feel' statements\n• Pick a calm moment to talk"

next_question:
- The most natural follow-up question to continue the conversation
- Should address open loops or deepen understanding
- Example: "Have you thought about when might be a good time to have this conversation?"

EXAMPLES:

Conversation:
User: "My partner never listens to me. I try to talk but they just zone out."
AI: "That sounds really frustrating. Have you tried expressing how this makes you feel?"
User: "Not really, I don't know how to bring it up without starting a fight."

Output:
{
  "summary_update": "User feels unheard by their partner who zones out during conversations. They want to address this but are worried about causing conflict.",
  "open_loops": ["How to bring up the issue without fighting", "What to say to partner", "When to have the conversation"],
  "current_goal": "Find a way to talk to partner about feeling unheard",
  "last_advice": "• Consider expressing how their behavior makes you feel\n• Choose a calm moment for the conversation",
  "next_question": "What usually happens when you try to bring up something that's bothering you?"
}

Conversation:
User: "I'm thinking about quitting my job."
AI: "That's a big decision. What's making you consider leaving?"
User: "My boss is micromanaging everything I do. It's exhausting."

Output:
{
  "summary_update": "User is considering quitting their job due to an exhausting micromanaging boss. They're in the early stages of thinking through this decision.",
  "open_loops": ["Whether to quit or try to improve the situation", "Financial implications of quitting", "What they would do next"],
  "current_goal": "",
  "last_advice": "",
  "next_question": "Have you thought about whether there's anything that could make the situation better, or does it feel like quitting is the only option?"
}`;

/**
 * Helper function to create a safe JSON response with status 200
 * This ensures we NEVER return non-2xx status codes
 * 
 * ALWAYS returns HTTP 200 with JSON body:
 * { "memories": [], "mentioned_keys": [], "continuity": {...}, "error": "string-or-null" }
 */
function createSafeResponse(
  memories: any[] = [],
  mentioned_keys: any[] = [],
  continuity?: ContinuityData,
  error: string | null = null
): Response {
  const responseBody: MemoryExtractionResult = {
    memories,
    mentioned_keys,
    continuity,
    error,
  };

  return new Response(
    JSON.stringify(responseBody),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    }
  );
}

/**
 * Call OpenAI to extract memories
 * Returns empty arrays on any error (never throws)
 */
async function extractMemoriesFromOpenAI(
  personName: string,
  recentUserMessages: string[],
  lastAssistantMessage: string | undefined,
  existingMemories: any[]
): Promise<{ memories: any[]; mentioned_keys: any[] }> {
  try {
    const existingMemoriesText = existingMemories.length > 0
      ? `\n\nEXISTING MEMORIES:\n${existingMemories.map(m => `- ${m.key}: ${m.value}`).join('\n')}`
      : '';

    const userPrompt = `Person Name: ${personName}

Recent User Messages:
${recentUserMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

${lastAssistantMessage ? `Last Assistant Message:\n${lastAssistantMessage}` : ''}
${existingMemoriesText}

Extract any NEW stable facts from the user's messages. Return valid JSON only.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: EXTRACTION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      return { memories: [], mentioned_keys: [] };
    }

    const data = await response.json();
    const jsonString = data.choices?.[0]?.message?.content;

    if (!jsonString) {
      return { memories: [], mentioned_keys: [] };
    }

    const result = JSON.parse(jsonString);
    
    return {
      memories: Array.isArray(result.memories) ? result.memories : [],
      mentioned_keys: Array.isArray(result.mentioned_keys) ? result.mentioned_keys : [],
    };
  } catch (error) {
    console.error('Error in extractMemoriesFromOpenAI:', error);
    return { memories: [], mentioned_keys: [] };
  }
}

/**
 * Call OpenAI to extract conversation continuity
 * Returns empty continuity object on any error (never throws)
 */
async function extractContinuityFromOpenAI(
  personName: string,
  recentUserMessages: string[],
  lastAssistantMessage: string | undefined
): Promise<ContinuityData> {
  try {
    // Build conversation history for context
    const conversationHistory: string[] = [];
    
    // Interleave user messages with assistant message
    for (let i = 0; i < recentUserMessages.length; i++) {
      conversationHistory.push(`User: ${recentUserMessages[i]}`);
    }
    
    if (lastAssistantMessage) {
      conversationHistory.push(`AI: ${lastAssistantMessage}`);
    }

    const userPrompt = `Person Name: ${personName}

Recent Conversation:
${conversationHistory.join('\n\n')}

Extract conversation continuity data to help continue this conversation naturally. Return valid JSON only.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: CONTINUITY_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.2, // Slightly higher for more natural continuity
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      return {
        summary_update: '',
        open_loops: [],
        current_goal: '',
        last_advice: '',
        next_question: '',
      };
    }

    const data = await response.json();
    const jsonString = data.choices?.[0]?.message?.content;

    if (!jsonString) {
      return {
        summary_update: '',
        open_loops: [],
        current_goal: '',
        last_advice: '',
        next_question: '',
      };
    }

    const result = JSON.parse(jsonString);
    
    return {
      summary_update: result.summary_update || '',
      open_loops: Array.isArray(result.open_loops) ? result.open_loops.slice(0, 8) : [],
      current_goal: result.current_goal || '',
      last_advice: result.last_advice || '',
      next_question: result.next_question || '',
    };
  } catch (error) {
    console.error('Error in extractContinuityFromOpenAI:', error);
    return {
      summary_update: '',
      open_loops: [],
      current_goal: '',
      last_advice: '',
      next_question: '',
    };
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight - always return 200
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // Wrap entire handler in try-catch to ensure we NEVER throw uncaught errors
  try {
    console.log('=== Memory Extraction + Continuity Request Started ===');

    // Check for OpenAI API key FIRST
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      return createSafeResponse(
        [],
        [],
        {
          summary_update: '',
          open_loops: [],
          current_goal: '',
          last_advice: '',
          next_question: '',
        },
        'missing_openai_key'
      );
    }

    // Parse request body with defensive error handling
    let requestBody: RequestBody;
    try {
      const rawBody = await req.text();
      if (!rawBody || rawBody.trim() === '') {
        console.error('❌ Empty request body');
        return createSafeResponse(
          [],
          [],
          {
            summary_update: '',
            open_loops: [],
            current_goal: '',
            last_advice: '',
            next_question: '',
          },
          'invalid_input'
        );
      }
      requestBody = JSON.parse(rawBody);
    } catch (jsonError) {
      console.error('❌ Failed to parse request JSON:', jsonError);
      return createSafeResponse(
        [],
        [],
        {
          summary_update: '',
          open_loops: [],
          current_goal: '',
          last_advice: '',
          next_question: '',
        },
        'invalid_input'
      );
    }

    const {
      personName,
      recentUserMessages,
      lastAssistantMessage,
      existingMemories,
      userId,
      personId,
    } = requestBody;

    console.log('Person:', personName);
    console.log('User messages:', recentUserMessages?.length || 0);
    console.log('Existing memories:', existingMemories?.length || 0);
    console.log('User ID:', userId || 'not provided');
    console.log('Person ID:', personId || 'not provided');

    // Validate required inputs
    if (!personName || typeof personName !== 'string' || personName.trim() === '') {
      console.error('❌ Invalid or missing personName');
      return createSafeResponse(
        [],
        [],
        {
          summary_update: '',
          open_loops: [],
          current_goal: '',
          last_advice: '',
          next_question: '',
        },
        'invalid_input'
      );
    }

    if (!Array.isArray(recentUserMessages)) {
      console.error('❌ recentUserMessages is not an array');
      return createSafeResponse(
        [],
        [],
        {
          summary_update: '',
          open_loops: [],
          current_goal: '',
          last_advice: '',
          next_question: '',
        },
        'invalid_input'
      );
    }

    if (recentUserMessages.length === 0) {
      console.error('❌ recentUserMessages is empty');
      return createSafeResponse(
        [],
        [],
        {
          summary_update: '',
          open_loops: [],
          current_goal: '',
          last_advice: '',
          next_question: '',
        },
        'invalid_input'
      );
    }

    if (!Array.isArray(existingMemories)) {
      console.error('❌ existingMemories is not an array');
      return createSafeResponse(
        [],
        [],
        {
          summary_update: '',
          open_loops: [],
          current_goal: '',
          last_advice: '',
          next_question: '',
        },
        'invalid_input'
      );
    }

    // STEP 1: Extract memories (never throws - returns empty arrays on error)
    console.log('Step 1: Extracting memories...');
    const { memories, mentioned_keys } = await extractMemoriesFromOpenAI(
      personName,
      recentUserMessages,
      lastAssistantMessage,
      existingMemories
    );
    console.log('✅ Memories extracted:', memories.length);

    // STEP 2: Extract conversation continuity (only if we have enough messages)
    // Never throws - returns empty continuity on error
    console.log('Step 2: Extracting conversation continuity...');
    let continuity: ContinuityData;
    
    // Only extract continuity if we have at least 2 user messages (meaningful conversation)
    if (recentUserMessages.length >= 2) {
      continuity = await extractContinuityFromOpenAI(
        personName,
        recentUserMessages,
        lastAssistantMessage
      );
      console.log('✅ Continuity extracted');
      console.log('  - Summary:', continuity.summary_update ? 'yes' : 'no');
      console.log('  - Open loops:', continuity.open_loops.length);
      console.log('  - Current goal:', continuity.current_goal ? 'yes' : 'no');
      console.log('  - Last advice:', continuity.last_advice ? 'yes' : 'no');
      console.log('  - Next question:', continuity.next_question ? 'yes' : 'no');
    } else {
      console.log('⚠️ Not enough messages for continuity extraction (need at least 2)');
      continuity = {
        summary_update: '',
        open_loops: [],
        current_goal: '',
        last_advice: '',
        next_question: '',
      };
    }

    console.log('=== Memory Extraction + Continuity Request Completed Successfully ===');

    // Success - return the extracted memories and continuity
    // ALWAYS returns HTTP 200
    return createSafeResponse(memories, mentioned_keys, continuity, null);

  } catch (error) {
    // Catch-all error handler - NEVER let this function crash
    // ALWAYS returns HTTP 200 even on catastrophic failure
    console.error('❌ Unexpected error in extract-memories:', error);
    
    // Convert error to string safely
    let errorMessage = 'unknown_error';
    try {
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
      } else {
        errorMessage = String(error);
      }
    } catch (e) {
      console.error('Could not stringify error:', e);
    }

    // Return safe response with error message
    // HTTP 200 with error field populated
    return createSafeResponse(
      [],
      [],
      {
        summary_update: '',
        open_loops: [],
        current_goal: '',
        last_advice: '',
        next_question: '',
      },
      errorMessage
    );
  }
});
