
# Animation Quick Reference

## For Developers

### Using Animated Components

#### Animated Chat Bubble
```tsx
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';

<AnimatedChatBubble
  message="Hello, how are you?"
  isUser={false}
  timestamp="2024-01-15T10:30:00Z"
  animate={true}  // Only animate the most recent message
  therapistName="Dr. Elias"
  therapistAvatarSource={require('@/assets/images/therapist.png')}
  therapistPersonaId="dr_elias"  // Used for animation timing
/>
```

#### Animated Typing Indicator
```tsx
import { AnimatedTypingIndicator } from '@/components/ui/AnimatedTypingIndicator';

<AnimatedTypingIndicator
  therapistAvatarSource={require('@/assets/images/therapist.png')}
  therapistPersonaId="dr_elias"  // Used for pulse timing
/>
```

#### Reduced Motion Hook
```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

function MyComponent() {
  const isReducedMotion = useReducedMotion();
  
  // Use this to conditionally disable animations
  if (isReducedMotion) {
    return <StaticComponent />;
  }
  
  return <AnimatedComponent />;
}
```

### Animation Parameters by Therapist

| Therapist | Pacing | Duration | Easing | Pulse Duration | Pulse Scale |
|-----------|--------|----------|--------|----------------|-------------|
| Dr. Elias | Slow | 250ms | Gentle | 2000ms | 1.06 |
| Noah | Rapid | 150ms | Snappy | 1200ms | 1.1 |
| Maya | Steady | 200ms | Standard | 1500ms | 1.08 |
| Claire | Slow | 250ms | Gentle | 2000ms | 1.06 |
| Ruth | Slow | 250ms | Gentle | 2000ms | 1.06 |
| Jordan | Rapid | 150ms | Snappy | 1200ms | 1.1 |
| Aisha | Steady | 200ms | Standard | 1500ms | 1.08 |
| Ken | Steady | 200ms | Standard | 1500ms | 1.08 |

### Easing Curves

```typescript
// Gentle (Dr. Elias, Maya, Ruth, Claire)
Easing.bezier(0.25, 0.1, 0.25, 1)

// Snappy (Noah, Jordan)
Easing.bezier(0.4, 0, 0.2, 1)

// Standard (Aisha, Ken)
Easing.out(Easing.cubic)

// Breathing (Avatar pulse - all therapists)
Easing.bezier(0.4, 0, 0.6, 1)
```

### Best Practices

1. **Only animate AI messages** - User messages should never animate
2. **Animate only the most recent message** - Don't animate all messages on load
3. **Always pass therapistPersonaId** - This ensures correct animation timing
4. **Respect reduced motion** - Use the `useReducedMotion` hook
5. **Clean up animations** - All animations auto-cleanup on unmount

### Common Patterns

#### Animating the Latest Message
```tsx
const renderMessageItem = ({ item, index }) => {
  // Only animate the first item in a reversed list (most recent)
  const shouldAnimate = item.role === 'assistant' && index === 0;
  
  return (
    <AnimatedChatBubble
      message={item.content}
      isUser={item.role === 'user'}
      animate={shouldAnimate}
      therapistPersonaId={preferences.therapist_persona_id}
    />
  );
};
```

#### Conditional Animation Based on Reduced Motion
```tsx
const isReducedMotion = useReducedMotion();

<AnimatedChatBubble
  animate={!isReducedMotion && isLatestMessage}
  // ... other props
/>
```

### Troubleshooting

**Problem:** Animations not working
- Check if reduced motion is enabled in system settings
- Verify `therapistPersonaId` is being passed correctly
- Ensure `animate` prop is set to `true`

**Problem:** Animations feel too fast/slow
- Check the therapist persona ID mapping
- Verify the persona exists in `TherapistPersonas.ts`
- Duration is automatically calculated based on persona

**Problem:** Avatar not pulsing
- Ensure `therapistAvatarSource` is provided
- Check if typing indicator is visible
- Verify reduced motion is not enabled

### Testing

```bash
# Test with reduced motion enabled
# iOS: Settings > Accessibility > Motion > Reduce Motion
# Android: Settings > Accessibility > Remove animations

# Test different therapists
# Switch therapist in AI Preferences and observe timing differences

# Test performance
# Use React DevTools Profiler to measure render times
# Animations should not impact chat performance
```

## For Designers

### Animation Specifications

**Message Entrance:**
- Fade: 0 → 1 opacity
- Slide: 10px upward movement
- Duration: 150-250ms (varies by therapist)
- Easing: Personality-based (gentle/snappy/standard)

**Avatar Pulse:**
- Scale: 1.0 → 1.06-1.1 → 1.0
- Duration: 1200-2000ms (varies by therapist)
- Easing: Smooth breathing curve
- Stops when message delivered

### Accessibility

- All animations disabled when "Reduce Motion" is enabled
- No flashing or rapid movements
- Subtle, calming motion only
- Professional, therapeutic tone

### Visual Guidelines

✅ **Do:**
- Keep animations subtle and calming
- Use personality-appropriate timing
- Respect accessibility settings
- Maintain professional appearance

❌ **Don't:**
- Add celebratory effects
- Use bouncing or spinning
- Animate user messages
- Create continuous loops

## Quick Links

- Implementation: `components/ui/AnimatedChatBubble.tsx`
- Typing Indicator: `components/ui/AnimatedTypingIndicator.tsx`
- Reduced Motion Hook: `hooks/useReducedMotion.ts`
- Chat Integration: `app/(tabs)/(home)/chat.tsx`
- Therapist Personas: `constants/TherapistPersonas.ts`
