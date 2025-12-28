
# Adaptive Response Length - Testing Guide

## Overview

This guide provides comprehensive testing procedures for the adaptive response length and emotional pacing feature.

## Test Environment Setup

### Prerequisites
1. Supabase Edge Function deployed with latest changes
2. Test user account with therapist persona selected
3. Access to Edge Function logs for verification

### Test Data
Create test conversations with various input types:
- Short messages (1-5 words)
- Medium messages (10-30 words)
- Long messages (40+ words)
- Emotional messages (high/medium intensity)
- Depth requests (asking for explanations)
- Multiple questions

## Test Cases

### Test 1: Very Short Input

**Objective:** Verify system responds briefly to very short user input

**Test Steps:**
1. Send message: "I'm sad"
2. Observe AI response

**Expected Results:**
- Response length: ~30 words (±10 words)
- Max 1 question
- Calm, supportive tone
- No multi-paragraph response

**Example Expected Response:**
```
"I hear you. What's making you feel sad right now?"
```

**Verification:**
- [ ] Response is brief (20-40 words)
- [ ] Contains max 1 question
- [ ] Feels supportive, not dismissive
- [ ] Maintains therapist personality

**Edge Function Log Check:**
```
[Edge][Chat][uuid] Response guidance: {
  targetWords: 30,
  maxQuestions: 1,
  pacing: 'steady',
  emotionalIntensity: 'medium',
  reasoning: 'User input is very short - matching with brief response'
}
```

---

### Test 2: High Emotional Intensity

**Objective:** Verify system slows down and stays brief when user is highly emotional

**Test Steps:**
1. Send message: "I'm completely overwhelmed. Everything is falling apart and I can't handle this anymore. I feel like I'm drowning."
2. Observe AI response

**Expected Results:**
- Response length: ~60 words (±15 words)
- Max 1 question
- Slow pacing (shorter sentences, pauses)
- Prioritizes grounding over advice
- No complex suggestions

**Example Expected Response:**
```
"That sounds really heavy to carry.

Let's take a breath for a moment.

What do you need most right now?"
```

**Verification:**
- [ ] Response is brief (45-75 words)
- [ ] Contains max 1 question
- [ ] Uses shorter sentences
- [ ] Includes pauses/line breaks
- [ ] Focuses on grounding, not advice
- [ ] Feels calming, not overwhelming

**Edge Function Log Check:**
```
[Edge][Chat][uuid] Response guidance: {
  targetWords: 60,
  maxQuestions: 1,
  pacing: 'slow',
  emotionalIntensity: 'high',
  reasoning: 'High emotional intensity detected - slowing down and staying brief'
}
```

---

### Test 3: Medium Emotional Intensity

**Objective:** Verify system provides balanced response to medium emotion

**Test Steps:**
1. Send message: "I'm feeling really anxious about talking to him. I don't know what to say."
2. Observe AI response

**Expected Results:**
- Response length: ~80 words (±20 words)
- Max 1 question
- Steady pacing
- Balances validation with guidance

**Example Expected Response:**
```
"It makes sense that you're feeling anxious about this conversation. That uncertainty can be really uncomfortable.

What's the main thing you want him to understand?"
```

**Verification:**
- [ ] Response is moderate (60-100 words)
- [ ] Contains max 1 question
- [ ] Balances empathy with guidance
- [ ] Feels supportive but not overly soft

**Edge Function Log Check:**
```
[Edge][Chat][uuid] Response guidance: {
  targetWords: 80,
  maxQuestions: 1,
  pacing: 'steady',
  emotionalIntensity: 'medium',
  reasoning: 'Medium emotional intensity - balanced response'
}
```

---

### Test 4: Depth Request

**Objective:** Verify system provides detailed response when user explicitly asks for depth

**Test Steps:**
1. Send message: "Can you explain why I keep falling into the same patterns with my partner? I want to understand what's happening."
2. Observe AI response

**Expected Results:**
- Response length: ~150 words (±30 words)
- Max 1 question
- Provides thoughtful explanation
- Still maintains question limit

**Example Expected Response:**
```
"It sounds like you're noticing a cycle, which is actually a really important first step.

Relationship patterns often form because they served a purpose at some point—maybe they helped you feel safe, avoid conflict, or get a need met. Over time, these patterns become automatic, even when they're no longer helpful.

For example, if you tend to withdraw when things get tense, it might be because you learned early on that conflict feels unsafe. Your partner might respond by pursuing you more, which makes you withdraw further—and the cycle continues.

The good news is that awareness is the first step to change. Once you can see the pattern clearly, you can start to interrupt it.

What do you notice happens right before the pattern starts?"
```

**Verification:**
- [ ] Response is detailed (120-180 words)
- [ ] Contains max 1 question
- [ ] Provides thoughtful explanation
- [ ] Feels educational, not overwhelming
- [ ] Maintains conversational tone

**Edge Function Log Check:**
```
[Edge][Chat][uuid] Response guidance: {
  targetWords: 150,
  maxQuestions: 1,
  pacing: 'steady',
  emotionalIntensity: 'low',
  reasoning: 'User explicitly asking for depth - providing detailed response'
}
```

