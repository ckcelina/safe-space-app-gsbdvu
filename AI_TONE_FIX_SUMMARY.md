
# AI Tone Fix Summary - Safe Space

## Problem Statement

The AI tone keeps reverting to blunt/straight-to-the-point responses, even after previous fixes. This suggests:
- Multiple competing prompts
- Fallback prompts overriding the main prompt
- Edge Function not deployed or outdated

---

## Solution Implemented

### 1. Audit Complete ✅

**Findings:**
- ✅ Only ONE canonical prompt exists (`supabase-edge-function-example.ts`)
- ✅ All chat entry points correctly call the Edge Function
- ✅ No duplicate or conflicting prompts found
- ✅ No fallback prompts that override tone
- ✅ Person chat and Topic chat use the same prompt

**Conclusion:** Architecture is correct. Issue is likely deployment-related.

### 2. Canonical Prompt Module Created ✅

**File:** `prompts/aiPrompt.ts`

This module provides:
- `generateAISystemPrompt()` - Generates the full prompt with context
- `detectDeathMention()` - Detects grief-related conversations
- `AI_FALLBACK_MESSAGE` - Consistent fallback message
- `AI_DEFAULT_MESSAGE` - Default supportive message

**Note:** This is for future use. The Edge Function currently has the prompt inline.

### 3. Edge Function Updated ✅

**File:** `supabase-edge-function-example.ts`

Changes:
- ✅ Prompt remains unchanged (already correct)
- ✅ Added better logging for debugging
- ✅ Added validation for OpenAI API key
- ✅ Improved error messages
- ✅ Added death/grief detection

### 4. Documentation Created ✅

**Files:**
- `AI_PROMPT_AUDIT_REPORT.md` - Full audit results and maintenance guide
- `DEPLOY_EDGE_FUNCTION.md` - Step-by-step deployment guide
- `AI_TONE_FIX_SUMMARY.md` - This file

---

## Canonical Prompt Location

**PRIMARY SOURCE:** `supabase-edge-function-example.ts`

This file contains the complete AI system prompt. All AI calls reference this Edge Function.

**Prompt Characteristics:**
- Supportive, warm, conversational tone
- Validates feelings first (1-2 sentences)
- Offers 2-4 practical options
- Asks gentle questions when appropriate
- Avoids formal/robotic language
- Includes 3 example responses

---

## All AI Call Points Verified

| Entry Point | File | Status |
|-------------|------|--------|
| Person Chat | `app/(tabs)/(home)/chat.tsx` | ✅ Correct |
| Topic Chat | `app/(tabs)/(home)/chat.tsx` | ✅ Correct |
| Library "Ask AI" | `app/(tabs)/library/detail.tsx` | ✅ Correct |

All entry points call `supabase.functions.invoke('generate-ai-response')` with the same parameters.

---

## Testing Checklist

After deploying the Edge Function, test on these screens:

### Person Chat
- [ ] Create a new person (e.g., "Dad", "Friend")
- [ ] Start a conversation about a problem
- [ ] Verify AI is supportive and warm
- [ ] Verify AI offers 2-4 options
- [ ] Verify AI asks gentle questions
- [ ] Verify AI varies openings (not always "Hey there!")

### Topic Chat
- [ ] Create a new topic (e.g., "Anxiety", "Self-esteem")
- [ ] Start a conversation
- [ ] Verify tone matches Person Chat
- [ ] Verify only context differs (topic name vs person name)

### Library "Ask AI"
- [ ] Open a library topic (e.g., "Social Anxiety")
- [ ] Click "Ask AI questions about this topic"
- [ ] Start a conversation
- [ ] Verify AI maintains the same supportive tone
- [ ] Verify AI references the topic correctly

### Subject Switching
- [ ] In a chat, switch between subjects (e.g., "General" → "Work / Career")
- [ ] Verify AI maintains tone across subjects
- [ ] Verify AI acknowledges the subject change

---

## Deployment Instructions

### Quick Deploy (5 minutes)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login:**
   ```bash
   supabase login
   ```

3. **Link Project:**
   ```bash
   supabase link --project-ref zjzvkxvahrbuuyzjzxol
   ```

4. **Create Function Directory:**
   ```bash
   mkdir -p supabase/functions/generate-ai-response
   ```

5. **Copy Edge Function:**
   ```bash
   cp supabase-edge-function-example.ts supabase/functions/generate-ai-response/index.ts
   ```

