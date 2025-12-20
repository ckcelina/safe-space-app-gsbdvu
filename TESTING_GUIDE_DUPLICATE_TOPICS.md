
# Testing Guide: Duplicate Topics with Context Labels

## Pre-Testing Setup

### 1. Apply Database Migration

Before testing, you MUST apply the database migration:

```sql
-- Run this in Supabase SQL Editor
DROP INDEX IF EXISTS public.persons_user_topic_name_unique;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS context_label TEXT;
CREATE INDEX IF NOT EXISTS idx_persons_name ON public.persons(name);
CREATE INDEX IF NOT EXISTS idx_persons_relationship_type ON public.persons(relationship_type);
```

### 2. Verify Migration Success

Check that the migration was successful:

```sql
-- Verify context_label column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'persons' AND column_name = 'context_label';

-- Verify unique index was removed
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'persons' AND indexname = 'persons_user_topic_name_unique';
-- Should return 0 rows
```

## Test Cases

### Test Case 1: Create Topic Without Context

**Steps:**
1. Open the app and navigate to Home screen
2. Tap "Add Topic" button
3. Select "Anxiety" from quick topics
4. Leave "Add context" field empty
5. Tap "Start Chat"

**Expected Result:**
- ✅ Topic is created successfully
- ✅ Topic appears in Topics list as "Anxiety"
- ✅ Subtitle shows "Topic"
- ✅ Chat screen opens with topic "Anxiety"
- ✅ No console errors

### Test Case 2: Create Topic With Context

**Steps:**
1. Open the app and navigate to Home screen
2. Tap "Add Topic" button
3. Select "Anxiety" from quick topics
4. Enter "Work" in the "Add context" field
5. Tap "Start Chat"

**Expected Result:**
- ✅ Topic is created successfully
- ✅ Topic appears in Topics list as "Anxiety – Work"
- ✅ Subtitle shows "Topic – Work"
- ✅ Chat screen opens with topic "Anxiety – Work"
- ✅ No console errors

### Test Case 3: Create Duplicate Topic Names with Different Contexts

**Steps:**
1. Create topic "Anxiety" with context "Work" (from Test Case 2)
2. Navigate back to Home screen
3. Tap "Add Topic" button
4. Select "Anxiety" from quick topics
5. Enter "Family" in the "Add context" field
6. Tap "Start Chat"

**Expected Result:**
- ✅ Second topic is created successfully (no duplicate error)
- ✅ Both topics appear in Topics list:
  - "Anxiety – Work"
  - "Anxiety – Family"
- ✅ Each topic has a unique ID
- ✅ Tapping each topic opens a separate chat
- ✅ No console errors

### Test Case 4: Create Duplicate Topic Names Without Context

**Steps:**
1. Create topic "Stress" without context
2. Navigate back to Home screen
3. Tap "Add Topic" button
4. Select "Stress" from quick topics
5. Leave "Add context" field empty
6. Tap "Start Chat"

**Expected Result:**
- ✅ Second topic is created successfully (no duplicate error)
- ✅ Both topics appear in Topics list as "Stress"
- ✅ Each topic has a unique ID
- ✅ Tapping each topic opens a separate chat
- ✅ No console errors

### Test Case 5: Create Custom Topic with Context

**Steps:**
1. Tap "Add Topic" button
2. Type "Imposter Syndrome" in the custom topic field
3. Enter "Career" in the "Add context" field
4. Tap "Start Chat"

**Expected Result:**
- ✅ Topic is created successfully
- ✅ Topic appears in Topics list as "Imposter Syndrome – Career"
- ✅ Subtitle shows "Topic – Career"
- ✅ Chat screen opens with topic "Imposter Syndrome – Career"
- ✅ No console errors

### Test Case 6: Search by Topic Name

**Steps:**
1. Create multiple topics:
   - "Anxiety – Work"
   - "Anxiety – Family"
   - "Stress – Work"
2. In the search bar, type "Anxiety"

**Expected Result:**
- ✅ Search shows both Anxiety topics:
  - "Anxiety – Work"
  - "Anxiety – Family"
- ✅ "Stress – Work" is hidden
- ✅ Search is case-insensitive

### Test Case 7: Search by Context Label

**Steps:**
1. Create multiple topics:
   - "Anxiety – Work"
   - "Stress – Work"
   - "Anxiety – Family"
2. In the search bar, type "Work"

**Expected Result:**
- ✅ Search shows both Work topics:
  - "Anxiety – Work"
  - "Stress – Work"
- ✅ "Anxiety – Family" is hidden
- ✅ Search is case-insensitive

### Test Case 8: Delete Topic with Context

**Steps:**
1. Create topic "Anxiety – Work"
2. Swipe left on the topic card
3. Tap the delete button

**Expected Result:**
- ✅ Topic is deleted successfully
- ✅ Topic is removed from the Topics list
- ✅ Associated messages are deleted
- ✅ Success toast appears: "Topic deleted"
- ✅ No console errors

### Test Case 9: Context Label Validation

**Steps:**
1. Tap "Add Topic" button
2. Select "Anxiety" from quick topics
3. Enter a very long context label (100+ characters)
4. Tap "Start Chat"

