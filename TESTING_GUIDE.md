
# Testing Guide - Data Model & UX Logic Fixes

This guide provides step-by-step instructions to test all the fixes applied to the Safe Space app.

---

## Prerequisites

1. **Run the database migration first:**
   - Open Supabase SQL Editor
   - Execute `MIGRATION_ALLOW_DUPLICATE_NAMES.sql`
   - Verify success messages

2. **Have two test accounts ready:**
   - Account A: test1@example.com
   - Account B: test2@example.com

---

## Test 1: People List - Single Unified Section

### Expected Behavior:
- All people appear under ONE section titled "People"
- No "Family" or "Friends" headers
- Relationship type shown as metadata under each name
- List sorted by most recently added (newest first)

### Steps:
1. Log in to the app
2. Navigate to Home screen
3. Add several people with different relationship types:
   - "John" - relationship: "Friend"
   - "Sarah" - relationship: "Sister"
   - "Mike" - relationship: "Colleague"
   - "Dad" - relationship: "Father"

### Verify:
- [ ] All 4 people appear under single "People" header
- [ ] No separate "Family" or "Friends" sections
- [ ] Relationship type visible under each name
- [ ] Most recently added person appears first

---

## Test 2: Allow Multiple People with Same Name

### Expected Behavior:
- Can add multiple people with identical names
- Each person has unique chat history
- No duplicate error messages
- Each person differentiated by relationship type

### Steps:
1. Add first person:
   - Name: "Dad"
   - Relationship: "Father"
   - Save successfully

2. Add second person with same name:
   - Name: "Dad"
   - Relationship: "Step-father"
   - Save successfully

3. Add third person with same name:
   - Name: "Dad"
   - Relationship: "Friend's Dad"
   - Save successfully

### Verify:
- [ ] All 3 "Dad" entries saved without errors
- [ ] No "This person already exists" toast
- [ ] Each "Dad" has separate card in People list
- [ ] Relationship type differentiates them
- [ ] Tapping each "Dad" opens separate chat

### Test Chat Isolation:
1. Open chat with first "Dad" (Father)
2. Send message: "Hi, how are you?"
3. Go back to Home
4. Open chat with second "Dad" (Step-father)
5. Verify: Chat is empty (no messages from first Dad)
6. Send message: "Hello there"
7. Go back to Home
8. Open chat with first "Dad" again
9. Verify: Only shows "Hi, how are you?" message

### Verify:
- [ ] Each "Dad" has completely separate chat history
- [ ] Messages don't mix between same-named people
- [ ] Chat context preserved correctly

---

## Test 3: Add Person Flow

### Expected Behavior:
- No duplicate checking
- Immediate list refresh after save
- Modal closes automatically
- Success toast appears

### Steps:
1. Tap "Add Person" button
2. Enter name: "Mom"
3. Enter relationship: "Mother"
4. Tap "Save"

### Verify:
- [ ] No "This person already exists" error
- [ ] Success toast appears
- [ ] Modal closes automatically
- [ ] "Mom" appears in People list immediately
- [ ] No need to manually refresh

### Test Duplicate Save:
1. Tap "Add Person" again
2. Enter same name: "Mom"
3. Enter different relationship: "Friend's Mom"
4. Tap "Save"

### Verify:
- [ ] Saves successfully without error
- [ ] Both "Mom" entries visible in list
- [ ] No blocking or warning messages

---

## Test 4: Chat Loop Prevention

### Expected Behavior:
- One user message → one AI response
- No repeated generic responses
- Send button disabled while waiting
- Messages append once only

### Steps:
1. Open chat with any person
2. Send message: "I'm feeling anxious"
3. Wait for AI response
4. Note the AI response content
5. Send another message: "Tell me more"
6. Wait for AI response
7. Note the second AI response

### Verify:
- [ ] Each user message gets exactly one AI response
- [ ] AI responses are different (not repeated)
- [ ] Send button disabled while AI is typing
- [ ] No duplicate messages appear
- [ ] Typing indicator shows while waiting
- [ ] Messages don't re-send on screen rotation

### Test Rapid Sending:
1. Type a message
2. Tap send button multiple times quickly
3. Observe behavior

### Verify:
- [ ] Only one message sent (not multiple)
- [ ] Only one AI response generated
- [ ] No duplicate messages in chat

### Test Subject Context:
1. Select "General" subject
2. Send message: "Hello"
3. Wait for response
4. Switch to "Work / Career" subject
5. Verify: Chat is empty (different subject)
6. Send message: "I'm stressed about work"
7. Wait for response
8. Switch back to "General" subject
9. Verify: Shows "Hello" conversation

### Verify:
- [ ] Each subject has separate message history
- [ ] AI context switches correctly per subject
- [ ] No message mixing between subjects

---

## Test 5: Multi-User Data Safety (CRITICAL)

### Expected Behavior:
- User A cannot see User B's data
- User A cannot delete User B's data
- Complete data isolation between users

### Setup:
- Account A: test1@example.com
- Account B: test2@example.com

### Steps:

#### Part 1: Data Isolation
1. **Log in as User A**
2. Add person: "Alice" - relationship: "Friend"
3. Open chat with Alice
4. Send message: "User A's message"
5. Note the person ID from URL or logs
6. Log out

7. **Log in as User B**
8. Navigate to Home screen
9. Observe People list

