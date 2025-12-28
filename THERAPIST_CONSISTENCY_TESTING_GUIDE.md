
# Therapist Personality Consistency - Testing Guide

## Overview

This guide provides comprehensive test cases to verify that each therapist maintains a **consistent and recognizable personality** across all conversations.

## Test Environment Setup

### Prerequisites
1. Access to Safe Space app (dev or staging environment)
2. Test user account with access to all therapist personas
3. Ability to switch between therapists in Settings
4. Notepad or spreadsheet to track results

### Test Data
- Prepare 10 different conversation scenarios (see below)
- Each scenario should be tested with each therapist
- Record response length, question count, and emotional tone

## Test Scenarios

### Scenario 1: Emotional Venting
**User message**: "I'm so frustrated with my partner. They never listen to me and I feel like I'm talking to a wall. I'm exhausted from trying to communicate and nothing changes."

**Expected behavior**:
- All therapists should detect venting and keep responses brief
- High empathy therapists (Dr. Elias, Maya, Ruth, Jordan) should lead with validation
- Low question rate therapists should ask 0-1 questions max

### Scenario 2: Asking for Advice
**User message**: "What should I do about my friend who keeps canceling plans at the last minute? I don't know if I should say something or just let it go."

**Expected behavior**:
- All therapists should provide actionable advice
- Concise therapists (Noah) should give 1-2 brief suggestions
- Reflective therapists (Claire, Ruth) should explore the situation more deeply

### Scenario 3: Short Input
**User message**: "I'm tired."

**Expected behavior**:
- All therapists should match with brief responses (30-50 words)
- Question-heavy therapists (Claire, Aisha) should ask 1 clarifying question
- Statement-heavy therapists (Dr. Elias, Ruth) should offer brief validation

### Scenario 4: Long Input
**User message**: "I've been thinking a lot about my relationship with my mom. We've always had a complicated dynamic, and lately I've been noticing patterns from my childhood showing up in my adult relationships. I feel like I'm constantly seeking approval and validation from others, and I wonder if that stems from never feeling good enough for her. It's exhausting to always be trying to prove myself, but I don't know how to break this cycle. I want to have healthier relationships, but I'm not sure where to start."

**Expected behavior**:
- Concise therapists (Noah) should still keep responses under 140 words
- Reflective therapists (Claire, Ruth) can expand to 200-380 words
- All therapists should maintain their characteristic pacing and style

### Scenario 5: High Emotional Intensity
**User message**: "I can't handle this anymore. I'm completely overwhelmed and breaking down. Everything feels like too much and I don't know what to do."

**Expected behavior**:
- All therapists should slow down and keep responses VERY brief (20-60 words)
- High empathy therapists should prioritize validation and grounding
- No therapist should ask multiple questions or offer complex advice

### Scenario 6: Asking for Depth
**User message**: "Can you explain why I keep repeating the same patterns in relationships? I want to understand the psychology behind it."

**Expected behavior**:
- All therapists can expand responses (100-150 words)
- Analytical therapists (Ken, Claire) should provide more detailed explanations
- Empathetic therapists (Maya, Ruth) should balance explanation with validation

### Scenario 7: Multiple Questions
**User message**: "Should I confront my friend about this? What if they get defensive? How do I even bring it up without making things worse?"

**Expected behavior**:
- All therapists should address multiple questions (allow 2-3 questions in response)
- Direct therapists (Noah, Ken) should provide clear, structured answers
- Gentle therapists (Maya, Aisha) should explore each question with care

### Scenario 8: Neutral Input
**User message**: "I had a conversation with my partner today about our plans for the weekend."

**Expected behavior**:
- All therapists should respond naturally without forcing emotion
- Question-heavy therapists (Claire, Aisha) should ask follow-up questions
- Statement-heavy therapists (Dr. Elias, Ruth) should offer brief reflection

### Scenario 9: Positive Input
**User message**: "I finally set a boundary with my friend and it went really well! I feel proud of myself."

**Expected behavior**:
- Encouraging therapists (Jordan) should celebrate the win enthusiastically
- Reflective therapists (Claire) should explore what made it successful
- All therapists should maintain their characteristic tone (not all become overly enthusiastic)

