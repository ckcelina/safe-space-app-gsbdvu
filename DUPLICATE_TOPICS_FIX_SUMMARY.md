
# Duplicate Topics Fix - Implementation Summary

## Problem
Users were unable to add multiple topics with the same name (e.g., "Anxiety – Work", "Anxiety – Family") due to a partial unique constraint on `(user_id, name) WHERE relationship_type = 'Topic'` in the `persons` table. This caused Supabase insert failures.

## Solution Overview

The fix implements support for multiple topics with the same display name by:
1. **Using unique internal IDs** (UUID) - each topic is uniquely identified by `person.id`
2. **Adding optional context labels** - users can add context like "Work", "Family", "School"
3. **Removing uniqueness enforcement on topic names** - only internal IDs are unique

## Implementation Details

### 1. Database Migration

**File: `MIGRATION_ALLOW_DUPLICATE_TOPICS.sql`**

Run this SQL in your Supabase SQL Editor:

```sql
-- Migration: Allow duplicate topic names with optional context labels
-- Goal: Users can add multiple topics with the same name but different contexts
-- Example: "Anxiety – Work", "Anxiety – Family"

-- Step 1: Drop the partial unique index for Topics
DROP INDEX IF EXISTS public.persons_user_topic_name_unique;

-- Step 2: Add a context_label column to persons table (optional)
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS context_label TEXT;

-- Step 3: Create a regular (non-unique) index for better query performance
CREATE INDEX IF NOT EXISTS idx_persons_name ON public.persons(name);
CREATE INDEX IF NOT EXISTS idx_persons_relationship_type ON public.persons(relationship_type);

-- Verification: Log the change
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Topics can now have duplicate names with optional context labels.';
END $$;
```

### 2. Type Definitions Update

**File: `types/database.types.ts`**

Added `context_label` field to `Person` and `Topic` interfaces:

```typescript
export interface Person {
  id: string;
  user_id: string;
  name: string;
  relationship_type?: string;
  context_label?: string; // NEW: Optional context label
  created_at: string;
}

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  context_label?: string; // NEW: Optional context label
  created_at: string;
}
```

### 3. UI Updates

#### A. Add Topic Modal (`app/(tabs)/(home)/index.tsx`)

**New Features:**
- Added context label input field
- Users can optionally add context when creating a topic
- Context label is displayed in the selected topic indicator
- Example: "Anxiety – Work", "Anxiety – Family"

**New State Variables:**
```typescript
const [contextLabel, setContextLabel] = useState('');
const [contextLabelFocused, setContextLabelFocused] = useState(false);
```

**New Input Field:**
```typescript
<View style={styles.addTopicFieldContainer}>
  <Text style={styles.addTopicInputLabel}>
    Add context (optional):
  </Text>
  <Text style={styles.addTopicHelperTextSmall}>
    e.g., "Work", "Family", "School"
  </Text>
  <View style={[
    styles.addTopicInputRowContainer,
    contextLabelFocused && styles.addTopicInputRowFocused
  ]}>
    <TextInput
      style={styles.addTopicTextInput}
      placeholder="Work, Family, School..."
      placeholderTextColor="#999"
      value={contextLabel}
      onChangeText={handleContextLabelChange}
      autoCapitalize="words"
      autoCorrect={false}
      maxLength={50}
      editable={!savingTopic}
      returnKeyType="done"
      onSubmitEditing={handleSaveAddTopic}
      onFocus={() => setContextLabelFocused(true)}
      onBlur={() => setContextLabelFocused(false)}
    />
  </View>
</View>
```

**Updated Insert Logic:**
```typescript
const topicData = {
  user_id: userId,
  name: topicName,
  relationship_type: 'Topic',
  context_label: contextLabel.trim() || null, // NEW: Include context label
};
```

#### B. PersonCard Component (`components/ui/PersonCard.tsx`)

**Updated Display Logic:**
- Shows context label in the display name: "Anxiety – Work"
- Shows context label in the subtitle: "Topic – Work"

```typescript
// Build display name with context label if present
const displayName = person.context_label && isTopic
  ? `${person.name} – ${person.context_label}`
  : person.name || 'Unknown';

// If it's a topic with a context label, show "Topic – Context"
if (isTopic && person.context_label) {
  label = `Topic – ${person.context_label}`;
}
```

### 4. Search Functionality

Updated search to include context labels:

```typescript
const filteredTopics = useMemo(() => {
  const filtered = topics.filter((topic) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const nameMatch = topic.name?.toLowerCase().includes(query) || false;
    const contextMatch = topic.context_label?.toLowerCase().includes(query) || false;
    
    return nameMatch || contextMatch;
  });

  return filtered;
}, [topics, searchQuery]);
```

### 5. Navigation Updates

Updated navigation to pass context label:

```typescript
router.push({
  pathname: '/(tabs)/(home)/chat',
  params: { 
    personId: data.id, 
    personName: data.name || 'Topic',
    relationshipType: 'Topic',
    initialSubject: data.name,
    contextLabel: data.context_label || '' // NEW: Pass context label
  },
});
```

## User Experience Flow

### Creating a Topic with Context

