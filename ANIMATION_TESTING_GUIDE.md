
# Animation Testing Guide

## Pre-Testing Setup

### 1. Enable Developer Mode
- Ensure you're running the app in development mode
- Check console logs for animation-related messages

### 2. Test Devices
- **iOS Device/Simulator:** iPhone 12 or newer recommended
- **Android Device/Emulator:** API 29+ recommended
- **Low-End Device:** Test on older hardware if available

## Test Cases

### Test 1: Message Entrance Animation

**Objective:** Verify AI messages animate on appearance

**Steps:**
1. Open any chat conversation
2. Send a message to the AI
3. Observe the AI response as it appears

**Expected Result:**
- AI message fades in with slight upward movement
- Animation duration: 150-250ms (varies by therapist)
- Animation feels smooth and natural
- User message does NOT animate

**Pass Criteria:**
- ✅ AI message animates
- ✅ User message does not animate
- ✅ Animation completes smoothly
- ✅ No visual glitches or stuttering

---

### Test 2: Therapist Personality Timing

**Objective:** Verify different therapists have distinct animation timing

**Steps:**
1. Go to Settings → AI Preferences
2. Select Dr. Elias (slow, gentle)
3. Send a message and observe animation
4. Switch to Noah (rapid, snappy)
5. Send a message and observe animation
6. Compare the two animations

**Expected Result:**
- Dr. Elias: Slower, smoother animation (~250ms)
- Noah: Faster, snappier animation (~150ms)
- Noticeable difference in timing and feel

**Pass Criteria:**
- ✅ Dr. Elias animation feels calm and gentle
- ✅ Noah animation feels quick and responsive
- ✅ Timing difference is perceptible
- ✅ Both animations complete smoothly

---

### Test 3: Avatar Pulse During Typing

**Objective:** Verify avatar pulses while AI is responding

**Steps:**
1. Open any chat conversation
2. Send a message to the AI
3. Observe the typing indicator and avatar
4. Wait for the AI response to appear

**Expected Result:**
- Avatar gently pulses/breathes while typing indicator is visible
- Pulse animation is smooth and calming
- Pulse stops when message is delivered
- No continuous looping after response

**Pass Criteria:**
- ✅ Avatar pulses during typing
- ✅ Pulse animation is smooth
- ✅ Pulse stops when message appears
- ✅ No animation after message delivered

---

### Test 4: Reduced Motion Accessibility

**Objective:** Verify animations respect system accessibility settings

**iOS Steps:**
1. Go to iOS Settings → Accessibility → Motion
2. Enable "Reduce Motion"
3. Return to Safe Space app
4. Send a message to the AI

**Android Steps:**
1. Go to Android Settings → Accessibility
2. Enable "Remove animations" or "Reduce animations"
3. Return to Safe Space app
4. Send a message to the AI

**Expected Result:**
- All animations are disabled
- Messages appear instantly without fade/slide
- Avatar does not pulse
- Chat functionality remains unchanged

**Pass Criteria:**
- ✅ No message entrance animation
- ✅ No avatar pulse animation
- ✅ Messages still appear correctly
- ✅ Chat remains fully functional

---

### Test 5: Performance on Low-End Devices

**Objective:** Verify animations don't impact performance

**Steps:**
1. Test on an older device (iPhone 8, Android API 26)
2. Send multiple messages rapidly
3. Scroll through chat history
4. Monitor frame rate and responsiveness

**Expected Result:**
- Animations remain smooth
- No dropped frames or stuttering
- Chat scrolling is responsive
- No lag when sending messages

**Pass Criteria:**
- ✅ Animations run at 60fps
- ✅ No performance degradation
- ✅ Chat remains responsive
- ✅ No memory leaks or crashes

---

### Test 6: Multiple Messages

**Objective:** Verify only the latest message animates

**Steps:**
1. Open a chat with existing message history
2. Send a new message to the AI
3. Observe which messages animate

**Expected Result:**
- Only the newest AI message animates
- Previous messages remain static
- No animation on scroll or list updates

