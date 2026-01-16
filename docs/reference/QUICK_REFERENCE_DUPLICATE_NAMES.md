
# Quick Reference: Allow Duplicate Person Names

## What Changed?

Users can now add multiple people with the same name (e.g., 2 Moms, 2 Dads, multiple friends named "Alex").

## Required Steps

### 1. Run Database Migration

**IMPORTANT**: You must run this SQL in your Supabase SQL Editor:

```sql
-- Drop unique constraint on (user_id, name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'persons_user_id_name_unique'
      AND table_name = 'persons'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.persons DROP CONSTRAINT persons_user_id_name_unique;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'persons_user_id_name_unique') THEN
    DROP INDEX public.persons_user_id_name_unique;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'persons_user_id_name_key') THEN
    DROP INDEX public.persons_user_id_name_key;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'persons_user_id_name_idx') THEN
    DROP INDEX public.persons_user_id_name_idx;
  END IF;
END $$;

-- Create partial unique index for Topics only
CREATE UNIQUE INDEX IF NOT EXISTS persons_user_topic_name_unique
ON public.persons (user_id, name)
WHERE relationship_type = 'Topic';
```

### 2. App Code Updated

The following files have been updated to remove duplicate checking:

- ✅ `app/(tabs)/(home)/index.tsx` - Removed duplicate checking in `handleSave` and `handleSaveSubject`
- ✅ `components/ui/AddPersonSheet.tsx` - Already handles errors generically (no changes needed)

## How It Works Now

### Before Migration:
- User adds "Mom" ✅
- User tries to add "Mom" again ❌ Error: "This person already exists"

### After Migration:
- User adds "Mom" ✅
- User adds "Mom" again ✅ (creates second person with same name)
- Both "Mom" entries appear in the People list
- Each has a unique UUID identifier
- Each opens a separate chat

## Topics Behavior

Topics remain unique per user:
- User adds Topic "Anxiety" ✅
- User tries to add Topic "Anxiety" again ❌ Error from database (unique constraint)

This prevents duplicate topic entries while allowing duplicate person names.

## Testing

1. Run the SQL migration in Supabase
2. Add a person named "Dad"
3. Add another person named "Dad" (should succeed)
4. Verify both appear in the People list
5. Open each "Dad" chat separately
6. Delete one "Dad" (the other remains)

## Troubleshooting

**Error: "duplicate key value violates unique constraint"**
- The SQL migration hasn't been run yet
- Run the migration in Supabase SQL Editor

**Can't differentiate between duplicate names**
- Each person has a unique UUID (`person.id`)
- Consider adding a "Nickname" or "Identifier" field in the future (optional)
- For now, users can use the relationship_type field to differentiate (e.g., "Mom - biological", "Mom - step")

## Data Safety

- ✅ Each person has a unique UUID identifier
- ✅ RLS policies enforce user_id filtering
- ✅ Primary key constraint remains in place
- ✅ No data leakage between users
- ✅ Existing data is not affected