---

### Test 5: Multiple Questions from User

**Objective:** Verify system can ask 2-3 clarifying questions when user asks multiple questions

**Test Steps:**
1. Send message: "Should I talk to him? What should I say? Is it too soon? I don't know what to do."
2. Observe AI response

**Expected Results:**
- Response length: ~100 words (±20 words)
- Max 3 questions allowed
- Questions are focused and helpful
- Helps user clarify thinking

**Example Expected Response:**
```
"Those are all great questions. Let me help you think through this:

1. Timing: What's making you wonder if it's too soon?
2. Content: What's the main thing you want him to understand?
3. Readiness: How do you feel when you imagine having this conversation?

Once we clarify these, we can figure out the best approach together."
```

**Verification:**
- [ ] Response is moderate (80-120 words)
- [ ] Contains 2-3 focused questions
- [ ] Questions help clarify user's thinking
- [ ] Feels helpful, not interrogating

**Edge Function Log Check:**
```
[Edge][Chat][uuid] Response guidance: {
  targetWords: 100,
  maxQuestions: 3,
  pacing: 'steady',
  emotionalIntensity: 'low',
  reasoning: 'User asking multiple questions - clarification needed'
}
```

---

### Test 6: Short Input (6-15 words)

**Objective:** Verify system responds appropriately to short but not very short input

**Test Steps:**
1. Send message: "I don't know if I should text him back"
2. Observe AI response

**Expected Results:**
- Response length: ~50 words (±15 words)
- Max 1 question
- Concise but supportive

**Example Expected Response:**
```
"What's making you hesitate? Is it about what to say, or are you unsure if you want to respond at all?"
```

**Verification:**
- [ ] Response is brief (35-65 words)
- [ ] Contains max 1 question
- [ ] Feels supportive and focused

---

### Test 7: Medium Input (16-40 words)

**Objective:** Verify system provides balanced response to medium-length input

**Test Steps:**
1. Send message: "I had a really difficult conversation with my mom yesterday. She said some things that hurt, but I don't think she meant to. I'm not sure how to feel about it."
2. Observe AI response

**Expected Results:**
- Response length: ~100 words (±20 words)
- Max 1 question
- Balances validation with exploration

**Example Expected Response:**
```
"That sounds like a really confusing place to be—hurt by what she said, but also aware she might not have meant it that way. That kind of mixed feeling can be really hard to sit with.

What do you think she was trying to communicate, even if it came out wrong?"
```

**Verification:**
- [ ] Response is moderate (80-120 words)
- [ ] Contains max 1 question
- [ ] Balances empathy with exploration
- [ ] Feels thoughtful, not rushed

---

### Test 8: Long Input (40+ words)

**Objective:** Verify system provides thoughtful but not excessive response to long input

**Test Steps:**
1. Send message: "I've been thinking a lot about my relationship with my dad. We've never been close, and I've always felt like he doesn't really understand me. I try to talk to him, but it always ends up feeling surface-level. I want to have a deeper connection with him, but I don't know how to get there. I'm worried that if I try to open up more, he'll just shut down or change the subject like he always does. I don't want to keep feeling this distance between us, but I also don't want to set myself up for disappointment."
2. Observe AI response

**Expected Results:**
- Response length: ~120 words (±30 words)
- Max 1 question
- Thoughtful but not overwhelming
- Addresses key themes

**Example Expected Response:**
```
"It sounds like you're carrying a lot of longing for something deeper with your dad, and also a lot of protective caution because of how things have gone in the past. That's a really understandable place to be.

The fear of disappointment makes sense—you've tried before and it hasn't felt reciprocated. But I also hear that the distance is painful, and you're wondering if there's a way to bridge it without getting hurt again.

What would it look like to take a small step toward connection, something that feels safe enough to try?"
```

**Verification:**
- [ ] Response is thoughtful (90-150 words)
- [ ] Contains max 1 question
- [ ] Addresses key themes from user input
- [ ] Feels reflective, not overwhelming

---

### Test 9: Therapist Style Preservation (Dr. Elias)

**Objective:** Verify Dr. Elias maintains calm, grounding style while adapting length

**Test Steps:**
1. Select Dr. Elias as therapist persona
2. Send short emotional message: "I'm panicking"
3. Observe AI response

**Expected Results:**
- Response length: ~60 words (adapted for high emotion)
- Maintains Dr. Elias's calm, grounding style
- Uses characteristic phrases like "Let's take a breath"

**Example Expected Response:**
```
"Let's take a breath for a moment.

You're safe right now.

What's happening that's making you feel this way?"
```

**Verification:**
- [ ] Response is brief (45-75 words)
- [ ] Feels distinctly like Dr. Elias (calm, grounding)
- [ ] Uses characteristic language
- [ ] Prioritizes emotional safety

---

### Test 10: Therapist Style Preservation (Noah)

**Objective:** Verify Noah maintains direct, practical style while adapting length

**Test Steps:**
1. Select Noah as therapist persona
2. Send short message: "I don't know what to do"
3. Observe AI response

