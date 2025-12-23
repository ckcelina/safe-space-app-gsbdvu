
# Conversation Continuity - Troubleshooting Guide

## Common Issues & Solutions

### 1. AI Doesn't Remember Previous Conversations

**Symptoms:**
- AI acts like it's the first conversation
- No context from previous chats
- Doesn't follow up on unresolved topics

**Diagnosis:**
```sql
-- Check if continuity exists
SELECT * FROM person_chat_summaries 
WHERE user_id = 'your-user-id' 
AND person_id = 'your-person-id';
```

**Possible Causes:**

#### A. Continuity Not Being Written
**Check:** Look for logs in chat.tsx
```
[Chat] Updating conversation continuity...
[Chat] Continuity updated successfully
```

**Solution:** Verify memory extraction is running:
```typescript
// In chat.tsx, after AI reply
const extractionResult = await extractMemories({...});
if (extractionResult.continuity) {
  await upsertPersonContinuity(userId, personId, extractionResult.continuity);
}
```

#### B. Edge Function Not Fetching Continuity
**Check:** Look for logs in Edge Function
```
[Edge] Error fetching person continuity: ...
```

**Solution:** Verify database connection and RLS policies:
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'person_chat_summaries';
```

#### C. Empty Continuity Data
**Check:** Database has empty values
```sql
SELECT summary, open_loops, next_question 
FROM person_chat_summaries 
WHERE user_id = 'your-user-id';
```

**Solution:** Have a longer conversation to build up continuity

---

### 2. Memory Extraction Failing Silently

**Symptoms:**
- No continuity updates
- No new memories being stored
- No errors visible to user

**Diagnosis:**
```typescript
// Check browser console for debug logs
// Look for: [Memory Extraction] ...
```

**Possible Causes:**

#### A. OpenAI API Key Missing
**Check:** Edge Function environment variables
```bash
# In Supabase dashboard, check Edge Function secrets
OPENAI_API_KEY=sk-...
```

**Solution:** Add/update OPENAI_API_KEY in Supabase dashboard

#### B. Edge Function Returning Error
**Check:** Edge Function logs
```
[Memory Extraction] Edge Function returned error (silent): ...
```

**Solution:** Check `extract-memories` function logs in Supabase dashboard

#### C. Invalid Response Format
**Check:** Console logs for validation errors
```
[Memory Extraction] Invalid response type (silent)
```

**Solution:** Verify Edge Function is returning correct format:
```typescript
{
  memories: [],
  mentioned_keys: [],
  continuity: {
    summary_update: "",
    open_loops: [],
    next_question: ""
  },
  error: null
}
```

---

### 3. Open Loops Keep Growing

**Symptoms:**
- Open loops array has more than 8 items
- Old loops never get removed
- Database shows large open_loops array

**Diagnosis:**
```sql
SELECT 
  person_id,
  jsonb_array_length(open_loops) as loop_count,
  open_loops
FROM person_chat_summaries
WHERE user_id = 'your-user-id';
```

**Solution:**
The merge logic should automatically limit to 8:
```typescript
// In personSummary.ts
const mergedLoops = Array.from(
  new Set([...existing.open_loops, ...continuityUpdate.open_loops])
).slice(0, 8);
```

**Manual Fix:**
```sql
-- Manually trim to 8 loops
UPDATE person_chat_summaries
SET open_loops = (
  SELECT jsonb_agg(value)
  FROM (
    SELECT value 
    FROM jsonb_array_elements(open_loops)
    LIMIT 8
  ) sub
)
WHERE user_id = 'your-user-id';
```

---

### 4. Summary Too Long or Too Short

**Symptoms:**
- Summary is multiple paragraphs (too long)
- Summary is empty or one word (too short)

**Diagnosis:**
```sql
SELECT 
  person_id,
  length(summary) as summary_length,
  summary
FROM person_chat_summaries
WHERE user_id = 'your-user-id';
```

**Solution:**
The extraction prompt instructs OpenAI to keep summaries compact (5-8 bullets).
If this isn't working:

1. Check extraction prompt in `extract-memories/index.ts`
2. Verify OpenAI is using correct model (gpt-3.5-turbo)
3. Consider adjusting temperature (currently 0.1)

**Manual Fix:**
```sql
-- Clear overly long summary
UPDATE person_chat_summaries
SET summary = ''
WHERE user_id = 'your-user-id'
AND length(summary) > 1000;
```

---

### 5. Grief-Aware Mode Not Activating

**Symptoms:**
- Person is deceased but AI tone is normal
- No grief-aware prompt injection
- Missing compassionate language

**Diagnosis:**
```sql
-- Check if is_deceased memory exists
SELECT * FROM person_memories
WHERE user_id = 'your-user-id'
AND person_id = 'your-person-id'
AND key = 'is_deceased';
```

**Solution:**
Ensure the memory exists:
```sql
-- Manually add is_deceased memory if needed
INSERT INTO person_memories (
  user_id, person_id, category, key, value, importance, confidence
) VALUES (
  'your-user-id', 
  'your-person-id', 
  'loss_grief', 
  'is_deceased', 
  'true', 
  5, 
  5
);
```

**Verify in Edge Function:**
```typescript
// In generate-ai-response/index.ts
const isDeceased = memories.some((m: any) => 
  m.key === 'is_deceased' && m.value === 'true'
);
if (isDeceased) {
  basePrompt += `\n\n⚠️ GRIEF-AWARE MODE: ...`;
}
```

---

### 6. Continuity Not Updating After Conversations

**Symptoms:**
- `updated_at` timestamp is old
- Summary doesn't reflect recent conversations
- Open loops are stale

**Diagnosis:**
```sql
SELECT 
  person_id,
  summary,
  updated_at,
  NOW() - updated_at as age
