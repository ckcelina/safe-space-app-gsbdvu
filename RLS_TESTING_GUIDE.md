
# RLS Testing Guide

## Pre-Deployment Testing

### 1. Development Environment Tests

#### Test 1: Memory Capture
**Objective**: Verify memories are captured and saved to `person_memories` table

**Steps**:
1. Log in to the app
2. Navigate to a person's chat
3. Send a message with factual content:
   - "Dad was born in 1965"
   - "Mom has diabetes"
   - "Sister got married last year"
4. Check console logs for memory capture success
5. Navigate to Memories screen
6. Verify memories appear in the list

**Expected Result**:
```
[MemoryCapture] 🧠 STARTING MEMORY CAPTURE
[MemoryCapture] ✅ Extracted 1 factual statement(s)
[MemoryCapture] ✅ Upsert successful: 1 memories affected
```

**Pass Criteria**:
- ✅ Console shows memory capture success
- ✅ Memory appears in Memories screen
- ✅ Memory has correct category and content

---

#### Test 2: User Isolation
**Objective**: Verify users cannot see each other's memories

**Steps**:
1. Log in as User A (user-a@example.com)
2. Create a person "Dad"
3. Send message: "Dad was born in 1965"
4. Verify memory appears in Memories screen
5. Log out
6. Log in as User B (user-b@example.com)
7. Create a person "Dad" (same name, different person)
8. Navigate to Memories screen for User B's "Dad"
9. Verify NO memories from User A appear

**Expected Result**:
- User A sees their own memories
- User B sees empty state (no memories)
- No cross-user data leakage

**Pass Criteria**:
- ✅ User A's memories are visible to User A only
- ✅ User B cannot see User A's memories
- ✅ Each user has isolated data

---

#### Test 3: RLS Policy Enforcement
**Objective**: Verify RLS policies block unauthorized access

**Steps**:
1. Log in as User A
2. Note User A's ID from console logs
3. Open Supabase SQL Editor
4. Try to query User A's memories as anonymous:
   ```sql
   SELECT * FROM person_memories 
   WHERE user_id = 'user-a-uuid-here';
   ```
5. Verify query returns 0 rows (blocked by RLS)
6. Set JWT claims to User A:
   ```sql
   SET request.jwt.claims.sub = 'user-a-uuid-here';
   SELECT * FROM person_memories 
   WHERE user_id = 'user-a-uuid-here';
   ```
7. Verify query returns User A's memories

**Expected Result**:
- Anonymous query: 0 rows (blocked)
- Authenticated query: User A's memories (allowed)

**Pass Criteria**:
- ✅ RLS blocks anonymous access
- ✅ RLS allows authenticated user access
- ✅ Policies enforce user isolation

---

#### Test 4: Continuity Toggle
**Objective**: Verify "Continue conversations" toggle controls memory capture

**Steps**:
1. Log in and navigate to Memories screen
2. Verify "Continue conversations" toggle is ON
3. Go back to chat
4. Send message: "Dad loves fishing"
5. Verify memory is captured (check console)
6. Go to Memories screen
7. Turn OFF "Continue conversations" toggle
8. Go back to chat
9. Send message: "Dad hates broccoli"
10. Verify memory is NOT captured (check console)
11. Go to Memories screen
12. Verify only "loves fishing" memory exists (not "hates broccoli")

**Expected Result**:
```
[MemoryCapture] Continuity enabled: true
[MemoryCapture] ✅ Extracted 1 factual statement(s)

[MemoryCapture] Continuity enabled: false
[MemoryCapture] ⏸️  Continuity disabled, skipping memory capture
```

**Pass Criteria**:
- ✅ Memories captured when toggle is ON
- ✅ Memories NOT captured when toggle is OFF
- ✅ Existing memories remain visible regardless of toggle

---

#### Test 5: Performance
**Objective**: Verify queries are fast with indexes

**Steps**:
1. Create 50+ memories for a person
2. Navigate to Memories screen
3. Measure load time (should be < 500ms)
4. Check Supabase dashboard for query performance
5. Verify indexes are being used

**Expected Result**:
- Fast load times (< 500ms)
- Indexes used in query plan
- No full table scans

**Pass Criteria**:
- ✅ Memories load quickly
- ✅ No performance degradation with more data
- ✅ Indexes are utilized

---

### 2. TestFlight Environment Tests

#### Test 6: Production Authentication
**Objective**: Verify authentication works in TestFlight

**Steps**:
1. Install TestFlight build
2. Sign up with new account
3. Verify email confirmation flow
4. Log in with credentials
5. Create a person
6. Send messages
7. Verify memories are captured
8. Log out and log back in
9. Verify memories persist

**Expected Result**:
- Smooth authentication flow
- Memories persist across sessions
- No authentication errors

**Pass Criteria**:
- ✅ Sign up works
- ✅ Login works
- ✅ Session persists
- ✅ Memories visible after re-login

---

#### Test 7: Production Memory Capture
**Objective**: Verify memory capture works in production environment

**Steps**:
1. Open TestFlight app
2. Log in
3. Navigate to chat
4. Send multiple messages with facts:
   - "Dad was born in 1965"
   - "Mom has diabetes"
   - "Sister lives in New York"
5. Navigate to Memories screen
6. Verify all memories appear
7. Verify memories are grouped correctly
8. Verify dates are correct

**Expected Result**:
- All memories captured
- Correct grouping by category
- Accurate timestamps

**Pass Criteria**:
- ✅ All factual statements captured
- ✅ Memories grouped by category
- ✅ Timestamps are accurate

---

#### Test 8: Production RLS Isolation
**Objective**: Verify RLS works in production

