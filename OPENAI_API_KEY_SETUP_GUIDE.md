
# OpenAI API Key Setup Guide

## 🔴 CRITICAL: The OpenAI API key must be configured in Supabase for the AI chat to work!

The error you're seeing (`MISSING_API_KEY` or `OPENAI_AUTH_ERROR`) means that the `OPENAI_API_KEY` environment variable is not set in your Supabase Edge Functions, or the key is invalid.

---

## ✅ Step-by-Step Setup Instructions

### Step 1: Get Your OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Log in to your OpenAI account (or create one if you don't have one)
3. Click **"Create new secret key"**
4. Give it a name (e.g., "Safe Space App")
5. **Copy the key immediately** - you won't be able to see it again!
   - The key should start with `sk-proj-` or `sk-`
   - It should be about 50-100 characters long

### Step 2: Add the API Key to Supabase

1. Go to your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **Safe Space** (project ID: `zjzvkxvahrbuuyzjzxol`)
3. In the left sidebar, click **"Project Settings"** (gear icon at the bottom)
4. Click **"Edge Functions"** in the settings menu
5. Click the **"Manage secrets"** button
6. Click **"Add new secret"**
7. Enter the following:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Paste your OpenAI API key (the one starting with `sk-proj-` or `sk-`)
8. Click **"Save"** or **"Add secret"**

### Step 3: Verify the Setup

1. Wait 10-30 seconds for the secret to propagate
2. Open your Safe Space app
3. Try sending a message in the chat
4. The AI should now respond successfully!

---

## 🔍 Troubleshooting

### Error: "MISSING_API_KEY"
- **Cause:** The `OPENAI_API_KEY` environment variable is not set in Supabase
- **Solution:** Follow Step 2 above to add the secret

### Error: "INVALID_API_KEY_FORMAT"
- **Cause:** The API key doesn't start with `sk-` or `sk-proj-`
- **Solution:** Double-check that you copied the correct key from OpenAI

### Error: "OPENAI_AUTH_ERROR" (401 Unauthorized)
- **Cause:** The API key is invalid, expired, or doesn't have the correct permissions
- **Solution:** 
  1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  2. Check if your key is still active
  3. If it's revoked or expired, create a new key
  4. Update the `OPENAI_API_KEY` secret in Supabase with the new key

### Error: "Insufficient quota" or "Rate limit exceeded"
- **Cause:** Your OpenAI account has run out of credits or hit rate limits
- **Solution:**
  1. Go to [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)
  2. Add credits to your account
  3. Check your usage limits

---

## 💡 Important Notes

1. **Keep your API key secret!** Never share it publicly or commit it to version control
2. **Monitor your usage:** OpenAI charges per token used. Check your usage at [https://platform.openai.com/usage](https://platform.openai.com/usage)
3. **Set usage limits:** In your OpenAI account settings, you can set monthly spending limits to avoid unexpected charges
4. **The key is stored securely:** Supabase encrypts environment variables, so your key is safe

---

## 📊 Current Status

Your OpenAI API key: **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**

**⚠️ ACTION REQUIRED:** You need to add this key to Supabase following Step 2 above.

---

## 🎯 Quick Reference

- **Supabase Dashboard:** [https://supabase.com/dashboard/project/zjzvkxvahrbuuyzjzxol](https://supabase.com/dashboard/project/zjzvkxvahrbuuyzjzxol)
- **OpenAI API Keys:** [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **OpenAI Usage:** [https://platform.openai.com/usage](https://platform.openai.com/usage)
- **OpenAI Billing:** [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)

---

## ✅ After Setup

Once you've added the `OPENAI_API_KEY` to Supabase:

1. The Edge Function will automatically use it
2. No app restart is needed
3. The AI chat will start working immediately
4. You should see successful responses in the chat

---

## 🆘 Still Having Issues?

If you're still seeing errors after following these steps:

1. Check the Supabase Edge Function logs:
   - Go to Supabase Dashboard > Edge Functions
   - Click on `generate-ai-response`
   - Check the "Logs" tab for detailed error messages

2. Verify the secret is set correctly:
   - Go to Project Settings > Edge Functions > Manage secrets
   - Confirm `OPENAI_API_KEY` is listed
   - The value should start with `sk-proj-` or `sk-`

3. Test the API key directly:
   - Use the `test-openai-key` Edge Function (if available)
   - Or test it with a curl command:
     ```bash
     curl https://api.openai.com/v1/chat/completions \
       -H "Authorization: Bearer YOUR_API_KEY" \
       -H "Content-Type: application/json" \
       -d '{
         "model": "gpt-4o-mini",
         "messages": [{"role": "user", "content": "Hello!"}]
       }'
     ```

---

**Last Updated:** January 2025