FROM person_chat_summaries
WHERE user_id = 'your-user-id'
ORDER BY updated_at DESC;
```

**Possible Causes:**

#### A. Memory Extraction Not Running
**Check:** Console logs after sending message
```
[Chat] Triggering memory extraction and continuity update...
[Chat] Memory extraction complete
[Chat] Updating conversation continuity...
```

**Solution:** Verify extraction is called in chat.tsx after AI reply

#### B. Upsert Failing Silently
**Check:** Console debug logs
```
[PersonSummary] Error upserting continuity: ...
```

**Solution:** Check database permissions and RLS policies

#### C. Trigger Not Firing
**Check:** Database trigger exists
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'update_person_chat_summaries_updated_at';
```

**Solution:** Recreate trigger if missing:
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_person_chat_summaries_updated_at
    BEFORE UPDATE ON public.person_chat_summaries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

---

### 7. Database Performance Issues

**Symptoms:**
- Slow continuity fetches
- Timeouts on upserts
- High database load

**Diagnosis:**
```sql
-- Check table size
SELECT 
  pg_size_pretty(pg_total_relation_size('person_chat_summaries')) as total_size,
  COUNT(*) as row_count
FROM person_chat_summaries;

-- Check for missing indexes
SELECT * FROM pg_indexes 
WHERE tablename = 'person_chat_summaries';
```

**Solution:**
Add indexes if missing:
```sql
CREATE INDEX IF NOT EXISTS person_chat_summaries_user_id_person_id_idx 
ON person_chat_summaries (user_id, person_id);

CREATE INDEX IF NOT EXISTS person_chat_summaries_updated_at_idx 
ON person_chat_summaries (updated_at);
```

**Cleanup old data:**
```sql
-- Delete continuity older than 90 days
DELETE FROM person_chat_summaries 
WHERE updated_at < NOW() - INTERVAL '90 days';
```

---

### 8. RLS Policy Issues

**Symptoms:**
- "permission denied" errors
- Can't read/write continuity
- Works in Supabase dashboard but not in app

**Diagnosis:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'person_chat_summaries';

-- Test policy
SET ROLE authenticated;
SET request.jwt.claims.sub = 'your-user-id';
SELECT * FROM person_chat_summaries;
```

**Solution:**
Recreate RLS policies:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for users based on user_id" 
ON person_chat_summaries;
DROP POLICY IF EXISTS "Enable insert access for users based on user_id" 
ON person_chat_summaries;
DROP POLICY IF EXISTS "Enable update access for users based on user_id" 
ON person_chat_summaries;
DROP POLICY IF EXISTS "Enable delete access for users based on user_id" 
ON person_chat_summaries;

-- Recreate policies
CREATE POLICY "Enable read access for users based on user_id" 
ON person_chat_summaries FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Enable insert access for users based on user_id" 
ON person_chat_summaries FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update access for users based on user_id" 
ON person_chat_summaries FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete access for users based on user_id" 
ON person_chat_summaries FOR DELETE 
USING (user_id = auth.uid());
```

---

## Debugging Tools

### 1. Check Continuity Status
```sql
SELECT 
  p.name as person_name,
  pcs.summary,
  jsonb_array_length(pcs.open_loops) as loop_count,
  pcs.next_question,
  pcs.updated_at,
  NOW() - pcs.updated_at as age
FROM person_chat_summaries pcs
JOIN persons p ON p.id = pcs.person_id
WHERE pcs.user_id = 'your-user-id'
ORDER BY pcs.updated_at DESC;
```

### 2. View Recent Memory Extractions
```typescript
// In browser console after sending message
// Look for these logs:
[Chat] Triggering memory extraction and continuity update...
[Memory Extraction] Starting extraction for person: ...
[Memory Extraction] Parsed result: { memoriesCount: X, ... }
[Chat] Updating conversation continuity...
[PersonSummary] Continuity updated successfully
```

### 3. Test Edge Function Directly
```bash
# Using curl
curl -X POST https://your-project.supabase.co/functions/v1/extract-memories \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personName": "Test Person",
    "recentUserMessages": ["I talked to him about work today"],
    "lastAssistantMessage": "How did that conversation go?",
    "existingMemories": []
  }'
```

### 4. Monitor Edge Function Logs
```bash
# In Supabase dashboard:
# Edge Functions → generate-ai-response → Logs
# Look for:
[Edge] Error fetching person continuity: ...
[Edge] Exception in getPersonContinuity: ...
```

---

## Emergency Fixes

### Reset All Continuity for a User
```sql
DELETE FROM person_chat_summaries 
WHERE user_id = 'your-user-id';
```

### Reset Continuity for One Person
```sql
DELETE FROM person_chat_summaries 
WHERE user_id = 'your-user-id' 
AND person_id = 'your-person-id';
```

### Clear Only Open Loops
```sql
UPDATE person_chat_summaries
SET open_loops = '[]'::jsonb
WHERE user_id = 'your-user-id';
```

### Clear Only Summary
```sql
UPDATE person_chat_summaries
SET summary = ''
WHERE user_id = 'your-user-id';
```

---

## Getting Help

If issues persist:

1. **Check logs:** Browser console + Edge Function logs
2. **Verify database:** Run diagnostic queries above
3. **Test manually:** Use SQL queries to test continuity
4. **Review code:** Check recent changes to continuity files
5. **Check dependencies:** Verify Supabase client version

**Key Files to Review:**
- `lib/memory/personSummary.ts`
- `supabase/functions/generate-ai-response/index.ts`
- `supabase/functions/extract-memories/index.ts`
- `app/(tabs)/(home)/chat.tsx`