**Pass Criteria:**
- ✅ Only latest AI message animates
- ✅ Previous messages don't re-animate
- ✅ Scrolling doesn't trigger animations
- ✅ List performance is maintained

---

### Test 7: Theme Compatibility

**Objective:** Verify animations work with all themes

**Steps:**
1. Go to Settings → Theme
2. Switch between Ocean Blue, Soft Rose, Forest Green
3. Send messages in each theme
4. Observe animations

**Expected Result:**
- Animations work in all themes
- Colors adapt to theme
- No visual artifacts or color issues

**Pass Criteria:**
- ✅ Animations work in Ocean Blue
- ✅ Animations work in Soft Rose
- ✅ Animations work in Forest Green
- ✅ No color or styling issues

---

### Test 8: Edge Cases

**Objective:** Test unusual scenarios

**Test Cases:**

**8a. Very Long Messages**
- Send a very long message (500+ characters)
- Verify animation still works smoothly

**8b. Rapid Message Sending**
- Send 5 messages in quick succession
- Verify each response animates correctly

**8c. App Backgrounding**
- Send a message
- Background the app during typing indicator
- Return to app
- Verify animation completes correctly

**8d. Network Interruption**
- Send a message
- Disable network during AI response
- Re-enable network
- Verify animation works when response arrives

**Pass Criteria:**
- ✅ Long messages animate smoothly
- ✅ Rapid messages each animate correctly
- ✅ Backgrounding doesn't break animations
- ✅ Network issues don't cause animation glitches

---

## Regression Testing

### Areas to Verify

1. **Chat Functionality**
   - Messages send and receive correctly
   - Message history loads properly
   - Subjects/topics work as expected

2. **Memory System**
   - Memories are captured correctly
   - Continuity updates work
   - No impact on memory extraction

3. **UI/UX**
   - No layout shifts or jumps
   - Proper spacing maintained
   - Scrolling remains smooth

4. **Performance**
   - No memory leaks
   - No increased battery drain
   - No frame drops during animations

## Automated Testing (Optional)

```typescript
// Example test using React Native Testing Library
import { render, waitFor } from '@testing-library/react-native';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';

describe('AnimatedChatBubble', () => {
  it('should animate AI messages', async () => {
    const { getByText } = render(
      <AnimatedChatBubble
        message="Test message"
        isUser={false}
        animate={true}
        therapistPersonaId="dr_elias"
      />
    );
    
    await waitFor(() => {
      expect(getByText('Test message')).toBeTruthy();
    });
  });
  
  it('should not animate user messages', () => {
    const { getByText } = render(
      <AnimatedChatBubble
        message="Test message"
        isUser={true}
        animate={true}
      />
    );
    
    // User messages should appear immediately
    expect(getByText('Test message')).toBeTruthy();
  });
});
```

## Bug Reporting Template

```markdown
**Bug Title:** [Brief description]

**Environment:**
- Device: [iPhone 14 / Pixel 6 / etc.]
- OS Version: [iOS 17.2 / Android 13 / etc.]
- App Version: [1.0.0]
- Reduced Motion: [Enabled / Disabled]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots/Video:**
[Attach if possible]

**Console Logs:**
[Paste relevant logs]

**Additional Context:**
[Any other relevant information]
```

## Sign-Off Checklist

Before marking animations as complete, verify:

- [ ] All 8 test cases pass
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] Tested with reduced motion enabled
- [ ] Tested on low-end device
- [ ] No performance regressions
- [ ] No UI regressions
- [ ] All therapists have distinct timing
- [ ] Documentation is complete
- [ ] Code is properly commented

## Conclusion

Once all tests pass and the sign-off checklist is complete, the animation implementation is ready for production deployment.

For questions or issues, refer to:
- `ANIMATION_IMPLEMENTATION_SUMMARY.md` - Technical details
- `ANIMATION_QUICK_REFERENCE.md` - Developer reference
- Console logs with `[AnimatedChatBubble]` or `[AnimatedTypingIndicator]` prefix
