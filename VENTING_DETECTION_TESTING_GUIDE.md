
# Venting Detection - Testing Guide

## Overview

This guide provides comprehensive testing scenarios for the venting detection feature to ensure it works correctly across different user inputs and emotional states.

## Test Categories

1. High-Intensity Venting
2. Medium-Intensity Venting
3. Low-Intensity Venting
4. Explicit Advice-Seeking
5. Rhetorical Questions (Venting)
6. Mixed Signals
7. Edge Cases

---

## 1. High-Intensity Venting Tests

### Test 1.1: Overwhelm Expression

**Input:**
```
I can't handle this anymore. I'm so overwhelmed. Everything is falling apart and I don't know what to do.
```

**Expected Analysis:**
- `isVenting`: true
- `isAskingForAdvice`: false
- `emotionalIntensity`: high
- `needsSpace`: true

**Expected Response:**
- Length: 20-40 words
- Tone: Brief validation
- Content: Acknowledgment only, no advice
- Example: "I hear you. That's overwhelming. You're not alone in this."

**Verification:**
- [ ] Response is under 50 words
- [ ] No "you should" language
- [ ] No solutions offered
- [ ] Validates emotion
- [ ] Feels supportive, not directive

---

### Test 1.2: Breaking Down

**Input:**
```
I'm breaking down. I can't take it anymore. This is too much for me to handle.
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: high
- `needsSpace`: true

**Expected Response:**
- Length: 20-40 words
- Example: "That's a lot to carry. I'm here with you. You don't have to handle this alone."

**Verification:**
- [ ] Very brief response
- [ ] No advice or solutions
- [ ] Grounding language used
- [ ] Emotional safety prioritized

---

### Test 1.3: Desperation

**Input:**
```
I'm desperate. I don't know what to do. I feel like I'm drowning and there's no way out.
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: high
- `needsSpace`: true

**Expected Response:**
- Length: 20-40 words
- Example: "I hear that desperation. You're not alone. Let's take this one breath at a time."

**Verification:**
- [ ] Extremely brief
- [ ] Grounding focus
- [ ] No problem-solving
- [ ] Validates intensity

---

## 2. Medium-Intensity Venting Tests

### Test 2.1: Frustration Expression

**Input:**
```
I'm so frustrated with my partner. They never listen to me and it's like I'm talking to a wall. I'm tired of feeling this way.
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: medium
- `needsSpace`: true

**Expected Response:**
- Length: 40-60 words
- Example: "That sounds really frustrating. Being unheard in a relationship is exhausting. It makes sense you'd feel tired of this pattern. What's the hardest part about it for you right now?"

**Verification:**
- [ ] Response is 40-60 words
- [ ] Validates frustration
- [ ] Optional gentle question included
- [ ] No solutions offered
- [ ] Reflects back emotion

---

### Test 2.2: Disappointment

**Input:**
```
I'm just so disappointed. I thought things would be different by now. I feel stuck and I don't see a way forward.
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: medium
- `needsSpace`: true

**Expected Response:**
- Length: 40-60 words
- Example: "That disappointment is real. When expectations don't match reality, it's painful. Feeling stuck is hard. How are you holding up with all of this?"

**Verification:**
- [ ] Validates disappointment
- [ ] Acknowledges stuck feeling
- [ ] One optional question
- [ ] No advice given

---

### Test 2.3: Exhaustion

**Input:**
```
I'm just exhausted. Every day feels the same and I'm tired of trying. Nothing seems to change no matter what I do.
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: medium
- `needsSpace`: true

**Expected Response:**
- Length: 40-60 words
- Example: "That exhaustion sounds deep. When effort doesn't lead to change, it's draining. You deserve to feel seen in this."

**Verification:**
- [ ] Acknowledges exhaustion
- [ ] Validates effort
- [ ] No "keep trying" language
- [ ] Supportive, not directive

---

## 3. Low-Intensity Venting Tests

### Test 3.1: Mild Frustration

**Input:**
```
I'm a bit frustrated with how things are going. It's not terrible, but it's not great either. Just feeling a bit off.
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: low
- `needsSpace`: false

**Expected Response:**
- Length: 50-80 words
- Example: "I hear what you're saying. That 'in-between' feeling can be uncomfortable—not bad enough to panic, but not good enough to ignore. It makes sense you'd feel a bit off. How are you holding up with all of this?"

**Verification:**
- [ ] Moderate length response
- [ ] Validates mild emotion
- [ ] Optional follow-up question
- [ ] No urgent advice

