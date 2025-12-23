
# Conversation Continuity Memory - Quick Reference

## What It Does

Enables the AI to continue conversations naturally by remembering:
- **Summary**: What you've been talking about
- **Open Loops**: Unresolved questions/topics
- **Current Goal**: What you want to achieve
- **Last Advice**: What the AI suggested
- **Next Question**: Natural follow-up to continue

## How It Works

### Automatic Extraction

After each conversation turn:
1. AI responds to your message
2. System extracts continuity data in background
3. Saves to database (silent if fails)
4. Next time you chat, AI uses this data

### AI Behavior

**With Continuity**:
- "Welcome back! Last time we were talking about [topic]. [Next question]"
- Naturally continues from where you left off
- References open loops and goals

**Without Continuity** (first chat or extraction failed):
- Normal greeting
- Waits for you to start the conversation

### Topic Changes

If you change the topic, AI adapts:
- User: "I need to talk about something else"
- AI: Recognizes change and follows your lead

## Database Schema

```sql
person_chat_summaries (
  user_id uuid,
  person_id uuid,
  summary text,              -- Rolling summary
  open_loops jsonb,          -- Array of unresolved topics (max 8)
  current_goal text,         -- What user wants now
  last_advice text,          -- Last advice given
  next_question text,        -- Suggested follow-up
  updated_at timestamp
)
```

## Key Files

### Client-Side
- `lib/memory/personSummary.ts` - Fetch/save continuity
- `lib/memory/extractMemories.ts` - Extract from conversation
- `app/(tabs)/(home)/chat.tsx` - Integration point

### Server-Side
- `supabase/functions/extract-memories/index.ts` - Extraction logic
- `supabase/functions/generate-ai-response/index.ts` - Prompt injection

## Testing

### Quick Test

1. Start a conversation with a person
2. Have 2-3 meaningful exchanges
3. Close app
4. Reopen and return to same person
5. AI should reference previous conversation

### Database Check

```sql
SELECT * FROM person_chat_summaries 
WHERE user_id = 'YOUR_USER_ID' 
  AND person_id = 'YOUR_PERSON_ID';
```

## Troubleshooting

### AI doesn't remember previous conversation

**Check**:
1. Database has data: `SELECT * FROM person_chat_summaries WHERE person_id = 'XXX'`
2. Edge Function logs for errors
3. OpenAI API key is set

### Open loops growing too large

**Solution**: System limits to 8 automatically. Adjust in `lib/memory/personSummary.ts`:

```typescript
.slice(0, 8) // Change this number
```

### Extraction failing silently

**Check**:
- Console logs (search for "[Memory Extraction]")
- Edge Function logs in Supabase dashboard
- OpenAI API key validity

## Configuration

### Extraction Frequency

Currently extracts after EVERY AI response. To change:

```typescript
// In chat.tsx, modify the condition:
if (recentUserMessages.length >= 2) {
  // Extract continuity
}
```

### Continuity Prompt Position

Continuity is injected in `generate-ai-response/index.ts` after tone contract and before memories. To adjust prominence, move the section in `buildSystemPrompt()`.

## API Response Format

### extract-memories Response

```json
{
  "memories": [...],
  "mentioned_keys": [...],
  "continuity": {
    "summary_update": "Brief summary",
    "open_loops": ["Loop 1", "Loop 2"],
    "current_goal": "User's goal",
    "last_advice": "• Advice 1\n• Advice 2",
    "next_question": "Follow-up question"
  },
  "error": null,
  "debug": null
}
```

### Error Response (still 200 OK)

```json
{
  "memories": [],
  "mentioned_keys": [],
  "continuity": {
    "summary_update": "",
    "open_loops": [],
    "current_goal": "",
    "last_advice": "",
    "next_question": ""
  },
  "error": "openai_failed",
  "debug": {
    "missing_env": false,
    "reason": "Error details"
  }
}
```

## Performance

### OpenAI Costs

- Memory extraction: ~500 tokens
- Continuity extraction: ~300 tokens
- **Total per turn**: ~800 tokens
- **Model**: gpt-3.5-turbo (cost-effective)

### Database Impact

- One upsert per conversation turn
- Minimal storage (~1-2 KB per person)
- Fast lookups (indexed on user_id, person_id)

## Future Enhancements

### Potential Additions

1. **Emotional State Tracking**: Add `emotional_state_trend` field
2. **Conversation Milestones**: Track breakthroughs
3. **Long-term Goals**: Separate from current_goal
4. **User Control**: View/edit continuity data in UI

### Migration Template

```sql
ALTER TABLE public.person_chat_summaries
ADD COLUMN IF NOT EXISTS emotional_state_trend text DEFAULT '';
```

## Support

For issues or questions:
1. Check logs: `[Memory Extraction]` and `[Edge]` prefixes
2. Verify database schema matches expected structure
3. Test Edge Function directly with curl
4. Check Supabase dashboard for Edge Function logs

## Summary

✅ Automatic extraction after each conversation
✅ Silent failures (never blocks chat)
✅ Natural conversation continuity
✅ Respects topic changes
✅ Low cost and fast performance
