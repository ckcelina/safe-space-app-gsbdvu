
# Subtle UI Cues - Testing Guide

## Overview
This guide provides comprehensive testing procedures for the subtle UI cues implementation.

## Test Environment Setup

### Prerequisites
- Physical iOS device (iPhone 8 or newer)
- Physical Android device (Android 8.0 or newer)
- Expo Go app installed
- Development server running

### Enable Performance Monitoring
1. Shake device to open Expo Dev Menu
2. Enable "Show Performance Monitor"
3. Monitor FPS during animations

## Test Cases

### 1. Therapist Response Completion Glow

#### Test 1.1: Basic Glow Animation
**Steps:**
1. Open chat with any person
2. Send a message
3. Wait for AI response to appear
4. Observe the AI message bubble

**Expected:**
- Message fades in and slides up
- After entrance completes, a subtle glow appears around the bubble
- Glow fades in over ~400ms
- Glow holds for ~200ms
- Glow fades out over ~600ms
- Glow uses theme primary color at low opacity

**Pass Criteria:**
- ✅ Glow is visible but subtle
- ✅ Glow doesn't distract from message content
- ✅ Animation is smooth (60 FPS)
- ✅ No layout shifts occur

#### Test 1.2: Persona-Specific Timing
**Steps:**
1. Go to Settings > AI Preferences
2. Select Dr. Elias (slow pacing)
3. Send a message and observe entrance animation
4. Change to Noah (rapid pacing)
5. Send another message and observe

**Expected:**
- Dr. Elias: Slower, gentler entrance (250ms)
- Noah: Faster, snappier entrance (150ms)
- Completion glow timing is consistent

**Pass Criteria:**
- ✅ Entrance speed varies by persona
- ✅ Glow timing is consistent
- ✅ Animations feel natural for each persona

#### Test 1.3: Multiple Messages
**Steps:**
1. Send 5 messages in quick succession
2. Observe each AI response

**Expected:**
- Only the most recent AI message animates
- Older messages appear instantly
- No animation conflicts or overlaps

**Pass Criteria:**
- ✅ Only newest message animates
- ✅ No performance degradation
- ✅ No visual glitches

### 2. Memory Saved Indicator

#### Test 2.1: Basic Display
**Steps:**
1. Open chat with any person
2. Send a message containing factual information (e.g., "My mom's birthday is June 15th")
3. Observe top of screen

**Expected:**
- Indicator appears at top center
- Shows checkmark icon + text
- Fades in with scale animation
- Displays for 2 seconds
- Fades out automatically

**Pass Criteria:**
- ✅ Indicator is visible and readable
- ✅ Animation is smooth
- ✅ Auto-dismisses after 2 seconds
- ✅ Doesn't block chat content

#### Test 2.2: Multiple Triggers
**Steps:**
1. Send 3 messages with factual content in quick succession
2. Observe indicator behavior

**Expected:**
- Indicator may appear multiple times
- Each appearance is independent
- No overlapping indicators
- Timing is consistent

**Pass Criteria:**
- ✅ Indicator handles multiple triggers
- ✅ No visual conflicts
- ✅ Performance remains smooth

#### Test 2.3: Theme Compatibility
**Steps:**
1. Test with Ocean Blue theme
2. Test with Soft Rose theme
3. Test with Forest Green theme
4. Test with light and dark mode

**Expected:**
- Indicator uses theme primary color
- Text is readable in all themes
- Border color matches theme
- Background contrasts with theme

**Pass Criteria:**
- ✅ Readable in all themes
- ✅ Visually consistent
- ✅ Proper contrast ratios

### 3. Typing Indicator Animation

#### Test 3.1: Basic Animation
**Steps:**
1. Open chat with any person
2. Send a message
3. Observe typing indicator while AI is generating

**Expected:**
- Avatar pulses gently
- Three dots bounce in sequence
- Animation loops continuously
- Stops when AI responds

**Pass Criteria:**
- ✅ Pulse is subtle and smooth
- ✅ Dots bounce in sequence
- ✅ Animation loops properly
- ✅ Stops cleanly when done

#### Test 3.2: Persona-Specific Pulse
**Steps:**
1. Test with Dr. Elias (calm persona)
2. Test with Noah (direct persona)
3. Test with Maya (balanced persona)

**Expected:**
- Dr. Elias: Slower, gentler pulse (2000ms, 1.06x)
- Noah: Faster, more noticeable pulse (1200ms, 1.1x)
- Maya: Standard pulse (1500ms, 1.08x)

**Pass Criteria:**
- ✅ Pulse speed varies by persona
- ✅ Scale varies by persona
- ✅ Feels appropriate for each persona

#### Test 3.3: Long Generation Time
**Steps:**
1. Send a complex message
2. Observe typing indicator for 10+ seconds