**Steps**:
1. Create Account A in TestFlight
2. Create memories for "Dad"
3. Log out
4. Create Account B in TestFlight
5. Create person "Dad" (same name)
6. Verify Account B sees no memories
7. Create memories for Account B's "Dad"
8. Log out and log back in as Account A
9. Verify Account A still sees only their memories

**Expected Result**:
- Complete data isolation
- No cross-account access
- Memories persist correctly

**Pass Criteria**:
- ✅ Account A cannot see Account B's data
- ✅ Account B cannot see Account A's data
- ✅ Each account has isolated memories

---

### 3. Edge Case Tests

#### Test 9: Duplicate Prevention
**Objective**: Verify duplicate memories are not created

**Steps**:
1. Send message: "Dad was born in 1965"
2. Wait for memory to be captured
3. Send same message again: "Dad was born in 1965"
4. Check Memories screen
5. Verify only ONE memory exists (not two)

**Expected Result**:
```
[MemoryCapture] Upsert successful: 1 memories affected
[MemoryCapture] Upsert successful: 1 memories affected (updated existing)
```

**Pass Criteria**:
- ✅ No duplicate memories created
- ✅ Existing memory updated (not duplicated)
- ✅ Unique constraint enforced

---

#### Test 10: Error Handling
**Objective**: Verify errors don't crash the app

**Steps**:
1. Turn off internet connection
2. Send a message
3. Verify app doesn't crash
4. Turn on internet connection
5. Send another message
6. Verify memory is captured

**Expected Result**:
- App remains functional
- Graceful error handling
- Recovery after connection restored

**Pass Criteria**:
- ✅ No crashes on network errors
- ✅ User-friendly error messages
- ✅ Automatic recovery

---

#### Test 11: Large Dataset
**Objective**: Verify app handles many memories

**Steps**:
1. Create 100+ memories for a person
2. Navigate to Memories screen
3. Verify all memories load
4. Scroll through list
5. Verify smooth scrolling
6. Search/filter memories
7. Verify performance remains good

**Expected Result**:
- All memories load
- Smooth scrolling
- No lag or freezing

**Pass Criteria**:
- ✅ Handles 100+ memories
- ✅ Smooth UI performance
- ✅ No memory leaks

---

#### Test 12: Session Expiry
**Objective**: Verify app handles expired sessions

**Steps**:
1. Log in
2. Wait for session to expire (or manually expire in Supabase)
3. Try to send a message
4. Verify app prompts for re-login
5. Log in again
6. Verify memories are still accessible

**Expected Result**:
- Graceful session expiry handling
- Prompt for re-authentication
- Data persists after re-login

**Pass Criteria**:
- ✅ Session expiry detected
- ✅ User prompted to re-login
- ✅ Data accessible after re-auth

---

## Automated Testing

### SQL Test Queries

#### Check RLS Policies
```sql
-- Should return 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('person_memories', 'memories')
ORDER BY tablename, cmd;
```

#### Check Indexes
```sql
-- Should return all performance indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('person_memories', 'memories')
  AND schemaname = 'public'
ORDER BY tablename, indexname;
```

#### Test RLS as User
```sql
-- Set user context
SET request.jwt.claims.sub = 'user-uuid-here';

-- Should return only user's memories
SELECT COUNT(*) FROM person_memories 
WHERE user_id = 'user-uuid-here';

-- Should return 0 (blocked by RLS)
SELECT COUNT(*) FROM person_memories 
WHERE user_id != 'user-uuid-here';
```

#### Check Memory Counts
```sql
-- Count memories per user
SELECT user_id, COUNT(*) as memory_count
FROM person_memories
GROUP BY user_id
ORDER BY memory_count DESC;
```

---

## Performance Benchmarks

### Target Metrics
- Memory capture: < 100ms
- Memory load: < 500ms
- Query execution: < 50ms
- UI render: < 100ms

### Monitoring Queries
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%person_memories%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'person_memories'
ORDER BY idx_scan DESC;
```

---

## Rollback Plan

### If Issues Found in Production

#### 1. Disable Memory Capture
```typescript
// In lib/memoryCapture.ts
export async function captureMemoriesFromMessage(...) {
  // EMERGENCY DISABLE
  console.log('[MemoryCapture] Temporarily disabled');
  return;
  
  // ... rest of code
}
```

#### 2. Revert RLS Policies
```sql
-- Revert to old policies if needed
DROP POLICY IF EXISTS "Users can view their own memories" ON person_memories;
-- ... recreate old policies
```

#### 3. Rollback Migration
```sql
-- If migration causes issues
-- Contact Supabase support for migration rollback
```

---

## Sign-Off Checklist

### Development
- [ ] All unit tests pass
- [ ] Memory capture works
- [ ] User isolation verified
- [ ] RLS policies correct
- [ ] Indexes created
- [ ] Performance acceptable

### TestFlight
- [ ] Authentication works
- [ ] Memory capture works
- [ ] User isolation works
- [ ] No crashes
- [ ] Performance good
- [ ] Error handling graceful

### Production
- [ ] All TestFlight tests pass
- [ ] Monitoring in place
- [ ] Rollback plan ready
- [ ] Support team notified
- [ ] Documentation updated

---

## Support Contacts

- **Database Issues**: Check Supabase dashboard logs
- **RLS Issues**: Review `RLS_QUICK_REFERENCE.md`
- **Performance Issues**: Check indexes and query plans
- **Authentication Issues**: Verify session and JWT

---

**Last Updated**: 2025-01-XX  
**Version**: 1.0  
**Status**: Ready for Testing