---

## 4. Explicit Advice-Seeking Tests

### Test 4.1: Direct Question

**Input:**
```
I'm feeling really anxious about this situation with my boss. What should I do? Should I talk to them directly or go to HR first?
```

**Expected Analysis:**
- `isVenting`: false
- `isAskingForAdvice`: true
- `emotionalIntensity`: medium

**Expected Response:**
- Length: Normal (100-150 words)
- Content: Practical advice and guidance
- Example: "That's a tough situation. Before deciding, it might help to consider: What's your relationship with your boss like? Have you tried addressing concerns with them before? If there's a pattern of issues or you feel unsafe, HR might be the better first step. If it's a one-time concern and you generally have good communication, a direct conversation could work. What feels safer to you?"

**Verification:**
- [ ] Normal-length response
- [ ] Advice and suggestions provided
- [ ] Questions answered
- [ ] Practical guidance offered
- [ ] Multiple options presented

---

### Test 4.2: Seeking Suggestions

**Input:**
```
I need some advice. My friend is going through a hard time and I don't know how to help. Any suggestions on what I can do?
```

**Expected Analysis:**
- `isVenting`: false
- `isAskingForAdvice`: true

**Expected Response:**
- Length: Normal
- Content: Concrete suggestions
- Example: "Here are some ways you might help: 1) Check in regularly without expecting them to open up immediately. 2) Offer specific help ('Can I bring dinner?' vs 'Let me know if you need anything'). 3) Listen without trying to fix. 4) Respect their pace—some people need space. What feels most natural for you?"

**Verification:**
- [ ] Actionable suggestions provided
- [ ] Multiple options given
- [ ] Practical advice included
- [ ] Normal response length

---

## 5. Rhetorical Questions (Venting) Tests

### Test 5.1: "Why" Questions

**Input:**
```
Why does this always happen to me? I'm so tired of being treated this way. Why can't people just be decent?
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: medium
- `reasoning`: "Emotional expression with rhetorical questions"

**Expected Response:**
- Length: 40-60 words
- Example: "That exhaustion is real. Being treated poorly repeatedly takes a toll. You deserve better than this."

**Verification:**
- [ ] Treats as venting, not literal questions
- [ ] No attempt to answer "why"
- [ ] Validates emotion
- [ ] Brief response
- [ ] No advice given

---

### Test 5.2: Rhetorical "What" Questions

**Input:**
```
What's the point anymore? I keep trying and nothing changes. What am I even doing?
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: medium/high

**Expected Response:**
- Length: 40-60 words
- Example: "That hopelessness is heavy. When effort doesn't lead to change, it's hard to see the point. I'm here with you in this."

**Verification:**
- [ ] Doesn't answer rhetorical questions literally
- [ ] Validates hopelessness
- [ ] Brief and supportive
- [ ] No problem-solving

---

## 6. Mixed Signals Tests

### Test 6.1: Emotion + Advice Request

**Input:**
```
I'm so overwhelmed with everything. I don't know what to do. What should I do about this?
```

**Expected Analysis:**
- `isVenting`: false (explicit advice request overrides)
- `isAskingForAdvice`: true
- `emotionalIntensity`: high

**Expected Response:**
- Length: Normal, but starts with validation
- Example: "That overwhelm is real. Let's break this down: What's feeling most urgent right now? Sometimes when everything feels like too much, focusing on one thing at a time can help. What's one thing you could address first?"

**Verification:**
- [ ] Validates emotion first
- [ ] Then provides guidance
- [ ] Balances support with advice
- [ ] Acknowledges overwhelm

---

### Test 6.2: Venting + Casual Question

**Input:**
```
I'm just so tired of this situation. It never gets better. Do you think it will ever change?
```

**Expected Analysis:**
- `isVenting`: true (venting indicators stronger)
- `emotionalIntensity`: medium

**Expected Response:**
- Length: 40-60 words
- Example: "That exhaustion is real. When patterns persist, it's hard to see change coming. I hear how tired you are of this."

**Verification:**
- [ ] Treats as venting primarily
- [ ] Doesn't give false hope
- [ ] Validates exhaustion
- [ ] Brief response

---

## 7. Edge Cases Tests

### Test 7.1: Very Short Input

