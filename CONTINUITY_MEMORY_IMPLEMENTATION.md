
# Conversation Continuity Memory Implementation

## Overview
Added conversation continuity memory to Safe Space, allowing the AI to naturally continue conversations per person/topic without changing the existing chat storage system.

## What Was Implemented

### 1. Database Changes
**Migration Applied:** `add_continuity_columns_to_person_chat_summaries`

Added two new columns to the existing `person_chat_summaries` table:
- `open_loops` (JSONB): Array of unresolved topics/questions (max 8)
- `next_question` (TEXT): Suggested next question for conversation continuity

The table now stores:
- `summary`: Short rolling summary (5-8 bullets max)
- `open_loops`: Unresolved topics/questions
- `next_question`: Suggested follow-up question
- `updated_at`: Timestamp (auto-updated via trigger)

**RLS Policies:** Already in place - `user_id = auth.uid()` for all operations

### 2. Library Updates

#### `lib/memory/personSummary.ts`
Added new functions for continuity management:

**New Functions:**
- `getPersonContinuity(userId, personId)`: Fetches full continuity data (summary, open_loops, next_question)
- `upsertPersonContinuity(userId, personId, continuityUpdate)`: Updates continuity with smart merging
  - Replaces summary with latest
  - Merges open_loops (deduplicates, keeps max 8)
  - Updates next_question

**Existing Functions (Deprecated but maintained for compatibility):**
- `getPersonSummary()`: Still works, returns only summary
- `upsertPersonSummary()`: Still works, updates only summary

### 3. Edge Function Updates

#### `supabase/functions/generate-ai-response/index.ts`
**New Function:**
- `getPersonContinuity(supabase, userId, personId)`: Fetches continuity data from database

**System Prompt Enhancement:**
The AI system prompt now includes a "CONVERSATION CONTINUITY" section (ORDER 4) that injects:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION CONTINUITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary of recent conversations:
{summary}

Open loops (unresolved topics/questions):
1. {loop1}
2. {loop2}
...

Suggested follow-up: {next_question}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Grief-Aware Continuity:**
If `is_deceased` memory exists, the system prompt adds:
```
⚠️ GRIEF-AWARE MODE: This person is deceased. Be especially gentle, 
compassionate, and trauma-informed. Focus on supporting the user's 
grief process and honoring their memories.
```

### 4. Chat Flow Updates

#### `app/(tabs)/(home)/chat.tsx`
**Changes:**
- Import `extractMemories` (non-async) instead of `extractMemoriesAsync`
- Import `upsertPersonContinuity` from personSummary
- After AI reply, await memory extraction to get continuity data
- Update continuity in database with extracted data

**Flow:**
1. User sends message
2. AI generates reply (using continuity context from system prompt)
3. Memory extraction runs (extracts memories + continuity)
4. Continuity data is written back to database
5. Next conversation will use updated continuity

### 5. Memory Extraction Updates

#### `supabase/functions/extract-memories/index.ts`
Already updated in previous work to include `continuity` in response:
```typescript
{
  memories: [...],
  mentioned_keys: [...],
  continuity: {
    summary_update: string,
    open_loops: string[],
    next_question: string
  },
  error: null | string
}
```

The extraction prompt instructs OpenAI to:
- Create a compact summary of what was discussed
- Identify unresolved topics/questions
- Suggest a relevant follow-up question

## Data Flow

### Before AI Reply (Read Continuity)
```
1. User sends message
2. Chat.tsx calls Edge Function with message
3. Edge Function fetches continuity data:
   - getPersonContinuity(userId, personId)
4. Continuity injected into system prompt
5. OpenAI generates reply with context
6. Reply sent back to user
```

### After AI Reply (Write Continuity)
```
1. AI reply inserted into messages table
2. Memory extraction triggered:
   - extractMemories() called with recent messages
3. OpenAI extracts:
   - Stable facts (memories)
   - Conversation continuity (summary, loops, next question)
4. Memories upserted to person_memories
5. Continuity upserted to person_chat_summaries:
   - Summary replaced with latest
   - Open loops merged (dedupe, max 8)
   - Next question updated
```

## Key Features

### 1. Rolling Summary
- Compact summary of recent conversations (5-8 bullets max)
- Updated after each conversation
- Helps AI remember what's currently going on

### 2. Open Loops
- Tracks unresolved topics/questions
- Merged and deduplicated (max 8)
- Helps AI follow up on important threads

### 3. Next Question
- AI suggests a relevant follow-up question
- Updated after each conversation
- Helps maintain natural conversation flow

### 4. Grief-Aware Mode
- Automatically detected if person is marked deceased
- Changes AI tone to be more compassionate
- Focuses on grief support and memory honoring

## Prompting Rules

### What Continuity IS:
- Short-term conversation memory
- What's currently being discussed
- Unresolved topics/questions
- Natural conversation flow

### What Continuity IS NOT:
- Long-term factual biography (that's in person_memories)
- Private sensitive info not explicitly stated
- Permanent facts about the person

### Privacy & Safety:
- Only stores what user explicitly shares
- No assumptions or inferences
- Respects user privacy
- Grief-aware for deceased persons

## Testing

### To Test Continuity:
1. Start a conversation about a person
2. Discuss a topic but don't resolve it (e.g., "I'm worried about his job")
3. End the conversation
4. Start a new conversation
5. The AI should remember the context and ask about the unresolved topic

### To Verify Database:
```sql
SELECT * FROM person_chat_summaries 
WHERE user_id = 'your-user-id' 
AND person_id = 'your-person-id';
```

You should see:
- `summary`: Text summary of recent conversations
- `open_loops`: JSON array of unresolved topics
- `next_question`: Suggested follow-up question
- `updated_at`: Recent timestamp

## Error Handling

All continuity operations are fail-safe:
- If continuity fetch fails, returns empty defaults
- If continuity update fails, logs silently (doesn't break chat)
- Memory extraction failures don't affect chat flow
- All errors use `console.debug` (not `console.error`)

## Performance

- Continuity fetch: Single database query (fast)
- Continuity update: Single upsert operation (fast)
- No impact on chat latency (updates happen after reply)
- Memory extraction runs in background

## Future Enhancements

Possible improvements:
1. Add continuity expiration (auto-clear after X days of inactivity)
2. Add continuity versioning (track history of summaries)
3. Add user-facing continuity viewer (show what AI remembers)
4. Add manual continuity editing (let users correct/update)
5. Add continuity export (download conversation summaries)

## Deployment Status

✅ Database migration applied
✅ Library functions updated
✅ Edge Function deployed (version 27)
✅ Chat flow updated
✅ Memory extraction already supports continuity

## Files Changed

1. `lib/memory/personSummary.ts` - Added continuity functions
2. `supabase/functions/generate-ai-response/index.ts` - Added continuity injection
3. `app/(tabs)/(home)/chat.tsx` - Added continuity update after reply
4. Database: `person_chat_summaries` table - Added columns

## No Breaking Changes

- Existing chat storage unchanged
- Existing memory system unchanged
- Backward compatible with old data
- Deprecated functions still work
