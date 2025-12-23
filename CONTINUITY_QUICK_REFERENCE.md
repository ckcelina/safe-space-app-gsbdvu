
# Conversation Continuity - Quick Reference

## What It Does
Allows Safe Space AI to remember and continue conversations naturally per person/topic.

## Data Structure

### Database Table: `person_chat_summaries`
```sql
CREATE TABLE person_chat_summaries (
  user_id uuid,
  person_id uuid,
  summary text DEFAULT '',
  open_loops jsonb DEFAULT '[]',
  next_question text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, person_id)
);
```

### Continuity Object
```typescript
{
  summary: string,           // Rolling summary (5-8 bullets)
  open_loops: string[],      // Unresolved topics (max 8)
  next_question: string      // Suggested follow-up
}
```

## Key Functions

### Fetch Continuity
```typescript
import { getPersonContinuity } from '@/lib/memory/personSummary';

const continuity = await getPersonContinuity(userId, personId);
// Returns: { summary: string, open_loops: string[], next_question: string }
```

### Update Continuity
```typescript
import { upsertPersonContinuity } from '@/lib/memory/personSummary';

await upsertPersonContinuity(userId, personId, {
  summary_update: "User discussed work stress and relationship issues",
  open_loops: ["work deadline concerns", "partner communication"],
  next_question: "How did the conversation with your partner go?"
});
```

## Flow

### 1. Before AI Reply (Read)
```
User Message → Edge Function → Fetch Continuity → Inject into Prompt → OpenAI → Reply
```

### 2. After AI Reply (Write)
```
Reply Sent → Extract Memories → Extract Continuity → Update Database
```

## System Prompt Injection

Continuity is injected into the OpenAI system prompt as:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION CONTINUITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary of recent conversations:
{summary}

Open loops (unresolved topics/questions):
1. {loop1}
2. {loop2}

Suggested follow-up: {next_question}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Memory Extraction Response

The `extract-memories` Edge Function returns:

```typescript
{
  memories: [
    { category, key, value, importance, confidence }
  ],
  mentioned_keys: ["key1", "key2"],
  continuity: {
    summary_update: "Brief summary of what was discussed",
    open_loops: ["unresolved topic 1", "unresolved topic 2"],
    next_question: "A relevant follow-up question"
  },
  error: null | string
}
```

## Merging Logic

### Summary
- **Strategy:** Replace
- **Rule:** Latest summary replaces old one
- **Max:** 5-8 bullets

### Open Loops
- **Strategy:** Merge + Deduplicate
- **Rule:** Combine existing + new, remove duplicates
- **Max:** 8 loops

### Next Question
- **Strategy:** Replace
- **Rule:** Latest question replaces old one

## Special Cases

### Grief-Aware Mode
If `is_deceased` memory exists:
- AI tone becomes more compassionate
- Focus on grief support
- Honor memories of deceased

### Empty Continuity
If no continuity exists:
- Returns empty defaults
- AI starts fresh conversation
- No errors thrown

## Error Handling

All operations are fail-safe:
- Fetch fails → Returns empty defaults
- Update fails → Logs silently, doesn't crash
- Extraction fails → Returns empty continuity

## Testing

### Manual Test
1. Have a conversation about a person
2. Mention an unresolved issue
3. End conversation
4. Start new conversation
5. AI should remember and follow up

### Database Check
```sql
SELECT * FROM person_chat_summaries 
WHERE user_id = 'your-user-id';
```

### Expected Output
```json
{
  "user_id": "uuid",
  "person_id": "uuid",
  "summary": "User discussed work stress...",
  "open_loops": ["work deadline", "partner communication"],
  "next_question": "How did the meeting go?",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Common Issues

### Issue: AI doesn't remember context
**Solution:** Check if continuity is being written to database

### Issue: Open loops keep growing
**Solution:** Max 8 enforced automatically, oldest removed

### Issue: Summary too long
**Solution:** OpenAI instructed to keep 5-8 bullets max

### Issue: Continuity not updating
**Solution:** Check memory extraction is running after replies

## Performance

- **Fetch:** ~10-20ms (single DB query)
- **Update:** ~20-30ms (single upsert)
- **Impact:** None on chat latency (updates after reply)

## Privacy

- Only stores explicitly stated information
- No assumptions or inferences
- User can delete person to clear continuity
- RLS enforces user_id = auth.uid()

## Maintenance

### Clear Old Continuity
```sql
DELETE FROM person_chat_summaries 
WHERE updated_at < NOW() - INTERVAL '90 days';
```

### View All Continuity
```sql
SELECT 
  p.name,
  pcs.summary,
  pcs.open_loops,
  pcs.next_question,
  pcs.updated_at
FROM person_chat_summaries pcs
JOIN persons p ON p.id = pcs.person_id
WHERE pcs.user_id = 'your-user-id'
ORDER BY pcs.updated_at DESC;
```

## Integration Points

### Files That Use Continuity
1. `supabase/functions/generate-ai-response/index.ts` - Reads continuity
2. `app/(tabs)/(home)/chat.tsx` - Writes continuity
3. `lib/memory/personSummary.ts` - Manages continuity
4. `supabase/functions/extract-memories/index.ts` - Extracts continuity

### Dependencies
- Supabase client
- OpenAI API (for extraction)
- person_memories table (for grief-aware mode)
- messages table (for conversation history)

## Best Practices

1. **Keep summaries concise** - 5-8 bullets max
2. **Limit open loops** - Max 8, prioritize important ones
3. **Update regularly** - After each conversation
4. **Handle errors gracefully** - Never crash chat flow
5. **Respect privacy** - Only store what's explicitly shared
6. **Be grief-aware** - Check for deceased status
7. **Test thoroughly** - Verify continuity updates correctly