**Input:**
```
I'm overwhelmed.
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: high

**Expected Response:**
- Length: 20-30 words
- Example: "I hear you. That's a lot. You're not alone."

**Verification:**
- [ ] Very brief response
- [ ] Matches input brevity
- [ ] Validates emotion

---

### Test 7.2: Long Narrative (Venting)

**Input:**
```
So yesterday my partner came home and immediately started complaining about their day. I had a terrible day too but they didn't even ask. Then they got mad at me for not being supportive enough. I'm so tired of this pattern. It's always about them and never about me. I feel invisible in my own relationship. I don't know how much more of this I can take.
```

**Expected Analysis:**
- `isVenting`: true
- `emotionalIntensity`: medium/high

**Expected Response:**
- Length: 50-80 words
- Example: "That pattern sounds exhausting. Feeling invisible in your own relationship is painful. It makes sense you're tired of this—being unheard repeatedly takes a toll. You deserve to be seen and supported too."

**Verification:**
- [ ] Acknowledges pattern
- [ ] Validates invisibility feeling
- [ ] No advice about what to do
- [ ] Supportive tone

---

### Test 7.3: Neutral Statement

**Input:**
```
I talked to my friend today about the situation.
```

**Expected Analysis:**
- `isVenting`: false
- `isAskingForAdvice`: false
- `emotionalIntensity`: low

**Expected Response:**
- Length: Normal
- Example: "How did that conversation go? What came up for you?"

**Verification:**
- [ ] Natural follow-up
- [ ] Not treated as venting
- [ ] Open-ended question
- [ ] Neutral tone

---

## Automated Testing Checklist

### Unit Tests

```typescript
describe('Venting Detection', () => {
  test('detects high-intensity venting', () => {
    const result = analyzeVentingVsAdviceSeeking("I can't handle this anymore");
    expect(result.isVenting).toBe(true);
    expect(result.emotionalIntensity).toBe('high');
  });

  test('detects explicit advice-seeking', () => {
    const result = analyzeVentingVsAdviceSeeking("What should I do?");
    expect(result.isAskingForAdvice).toBe(true);
    expect(result.isVenting).toBe(false);
  });

  test('detects rhetorical questions as venting', () => {
    const result = analyzeVentingVsAdviceSeeking("Why does this always happen to me?");
    expect(result.isVenting).toBe(true);
  });
});
```

### Integration Tests

- [ ] Test full Edge Function with venting input
- [ ] Verify response length constraints
- [ ] Check token limits are applied correctly
- [ ] Validate system prompt includes venting guidance

---

## Manual Testing Workflow

1. **Setup**: Deploy Edge Function to staging
2. **Test Each Category**: Run through all test cases above
3. **Document Results**: Record actual vs. expected for each test
4. **Edge Cases**: Try variations and unexpected inputs
5. **User Feedback**: Have real users test and provide feedback

---

## Success Criteria

✅ **Venting Detection Accuracy**: >90% correct classification
✅ **Response Length**: Venting responses are 20-80 words
✅ **No Unsolicited Advice**: 0% advice when venting detected
✅ **User Satisfaction**: Users feel heard, not guided
✅ **Emotional Intelligence**: Responses adapt to intensity

---

## Troubleshooting

### Issue: False Positives (Advice detected as venting)
**Debug:**
1. Check for explicit advice keywords in input
2. Review venting indicator count
3. Verify question detection logic

**Fix:**
- Add more explicit advice keywords
- Adjust venting indicator threshold
- Improve question word detection

### Issue: False Negatives (Venting detected as advice)
**Debug:**
1. Check emotional intensity keywords
2. Review venting indicator matching
3. Verify no explicit advice requests

**Fix:**
- Add more venting indicators
- Improve emotional intensity detection
- Adjust decision logic thresholds

### Issue: Response Too Long When Venting
**Debug:**
1. Check `maxTokens` calculation
2. Verify venting guidance is in system prompt
3. Review OpenAI response

**Fix:**
- Reduce `maxTokens` for venting
- Strengthen venting guidance language
- Add explicit word count limits

---

## Reporting

### Test Report Template

```markdown
## Venting Detection Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Staging/Production]

### Summary
- Total Tests: [X]
- Passed: [X]
- Failed: [X]
- Pass Rate: [X%]

### Failed Tests
1. [Test Name]: [Reason for failure]
2. [Test Name]: [Reason for failure]

### Recommendations
- [Recommendation 1]
- [Recommendation 2]

### Next Steps
- [Action item 1]
- [Action item 2]
```

---

## Conclusion

This testing guide ensures comprehensive coverage of venting detection functionality. Follow this guide for each deployment to maintain quality and user experience.
