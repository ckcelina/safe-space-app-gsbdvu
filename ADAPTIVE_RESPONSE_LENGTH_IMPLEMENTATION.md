
# Adaptive Response Length & Emotional Pacing Implementation

## Overview

This implementation ensures therapists never overwhelm users with excessive text or emotional intensity by dynamically adapting response length and pacing based on user input.

## Key Principles

### What This Does
✅ Adapts response length to match user input length
✅ Slows down and shortens responses when user is emotional
✅ Prevents multi-paragraph responses unless user asks for depth
✅ Limits to max 1 question per response (unless clarification needed)
✅ Avoids stacked validations and repetitive phrases
✅ Maintains therapist personality while respecting constraints

### What This Does NOT Do
❌ Does NOT shorten all responses globally
❌ Does NOT remove reflective depth
❌ Does NOT change therapist personas
❌ Does NOT affect memory or continuity logic

## Implementation Details

### 1. User Input Analysis

The system analyzes each user message for:

#### A. Word Count
- Very short (1-5 words) → 30-word response
- Short (6-15 words) → 50-word response
- Medium (16-40 words) → 100-word response
- Long (40+ words) → 120-word response

#### B. Emotional Intensity
**High Emotion Keywords:**
- overwhelmed, can't handle, breaking down, falling apart
- too much, drowning, suffocating, panic, terrified
- devastated, destroyed, shattered, hopeless, desperate

**Medium Emotion Keywords:**
- anxious, worried, scared, sad, hurt, angry
- frustrated, confused, lost, stuck, exhausted
- stressed, upset, disappointed, lonely

**Response Adjustments:**
- High emotion → 60 words, slow pacing, max 1 question
- Medium emotion → 80 words, steady pacing, max 1 question
- Low emotion → Standard length based on input

#### C. Depth Requests
User explicitly asks for depth with phrases like:
- "explain"
- "tell me more"
- "help me understand"
- "why"
- "how does"

Response: Allow up to 150 words for detailed explanation

#### D. Multiple Questions
User asks 2+ questions → Allow 2-3 clarifying questions in response

### 2. Response Guidance System

#### ResponseLengthGuidance Interface
```typescript
interface ResponseLengthGuidance {
  targetWords: number;        // Target word count for response
  maxQuestions: number;        // Maximum questions allowed
  pacing: 'slow' | 'steady' | 'rapid';  // Response pacing
  emotionalIntensity: 'low' | 'medium' | 'high';  // Detected intensity
  reasoning: string;           // Explanation for logging
}
```

#### Decision Logic Examples

**Example 1: Very Short Input**
```
User: "I'm tired"
Guidance: {
  targetWords: 30,
  maxQuestions: 1,
  pacing: 'steady',
  emotionalIntensity: 'low',
  reasoning: 'User input is very short - matching with brief response'
}
```

**Example 2: High Emotional Intensity**
```
User: "I'm completely overwhelmed and I can't handle this anymore"
Guidance: {
  targetWords: 60,
  maxQuestions: 1,
  pacing: 'slow',
  emotionalIntensity: 'high',
  reasoning: 'High emotional intensity detected - slowing down and staying brief'
}
```

**Example 3: Asking for Depth**
```
User: "Can you explain why I keep doing this?"
Guidance: {
  targetWords: 150,
  maxQuestions: 1,
  pacing: 'steady',
  emotionalIntensity: 'low',
  reasoning: 'User explicitly asking for depth - providing detailed response'
}
```

### 3. AI Prompt Integration

The response guidance is injected into the AI system prompt with clear instructions:

```
⚖️ RESPONSE LENGTH & PACING GUIDANCE (CRITICAL - FOLLOW STRICTLY)

ANALYSIS: [reasoning]

RESPONSE REQUIREMENTS:
- Target length: ~[targetWords] words (±20%)
- Maximum questions: [maxQuestions]
- Pacing: [pacing]
- Emotional intensity: [emotionalIntensity]

[Pacing-specific instructions]
[Emotional intensity instructions]
[Question limit instructions]
[Safeguards]

⚠️ THESE INSTRUCTIONS OVERRIDE DEFAULT PERSONA WORD COUNTS
Your persona style remains intact, but response length MUST adapt to user input.
```

### 4. Token Limit Calculation

The system dynamically calculates OpenAI's `max_tokens` parameter:

```typescript
// Convert target words to tokens
// 1 token ≈ 0.75 words
// Add 30% buffer for natural variation
maxTokens = Math.ceil((targetWords / 0.75) * 1.3);

// Cap at reasonable limits
maxTokens = Math.min(Math.max(maxTokens, 100), 400);
```

**Examples:**
- 30 words → ~52 tokens (capped at 100)
- 60 words → ~104 tokens
- 100 words → ~173 tokens
- 150 words → ~260 tokens

### 5. Pacing Instructions

