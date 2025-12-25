
# Memory Reliability Fix - Complete Implementation

## Overview
Fixed per-person memory reliability end-to-end to address issues with memories not appearing, disappearing, or showing low-quality data.

## Problems Fixed

### 1. Memory Upsert Not Setting `last_mentioned_at`
**Problem:** The upsert operation in `personMemory.ts` was not setting `last_mentioned_at` on new inserts, only on updates. This caused new memories to have `NULL` for `last_mentioned_at`, which affected sorting and display.

**Fix:** Modified `upsertPersonMemories()` to set both `updated_at` AND `last_mentioned_at` on every upsert (both INSERT and UPDATE operations).

```typescript
const updates = filteredMemories.map((memory) => ({
  user_id: userId,
  person_id: personId,
  category: memory.category,
  key: memory.key,
  value: memory.value,
  importance: memory.importance,
  confidence: memory.confidence,
  updated_at: now,
  last_mentioned_at: now, // CRITICAL: Set on both INSERT and UPDATE
}));
```

### 2. Low-Quality Memory Extraction
**Problem:** The AI was extracting generic keys like "age_reference: 10" without context, creating noise in the memory list.

**Fixes:**
- **Edge Function Prompt:** Updated extraction rules to be stricter:
  - NEVER extract generic age references without context
  - If a number is mentioned, it MUST have a labeled key with context
  - Example: "He got kidney failure when he was 10" → `medical_history:kidney_failure_age: "kidney failure at age 10"`
  - Focus on stable facts only: death, medical history, relationship changes, major dates

- **Client-Side Filtering:** Added `filterLowSignalMemories()` function that removes:
  - Generic age references without medical/major event context
  - Very short values (< 3 characters)
  - Low confidence memories (< 2)

- **Improved Local Extraction:** Enhanced `localExtract.ts` with contextual age patterns:
  ```typescript
  // Only extract age if tied to medical/major event
  /when (he|she|they) (was|were) (\d+)[,\s]+(kidney|cancer|heart|stroke|died|passed)/i
  ```

### 3. Memories Screen Showing Blank State During Refresh
**Problem:** When refreshing the memories list, the screen would briefly show "No memories saved yet" even when memories existed, because the loading state was overwriting the existing list.

**Fixes:**
- Added separate `refreshing` state to distinguish initial load from refresh
- Modified `fetchMemories()` to accept `isRefresh` parameter
- Only update memories state if we got valid data (not `null`)
- Show loading overlay only on initial load, not during refresh
- Use stable keys for FlatList items: `${memory.id}-${memory.category}-${memory.key}`

```typescript
// CRITICAL: Only update memories if we got valid data
// This prevents blank state from overwriting existing list
if (isMountedRef.current && data !== null) {
  setMemories(data);
}
```

### 4. Conversation Continuity Not Conditionally Applied
**Problem:** Continuity data was being extracted and stored even when the user had disabled it.

**Fix:** The continuity toggle in the Memories screen already controls the `continuity_enabled` flag in `person_chat_summaries`. The chat screen needs to check this flag before:
- Injecting continuity fields into prompts
- Updating continuity summaries after replies

**Note:** The chat screen already has the infrastructure to handle continuity data conditionally. The Edge Function for `generate-ai-response` should check the `continuity_enabled` flag before using continuity data in prompts.

## Files Modified

### 1. `lib/memory/personMemory.ts`
- Added `filterLowSignalMemories()` function to remove low-quality memories
- Modified `upsertPersonMemories()` to set `last_mentioned_at` on all upserts
- Added comprehensive logging for debugging

### 2. `lib/memory/extractMemories.ts`
- Added local fallback extraction when Edge Function fails
- Improved error handling with multiple fallback layers
- Always attempts local extraction if AI extraction fails

### 3. `lib/memory/localExtract.ts`
- Tightened extraction rules to avoid low-signal data
- Added contextual age pattern matching (only with medical/major events)
- Added more medical conditions and major life events
- Improved pattern matching for relationship status changes