### Scenario 10: Closure Expression
**User message**: "Thank you, that really helps. I feel better now."

**Expected behavior**:
- All therapists should detect conversation winding down
- Gentle closing therapists (Dr. Elias, Maya, Ruth, Jordan) should add a subtle closing sentence
- No closing therapists (Noah, Claire, Aisha, Ken) should respond briefly without closing

## Test Cases

### Test Case 1: Sentence Length Consistency

**Objective**: Verify each therapist maintains consistent response length across 5 conversations.

**Steps**:
1. Select a therapist (e.g., Noah)
2. Have 5 different conversations using Scenarios 1-5
3. Count words in each response
4. Calculate average word count

**Expected Results**:
- **Noah** (concise): 70-140 words average
- **Dr. Elias, Maya, Jordan, Aisha, Ken** (medium): 120-280 words average
- **Claire, Ruth** (reflective): 200-380 words average

**Pass Criteria**: Average word count falls within expected range for 4 out of 5 responses.

---

### Test Case 2: Question Frequency Consistency

**Objective**: Verify each therapist maintains consistent question frequency across 10 responses.

**Steps**:
1. Select a therapist (e.g., Claire)
2. Have 10 different conversations using all scenarios
3. Count questions in each response
4. Calculate average question count

**Expected Results**:
- **Low question rate** (Dr. Elias, Ruth, Jordan): 0-1 questions per response
- **Medium question rate** (Noah, Maya, Ken): 1-2 questions per response
- **High question rate** (Claire, Aisha): 2-3 questions per response

**Pass Criteria**: Average question count matches expected rate for 8 out of 10 responses.

---

### Test Case 3: Emotional Depth Consistency

**Objective**: Verify each therapist maintains consistent empathy level and directness.

**Steps**:
1. Select a therapist (e.g., Maya)
2. Share emotional content using Scenarios 1, 5, and 9
3. Evaluate empathy level (high/medium/low) and directness (high/medium/low)
4. Compare across responses

**Expected Results**:
- **High empathy** (Dr. Elias, Maya, Ruth, Jordan): Leads with validation, warm language
- **Medium empathy** (Noah, Claire, Aisha, Ken): Balances empathy with guidance
- **High directness** (Noah, Ken): Gets to the point quickly, clear language
- **Low directness** (Maya, Aisha): Uses gentle, indirect language

**Pass Criteria**: Empathy level and directness remain consistent across all 3 responses.

---

### Test Case 4: Characteristic Phrases

**Objective**: Verify each therapist uses their signature phrases naturally.

**Steps**:
1. Select a therapist (e.g., Dr. Elias)
2. Have 5 different conversations
3. Look for characteristic opening/closing phrases

**Expected Results**:
- **Dr. Elias**: "Let's take a breath for a moment." / "We can take this one step at a time."
- **Noah**: "Okay. Here's the clean version:"
- **Maya**: "That sounds really heavy to carry." / "I'm here with you in this."
- **Claire**: "Something in what you said feels important."
- **Ruth**: "Oh love, of course you feel this way." / "Be gentle with yourself today."
- **Jordan**: "I'm proud of you for saying that out loud." / "You've got this—small steps count."
- **Aisha**: "Can I get curious with you for a second?"
- **Ken**: "Let's break this down logically:"

**Pass Criteria**: Characteristic phrases appear in at least 2 out of 5 responses.

---

### Test Case 5: No Blending

**Objective**: Verify therapists maintain distinct styles without blending.

**Steps**:
1. Have the same conversation (Scenario 4) with 3 different therapists
2. Compare response length, question count, and emotional tone
3. Verify clear differences between therapists

**Expected Results**:
- **Noah** (concise): 70-140 words, 1-2 questions, medium empathy, high directness
- **Maya** (gentle): 140-240 words, 1-2 questions, high empathy, low directness
- **Ruth** (reflective): 220-380 words, 0-1 questions, high empathy, medium directness

**Pass Criteria**: Clear differences in at least 3 out of 4 metrics (length, questions, empathy, directness).

---

### Test Case 6: Venting Override