#### Slow Pacing (High Emotion)
```
- Use shorter, calmer sentences
- Pause between thoughts with line breaks
- Prioritize emotional grounding over information
- Speak slowly and gently
- Example: "That sounds really hard. [pause] Let's take this one step at a time."
```

#### Steady Pacing (Normal)
```
- Maintain a balanced, natural pace
- Mix shorter and longer sentences
- Be neither rushed nor overly slow
```

#### Rapid Pacing (Direct/Practical)
```
- Be direct and efficient
- Get to the point quickly
- Use clear, concise language
- Avoid unnecessary elaboration
```

### 6. Safeguards

The system enforces these safeguards in every response:

✓ **Avoid stacked validations** - No "That makes sense" repeated
✓ **Avoid multi-paragraph responses** - Unless user explicitly asks for depth
✓ **Keep responses calm, not verbose** - Never overwhelming
✓ **User should never feel talked at** - Conversational, not lecturing
✓ **Maintain distinct therapist style** - Personality intact within constraints

## Code Changes

### New Functions

#### `analyzeUserInputForResponseGuidance(userMessage: string): ResponseLengthGuidance`
- Analyzes user message for length, emotion, depth requests
- Returns guidance object with target length and pacing
- Located in: `supabase/functions/generate-ai-response/index.ts`

#### `buildResponseGuidanceInstructions(guidance: ResponseLengthGuidance): string`
- Builds AI prompt section with response guidance
- Includes pacing, emotional intensity, and question limit instructions
- Located in: `supabase/functions/generate-ai-response/index.ts`

### Modified Functions

#### `buildSystemPrompt(...)`
- Now accepts `responseGuidance` parameter
- Calls `buildResponseGuidanceInstructions()` to add guidance
- Inserts guidance section before emotional continuity

#### Main Handler
- Analyzes user input before building system prompt
- Logs guidance for debugging
- Passes guidance to `buildSystemPrompt()`
- Adjusts `max_tokens` based on guidance (overrides persona defaults)

## Examples

### Example 1: Short Input → Short Response

**User Input:**
```
"I'm sad"
```

**Analysis:**
- Word count: 2 (very short)
- Emotional intensity: medium (keyword: "sad")
- Target: 30 words, 1 question, steady pacing

**Expected Response:**
```
I hear you. What's making you feel sad right now?
```

### Example 2: Emotional Input → Slow, Brief Response

**User Input:**
```
"I'm completely overwhelmed. Everything is falling apart and I can't handle it anymore. I don't know what to do."
```

**Analysis:**
- Word count: 20 (medium)
- Emotional intensity: high (keywords: "overwhelmed", "falling apart", "can't handle")
- Target: 60 words, 1 question, slow pacing

**Expected Response:**
```
That sounds really heavy to carry.

Let's take a breath for a moment.

What do you need most right now?
```

### Example 3: Asking for Depth → Detailed Response

**User Input:**
```
"Can you explain why I keep falling into the same patterns with my partner? I want to understand what's happening."
```

**Analysis:**
- Word count: 21 (medium)
- Emotional intensity: low
- Depth request: yes (keywords: "explain", "understand")
- Target: 150 words, 1 question, steady pacing

**Expected Response:**
```
It sounds like you're noticing a cycle, which is actually a really important first step.

Relationship patterns often form because they served a purpose at some point—maybe they helped you feel safe, avoid conflict, or get a need met. Over time, these patterns become automatic, even when they're no longer helpful.

For example, if you tend to withdraw when things get tense, it might be because you learned early on that conflict feels unsafe. Your partner might respond by pursuing you more, which makes you withdraw further—and the cycle continues.

The good news is that awareness is the first step to change. Once you can see the pattern clearly, you can start to interrupt it.

What do you notice happens right before the pattern starts?
```

### Example 4: Multiple Questions → Clarification Allowed

**User Input:**
```
"Should I talk to him? What should I say? Is it too soon?"
```

**Analysis:**
- Word count: 12 (short)
- Emotional intensity: low
- Question count: 3
- Target: 100 words, 3 questions allowed, steady pacing

**Expected Response:**
```
Those are all great questions. Let me help you think through this:

1. Timing: What's making you wonder if it's too soon?
2. Content: What's the main thing you want him to understand?
3. Readiness: How do you feel when you imagine having this conversation?

Once we clarify these, we can figure out the best approach together.
```

## Testing

### Manual Testing Checklist

1. **Short Input Test**
   - Send: "I'm tired"
   - Verify: Response is ~30 words, 1 question max
   - Verify: Response feels calm, not verbose

2. **Emotional Input Test**
   - Send: "I'm completely overwhelmed and can't handle this"
   - Verify: Response is ~60 words, 1 question max
   - Verify: Response uses slow pacing (shorter sentences, pauses)
   - Verify: Response prioritizes grounding over advice

