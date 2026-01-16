
# Memory Extraction Implementation Summary

## Overview
Successfully added memory extraction to the Safe Space app to build a per-person "brain" without breaking any existing functionality.

## What Was Added

### 1. Memory Extraction Module (`lib/memory/extractMemories.ts`)
- **Purpose**: Extracts stable facts from user messages and stores them in `person_memories` table
- **Key Functions**:
  - `extractMemories()`: Main extraction function that calls Supabase Edge Function
  - `extractMemoriesAsync()`: Fire-and-forget wrapper for background extraction

### 2. Supabase Edge Function (`supabase/functions/extract-memories/index.ts`)
- **Purpose**: Server-side function that uses OpenAI to extract memories
- **Features**:
  - Uses GPT-3.5-turbo with low temperature (0.1) for stable extractions
  - Extracts only explicitly stated facts (never guesses or infers)
  - Returns structured JSON with memories and mentioned keys
  - Handles special case for deceased persons

### 3. Chat Integration (`app/(tabs)/(home)/chat.tsx`)
- **Where**: After AI reply is successfully generated and inserted
- **How**: Calls `extractMemoriesAsync()` in the background
- **Fail-Safe**: Wrapped in try-catch to never disrupt chat flow

## Memory Extraction Rules

### What Gets Extracted
- **Identity**: Basic facts (age, occupation, location)
- **Relationship**: How they relate to the user
- **History**: Past events or background
- **Preferences**: Likes, dislikes, habits
- **Boundaries**: Stated limits or rules
- **Loss/Grief**: Information about loss or death
- **Conflict Patterns**: Recurring issues
- **Goals**: Stated goals or aspirations
- **Context**: Other relevant stable context

### What Does NOT Get Extracted
- ❌ Emotions or feelings
- ❌ Insults or negative one-off comments
- ❌ Temporary states or one-off events
- ❌ Inferred or assumed information

### Special Case: Deceased Persons
If user states the person is deceased:
```json
{
  "category": "loss_grief",
  "key": "is_deceased",
  "value": "true",
  "importance": 5,
  "confidence": 5
}
```

## How It Works

### Flow
1. User sends a message
2. AI generates a reply
3. Reply is inserted into database
4. **Memory extraction is triggered** (background, non-blocking)
5. Edge Function calls OpenAI to extract facts
6. New memories are upserted to `person_memories`
7. Mentioned keys get `last_mentioned_at` updated

### Fail-Safe Design
- All errors are caught and logged
- Extraction failures never block chat
- If extraction fails, chat continues normally
- Fire-and-forget pattern ensures no UI blocking

## Database Operations

### Upsert Memories
```typescript
await upsertPersonMemories(userId, personId, memories);
```
- Inserts new memories or updates existing ones
- Uses unique constraint: `(user_id, person_id, key)`

### Touch Memories
```typescript
await touchMemories(userId, personId, mentioned_keys);
```
- Updates `last_mentioned_at` timestamp
- Tracks when memories were last relevant

## Deployment

### Deploy Edge Function
```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref zjzvkxvahrbuuyzjzxol

# Deploy the extract-memories function
supabase functions deploy extract-memories
```

### Environment Variables
Ensure `OPENAI_API_KEY` is set in Supabase Edge Function secrets.

## Testing

### Test Memory Extraction
1. Start a chat with a person
2. Send messages with stable facts:
   - "My mom is a teacher at Lincoln High School"
   - "She loves gardening and has been doing it for 20 years"
   - "She grew up in Boston"
3. Check console logs for extraction activity
4. Query `person_memories` table to verify storage

### Test Deceased Detection
1. Send message: "My dad passed away last year"
2. Check that `is_deceased` memory is created
3. Verify grief-aware responses in subsequent messages

## What Was NOT Changed
✅ Chat history storage - unchanged
✅ Navigation - unchanged
✅ Message display - unchanged
✅ AI reply generation - unchanged
✅ .ios.tsx files - remain re-export only

## Performance Impact
- **Minimal**: Extraction runs in background after reply
- **Non-blocking**: Uses fire-and-forget pattern
- **Fail-safe**: Errors never affect chat experience

## Future Enhancements
- Add memory viewing UI for users
- Add memory editing/deletion
- Add memory importance scoring
- Add memory conflict resolution
- Add memory-based conversation starters

## Files Modified
1. `lib/memory/extractMemories.ts` - NEW
2. `supabase/functions/extract-memories/index.ts` - NEW
3. `app/(tabs)/(home)/chat.tsx` - MODIFIED (added extraction trigger)
4. `package.json` - MODIFIED (added openai dependency)

## Dependencies Added
- `openai` (^6.15.0) - For OpenAI API types and utilities

## Console Logs
Look for these logs to track extraction:
- `[Chat] Triggering memory extraction...`
- `[Memory Extraction] Starting extraction for person: ...`
- `[Memory Extraction] Upserting X memories`
- `[Memory Extraction] Touching X memory keys`
- `[Memory Extraction] Extraction complete`

## Error Handling
All errors are logged with prefix `[Memory Extraction]`:
- Edge Function errors
- JSON parsing errors
- Database errors
- Network errors

All errors are caught and logged but never thrown to avoid disrupting chat.
