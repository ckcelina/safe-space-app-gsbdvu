
# Therapist Personality Consistency - Quick Reference

## 🎯 Goal

Ensure each therapist maintains a **consistent and recognizable personality** across all conversations.

## 📊 Key Metrics

### Sentence Length
- **Concise** (Noah): 70-140 words
- **Medium** (Dr. Elias, Maya, Jordan, Aisha, Ken): 120-280 words
- **Reflective** (Claire, Ruth): 200-380 words

### Question Frequency
- **Low** (Dr. Elias, Ruth, Jordan): 0-1 questions per response
- **Medium** (Noah, Maya, Ken): 1-2 questions per response
- **High** (Claire, Aisha): 2-3 questions per response

### Emotional Depth
- **High Empathy** (Dr. Elias, Maya, Ruth, Jordan): Lead with validation
- **Medium Empathy** (Noah, Claire, Aisha, Ken): Balance empathy with guidance
- **High Directness** (Noah, Ken): Get to the point quickly
- **Low Directness** (Maya, Aisha): Use gentle, indirect language

## 🔧 Implementation

### 1. Persona Selection
**Location**: Settings → AI Preferences → Therapist Persona

**Database**: `user_preferences.therapist_persona_id`

### 2. Consistency Enforcement
**Location**: `supabase/functions/generate-ai-response/index.ts`

**Function**: `buildPersonaConsistencyGuidance(personaStyle)`

**Priority**: Highest (overrides all other guidance except safety)

### 3. Token Limits
**Calculation**:
```typescript
maxTokens = Math.ceil((personaStyle.max_words / 0.75) * 1.2);
maxTokens = Math.min(Math.max(maxTokens, 150), 600);
```

**Examples**:
- Noah (70-140 words) → ~120-220 tokens
- Ruth (220-380 words) → ~350-600 tokens

## 🧪 Testing Checklist

- [ ] **Sentence length** remains consistent across 5+ conversations
- [ ] **Question frequency** matches persona's question_rate
- [ ] **Emotional depth** (empathy + directness) stays stable
- [ ] **Characteristic phrases** appear naturally in responses
- [ ] **No blending** with other therapist styles
- [ ] **Users can identify** therapist by style alone

## 🚨 Common Issues

### Issue: Responses too long/short
**Fix**: Check token limits in Edge Function

### Issue: Personality drift
**Fix**: Strengthen consistency guidance

### Issue: No characteristic phrases
**Fix**: Add phrases to persona metadata

### Issue: Blending styles
**Fix**: Ensure consistency guidance is highest priority

## 📝 Therapist Signatures

| Therapist | Opening Phrase | Closing Phrase |
|-----------|---------------|----------------|
| Dr. Elias | "Let's take a breath for a moment." | "We can take this one step at a time." |
| Noah | "Okay. Here's the clean version:" | (none) |
| Maya | "That sounds really heavy to carry." | "I'm here with you in this." |
| Claire | "Something in what you said feels important." | (none) |
| Ruth | "Oh love, of course you feel this way." | "Be gentle with yourself today." |
| Jordan | "I'm proud of you for saying that out loud." | "You've got this—small steps count." |
| Aisha | "Can I get curious with you for a second?" | (none) |
| Ken | "Let's break this down logically:" | (none) |

## 🎭 Persona Comparison

### Concise vs. Reflective
- **Noah** (concise): 70-140 words, rapid pacing, bullets
- **Ruth** (reflective): 220-380 words, slow pacing, paragraphs

### Empathetic vs. Direct
- **Maya** (empathetic): High empathy, low directness, gentle language
- **Noah** (direct): Medium empathy, high directness, clear language

### Question-Heavy vs. Statement-Heavy
- **Claire** (questions): High question rate, encourages self-discovery
- **Ruth** (statements): Low question rate, offers reassurance

## 🔍 Monitoring

### What to Watch
1. **Response length** - Should match persona's word count range
2. **Question count** - Should match persona's question_rate
3. **Emotional tone** - Should match persona's empathy_level + directness
4. **Language patterns** - Should include characteristic phrases

### Red Flags
- ⚠️ Sudden changes in response length
- ⚠️ Sudden changes in question frequency
- ⚠️ Sudden changes in emotional tone
- ⚠️ Missing characteristic phrases
- ⚠️ Blending with other therapist styles

## 📚 Key Files

1. **Edge Function**: `supabase/functions/generate-ai-response/index.ts`
2. **Persona Definitions**: `constants/TherapistPersonas.ts`
3. **Database Schema**: `user_preferences.therapist_persona_id`
4. **Full Documentation**: `THERAPIST_PERSONALITY_CONSISTENCY_IMPLEMENTATION.md`

## ✅ Acceptance Criteria

After 10 conversations, users should:
- ✓ Identify therapist by communication style alone
- ✓ Predict sentence length and question frequency
- ✓ Feel consistent emotional presence
- ✓ Trust that therapist won't "change personality"
- ✓ Bond with stable, recognizable presence

---

**Status**: ✅ Implemented  
**Version**: 1.0.0  
**Last Updated**: 2025-01-XX
