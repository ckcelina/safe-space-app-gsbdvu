
# Deploy AI Edge Function - Quick Guide

## Prerequisites

- Supabase CLI installed
- OpenAI API key
- Access to Supabase project

---

## Quick Deploy (5 minutes)

### 1. Install Supabase CLI (if not installed)

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

This will open a browser window. Log in with your Supabase credentials.

### 3. Link Your Project

```bash
supabase link --project-ref zjzvkxvahrbuuyzjzxol
```

### 4. Create Function Directory Structure

```bash
mkdir -p supabase/functions/generate-ai-response
```

### 5. Copy Edge Function Code

**Option A: Manual Copy**

Copy the entire contents of `supabase-edge-function-example.ts` and paste it into:
```
supabase/functions/generate-ai-response/index.ts
```

**Option B: Command Line (Mac/Linux)**

```bash
cp supabase-edge-function-example.ts supabase/functions/generate-ai-response/index.ts
```

**Option C: Command Line (Windows)**

```cmd
copy supabase-edge-function-example.ts supabase\functions\generate-ai-response\index.ts
```

### 6. Set OpenAI API Key

```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

Replace `sk-your-openai-api-key-here` with your actual OpenAI API key.

### 7. Deploy the Function

```bash
supabase functions deploy generate-ai-response
```

You should see output like:
```
Deploying function generate-ai-response...
Function deployed successfully!
URL: https://zjzvkxvahrbuuyzjzxol.supabase.co/functions/v1/generate-ai-response
```

### 8. Verify Deployment

```bash
supabase functions list
```

You should see `generate-ai-response` in the list with status "deployed".

---

## Test the Deployment

### Option 1: Test in the App

1. Open the Safe Space app
2. Create a new person or topic
3. Start a conversation
4. Verify the AI responds with a supportive, warm tone

### Option 2: Test with cURL

```bash
curl -X POST \
  https://zjzvkxvahrbuuyzjzxol.supabase.co/functions/v1/generate-ai-response \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZreHZhaHJidXV5emp6eG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzQ0MjMsImV4cCI6MjA4MDQxMDQyM30.TrjFcA0HEbA6ocLLlbadS0RwuEjKU0ttnacGXyEk1M8" \
  -H "Content-Type: application/json" \
  -d '{
    "personId": "test-123",
    "personName": "Alex",
    "personRelationshipType": "Friend",
    "messages": [
      {
        "role": "user",
        "content": "I had a fight with Alex and I feel terrible",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "currentSubject": "General"
  }'
```

Expected response:
```json
{
  "reply": "That sounds really painful, especially when you care about your friendship with Alex..."
}
```

The response should be:
- Warm and supportive ✅
- Offer 2-4 practical options ✅
- End with a gentle question ✅
- NOT blunt or overly brief ❌

---

## View Logs

To see what's happening in the Edge Function:

```bash
supabase functions logs generate-ai-response --follow
```

This will show real-time logs including:
- Incoming requests
- System prompt length
- Message history
- AI responses
- Any errors

---

## Troubleshooting

### Error: "OpenAI API key is not configured"

**Solution:** Set the API key:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### Error: "Function not found"

**Solution:** Verify deployment:
```bash
supabase functions list
```

If not listed, redeploy:
```bash
supabase functions deploy generate-ai-response
```

### Error: "CORS error"

**Solution:** The Edge Function already includes CORS headers. If you still see this error, check that you're using the correct Supabase URL and anon key.

### AI Tone Still Blunt

**Possible causes:**
1. Old version still cached - wait 1-2 minutes and try again
2. OpenAI API key not set - check with `supabase secrets list`
3. Function not deployed - verify with `supabase functions list`

**Solution:**
```bash
# Redeploy
supabase functions deploy generate-ai-response --no-verify-jwt

# Clear app cache (in app)
# - Log out and log back in
# - Or restart the app
```

---

## Update the Prompt

If you need to change the AI prompt in the future:

1. Edit `supabase-edge-function-example.ts`
2. Copy to `supabase/functions/generate-ai-response/index.ts`
3. Redeploy:
   ```bash
   supabase functions deploy generate-ai-response
   ```
4. Test on all chat screens

---

## Success Checklist

After deployment, verify:

- [ ] Edge Function appears in `supabase functions list`
- [ ] OpenAI API key is set (check with `supabase secrets list`)
- [ ] Person Chat shows supportive AI tone
- [ ] Topic Chat shows supportive AI tone
- [ ] Library "Ask AI" shows supportive AI tone
- [ ] AI offers 2-4 options (not just one)
- [ ] AI asks gentle questions when appropriate
- [ ] AI varies openings (not always "Hey there!")

---

## Need Help?

Check the logs:
```bash
supabase functions logs generate-ai-response --follow
```

Look for:
- ✅ "AI reply generated" - Success
- ❌ "OpenAI API error" - API key issue
- ❌ "Error in generate-ai-response" - Code error

---

**Deployment Time:** ~5 minutes
**Testing Time:** ~5 minutes
**Total Time:** ~10 minutes

Once deployed, the AI tone will be consistent across all chat entry points.
