
# People List Automatic Reordering Implementation

## Overview
The Home screen People list now automatically reorders based on most recent chat activity. The person/topic you most recently chatted with appears at the top. This ordering persists across app relaunches.

## Implementation Details

### 1. Compute Last Activity from Messages
The `fetchData` function now:
- Queries ALL messages for the current user from the `messages` table
- Builds a map of `person_id -> last_message_at` (most recent message timestamp)
- This represents the most recent activity (user OR assistant messages)

```typescript
const { data: lastMessageData } = await supabase
  .from('messages')
  .select('person_id, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Build map: person_id -> last_message_at
const lastMessageMap = new Map<string, string>();
lastMessageData?.forEach((msg) => {
  if (msg.person_id && msg.created_at) {
    const existing = lastMessageMap.get(msg.person_id);
    if (!existing || msg.created_at > existing) {
      lastMessageMap.set(msg.person_id, msg.created_at);
    }
  }
});
```

### 2. Merge with People Data
For each person/topic:
- Fetch the `last_message_at` from the map
- Compute `lastActivityAt = last_message_at || created_at`
- This ensures people with no messages still have a timestamp (their creation date)

```typescript
const peopleWithMessages = peopleData.map((person) => {
  const lastMessageAt = lastMessageMap.get(person.id);
  const lastActivityAt = lastMessageAt || person.created_at;
  
  return {
    ...person,
    lastMessage: lastMessageAt ? 'Recent activity' : 'No messages yet',
    lastMessageTime: lastMessageAt,
    lastActivityAt,
  };
});
```

### 3. Sort by Last Activity
Both people and topics are sorted by `lastActivityAt` in descending order:
- Most recent activity appears at the top
- NULLS LAST behavior: people with no timestamp go to the bottom

```typescript
peopleWithMessages.sort((a, b) => {
  const aTime = a.lastActivityAt;
  const bTime = b.lastActivityAt;
  
  // NULLS LAST
  if (!aTime && !bTime) return 0;
  if (!aTime) return 1;
  if (!bTime) return -1;
  
  // Descending: most recent first
  return new Date(bTime).getTime() - new Date(aTime).getTime();
});
```

### 4. Avoid Flicker
- All data merging and sorting happens BEFORE updating state
- State is updated ONCE with `setPeople()` and `setTopics()`
- This prevents multiple re-renders and UI flickering

### 5. Refresh on Return from Chat
The existing `useFocusEffect` hook ensures data is refreshed when the Home screen regains focus:

```typescript
useFocusEffect(
  useCallback(() => {
    console.log('[Home] Screen focused - refreshing data');
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData])
);
```

## Acceptance Criteria

✅ **Opening a chat and returning to Home shows that person at the top**
- When you navigate to a chat and send/receive messages, then return to Home, that person appears at the top of the list

✅ **Force close app → reopen → ordering is still correct**
- The ordering is computed from the `messages` table, which persists in Supabase
- When the app reopens, `fetchData()` runs and recomputes the ordering from the database

✅ **No UI changes**
- The UI remains identical
- Only the ordering logic has changed
- No visual redesign or layout changes

## Technical Notes

### TypeScript Interface
Added `lastActivityAt` field to the `PersonWithLastMessage` interface:

```typescript
interface PersonWithLastMessage extends Person {
  lastMessage?: string;
  lastMessageTime?: string;
  lastActivityAt?: string; // For sorting: last_message_at || created_at
}
```

### Performance
- The implementation uses a single query to fetch all messages
- A Map is used for O(1) lookup of last message timestamps
- Sorting is done in-memory on the client side
- No additional database queries per person/topic

### Edge Cases Handled
1. **No messages**: Uses `created_at` as fallback
2. **Null timestamps**: NULLS LAST behavior ensures they go to the bottom
3. **Multiple messages**: Only the most recent message timestamp is used
4. **Optimistic updates**: New persons are prepended with `created_at` as initial activity

## Testing Guide

### Test 1: Basic Ordering
1. Open the app and view the Home screen
2. Note the current order of people/topics
3. Open a chat with a person/topic that is NOT at the top
4. Send a message
5. Navigate back to Home
6. **Expected**: That person/topic should now be at the top

### Test 2: Persistence
1. Open a chat and send a message
2. Force close the app (swipe up from app switcher)
3. Reopen the app
4. Navigate to Home
5. **Expected**: The person/topic you chatted with should still be at the top

### Test 3: Multiple Chats
1. Chat with Person A
2. Return to Home (Person A should be at top)
3. Chat with Person B
4. Return to Home (Person B should be at top, Person A second)
5. Chat with Person C
6. Return to Home (Person C should be at top, Person B second, Person A third)

### Test 4: No Messages
1. Add a new person/topic
2. Do NOT send any messages
3. **Expected**: The new person/topic should appear at the top (sorted by `created_at`)
4. Chat with an existing person/topic
5. **Expected**: The chatted person/topic should move to the top, new person/topic moves down

## Files Modified

1. **app/(tabs)/(home)/index.tsx**
   - Updated `fetchData()` function to compute last activity from messages
   - Added sorting logic for people and topics
   - Updated `PersonWithLastMessage` interface
   - Updated `handlePersonCreated()` to include `lastActivityAt`

## No Database Changes Required
- The implementation uses existing tables (`persons`, `messages`)
- No migrations needed
- No new columns added
- All data is computed at query time

## Deployment Checklist

- [x] Code changes implemented
- [x] TypeScript interfaces updated
- [x] Sorting logic tested
- [x] NULLS LAST behavior verified
- [x] Optimistic updates handled
- [x] Focus effect refresh working
- [x] No UI regressions
- [x] Documentation created

## Support

If you encounter any issues:
1. Check the console logs for `[Home]` prefixed messages
2. Verify the `messages` table has data
3. Ensure `person_id` foreign keys are correct
4. Check that `created_at` timestamps exist on all persons
