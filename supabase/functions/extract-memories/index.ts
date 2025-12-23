
// Supabase Edge Function: extract-memories
// This function extracts stable facts from user messages using OpenAI
// and returns them in a structured format for storage in person_memories table.

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

// Helper function to create a safe JSON response with status 200
function createSafeResponse(
  memories: any[] = [],
  mentioned_keys: any[] = [],
  error: string | null = null
) {
  return new Response(
    JSON.stringify({
      memories,
      mentioned_keys,
      error,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

serve(async (req) => {
  // Handle CORS - always return 200
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // Wrap entire handler in try-catch to ensure we NEVER throw
  try {
    // Parse request body with defensive error handling
    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error('❌ Failed to parse request JSON:', jsonError);
      return createSafeResponse([], [], 'invalid_json_request');
    }

    const {
      personName,
      recentUserMessages,
      lastAssistantMessage,
      existingMemories,
    } = requestBody;

    console.log('=== Memory Extraction Request ===');
    console.log('Person:', personName);
    console.log('User messages:', recentUserMessages?.length || 0);
    console.log('Existing memories:', existingMemories?.length || 0);
    console.log('================================');

    // Validate required inputs defensively
    if (!personName || typeof personName !== 'string') {
      console.error('❌ Invalid or missing personName');
      return createSafeResponse([], [], 'invalid_input_person_name');
    }

    if (!Array.isArray(recentUserMessages) || recentUserMessages.length === 0) {
      console.error('❌ Invalid or empty recentUserMessages');
      return createSafeResponse([], [], 'invalid_input_messages');
    }

    if (!Array.isArray(existingMemories)) {
      console.error('❌ Invalid existingMemories (not an array)');
      return createSafeResponse([], [], 'invalid_input_existing_memories');
    }

    // Validate OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      return createSafeResponse([], [], 'missing_openai_key');
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

    // Call OpenAI API with error handling
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
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
      return createSafeResponse([], [], 'openai_fetch_failed');
    }

    // Handle non-OK OpenAI response
    if (!response.ok) {
      let errorData = 'unknown';
      try {
        errorData = await response.text();
      } catch (e) {
        console.error('Could not read error response:', e);
      }
      console.error('❌ OpenAI API error:', errorData);
      return createSafeResponse([], [], `openai_api_error_${response.status}`);
    }

    // Parse OpenAI response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response JSON:', parseError);
      return createSafeResponse([], [], 'openai_response_parse_failed');
    }

    const jsonString = data.choices?.[0]?.message?.content;

    if (!jsonString) {
      console.log('⚠️ No content in OpenAI response');
      return createSafeResponse([], [], null);
    }

    // Parse and validate the extraction result
    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ JSON parsing failed for extraction result:', parseError);
      return createSafeResponse([], [], 'json_parse_failed');
    }

    // Validate structure
    if (!result || typeof result !== 'object') {
      console.error('❌ Invalid result: not an object');
      return createSafeResponse([], [], 'invalid_result_structure');
    }

    if (!Array.isArray(result.memories)) {
      console.error('❌ Invalid result: memories is not an array');
      return createSafeResponse([], [], 'invalid_memories_array');
    }

    if (!Array.isArray(result.mentioned_keys)) {
      console.error('❌ Invalid result: mentioned_keys is not an array');
      return createSafeResponse([], [], 'invalid_mentioned_keys_array');
    }

    console.log('✅ Memory extraction complete:', {
      memoriesCount: result.memories.length,
      mentionedKeysCount: result.mentioned_keys.length,
    });

    // Success - return the extracted memories
    return createSafeResponse(result.memories, result.mentioned_keys, null);

  } catch (error) {
    // Catch-all error handler - NEVER let this function crash
    console.error('❌ Unexpected error in extract-memories:', error);
    
    // Convert error to string safely
    let errorMessage = 'unknown_error';
    try {
      errorMessage = String(error?.message || error);
    } catch (e) {
      console.error('Could not stringify error:', e);
    }

    return createSafeResponse([], [], errorMessage);
  }
});
