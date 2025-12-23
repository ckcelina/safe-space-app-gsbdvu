
// Supabase Edge Function: extract-memories
// This function extracts stable facts from user messages using OpenAI
// and returns them in a structured format for storage in person_memories table.
//
// CRITICAL: This function ALWAYS returns HTTP 200 with JSON response
// Errors are communicated via the "error" field in the response body

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

interface MemoryExtractionResult {
  memories: any[];
  mentioned_keys: any[];
  error: string | null;
  debug: { missing_env: boolean; reason: string } | null;
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

/**
 * Helper function to create a safe JSON response with status 200
 * This ensures we NEVER return non-2xx status codes
 */
function createSafeResponse(
  memories: any[] = [],
  mentioned_keys: any[] = [],
  error: string | null = null,
  debug: { missing_env: boolean; reason: string } | null = null
): Response {
  const responseBody: MemoryExtractionResult = {
    memories,
    mentioned_keys,
    error,
    debug,
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
    console.log('=== Memory Extraction Request Started ===');

    // Check for OpenAI API key FIRST
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      return createSafeResponse(
        [],
        [],
        'missing_openai_key',
        {
          missing_env: true,
          reason: 'OPENAI_API_KEY environment variable is not set or is empty',
        }
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
          'invalid_input',
          {
            missing_env: false,
            reason: 'Request body is empty',
          }
        );
      }
      requestBody = JSON.parse(rawBody);
    } catch (jsonError) {
      console.error('❌ Failed to parse request JSON:', jsonError);
      return createSafeResponse(
        [],
        [],
        'invalid_input',
        {
          missing_env: false,
          reason: `Invalid JSON in request body: ${jsonError instanceof Error ? jsonError.message : 'unknown error'}`,
        }
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
        'invalid_input',
        {
          missing_env: false,
          reason: 'personName is required and must be a non-empty string',
        }
      );
    }

    if (!Array.isArray(recentUserMessages)) {
      console.error('❌ recentUserMessages is not an array');
      return createSafeResponse(
        [],
        [],
        'invalid_input',
        {
          missing_env: false,
          reason: 'recentUserMessages must be an array',
        }
      );
    }

    if (recentUserMessages.length === 0) {
      console.error('❌ recentUserMessages is empty');
      return createSafeResponse(
        [],
        [],
        'invalid_input',
        {
          missing_env: false,
          reason: 'recentUserMessages array is empty',
        }
      );
    }

    if (!Array.isArray(existingMemories)) {
      console.error('❌ existingMemories is not an array');
      return createSafeResponse(
        [],
        [],
        'invalid_input',
        {
          missing_env: false,
          reason: 'existingMemories must be an array',
        }
      );
    }

    // Build the extraction prompt
    const existingMemoriesText = existingMemories.length > 0
      ? `\n\nEXISTING MEMORIES:\n${existingMemories.map(m => `- ${m.key}: ${m.value}`).join('\n')}`
      : '';

    const userPrompt = `Person Name: ${personName}

Recent User Messages:
${recentUserMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

${lastAssistantMessage ? `Last Assistant Message:\n${lastAssistantMessage}` : ''}
${existingMemoriesText}

Extract any NEW stable facts from the user's messages. Return valid JSON only.`;

    console.log('Calling OpenAI for memory extraction...');

    // Call OpenAI API with comprehensive error handling
    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    } catch (fetchError) {
      console.error('❌ OpenAI fetch failed:', fetchError);
      return createSafeResponse(
        [],
        [],
        'openai_failed',
        {
          missing_env: false,
          reason: `Network error calling OpenAI API: ${fetchError instanceof Error ? fetchError.message : 'unknown error'}`,
        }
      );
    }

    // Handle non-OK OpenAI response
    if (!response.ok) {
      let errorData = 'unknown';
      try {
        const errorText = await response.text();
        errorData = errorText || `HTTP ${response.status}`;
      } catch (e) {
        console.error('Could not read error response:', e);
        errorData = `HTTP ${response.status}`;
      }
      console.error('❌ OpenAI API error:', errorData);
      
      // Check if it's an authentication error
      if (response.status === 401) {
        return createSafeResponse(
          [],
          [],
          'missing_openai_key',
          {
            missing_env: true,
            reason: 'OPENAI_API_KEY is invalid or unauthorized',
          }
        );
      }
      
      return createSafeResponse(
        [],
        [],
        'openai_failed',
        {
          missing_env: false,
          reason: `OpenAI API returned error: ${errorData}`,
        }
      );
    }

    // Parse OpenAI response
    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response JSON:', parseError);
      return createSafeResponse(
        [],
        [],
        'openai_failed',
        {
          missing_env: false,
          reason: `Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'unknown error'}`,
        }
      );
    }

    const jsonString = data.choices?.[0]?.message?.content;

    if (!jsonString) {
      console.log('⚠️ No content in OpenAI response, returning empty result');
      return createSafeResponse([], [], null, null);
    }

    // Parse and validate the extraction result
    let result: any;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ JSON parsing failed for extraction result:', parseError);
      console.error('Raw content:', jsonString);
      return createSafeResponse(
        [],
        [],
        'openai_failed',
        {
          missing_env: false,
          reason: `OpenAI returned invalid JSON: ${parseError instanceof Error ? parseError.message : 'unknown error'}`,
        }
      );
    }

    // Validate structure and provide defaults
    if (!result || typeof result !== 'object') {
      console.error('❌ Invalid result: not an object');
      return createSafeResponse(
        [],
        [],
        'openai_failed',
        {
          missing_env: false,
          reason: 'OpenAI returned invalid result structure',
        }
      );
    }

    // Ensure memories is an array
    const memories = Array.isArray(result.memories) ? result.memories : [];
    
    // Ensure mentioned_keys is an array
    const mentioned_keys = Array.isArray(result.mentioned_keys) ? result.mentioned_keys : [];

    console.log('✅ Memory extraction complete:', {
      memoriesCount: memories.length,
      mentionedKeysCount: mentioned_keys.length,
    });
    console.log('=== Memory Extraction Request Completed Successfully ===');

    // Success - return the extracted memories
    return createSafeResponse(memories, mentioned_keys, null, null);

  } catch (error) {
    // Catch-all error handler - NEVER let this function crash
    console.error('❌ Unexpected error in extract-memories:', error);
    
    // Convert error to string safely
    let errorMessage = 'unknown_error';
    let errorDetails = 'An unexpected error occurred';
    try {
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = `${error.name}: ${error.message}`;
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
      } else {
        errorMessage = String(error);
        errorDetails = String(error);
      }
    } catch (e) {
      console.error('Could not stringify error:', e);
    }

    return createSafeResponse(
      [],
      [],
      'openai_failed',
      {
        missing_env: false,
        reason: errorDetails,
      }
    );
  }
});
