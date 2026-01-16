
# Venting Detection - Quick Reference

## What It Does

Detects when users are **venting** (expressing emotions) vs. **seeking advice**, and adapts AI responses accordingly.

## Key Behavior

### When Venting Detected:
- ✅ Brief, validating responses (20-80 words)
- ✅ Acknowledgment, not solutions
- ✅ No "you should" language
- ✅ Optional: ONE gentle follow-up question
- ✅ Respects emotional pauses

### When Advice-Seeking Detected:
- ✅ Normal-length responses
- ✅ Solutions and suggestions provided
- ✅ Questions answered directly
- ✅ Practical guidance offered

## Detection Logic

### Venting Indicators:
```
"I'm so tired of..."
"I can't stand..."
"I just need to vent..."
"I'm overwhelmed..."
"I can't handle..."
+ No explicit advice requests
+ High emotional intensity
```

### Advice-Seeking Indicators:
```
"What should I do?"
"How can I handle this?"
"Any advice?"
"What do you think?"
"Should I...?"
```

## Response Examples

### Venting (High Intensity)
**Input:** "I can't handle this anymore. I'm breaking down."

**Response:** "I hear you. That's overwhelming. You're not alone in this."

### Venting (Medium Intensity)
**Input:** "I'm so frustrated with my partner. They never listen."

**Response:** "That sounds really frustrating. Being unheard is exhausting. What's the hardest part for you right now?"

### Advice-Seeking
**Input:** "I'm anxious about my boss. What should I do?"

**Response:** "That's tough. Before deciding, consider: What's your relationship with your boss like? Have you tried addressing concerns before? If there's a pattern or you feel unsafe, HR might be better. If it's one-time and you communicate well, a direct conversation could work. What feels safer?"

## Code Location

**File:** `supabase/functions/generate-ai-response/index.ts`

**Key Functions:**
- `analyzeVentingVsAdviceSeeking()` - Detects venting vs. advice
- `buildVentingResponseGuidance()` - Builds AI prompt for venting
- `buildSystemPrompt()` - Integrates venting guidance

## Testing

### Quick Test Commands

```typescript
// Test venting detection
const analysis = analyzeVentingVsAdviceSeeking("I'm so overwhelmed");
console.log(analysis);
// Expected: { isVenting: true, emotionalIntensity: 'high', ... }

// Test advice detection
const analysis2 = analyzeVentingVsAdviceSeeking("What should I do?");
console.log(analysis2);
// Expected: { isAskingForAdvice: true, isVenting: false, ... }
```

### Manual Testing

1. Send venting message → Expect brief validation
2. Send advice request → Expect normal guidance
3. Send rhetorical questions → Expect venting response
4. Send high-intensity emotion → Expect very brief response

## Monitoring

Check Edge Function logs:
```
[Edge][Chat][<id>] Venting analysis: {
  isVenting: true,
  emotionalIntensity: 'high',
  needsSpace: true,
  reasoning: '...'
}
```

## Troubleshooting

### Issue: AI still giving advice when venting
**Fix:** Check if venting indicators are being detected. Add more keywords if needed.

### Issue: Responses too long when venting
**Fix:** Verify `maxTokens` is being set correctly (80-150 for venting).

### Issue: False positives (advice detected as venting)
**Fix:** Check for explicit advice keywords. Adjust detection logic if needed.

## Key Metrics

- **Venting Detection Rate**: % of messages detected as venting
- **Response Length**: Average word count for venting vs. advice
- **User Satisfaction**: Qualitative feedback on feeling heard

## Acceptance Criteria

✅ User feels heard, not guided when venting
✅ No "you should" language when venting
✅ Brief responses (20-80 words) when venting
✅ Normal responses when advice-seeking
✅ Emotional intensity properly detected

## Deployment

```bash
# Deploy Edge Function
supabase functions deploy generate-ai-response

# No database changes needed
# No client changes needed
```

## Rollback

```bash
# Redeploy previous version
supabase functions deploy generate-ai-response --version <previous-version>
```

## Related Documentation

- `VENTING_DETECTION_IMPLEMENTATION.md` - Full implementation details
- `ADAPTIVE_RESPONSE_LENGTH_IMPLEMENTATION.md` - Response length adaptation
- `EMOTIONAL_CONTINUITY_IMPLEMENTATION.md` - Emotional theme tracking

## Summary

Venting detection ensures the AI responds with **acknowledgment** when users are expressing emotions, and **advice** when users are seeking solutions. This creates a more emotionally intelligent, supportive experience that respects the user's need for space and validation.
