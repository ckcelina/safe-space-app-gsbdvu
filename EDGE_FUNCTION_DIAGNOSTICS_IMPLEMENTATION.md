
# Edge Function Diagnostics Implementation (DEV-ONLY)

## Overview
Added DEV-only diagnostics to help quickly identify the root cause of Edge Function failures without impacting production behavior.

## Changes Made

### 1. Enhanced `lib/supabase/invokeEdge.ts`

#### Compact Diagnostic Logging
Added a single-line compact log on failure that includes:
- **Normalized error code**: `EDGE_AUTH`, `TIMEOUT`, `FUNCTIONS_HTTP_ERROR`, etc.
- **HTTP status**: The actual HTTP status code if available (e.g., 401, 403, 502)
- **Duration in milliseconds**: How long the request took before failing

**Format:**
```
[Edge] code=<normalized_code> status=<http_status_if_any> duration_ms=<ms>
```

**Examples:**
```
[Edge] code=EDGE_AUTH status=401 duration_ms=1234
[Edge] code=TIMEOUT status=none duration_ms=20001
[Edge] code=FUNCTIONS_HTTP_ERROR status=502 duration_ms=5678
```

#### Safety Guarantees
- ✅ Only logs when `__DEV__ === true`
- ✅ Never logs tokens, keys, or headers
- ✅ Minimal overhead (single line per failure)
- ✅ Production builds completely unaffected

#### Implementation Details
- Tracks request start time with `Date.now()`
- Calculates duration on error: `Date.now() - startTime`
- Normalizes error codes for consistency
- Detects auth errors (401/403) and sets code to `EDGE_AUTH`

### 2. Enhanced `app/(tabs)/(home)/chat.tsx`

#### Auth Error Hint
Added a clear, dev-only hint when auth errors occur:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 EDGE AUTH FAILED - CHECK:
   1. SUPABASE_URL is correct
   2. ANON_KEY is correct
   3. Edge Function name is correct
   4. RLS policies allow access
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Trigger Conditions
The hint is shown when:
- `__DEV__ === true` AND
- Error code is `EDGE_AUTH` OR
- HTTP status is 401 or 403

#### Safety Guarantees
- ✅ Only shown in development builds
- ✅ Never shown in production/TestFlight
- ✅ Does not spam logs for other error types
- ✅ Provides actionable debugging steps

## Usage

### Quick Diagnosis
When an Edge Function fails in development, check the console:

1. **Look for the compact log line:**
   ```
   [Edge] code=EDGE_AUTH status=401 duration_ms=1234
   ```

2. **Identify the issue:**
   - `code=EDGE_AUTH` + `status=401/403` → Auth/RLS issue
   - `code=TIMEOUT` + `duration_ms=20000+` → Function took too long
   - `code=FUNCTIONS_HTTP_ERROR` + `status=502/503/504` → Server error
   - `code=UNEXPECTED_ERROR` → Network or client-side issue

3. **If auth error, check the hint:**
   The console will show the detailed checklist for auth issues.

### Example Scenarios

#### Scenario 1: Missing ANON_KEY
```
[Edge] code=EDGE_AUTH status=401 duration_ms=234
🔐 EDGE AUTH FAILED - CHECK:
   1. SUPABASE_URL is correct
   2. ANON_KEY is correct  ← Check this!
   ...
```

#### Scenario 2: Timeout
```
[Edge] code=TIMEOUT status=none duration_ms=20001
```
→ Function took longer than 20 seconds

#### Scenario 3: Server Error
```
[Edge] code=FUNCTIONS_HTTP_ERROR status=502 duration_ms=5678
```
→ Edge Function crashed or Supabase is having issues

#### Scenario 4: Network Issue
```
[Edge] code=UNEXPECTED_ERROR status=none duration_ms=123
```
→ Network connectivity problem

## Testing

### Test Auth Error Hint
1. Temporarily break your ANON_KEY in `lib/supabase.ts`
2. Run the app in Expo Go (dev mode)
3. Try sending a chat message
4. Check console for the auth error hint

### Test Timeout Logging
1. Create an Edge Function that sleeps for 25 seconds
2. Call it from the app
3. Check console for timeout diagnostic

### Test Production Safety
1. Build a production/TestFlight build
2. Trigger an Edge Function error
3. Verify no diagnostic logs appear
4. Verify no auth hint appears

## Benefits

### Before
```
[invokeEdgeSafe] generate-ai-response error (attempt 1): {
  name: 'FunctionsHttpError',
  message: 'Edge Function returned an error',
  status: 401,
  statusText: 'Unauthorized'
}
```
→ Hard to quickly identify the root cause

### After
```
[Edge] code=EDGE_AUTH status=401 duration_ms=1234
🔐 EDGE AUTH FAILED - CHECK:
   1. SUPABASE_URL is correct
   2. ANON_KEY is correct
   3. Edge Function name is correct
   4. RLS policies allow access
```
→ Immediately clear what to check

## Acceptance Criteria

✅ **Can distinguish timeout vs auth vs network quickly**
- Compact log line shows error type and duration
- Auth errors trigger specific hint

✅ **No sensitive info printed**
- Never logs tokens, keys, or headers
- Only logs error codes and status codes

✅ **Production unchanged**
- All diagnostics wrapped in `__DEV__` checks
- Zero impact on production builds

## Files Modified

1. `lib/supabase/invokeEdge.ts`
   - Added duration tracking
   - Added compact diagnostic logging
   - Enhanced error code normalization

2. `app/(tabs)/(home)/chat.tsx`
   - Added auth error hint
   - Enhanced error status tracking

## Related Documentation

- [EDGE_FUNCTION_ERROR_FIX_SUMMARY.md](./EDGE_FUNCTION_ERROR_FIX_SUMMARY.md) - Previous error handling improvements
- [EDGE_FUNCTION_AUTH_FIX_SUMMARY.md](./EDGE_FUNCTION_AUTH_FIX_SUMMARY.md) - Auth error handling
- [DEBUG_INFO_VISIBILITY_IMPLEMENTATION.md](./DEBUG_INFO_VISIBILITY_IMPLEMENTATION.md) - Debug info visibility rules
