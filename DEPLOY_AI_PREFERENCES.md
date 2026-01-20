
# Quick Deployment Guide for AI Style Preferences

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Logged into Supabase: `supabase login`
- Project linked: `supabase link --project-ref zjzvkxvahrbuuyzjzxol`

## Step-by-Step Deployment

### 1. Create Edge Function Directory

```bash
# Create the function directory
mkdir -p supabase/functions/generate-ai-response

# Create the index.ts file
touch supabase/functions/generate-ai-response/index.ts
```

### 2. Copy Edge Function Code

Copy the entire content from `supabase-edge-function-example.ts` to `supabase/functions/generate-ai-response/index.ts`.

You can do this manually or use:

```bash
cp supabase-edge-function-example.ts supabase/functions/generate-ai-response/index.ts
```

### 3. Set Environment Variables

```bash
# Set your OpenAI API key
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here

# Verify it's set
supabase secrets list
```

### 4. Deploy the Function

```bash
# Deploy the function
supabase functions deploy generate-ai-response

# You should see output like:
# Deploying function generate-ai-response...
# Function deployed successfully!
```

### 5. Verify Deployment

```bash
# List all functions
supabase functions list

# You should see generate-ai-response in the list
```

### 6. Test the Function

1. Open your Safe Space app
2. Go to Settings → AI Style Preferences
3. Change the tone to "Executive Summary"
4. Enable Science Mode
5. Go to any chat and send a message
6. The response should be:
   - Short and bullet-pointed (Executive Summary tone)
   - Include psychology concepts (Science Mode)

### 7. Check Logs

```bash
# View real-time logs
supabase functions logs generate-ai-response --follow

# Look for:
# - "AI Tone ID: executive_summary"
# - "Science Mode: true"
# - "System prompt length: [number]"
```

## Troubleshooting

### Error: "Function not found"

**Solution**: Make sure you're in the project root directory and the function is deployed:

```bash
cd /path/to/your/project
supabase functions deploy generate-ai-response
```

### Error: "OpenAI API key not configured"

**Solution**: Set the environment variable:

```bash
supabase secrets set OPENAI_API_KEY=your_key_here
```

### Error: "Supabase session not available"

**Solution**: Login and link your project:

```bash
supabase login
supabase link --project-ref zjzvkxvahrbuuyzjzxol
```

### Tone doesn't seem to work

**Debug steps**:

1. Check Edge Function logs:
   ```bash
   supabase functions logs generate-ai-response
   ```

2. Verify parameters are being passed:
   - Look for "AI Tone ID: [tone_id]" in logs
   - Look for "Science Mode: true/false" in logs

3. Test with extreme tones:
   - "Executive Summary" should be very short
   - "Warm Hug" should be very long and validating

4. Check if system prompt includes tone instructions:
   - Look for "System prompt length: [number]" in logs
   - Should be 2000-4000 characters

## Quick Test Script

After deployment, test with this flow:

1. **Login to app**
2. **Go to Settings**
3. **Change tone to "Executive Summary"**
4. **Enable Science Mode**
5. **Go to a chat**
6. **Send**: "I'm having trouble with my partner"
7. **Expected response**:
   ```
   Key points:
   - Communication breakdown
   - Attachment patterns may be at play
   
   Next steps:
   1. Identify specific issues
   2. Practice active listening
   3. Consider couples therapy
   
   Resources:
   - "Hold Me Tight" by Sue Johnson
   - Attachment theory research
   ```

8. **Change tone to "Warm Hug"**
9. **Send the same message**
10. **Expected response**:
    ```
    Oh, that sounds really hard. I can hear how much this is weighing on you, 
    and it makes complete sense that you'd be feeling this way. Relationship 
    struggles can be so painful, especially when you care deeply about the person.
    
    [Much longer, more validating response...]
    ```

If both responses are similar, the Edge Function isn't using the preferences correctly.

## Success Criteria

✅ Edge Function deployed without errors
✅ Environment variables set
✅ Logs show tone ID and science mode
✅ Different tones produce noticeably different responses
✅ Science mode includes psychology concepts
✅ No errors in Edge Function logs

## Next Steps After Deployment

1. **Test all tones** to ensure they work
2. **Monitor logs** for any errors
3. **Gather user feedback** on tone effectiveness
4. **Adjust tone instructions** if needed (in `supabase-edge-function-example.ts`)
5. **Re-deploy** if you make changes

---

**Need Help?**

Check the logs first:
```bash
supabase functions logs generate-ai-response --follow
```

Then review `AI_PREFERENCES_COMPLETE_IMPLEMENTATION.md` for detailed debugging steps.
