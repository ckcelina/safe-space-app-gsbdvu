
# Adaptive Response Length - Quick Reference

## 🎯 Goal
Prevent therapists from overwhelming users with excessive text or emotional intensity.

## 📏 Response Length Rules

| User Input | Target Words | Max Questions | Reasoning |
|------------|--------------|---------------|-----------|
| 1-5 words | 30 | 1 | Very short input → very short response |
| 6-15 words | 50 | 1 | Short input → short response |
| 16-40 words | 100 | 1 | Medium input → balanced response |
| 40+ words | 120 | 1 | Long input → thoughtful response |
| High emotion | 60 | 1 | Slow down, don't expand |
| Depth request | 150 | 1 | User explicitly asks for detail |
| Multiple questions | 100 | 3 | Clarification needed |

## 🎭 Emotional Intensity Detection

### High Emotion Keywords
overwhelmed, can't handle, breaking down, falling apart, too much, drowning, suffocating, panic, terrified, devastated, destroyed, shattered, hopeless, desperate

**Response:** 60 words, slow pacing, max 1 question

### Medium Emotion Keywords
anxious, worried, scared, sad, hurt, angry, frustrated, confused, lost, stuck, exhausted, stressed, upset, disappointed, lonely

**Response:** 80 words, steady pacing, max 1 question

## ⚡ Pacing Styles

### Slow (High Emotion)
- Shorter, calmer sentences
- Pauses between thoughts
- Prioritize grounding over information
- Example: "That sounds really hard. [pause] Let's take this one step at a time."

### Steady (Normal)
- Balanced, natural pace
- Mix of sentence lengths
- Neither rushed nor slow

### Rapid (Direct/Practical)
- Direct and efficient
- Get to the point quickly
- Clear, concise language

## 🛡️ Safeguards (Always Apply)

✓ Avoid stacked validations (no "That makes sense" repeated)
✓ Avoid multi-paragraph responses unless user asks for depth
✓ Keep responses calm, not verbose
✓ User should never feel talked at
✓ Maintain distinct therapist style while respecting constraints

## 🔧 Implementation

### Key Functions

```typescript
// Analyze user input
analyzeUserInputForResponseGuidance(userMessage: string): ResponseLengthGuidance

// Build AI instructions
buildResponseGuidanceInstructions(guidance: ResponseLengthGuidance): string

// Calculate token limit
maxTokens = Math.ceil((targetWords / 0.75) * 1.3)
maxTokens = Math.min(Math.max(maxTokens, 100), 400)
```

### Token Limits

| Target Words | Max Tokens |
|--------------|------------|
| 30 | 100 (min cap) |
| 60 | ~104 |
| 100 | ~173 |
| 150 | ~260 |

## 📊 Examples

### Short Input
```
User: "I'm tired"
AI: "I hear you. What's making you feel tired right now?"
```

### High Emotion
```
User: "I'm completely overwhelmed and can't handle this anymore"
AI: "That sounds really heavy to carry.

Let's take a breath for a moment.

What do you need most right now?"
```

### Depth Request
```
User: "Can you explain why I keep doing this?"
AI: [~150 word detailed explanation with 1 question]
```

## 🧪 Testing Checklist

- [ ] Short input (1-5 words) → ~30 word response
- [ ] Emotional input → ~60 words, slow pacing
- [ ] Depth request → ~150 words allowed
- [ ] Multiple questions → 2-3 questions allowed
- [ ] Therapist styles remain distinct
- [ ] No stacked validations
- [ ] Max 1 question per response (unless clarification)

## 🚀 Deployment

```bash
# Deploy Edge Function
supabase functions deploy generate-ai-response

# Check logs
supabase functions logs generate-ai-response
```

## 📝 Logging

```
[Edge][Chat][uuid] Response guidance: {
  targetWords: 60,
  maxQuestions: 1,
  pacing: 'slow',
  emotionalIntensity: 'high',
  reasoning: 'High emotional intensity detected'
}

[Edge][Chat][uuid] Adaptive max_tokens: 104 (target: 60 words)
```

## ⚠️ Important Notes

- Response guidance **overrides** default persona word counts
- Therapist personality **remains intact** within constraints
- System adapts to user input **dynamically**
- No global shortening - adapts per message
- Reflective depth **preserved** when appropriate

## 🎯 Acceptance Criteria

✅ Responses feel calm, not verbose
✅ User never feels talked at
✅ Therapist styles remain distinct
✅ Emotional pacing works correctly
✅ Depth requests honored
