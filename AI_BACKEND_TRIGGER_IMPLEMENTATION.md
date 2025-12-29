
# AI Backend Trigger Implementation

## Overview

This document describes the backend listener implementation that automatically triggers AI responses when users send messages in the Safe Space app.

## Architecture

### Flow Diagram

```
User sends message
    ↓
Client inserts message into `messages` table (role='user')
    ↓
Database AFTER INSERT trigger fires
    ↓
`invoke_ai_response_trigger()` function executes
    ↓
Function invokes `generate-ai-response` Edge Function via pg_net (async, non-blocking)
    ↓
Edge Function generates AI response using OpenAI
    ↓
Edge Function inserts assistant message into `messages` table (role='assistant')
    ↓
Realtime broadcast notifies client of new assistant message
    ↓
Client displays AI response in chat UI
```

## Implementation Details

### 1. Database Trigger

**Trigger Name:** `ai_response_trigger`

**Table:** `messages`

**Event:** `AFTER INSERT`

**Execution:** `FOR EACH ROW`

**Function:** `invoke_ai_response_trigger()`

### 2. Trigger Function

The `invoke_ai_response_trigger()` function:

- **Only processes user messages** (role='user') - ignores assistant messages to prevent loops
- **Gathers context** from the database:
  - Person details (name, relationship type)
  - User preferences (AI tone, science mode)
  - Recent messages (last 20 for the same person/subject)
- **Builds request payload** with all necessary context
- **Invokes Edge Function** asynchronously using `pg_net.http_post()`
- **Never blocks** the message insert - uses async HTTP request
- **Handles errors gracefully** - logs warnings but doesn't fail the insert

### 3. Key Features

#### Non-Blocking Execution

The trigger uses `pg_net` extension which provides **asynchronous HTTP requests**. This means:

- User message insert completes immediately
- AI response generation happens in the background
- No UI blocking or delays
- Database performance is not impacted

#### Error Handling

The trigger function includes comprehensive error handling:

```sql
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'AI response trigger failed for message %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
```

This ensures that:
- User messages are **always saved** even if the AI trigger fails
- Errors are logged for debugging
- The app remains functional even if the Edge Function is down

#### Loop Prevention

The trigger only processes user messages:

```sql
IF NEW.role != 'user' THEN
  RETURN NEW;
END IF;
```

This prevents infinite loops where:
- User message triggers AI response
- AI response insert would trigger another AI response (❌ prevented)

### 4. Edge Function Integration

The trigger invokes the existing `generate-ai-response` Edge Function with the following payload:

```json
{
  "userId": "uuid",
  "personId": "uuid",
  "personName": "string",
  "personRelationshipType": "string",
  "messages": [
    {
      "role": "user|assistant",
      "content": "string",
      "createdAt": "timestamp"
    }
  ],
  "currentSubject": "string",
  "aiToneId": "string",
  "aiScienceMode": boolean,
  "continuity_enabled": true
}
```

The Edge Function:
1. Validates the request
2. Calls OpenAI API to generate response
3. Inserts assistant message into `messages` table
4. Returns success/error response

### 5. Monitoring & Debugging

#### Check Trigger Status

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'messages'
  AND trigger_name = 'ai_response_trigger';
```

#### View pg_net Request Queue

```sql
SELECT * FROM net.http_request_queue;
```

#### View pg_net Response History

```sql
SELECT * FROM net._http_response
ORDER BY created DESC
LIMIT 10;
```

#### Check for Failed Requests

```sql
SELECT *
FROM net._http_response
WHERE status_code >= 400 OR error_msg IS NOT NULL
ORDER BY created DESC
LIMIT 10;
```

#### View Postgres Logs

Check the Supabase Dashboard → Database → Logs for trigger execution logs:

```
AI response trigger fired for message <id> (user: <user_id>, person: <person_id>, request_id: <request_id>)
```

## Testing

### Manual Test

1. Insert a user message directly into the database:

```sql
INSERT INTO messages (user_id, person_id, role, content, subject)
VALUES (
  '<your_user_id>',
  '<your_person_id>',
  'user',
  'Hello, I need some advice about my friend.',
  'General'
);
```

2. Check the pg_net response table after a few seconds:

```sql
SELECT * FROM net._http_response
ORDER BY created DESC
LIMIT 1;
```

3. Check if an assistant message was inserted:

```sql
SELECT * FROM messages
WHERE person_id = '<your_person_id>'
  AND role = 'assistant'
