
# AI Prompt Audit Report - Safe Space

## Executive Summary

✅ **GOOD NEWS:** Your AI prompt architecture is already correctly structured with a single canonical source.

⚠️ **LIKELY ISSUE:** The Edge Function may not be deployed, or an older version is running.

---

## Audit Results

### 1. Canonical Prompt Location

**✅ PRIMARY SOURCE:** `supabase-edge-function-example.ts`

This file contains the complete, supportive AI personality prompt. This is the ONLY place where the system prompt is defined.

**Prompt Characteristics:**
- Supportive, warm, conversational tone ✅
- Validates feelings first ✅
- Offers 2-4 practical options ✅
- Asks gentle questions when appropriate ✅
- Avoids formal/robotic language ✅
- Includes 3 example responses ✅

### 2. All AI Call Points

All chat entry points correctly call the Edge Function:

| File | Status | Notes |
|------|--------|-------|
| `app/(tabs)/(home)/chat.tsx` | ✅ Correct | Person/Topic chat |
| `app/(tabs)/library/detail.tsx` | ✅ Correct | Library "Ask AI" |
| `lib/aiClient.ts` | ✅ Correct | Helper only, no prompt |
| `src/api/ai.ts` | ✅ Correct | Helper only, no prompt |
| `utils/aiHelpers.ts` | ✅ Correct | Helper only, no prompt |

### 3. No Conflicting Prompts Found

✅ No duplicate system prompts
✅ No fallback prompts that override tone
✅ No cached config overriding prompt
✅ Person chat and Topic chat use the same prompt

---

## Why Tone Might Be Reverting

### Most Likely Causes:

1. **Edge Function Not Deployed**
   - The updated prompt exists in the code but hasn't been deployed to Supabase
   - An older version of the Edge Function is still running

2. **OpenAI API Key Missing**
   - If the API key is not set, the fallback message is used
   - Fallback messages are brief and might seem "blunt"

3. **Caching Issues**
   - Browser or Supabase may be caching old responses
   - Clear cache and redeploy

---

## Solution: Deploy the Edge Function

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link Your Project

```bash
supabase link --project-ref zjzvkxvahrbuuyzjzxol
```

### Step 4: Create Edge Function Directory

```bash
mkdir -p supabase/functions/generate-ai-response
```

### Step 5: Copy the Edge Function

Copy the contents of `supabase-edge-function-example.ts` to:
```
supabase/functions/generate-ai-response/index.ts
```

### Step 6: Deploy the Edge Function

```bash
supabase functions deploy generate-ai-response
```

### Step 7: Set Environment Variables

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

### Step 8: Verify Deployment

```bash
supabase functions list
```

You should see `generate-ai-response` in the list.

---

## Testing Checklist

After deployment, test the AI tone on these screens:

- [ ] **Person Chat** - Create a new person and start a conversation
  - Verify AI is supportive and warm
  - Verify AI offers 2-4 options
  - Verify AI asks gentle questions

- [ ] **Topic Chat** - Create a new topic and start a conversation
  - Verify tone matches Person Chat
  - Verify only context differs (topic name vs person name)

- [ ] **Library "Ask AI"** - Open a library topic and ask a question
  - Verify AI maintains the same supportive tone
  - Verify AI references the topic correctly

- [ ] **Subject Switching** - In a chat, switch between subjects
  - Verify AI maintains tone across subjects
  - Verify AI acknowledges the subject change

---

## Maintenance Guidelines

### DO:
✅ Keep the prompt in `supabase-edge-function-example.ts` as the single source
✅ Redeploy the Edge Function after any prompt changes
✅ Test on all chat entry points after deployment
✅ Document any prompt changes in this file

### DON'T:
❌ Create duplicate prompts in other files
❌ Add fallback prompts that override tone
❌ Use different prompts for Person vs Topic chat
❌ Hardcode prompts in UI components

---

## Canonical Prompt Module

A new module has been created for better maintainability:

**File:** `prompts/aiPrompt.ts`

This module exports:
- `generateAISystemPrompt()` - Generates the full prompt with context
- `detectDeathMention()` - Detects grief-related conversations
- `AI_FALLBACK_MESSAGE` - Consistent fallback message
- `AI_DEFAULT_MESSAGE` - Default supportive message

**Note:** The Edge Function currently has the prompt inline. In the future, you could refactor to import from this module if Deno supports it.

---

## Verification Commands

### Check if Edge Function is deployed:
```bash
supabase functions list
```

### View Edge Function logs:
```bash
supabase functions logs generate-ai-response
```

### Test Edge Function directly:
```bash
curl -X POST \
  https://zjzvkxvahrbuuyzjzxol.supabase.co/functions/v1/generate-ai-response \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personId": "test-id",
    "personName": "Test Person",
    "personRelationshipType": "Friend",
    "messages": [
      {"role": "user", "content": "I'm feeling stressed", "createdAt": "2024-01-01T00:00:00Z"}
    ]
  }'
```

---

## Summary

**Canonical Prompt Location:** `supabase-edge-function-example.ts`

**All AI Calls Reference It:** ✅ Yes

**Tested Screens:**
- [ ] Person Chat
- [ ] Topic Chat
- [ ] Library "Ask AI about this topic"

**Next Steps:**
1. Deploy the Edge Function using the commands above
2. Test on all three screens
3. Verify tone is consistent and supportive
4. Mark this issue as resolved

---

**Last Updated:** 2024-01-XX
**Status:** Ready for deployment