**Expected Results:**
- Response length: ~50 words (adapted for short input)
- Maintains Noah's direct, practical style
- Gets to the point quickly

**Example Expected Response:**
```
"Okay. Here's the clean version: What's the decision you're facing, and what's making it hard?"
```

**Verification:**
- [ ] Response is brief (35-65 words)
- [ ] Feels distinctly like Noah (direct, practical)
- [ ] Uses characteristic language
- [ ] Focuses on clarity and action

---

### Test 11: No Stacked Validations

**Objective:** Verify system avoids repetitive validation phrases

**Test Steps:**
1. Have a multi-turn conversation
2. Express similar emotions in multiple messages
3. Observe AI responses for repetition

**Expected Results:**
- No repeated phrases like "That makes sense" in consecutive responses
- Varied validation language
- Natural, non-repetitive conversation

**Verification:**
- [ ] No identical validation phrases repeated
- [ ] Varied empathetic language
- [ ] Feels natural, not formulaic

---

### Test 12: Question Limit Enforcement

**Objective:** Verify system respects max 1 question limit (unless clarification needed)

**Test Steps:**
1. Send various messages throughout a conversation
2. Count questions in each AI response
3. Verify max 1 question per response (except when user asks multiple questions)

**Expected Results:**
- Most responses contain 0-1 questions
- Only 2-3 questions when user asks multiple questions
- Never feels interrogating

**Verification:**
- [ ] Most responses have ≤1 question
- [ ] Multiple questions only when appropriate
- [ ] Never feels like an interrogation

---

## Regression Testing

### Ensure No Breaking Changes

1. **Memory System**
   - [ ] Person memories still load correctly
   - [ ] Memory extraction still works
   - [ ] Memory display unchanged

2. **Continuity System**
   - [ ] Conversation continuity still works
   - [ ] Emotional continuity still works
   - [ ] Continuity toggle still functions

3. **Therapist Personas**
   - [ ] All personas still selectable
   - [ ] Persona styles remain distinct
   - [ ] Persona system prompts unchanged

4. **AI Tones**
   - [ ] All tones still selectable
   - [ ] Tone instructions still applied
   - [ ] Tone behavior unchanged

5. **Science Mode**
   - [ ] Science mode toggle still works
   - [ ] Resources still provided when enabled
   - [ ] No resources when disabled

## Performance Testing

### Response Time
- [ ] Response time remains under 5 seconds
- [ ] No significant latency increase
- [ ] Token limit adjustments don't cause timeouts

### Token Usage
- [ ] Token usage reduced for short responses
- [ ] Token usage appropriate for long responses
- [ ] No excessive token consumption

## Edge Cases

### Test 13: Empty or Whitespace Input
**Input:** "   " (whitespace only)
**Expected:** Graceful handling, default supportive message

### Test 14: Very Long Input (100+ words)
**Input:** [Very long message]
**Expected:** Response still capped at ~120 words, doesn't mirror length

### Test 15: Mixed Emotion (High + Depth Request)
**Input:** "I'm completely overwhelmed. Can you explain why this keeps happening?"
**Expected:** Prioritizes emotional grounding (60 words) over depth request

### Test 16: No Emotion, No Questions
**Input:** "I talked to him today."
**Expected:** Brief, open-ended response (~50 words)

## Acceptance Criteria Verification

After completing all tests, verify:

✅ **Responses feel calm, not verbose**
- [ ] Short input → short response consistently
- [ ] No unnecessary elaboration
- [ ] Users report feeling comfortable with length

✅ **User never feels talked at**
- [ ] Max 1 question per response (unless clarification)
- [ ] No stacked validations
- [ ] Conversational, not lecturing

✅ **Therapist styles remain distinct**
- [ ] Dr. Elias feels calm and grounding
- [ ] Noah feels direct and practical
- [ ] Maya feels gentle and validating
- [ ] All personas maintain personality

✅ **Emotional pacing works correctly**
- [ ] High emotion → slow, brief response
- [ ] Medium emotion → balanced response
- [ ] Low emotion → standard pacing

✅ **Depth requests honored**
- [ ] User can ask for detailed explanations
- [ ] System allows longer responses when requested
- [ ] Still maintains question limit

## Bug Reporting Template

If issues are found, report using this template:

```
**Test Case:** [Test number and name]
**Input:** [User message]
**Expected:** [Expected behavior]
**Actual:** [Actual behavior]
**Response Length:** [Word count]
**Question Count:** [Number of questions]
**Therapist Persona:** [Persona name]
**Edge Function Logs:** [Relevant log excerpts]
**Screenshots:** [If applicable]
```

## Sign-Off Checklist

Before marking testing complete:

- [ ] All 16 test cases passed
- [ ] Regression testing completed
- [ ] Performance testing completed
- [ ] Edge cases handled
- [ ] Acceptance criteria verified
- [ ] No critical bugs found
- [ ] Documentation reviewed
- [ ] Edge Function logs reviewed

## Notes

- Test with multiple therapist personas to ensure consistency
- Test at different times of day to verify consistent behavior
- Monitor Edge Function logs for any errors or warnings
- Collect user feedback after deployment for real-world validation
