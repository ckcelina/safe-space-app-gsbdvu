
# RLS Quick Reference Card

## Memory Tables Overview

### `person_memories` (ACTIVE)
- **Purpose**: Stores user memories in key-value format
- **Schema**: `user_id`, `person_id`, `category`, `key`, `value`, `importance`, `confidence`
- **RLS**: ✅ Enabled with `user_id = auth.uid()` policies
- **Indexes**: ✅ Optimized for queries
- **Used By**: Memories screen, memory capture, AI context

### `memories` (LEGACY)
- **Purpose**: Old memory storage (deprecated)
- **Schema**: `user_id`, `person_id`, `category`, `content`, `memory_key`
- **RLS**: ✅ Enabled (updated for security)
- **Status**: Not actively used (0 rows)
- **Note**: Can be dropped in future cleanup

## RLS Policy Pattern

### Correct Pattern (Optimized)
```sql
CREATE POLICY "Users can view their own memories"
ON person_memories
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

### Key Points
- ✅ Use `{authenticated}` role (not `{public}`)
- ✅ Use `(SELECT auth.uid())` for caching
- ✅ Separate policies for SELECT, INSERT, UPDATE, DELETE
- ✅ Always filter by `user_id = auth.uid()`

## App Code Patterns

### Reading Memories
```typescript
// ✅ CORRECT: Filter by authenticated user
const { data, error } = await supabase
  .from('person_memories')
  .select('*')
  .eq('user_id', currentUser.id)  // From AuthContext
  .eq('person_id', personId);
```

### Writing Memories
```typescript
// ✅ CORRECT: Always set user_id
const { data, error } = await supabase
  .from('person_memories')
  .insert({
    user_id: currentUser.id,  // From AuthContext
    person_id: personId,
    category: 'health',
    key: 'medical_condition',
    value: 'Has diabetes',
    importance: 5,
    confidence: 0.8,
  });
```

### Upsert with Conflict Resolution
```typescript
// ✅ CORRECT: Use unique constraint for deduplication
const { data, error } = await supabase
  .from('person_memories')
  .upsert(records, {
    onConflict: 'user_id,person_id,key',
    ignoreDuplicates: false,  // Update on conflict
  });
```

## Common Mistakes to Avoid

### ❌ DON'T: Use service role key in client code
```typescript
// ❌ WRONG: Bypasses RLS
const supabase = createClient(url, serviceRoleKey);
```

### ❌ DON'T: Forget to set user_id
```typescript
// ❌ WRONG: Missing user_id
await supabase.from('person_memories').insert({
  person_id: personId,
  value: 'Some memory',
});
```

### ❌ DON'T: Use person name instead of ID
```typescript
// ❌ WRONG: Using name instead of UUID
.eq('person_id', 'Dad')  // Should be UUID
```

### ❌ DON'T: Query without user_id filter
```typescript
// ❌ WRONG: No user_id filter (RLS will block anyway)
await supabase
  .from('person_memories')
  .select('*')
  .eq('person_id', personId);  // Missing user_id filter
```

## Authentication Flow

### 1. User Signs In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### 2. Session Established
- Supabase stores session in AsyncStorage
- Session includes JWT with user ID
- JWT automatically sent with all requests

### 3. RLS Policies Check
- Supabase extracts `auth.uid()` from JWT
- Compares with `user_id` in query
- Allows/denies based on policy

### 4. App Gets User ID
```typescript
const { currentUser } = useAuth();
const userId = currentUser.id;  // Use this for queries
```

## Debugging RLS Issues

### Check Current User
```typescript
console.log('[Debug] Current user:', currentUser?.id);
console.log('[Debug] Email:', currentUser?.email);
```

### Check Query Parameters
```typescript
console.log('[Debug] Query params:', {
  userId: currentUser.id,
  personId: personId,
  table: 'person_memories',
});
```

### Check RLS Policies
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE tablename = 'person_memories';
```

### Check Indexes
```sql
-- In Supabase SQL Editor
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'person_memories';
```

### Test RLS Directly
```sql
-- In Supabase SQL Editor (as authenticated user)
SET request.jwt.claims.sub = 'user-uuid-here';
SELECT * FROM person_memories WHERE user_id = 'user-uuid-here';
```

## Performance Tips

### 1. Use Indexes
- All `user_id` and `person_id` columns are indexed
- Composite indexes for common query patterns
- Ordering indexes for sorted results

### 2. Optimize Queries
```typescript
// ✅ GOOD: Use composite index
.eq('user_id', userId)
.eq('person_id', personId)
.order('updated_at', { ascending: false })

// ❌ BAD: No user_id filter (slow)
.eq('person_id', personId)
```

### 3. Limit Results
```typescript
// ✅ GOOD: Limit for pagination
.limit(25)
.range(0, 24)
```

### 4. Select Only Needed Columns
```typescript
// ✅ GOOD: Select specific columns
.select('id, value, category, updated_at')

// ❌ BAD: Select all columns when not needed
.select('*')
```

## Security Checklist

- [ ] All queries filter by `user_id = currentUser.id`
- [ ] All inserts set `user_id: currentUser.id`
- [ ] Using anon key (not service role key)
- [ ] RLS policies enabled on all tables
- [ ] Policies use `{authenticated}` role
- [ ] Policies use `(SELECT auth.uid())` pattern
- [ ] No hardcoded user IDs in code
- [ ] Person IDs are UUIDs (not names)
- [ ] Session is valid before queries
- [ ] Error handling doesn't expose sensitive data

## Quick Commands

### Check RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('person_memories', 'memories');
```

### View All Policies
```sql
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Count User's Memories
```sql
SELECT COUNT(*) 
FROM person_memories 
WHERE user_id = auth.uid();
```

### Test Policy Performance
```sql
EXPLAIN ANALYZE 
SELECT * FROM person_memories 
WHERE user_id = auth.uid() 
  AND person_id = 'person-uuid-here';
```

## Support Resources

- **Supabase RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security
- **RLS Performance**: https://github.com/GaryAustin1/RLS-Performance
- **Auth Helpers**: https://supabase.com/docs/guides/auth/auth-helpers
- **Project Dashboard**: https://supabase.com/dashboard/project/zjzvkxvahrbuuyzjzxol

## Emergency Fixes

### If RLS blocks legitimate access:
1. Verify user is authenticated
2. Check `currentUser.id` is set
3. Verify query includes `user_id` filter
4. Check RLS policies are correct

### If memories not saving:
1. Check console for errors
2. Verify `user_id` is set in insert
3. Check unique constraint conflicts
4. Verify RLS INSERT policy allows

### If performance is slow:
1. Check indexes exist
2. Add `.limit()` to queries
3. Use composite indexes
4. Monitor Supabase dashboard

---

**Last Updated**: 2025-01-XX  
**Migration**: `fix_rls_policies_and_indexes`  
**Status**: ✅ Production Ready
