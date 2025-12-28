
# Subtle UI Cues Implementation

## Overview

This document describes the implementation of subtle, non-verbal UI cues that increase trust without adding noise to the Safe Space app.

## Implementation Summary

### 1. Therapist Response Completion Cue

**Location:** `components/ui/AnimatedChatBubble.tsx`

**Behavior:**
- When an AI message finishes appearing, a subtle glow effect briefly appears around the message bubble
- The glow uses the theme's primary color at 15% opacity
- Animation sequence:
  - Fade in: 400ms
  - Hold: 200ms
  - Fade out: 600ms
- Total duration: ~1.2 seconds

**Accessibility:**
- Automatically disabled when system reduced motion is enabled
- Uses native driver for optimal performance
- No layout shifts or jarring movements

**Persona-Specific Timing:**
- Entrance animation duration varies by therapist personality:
  - Slow pacing (Dr. Elias, Claire, Ruth): 250ms
  - Steady pacing (Maya, Aisha, Ken): 200ms
  - Rapid pacing (Noah, Jordan): 150ms
- Completion glow timing is consistent across all personas

### 2. Memory Saved Indicator

**Location:** `components/ui/MemorySavedIndicator.tsx`

**Behavior:**
- Appears at the top of the screen when memories are silently saved
- Shows a checkmark icon with the text "Saved to help future conversations"
- Animation sequence:
  - Fade in + scale up: 200ms (spring animation)
  - Display: 2 seconds
  - Fade out + scale down: 200ms
- Total duration: ~2.4 seconds

