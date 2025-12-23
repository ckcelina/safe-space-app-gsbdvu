
# Edge Function Tone Integration Guide

## Overview
This guide explains how the Supabase Edge Function should integrate with the enhanced AI tone system.

## Expected Input from Client

The edge function should receive these parameters from `chat.tsx`:

```typescript
{
  personId: string,
  personName: string,
  personRelationshipType: string,
  messages: Array<{
    role: 'user' | 'assistant',
    content: string,
    createdAt: string
  }>,
  currentSubject: string,
  aiToneId: string,           // ← NEW: Tone ID (e.g., 'warm_hug')
  aiScienceMode: boolean      // ← NEW: Science mode flag
}
```

## Edge Function Implementation

### Step 1: Import the Prompt Generator

```typescript
// At the top of your edge function file
import { generateAISystemPrompt, detectDeathMention } from './aiPrompt.ts';
```

### Step 2: Extract Parameters

```typescript
const {
  personId,
  personName,
  personRelationshipType,
  messages,
  currentSubject,
  aiToneId = 'balanced_blend',      // Default if not provided
  aiScienceMode = false              // Default if not provided
} = await req.json();
```

### Step 3: Generate System Prompt

```typescript
// Detect if conversation mentions death/loss
const hasDeathMention = detectDeathMention(messages);

// Generate the full system prompt with tone instructions
const systemPrompt = generateAISystemPrompt({
  personName,
  relationshipType: personRelationshipType,
  currentSubject,
  aiToneId,
  aiScienceMode,
  conversationContext: {
    hasDeathMention,
  },
});
```