### Verify:
- [ ] User B does NOT see "Alice" in their list
- [ ] User B's People list is empty (or shows only their own people)
- [ ] No data from User A visible

#### Part 2: Add Same Name
1. **Still logged in as User B**
2. Add person: "Alice" - relationship: "Sister"
3. Open chat with Alice
4. Send message: "User B's message"
5. Log out

6. **Log in as User A**
7. Open chat with Alice
8. Observe messages

### Verify:
- [ ] User A only sees "User A's message"
- [ ] User A does NOT see "User B's message"
- [ ] Complete message isolation

#### Part 3: Delete Safety
1. **Still logged in as User A**
2. Swipe left on "Alice" card
3. Tap delete button
4. Confirm deletion
5. Verify: Alice removed from User A's list
6. Log out

7. **Log in as User B**
8. Navigate to Home screen
9. Observe People list

### Verify:
- [ ] User B still sees their "Alice"
- [ ] User B's Alice was NOT deleted
- [ ] User B's messages still intact
- [ ] Complete deletion isolation

#### Part 4: Direct Database Query (Optional)
If you have access to Supabase dashboard:

1. Open Supabase SQL Editor
2. Run query:
```sql
SELECT id, user_id, name, relationship_type 
FROM persons 
WHERE name = 'Alice';
```

### Verify:
- [ ] Two separate rows for "Alice"
- [ ] Different user_id values
- [ ] Different id (UUID) values
- [ ] User A's Alice deleted (if Part 3 completed)
- [ ] User B's Alice still exists

---

## Test 6: Search Functionality

### Expected Behavior:
- Search works across all people
- Filters by name and relationship type
- No grouping in search results

### Steps:
1. Add multiple people:
   - "John" - "Friend"
   - "Jane" - "Sister"
   - "Jack" - "Colleague"
   - "Sarah" - "Friend"

2. Use search bar:
   - Search: "J"
   - Search: "Friend"
   - Search: "Sister"

### Verify:
- [ ] Search by name works (J shows John, Jane, Jack)
- [ ] Search by relationship works (Friend shows John, Sarah)
- [ ] All results under single "People" header
- [ ] Clear button (X) appears when typing
- [ ] Tapping X clears search and shows all people

---

## Test 7: Add Topic Flow

### Expected Behavior:
- Can add topics just like people
- Topics appear in People list
- Each topic has separate chat

### Steps:
1. Tap "Add Topic" button
2. Select quick topic: "Work / Career"
3. Tap "Save subject"

### Verify:
- [ ] Topic saved successfully
- [ ] Navigates to chat screen
- [ ] Topic appears in People list with "Topic" relationship
- [ ] Can add same topic multiple times (if needed)

---

## Test 8: Edge Cases

### Test Empty States:
1. Delete all people
2. Observe Home screen

### Verify:
- [ ] Shows "No one added yet" message
- [ ] Shows "Tap 'Add Person' to start" hint
- [ ] No errors or crashes

### Test Long Names:
1. Add person with very long name (50 characters)
2. Add person with special characters: "O'Brien"
3. Add person with emoji: "Mom ❤️"

### Verify:
- [ ] All names save correctly
- [ ] Display properly in list
- [ ] No truncation issues
- [ ] No character encoding errors

### Test Network Issues:
1. Turn off internet
2. Try to add person
3. Observe error handling

### Verify:
- [ ] Shows user-friendly error message
- [ ] Doesn't crash
- [ ] Can retry when internet restored

---

## Test 9: Performance

### Test Large Lists:
1. Add 20+ people
2. Scroll through list
3. Search for specific person
4. Delete a person

### Verify:
- [ ] List scrolls smoothly
- [ ] Search is responsive
- [ ] Delete works correctly
- [ ] No lag or freezing

---

## Test 10: Persistence

### Test Data Persistence:
1. Add several people
2. Send messages in multiple chats
3. Force close app
4. Reopen app

### Verify:
- [ ] All people still visible
- [ ] All messages preserved
- [ ] No data loss
- [ ] Correct order maintained

---

## Regression Testing

### Test Existing Features:
- [ ] Login/Signup still works
- [ ] Theme selection works
- [ ] Settings screen accessible
- [ ] Library screen works
- [ ] Profile editing works
- [ ] Logout works correctly

---

## Bug Report Template

If you find any issues, report them using this template:

```
**Issue Title:** [Brief description]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[If applicable]

**Device Info:**
- Device: [iPhone 14, Pixel 7, etc.]
- OS: [iOS 17, Android 13, etc.]
- App Version: [Version number]

**Additional Context:**
[Any other relevant information]
```

---

## Success Criteria

All tests should pass with these results:

✅ **People List:** Single unified section, no grouping  
✅ **Duplicate Names:** Multiple same-named people allowed  
✅ **Add Person:** No duplicate errors, immediate refresh  
✅ **Chat Loop:** One message → one response, no loops  
✅ **Multi-User Safety:** Complete data isolation  
✅ **Search:** Works across all people  
✅ **Topics:** Can add and chat about topics  
✅ **Edge Cases:** Handles errors gracefully  
✅ **Performance:** Smooth with large lists  
✅ **Persistence:** Data survives app restart  

---

## Conclusion

If all tests pass, the fixes are working correctly and the app is ready for production use.

If any tests fail, refer to the bug report template and provide detailed information for debugging.
