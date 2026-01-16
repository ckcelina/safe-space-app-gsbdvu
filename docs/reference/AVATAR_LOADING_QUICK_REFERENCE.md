
# Therapist Avatar Instant Loading — Quick Reference

## ✅ IMPLEMENTATION COMPLETE

Therapist avatars now load **instantly** with full offline support.

---

## 🎯 WHAT WAS DONE

### 1. **Local Bundled Assets**
- All therapist avatars are now **local bundled assets** using `require()`
- No remote URLs — works completely offline
- Assets are memoized at module initialization for instant access

### 2. **Avatar Prefetching**
- Created `lib/avatarPrefetch.ts` utility
- Prefetches all avatars on app start
- Prefetches selected avatar when persona changes
- Uses `expo-image` with `memory-disk` cache policy

### 3. **expo-image Integration**
- Replaced standard `Image` with `expo-image` in `AIHeaderRow`
- Enabled `memory-disk` caching for maximum performance
- Set `priority="high"` for instant rendering
- Disabled transitions (`transition={0}`) to prevent flashing

### 4. **Memoized Configuration**
- Avatar sources are loaded once at module initialization
- Stored in constants for instant access
- No runtime overhead

---

## 📁 FILES CHANGED

### **constants/TherapistPersonas.ts**
- Memoized avatar sources at module level
- All avatars use `require()` for local bundled assets
- No remote URLs

### **lib/avatarPrefetch.ts** (NEW)
- `prefetchAllAvatars()` — Prefetch all avatars on app start
- `prefetchSelectedAvatar(personaId)` — Prefetch specific avatar
- `clearAvatarCache()` — Clear cache for debugging

### **components/ui/AIHeaderRow.tsx**
- Replaced `Image` with `expo-image`
- Added `cachePolicy="memory-disk"`
- Added `priority="high"`
- Disabled transitions with `transition={0}`

### **contexts/UserPreferencesContext.tsx**
- Prefetches selected therapist avatar on load
- Prefetches new avatar when persona changes

### **app/_layout.tsx**
- Calls `prefetchAllAvatars()` on app start
- Non-blocking background prefetch

---

## 🚀 HOW IT WORKS

### **On App Start**
1. `app/_layout.tsx` calls `prefetchAllAvatars()`
2. All therapist avatars are loaded into memory + disk cache
3. Non-blocking — doesn't delay app startup

### **When User Loads Preferences**
1. `UserPreferencesContext` loads user's selected persona
2. Calls `prefetchSelectedAvatar(personaId)` for the selected avatar
3. Ensures selected avatar is in memory cache

### **When User Changes Persona**
1. `updatePreferences()` detects persona change
2. Calls `prefetchSelectedAvatar(newPersonaId)`
3. New avatar is prefetched before user navigates to chat

### **When Avatar Renders**
1. `AIHeaderRow` receives `therapistAvatarSource` (local asset)
2. `expo-image` checks memory cache first
3. If not in memory, loads from disk cache
4. If not on disk, loads from bundled asset
5. **Result: Instant rendering, no flashing**

---

## 🔧 USAGE

### **Prefetch All Avatars (App Start)**
```typescript
import { prefetchAllAvatars } from '@/lib/avatarPrefetch';

// In app/_layout.tsx or similar
useEffect(() => {
  prefetchAllAvatars().catch((error) => {
    console.warn('Avatar prefetch failed (non-critical):', error);
  });
}, []);
```

### **Prefetch Selected Avatar (Persona Change)**
```typescript
import { prefetchSelectedAvatar } from '@/lib/avatarPrefetch';

// When user changes persona
await prefetchSelectedAvatar(newPersonaId);
```

### **Render Avatar (Chat Screen)**
```typescript
import { AIHeaderRow } from '@/components/ui/AIHeaderRow';
import { getPersonaById } from '@/constants/TherapistPersonas';

const persona = getPersonaById(personaId);

<AIHeaderRow
  therapistName={persona?.name}
  therapistAvatarSource={persona?.image}
/>
```

---

## 🎨 CACHE POLICY

### **memory-disk**
- **Memory cache**: Fastest access, cleared on app restart
- **Disk cache**: Persists between app sessions
- **Fallback**: Loads from bundled asset if not cached

### **Why This Works**
- Local assets are always available (bundled with app)
- Memory cache provides instant access
- Disk cache provides fast access after app restart
- No network dependency — works offline

---

## 🧪 TESTING

### **Test Instant Loading**
1. Open app (cold start)
2. Navigate to chat screen
3. Avatar should appear **instantly** with no delay

### **Test Offline Support**
1. Enable airplane mode
2. Open app
3. Navigate to chat screen
4. Avatar should still load instantly

### **Test Persona Change**
1. Change therapist persona in settings
2. Navigate to chat screen
3. New avatar should appear instantly

### **Test Cache Persistence**
1. Open app
2. Navigate to chat screen (avatar loads)
3. Close app completely
4. Reopen app
5. Navigate to chat screen
6. Avatar should load instantly from disk cache

---

## 🐛 TROUBLESHOOTING

### **Avatar Not Loading**
- Check that avatar file exists in `assets/images/`
- Verify `require()` path is correct
- Check console for prefetch errors

### **Avatar Flashing/Flickering**
- Ensure `transition={0}` is set in `AIHeaderRow`
- Verify `cachePolicy="memory-disk"` is set
- Check that prefetch completed before render

### **Slow Loading After App Restart**
- Check disk cache is enabled (`memory-disk`)
- Verify prefetch is called on app start
- Check console for cache errors

---

## 📊 PERFORMANCE METRICS

### **Expected Performance**
- **First load (cold start)**: < 50ms (from bundled asset)
- **Subsequent loads**: < 10ms (from memory cache)
- **After app restart**: < 30ms (from disk cache)
- **Offline**: Same as online (no network dependency)

### **Memory Usage**
- ~8 avatars × ~50KB each = ~400KB total
- Negligible impact on app memory

---

## ✅ ACCEPTANCE CRITERIA

- [x] All avatars are local bundled assets (no remote URLs)
- [x] Avatars prefetch on app start
- [x] Selected avatar prefetches when persona changes
- [x] `expo-image` used with `memory-disk` cache
- [x] No transitions or flashing
- [x] Works offline
- [x] Same UI sizing maintained
- [x] Non-blocking prefetch (doesn't delay startup)

---

## 🎯 RESULT

**Avatar never "loads late" or flashes blank.**

✅ Instant loading online
✅ Instant loading offline
✅ No flickering or transitions
✅ Persistent cache across app restarts
✅ Zero network dependency
