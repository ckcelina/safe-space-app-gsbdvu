
# Duplicate Names and Topics Fix Summary

## Issues Fixed

### Part A: Duplicate Person Names (Error 23505)
**Problem:** Adding a person with a duplicate name caused error: "duplicate key value violates unique constraint persons_user_id_name_unique"

**Solution:**
- Removed the `persons_user_id_name_unique` constraint from the `persons` table
- Updated client-side error handling to gracefully handle any remaining 23505 errors
- Users can now add multiple people with the same name (e.g., multiple "Mom", "Dad", etc.)

### Part B: People List Not Updating After Add
**Problem:** 
- People added successfully did NOT appear in the People list
- Previously added people disappeared until refresh

**Solution:**
- Added `useFocusEffect` hook to refetch data whenever the Home screen gains focus
- Implemented optimistic update: new person is immediately added to the list
- Added data re-sync: `fetchData()` is called after optimistic update to ensure server truth
- Ensured queries sort by `created_at DESC` for stable ordering
- Fixed query to correctly filter people vs topics using `relationship_type`

### Part C: Creating Topic Triggers Wrong Constraint
**Problem:** Creating a TOPIC triggered the SAME persons unique constraint error

**Root Cause:** Topics are stored in the `persons` table with `relationship_type = 'Topic'`, NOT in a separate `topics` table. The code was correctly inserting into `persons`, but the unique constraint was blocking it.

**Solution:**
- Confirmed that topics insert into the `persons` table (correct behavior)
- Removed the unique constraint (same fix as Part A)
- Added detailed logging to show table name and payload during topic creation
- Added graceful error handling for 23505 errors (should not occur after migration)

## Database Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- File: MIGRATION_FIX_DUPLICATE_NAMES_AND_TOPICS.sql

-- Remove the unique constraint
ALTER TABLE public.persons 
DROP CONSTRAINT IF EXISTS persons_user_id_name_unique;

-- Add created_at column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'persons' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.persons 
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    
    UPDATE public.persons 
    SET created_at = NOW() 
    WHERE created_at IS NULL;
  END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_persons_created_at 
ON public.persons(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_persons_user_id 
ON public.persons(user_id);

CREATE INDEX IF NOT EXISTS idx_persons_user_relationship 
ON public.persons(user_id, relationship_type);
```

## Code Changes

### 1. Home Screen (`app/(tabs)/(home)/index.tsx`)
- **Part B Fix:** Added `useFocusEffect` to refetch data on screen focus
- **Part B Fix:** Implemented optimistic update in `handlePersonCreated`
- **Part C Fix:** Enhanced `handleSaveAddTopic` with detailed logging
- **Part C Fix:** Added graceful handling for 23505 errors (should not occur)
- Queries now sort by `created_at DESC` for stable ordering

### 2. Add Person Sheet (`components/ui/AddPersonSheet.tsx`)
- **Part A Fix:** Graceful handling of 23505 errors with user-friendly messages
- **Part A Fix:** Sheet stays open on error for user to edit
- Defaults `relationship_type` to "Other" if not provided

## Testing Checklist

- [ ] Run the SQL migration in Supabase SQL Editor
- [ ] Verify constraint is removed: Check that `persons_user_id_name_unique` no longer exists
- [ ] Test adding multiple people with the same name (e.g., "Mom", "Mom")
- [ ] Verify new people appear immediately in the People list
- [ ] Test adding multiple topics with the same name
- [ ] Verify topics appear immediately in the Topics list
- [ ] Test navigation: Add person → Go back → Verify person appears
- [ ] Test navigation: Add topic → Go back → Verify topic appears

## Expected Behavior After Fix

1. **Duplicate Names Allowed:** Users can add multiple people with the same name without errors
2. **Immediate List Updates:** New people/topics appear immediately in the list after creation
3. **No More 23505 Errors:** The unique constraint error should never occur
4. **Stable Ordering:** People and topics are sorted by creation date (newest first)
5. **Graceful Error Handling:** If any errors occur, users see friendly messages

## Notes

- Topics are stored in the `persons` table with `relationship_type = 'Topic'`
- There is NO separate `topics` table
- The `created_at` column is used for stable ordering
- The primary key (`id`) remains the unique identifier for each person/topic