ORDER BY created_at DESC
LIMIT 1;
```

### Client Test

1. Open the Safe Space app
2. Navigate to a chat
3. Send a message
4. Verify that:
   - User message appears immediately
   - Typing indicator shows
   - AI response appears within 5-10 seconds
   - No errors in console

## Configuration

### Required Extensions

- ✅ `pg_net` (version 0.19.5+) - Already enabled
- ✅ `uuid-ossp` - Already enabled

### Edge Function Requirements

The `generate-ai-response` Edge Function must:

- Accept POST requests with the payload structure above
- Use `SUPABASE_SERVICE_ROLE_KEY` for database access
- Insert assistant messages into the `messages` table
- Return JSON response with `{ success: true, reply: "..." }`

### Environment Variables

The Edge Function requires:

- `OPENAI_API_KEY` - OpenAI API key for generating responses
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

## Troubleshooting

### Issue: AI responses not appearing

**Possible causes:**

1. **pg_net extension not enabled**
   - Check: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
   - Fix: `CREATE EXTENSION pg_net;`

2. **Edge Function not deployed**
   - Check: Supabase Dashboard → Edge Functions
   - Fix: Deploy the `generate-ai-response` function

3. **Edge Function errors**
   - Check: `SELECT * FROM net._http_response WHERE status_code >= 400;`
   - Check: Supabase Dashboard → Edge Functions → Logs

4. **Missing environment variables**
   - Check: Edge Function has `OPENAI_API_KEY` set
   - Fix: Set via Supabase Dashboard → Edge Functions → Settings

### Issue: Trigger not firing

**Possible causes:**

1. **Trigger disabled**
   - Check: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'ai_response_trigger';`
   - Fix: Re-run the migration

2. **Function error**
   - Check: Postgres logs for warnings
   - Fix: Review function code and fix errors

### Issue: Duplicate AI responses

**Possible causes:**

1. **Multiple triggers**
   - Check: `SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'ai_response_trigger';`
   - Fix: Drop duplicate triggers

2. **Client also calling Edge Function**
   - Check: Client code in `chat.tsx`
   - Fix: Remove client-side Edge Function call (trigger handles it now)

## Performance Considerations

### Request Rate Limiting

`pg_net` is configured to handle up to **200 requests per second** by default. For the Safe Space app, this is more than sufficient.

### Response Storage

`pg_net` stores responses for **6 hours** by default. This is configurable:

```sql
ALTER ROLE postgres SET pg_net.ttl TO '24 hours';
SELECT net.worker_restart();
```

### Timeout Configuration

The trigger uses a **25-second timeout** for Edge Function calls. This can be adjusted:

```sql
-- In the trigger function
timeout_milliseconds := 25000  -- Adjust as needed
```

## Security

### Authentication

The trigger function does not pass an Authorization header because:

- The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` internally
- Service role key has full database access
- No user-level authentication needed for trigger-initiated requests

### RLS Policies

The trigger function is marked as `SECURITY DEFINER`, which means:

- It runs with the privileges of the function owner (postgres)
- It can bypass RLS policies
- This is necessary to read user preferences and person details

### Data Privacy

The trigger only sends necessary data to the Edge Function:

- User ID (for context)
- Person ID (for context)
- Recent messages (last 20 only)
- User preferences (AI tone, science mode)

No sensitive data like passwords or email addresses are transmitted.

## Migration History

### Migration 1: `add_ai_response_trigger`

- Created `invoke_ai_response_trigger()` function
- Created `ai_response_trigger` trigger on `messages` table
- Enabled `pg_net` extension

### Migration 2: `update_ai_response_trigger_config`

- Updated function to use direct URL (no config variables)
- Improved error handling
- Added detailed logging

## Future Enhancements

### Possible Improvements

1. **Rate limiting per user** - Prevent abuse by limiting AI requests per user
2. **Priority queue** - Process premium users first
3. **Retry logic** - Automatically retry failed requests
4. **Metrics tracking** - Track AI response times and success rates
5. **A/B testing** - Test different AI prompts or models

### Alternative Approaches

1. **pg_cron job** - Poll for unanswered messages every minute
   - Pros: More reliable, easier to debug
   - Cons: Higher latency, more database load

2. **Client-side only** - Keep current client-side approach
   - Pros: Simpler, no backend changes
   - Cons: Requires client to be online, no background processing

3. **Message queue** - Use a dedicated message queue (e.g., pgmq)
   - Pros: More scalable, better error handling
   - Cons: More complex, additional infrastructure

## Conclusion

The backend trigger implementation provides a **reliable, scalable, and non-blocking** way to automatically generate AI responses when users send messages. It leverages Supabase's built-in features (`pg_net`, triggers, Edge Functions) to create a seamless experience without requiring any client-side changes.

The implementation follows best practices:

- ✅ Non-blocking execution
- ✅ Comprehensive error handling
- ✅ Loop prevention
- ✅ Detailed logging
- ✅ Security considerations
- ✅ Performance optimization

Users can now send messages and receive AI responses automatically, without any manual intervention or client-side polling.
