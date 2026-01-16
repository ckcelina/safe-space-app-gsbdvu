
# Conversation Continuity Memory Implementation

## Overview

This feature adds per-person "Conversation Continuity Memory" to enable the AI to continue conversations naturally across sessions. The AI now remembers:

- **Summary**: Brief 2-3 sentence summary of recent conversation
- **Open Loops**: Unresolved topics/questions the user is still processing (max 8)
- **Current Goal**: What the user wants to achieve right now
- **Last Advice**: Last 1-2 pieces of advice given (brief bullets)
- **Next Question**: The best follow-up question to continue naturally

## Database Changes

### Migration Applied

```sql
-- Add conversation continuity columns to person_chat_summaries
ALTER TABLE public.person_chat_summaries
ADD COLUMN IF NOT EXISTS current_goal text DEFAULT '';

ALTER TABLE public.person_chat_summaries
ADD COLUMN IF NOT EXISTS last_advice text DEFAULT '';
```

### Table Structure

The `person_chat_summaries` table now has:

- `user_id` (uuid) - Foreign key to auth.users
- `person_id` (uuid) - Foreign key to persons
- `summary` (text) - Rolling conversation summary
- `open_loops` (jsonb) - Array of unresolved topics (max 8)
- `current_goal` (text) - User's current goal
- `last_advice` (text) - Last advice given
- `next_question` (text) - Suggested follow-up question
- `updated_at` (timestamp) - Last update time

## Implementation Details

### 1. Memory Extraction (Edge Function)

**File**: `supabase/functions/extract-memories/index.ts`

The Edge Function now performs TWO extractions:

1. **Memory Extraction** (existing): Extracts stable facts about the person
2. **Continuity Extraction** (NEW): Extracts conversation state

Both use OpenAI with low temperature (0.1 for memories, 0.2 for continuity) to ensure consistency.

**Continuity Extraction Prompt**:
- Analyzes recent user messages and AI responses
- Extracts summary, open loops, current goal, last advice, next question
- Uses strict JSON format
- NEVER invents information - only extracts what was explicitly discussed

### 2. Client-Side Integration

**File**: `lib/memory/extractMemories.ts`

- Updated to handle continuity data in response
- Validates all fields with safe defaults
- Returns `ContinuityData` object with all fields

**File**: `lib/memory/personSummary.ts`

- Updated `ContinuityData` interface to include `current_goal` and `last_advice`
- Updated `getPersonContinuity()` to fetch all fields
- Updated `upsertPersonContinuity()` to save all fields

### 3. AI Prompt Injection

**File**: `supabase/functions/generate-ai-response/index.ts`

