
# Conversation Continuity Memory - Troubleshooting Guide

## Common Issues

### 1. AI Doesn't Remember Previous Conversation

**Symptoms**:
- AI greets you as if it's the first time
- No reference to previous topics
- Doesn't ask follow-up questions

**Diagnosis Steps**:

1. **Check if continuity data exists**:
```sql
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

2. **Check extraction logs**:
```javascript
// In app, look for console logs:
[Memory Extraction] Starting extraction...
[Memory Extraction] Continuity extracted
```

3. **Check Edge Function logs**:
- Go to Supabase Dashboard → Edge Functions → extract-memories
- Look for recent invocations
- Check for errors

**Solutions**:

- **No data in database**: Extraction may be failing. Check OpenAI API key.
- **Data exists but AI doesn't use it**: Check `generate-ai-response` function is fetching continuity.
- **Extraction logs show errors**: Check OpenAI API key and quota.

### 2. Extraction Failing Silently

**Symptoms**:
- No continuity data in database
- Console shows `[Memory Extraction] Invoke failed silently`
- Chat works but no memory

**Diagnosis Steps**:

1. **Check OpenAI API key**:
```bash
# In Supabase Dashboard → Project Settings → Edge Functions
# Verify OPENAI_API_KEY is set
```

2. **Test Edge Function directly**:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/extract-memories \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personName": "Test",
    "recentUserMessages": ["Hello", "How are you?"],
    "existingMemories": []
  }'
```

3. **Check response**:
```json
{
  "error": "missing_openai_key",  // ← Problem!
  "debug": {
    "missing_env": true,
    "reason": "OPENAI_API_KEY not set"
  }
}
```

**Solutions**:

- **Missing API key**: Set in Supabase Dashboard → Edge Functions → Secrets
- **Invalid API key**: Verify key is correct and has quota
- **Network issues**: Check Supabase status page

### 3. Open Loops Growing Too Large

**Symptoms**:
- `open_loops` array has many items
- AI prompt getting too long
- Extraction taking longer

**Diagnosis**:

```sql
SELECT 
  jsonb_array_length(open_loops) as loop_count,
  open_loops
FROM person_chat_summaries
WHERE user_id = 'YOUR_USER_ID'
ORDER BY loop_count DESC
LIMIT 10;
```

**Solutions**:

1. **Reduce max loops** (currently 8):
```typescript
// In lib/memory/personSummary.ts
const mergedLoops = Array.from(
  new Set([...existing.open_loops, ...continuityUpdate.open_loops])
).slice(0, 6); // Reduce from 8 to 6
```

2. **Clear old loops manually**:
```sql
UPDATE person_chat_summaries
SET open_loops = '[]'::jsonb
WHERE user_id = 'YOUR_USER_ID'
  AND person_id = 'YOUR_PERSON_ID';
```

### 4. AI Ignoring Continuity Instructions

**Symptoms**:
- Continuity data exists
- AI doesn't reference it
- Starts fresh each time

**Diagnosis**:

1. **Check prompt injection**:
```typescript
// In generate-ai-response/index.ts
// Verify continuity section is being added to system prompt
console.log('Continuity:', continuity);
```

2. **Check continuity data quality**:
```sql
SELECT 
  summary,
  next_question
FROM person_chat_summaries
WHERE user_id = 'YOUR_USER_ID'
  AND person_id = 'YOUR_PERSON_ID';
```

**Solutions**:

- **Empty fields**: Extraction may not be working. Check logs.
- **Prompt too long**: OpenAI may be truncating. Reduce max_tokens or shorten other sections.
- **Tone overriding continuity**: Adjust prompt order in `buildSystemPrompt()`.

### 5. Continuity Data Not Updating

**Symptoms**:
- Old continuity data persists
- New conversations don't update summary
- `updated_at` timestamp is old

**Diagnosis**:

1. **Check upsert calls**:
```typescript
// In chat.tsx, look for:
[PersonSummary] Continuity updated successfully
```

2. **Check database permissions**:
```sql
-- Verify RLS policies allow updates
SELECT * FROM pg_policies 
WHERE tablename = 'person_chat_summaries';
```

**Solutions**:

- **No update logs**: `upsertPersonContinuity()` may be failing silently. Check console.debug logs.
- **RLS blocking**: Verify user has update permission on their own rows.
- **Extraction not running**: Check if `extractMemories()` is being called in chat.tsx.

### 6. Performance Issues

**Symptoms**:
- Chat feels slow after sending message
- Long delay before AI response
- High OpenAI costs

**Diagnosis**:

1. **Check extraction timing**:
```typescript
// Add timing logs in extractMemories.ts
const start = Date.now();
// ... extraction code ...
console.log(`Extraction took ${Date.now() - start}ms`);
```

2. **Check OpenAI usage**:
- Go to OpenAI Dashboard → Usage
- Look for high token counts

