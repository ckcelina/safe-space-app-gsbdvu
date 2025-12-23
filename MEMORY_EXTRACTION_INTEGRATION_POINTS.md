
# Memory Extraction - Integration Points

## Where Memory Extraction Happens

### File: `app/(tabs)/(home)/chat.tsx`

#### Import Statements (Top of File)
```typescript
import { extractMemoriesAsync } from '@/lib/memory/extractMemories';
import { getPersonMemories } from '@/lib/memory/personMemory';
```

#### Trigger Point (Inside `sendMessage` function)
Located after the AI reply is successfully inserted into the database:

```typescript
// Line ~XXX in sendMessage function
if (isMountedRef.current) {
  setAllMessages((prev) => [...prev, aiInserted]);
  scrollToBottom();
  setIsTyping(false);
  setIsSending(false);
  isGeneratingRef.current = false;
}
console.log('[Chat] sendMessage: Complete');

// ⭐ MEMORY EXTRACTION TRIGGER ⭐
// This is the ONLY place where memory extraction is triggered
try {
  console.log('[Chat] Triggering memory extraction...');
  
  // Get existing memories for context
  const existingMemories = await getPersonMemories(userId, personId, 50);
  
  // Extract last 5 user messages for context
  const userMessages = subjectMessages
    .filter(m => m.role === 'user')
    .slice(-5)
    .map(m => m.content);

  // Fire and forget - this will not block the UI
  extractMemoriesAsync({
    personName,
    recentUserMessages: userMessages,
    lastAssistantMessage: replyText,
    existingMemories,
    userId,
    personId,
  });
  
  console.log('[Chat] Memory extraction triggered (background)');
} catch (memoryError) {
  // Silently fail - memory extraction should never break chat
  console.error('[Chat] Memory extraction trigger failed:', memoryError);
}
```

## Why This Location?

### ✅ Advantages
1. **After successful reply**: Ensures we have both user message and AI response
2. **Non-blocking**: Uses `extractMemoriesAsync()` which is fire-and-forget
3. **Context-rich**: Has access to full conversation history
4. **Safe**: Wrapped in try-catch to never disrupt chat

### ❌ Alternative Locations (Not Used)
- **Before AI call**: Would miss AI's response context
- **In useEffect**: Would trigger on every render
- **In loadMessages**: Would trigger on page load (unnecessary)
- **In a separate component**: Would complicate state management

## Data Flow

```
User sends message
       ↓
Message inserted to DB
       ↓
AI Edge Function called
       ↓
AI reply generated
       ↓
AI reply inserted to DB
       ↓
UI updated with new message
       ↓
⭐ MEMORY EXTRACTION TRIGGERED ⭐
       ↓
Extract last 5 user messages
       ↓
Fetch existing memories
       ↓
Call extract-memories Edge Function
       ↓
OpenAI extracts facts
       ↓
Upsert memories to DB
       ↓
Update last_mentioned_at
       ↓
Done (silently, in background)
```

## What Gets Passed to Extraction

### Parameters
```typescript
{
  personName: string;           // "John Doe"
  recentUserMessages: string[]; // Last 5 user messages
  lastAssistantMessage: string; // AI's most recent reply
  existingMemories: Memory[];   // Up to 50 existing memories
  userId: string;               // Current user's ID
  personId: string;             // Person being discussed
}
```

### Example
```typescript
{
  personName: "Sarah",
  recentUserMessages: [
    "My sister Sarah is a teacher",
    "She works at Lincoln High School",
    "She loves gardening"
  ],
  lastAssistantMessage: "It sounds like Sarah is passionate about education...",
  existingMemories: [
    { key: "relationship", value: "sister", category: "relationship" }
  ],
  userId: "user-123",
  personId: "person-456"
}
```

## Error Handling

### Level 1: Trigger Point (chat.tsx)
```typescript
try {
  extractMemoriesAsync(...);
} catch (memoryError) {
  console.error('[Chat] Memory extraction trigger failed:', memoryError);
  // Continue - don't throw
}
```

