
# AI Response Testing Guide

## 🚀 Quick Start Testing

### 1. Basic Functionality Test (2 minutes)

```
✅ Step 1: Open the app
✅ Step 2: Log in with your credentials
✅ Step 3: Navigate to any person/topic chat
✅ Step 4: Type "Hello, how are you?" and send
✅ Step 5: Wait 5-10 seconds
✅ Expected: AI responds with a message
```

### 2. Session Validation Test (1 minute)

```
✅ Step 1: Send a message (should work)
✅ Step 2: Force-close the app
✅ Step 3: Wait 5 minutes
✅ Step 4: Reopen app and try to send a message
✅ Expected: Either works OR shows "session expired" message
```

### 3. Error Recovery Test (1 minute)

```
✅ Step 1: Turn off WiFi/mobile data
✅ Step 2: Try to send a message
✅ Expected: Error message appears
✅ Step 3: Turn WiFi/mobile data back on
✅ Step 4: Retry sending the message
✅ Expected: Message sends successfully
```

## 🔍 What to Look For

### ✅ Success Indicators:
- AI responds within 5-10 seconds
- Typing indicator appears while AI is thinking
- Response appears automatically (no refresh needed)
- No error banners at the top of the screen
- Messages are saved and persist after app restart

### ❌ Failure Indicators:
- Red error banner appears
- "Edge Function returned a non-2xx status code" error
- Typing indicator never disappears
- No response after 30+ seconds
- "Session expired" or "Unauthorized" errors

## 🐛 Common Issues & Solutions

### Issue 1: "Session expired" Error
**Cause**: Your authentication token has expired
**Solution**: 
1. Tap "Log in again" or navigate to login screen
2. Enter your credentials
3. Try sending the message again

### Issue 2: "AI service not configured" Error
**Cause**: OpenAI API key is not set in Supabase
**Solution**: 
1. Go to Supabase Dashboard
2. Navigate to Edge Functions > Secrets
3. Add `OPENAI_API_KEY` with your OpenAI API key

### Issue 3: No Response After 30+ Seconds
**Cause**: Network timeout or OpenAI API issue
**Solution**:
1. Check your internet connection
2. Try sending the message again
3. If persists, check Edge Function logs in Supabase Dashboard

### Issue 4: "Edge Function returned a non-2xx status code"
**Cause**: Authentication or configuration issue
**Solution**:
1. Log out and log back in
2. Check Edge Function logs for specific error
3. Verify OpenAI API key is set correctly

## 📊 Performance Benchmarks

### Expected Response Times:
- **User message save**: < 500ms
- **AI response generation**: 3-8 seconds
- **Total round-trip**: 4-10 seconds

### If Response Times Are Slow:
- Check your internet connection speed
- Verify OpenAI API status (status.openai.com)
- Check Edge Function logs for timeout errors

## 🔧 Developer Debugging

### Enable Detailed Logging (DEV Mode):
The app automatically logs detailed information in development mode. Look for:

```
[Chat] Validating session before Edge Function call...
[Chat] Session validated successfully
[Chat] Sending to AI: { ... }
[Chat] Edge Function invoked successfully
```

### Check Edge Function Logs:
1. Go to Supabase Dashboard
2. Navigate to Edge Functions > generate-ai-response
3. Click "Logs" tab
4. Look for recent requests with your user ID

### Verify Environment Variables:
```bash
# In Supabase Dashboard > Edge Functions > Secrets
OPENAI_API_KEY=sk-... ✅ (Required)
SUPABASE_URL=https://zjzvkxvahrbuuyzjzxol.supabase.co ✅ (Auto)
SUPABASE_SERVICE_ROLE_KEY=... ✅ (Auto)
```

## 📝 Test Scenarios

### Scenario 1: First Message in New Chat
```
1. Create a new person/topic
2. Open the chat
3. Send first message
4. Verify AI responds appropriately
```

### Scenario 2: Continuing Conversation
```
1. Open existing chat with history
2. Send a follow-up message
3. Verify AI references previous context
```

### Scenario 3: Multiple Rapid Messages
```
1. Send message 1
2. Immediately send message 2
3. Verify both get responses
4. Verify responses are in correct order
```

### Scenario 4: Long Message
```
1. Type a message with 300+ characters
2. Send the message
3. Verify AI responds appropriately
```

### Scenario 5: Special Characters
```
1. Send message with emojis: "I'm feeling 😊 today!"
2. Send message with quotes: "She said 'hello' to me"
3. Verify AI handles special characters correctly
```

## ✅ Final Checklist

Before marking as "complete", verify:

- [ ] Basic chat works (send message, get response)
- [ ] Typing indicator appears and disappears correctly
- [ ] Messages persist after app restart
- [ ] Error handling works (network errors, session expiry)
- [ ] Realtime updates work (no manual refresh needed)
- [ ] Performance is acceptable (< 10 seconds per response)
- [ ] No console errors in DEV mode
- [ ] No 401 errors in Edge Function logs

## 🎉 Success!

If all tests pass, the AI response system is working correctly! 

**Next Steps:**
- Monitor Edge Function logs for any new errors
- Collect user feedback on response quality
- Consider adding response time metrics

---

**Need Help?**
- Check [AI_RESPONSE_FIX_COMPLETE.md](./AI_RESPONSE_FIX_COMPLETE.md) for detailed implementation
- Review Edge Function logs in Supabase Dashboard
- Verify environment variables are set correctly