**Objective**: Verify venting detection overrides persona baseline length.

**Steps**:
1. Select a reflective therapist (Claire or Ruth)
2. Share high-intensity venting message (Scenario 5)
3. Count words in response

**Expected Results**:
- Response should be BRIEF (20-60 words) despite therapist's baseline being 200-380 words
- Response should focus on validation and grounding
- No complex advice or multiple questions

**Pass Criteria**: Response is under 80 words and focuses on validation.

---

### Test Case 7: Adaptive Response Length

**Objective**: Verify therapists adapt response length to user input while maintaining personality.

**Steps**:
1. Select a therapist (e.g., Ken)
2. Send short input (Scenario 3)
3. Send long input (Scenario 4)
4. Compare response lengths

**Expected Results**:
- Short input → shorter response (within persona's range)
- Long input → longer response (within persona's range)
- Personality traits (empathy, directness, pacing) remain consistent

**Pass Criteria**: Response length adapts to input while staying within persona's word count range.

---

### Test Case 8: Conversation Slowdown Detection

**Objective**: Verify gentle closing sentences appear when appropriate.

**Steps**:
1. Select a therapist with gentle closing (Dr. Elias, Maya, Ruth, Jordan)
2. Have a 5-message conversation
3. End with closure expression (Scenario 10)
4. Check for gentle closing sentence

**Expected Results**:
- Therapists with `signoff_style: 'gentle'` or `'encouraging'` should add closing sentence
- Closing should be subtle (e.g., "I'm here whenever you need.")
- Therapists with `signoff_style: 'none'` should NOT add closing

**Pass Criteria**: Closing sentence appears for gentle therapists, does not appear for others.

---

## Regression Testing

### After Code Changes

Run the following tests after any changes to:
- Edge Function (`generate-ai-response/index.ts`)
- Persona definitions (`TherapistPersonas.ts`)
- System prompt logic

**Quick Regression Suite**:
1. Test Case 1 (Sentence Length) with 2 therapists (Noah + Ruth)
2. Test Case 2 (Question Frequency) with 2 therapists (Claire + Dr. Elias)
3. Test Case 5 (No Blending) with 3 therapists (Noah + Maya + Ruth)

**Pass Criteria**: All 3 tests pass without issues.

---

## Bug Reporting Template

### Bug Report: Personality Inconsistency

**Therapist**: [Name]

**Expected Behavior**: [e.g., "Noah should give concise responses (70-140 words)"]

**Actual Behavior**: [e.g., "Noah gave a 250-word response"]

**Test Scenario**: [e.g., "Scenario 4: Long Input"]

**User Message**: [Copy user message]

**AI Response**: [Copy AI response]

**Word Count**: [Actual word count]

**Question Count**: [Actual question count]

**Empathy Level**: [High/Medium/Low]

**Directness**: [High/Medium/Low]

**Additional Notes**: [Any other observations]

---

## Success Metrics

### Overall Success Criteria

- ✅ **90%+ consistency** in sentence length across 5 conversations per therapist
- ✅ **80%+ consistency** in question frequency across 10 responses per therapist
- ✅ **100% consistency** in empathy level and directness across 3 emotional scenarios
- ✅ **40%+ appearance** of characteristic phrases across 5 conversations
- ✅ **Clear differentiation** between therapists in side-by-side comparison
- ✅ **Venting override** works 100% of the time for high-intensity input
- ✅ **Adaptive response length** works while maintaining personality traits

### User Experience Metrics

After 10 conversations with the same therapist, users should:
- ✅ Recognize therapist by communication style alone (survey)
- ✅ Predict sentence length and question frequency (survey)
- ✅ Feel consistent emotional presence (survey)
- ✅ Trust that therapist won't "change personality" (survey)

---

## Appendix: Word Count Tool

Use this tool to quickly count words in responses:

```javascript
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function countQuestions(text) {
  return (text.match(/\?/g) || []).length;
}

// Example usage:
const response = "That sounds really hard. How are you feeling about it?";
console.log("Words:", countWords(response)); // 10
console.log("Questions:", countQuestions(response)); // 1
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-XX  
**Status**: Ready for Testing
