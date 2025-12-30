
# Shared Cache & Perceived Performance Boost

## Overview

This implementation adds a **shared in-memory cache** to make the app feel fast and stable across sessions.

## Features

### 1. In-Memory Cache Store (Singleton)

**Location:** `lib/cache/memoryCache.ts`

**Cached Data:**
- People list ordering
- Topics list ordering
- Last activity timestamps (person_id → timestamp)
- Therapist persona metadata (prepared for future use)

**Cache Expiration:**
- People/Topics lists: 5 minutes
- Therapist persona: 10 minutes
- Last activity timestamps: Never expire (cleared on logout)

### 2. Home Screen Optimization

**Strategy: Cache-First Loading**

1. **Instant Load:** Check cache first and display immediately
2. **Background Revalidation:** Fetch fresh data from Supabase
3. **Merge Updates:** Update cache and state with fresh data

**Benefits:**
- Home screen loads instantly with cached data
- No loading spinner if cache is fresh
- Smooth transitions when data updates

**Code Changes:**
- `app/(tabs)/(home)/index.tsx`
- Uses `memoryCache.getPeopleList()` and `memoryCache.getTopicsList()`
- Updates cache after every fetch with `memoryCache.setPeopleList()` and `memoryCache.setTopicsList()`

### 3. Chat Screen Cache Updates

**Strategy: Instant Cache Updates**

When user sends a message or receives an assistant reply:
1. Update `last_activity_at` in database
2. **Immediately update cache** with `memoryCache.setLastActivity()`
3. Home screen will reflect new ordering on next visit (no wait)

**Code Changes:**
- `app/(tabs)/(home)/chat.tsx`
- Calls `memoryCache.setLastActivity()` after user message insert
- Calls `memoryCache.setLastActivity()` after assistant message received

### 4. Logout Cache Clearing

**Strategy: Clear All Cache on Logout**

When user logs out:
1. Clear local auth state
2. **Clear all cache data** with `memoryCache.clearAll()`
3. Sign out from Supabase

**Code Changes:**
- `contexts/AuthContext.tsx`
- Calls `memoryCache.clearAll()` in `signOut()` function

## Cache API Reference

### Get Cached Data

```typescript
// Get people list (returns empty array if stale)
const people = memoryCache.getPeopleList();

// Get topics list (returns empty array if stale)
const topics = memoryCache.getTopicsList();

// Get last activity timestamp for a person
const timestamp = memoryCache.getLastActivity(personId);

// Get therapist persona (returns null if stale)
const persona = memoryCache.getTherapistPersona();
```

### Update Cache

```typescript
// Update people list
memoryCache.setPeopleList(peopleArray);

// Update topics list
memoryCache.setTopicsList(topicsArray);

// Update single last activity timestamp
memoryCache.setLastActivity(personId, timestamp);

// Bulk update last activity timestamps
memoryCache.setLastActivityBulk([
  { personId: 'id1', timestamp: '2025-01-01T00:00:00Z' },
  { personId: 'id2', timestamp: '2025-01-01T00:00:00Z' },
]);

// Update therapist persona
memoryCache.setTherapistPersona(persona);
```

### Cache Management

```typescript
// Clear all cache (called on logout)
memoryCache.clearAll();

// Clear only people and topics cache (useful for refresh)
memoryCache.clearListsCache();

// Check if cache is fresh
const isFresh = memoryCache.isPeopleCacheFresh();
const isTopicsFresh = memoryCache.isTopicsCacheFresh();

// Get cache statistics (dev only)
const stats = memoryCache.getStats();
console.log(stats);
// {
//   peopleCount: 5,
//   topicsCount: 3,
//   peopleCacheAge: 120000, // milliseconds
//   topicsCacheAge: 120000,
//   therapistPersonaCacheAge: null,
//   lastActivityCount: 8
// }
```

## Performance Benefits

### Before (No Cache)

