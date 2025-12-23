
# Memory Extraction - Quick Reference

## How to Deploy

```bash
# 1. Deploy the Edge Function
supabase functions deploy extract-memories

# 2. Verify OPENAI_API_KEY is set
supabase secrets list

# 3. Test the function
supabase functions invoke extract-memories --body '{"personName":"Test","recentUserMessages":["He works at Google"],"existingMemories":[]}'
```

## How It Works

### Trigger Point
Memory extraction is triggered in `app/(tabs)/(home)/chat.tsx` after the AI reply is successfully generated:

```typescript
// After AI reply is inserted...
extractMemoriesAsync({
  personName,
  recentUserMessages: userMessages,
  lastAssistantMessage: replyText,
  existingMemories,
  userId,
  personId,
});
```

### Extraction Flow
1. **Client** → Calls `extractMemoriesAsync()` (fire-and-forget)
2. **Client** → Calls Supabase Edge Function `extract-memories`
3. **Edge Function** → Calls OpenAI with extraction prompt
4. **Edge Function** → Returns structured JSON
5. **Client** → Upserts memories to `person_memories` table
6. **Client** → Updates `last_mentioned_at` for mentioned keys

## Memory Structure

```typescript
{
  category: string;      // identity, relationship, history, preferences, etc.
  key: string;          // snake_case identifier (e.g., "occupation")
  value: string;        // The actual fact (max ~180 chars)
  importance: number;   // 1-5 (how important)
  confidence: number;   // 1-5 (how confident)
}
```

## Categories

| Category | Examples |
|----------|----------|
| `identity` | age, occupation, location, name |
| `relationship` | married for 5 years, childhood friend |
| `history` | grew up in Boston, went to MIT |
| `preferences` | loves hiking, hates spicy food |
| `boundaries` | doesn't like being called after 9pm |
| `loss_grief` | is_deceased, time_of_death |
| `conflict_patterns` | gets defensive when criticized |
| `goals` | wants to start a business |
| `context` | other relevant stable facts |

## Special Cases

### Deceased Person
If user says "he passed away" or similar:
```json
{
  "category": "loss_grief",
  "key": "is_deceased",
  "value": "true",
  "importance": 5,
  "confidence": 5
}
```

### Mentioned Keys
If user mentions existing memory without adding new info:
```json
{
  "memories": [],
  "mentioned_keys": ["occupation", "favorite_hobby"]
}
```
This updates `last_mentioned_at` timestamp.

## Debugging

### Check Extraction Logs
```typescript
// In browser console or React Native debugger:
// Look for these logs:
[Chat] Triggering memory extraction...
[Memory Extraction] Starting extraction for person: John
[Memory Extraction] Upserting 2 memories
[Memory Extraction] Extraction complete
```

### Check Database
```sql
-- View all memories for a person
SELECT * FROM person_memories 
WHERE user_id = 'user-uuid' 
  AND person_id = 'person-uuid'
ORDER BY importance DESC, updated_at DESC;

-- View recently mentioned memories
SELECT * FROM person_memories 
WHERE user_id = 'user-uuid' 
  AND person_id = 'person-uuid'
  AND last_mentioned_at IS NOT NULL
ORDER BY last_mentioned_at DESC;
```

### Check Edge Function Logs
```bash
# View recent logs
supabase functions logs extract-memories

# Follow logs in real-time
supabase functions logs extract-memories --follow
```

## Common Issues

### Issue: No memories being extracted
**Check**:
1. Is Edge Function deployed? `supabase functions list`
2. Is OPENAI_API_KEY set? `supabase secrets list`
3. Are there console errors? Check browser/RN debugger
4. Is OpenAI API working? Check Edge Function logs

### Issue: Extraction is slow
**Solution**: This is expected and intentional. Extraction runs in background and doesn't block chat.

### Issue: Wrong facts being extracted
**Solution**: The extraction prompt is conservative. If it's extracting too much or too little, adjust the system prompt in `supabase/functions/extract-memories/index.ts`.

### Issue: Duplicate memories
**Solution**: The upsert uses `(user_id, person_id, key)` as unique constraint. Same key will update, not duplicate.

## Testing Checklist

- [ ] Deploy Edge Function
- [ ] Verify OPENAI_API_KEY is set
- [ ] Start a chat with a person
- [ ] Send message with a fact (e.g., "She's a teacher")
- [ ] Check console for extraction logs
- [ ] Query `person_memories` table
- [ ] Verify memory was stored
- [ ] Send another message mentioning the fact
- [ ] Verify `last_mentioned_at` was updated
- [ ] Test deceased detection ("He passed away")
- [ ] Verify `is_deceased` memory is created

## Performance

- **Extraction time**: ~1-3 seconds (runs in background)
- **Impact on chat**: None (fire-and-forget)
- **OpenAI cost**: ~$0.0001-0.0005 per extraction (GPT-3.5-turbo)
- **Database writes**: 1-5 rows per extraction (typically)

## Security

- ✅ OpenAI API key is stored in Supabase secrets (not in client)
- ✅ Edge Function validates user authentication
- ✅ RLS policies enforce user_id = auth.uid()
- ✅ No sensitive data is logged

## Next Steps

1. **Deploy**: Run `supabase functions deploy extract-memories`
2. **Test**: Send a few messages and verify extraction
3. **Monitor**: Check logs for any errors
4. **Iterate**: Adjust extraction prompt if needed