3. **Depth Request Test**
   - Send: "Can you explain why I keep doing this?"
   - Verify: Response is ~150 words
   - Verify: Response provides thoughtful explanation
   - Verify: Still maintains 1 question limit

4. **Multiple Questions Test**
   - Send: "Should I talk to him? What should I say? When?"
   - Verify: Response can ask 2-3 clarifying questions
   - Verify: Questions are focused and helpful

5. **Therapist Style Preservation Test**
   - Test with different therapist personas (Dr. Elias, Noah, Maya, etc.)
   - Verify: Each persona maintains distinct voice
   - Verify: Response length adapts while personality stays intact

### Automated Testing

```typescript
// Test cases for analyzeUserInputForResponseGuidance()

test('very short input', () => {
  const guidance = analyzeUserInputForResponseGuidance("I'm sad");
  expect(guidance.targetWords).toBe(30);
  expect(guidance.maxQuestions).toBe(1);
});

test('high emotional intensity', () => {
  const guidance = analyzeUserInputForResponseGuidance("I'm completely overwhelmed");
  expect(guidance.targetWords).toBe(60);
  expect(guidance.pacing).toBe('slow');
  expect(guidance.emotionalIntensity).toBe('high');
});

test('depth request', () => {
  const guidance = analyzeUserInputForResponseGuidance("Can you explain why this happens?");
  expect(guidance.targetWords).toBe(150);
});

test('multiple questions', () => {
  const guidance = analyzeUserInputForResponseGuidance("Should I? What should I say? When?");
  expect(guidance.maxQuestions).toBe(3);
});
```

## Acceptance Criteria

✅ **Responses feel calm, not verbose**
- Short input → short response
- Emotional input → brief, grounding response
- No unnecessary elaboration

✅ **User never feels talked at**
- Max 1 question per response (unless clarification needed)
- No stacked validations
- Conversational, not lecturing

✅ **Therapist styles remain distinct**
- Dr. Elias still feels calm and grounding
- Noah still feels direct and practical
- Maya still feels gentle and validating
- Response length adapts, but personality stays intact

✅ **Emotional pacing works correctly**
- High emotion → slow down, don't expand
- Medium emotion → balanced response
- Low emotion → standard pacing

✅ **Depth requests honored**
- User can explicitly ask for detailed explanations
- System allows longer responses when requested

## Deployment

### Edge Function Deployment

```bash
# Deploy updated Edge Function
supabase functions deploy generate-ai-response
```

### Verification

1. Check Edge Function logs for guidance analysis:
   ```
   [Edge][Chat][uuid] Response guidance: {
     targetWords: 60,
     maxQuestions: 1,
     pacing: 'slow',
     emotionalIntensity: 'high',
     reasoning: 'High emotional intensity detected - slowing down and staying brief'
   }
   ```

2. Check token limit adjustments:
   ```
   [Edge][Chat][uuid] Adaptive max_tokens: 104 (target: 60 words, reason: High emotional intensity detected)
   ```

### Rollback

If needed, revert to previous Edge Function version:
```bash
# List versions
supabase functions list --project-ref zjzvkxvahrbuuyzjzxol

# Deploy specific version
supabase functions deploy generate-ai-response --version <previous-version>
```

## Monitoring

### Key Metrics to Track

1. **Average Response Length by Input Length**
   - Short input → short response correlation
   - Emotional input → brief response correlation

2. **Question Count per Response**
   - Should average ~1 question per response
   - Spike to 2-3 only when user asks multiple questions

3. **User Satisfaction**
   - Monitor for feedback about response length
   - Track "too long" vs "too short" complaints

4. **Therapist Style Consistency**
   - Verify personas remain distinct
   - Check that personality isn't lost in brevity

### Debug Logging

The system logs guidance analysis for every request:
```typescript
console.log(`[Edge][Chat][${requestId}] Response guidance:`, responseGuidance);
console.log(`[Edge][Chat][${requestId}] Adaptive max_tokens: ${maxTokens} (target: ${responseGuidance.targetWords} words, reason: ${responseGuidance.reasoning})`);
```

## Future Enhancements

Potential improvements (not implemented):
- Track user preferences for response length over time
- Learn from user engagement patterns (do they respond more to short or long responses?)
- Add user setting to override adaptive length (always brief / always detailed)
- Detect when user is in crisis and automatically shorten responses
- A/B test different length thresholds

## Summary

This implementation ensures therapists never overwhelm users by:

1. **Analyzing user input** for length, emotion, and depth requests
2. **Adapting response length** dynamically (30-150 words)
3. **Adjusting pacing** based on emotional intensity (slow/steady/rapid)
4. **Limiting questions** to max 1 (unless clarification needed)
5. **Maintaining therapist personality** while respecting constraints
6. **Providing clear AI instructions** via system prompt
7. **Enforcing token limits** to prevent excessive responses

The result: Responses feel calm, not verbose. Users never feel talked at. Therapist styles remain distinct.
