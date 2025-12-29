
# AI Backend Trigger - Deployment Checklist

Use this checklist to verify the AI backend trigger is properly deployed and configured.

## Pre-Deployment

- [ ] **Backup database** (recommended before any schema changes)
- [ ] **Review migration scripts** in `AI_BACKEND_TRIGGER_IMPLEMENTATION.md`
- [ ] **Notify team** of deployment window

## Deployment Steps

### 1. Database Setup

- [x] **Enable pg_net extension**
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_net;
  ```
  Status: ✅ Already enabled (version 0.19.5)

- [x] **Create trigger function**
  ```sql
  -- See migration: add_ai_response_trigger
  ```
  Status: ✅ Created

- [x] **Create trigger**
  ```sql
  -- See migration: add_ai_response_trigger
  ```
  Status: ✅ Created

- [x] **Update trigger configuration**
  ```sql
  -- See migration: update_ai_response_trigger_config
  ```
  Status: ✅ Updated

### 2. Edge Function Verification

- [ ] **Verify Edge Function is deployed**
  - Go to: Supabase Dashboard → Edge Functions
  - Check: `generate-ai-response` is listed and active
  - Status: ___________

- [ ] **Verify environment variables**
  - `OPENAI_API_KEY` is set
  - `SUPABASE_URL` is set
  - `SUPABASE_SERVICE_ROLE_KEY` is set
  - Status: ___________

- [ ] **Test Edge Function manually**
  ```bash
  curl -X POST https://zjzvkxvahrbuuyzjzxol.supabase.co/functions/v1/generate-ai-response \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "test-user-id",
      "personId": "test-person-id",
      "personName": "Test Person",
      "personRelationshipType": "Friend",
      "messages": [{"role": "user", "content": "Hello", "createdAt": "2025-01-29T00:00:00Z"}],
      "currentSubject": "General",
      "aiToneId": "balanced_blend",
      "aiScienceMode": false,
      "continuity_enabled": true
    }'
  ```
  - Expected: 200 OK with `{ success: true, reply: "..." }`
  - Status: ___________

### 3. Database Verification

- [ ] **Check trigger exists**
  ```sql
  SELECT trigger_name, event_manipulation, action_timing
  FROM information_schema.triggers
  WHERE trigger_name = 'ai_response_trigger';
  ```
  - Expected: 1 row with `INSERT`, `AFTER`
  - Status: ___________

- [ ] **Check trigger function exists**
  ```sql
  SELECT routine_name
  FROM information_schema.routines
  WHERE routine_name = 'invoke_ai_response_trigger';
  ```
  - Expected: 1 row
  - Status: ___________

- [ ] **Check pg_net is working**
  ```sql
  SELECT net.http_get('https://httpbin.org/get') as request_id;
  ```
  - Expected: Returns a request_id (bigint)
  - Status: ___________

- [ ] **Check pg_net response**
  ```sql
  SELECT * FROM net._http_response ORDER BY created DESC LIMIT 1;
  ```
  - Expected: status_code = 200
  - Status: ___________

## Post-Deployment Testing

### Test 1: End-to-End Flow

- [ ] **Insert test user message**
  ```sql
  INSERT INTO messages (user_id, person_id, role, content, subject)
  VALUES (
    '<real-user-id>',
    '<real-person-id>',
    'user',
    'This is a test message for the AI trigger.',
    'General'
  );
  ```
  - Status: ___________

- [ ] **Wait 10 seconds**

- [ ] **Check assistant message was created**
  ```sql
  SELECT id, role, content, created_at
  FROM messages
  WHERE person_id = '<real-person-id>'
  ORDER BY created_at DESC
  LIMIT 2;
  ```
  - Expected: 2 rows (user + assistant)
  - Status: ___________

- [ ] **Check pg_net response**
  ```sql
  SELECT status_code, error_msg
  FROM net._http_response
  ORDER BY created DESC
  LIMIT 1;
  ```
  - Expected: status_code = 200, error_msg = null
  - Status: ___________

### Test 2: Client Integration

- [ ] **Open Safe Space app**
  - Status: ___________

- [ ] **Navigate to a chat**
  - Status: ___________

- [ ] **Send a test message**
  - Message: "Hello, can you help me?"
  - Status: ___________

- [ ] **Verify user message appears immediately**
  - Status: ___________

- [ ] **Verify typing indicator shows**
  - Status: ___________

- [ ] **Verify AI response appears within 10 seconds**
  - Status: ___________

- [ ] **Verify no errors in console**
  - Status: ___________

### Test 3: Error Handling

- [ ] **Test with invalid person_id**
  ```sql
  INSERT INTO messages (user_id, person_id, role, content, subject)
  VALUES (
    '<real-user-id>',
    '00000000-0000-0000-0000-000000000000',
    'user',
    'Test with invalid person',
    'General'
  );
  ```
  - Expected: Message saves, trigger logs warning, no crash
  - Status: ___________

- [ ] **Check Postgres logs for warning**
  - Go to: Supabase Dashboard → Database → Logs
  - Look for: "AI response trigger failed"
  - Status: ___________

### Test 4: Performance

- [ ] **Send 5 messages rapidly**
  - Expected: All messages save immediately
  - Expected: All AI responses arrive within 15 seconds
  - Status: ___________

- [ ] **Check pg_net queue is empty**
  ```sql
  SELECT COUNT(*) FROM net.http_request_queue;
  ```
  - Expected: 0 (all requests processed)
  - Status: ___________

## Monitoring Setup

- [ ] **Set up daily health check**
  - Create cron job or manual reminder
  - Run health check SQL from `AI_TRIGGER_QUICK_REFERENCE.md`
  - Status: ___________

- [ ] **Set up alerts for failed requests**
  - Monitor `net._http_response` for status_code >= 400
  - Status: ___________

- [ ] **Document monitoring procedures**
  - Add to team wiki or runbook
  - Status: ___________

## Rollback Plan

If issues occur, follow these steps:

### Option 1: Disable Trigger (Quick)

```sql
ALTER TABLE messages DISABLE TRIGGER ai_response_trigger;
```

This keeps the trigger in place but stops it from firing.

### Option 2: Drop Trigger (Clean)

```sql
DROP TRIGGER IF EXISTS ai_response_trigger ON messages;
```

This removes the trigger completely. The function remains.

### Option 3: Drop Everything (Full Rollback)

```sql
DROP TRIGGER IF EXISTS ai_response_trigger ON messages;
DROP FUNCTION IF EXISTS invoke_ai_response_trigger();
```

This removes both the trigger and function.

**Note:** After rollback, the client-side Edge Function calls will still work, so the app will continue functioning normally.

## Post-Deployment

- [ ] **Update documentation**
  - Mark deployment as complete
  - Document any issues encountered
  - Status: ___________

- [ ] **Notify team of completion**
  - Send deployment summary
  - Share monitoring links
  - Status: ___________

- [ ] **Monitor for 24 hours**
  - Check logs daily
  - Review error rates
  - Status: ___________

- [ ] **Conduct retrospective**
  - What went well?
  - What could be improved?
  - Status: ___________

## Sign-Off

- **Deployed by:** ___________________
- **Date:** ___________________
- **Time:** ___________________
- **Verified by:** ___________________
- **Status:** ☐ Success ☐ Partial ☐ Rollback

## Notes

_Add any additional notes, issues, or observations here:_

---

---

---

## Appendix: Useful Commands

### View All Triggers

```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### View All Functions

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### View pg_net Configuration

```sql
SELECT name, setting
FROM pg_settings
WHERE name LIKE 'pg_net%';
```

### Restart pg_net Worker

```sql
SELECT net.worker_restart();
```

### Clear pg_net Response History

```sql
DELETE FROM net._http_response WHERE created < NOW() - INTERVAL '1 hour';
```