### Step 4: Call OpenAI with System Prompt

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini', // or your preferred model
  messages: [
    {
      role: 'system',
      content: systemPrompt,  // ← Full prompt with tone instructions
    },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ],
  temperature: 0.7,
  max_tokens: 800,
});
```

### Step 5: Return Response

```typescript
return new Response(
  JSON.stringify({
    reply: response.choices[0].message.content,
  }),
  {
    headers: { 'Content-Type': 'application/json' },
  }
);
```

## Complete Edge Function Example

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateAISystemPrompt, detectDeathMention } from './aiPrompt.ts';

// Initialize OpenAI
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  try {
    // Parse request body
    const {
      personId,
      personName,
      personRelationshipType,
      messages,
      currentSubject,
      aiToneId = 'balanced_blend',
      aiScienceMode = false,
    } = await req.json();

    console.log('[Edge Function] Generating AI response');
    console.log('[Edge Function] Tone:', aiToneId);
    console.log('[Edge Function] Science mode:', aiScienceMode);
    console.log('[Edge Function] Subject:', currentSubject);

    // Detect grief context
    const hasDeathMention = detectDeathMention(messages);

    // Generate system prompt with tone instructions
    const systemPrompt = generateAISystemPrompt({
      personName,
      relationshipType: personRelationshipType,
      currentSubject,
      aiToneId,
      aiScienceMode,
      conversationContext: {
        hasDeathMention,
      },
    });

    console.log('[Edge Function] System prompt length:', systemPrompt.length);

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log('[Edge Function] AI response generated successfully');

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Edge Function] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        reply: "I'm having trouble responding right now. Please try again in a moment.",
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

## Verification Checklist

### ✅ Client Side (chat.tsx)
- [ ] Passes `aiToneId` from `preferences.ai_tone_id`
- [ ] Passes `aiScienceMode` from `preferences.ai_science_mode`
- [ ] Includes `currentSubject` in request body
- [ ] Logs parameters before calling edge function

### ✅ Edge Function
- [ ] Imports `generateAISystemPrompt` from `aiPrompt.ts`
- [ ] Extracts `aiToneId` and `aiScienceMode` from request body
- [ ] Calls `generateAISystemPrompt()` with all parameters
- [ ] Passes generated system prompt to OpenAI
- [ ] Logs tone ID and science mode for debugging

### ✅ Prompt Generation (aiPrompt.ts)
- [ ] Calls `getToneSystemInstruction(aiToneId)`
- [ ] Includes tone instruction prominently in prompt
- [ ] Adds science mode section if enabled
- [ ] Includes conversation context (subject, grief)
- [ ] Returns complete system prompt string

## Testing the Integration

### Test 1: Verify Parameters Are Passed
```typescript
// In edge function, add logging:
console.log('Received aiToneId:', aiToneId);
console.log('Received aiScienceMode:', aiScienceMode);
```

Expected output:
```
Received aiToneId: warm_hug
Received aiScienceMode: true
```

### Test 2: Verify Prompt Generation
```typescript
// In edge function, log the system prompt:
console.log('System prompt preview:', systemPrompt.substring(0, 500));
```

Expected output should include:
```
SYSTEM ROLE: Safe Space AI
...
🎭 TONE STYLE (APPLY THIS STRONGLY TO EVERY RESPONSE):
...
You are deeply empathetic, warm, and nurturing...
```

### Test 3: Verify OpenAI Receives Prompt
```typescript
// Log the messages array before sending to OpenAI:
console.log('First message role:', messages[0].role);
console.log('First message content length:', messages[0].content.length);
```

### Test 4: Compare Responses
Send the same user message with different tones and verify responses differ:

**User message:** "My partner forgot our anniversary."

**With `warm_hug`:**
- Should be long, validating, gentle
- Should use phrases like "That must have hurt," "It's completely understandable"

**With `executive_summary`:**
- Should be short, bullet points
- Should focus on action items

**With `reality_check`:**
- Should point out patterns
- Should be direct but not harsh

## Troubleshooting

### Issue: Tone not noticeable in responses
**Possible causes:**
1. Edge function not receiving `aiToneId` parameter
2. `generateAISystemPrompt()` not being called
3. System prompt not being passed to OpenAI
4. OpenAI model ignoring system prompt (try GPT-4 instead of 3.5)

**Debug steps:**
1. Add logging at each step (see Test 1-3 above)
2. Verify system prompt includes tone instructions
3. Test with extreme tones (Warm Hug vs. Executive Summary)
4. Check OpenAI API response for errors

### Issue: Science mode not working
**Possible causes:**
1. `aiScienceMode` not being passed
2. Prompt not including science mode section
3. User testing with topics that don't benefit from research

**Debug steps:**
1. Log `aiScienceMode` value in edge function
2. Check if prompt includes "SCIENCE & RESOURCES MODE (ENABLED)"
3. Test with topics like "attachment issues" or "communication problems"

### Issue: Edge function errors
**Possible causes:**
1. Missing import for `generateAISystemPrompt`
2. `aiPrompt.ts` not deployed with edge function
3. Syntax errors in prompt generation

**Debug steps:**
1. Check edge function logs in Supabase dashboard
2. Verify all files are deployed together
3. Test prompt generation locally first

## Deployment Notes

### Files to Deploy
When deploying the edge function, ensure these files are included:
1. `index.ts` (main edge function)
2. `aiPrompt.ts` (prompt generation logic)
3. `aiTones.ts` (tone metadata)

### Environment Variables
Required:
- `OPENAI_API_KEY` - Your OpenAI API key

### Deployment Command
```bash
supabase functions deploy generate-ai-response
```

## Performance Considerations

### Prompt Length
- Enhanced prompts are longer (~2000-3000 tokens)
- This increases OpenAI API costs slightly
- Consider using GPT-4o-mini for cost efficiency

### Caching
- System prompts are generated on each request
- Consider caching prompts by tone ID if performance is an issue
- Cache key: `${aiToneId}_${aiScienceMode}_${currentSubject}`

### Rate Limiting
- No changes needed to rate limiting logic
- Tone system doesn't affect request frequency

## Next Steps

1. **Deploy updated edge function** with tone support
2. **Test each tone** with the same prompt to verify differences
3. **Monitor logs** for any errors or unexpected behavior
4. **Gather user feedback** on tone effectiveness
5. **Iterate on system instructions** based on response quality

## Support

If you encounter issues:
1. Check edge function logs in Supabase dashboard
2. Verify client is passing correct parameters
3. Test prompt generation in isolation
4. Review this guide's troubleshooting section
