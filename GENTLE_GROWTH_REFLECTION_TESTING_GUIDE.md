
# Gentle Growth Reflection - Testing Guide

## Overview

This guide helps you test the Gentle Growth Reflection feature to ensure it meets acceptance criteria.

## Test Scenarios

### Scenario 1: Pattern Recognition

**Setup**: User mentions noticing a recurring behavior

**Test Input**:
```
User: "I just realized I always shut down when my partner criticizes me."
```

**Expected Behavior**:
- AI reflects the noticing without praise
- No progress language
- Neutral, observational tone

**Good Response Examples**:
- "You're noticing that pattern now."
- "You're catching yourself doing this."

**Bad Response Examples** (should NOT happen):
- "You're making great progress!" ❌
- "You're really improving at self-awareness!" ❌
- "You've come so far!" ❌

---

### Scenario 2: New Awareness

**Setup**: User expresses a new realization

**Test Input**:
```
User: "I never thought about it this way before, but maybe I'm afraid of being vulnerable."
```

**Expected Behavior**:
- AI acknowledges the awareness neutrally
- No celebration or praise
- Present-focused observation

**Good Response Examples**:
- "This awareness is new."
- "Something's shifting in how you see this."

**Bad Response Examples** (should NOT happen):
- "That's amazing progress!" ❌
- "You're growing so much!" ❌
- "You're getting there!" ❌

---

### Scenario 3: Connection Making

**Setup**: User connects two previously separate ideas

**Test Input**:
```
User: "Wait, I think I do the same thing with my boss that I do with my mom."
```

**Expected Behavior**:
- AI reflects the connection without evaluation
- No performance framing
- Simple acknowledgment

**Good Response Examples**:
- "You're connecting these pieces."
- "You're seeing this differently than before."

**Bad Response Examples** (should NOT happen):
- "You're doing so well at recognizing patterns!" ❌
- "You're making real strides!" ❌
- "I'm proud of how much you're learning!" ❌

---

### Scenario 4: No Forced Reflection

**Setup**: User shares without new awareness

**Test Input**:
```
User: "I had a fight with my partner today. It was exhausting."
```

**Expected Behavior**:
- AI responds normally without forcing growth language
- No artificial reflection
- Natural supportive response

**Good Response Examples**:
- "That sounds really draining."
- "What happened?"
- "I'm here with you."

**Bad Response Examples** (should NOT happen):
- "You're noticing patterns." ❌ (forced, not earned)
- "You're more aware now." ❌ (not relevant)

---

### Scenario 5: Frequency Check

**Setup**: Multiple conversations in a row

**Test Input**: Have 4-5 conversations where user shares insights

**Expected Behavior**:
- Growth reflection used sparingly (once every 3-4 conversations)
- Not every insight gets a reflection phrase
- Natural variation in responses

**Good Pattern**:
- Conversation 1: Normal response
- Conversation 2: Normal response
- Conversation 3: Growth reflection used
- Conversation 4: Normal response
- Conversation 5: Normal response

**Bad Pattern** (should NOT happen):
- Every conversation uses growth reflection ❌
- Formulaic responses ❌
- Overuse of reflection phrases ❌

---

## Acceptance Criteria Checklist

After testing, verify:

- [ ] Users feel seen and witnessed
- [ ] No performance framing or pressure
- [ ] No implied outcomes or goals
- [ ] No timelines or comparisons
- [ ] Safe and supportive atmosphere maintained
- [ ] Reflection feels natural, not forced
- [ ] User never feels evaluated or judged
- [ ] Sparse usage (not every response)
- [ ] No forbidden phrases used
- [ ] Tone is neutral observation, not celebration

---

## Red Flags to Watch For

### 🚨 Critical Issues

1. **Progress Language**
   - Any use of "progress", "improving", "better", "growing"
   - Immediate fix required

2. **Timeline References**
   - "Since last time", "over time", "lately"
   - Immediate fix required

3. **Performance Framing**
   - "You're doing well", "keep it up", "you're succeeding"
   - Immediate fix required

### ⚠️ Warning Signs

1. **Overuse**
   - Reflection phrases in every response
   - Feels formulaic or scripted
   - Adjust frequency guidance

2. **Forced Reflection**
   - Reflection used when not earned
   - Doesn't match user's actual awareness
   - Adjust usage criteria

3. **Celebration Tone**
   - Excitement or praise in reflection
   - "That's great!" energy
   - Adjust tone guidance

---

## Manual Testing Checklist

### Pre-Deployment
- [ ] Review Edge Function code changes
- [ ] Verify guidance is integrated into system prompt
- [ ] Check forbidden phrases list is complete
- [ ] Confirm priority level is set to CRITICAL

### Post-Deployment
- [ ] Test Scenario 1: Pattern Recognition
- [ ] Test Scenario 2: New Awareness
- [ ] Test Scenario 3: Connection Making
- [ ] Test Scenario 4: No Forced Reflection
- [ ] Test Scenario 5: Frequency Check
- [ ] Verify acceptance criteria
- [ ] Check for red flags
- [ ] Test with different therapist personas
- [ ] Test with different AI tones

### User Feedback
- [ ] Collect feedback on feeling seen vs. evaluated
- [ ] Monitor for pressure or performance framing
- [ ] Adjust guidance based on real-world usage

---

## Troubleshooting

### Issue: AI uses forbidden phrases

**Solution**:
1. Check Edge Function deployment status
2. Verify guidance is in system prompt
3. Review forbidden phrases list
4. Redeploy if necessary

### Issue: Reflection feels forced

**Solution**:
1. Review usage frequency guidance
2. Adjust "only when genuinely observing" criteria
3. Add more context to when reflection is appropriate

### Issue: Not enough reflection

**Solution**:
1. This is actually good! Sparse usage is intentional
2. Verify reflection is used when truly earned
3. Don't increase frequency just to use the feature

### Issue: Users feel evaluated

**Solution**:
1. Review tone guidance (neutral vs. celebratory)
2. Check for subtle progress language
3. Adjust forbidden phrases list
4. Emphasize "mirror, not scorekeeper" principle

---

## Success Metrics

### Qualitative
- Users report feeling "seen" and "understood"
- No reports of feeling "judged" or "evaluated"
- Reflection feels natural and earned
- Safe, supportive atmosphere maintained

### Quantitative
- Reflection phrases used in <25% of responses
- Zero forbidden phrases detected
- No timeline or metric references
- Consistent with all therapist personas

---

## Next Steps After Testing

1. **If all tests pass**:
   - Document successful deployment
   - Monitor user feedback
   - No changes needed

2. **If issues found**:
   - Document specific issues
   - Adjust guidance in Edge Function
   - Redeploy and retest
   - Update documentation

3. **Ongoing monitoring**:
   - Review user feedback monthly
   - Adjust forbidden phrases as needed
   - Refine usage frequency guidance
   - Update examples based on real usage

---

**Remember**: The goal is for users to feel witnessed, not measured. If in doubt, use less reflection rather than more.