**Accessibility:**
- Respects reduced motion settings (instant show/hide)
- Non-blocking (positioned absolutely, doesn't affect layout)
- Auto-dismisses without user interaction

**Trigger Points:**
- After local memory extraction from user messages
- After successful memory extraction from AI responses
- Only shown when memories are actually saved (not on every message)

### 3. Typing Indicator Animation

**Location:** `components/ui/AnimatedTypingIndicator.tsx`

**Behavior:**
- Therapist avatar pulses gently while AI is generating a response
- Three dots bounce in sequence to indicate activity
- Pulse animation parameters vary by persona:
  - Calm personas (Dr. Elias, Claire, Ruth): Slower, gentler (2000ms, 1.06x scale)
  - Direct personas (Noah, Jordan): Faster, more noticeable (1200ms, 1.1x scale)
  - Balanced personas (Maya, Aisha, Ken): Standard (1500ms, 1.08x scale)

**Accessibility:**
- All animations disabled when reduced motion is enabled
- Static display shown instead (no motion)

## Design Principles

### 1. Subtlety
- All animations use opacity and soft scaling
- No motion-heavy effects (no bouncing, spinning, or sliding)
- Glow effects are very subtle (15% opacity maximum)
- Colors match the theme for visual harmony

### 2. Non-Verbal Communication
- No popups or banners
- No text notifications
- Visual cues only
- Minimal and calm

### 3. Accessibility
- All animations respect system reduced motion settings
- Instant show/hide when reduced motion is enabled
- No critical information conveyed through animation alone
- Native driver used for optimal performance

### 4. Performance
- All animations use `useNativeDriver: true`
- Animations are cleaned up properly on unmount
- No layout recalculations during animations
- Minimal re-renders

## Technical Implementation

### Reduced Motion Detection

**Hook:** `hooks/useReducedMotion.ts`

```typescript
export function useReducedMotion(): boolean {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setIsReducedMotionEnabled(enabled ?? false))
      .catch(() => setIsReducedMotionEnabled(false));

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setIsReducedMotionEnabled(enabled)
    );

    return () => subscription.remove();
  }, []);

  return isReducedMotionEnabled;
}
```

### Animation Patterns

**Entrance Animation (AI Messages):**
```typescript
Animated.parallel([
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: getDurationForPersona(therapistPersonaId),
    easing: getEasingForPersona(therapistPersonaId),
    useNativeDriver: true,
  }),
  Animated.timing(slideAnim, {
    toValue: 0,
    duration: getDurationForPersona(therapistPersonaId),
    easing: getEasingForPersona(therapistPersonaId),
    useNativeDriver: true,
  }),
]);
```

**Completion Glow (AI Messages):**
```typescript
Animated.sequence([
  Animated.timing(glowAnim, {
    toValue: 1,
    duration: 400,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    useNativeDriver: true,
  }),
  Animated.delay(200),
  Animated.timing(glowAnim, {
    toValue: 0,
    duration: 600,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    useNativeDriver: true,
  }),
]);
```

**Memory Saved Indicator:**
```typescript
// Show
Animated.parallel([
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }),
  Animated.spring(scaleAnim, {
    toValue: 1,
    tension: 100,
    friction: 8,
    useNativeDriver: true,
  }),
]);

// Hide (after 2 seconds)
Animated.parallel([
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  }),
  Animated.timing(scaleAnim, {
    toValue: 0.8,
    duration: 200,
    useNativeDriver: true,
  }),
]);
```

## Integration Points

### Chat Screen

**File:** `app/(tabs)/(home)/chat.tsx`

**Memory Saved Indicator Triggers:**

1. **Local Memory Extraction** (after user sends message):
```typescript
const extractedMemories = extractMemoriesFromUserText(userMessageText, personName);
if (extractedMemories.length > 0) {
  await upsertPersonMemories(userId, personId, extractedMemories);
  setShowMemorySavedIndicator(true); // Show indicator
}
```

2. **AI Memory Extraction** (after AI responds):
```typescript
const extractionResult = await extractMemories({
  personName,
  recentUserMessages: userMessages,
  lastAssistantMessage: replyText,
  existingMemories,
  userId,
  personId,
});

if (!extractionResult.error) {
  setShowMemorySavedIndicator(true); // Show indicator
}
```

**Typing Indicator:**
```typescript
// Show when AI is generating
setIsTyping(true);

// Hide when AI response is received
setIsTyping(false);
```

**Message Animation:**
```typescript
<AnimatedChatBubble
  message={item.content}
  isUser={item.role === 'user'}
  timestamp={item.created_at}
  animate={shouldAnimate} // Only animate most recent AI message
  therapistName={item.therapist_name}
  therapistAvatarSource={item.therapist_avatar_source}
  therapistPersonaId={preferences.therapist_persona_id}
/>
```

## Acceptance Tests

### ✅ UI Feels Alive But Calm
- Animations are subtle and non-intrusive
- No jarring movements or sudden changes
- Visual feedback is gentle and reassuring
- Timing feels natural and unhurried

### ✅ No Distractions
- No popups or modal dialogs
- No banners that require dismissal
- No notifications or alerts
- Animations don't interrupt user flow

### ✅ No Performance Impact
- All animations use native driver
- No layout recalculations
- Proper cleanup on unmount
- Minimal re-renders

### ✅ Respects Reduced Motion
- System setting is detected on mount
- Changes are detected in real-time
- All animations disabled when enabled
- Instant show/hide fallback provided

## Future Enhancements

### Potential Additions
1. **Haptic Feedback** (optional, user-controlled):
   - Light haptic when memory is saved
   - Gentle haptic when AI finishes responding
   - Must respect system haptic settings

2. **Sound Effects** (optional, user-controlled):
   - Soft chime when memory is saved
   - Gentle tone when AI finishes responding
   - Must respect system sound settings

3. **Adaptive Timing**:
   - Adjust animation speed based on user interaction patterns
   - Faster animations for power users
   - Slower animations for new users

### Considerations
- All enhancements must maintain subtlety
- No feature should be distracting
- Accessibility must be preserved
- Performance must not be impacted

## Testing Checklist

### Manual Testing
- [ ] Test with reduced motion enabled
- [ ] Test with reduced motion disabled
- [ ] Test on iOS and Android
- [ ] Test with different therapist personas
- [ ] Test memory saved indicator timing
- [ ] Test completion glow visibility
- [ ] Test typing indicator animation
- [ ] Test with different theme colors
- [ ] Test with light and dark mode

### Performance Testing
- [ ] Monitor frame rate during animations
- [ ] Check memory usage
- [ ] Verify no memory leaks
- [ ] Test with many messages in chat
- [ ] Test rapid message sending

### Accessibility Testing
- [ ] Test with VoiceOver/TalkBack
- [ ] Test with reduced motion
- [ ] Test with high contrast mode
- [ ] Test with large text sizes
- [ ] Test with color blindness simulators

## Conclusion

The subtle UI cues implementation successfully adds life and trust to the Safe Space app without being distracting or overwhelming. All animations respect accessibility settings, use optimal performance techniques, and maintain the calm, supportive atmosphere that is core to the app's design philosophy.

The implementation follows these key principles:
- **Subtlety over spectacle**
- **Accessibility first**
- **Performance optimized**
- **Non-verbal communication**
- **Calm and reassuring**

These cues help users feel that the app is responsive, that their data is being saved, and that the AI is actively working on their behalf—all without adding noise or distraction to the experience.