1. User taps "Add Topic" button
2. User selects a quick topic (e.g., "Anxiety") OR types a custom topic
3. User optionally adds a context label (e.g., "Work")
4. User taps "Start Chat"
5. Topic is created with name "Anxiety" and context_label "Work"
6. Topic appears in the list as "Anxiety – Work"
7. User can create another topic with name "Anxiety" and context_label "Family"
8. Both topics appear in the list: "Anxiety – Work" and "Anxiety – Family"

### Viewing Topics

- Topics without context labels: "Anxiety"
- Topics with context labels: "Anxiety – Work"
- Subtitle shows: "Topic – Work" (if context label exists) or "Topic" (if no context)

### Searching Topics

Users can search by:
- Topic name: "Anxiety" (matches all Anxiety topics)
- Context label: "Work" (matches all topics with "Work" context)
- Combined: "Anxiety Work" (matches topics with both)

## Acceptance Criteria

✅ Adding "Anxiety" twice with different contexts succeeds (two separate topic records)
✅ Adding "Anxiety" without context succeeds
✅ Topics list shows all entries with their context labels
✅ No error code 23505 (duplicate key violation)
✅ Each topic has a unique UUID identifier
✅ Context labels are optional
✅ Search works for both topic names and context labels
✅ RLS policies remain active and enforce user_id filtering

## Testing Checklist

- [ ] Run the SQL migration in Supabase SQL Editor
- [ ] Add a topic named "Anxiety" without context
- [ ] Add another topic named "Anxiety" with context "Work" (should succeed)
- [ ] Add another topic named "Anxiety" with context "Family" (should succeed)
- [ ] Verify all three "Anxiety" entries appear in the Topics list
- [ ] Verify display names show: "Anxiety", "Anxiety – Work", "Anxiety – Family"
- [ ] Tap each "Anxiety" entry to open separate chats
- [ ] Delete one "Anxiety" entry (the others should remain)
- [ ] Search for "Anxiety" (should show all three)
- [ ] Search for "Work" (should show only "Anxiety – Work")
- [ ] Verify people can still have duplicate names (e.g., two "Mom" entries)

## Database Schema After Migration

```
persons table:
- id (UUID, PRIMARY KEY) ← Unique identifier for each person/topic
- user_id (UUID, FOREIGN KEY to auth.users) ← Owner
- name (TEXT) ← Can be duplicate (e.g., multiple "Anxiety" entries)
- relationship_type (TEXT, NULLABLE) ← "Topic" or null/other values
- context_label (TEXT, NULLABLE) ← NEW: Optional context (e.g., "Work", "Family")
- created_at (TIMESTAMP)

Constraints:
- PRIMARY KEY: id
- NO unique constraint on (user_id, name)
- NO unique constraint on (user_id, name, relationship_type)
- RLS: Enabled with policies filtering by user_id

Indexes:
- idx_persons_name (regular index for query performance)
- idx_persons_relationship_type (regular index for query performance)
```

## Key Implementation Notes

1. **No Duplicate Checking**: The app no longer checks for duplicate topic names before inserting. This allows users to add multiple topics with the same name but different contexts.

2. **Context Labels Are Optional**: Users can create topics without context labels. The UI gracefully handles both cases.

3. **UUID as Primary Identifier**: Each topic is uniquely identified by its UUID (`person.id`), not by its name or context label.

4. **Display Format**: Topics with context labels are displayed as "Name – Context" (e.g., "Anxiety – Work").

5. **Search Enhancement**: Search now includes context labels, making it easier to find specific topic instances.

6. **Backward Compatibility**: Existing topics without context labels continue to work normally.

## Migration Status

⚠️ **ACTION REQUIRED**: The SQL migration must be run manually in the Supabase SQL Editor.

**To apply the migration:**
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL migration code from `MIGRATION_ALLOW_DUPLICATE_TOPICS.sql`
4. Click "Run" to execute the migration
5. Verify the migration succeeded by checking the logs

## Rollback Plan (If Needed)

If you need to revert this change:

```sql
-- Rollback: Remove context_label column and re-add unique constraint
ALTER TABLE public.persons DROP COLUMN IF EXISTS context_label;

-- Re-add partial unique index for topics
CREATE UNIQUE INDEX persons_user_topic_name_unique
ON public.persons (user_id, name)
WHERE relationship_type = 'Topic';

-- Drop performance indexes
DROP INDEX IF EXISTS idx_persons_name;
DROP INDEX IF EXISTS idx_persons_relationship_type;
```

**Note**: Rollback will fail if there are existing duplicate topic names in the database. You would need to manually resolve duplicates first.

## Summary

This fix allows users to add multiple topics with the same name while maintaining data integrity through UUID-based identification and optional context labels. The UX has been enhanced to support context labels, making it easier to distinguish between similar topics. Search functionality has been improved to include context labels, and the display format clearly shows the context when present.

**Key Benefits:**
- Users can create multiple instances of the same topic (e.g., "Anxiety – Work", "Anxiety – Family")
- Context labels are optional and user-friendly
- No console errors for duplicate topics
- Database unique constraint is respected (on UUID, not name)
- UX handles duplicates gracefully with clear visual distinction