6. **Set OpenAI API Key:**
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-your-key-here
   ```

7. **Deploy:**
   ```bash
   supabase functions deploy generate-ai-response
   ```

8. **Verify:**
   ```bash
   supabase functions list
   ```

**Full instructions:** See `DEPLOY_EDGE_FUNCTION.md`

---

## Why This Fixes the Issue

### Root Cause
The Edge Function was either:
1. Not deployed to Supabase
2. Deployed with an older version of the prompt
3. Missing the OpenAI API key

### How This Fixes It
1. **Single Source of Truth:** Only one prompt exists in the Edge Function
2. **No Fallbacks:** All chat entry points use the same Edge Function
3. **Consistent Deployment:** Clear deployment instructions ensure the latest version is live
4. **Better Logging:** Improved logs help debug any future issues

---

## Maintenance Guidelines

### DO:
✅ Keep the prompt in `supabase-edge-function-example.ts`
✅ Redeploy the Edge Function after any prompt changes
✅ Test on all chat entry points after deployment
✅ Document any prompt changes

### DON'T:
❌ Create duplicate prompts in other files
❌ Add fallback prompts that override tone
❌ Use different prompts for Person vs Topic chat
❌ Hardcode prompts in UI components

---

## Verification

### Check Deployment Status
```bash
supabase functions list
```

Expected output:
```
generate-ai-response | deployed | 2024-XX-XX XX:XX:XX
```

### View Logs
```bash
supabase functions logs generate-ai-response --follow
```

Look for:
- ✅ "AI reply generated" - Success
- ❌ "OpenAI API error" - API key issue
- ❌ "Error in generate-ai-response" - Code error

### Test with cURL
```bash
curl -X POST \
  https://zjzvkxvahrbuuyzjzxol.supabase.co/functions/v1/generate-ai-response \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personId": "test-123",
    "personName": "Alex",
    "personRelationshipType": "Friend",
    "messages": [
      {"role": "user", "content": "I feel stressed", "createdAt": "2024-01-01T00:00:00Z"}
    ]
  }'
```

Expected response should be warm and supportive, not blunt.

---

## Example AI Responses (Expected)

### Good Response (Supportive) ✅
```
"That sounds really stressful. It makes sense you'd feel overwhelmed right now.

Sometimes when we're stressed, it helps to break things down into smaller pieces. Here are a few things you could try:

- Take 5 minutes to do some deep breathing
- Write down what's stressing you most
- Talk to someone you trust about it
- Take a short walk to clear your head

What feels most doable for you right now?"
```

### Bad Response (Blunt) ❌
```
"Try deep breathing or talking to someone."
```

If you see the bad response, the Edge Function is not deployed or the API key is missing.

---

## Success Criteria

✅ AI tone is supportive and warm
✅ AI offers 2-4 practical options
✅ AI asks gentle questions when appropriate
✅ AI varies openings (not always "Hey there!")
✅ Tone is consistent across Person Chat, Topic Chat, and Library "Ask AI"
✅ No blunt or overly brief responses

---

## Next Steps

1. **Deploy the Edge Function** (see `DEPLOY_EDGE_FUNCTION.md`)
2. **Test on all chat screens** (see Testing Checklist above)
3. **Verify tone is consistent** (see Example AI Responses above)
4. **Mark this issue as resolved**

---

## Files Modified

- ✅ `prompts/aiPrompt.ts` - New canonical prompt module
- ✅ `supabase-edge-function-example.ts` - Updated with better logging
- ✅ `AI_PROMPT_AUDIT_REPORT.md` - Full audit results
- ✅ `DEPLOY_EDGE_FUNCTION.md` - Deployment guide
- ✅ `AI_TONE_FIX_SUMMARY.md` - This summary

---

## Files NOT Modified (Already Correct)

- ✅ `app/(tabs)/(home)/chat.tsx` - Already calls Edge Function correctly
- ✅ `app/(tabs)/library/detail.tsx` - Already calls Edge Function correctly
- ✅ `lib/aiClient.ts` - Already correct (no prompt)
- ✅ `src/api/ai.ts` - Already correct (no prompt)
- ✅ `utils/aiHelpers.ts` - Already correct (no prompt)

---

**Status:** Ready for deployment
**Estimated Time:** 10 minutes (5 min deploy + 5 min test)
**Priority:** High (affects core user experience)

---

## Contact

If you encounter issues during deployment:
1. Check the logs: `supabase functions logs generate-ai-response --follow`
2. Verify API key: `supabase secrets list`
3. Verify deployment: `supabase functions list`

---

**Last Updated:** 2024-01-XX
**Issue:** AI tone reverting to blunt responses
**Solution:** Deploy Edge Function with canonical prompt
**Result:** Consistent, supportive AI tone across all chat entry points
