
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const {
      personName,
      recentUserMessages,
      lastAssistantMessage,
      existingMemories,
    }: RequestBody = await req.json();

    console.log('=== Memory Extraction Request ===');
    console.log('Person:', personName);
    console.log('User messages:', recentUserMessages.length);
    console.log('Existing memories:', existingMemories.length);
    console.log('================================');

    // Validate OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      throw new Error('OpenAI API key is not configured');
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

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const jsonString = data.choices[0]?.message?.content;

    if (!jsonString) {
      console.log('No content in OpenAI response');
      return new Response(
        JSON.stringify({ memories: [], mentioned_keys: [] }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Parse and validate the result
    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      return new Response(
        JSON.stringify({ memories: [], mentioned_keys: [] }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate structure
    if (!result || !Array.isArray(result.memories) || !Array.isArray(result.mentioned_keys)) {
      console.error('Invalid result structure');
      return new Response(
        JSON.stringify({ memories: [], mentioned_keys: [] }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('✅ Memory extraction complete:', {
      memoriesCount: result.memories.length,
      mentionedKeysCount: result.mentioned_keys.length,
    });

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ Error in extract-memories:', error);

    return new Response(
      JSON.stringify({
        memories: [],
        mentioned_keys: [],
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
