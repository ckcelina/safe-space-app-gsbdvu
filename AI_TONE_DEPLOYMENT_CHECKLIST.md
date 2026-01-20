
# AI Tone Deployment Checklist

Use this checklist to deploy and verify the AI tone fix.

---

## Pre-Deployment

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] OpenAI API key ready
- [ ] Access to Supabase project (zjzvkxvahrbuuyzjzxol)

---

## Deployment Steps

### 1. Setup
- [ ] Run `supabase login`
- [ ] Run `supabase link --project-ref zjzvkxvahrbuuyzjzxol`
- [ ] Run `mkdir -p supabase/functions/generate-ai-response`

### 2. Copy Function
- [ ] Copy `supabase-edge-function-example.ts` to `supabase/functions/generate-ai-response/index.ts`

### 3. Configure
- [ ] Run `supabase secrets set OPENAI_API_KEY=sk-your-key-here`
- [ ] Verify with `supabase secrets list`

### 4. Deploy
- [ ] Run `supabase functions deploy generate-ai-response`
- [ ] Verify with `supabase functions list`
- [ ] Check status shows "deployed"

---

## Testing

### Person Chat
- [ ] Create a new person (e.g., "Dad")
- [ ] Send message: "I had a fight with Dad and I feel terrible"
- [ ] Verify AI response is:
  - [ ] Warm and supportive (not blunt)
  - [ ] Offers 2-4 options
  - [ ] Ends with a gentle question
  - [ ] Does NOT start with "Hey there!" every time

### Topic Chat
- [ ] Create a new topic (e.g., "Anxiety")
- [ ] Send message: "I'm feeling anxious about work"
- [ ] Verify AI response is:
  - [ ] Same supportive tone as Person Chat
  - [ ] References the topic correctly
  - [ ] Offers practical advice

### Library "Ask AI"
- [ ] Open a library topic (e.g., "Social Anxiety")
- [ ] Click "Ask AI questions about this topic"
- [ ] Send message: "How do I cope with social anxiety?"
- [ ] Verify AI response is:
  - [ ] Same supportive tone
  - [ ] References the library topic
  - [ ] Offers coping strategies

### Subject Switching
- [ ] In a chat, switch from "General" to "Work / Career"
- [ ] Send a message
- [ ] Verify AI:
  - [ ] Maintains supportive tone
  - [ ] Acknowledges the subject
  - [ ] Keeps context from previous messages

---

## Verification

### Check Logs
- [ ] Run `supabase functions logs generate-ai-response --follow`
- [ ] Look for "✅ AI reply generated" messages
- [ ] No "❌ OpenAI API error" messages

### Test with cURL (Optional)
- [ ] Run the test command from `DEPLOY_EDGE_FUNCTION.md`
- [ ] Verify response is warm and supportive

---

## Success Criteria

All of these must be true:

- [ ] AI tone is supportive and warm (not blunt)
- [ ] AI offers 2-4 practical options (not just one)
- [ ] AI asks gentle questions when appropriate
- [ ] AI varies openings (not always "Hey there!")
- [ ] Tone is consistent across all chat entry points
- [ ] No "I'm having trouble responding" fallback messages

---

## Troubleshooting

### Issue: AI still blunt

**Check:**
- [ ] Edge Function deployed? (`supabase functions list`)
- [ ] API key set? (`supabase secrets list`)
- [ ] Logs show errors? (`supabase functions logs generate-ai-response`)

**Solution:**
- [ ] Redeploy: `supabase functions deploy generate-ai-response`
- [ ] Wait 1-2 minutes for cache to clear
- [ ] Restart the app

### Issue: "OpenAI API error"

**Check:**
- [ ] API key set correctly? (`supabase secrets list`)
- [ ] API key valid? (test on OpenAI website)

**Solution:**
- [ ] Reset API key: `supabase secrets set OPENAI_API_KEY=sk-your-key-here`
- [ ] Redeploy: `supabase functions deploy generate-ai-response`

### Issue: "Function not found"

**Check:**
- [ ] Function deployed? (`supabase functions list`)
- [ ] Correct project linked? (`supabase link --project-ref zjzvkxvahrbuuyzjzxol`)

**Solution:**
- [ ] Redeploy: `supabase functions deploy generate-ai-response`

---

## Post-Deployment

- [ ] Test on all three chat entry points (Person, Topic, Library)
- [ ] Verify tone is consistent
- [ ] Mark issue as resolved
- [ ] Document any changes in `AI_PROMPT_AUDIT_REPORT.md`

---

## Maintenance

When updating the prompt in the future:

1. [ ] Edit `supabase-edge-function-example.ts`
2. [ ] Copy to `supabase/functions/generate-ai-response/index.ts`
3. [ ] Redeploy: `supabase functions deploy generate-ai-response`
4. [ ] Test on all chat entry points
5. [ ] Update documentation

---

## Quick Reference

**Deploy Command:**
```bash
supabase functions deploy generate-ai-response
```

**View Logs:**
```bash
supabase functions logs generate-ai-response --follow
```

**List Functions:**
```bash
supabase functions list
```

**Set API Key:**
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

---

**Estimated Time:** 10 minutes
**Priority:** High
**Status:** Ready for deployment

---

## Sign-Off

- [ ] Deployment completed
- [ ] All tests passed
- [ ] AI tone is consistent and supportive
- [ ] Issue resolved

**Deployed by:** _______________
**Date:** _______________
**Time:** _______________

---

**Next Review:** After any prompt changes or if tone issues reappear