The system prompt now includes a dedicated "CONVERSATION CONTINUITY" section:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CONVERSATION CONTINUITY (do not invent - use only what's here):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent conversation summary:
{summary}

🎯 Current goal: {current_goal}

🔄 Open loops (unresolved topics):
  1. {loop1}
  2. {loop2}
  ...

💡 Last advice given:
{last_advice}

❓ Suggested follow-up: {next_question}

⚠️ CONTINUITY INSTRUCTION:
Start by continuing from open loops or the suggested follow-up question 
UNLESS the user clearly changes the topic. This helps maintain natural 
conversation flow.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. Chat Flow Integration

**File**: `app/(tabs)/(home)/chat.tsx`

After each AI response, the app:

1. Extracts memories (existing)
2. Extracts continuity data (NEW)
3. Saves continuity to database via `upsertPersonContinuity()`

This happens in the background and NEVER blocks the chat flow.

## Failsafe Mechanisms

### 1. Silent Failures

All extraction and database operations are wrapped in try-catch blocks:

- Errors are logged with `console.debug()` only (not `console.error()`)
- No red LogBox errors shown to user
- Chat continues normally even if extraction fails

### 2. Safe Defaults

If any field is missing or invalid:

```typescript
{
  summary_update: "",
  open_loops: [],
  current_goal: "",
  last_advice: "",
  next_question: ""
}
```

### 3. Validation

All fields are validated before use:

- `summary_update`: Must be string
- `open_loops`: Must be array, max 8 items
- `current_goal`: Must be string
- `last_advice`: Must be string
- `next_question`: Must be string

## Usage Examples

### Example 1: Continuing from Open Loops

**Previous conversation**:
- User: "My partner never listens to me."
- AI: "That sounds frustrating. Have you tried expressing how this makes you feel?"
- User: "Not really, I don't know how to bring it up."

**Continuity stored**:
```json
{
  "summary_update": "User feels unheard by partner. Wants to address it but worried about conflict.",
  "open_loops": [
    "How to bring up the issue without fighting",
    "What to say to partner",
    "When to have the conversation"
  ],
  "current_goal": "Find a way to talk to partner about feeling unheard",
  "last_advice": "• Consider expressing how their behavior makes you feel\n• Choose a calm moment for the conversation",
  "next_question": "What usually happens when you try to bring up something that's bothering you?"
}
```

**Next session**:
- User: "Hey, I'm back."
- AI: "Welcome back! Last time we were talking about how to bring up feeling unheard with your partner. What usually happens when you try to bring up something that's bothering you?"

### Example 2: User Changes Topic

**Previous conversation**:
- Continuity stored about work stress

**Next session**:
- User: "I need to talk about my mom."
- AI: "Of course, I'm here to listen. What's going on with your mom?" (AI recognizes topic change and adapts)

## Testing

### Manual Testing

1. **Start a conversation** with a person/topic
2. **Have a meaningful exchange** (at least 2-3 messages)
3. **Close the app** or navigate away
4. **Return to the conversation**
5. **Verify**: AI should reference previous conversation naturally

### Database Verification

```sql
-- Check continuity data for a specific person
SELECT 
  summary,
  open_loops,
  current_goal,
  last_advice,
  next_question,
  updated_at
FROM person_chat_summaries
WHERE user_id = 'YOUR_USER_ID'
  AND person_id = 'YOUR_PERSON_ID';
```

### Edge Function Testing

```bash
# Test extract-memories function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/extract-memories \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personName": "Test Person",
    "recentUserMessages": [
      "I need help with my relationship",
      "My partner never listens to me"
    ],
    "lastAssistantMessage": "That sounds frustrating. Have you tried expressing how this makes you feel?",
    "existingMemories": []
  }'
```

## Performance Considerations

### Extraction Frequency

Continuity is extracted:
- After every AI response
- Only if there are at least 2 user messages (meaningful conversation)
- In the background (non-blocking)

### OpenAI Costs

- Memory extraction: ~500 tokens per call
- Continuity extraction: ~300 tokens per call
- Total: ~800 tokens per conversation turn
- Model: gpt-3.5-turbo (cost-effective)

### Database Impact

- One upsert per conversation turn
- Minimal storage (text fields + small jsonb array)
- Indexed on `(user_id, person_id)` for fast lookups

## Troubleshooting

### Issue: Continuity not appearing in AI responses

**Check**:
1. Verify database has continuity data: `SELECT * FROM person_chat_summaries WHERE person_id = 'XXX'`
2. Check Edge Function logs for extraction errors
3. Verify OpenAI API key is set in Supabase

### Issue: Open loops growing too large

**Solution**: The system automatically limits to 8 items. If you need to adjust:

```typescript
// In lib/memory/personSummary.ts
const mergedLoops = Array.from(
  new Set([...existing.open_loops, ...continuityUpdate.open_loops])
).slice(0, 8); // Change this number
```

### Issue: AI not following continuity instructions

**Solution**: The continuity section is prominently placed in the system prompt. If AI still ignores it:

1. Check that continuity data is actually being fetched
2. Verify the prompt injection in `generate-ai-response/index.ts`
3. Consider increasing the prominence of the continuity section

## Future Enhancements

### Potential Improvements

1. **Emotional State Tracking**: Add `emotional_state_trend` field (optional, neutral wording)
2. **Conversation Milestones**: Track major breakthroughs or decisions
3. **Long-term Goals**: Separate from `current_goal` for multi-session tracking
4. **Continuity Decay**: Gradually reduce weight of old open loops
5. **User Control**: Allow users to view/edit continuity data

### Migration Path

To add emotional state tracking:

```sql
ALTER TABLE public.person_chat_summaries
ADD COLUMN IF NOT EXISTS emotional_state_trend text DEFAULT '';
```

Then update extraction prompt and interfaces accordingly.

## Summary

✅ **Database**: Added `current_goal` and `last_advice` columns
✅ **Edge Function**: Updated to extract continuity data
✅ **Client Code**: Updated to save and use continuity
✅ **AI Prompt**: Injects continuity with clear instructions
✅ **Failsafe**: Silent failures, safe defaults, validation
✅ **Testing**: Manual and automated testing paths

The AI can now continue conversations naturally across sessions! 🎉
