
# Context Label Column Fix Guide

## Problem
The app was throwing a Supabase schema error:
```
PGRST204: Could not find the "context_label" column of "persons" in the schema cache.
```

This error occurred when adding a topic from the Home screen because the frontend code was trying to write to a `context_label` column that didn't exist in the database.

## Solution
Add a nullable `context_label` TEXT column to the `persons` table.

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/zjzvkxvahrbuuyzjzxol
2. Navigate to the SQL Editor
3. Copy and paste the contents of `MIGRATION_ADD_CONTEXT_LABEL.sql`
4. Click "Run" to execute the migration
5. Verify the column was added by running:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'persons' AND column_name = 'context_label';
   ```

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push --db-url "your-database-url" < MIGRATION_ADD_CONTEXT_LABEL.sql
```

### Option 3: Manual SQL Execution

Connect to your database and run:

```sql
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS context_label TEXT;
```

## What This Column Does

The `context_label` column stores optional context information for topics. For example:
- When adding a topic like "Anxiety", you can add context like "Work" or "Family"
- This helps users organize and differentiate between similar topics in different contexts
- The column is nullable, so it's completely optional

## Code Changes

The following files already use the `context_label` field:

1. **app/(tabs)/(home)/index.tsx**
   - Line 458: Inserts `context_label` when creating a new topic
   - The Add Topic modal includes a "Context Label" input field

2. **app/(tabs)/(home)/chat.tsx**
   - Receives `contextLabel` as a route parameter
   - Displays it in the chat interface

3. **app/(tabs)/library/detail.tsx**
   - Passes `context_label` when navigating to chat from library topics

## Testing After Migration

After applying the migration, test the following:

1. **Add a Topic with Context**
   - Go to Home screen
   - Tap "Add Topic"
   - Select or type a topic name
   - Add a context label (e.g., "Work")
   - Tap "Start Chat"
   - Verify no errors appear in the console

2. **Add a Topic without Context**
   - Go to Home screen
   - Tap "Add Topic"
   - Select or type a topic name
   - Leave context label empty
   - Tap "Start Chat"
   - Verify the topic is created successfully

3. **View Existing Topics**
   - Verify all existing topics still display correctly
   - Verify you can still chat with existing topics

4. **Add a Person**
   - Verify adding a person still works
   - Verify persons don't show a context label (it's only for topics)

## Rollback (If Needed)

If you need to remove the column for any reason:

```sql
ALTER TABLE public.persons DROP COLUMN IF EXISTS context_label;
```

**Note:** This will permanently delete all context label data. Only do this if absolutely necessary.

## Schema Cache Refresh

After applying the migration, Supabase should automatically refresh its schema cache. If you still see the error:

1. Wait 1-2 minutes for the cache to refresh
2. Restart your Expo development server
3. Clear the app cache (if on a physical device)
4. If the error persists, try restarting the Supabase project from the dashboard

## Verification Checklist

- [ ] Migration SQL executed successfully
- [ ] Column appears in database schema
- [ ] Can add topics with context label
- [ ] Can add topics without context label
- [ ] Existing topics still work
- [ ] Can add persons without errors
- [ ] No console errors when adding topics
- [ ] Chat navigation works correctly

## Support

If you encounter any issues after applying this migration:

1. Check the browser console for detailed error messages
2. Verify the column exists: `SELECT * FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'context_label';`
3. Check Supabase logs in the dashboard
4. Ensure your Supabase client is up to date
