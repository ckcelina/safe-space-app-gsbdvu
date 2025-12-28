
# Subtle UI Cues - Quick Reference

## Overview
Non-verbal visual feedback that increases trust without adding noise.

## Components

### 1. AnimatedChatBubble
**File:** `components/ui/AnimatedChatBubble.tsx`

**Features:**
- Fade + slide entrance animation for AI messages
- Subtle completion glow after message appears
- Respects reduced motion settings
- Persona-specific timing

**Usage:**
```tsx
<AnimatedChatBubble
  message={content}
  isUser={false}
  timestamp={createdAt}
  animate={true} // Only for most recent AI message
  therapistName="Dr. Elias"
  therapistAvatarSource={avatarImage}
  therapistPersonaId="dr_elias"
/>
```

**Animation Timing:**
- Entrance: 150-250ms (persona-dependent)
- Glow fade in: 400ms
- Glow hold: 200ms
- Glow fade out: 600ms

### 2. MemorySavedIndicator
**File:** `components/ui/MemorySavedIndicator.tsx`

**Features:**
- Appears at top of screen
- Auto-dismisses after 2 seconds
- Fade + scale animation
- Respects reduced motion

**Usage:**
```tsx
const [showMemorySaved, setShowMemorySaved] = useState(false);

// Trigger when memories are saved
setShowMemorySaved(true);

// Component
<MemorySavedIndicator 
  visible={showMemorySaved}
  onHide={() => setShowMemorySaved(false)}
/>
```

**Animation Timing:**
- Fade in + scale: 200ms
- Display: 2000ms
- Fade out + scale: 200ms

### 3. AnimatedTypingIndicator
**File:** `components/ui/AnimatedTypingIndicator.tsx`

**Features:**
- Pulsing avatar animation
- Bouncing dots
- Persona-specific pulse timing
- Respects reduced motion

**Usage:**
```tsx
{isTyping && (
  <AnimatedTypingIndicator 
    therapistAvatarSource={avatarImage}
    therapistPersonaId="dr_elias"
  />
)}
```

**Animation Timing:**
- Pulse duration: 1200-2000ms (persona-dependent)
- Dot bounce: 400ms per dot
- Dot delay: 150ms between dots

### 4. useReducedMotion Hook
**File:** `hooks/useReducedMotion.ts`

**Features:**
- Detects system reduced motion setting
- Updates in real-time
- Returns boolean

**Usage:**
```tsx
const isReducedMotion = useReducedMotion();

// Conditionally animate
if (!isReducedMotion) {
  Animated.timing(value, { ... }).start();
}
```

## Integration Points

### Chat Screen
**File:** `app/(tabs)/(home)/chat.tsx`

**Memory Saved Indicator:**
```typescript
// After local memory extraction
if (extractedMemories.length > 0) {
  await upsertPersonMemories(userId, personId, extractedMemories);
  setShowMemorySavedIndicator(true);
}

// After AI memory extraction
if (!extractionResult.error) {
  setShowMemorySavedIndicator(true);
}
```

**Typing Indicator:**
```typescript
// Show when calling AI
setIsTyping(true);

// Hide when AI responds
setIsTyping(false);
```

**Message Animation:**
```typescript
// Only animate most recent AI message
const shouldAnimate = item.role === 'assistant' && index === 0;

<AnimatedChatBubble
  animate={shouldAnimate}
  // ... other props
/>
```

## Persona-Specific Timing

### Entrance Animation Duration
- **Slow** (Dr. Elias, Claire, Ruth): 250ms
- **Steady** (Maya, Aisha, Ken): 200ms
- **Rapid** (Noah, Jordan): 150ms

### Pulse Animation
- **Calm** (Dr. Elias, Claire, Ruth): 2000ms, 1.06x scale
- **Balanced** (Maya, Aisha, Ken): 1500ms, 1.08x scale
- **Direct** (Noah, Jordan): 1200ms, 1.1x scale

### Easing Curves
- **Soft** (Dr. Elias, Maya, Ruth): `Easing.bezier(0.25, 0.1, 0.25, 1)`
- **Snappy** (Noah, Jordan): `Easing.bezier(0.4, 0, 0.2, 1)`
- **Balanced** (Claire, Aisha, Ken): `Easing.out(Easing.cubic)`

## Design Rules

### ✅ DO
- Use opacity and soft scaling
- Keep animations under 1 second (except holds)
- Use theme colors for consistency
- Respect reduced motion settings
- Use native driver for performance
- Clean up animations on unmount

### ❌ DON'T
- Use motion-heavy effects (bounce, spin, slide)
- Create popups or banners
- Show notifications or alerts
- Block user interaction
- Animate critical information
- Ignore accessibility settings

## Performance Checklist

- [ ] `useNativeDriver: true` on all animations
- [ ] Cleanup in `useEffect` return
- [ ] No layout recalculations
- [ ] Minimal re-renders
- [ ] Proper memoization

## Accessibility Checklist

- [ ] Respects reduced motion
- [ ] No critical info in animations
- [ ] Works with screen readers
- [ ] Sufficient color contrast
- [ ] No flashing or strobing

## Testing Commands

```bash
# Test with reduced motion
# iOS: Settings > Accessibility > Motion > Reduce Motion
# Android: Settings > Accessibility > Remove animations

# Test performance
# Enable "Show Performance Monitor" in Expo Dev Menu

# Test on devices
npm run ios
npm run android
```

## Common Issues

### Animation Not Showing
- Check `animate` prop is `true`
- Verify reduced motion is disabled
- Check animation refs are initialized
- Verify component is mounted

### Animation Stuttering
- Ensure `useNativeDriver: true`
- Check for layout recalculations
- Verify no heavy computations during animation
- Test on physical device (not simulator)

### Memory Leaks
- Verify cleanup in `useEffect` return
- Stop animations on unmount
- Remove event listeners
- Clear timeouts/intervals

## Quick Fixes

### Disable All Animations
```typescript
// In component
const isReducedMotion = true; // Force disable
```

### Adjust Animation Speed
```typescript
// In AnimatedChatBubble.tsx
const duration = getDurationForPersona(therapistPersonaId) * 0.5; // 50% faster
```

### Change Glow Intensity
```typescript
// In AnimatedChatBubble.tsx
const glowOpacity = glowAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 0.3], // Increase from 0.15 to 0.3
});
```

## Related Files

- `components/ui/AnimatedChatBubble.tsx` - Message entrance + completion glow
- `components/ui/AnimatedTypingIndicator.tsx` - Typing indicator with pulse
- `components/ui/MemorySavedIndicator.tsx` - Memory saved confirmation
- `hooks/useReducedMotion.ts` - Accessibility detection
- `app/(tabs)/(home)/chat.tsx` - Integration point
- `constants/TherapistPersonas.ts` - Persona timing metadata

## Support

For issues or questions:
1. Check `SUBTLE_UI_CUES_IMPLEMENTATION.md` for detailed documentation
2. Review `ANIMATION_TESTING_GUIDE.md` for testing procedures
3. Search existing issues in the project
4. Create a new issue with reproduction steps
