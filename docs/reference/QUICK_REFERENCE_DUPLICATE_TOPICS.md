
# Quick Reference: Duplicate Topics with Context Labels

## What Changed?

Users can now create multiple topics with the same name by adding optional context labels.

**Example:**
- "Anxiety – Work"
- "Anxiety – Family"
- "Anxiety – School"

## How to Use

### Creating a Topic with Context

1. Tap **"Add Topic"** button on the home screen
2. Select a quick topic OR type a custom topic name
3. (Optional) Add a context label in the "Add context" field
   - Examples: "Work", "Family", "School", "Friends"
4. Tap **"Start Chat"**

### Creating Multiple Topics with the Same Name

1. Create first topic: "Anxiety" with context "Work"
2. Create second topic: "Anxiety" with context "Family"
3. Both topics will appear in your Topics list:
   - "Anxiety – Work"
   - "Anxiety – Family"

### Viewing Topics

- **Without context**: "Anxiety"
- **With context**: "Anxiety – Work"

### Searching Topics

Search works for both topic names and context labels:
- Search "Anxiety" → Shows all Anxiety topics
- Search "Work" → Shows all topics with "Work" context
- Search "Anxiety Work" → Shows Anxiety topics with Work context

## Database Migration Required

⚠️ **IMPORTANT**: You must run the database migration before using this feature.

### Steps to Apply Migration:

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the SQL from `MIGRATION_ALLOW_DUPLICATE_TOPICS.sql`
4. Paste into the SQL Editor
5. Click **"Run"**
6. Verify success in the logs

### Migration SQL:

```sql
-- Drop the partial unique index for Topics
DROP INDEX IF EXISTS public.persons_user_topic_name_unique;

-- Add context_label column
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS context_label TEXT;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_persons_name ON public.persons(name);
CREATE INDEX IF NOT EXISTS idx_persons_relationship_type ON public.persons(relationship_type);
```

## Technical Details

### Database Schema

- **Table**: `persons`
- **New Column**: `context_label` (TEXT, NULLABLE)
- **Unique Constraint**: Removed from topic names
- **Primary Key**: `id` (UUID) - each topic has a unique ID

### Type Definitions

```typescript
interface Person {
  id: string;
  user_id: string;
  name: string;
  relationship_type?: string;
  context_label?: string; // NEW
  created_at: string;
}
```

### Files Modified

1. `types/database.types.ts` - Added `context_label` field
2. `app/(tabs)/(home)/index.tsx` - Added context label input and logic
3. `components/ui/PersonCard.tsx` - Updated display to show context labels
4. `MIGRATION_ALLOW_DUPLICATE_TOPICS.sql` - Database migration

## Troubleshooting

### Issue: "Failed to add topic"

**Solution**: Make sure you've run the database migration. The partial unique index must be removed.

### Issue: Context label not showing

**Solution**: 
1. Verify the migration added the `context_label` column
2. Check that you entered a context label when creating the topic
3. Refresh the app to reload data

### Issue: Search not finding topics by context

**Solution**: Make sure you're using the latest version of the app with updated search logic.

## Examples

### Use Case 1: Multiple Anxiety Topics

- "Anxiety – Work" - For work-related anxiety
- "Anxiety – Social" - For social situations
- "Anxiety – Health" - For health concerns

### Use Case 2: Relationship Topics

- "Relationships – Partner" - For romantic relationship
- "Relationships – Family" - For family dynamics
- "Relationships – Friends" - For friendships

### Use Case 3: Stress Topics

- "Stress – Work" - For work stress
- "Stress – Financial" - For money worries
- "Stress – School" - For academic pressure

## Best Practices

1. **Use Clear Context Labels**: Keep them short and descriptive (1-2 words)
2. **Be Consistent**: Use the same context labels across similar topics
3. **Optional Use**: Context labels are optional - use them only when needed
4. **Search Friendly**: Choose context labels that are easy to search for

## Backward Compatibility

- Existing topics without context labels continue to work normally
- You can add context labels to new topics while keeping old ones as-is
- No data migration needed for existing topics

## Support

If you encounter any issues:
1. Check that the database migration was applied successfully
2. Verify the `context_label` column exists in the `persons` table
3. Check console logs for any error messages
4. Ensure you're using the latest version of the app code
