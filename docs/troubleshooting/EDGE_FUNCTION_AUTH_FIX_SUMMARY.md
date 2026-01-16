
# Edge Function Auth Headers Fix - Complete Implementation

## Problem
Edge Function calls were failing with "FunctionsHttpError: Edge Function returned a non-2xx status code" because:
1. Auth headers (Authorization + apikey) were not being sent correctly
2. Error logs were not actionable (missing status codes and response bodies)
3. No sanity check to verify auth token presence

## Solution Implemented

### 1. Created New Helper: `lib/supabase/invokeEdgeFunction.ts`

This is the **single source of truth** for all Edge Function calls. It:

#### ✅ Sends Correct Auth Headers
```typescript
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
};

// Add Authorization header if we have an access token
if (accessToken) {
  headers['Authorization'] = `Bearer ${accessToken}`;
}
```

#### ✅ Gets Current Session Token
```typescript
const { data: sessionData } = await supabase.auth.getSession();
const accessToken = sessionData?.session?.access_token;
```

#### ✅ Provides Actionable Error Logs
```typescript
console.log(`[invokeEdgeFunction] ${fnName} failed:`);
console.log(`  - Function name: ${fnName}`);
console.log(`  - Status: ${status || 'unknown'}`);
console.log(`  - Error name: ${error.name || 'unknown'}`);
console.log(`  - Error message: ${error.message || 'unknown'}`);
console.log(`  - Raw response: ${rawResponse.substring(0, 500)}`);
```

#### ✅ DEV-Only Sanity Check
```typescript
if (__DEV__) {
  console.log(`[invokeEdgeFunction] Calling ${fnName}`);
  console.log(`[invokeEdgeFunction] Access token present: ${!!accessToken}`);
}
```

#### ✅ Never Crashes
- All errors are caught and returned as `{ data: null, error: Error }`
- No uncaught exceptions
- Always returns a result object

### 2. Updated Chat Screen (`app/(tabs)/(home)/chat.tsx`)

**Changed:**
```typescript
// OLD
import { invokeEdge } from '@/lib/supabase/invokeEdge';
const { data: aiResponse, error: invokeError } = await invokeEdge('generate-ai-response', {...});

// NEW
import { invokeEdgeFunction } from '@/lib/supabase/invokeEdgeFunction';
const { data: aiResponse, error: invokeError } = await invokeEdgeFunction('generate-ai-response', {...});
```

**Error Handling:**
- If Edge Function fails: Shows friendly message "I'm having trouble responding right now. Please try again."
- Logs full error details (status, message, response body)
- Never crashes the chat flow

### 3. Updated Memory Extraction (`lib/memory/extractMemories.ts`)

**Changed:**
```typescript
// OLD
import { invokeEdge } from '../supabase/invokeEdge';
const { data, error: invokeError } = await invokeEdge('extract-memories', {...});

// NEW
import { invokeEdgeFunction } from '../supabase/invokeEdgeFunction';
const { data, error: invokeError } = await invokeEdgeFunction('extract-memories', {...});
```

**Error Handling:**
- If Edge Function fails: Returns `{ error: 'edge_function_invocation_error' }`
- Never throws or crashes
- Chat continues normally even if memory extraction fails

## Key Features

### 🔐 Proper Authentication
- ✅ Gets current session token from `supabase.auth.getSession()`
- ✅ Sends `Authorization: Bearer ${access_token}` header
- ✅ Sends `apikey: ${SUPABASE_ANON_KEY}` header
- ✅ Sends `Content-Type: application/json` header

### 📊 Actionable Error Logs
When an Edge Function fails, you now see:
```
[invokeEdgeFunction] generate-ai-response failed:
  - Function name: generate-ai-response
  - Status: 401
  - Error name: FunctionsHttpError
  - Error message: Edge Function returned a non-2xx status code
  - Raw response: {"error":"Unauthorized","message":"Missing or invalid auth token"}
```

### 🔍 Sanity Check (DEV Only)
```
[invokeEdgeFunction] Calling generate-ai-response
[invokeEdgeFunction] Access token present: true
```

This helps confirm:
- The function is being called
- Auth token is available (or not)
- **Does NOT log the actual token** (security)

### 🛡️ Fail-Safe Design
- **Never crashes** - all errors are caught and returned
- **Never throws** - always returns a result object
- **Graceful degradation** - chat continues even if AI/memory fails
- **User-friendly messages** - shows helpful error messages to users

## Testing Checklist

### ✅ Chat Screen
- [ ] Send a message in person chat
- [ ] Verify message is sent and AI responds
- [ ] Check logs for sanity check (DEV mode)
- [ ] Verify no "FunctionsHttpError" errors
- [ ] If error occurs, verify actionable logs appear

### ✅ Memory Extraction
- [ ] Send a message with factual information
- [ ] Check memories screen to verify extraction worked
- [ ] Check logs for sanity check (DEV mode)
- [ ] Verify no "FunctionsHttpError" errors
- [ ] If error occurs, verify chat continues normally

### ✅ Error Scenarios
- [ ] Test with no internet connection
- [ ] Test with expired session token
- [ ] Verify friendly error messages appear
- [ ] Verify detailed logs appear in console
- [ ] Verify app doesn't crash

## Files Changed

1. **Created:** `lib/supabase/invokeEdgeFunction.ts` (NEW)
   - Single helper for all Edge Function calls
   - Proper auth headers
   - Actionable error logging
   - Sanity check logging

2. **Updated:** `app/(tabs)/(home)/chat.tsx`
   - Changed import from `invokeEdge` to `invokeEdgeFunction`
   - Updated function call to use new helper

3. **Updated:** `lib/memory/extractMemories.ts`
   - Changed import from `invokeEdge` to `invokeEdgeFunction`
   - Updated function call to use new helper
   - Improved error handling

## Migration Notes

### Old Helper (`lib/supabase/invokeEdge.ts`)
- ❌ Did NOT send auth headers
- ❌ Did NOT get session token
- ❌ Limited error logging
- ❌ No sanity check

### New Helper (`lib/supabase/invokeEdgeFunction.ts`)
- ✅ Sends all required auth headers
- ✅ Gets current session token
- ✅ Comprehensive error logging
- ✅ DEV-only sanity check
- ✅ Never crashes

## Next Steps

1. **Test thoroughly** - Use the testing checklist above
2. **Monitor logs** - Watch for the sanity check logs in DEV mode
3. **Verify auth** - Ensure "Access token present: true" appears
4. **Check errors** - If errors occur, verify actionable logs appear
5. **Consider deprecating** - The old `invokeEdge.ts` helper can be removed once confirmed working

## Troubleshooting

### If you still see "FunctionsHttpError"
1. Check logs for sanity check: "Access token present: true/false"
2. If false: Session may be expired - try logging out and back in
3. Check Edge Function logs in Supabase dashboard
4. Verify SUPABASE_ANON_KEY is correct in `invokeEdgeFunction.ts`

### If auth token is missing
1. User may need to log out and log back in
2. Check `supabase.auth.getSession()` is working
3. Verify session is being persisted correctly

### If errors are not actionable
1. Verify you're using `invokeEdgeFunction` (not `invokeEdge`)
2. Check console logs for detailed error information
3. Look for "Raw response" in logs for Edge Function response body

## Success Criteria

✅ No more "FunctionsHttpError: Edge Function returned a non-2xx status code" errors
✅ Sanity check logs appear in DEV mode
✅ Actionable error logs when failures occur
✅ Chat continues normally even if AI/memory fails
✅ User sees friendly error messages (not technical errors)