1. User opens Home screen
2. Loading spinner shows
3. Fetch data from Supabase (500ms - 2s)
4. Display data
5. **Total perceived time: 500ms - 2s**

### After (With Cache)

1. User opens Home screen
2. Display cached data **instantly** (0ms)
3. Fetch fresh data in background (500ms - 2s)
4. Merge updates smoothly
5. **Total perceived time: 0ms (instant)**

### Chat Activity Updates

**Before:**
- User sends message in Chat
- Returns to Home
- Home refetches data (500ms - 2s)
- List reorders

**After:**
- User sends message in Chat
- Cache updates instantly
- Returns to Home
- Home loads from cache (0ms)
- List already reordered

## Testing Checklist

- [ ] Home screen loads instantly with cached data
- [ ] Home screen revalidates in background
- [ ] Chat updates cache on message send
- [ ] Chat updates cache on assistant reply
- [ ] Home screen reflects new ordering after chat activity
- [ ] Cache clears on logout
- [ ] Cache expires after 5 minutes (people/topics)
- [ ] No stale data shown after cache expiration

## Dev Tools

### View Cache Stats

```typescript
import { memoryCache } from '@/lib/cache/memoryCache';

// In any component or screen
const stats = memoryCache.getStats();
console.log('[Cache Stats]', stats);
```

### Force Cache Clear

```typescript
import { memoryCache } from '@/lib/cache/memoryCache';

// Clear all cache
memoryCache.clearAll();

// Clear only lists
memoryCache.clearListsCache();
```

## Architecture Notes

### Singleton Pattern

The cache uses a singleton pattern to ensure a single instance across the entire app:

```typescript
class MemoryCache {
  private static instance: MemoryCache;
  
  public static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }
}

export const memoryCache = MemoryCache.getInstance();
```

### Cache-Aside Pattern

The Home screen uses the cache-aside pattern:

1. **Read:** Check cache first, return if fresh
2. **Miss:** Fetch from database if cache is stale
3. **Write:** Update cache with fresh data

### Event-Driven Updates

Chat events trigger cache updates:

- User message sent → Update cache
- Assistant reply received → Update cache
- Home screen → Reads from cache (already updated)

## Future Enhancements

### Potential Additions

1. **Therapist Persona Caching**
   - Cache selected therapist persona metadata
   - Reduce lookups in TherapistPersonas constant

2. **Message Count Caching**
   - Cache message counts per person/topic
   - Display in PersonCard without query

3. **Persistent Cache**
   - Use AsyncStorage for longer-term caching
   - Survive app restarts

4. **Cache Invalidation Events**
   - Listen to Supabase realtime events
   - Invalidate cache when data changes

5. **Selective Cache Updates**
   - Update only changed items instead of full list
   - More efficient for large datasets

## Troubleshooting

### Cache Not Updating

**Symptom:** Home screen shows stale data

**Solution:**
1. Check if `memoryCache.setPeopleList()` is called after fetch
2. Verify cache expiration time (5 minutes)
3. Force clear cache: `memoryCache.clearAll()`

### Cache Not Clearing on Logout

**Symptom:** Old user's data visible after logout

**Solution:**
1. Verify `memoryCache.clearAll()` is called in `signOut()`
2. Check console logs for "Memory cache cleared"
3. Ensure logout flow completes successfully

### Home Screen Not Loading from Cache

**Symptom:** Loading spinner always shows

**Solution:**
1. Check if cache is populated: `memoryCache.getStats()`
2. Verify cache is not stale (< 5 minutes old)
3. Ensure `fetchData()` is called at least once

## Summary

This implementation provides:

✅ **Instant Home screen loading** with cached data
✅ **Background revalidation** for fresh data
✅ **Instant cache updates** on chat activity
✅ **Automatic cache clearing** on logout
✅ **5-minute cache expiration** to prevent stale data
✅ **Zero breaking changes** to existing functionality

**Result:** The app feels fast, responsive, and stable across sessions.
