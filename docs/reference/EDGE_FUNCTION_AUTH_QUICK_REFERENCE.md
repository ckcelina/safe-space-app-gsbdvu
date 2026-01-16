
# Edge Function Auth Fix - Quick Reference

## What Was Fixed
Edge Function calls now send proper auth headers and provide actionable error logs.

## New Helper Function

### Location
`lib/supabase/invokeEdgeFunction.ts`

### Usage
```typescript
import { invokeEdgeFunction } from '@/lib/supabase/invokeEdgeFunction';

const { data, error, status, raw } = await invokeEdgeFunction('function-name', {
  // your payload
});

if (error) {
  console.log('Function failed:', error.message);
  // Handle error gracefully
  return;
}

// Use data
console.log('Success:', data);
```

### What It Does
1. ✅ Gets current session token from `supabase.auth.getSession()`
2. ✅ Sends `Authorization: Bearer ${token}` header
3. ✅ Sends `apikey: ${SUPABASE_ANON_KEY}` header
4. ✅ Sends `Content-Type: application/json` header
5. ✅ Logs detailed error information (status, message, response body)
6. ✅ DEV-only sanity check: logs function name and token presence
7. ✅ Never crashes - always returns a result

## Updated Call Sites

### 1. Chat Screen (`app/(tabs)/(home)/chat.tsx`)
```typescript
// OLD
import { invokeEdge } from '@/lib/supabase/invokeEdge';

// NEW
import { invokeEdgeFunction } from '@/lib/supabase/invokeEdgeFunction';
```

### 2. Memory Extraction (`lib/memory/extractMemories.ts`)
```typescript
// OLD
import { invokeEdge } from '../supabase/invokeEdge';

// NEW
import { invokeEdgeFunction } from '../supabase/invokeEdgeFunction';
```

## Error Logs You'll See

### Success (DEV mode)
```
[invokeEdgeFunction] Calling generate-ai-response
[invokeEdgeFunction] Access token present: true
[invokeEdgeFunction] Invoking function: generate-ai-response
[invokeEdgeFunction] generate-ai-response succeeded
```

### Failure
```
[invokeEdgeFunction] Calling generate-ai-response
[invokeEdgeFunction] Access token present: true
[invokeEdgeFunction] Invoking function: generate-ai-response
[invokeEdgeFunction] generate-ai-response failed:
  - Function name: generate-ai-response
  - Status: 401
  - Error name: FunctionsHttpError
  - Error message: Edge Function returned a non-2xx status code
  - Raw response: {"error":"Unauthorized","message":"Missing or invalid auth token"}
```

## Sanity Check (DEV Only)

When you call an Edge Function in development mode, you'll see:
```
[invokeEdgeFunction] Calling function-name
[invokeEdgeFunction] Access token present: true
```

This confirms:
- ✅ The function is being called
- ✅ Auth token is available
- ❌ Does NOT log the actual token (security)

## Error Handling Pattern

### Chat Screen
```typescript
const { data: aiResponse, error: invokeError } = await invokeEdgeFunction('generate-ai-response', {...});

if (invokeError) {
  console.log('[Chat] AI function error:', invokeError);
  // Show friendly message to user
  appendMessage({
    type: 'assistant',
    text: "I'm having trouble responding right now. Please try again.",
  });
  return;
}

// Use aiResponse
```

### Memory Extraction
```typescript
const { data, error: invokeError } = await invokeEdgeFunction('extract-memories', {...});

if (invokeError) {
  console.log('[Memory Extraction] Edge Function error:', invokeError);
  // Return empty result - don't crash
  return { error: 'edge_function_invocation_error' };
}

// Use data
```

## Common Issues

### "Access token present: false"
**Cause:** User session expired or not logged in
**Fix:** User needs to log out and log back in

### "Status: 401"
**Cause:** Auth token is invalid or missing
**Fix:** Check Edge Function expects auth, verify token is being sent

### "Status: 500"
**Cause:** Edge Function internal error
**Fix:** Check Edge Function logs in Supabase dashboard

### Still seeing "FunctionsHttpError"
**Cause:** Using old `invokeEdge` helper
**Fix:** Update import to use `invokeEdgeFunction`

## Testing

1. **Send a chat message** - Verify AI responds
2. **Check DEV logs** - Look for sanity check logs
3. **Verify no errors** - No "FunctionsHttpError" messages
4. **Test memory extraction** - Send factual info, check memories screen
5. **Test error handling** - Disconnect internet, verify friendly error message

## Key Benefits

✅ **Proper Auth** - All required headers sent correctly
✅ **Actionable Logs** - Status codes, error messages, response bodies
✅ **Sanity Check** - Verify token presence in DEV mode
✅ **Never Crashes** - All errors caught and handled gracefully
✅ **User-Friendly** - Shows helpful messages, not technical errors
✅ **Consistent** - Single helper used by all Edge Function calls

## Files to Know

- `lib/supabase/invokeEdgeFunction.ts` - The new helper (use this)
- `lib/supabase/invokeEdge.ts` - The old helper (deprecated)
- `app/(tabs)/(home)/chat.tsx` - Chat screen (updated)
- `lib/memory/extractMemories.ts` - Memory extraction (updated)
