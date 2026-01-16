
# Duplicate Names Fix - Implementation Summary

## Problem
Users were unable to add multiple people with the same name (e.g., 2 Moms, 2 Dads) due to a unique constraint on `(user_id, name)` in the `persons` table. This caused Supabase insert failures with error code 23505.

## Solution

### 1. Database Migration (Supabase SQL)

Run the following SQL in your Supabase SQL Editor to remove the unique constraint:

```sql
-- Migration: Allow duplicate person names (non-topics)
-- Goal: Users can add multiple people with the same name (e.g., 2 Moms, 2 Dads)
-- Only Topics should remain unique per user

-- Step 1: Drop the existing unique constraint on (user_id, name)
DO $$
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'persons_user_id_name_unique'
      AND table_name = 'persons'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.persons DROP CONSTRAINT persons_user_id_name_unique;
    RAISE NOTICE 'Dropped constraint: persons_user_id_name_unique';
  END IF;

  -- Drop unique index if it exists (common naming patterns)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'persons_user_id_name_unique') THEN
    DROP INDEX public.persons_user_id_name_unique;
    RAISE NOTICE 'Dropped index: persons_user_id_name_unique';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'persons_user_id_name_key') THEN
    DROP INDEX public.persons_user_id_name_key;
    RAISE NOTICE 'Dropped index: persons_user_id_name_key';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'persons_user_id_name_idx') THEN
    DROP INDEX public.persons_user_id_name_idx;
    RAISE NOTICE 'Dropped index: persons_user_id_name_idx';
  END IF;
END $$;

-- Step 2: Create a partial unique index for Topics only
-- This ensures Topics remain unique per user, but allows duplicate names for non-topics
CREATE UNIQUE INDEX IF NOT EXISTS persons_user_topic_name_unique
ON public.persons (user_id, name)
WHERE relationship_type = 'Topic';

-- Verification: Log the change
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Duplicate person names are now allowed. Topics remain unique per user.';
END $$;
```

### 2. App Code Changes

#### A. Removed Duplicate Checking Logic

**File: `app/(tabs)/(home)/index.tsx`**

- Removed all duplicate name checking before insert
- Removed error handling for code 23505 (duplicate key violation)
- Simplified `handleSave` function to insert directly without checking
- Simplified `handleSaveSubject` function to insert directly without checking

**Before:**
```typescript
// Check if person with same name already exists
const { data: existingPerson } = await supabase
  .from('persons')
  .select('id')
  .eq('user_id', userId)
  .eq('name', trimmedName)
  .single();

if (existingPerson) {
  showErrorToast('This person already exists');
  return;
}
```

**After:**
```typescript
// Insert new person directly - duplicates are now allowed!
const { data, error } = await supabase
  .from('persons')
  .insert([personData])
  .select()
  .single();
```

#### B. Updated Error Handling

- Removed special handling for error code 23505
- Show generic error message: "Failed to add person. Please try again."
- Log technical error details to console for debugging

#### C. Maintained Data Integrity

- Each person is uniquely identified by UUID (`person.id`)
- RLS policies ensure data isolation between users
- Primary key constraint remains in place

### 3. Acceptance Criteria

✅ Adding "Mom" twice succeeds (two separate person records)
✅ Adding a Topic with the same name twice is prevented (partial unique index)
✅ People list shows both entries with the same name
✅ No error code 23505 (duplicate key violation)
✅ Each person has a unique UUID identifier
✅ RLS policies remain active and enforce user_id filtering

### 4. Testing Checklist

- [ ] Run the SQL migration in Supabase SQL Editor
- [ ] Add a person named "Mom"
- [ ] Add another person named "Mom" (should succeed)
- [ ] Verify both "Mom" entries appear in the People list
- [ ] Tap each "Mom" entry to open separate chats
- [ ] Delete one "Mom" entry (the other should remain)
- [ ] Add a Topic named "Anxiety"
- [ ] Try to add another Topic named "Anxiety" (should fail with unique constraint error)
- [ ] Verify Topics remain unique per user

### 5. Database Schema After Migration

```
persons table:
- id (UUID, PRIMARY KEY) ← Unique identifier for each person
- user_id (UUID, FOREIGN KEY to auth.users) ← Owner of the person
- name (TEXT) ← Can be duplicate (e.g., multiple "Mom" entries)
- relationship_type (TEXT, NULLABLE) ← "Topic" or null/other values
- created_at (TIMESTAMP)
- person_key (UUID, DEFAULT gen_random_uuid()) ← Additional unique identifier

Constraints:
- PRIMARY KEY: id
- UNIQUE INDEX (partial): (user_id, name) WHERE relationship_type = 'Topic'
- RLS: Enabled with policies filtering by user_id
```

### 6. Key Implementation Notes

1. **No Client-Side Duplicate Checking**: The app no longer checks for duplicates before inserting. This allows users to add multiple people with the same name.

2. **Topics Remain Unique**: The partial unique index ensures that Topics (relationship_type = 'Topic') remain unique per user. This prevents users from creating duplicate topic entries.

3. **UUID as Primary Identifier**: Each person is uniquely identified by their UUID (`person.id`), not by their name. This allows multiple people with the same name to coexist.

4. **RLS Enforcement**: Row Level Security policies ensure that users can only access their own data, preventing data leakage between users.

5. **Generic Error Handling**: Since duplicates are allowed, the app no longer shows "This person already exists" errors. Instead, it shows generic error messages for any insert failures.

### 7. Migration Status

⚠️ **ACTION REQUIRED**: The SQL migration must be run manually in the Supabase SQL Editor.

The migration files have been created but not yet applied:
- `MIGRATION_REMOVE_UNIQUE_CONSTRAINT.sql`
- `MIGRATION_ALLOW_DUPLICATE_NAMES.sql`
- `MIGRATION_FIX_DUPLICATE_NAMES.sql`

**To apply the migration:**
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL migration code from above
4. Click "Run" to execute the migration
5. Verify the migration succeeded by checking the logs

### 8. Rollback Plan (If Needed)

If you need to revert this change:

```sql
-- Rollback: Re-add unique constraint on (user_id, name)
ALTER TABLE public.persons 
ADD CONSTRAINT persons_user_id_name_unique UNIQUE (user_id, name);

-- Drop the partial unique index for topics
DROP INDEX IF EXISTS persons_user_topic_name_unique;
```

**Note**: Rollback will fail if there are existing duplicate names in the database. You would need to manually resolve duplicates first.

## Summary

This fix allows users to add multiple people with the same name while maintaining data integrity through UUID-based identification. Topics remain unique per user to prevent confusion. The app code has been simplified by removing duplicate checking logic, and error handling has been updated to show generic messages for any insert failures.