### 4. `app/(tabs)/(home)/memories.tsx`
- Fixed blank state flashing during refresh
- Added `refreshing` state separate from `loading`
- Modified `fetchMemories()` to handle refresh vs initial load
- Use stable keys for list items: `${memory.id}-${memory.category}-${memory.key}`
- Added friendly labels for `medical_history:*` prefixed keys
- Improved loading overlay logic (only show on initial load)

### 5. `supabase/functions/extract-memories/index.ts` (Edge Function)
- Updated extraction prompt with stricter rules
- Added explicit examples of what NOT to extract
- Emphasized contextual age references only
- Added rule: "When in doubt, DO NOT extract - better to miss a memory than store noise"

## Database Schema
The `person_memories` table already has the correct unique constraint:
```sql
UNIQUE (user_id, person_id, key)
```

This ensures merge-safe upserts where the same key for the same user+person combination will UPDATE instead of creating duplicates.

## Testing Checklist

### Memory Upsert
- [x] New memories have `last_mentioned_at` set
- [x] Existing memories update `last_mentioned_at` when re-mentioned
- [x] Low-signal memories are filtered out before upsert
- [x] Upsert is merge-safe (no duplicates)

### Memory Extraction
- [x] AI extraction works with improved prompt
- [x] Local fallback works when AI fails
- [x] Generic age references are NOT stored
- [x] Contextual age references ARE stored (e.g., "kidney failure at age 10")
- [x] Death/loss detection works
- [x] Medical history extraction works

### Memories Screen
- [x] No blank state flashing during refresh
- [x] Memories persist across refreshes
- [x] Loading overlay only shows on initial load
- [x] Stable keys prevent list flickering
- [x] Continuity toggle works correctly

### Conversation Continuity
- [x] Continuity toggle in Memories screen works
- [x] Continuity data is extracted when enabled
- [ ] **TODO:** Chat screen should check `continuity_enabled` flag before using continuity data in prompts

## Known Limitations

1. **Continuity in Chat Prompts:** The chat screen currently extracts and stores continuity data, but the `generate-ai-response` Edge Function needs to be updated to check the `continuity_enabled` flag before injecting continuity fields into prompts.

2. **Local Extraction Patterns:** The local extraction uses simple regex patterns and may miss some edge cases. It's designed as a fallback, not a replacement for AI extraction.

3. **Memory Quality:** While we've tightened the rules, the AI may still occasionally extract low-quality memories. Users can manually delete these from the Memories screen.

## Future Improvements

1. **Continuity in Prompts:** Update `generate-ai-response` Edge Function to conditionally inject continuity data based on `continuity_enabled` flag.

2. **Memory Confidence Decay:** Consider implementing a confidence decay system where memories that haven't been mentioned in a long time have their confidence reduced.

3. **Memory Merging:** Implement logic to merge similar memories (e.g., "loves hiking" and "enjoys hiking" should be one memory).

4. **Memory Suggestions:** Show users suggested memories they might want to add based on conversation patterns.

5. **Memory Categories:** Allow users to create custom memory categories.

## Deployment Notes

- All client-side changes are deployed automatically
- Edge Function `extract-memories` has been deployed (version 5)
- No database migrations required (schema already correct)
- No breaking changes to existing data

## Error Handling

All memory operations are fail-safe:
- Memory extraction failures never crash the chat
- Local fallback ensures some memories are always extracted
- Upsert failures are logged but don't block the UI
- Fetch failures show error banner but keep existing list

## Logging

Comprehensive logging has been added for debugging:
- `[Memory]` prefix for all memory-related logs
- `[LocalExtract]` prefix for local extraction logs
- `[Memories]` prefix for Memories screen logs
- All errors are logged with context

## Summary

This implementation addresses all four main issues:
1. ✅ Memory upsert is now merge-safe and sets `last_mentioned_at` correctly
2. ✅ Extraction quality is improved with tighter rules and filtering
3. ✅ Memories screen no longer shows blank state during refresh
4. ⚠️ Continuity toggle works, but chat prompts need to check the flag (TODO)

The system is now more reliable, with multiple layers of fallback and comprehensive error handling to ensure memories are always saved and displayed correctly.
