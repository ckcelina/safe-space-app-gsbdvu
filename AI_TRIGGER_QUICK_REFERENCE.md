
# AI Backend Trigger - Quick Reference

## What It Does

Automatically generates AI responses when users send messages. No client-side changes needed.

## How It Works

```
User sends message → Database trigger → Edge Function → AI response → Realtime update → Client displays
```

## Key Components

### 1. Trigger

- **Name:** `ai_response_trigger`
- **Table:** `messages`
- **Event:** `AFTER INSERT`
- **Condition:** Only fires for `role='user'` messages

### 2. Function

- **Name:** `invoke_ai_response_trigger()`
- **Type:** `SECURITY DEFINER` (runs with elevated privileges)
- **Execution:** Asynchronous via `pg_net`

### 3. Edge Function

- **Name:** `generate-ai-response`
- **URL:** `https://zjzvkxvahrbuuyzjzxol.supabase.co/functions/v1/generate-ai-response`
- **Timeout:** 25 seconds

## Quick Commands

### Check Trigger Status

```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'ai_response_trigger';
```

### View Recent Requests

```sql
SELECT id, status_code, error_msg, created
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
```

### View Failed Requests

```sql
SELECT id, status_code, error_msg, content
FROM net._http_response
WHERE status_code >= 400 OR error_msg IS NOT NULL
ORDER BY created DESC
LIMIT 5;
```

### Disable Trigger (for testing)

```sql
ALTER TABLE messages DISABLE TRIGGER ai_response_trigger;
```

### Enable Trigger

```sql
ALTER TABLE messages ENABLE TRIGGER ai_response_trigger;
```

### Drop Trigger (if needed)

```sql
DROP TRIGGER IF EXISTS ai_response_trigger ON messages;
```

## Testing

### Test 1: Insert User Message

```sql
-- Replace with your actual user_id and person_id
INSERT INTO messages (user_id, person_id, role, content, subject)
VALUES (
  'your-user-id-here',
  'your-person-id-here',
  'user',
  'Test message for AI trigger',
  'General'
);
```

### Test 2: Check Response

Wait 5-10 seconds, then:

```sql
-- Check if assistant message was created
SELECT id, role, content, created_at
FROM messages
WHERE person_id = 'your-person-id-here'
ORDER BY created_at DESC
LIMIT 2;
```

### Test 3: Check pg_net Response

```sql
SELECT status_code, error_msg, content
FROM net._http_response
ORDER BY created DESC
LIMIT 1;
```

## Troubleshooting

### No AI Response?

1. **Check trigger is enabled:**
   ```sql
   SELECT tgenabled FROM pg_trigger WHERE tgname = 'ai_response_trigger';
   -- Should return 'O' (enabled)
   ```

2. **Check pg_net responses:**
   ```sql
   SELECT * FROM net._http_response ORDER BY created DESC LIMIT 1;
   ```

3. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → generate-ai-response → Logs

4. **Check Postgres logs:**
   - Go to Supabase Dashboard → Database → Logs
   - Look for "AI response trigger fired" messages

### Duplicate Responses?

1. **Check for multiple triggers:**
   ```sql
   SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'ai_response_trigger';
   -- Should return 1
   ```

2. **Check client code:**
   - Ensure client is NOT also calling the Edge Function
   - The trigger handles it automatically now

### Slow Responses?

1. **Check Edge Function timeout:**
   - Default is 25 seconds
   - Can be increased in trigger function

2. **Check OpenAI API status:**
   - Visit https://status.openai.com/

3. **Check pg_net queue:**
   ```sql
   SELECT COUNT(*) FROM net.http_request_queue;
   -- Should be 0 or low number
   ```

## Important Notes

- ✅ Trigger is **non-blocking** - user messages save immediately
- ✅ Trigger only processes **user messages** (not assistant messages)
- ✅ Errors are **logged but don't fail** the message insert
- ✅ Uses **async HTTP** via pg_net (no database blocking)
- ✅ **No client changes needed** - works automatically

## Monitoring

### Daily Health Check

```sql
-- Check trigger is active
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'ai_response_trigger';

-- Check recent success rate
SELECT 
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status_code = 200) as successful,
  COUNT(*) FILTER (WHERE status_code >= 400) as failed
FROM net._http_response
WHERE created > NOW() - INTERVAL '24 hours';
```

### Weekly Cleanup

```sql
-- Clean up old pg_net responses (older than 7 days)
DELETE FROM net._http_response
WHERE created < NOW() - INTERVAL '7 days';
```

## Configuration

### Adjust Timeout

Edit the trigger function:

```sql
CREATE OR REPLACE FUNCTION invoke_ai_response_trigger()
...
  timeout_milliseconds := 30000  -- Change from 25000 to 30000
...
```

### Change Edge Function URL

Edit the trigger function:

```sql
CREATE OR REPLACE FUNCTION invoke_ai_response_trigger()
...
  function_url := 'https://your-new-url.supabase.co/functions/v1/generate-ai-response';
...
```

## Support

For issues or questions:

1. Check this guide first
2. Review `AI_BACKEND_TRIGGER_IMPLEMENTATION.md` for detailed info
3. Check Supabase Dashboard logs
4. Contact the development team

## Version

- **Created:** 2025-01-29
- **Last Updated:** 2025-01-29
- **Trigger Version:** 2.0
- **pg_net Version:** 0.19.5