**Solutions**:

- **Extraction blocking chat**: Ensure it's fire-and-forget (already implemented).
- **Too many messages sent to OpenAI**: Reduce `recentUserMessages` slice in chat.tsx.
- **High costs**: Consider extracting less frequently (e.g., every 3 messages instead of every message).

### 7. Continuity Data Corrupted

**Symptoms**:
- `open_loops` is not an array
- Fields have wrong types
- Database errors

**Diagnosis**:

```sql
-- Check data types
SELECT 
  pg_typeof(open_loops) as loops_type,
  pg_typeof(summary) as summary_type,
  open_loops,
  summary
FROM person_chat_summaries
WHERE user_id = 'YOUR_USER_ID'
LIMIT 5;
```

**Solutions**:

1. **Fix corrupted data**:
```sql
-- Reset to safe defaults
UPDATE person_chat_summaries
SET 
  open_loops = '[]'::jsonb,
  summary = '',
  current_goal = '',
  last_advice = '',
  next_question = ''
WHERE user_id = 'YOUR_USER_ID'
  AND person_id = 'YOUR_PERSON_ID';
```

2. **Prevent future corruption**:
- Ensure validation in `upsertPersonContinuity()`
- Check Edge Function response validation

## Debug Checklist

When troubleshooting, check these in order:

- [ ] OpenAI API key is set in Supabase
- [ ] Edge Function `extract-memories` is deployed
- [ ] Edge Function `generate-ai-response` is deployed
- [ ] Database table `person_chat_summaries` exists
- [ ] RLS policies allow user to read/write their own rows
- [ ] Console logs show extraction starting
- [ ] Console logs show extraction completing
- [ ] Database has continuity data for the person
- [ ] AI prompt includes continuity section
- [ ] OpenAI has sufficient quota

## Logging Guide

### Enable Detailed Logging

1. **Client-side** (temporary):
```typescript
// In lib/memory/extractMemories.ts
// Change console.debug to console.log
console.log('[Memory Extraction] Starting extraction...');
```

2. **Edge Function**:
```typescript
// In extract-memories/index.ts
// Logs are already verbose, check Supabase dashboard
```

### Log Locations

- **Client logs**: React Native debugger or browser console
- **Edge Function logs**: Supabase Dashboard → Edge Functions → Logs
- **Database logs**: Supabase Dashboard → Database → Logs

## Emergency Fixes

### Reset All Continuity Data

```sql
-- Clear all continuity data for a user
UPDATE person_chat_summaries
SET 
  summary = '',
  open_loops = '[]'::jsonb,
  current_goal = '',
  last_advice = '',
  next_question = '',
  updated_at = now()
WHERE user_id = 'YOUR_USER_ID';
```

### Disable Continuity Temporarily

```typescript
// In chat.tsx, comment out the continuity update:
/*
if (extractionResult.continuity) {
  await upsertPersonContinuity(userId, personId, extractionResult.continuity);
}
*/
```

### Force Re-extraction

```typescript
// In chat.tsx, force extraction even with few messages:
if (recentUserMessages.length >= 1) { // Changed from 2
  // Extract continuity
}
```

## Getting Help

If issues persist:

1. **Collect logs**:
   - Client console logs
   - Edge Function logs
   - Database query results

2. **Check documentation**:
   - `CONTINUITY_MEMORY_IMPLEMENTATION.md`
   - `CONTINUITY_QUICK_REFERENCE.md`

3. **Test in isolation**:
   - Test Edge Function with curl
   - Test database queries directly
   - Test with a fresh person/topic

4. **Verify environment**:
   - OpenAI API key is valid
   - Supabase project is active
   - No rate limits hit

## Prevention

### Best Practices

1. **Monitor OpenAI usage**: Set up alerts for high token usage
2. **Regular database checks**: Verify continuity data quality
3. **Test after deployments**: Ensure Edge Functions are working
4. **Keep logs clean**: Use console.debug for non-critical logs
5. **Validate inputs**: Always check data types before saving

### Health Check Query

Run this weekly to check system health:

```sql
-- Check continuity data health
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN summary != '' THEN 1 END) as with_summary,
  COUNT(CASE WHEN jsonb_array_length(open_loops) > 0 THEN 1 END) as with_loops,
  COUNT(CASE WHEN next_question != '' THEN 1 END) as with_next_question,
  AVG(jsonb_array_length(open_loops)) as avg_loop_count,
  MAX(updated_at) as last_update
FROM person_chat_summaries
WHERE user_id = 'YOUR_USER_ID';
```

Expected results:
- `with_summary` should be high (>80%)
- `avg_loop_count` should be 2-5
- `last_update` should be recent

## Summary

Most issues are caused by:
1. Missing or invalid OpenAI API key
2. Edge Function not deployed
3. RLS policies blocking access
4. Extraction failing silently

Always check logs first, then database, then Edge Functions.