**Expected Result:**
- ✅ Context label is truncated to 50 characters (maxLength)
- ✅ Topic is created successfully
- ✅ No console errors

### Test Case 10: Empty Context Label

**Steps:**
1. Tap "Add Topic" button
2. Select "Anxiety" from quick topics
3. Enter "   " (spaces only) in the "Add context" field
4. Tap "Start Chat"

**Expected Result:**
- ✅ Context label is trimmed and saved as null
- ✅ Topic appears as "Anxiety" (without context)
- ✅ Subtitle shows "Topic" (not "Topic – ")
- ✅ No console errors

### Test Case 11: People Can Still Have Duplicate Names

**Steps:**
1. Tap "Add Person" button
2. Enter "Mom" as the name
3. Tap "Save"
4. Navigate back to Home screen
5. Tap "Add Person" button again
6. Enter "Mom" as the name again
7. Tap "Save"

**Expected Result:**
- ✅ Both "Mom" entries are created successfully
- ✅ Both appear in the People list
- ✅ Each has a unique ID
- ✅ No console errors
- ✅ This confirms people can still have duplicate names

### Test Case 12: Modal State Reset

**Steps:**
1. Tap "Add Topic" button
2. Select "Anxiety" from quick topics
3. Enter "Work" in the context field
4. Tap "Cancel"
5. Tap "Add Topic" button again

**Expected Result:**
- ✅ Modal opens with empty state
- ✅ No topic is selected
- ✅ Context field is empty
- ✅ No error messages
- ✅ Modal is ready for new input

## Edge Cases

### Edge Case 1: Special Characters in Context Label

**Steps:**
1. Create topic "Anxiety" with context "Work/Life"
2. Create topic "Stress" with context "Mom & Dad"

**Expected Result:**
- ✅ Topics are created successfully
- ✅ Special characters are preserved
- ✅ Display shows: "Anxiety – Work/Life", "Stress – Mom & Dad"

### Edge Case 2: Unicode Characters in Context Label

**Steps:**
1. Create topic "Anxiety" with context "家庭" (Chinese for "Family")
2. Create topic "Stress" with context "Café"

**Expected Result:**
- ✅ Topics are created successfully
- ✅ Unicode characters are preserved
- ✅ Display shows: "Anxiety – 家庭", "Stress – Café"

### Edge Case 3: Very Long Topic Name + Context

**Steps:**
1. Create topic "Generalized Anxiety Disorder with Panic Attacks" with context "Work Environment"

**Expected Result:**
- ✅ Topic is created successfully
- ✅ Display truncates gracefully with ellipsis
- ✅ Full text is visible in chat screen
- ✅ No layout issues

## Performance Testing

### Performance Test 1: Many Topics with Same Name

**Steps:**
1. Create 20 topics all named "Anxiety" with different contexts:
   - "Work", "Family", "Friends", "School", etc.
2. Scroll through the Topics list
3. Search for "Anxiety"

**Expected Result:**
- ✅ All 20 topics are created successfully
- ✅ List scrolls smoothly
- ✅ Search returns all 20 topics quickly
- ✅ No performance degradation

### Performance Test 2: Search Performance

**Steps:**
1. Create 50+ topics with various names and contexts
2. Type in the search bar character by character
3. Observe search results update

**Expected Result:**
- ✅ Search results update instantly
- ✅ No lag or stuttering
- ✅ Correct results for each query

## Regression Testing

### Regression Test 1: Existing Topics Still Work

**Steps:**
1. Verify existing topics (created before migration) still appear
2. Tap on an existing topic
3. Send a message in the chat

**Expected Result:**
- ✅ Existing topics appear in the list
- ✅ Chat opens successfully
- ✅ Messages can be sent and received
- ✅ No console errors

### Regression Test 2: People Functionality Unchanged

**Steps:**
1. Add a new person
2. View the person in the People list
3. Open chat with the person
4. Delete the person

**Expected Result:**
- ✅ All person functionality works as before
- ✅ No impact from topic changes
- ✅ No console errors

## Console Error Monitoring

During all tests, monitor the console for:
- ❌ Error code 23505 (duplicate key violation) - Should NOT appear
- ❌ Supabase insert errors - Should NOT appear
- ❌ React warnings about missing keys - Should NOT appear
- ❌ Type errors - Should NOT appear

## Test Results Template

Use this template to record test results:

```
Test Case: [Test Case Name]
Date: [Date]
Tester: [Your Name]
Result: [PASS/FAIL]
Notes: [Any observations or issues]
Console Errors: [Yes/No - describe if yes]
Screenshots: [Attach if applicable]
```

## Reporting Issues

If you find any issues during testing:

1. **Note the exact steps to reproduce**
2. **Check console logs for errors**
3. **Verify the database migration was applied**
4. **Check the `persons` table in Supabase**
5. **Document the expected vs actual behavior**

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ No duplicate key violations
- ✅ Smooth user experience
- ✅ Correct data display
- ✅ Proper search functionality
- ✅ Successful CRUD operations