**Expected:**
- Animation continues smoothly
- No stuttering or freezing
- No memory leaks
- Performance remains stable

**Pass Criteria:**
- ✅ Animation is smooth throughout
- ✅ No performance degradation
- ✅ No memory issues

### 4. Reduced Motion Accessibility

#### Test 4.1: iOS Reduced Motion
**Steps:**
1. Enable: Settings > Accessibility > Motion > Reduce Motion
2. Open Safe Space app
3. Send a message and observe

**Expected:**
- No entrance animation on AI messages
- No completion glow
- No typing indicator pulse
- No memory saved indicator animation
- All content appears instantly

**Pass Criteria:**
- ✅ All animations disabled
- ✅ Content still visible
- ✅ No functionality lost
- ✅ No errors or crashes

#### Test 4.2: Android Reduced Motion
**Steps:**
1. Enable: Settings > Accessibility > Remove animations
2. Open Safe Space app
3. Send a message and observe

**Expected:**
- Same as iOS test
- All animations disabled
- Instant content display

**Pass Criteria:**
- ✅ All animations disabled
- ✅ Content still visible
- ✅ No functionality lost
- ✅ No errors or crashes

#### Test 4.3: Runtime Toggle
**Steps:**
1. Start with reduced motion disabled
2. Send a message (animations should work)
3. Enable reduced motion in system settings
4. Return to app (don't restart)
5. Send another message

**Expected:**
- First message animates normally
- Second message appears instantly
- App detects setting change in real-time

**Pass Criteria:**
- ✅ Setting change detected
- ✅ Animations disabled immediately
- ✅ No app restart required

### 5. Performance Testing

#### Test 5.1: Frame Rate
**Steps:**
1. Enable Performance Monitor in Expo Dev Menu
2. Send 10 messages in succession
3. Monitor FPS during animations

**Expected:**
- FPS stays at or near 60
- No significant drops during animations
- Smooth scrolling while animating

**Pass Criteria:**
- ✅ FPS ≥ 55 during animations
- ✅ No stuttering or jank
- ✅ Smooth user experience

#### Test 5.2: Memory Usage
**Steps:**
1. Open chat screen
2. Send 50 messages
3. Monitor memory usage in Xcode/Android Studio

**Expected:**
- Memory usage remains stable
- No memory leaks
- Proper cleanup on unmount

**Pass Criteria:**
- ✅ Memory usage stable
- ✅ No leaks detected
- ✅ Proper cleanup verified

#### Test 5.3: Battery Impact
**Steps:**
1. Fully charge device
2. Use app for 30 minutes with animations
3. Check battery usage in system settings

**Expected:**
- Battery drain is minimal
- Comparable to other messaging apps
- No excessive CPU usage

**Pass Criteria:**
- ✅ Battery drain < 5% per 30 min
- ✅ No overheating
- ✅ Reasonable CPU usage

### 6. Edge Cases

#### Test 6.1: Rapid Message Sending
**Steps:**
1. Send 5 messages as fast as possible
2. Observe animation behavior

**Expected:**
- Only most recent AI message animates
- No animation conflicts
- No crashes or errors

**Pass Criteria:**
- ✅ Handles rapid input
- ✅ No visual glitches
- ✅ No errors

#### Test 6.2: App Backgrounding
**Steps:**
1. Send a message
2. Immediately background the app (home button)
3. Wait 5 seconds
4. Return to app

**Expected:**
- Animations stop when backgrounded
- Animations resume or complete when foregrounded
- No crashes or errors

**Pass Criteria:**
- ✅ Handles backgrounding gracefully
- ✅ No crashes
- ✅ Proper state restoration

#### Test 6.3: Network Interruption
**Steps:**
1. Send a message
2. Disable network while AI is generating
3. Observe behavior

**Expected:**
- Typing indicator continues
- Error message appears when network fails
- Animations stop gracefully

**Pass Criteria:**
- ✅ Handles network errors
- ✅ No animation artifacts
- ✅ Clear error messaging

#### Test 6.4: Very Long Messages
**Steps:**
1. Send a message that generates a very long AI response (500+ words)
2. Observe animations

**Expected:**
- Entrance animation works normally
- Completion glow appears after entrance
- No performance issues
- Message is fully readable

**Pass Criteria:**
- ✅ Animations work with long content
- ✅ No performance degradation
- ✅ Content fully visible

### 7. Visual Regression Testing

#### Test 7.1: Screenshot Comparison
**Steps:**
1. Take screenshots of:
   - AI message with glow (mid-animation)
   - Memory saved indicator
   - Typing indicator
2. Compare with baseline screenshots

**Expected:**
- Visual appearance matches baseline
- No unintended style changes
- Colors match theme

**Pass Criteria:**
- ✅ Visual consistency maintained
- ✅ No regressions
- ✅ Theme colors correct

#### Test 7.2: Dark Mode
**Steps:**
1. Enable dark mode in system settings
2. Test all animations
3. Verify visibility and contrast

**Expected:**
- All animations visible in dark mode
- Proper contrast ratios
- No color bleeding

**Pass Criteria:**
- ✅ Visible in dark mode
- ✅ Proper contrast
- ✅ No visual issues

## Automated Testing

### Unit Tests
```typescript
// Example test for useReducedMotion hook
describe('useReducedMotion', () => {
  it('should return false by default', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should detect reduced motion setting', async () => {
    // Mock AccessibilityInfo
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    
    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
```

### Integration Tests
```typescript
// Example test for AnimatedChatBubble
describe('AnimatedChatBubble', () => {
  it('should animate AI messages when animate=true', () => {
    const { getByText } = render(
      <AnimatedChatBubble
        message="Test message"
        isUser={false}
        animate={true}
      />
    );
    
    const bubble = getByText('Test message');
    expect(bubble).toBeTruthy();
    // Verify animation properties
  });

  it('should not animate when reduced motion is enabled', () => {
    // Mock reduced motion
    jest.spyOn(useReducedMotion, 'default').mockReturnValue(true);
    
    const { getByText } = render(
      <AnimatedChatBubble
        message="Test message"
        isUser={false}
        animate={true}
      />
    );
    
    // Verify no animation
  });
});
```

## Test Results Template

### Test Session Information
- **Date:** YYYY-MM-DD
- **Tester:** Name
- **Device:** iPhone 14 Pro / Pixel 7
- **OS Version:** iOS 17.0 / Android 14
- **App Version:** 1.0.0
- **Build:** Development / TestFlight / Production

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1.1 Basic Glow | ✅ Pass | |
| 1.2 Persona Timing | ✅ Pass | |
| 1.3 Multiple Messages | ✅ Pass | |
| 2.1 Basic Display | ✅ Pass | |
| 2.2 Multiple Triggers | ✅ Pass | |
| 2.3 Theme Compatibility | ✅ Pass | |
| 3.1 Basic Animation | ✅ Pass | |
| 3.2 Persona Pulse | ✅ Pass | |
| 3.3 Long Generation | ✅ Pass | |
| 4.1 iOS Reduced Motion | ✅ Pass | |
| 4.2 Android Reduced Motion | ✅ Pass | |
| 4.3 Runtime Toggle | ✅ Pass | |
| 5.1 Frame Rate | ✅ Pass | |
| 5.2 Memory Usage | ✅ Pass | |
| 5.3 Battery Impact | ✅ Pass | |
| 6.1 Rapid Sending | ✅ Pass | |
| 6.2 Backgrounding | ✅ Pass | |
| 6.3 Network Interruption | ✅ Pass | |
| 6.4 Long Messages | ✅ Pass | |
| 7.1 Screenshot Comparison | ✅ Pass | |
| 7.2 Dark Mode | ✅ Pass | |

### Issues Found
1. **Issue:** Description
   - **Severity:** Critical / High / Medium / Low
   - **Steps to Reproduce:** ...
   - **Expected:** ...
   - **Actual:** ...
   - **Screenshot:** [Link]

### Overall Assessment
- **Pass Rate:** 22/22 (100%)
- **Critical Issues:** 0
- **Recommendation:** Ready for release / Needs fixes

## Continuous Testing

### Pre-Commit Checklist
- [ ] All animations use `useNativeDriver: true`
- [ ] Reduced motion is respected
- [ ] No console errors or warnings
- [ ] Performance is acceptable (60 FPS)
- [ ] Visual appearance is correct

### Pre-Release Checklist
- [ ] All test cases pass on iOS
- [ ] All test cases pass on Android
- [ ] Accessibility testing complete
- [ ] Performance testing complete
- [ ] Visual regression testing complete
- [ ] No critical or high severity issues

## Troubleshooting

### Animation Not Showing
1. Check `animate` prop is `true`
2. Verify reduced motion is disabled
3. Check console for errors
4. Verify component is mounted
5. Test on physical device

### Animation Stuttering
1. Verify `useNativeDriver: true`
2. Check for layout recalculations
3. Profile with Performance Monitor
4. Test on physical device
5. Check for memory leaks

### Reduced Motion Not Working
1. Verify system setting is enabled
2. Check hook implementation
3. Verify event listener is attached
4. Test on physical device
5. Check for console errors

## Resources

- [React Native Animated API](https://reactnative.dev/docs/animated)
- [Accessibility Info API](https://reactnative.dev/docs/accessibilityinfo)
- [Expo Performance](https://docs.expo.dev/guides/performance/)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
