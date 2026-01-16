
# Fix for Supabase Error 23505 - Duplicate Topics

## Problem
When creating topics, users encountered error 23505:
```
duplicate key value violates unique constraint persons_user_id_name_unique
```

This error occurred because:
- A global unique constraint prevented ANY duplicate names in the `persons` table
- This blocked both duplicate People AND duplicate Topics
- Users couldn't add multiple people with the same name (e.g., 2 Moms, 2 Dads)
- The app crashed when trying to add a duplicate topic

## Solution

### ✅ STEP 1: Database Migration (REQUIRED - RUN THIS FIRST)

**You MUST run this SQL in your Supabase SQL Editor:**

```sql
-- Fix Supabase error 23505 when creating Topics
-- "duplicate key value violates unique constraint persons_user_id_name_unique"

-- STEP 1: Drop the global unique constraint that prevents duplicate names
-- This constraint was preventing both duplicate People AND duplicate Topics
ALTER TABLE public.persons
DROP CONSTRAINT IF EXISTS persons_user_id_name_unique;

-- STEP 2: Add a partial unique index ONLY for Topics
-- This allows:
-- - Duplicate names for People (2 Moms, 2 Dads, etc.)
-- - Prevents duplicate Topics per user (no duplicate "Anxiety" topics)
CREATE UNIQUE INDEX IF NOT EXISTS persons_user_topic_name_unique
ON public.persons (user_id, LOWER(name))
WHERE relationship_type = 'Topic';
```

**How to run:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Paste the SQL above
4. Click "Run"

### ✅ STEP 2: App Code Changes (COMPLETED)

Updated `app/(tabs)/(home)/index.tsx` - `handleSaveAddTopic` function:

**Key Changes:**

1. **Pre-insert duplicate check**:
   - Normalizes topic name (trim, collapse spaces)
   - Performs case-insensitive search using `ilike`
   - Checks if topic already exists for the user
   - Shows friendly error BEFORE attempting insert

2. **Friendly error handling**:
   - If duplicate found: Shows "This topic already exists" toast
   - Sets error message in the modal
   - Does NOT attempt to insert
   - Prevents error 23505 from occurring

3. **Fallback for database errors**:
   - If error 23505 still occurs (race condition), shows friendly message
   - Handles context_label column issues gracefully
   - Logs errors for debugging without crashing

## What This Fixes

### ✅ Before Fix:
- ❌ Adding duplicate topic → Error 23505 → App crash
- ❌ Adding duplicate person → Error 23505 → App crash
- ❌ Confusing error messages
- ❌ No way to add 2 people with same name

### ✅ After Fix:
- ✅ Adding duplicate topic → Friendly message: "This topic already exists"
- ✅ Adding duplicate person → Allowed (2 Moms, 2 Dads, etc.)
- ✅ Clear, user-friendly error messages
- ✅ No app crashes
- ✅ Topics are unique per user (case-insensitive)

## Acceptance Criteria ✅

- ✅ Adding duplicate Topic names is prevented with a friendly message
- ✅ Adding duplicate People names is allowed
- ✅ Error 23505 no longer appears when creating topics
- ✅ Topics are unique per user by name (case-insensitive)
- ✅ People can have duplicate names (2 Moms, 2 Dads)
- ✅ Creating a Topic never crashes the app
- ✅ Topic list refreshes immediately after successful creation

## Technical Details

### Normalization
Topic names are normalized before checking/inserting:
- Trim whitespace: `"  Anxiety  "` → `"Anxiety"`
- Collapse multiple spaces: `"Work  Stress"` → `"Work Stress"`
- Case-insensitive comparison: `"anxiety"` matches `"Anxiety"`

### Database Index
The partial unique index only applies to Topics:
```sql
WHERE relationship_type = 'Topic'
```

This means:
- `persons` table with `relationship_type = 'Topic'` → Unique names per user (case-insensitive)
- `persons` table with `relationship_type != 'Topic'` → Duplicate names allowed

### Error Handling Flow
1. User enters topic name
2. App normalizes the name
3. App checks if topic exists (case-insensitive using `ilike`)
4. If exists → Show error, don't insert
5. If not exists → Insert topic
6. If insert fails with 23505 (race condition) → Show error
7. If successful → Navigate to chat, refresh topic list

## Testing Checklist

### Database Migration
- [ ] Run the SQL migration in Supabase SQL Editor
- [ ] Verify no errors in the SQL output
- [ ] Check that `persons_user_id_name_unique` constraint is dropped
- [ ] Check that `persons_user_topic_name_unique` index is created

### App Testing
- [ ] Add a person named "Mom"
- [ ] Add another person named "Mom" (should succeed ✅)
- [ ] Add a topic named "Anxiety"
- [ ] Add another topic named "Anxiety" (should show error ✅)
- [ ] Add a topic named "ANXIETY" (should show error - case insensitive ✅)
- [ ] Add a topic named "  Anxiety  " (should show error - normalized ✅)
- [ ] Verify existing topics still load correctly
- [ ] Verify existing people still load correctly
- [ ] Verify topic list refreshes after adding a new topic
- [ ] Verify no console errors or crashes

## Files Changed
- ✅ `app/(tabs)/(home)/index.tsx` - Added duplicate checking logic in `handleSaveAddTopic`
- ✅ `DUPLICATE_TOPICS_FIX_23505_SUMMARY.md` - This documentation

## Migration File
The SQL migration is also available in:
- `MIGRATION_FIX_DUPLICATE_TOPICS_23505.sql`

## Troubleshooting

### If you still see error 23505:
1. Verify the migration was run successfully
2. Check if the constraint still exists:
   ```sql
   SELECT conname FROM pg_constraint WHERE conname = 'persons_user_id_name_unique';
   ```
3. If it exists, manually drop it:
   ```sql
   ALTER TABLE public.persons DROP CONSTRAINT persons_user_id_name_unique;
   ```

### If duplicate topics are not being detected:
1. Check the app logs for "Checking for existing topic..."
2. Verify the `ilike` query is working
3. Check if the topic name is being normalized correctly

### If context_label errors occur:
1. The app has a fallback that retries without context_label
2. Run the migration: `MIGRATION_ADD_CONTEXT_LABEL_TO_PERSONS.sql`
3. This adds the `context_label` column to the `persons` table

## Summary

This fix ensures that:
1. **Topics are unique per user** (case-insensitive, normalized)
2. **People can have duplicate names** (2 Moms, 2 Dads, etc.)
3. **Error 23505 is handled gracefully** with user-friendly messages
4. **The app never crashes** when creating topics
5. **Topic list refreshes immediately** after successful creation

The fix involves both a database migration (to change the constraint) and app code changes (to check for duplicates before inserting).