### Level 2: Async Wrapper (extractMemories.ts)
```typescript
export function extractMemoriesAsync(params: ExtractMemoriesParams): void {
  extractMemories(params).catch(error => {
    console.error('[Memory Extraction] Background extraction failed:', error);
    // Silently fail - this is intentional
  });
}
```

### Level 3: Main Function (extractMemories.ts)
```typescript
export async function extractMemories(...) {
  try {
    // ... extraction logic ...
  } catch (error: any) {
    console.error('[Memory Extraction] Unexpected error:', error?.message || error);
    return { memories: [], mentioned_keys: [] };
  }
}
```

### Level 4: Edge Function (extract-memories/index.ts)
```typescript
try {
  // ... OpenAI call ...
} catch (error) {
  console.error('❌ Error in extract-memories:', error);
  return new Response(
    JSON.stringify({ memories: [], mentioned_keys: [] }),
    { status: 500 }
  );
}
```

## Testing the Integration

### 1. Enable Verbose Logging
All logs are already in place. Just open browser console or React Native debugger.

### 2. Send a Test Message
```
User: "My mom is a teacher at Lincoln High School"
```

### 3. Watch Console Logs
```
[Chat] Inserting user message...
[Chat] User message inserted: msg-123
[Chat] Calling AI Edge Function...
[Chat] AI response received
[Chat] Inserting AI message...
[Chat] AI message inserted: msg-456
[Chat] sendMessage: Complete
[Chat] Triggering memory extraction...
[Memory Extraction] Starting extraction for person: Mom
[Memory Extraction] User messages: 1
[Memory Extraction] Existing memories: 0
[Memory Extraction] Upserting 1 memories
[Memory Extraction] Extraction complete
[Chat] Memory extraction triggered (background)
```

### 4. Verify Database
```sql
SELECT * FROM person_memories 
WHERE person_id = 'person-id'
ORDER BY created_at DESC
LIMIT 5;
```

Should see:
```
| key        | value                              | category |
|------------|------------------------------------|----------|
| occupation | teacher at Lincoln High School     | identity |
```

## Monitoring

### Success Indicators
- ✅ No errors in console
- ✅ Logs show "Extraction complete"
- ✅ Database has new rows in `person_memories`
- ✅ Chat continues normally

### Failure Indicators
- ❌ Errors in console with `[Memory Extraction]` prefix
- ❌ No database rows created
- ❌ Edge Function logs show errors

### What to Check on Failure
1. Is Edge Function deployed?
2. Is OPENAI_API_KEY set?
3. Is OpenAI API responding?
4. Are there network issues?
5. Is the database accessible?

## Rollback Plan

If memory extraction causes issues:

### Option 1: Disable Extraction (Quick)
Comment out the extraction trigger in `chat.tsx`:
```typescript
// MEMORY EXTRACTION DISABLED
// try {
//   extractMemoriesAsync(...);
// } catch (memoryError) {
//   console.error('[Chat] Memory extraction trigger failed:', memoryError);
// }
```

### Option 2: Remove Edge Function
```bash
supabase functions delete extract-memories
```

### Option 3: Full Rollback
1. Revert `chat.tsx` changes
2. Delete `lib/memory/extractMemories.ts`
3. Delete `supabase/functions/extract-memories/`
4. Uninstall `openai` package (optional)

## Future Enhancements

### Potential Improvements
1. **Batch extraction**: Extract from multiple messages at once
2. **Smart timing**: Only extract after N messages or M minutes
3. **Memory conflicts**: Detect and resolve conflicting memories
4. **Memory importance**: Auto-adjust importance based on mentions
5. **Memory decay**: Lower confidence over time if not mentioned
6. **User feedback**: Let users correct or delete memories

### Potential Integration Points
1. **Profile screen**: Show extracted memories
2. **Chat screen**: Display relevant memories in sidebar
3. **Settings**: Toggle extraction on/off
4. **Analytics**: Track extraction success rate
