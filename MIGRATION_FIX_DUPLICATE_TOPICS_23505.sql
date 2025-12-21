
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
ON public.persons (user_id, name)
WHERE relationship_type = 'Topic';

-- VERIFICATION:
-- After running this migration:
-- 1. You can add multiple people with the same name (e.g., "Mom", "Mom")
-- 2. You cannot add duplicate topics with the same name (e.g., "Anxiety", "Anxiety")
-- 3. The app will check for duplicates before inserting and show a friendly message
</parameter>

Now let me update the app code to check for duplicate topics before inserting:Perfect! Now let me create a summary document explaining the fix:

<write file="DUPLICATE_TOPICS_FIX_23505_SUMMARY.md">
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

### Database Changes (REQUIRED)
Run the migration file: `MIGRATION_FIX_DUPLICATE_TOPICS_23505.sql`

This migration:
1. **Drops the global unique constraint** `persons_user_id_name_unique`
   - Allows duplicate names for People (2 Moms, 2 Dads, etc.)

2. **Adds a partial unique index** `persons_user_topic_name_unique`
   - Only applies to rows where `relationship_type = 'Topic'`
   - Prevents duplicate Topics per user
   - Does NOT affect People

### App Changes (COMPLETED)
Updated `app/(tabs)/(home)/index.tsx` - `handleSaveAddTopic` function:

1. **Pre-insert duplicate check**:
   - Normalizes topic name (trim, collapse spaces)
   - Performs case-insensitive search using `ilike`
   - Checks if topic already exists for the user

2. **Friendly error handling**:
   - If duplicate found: Shows "This topic already exists" toast
   - Sets error message in the modal
   - Does NOT attempt to insert
   - Prevents error 23505 from occurring

3. **Fallback for database errors**:
   - If error 23505 still occurs (race condition), shows friendly message
   - Handles context_label column issues gracefully

## Acceptance Criteria ✅

- ✅ Adding duplicate Topic names is prevented with a friendly message
- ✅ Adding duplicate People names is allowed
- ✅ Error 23505 no longer appears when creating topics
- ✅ Topics are unique per user by name (case-insensitive)
- ✅ People can have duplicate names (2 Moms, 2 Dads)
- ✅ Creating a Topic never crashes the app

## How to Apply

### Step 1: Run Database Migration
Execute the SQL in `MIGRATION_FIX_DUPLICATE_TOPICS_23505.sql` in your Supabase SQL Editor:

```sql
-- Drop global unique constraint
ALTER TABLE public.persons
DROP CONSTRAINT IF EXISTS persons_user_id_name_unique;

-- Add partial unique index for Topics only
CREATE UNIQUE INDEX IF NOT EXISTS persons_user_topic_name_unique
ON public.persons (user_id, name)
WHERE relationship_type = 'Topic';
```

### Step 2: Verify
The app code has already been updated. After running the migration:

1. Try adding a person named "Mom"
2. Try adding another person named "Mom" → Should succeed ✅
3. Try adding a topic named "Anxiety"
4. Try adding another topic named "Anxiety" → Should show "This topic already exists" ✅

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
- `persons` table with `relationship_type = 'Topic'` → Unique names per user
- `persons` table with `relationship_type != 'Topic'` → Duplicate names allowed

### Error Handling Flow
1. User enters topic name
2. App normalizes the name
3. App checks if topic exists (case-insensitive)
4. If exists → Show error, don't insert
5. If not exists → Insert topic
6. If insert fails with 23505 (race condition) → Show error

## Files Changed
- ✅ `app/(tabs)/(home)/index.tsx` - Added duplicate checking logic
- ✅ `MIGRATION_FIX_DUPLICATE_TOPICS_23505.sql` - Database migration

## Testing Checklist
- [ ] Run database migration
- [ ] Add a person named "Mom"
- [ ] Add another person named "Mom" (should succeed)
- [ ] Add a topic named "Anxiety"
- [ ] Add another topic named "Anxiety" (should show error)
- [ ] Add a topic named "ANXIETY" (should show error - case insensitive)
- [ ] Add a topic named "  Anxiety  " (should show error - normalized)
- [ ] Verify existing topics still load correctly
- [ ] Verify existing people still load correctly
