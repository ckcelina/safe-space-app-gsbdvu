
# Therapist Personality Consistency Implementation

## Overview

This implementation ensures each AI therapist maintains a **consistent and recognizable personality** across all conversations. Users subconsciously bond with consistency, and personality drift destroys emotional trust.

## Goal

Ensure each therapist maintains stable traits:
- **Sentence length** (concise vs. reflective)
- **Question frequency** (low, medium, high)
- **Emotional depth** (empathy level, directness)
- **Pacing & rhythm** (rapid, steady, slow)
- **Structure & format** (bullets, paragraphs, mixed)
- **Language quirks** (opening/closing styles, metaphor use)

## Implementation Strategy

### 1. Persona Consistency Enforcement (NEW)

**Location**: `supabase/functions/generate-ai-response/index.ts`

**Function**: `buildPersonaConsistencyGuidance(personaStyle: TherapistPersonaStyle)`

This function creates a **CRITICAL** system prompt section that:

- **Explicitly states the therapist's identity** (e.g., "YOU ARE: DR. ELIAS")
- **Lists all stable personality traits** with specific values
- **Provides strict rules** to prevent personality drift
- **Emphasizes consistency** as the highest priority

**Key Features**:
- ⚠️ **Highest priority** - overrides all other guidance except safety
- 📏 **Stable traits** - sentence length, question frequency, emotional depth
- 🚫 **Drift prevention** - explicit rules against blending styles
- 💪 **Acceptance criteria** - users should recognize therapist by style alone

### 2. Persona-Specific Token Limits

**Location**: `supabase/functions/generate-ai-response/index.ts` (serve function)

**Logic**:
```typescript
// Get persona style for baseline token calculation
const personaStyle = preferences?.therapist_persona_id 
  ? getPersonaStyleMetadata(preferences.therapist_persona_id)
  : null;

// Calculate max_tokens based on persona's max_words
if (personaStyle?.max_words) {
  maxTokens = Math.ceil((personaStyle.max_words / 0.75) * 1.2);
  maxTokens = Math.min(Math.max(maxTokens, 150), 600);
}
```

**Ensures**:
- Concise therapists (Noah) stay concise (70-140 words → ~120-220 tokens)
- Reflective therapists (Ruth) stay reflective (220-380 words → ~350-600 tokens)
- Token limits enforce word count consistency

### 3. Persona Style Metadata

**Location**: `constants/TherapistPersonas.ts` and `supabase/functions/generate-ai-response/index.ts`

**Structure**:
```typescript
interface TherapistPersonaStyle {
  name: string;
  system_prompt: string;
  min_words?: number;          // Minimum response length
  max_words?: number;          // Maximum response length
  verbosity?: 'short' | 'medium' | 'long';
  pacing?: 'rapid' | 'steady' | 'slow';
  structure?: 'bullets' | 'paragraphs' | 'mixed';
  question_rate?: 'low' | 'medium' | 'high';
  empathy_level?: 'low' | 'medium' | 'high';
  directness?: 'low' | 'medium' | 'high';
  metaphor_use?: 'none' | 'light' | 'often';
  signoff_style?: 'none' | 'gentle' | 'encouraging';
  opening_style?: string;      // Characteristic opening phrase
  closing_style?: string | null; // Characteristic closing phrase
}
```

**Each therapist has**:
- Unique word count ranges
- Distinct communication patterns
- Characteristic language quirks

### 4. System Prompt Integration

**Location**: `supabase/functions/generate-ai-response/index.ts` (buildSystemPrompt function)

**Flow**:
1. Fetch user's selected `therapist_persona_id` from `user_preferences`
2. Get persona system prompt and style metadata
3. Add persona system prompt to base prompt
4. **Add persona consistency enforcement** (NEW - highest priority)
5. Add other guidance (venting, response length, emotional presence)

**Priority Order**:
1. **Persona consistency** (highest priority)
2. Venting detection (overrides response length)
3. Adaptive response length (adapts to user input)
4. Emotional presence (always applies)
5. Other context (continuity, memories, etc.)

## Therapist Personas

### Dr. Elias (Calm & Grounding)
- **Verbosity**: Medium (120-220 words)
- **Pacing**: Slow
- **Question rate**: Low
- **Empathy**: High
- **Directness**: Medium
- **Style**: Paragraphs, gentle closing
- **Quirk**: "Let's take a breath for a moment."

### Noah (Direct & Practical)
- **Verbosity**: Short (70-140 words)
- **Pacing**: Rapid
- **Question rate**: Medium
- **Empathy**: Medium
- **Directness**: High
- **Style**: Bullets, no closing
- **Quirk**: "Okay. Here's the clean version:"

### Maya (Gentle & Validating)
- **Verbosity**: Medium (140-240 words)
- **Pacing**: Steady
- **Question rate**: Medium
- **Empathy**: High
- **Directness**: Low
- **Style**: Mixed, gentle closing
- **Quirk**: "That sounds really heavy to carry."

### Claire (Reflective & Insightful)
- **Verbosity**: Long (200-340 words)
- **Pacing**: Slow
- **Question rate**: High
- **Empathy**: Medium
- **Directness**: Medium
- **Style**: Paragraphs, no closing
- **Quirk**: "Something in what you said feels important."

### Ruth (Nurturing & Wise)
- **Verbosity**: Long (220-380 words)
- **Pacing**: Slow
- **Question rate**: Low
- **Empathy**: High
- **Directness**: Medium
- **Style**: Paragraphs, encouraging closing
- **Quirk**: "Oh love, of course you feel this way."

### Jordan (Encouraging & Uplifting)
- **Verbosity**: Medium (140-260 words)
- **Pacing**: Rapid
- **Question rate**: Low
- **Empathy**: High
- **Directness**: Medium
- **Style**: Mixed, encouraging closing
- **Quirk**: "I'm proud of you for saying that out loud."

### Aisha (Curious & Exploratory)
- **Verbosity**: Medium (160-280 words)
- **Pacing**: Steady
- **Question rate**: High
- **Empathy**: Medium
- **Directness**: Low
- **Style**: Bullets, no closing
- **Quirk**: "Can I get curious with you for a second?"

### Ken (Balanced & Analytical)
- **Verbosity**: Medium (160-280 words)
- **Pacing**: Steady
- **Question rate**: Medium
- **Empathy**: Medium
- **Directness**: High
- **Style**: Bullets, no closing
- **Quirk**: "Let's break this down logically:"

## How It Works

### 1. User Selects Therapist

User selects a therapist persona in Settings → AI Preferences.

**Database**: `user_preferences.therapist_persona_id`

### 2. Edge Function Loads Persona

When generating a response, the Edge Function:
1. Fetches `therapist_persona_id` from `user_preferences`
2. Loads persona style metadata from `THERAPIST_PERSONAS`
3. Builds system prompt with persona consistency enforcement

### 3. Consistency Enforcement Applied

The system prompt includes:
- **Persona identity**: "YOU ARE: DR. ELIAS"
- **Stable traits**: Sentence length, question frequency, emotional depth
- **Drift prevention rules**: Never blend styles, never deviate
- **Acceptance criteria**: Users should recognize you by style alone

### 4. Token Limits Enforce Length

OpenAI's `max_tokens` parameter is calculated based on:
- Persona's `max_words` (baseline)
- Venting analysis (overrides if venting)
- Response guidance (adapts to user input)

**Example**:
- Noah (concise): 70-140 words → ~120-220 tokens
- Ruth (reflective): 220-380 words → ~350-600 tokens

### 5. Response Generated

OpenAI generates a response that:
- Matches the therapist's personality traits
- Stays within the word count range
- Uses characteristic language patterns
- Maintains consistent emotional depth

## Acceptance Tests

### ✓ Therapists Feel Recognizable

After 10 conversations, users should be able to:
- Identify the therapist by communication style alone
- Predict sentence length and question frequency
- Feel the consistent emotional presence

### ✓ No Personality Drift

Therapists should:
- Never suddenly become more/less verbose
- Never suddenly ask more/fewer questions
- Never suddenly change empathy level or directness
- Never blend with other therapist styles

### ✓ Strong Emotional Trust

Users should:
- Bond with the therapist's consistent presence
- Trust that the therapist won't "change personality"
- Feel emotionally safe and understood

## Testing Guide

### 1. Test Sentence Length Consistency

**Test**: Have 5 conversations with the same therapist.

**Expected**:
- Concise therapists (Noah) always give short responses (70-140 words)
- Reflective therapists (Ruth) always give long responses (220-380 words)
- No sudden changes in response length

### 2. Test Question Frequency Consistency

**Test**: Count questions in 10 responses from the same therapist.

**Expected**:
- Low question rate (Dr. Elias, Ruth, Jordan): 0-1 questions per response
- Medium question rate (Noah, Maya, Ken): 1-2 questions per response
- High question rate (Claire, Aisha): 2-3 questions per response

### 3. Test Emotional Depth Consistency

**Test**: Share emotional content with the same therapist.

**Expected**:
- High empathy therapists (Dr. Elias, Maya, Ruth, Jordan) lead with validation
- Medium empathy therapists (Noah, Claire, Aisha, Ken) balance empathy with guidance
- Directness remains consistent (Noah is always direct, Maya is always gentle)

### 4. Test Language Quirks

**Test**: Look for characteristic phrases in responses.

**Expected**:
- Dr. Elias: "Let's take a breath for a moment."
- Noah: "Okay. Here's the clean version:"
- Maya: "That sounds really heavy to carry."
- Claire: "Something in what you said feels important."
- Ruth: "Oh love, of course you feel this way."
- Jordan: "I'm proud of you for saying that out loud."
- Aisha: "Can I get curious with you for a second?"
- Ken: "Let's break this down logically:"

### 5. Test No Blending

**Test**: Switch between therapists and compare responses.

**Expected**:
- Each therapist maintains distinct style
- No blending of personalities
- Clear differences in sentence length, question frequency, and emotional depth

## Troubleshooting

### Issue: Therapist responses are too long/short

**Cause**: Token limits not properly calculated.

**Fix**: Check `max_tokens` calculation in Edge Function:
```typescript
if (personaStyle?.max_words) {
  maxTokens = Math.ceil((personaStyle.max_words / 0.75) * 1.2);
  maxTokens = Math.min(Math.max(maxTokens, 150), 600);
}
```

### Issue: Therapist personality drifts over time

**Cause**: Persona consistency guidance not strong enough.

**Fix**: Strengthen `buildPersonaConsistencyGuidance()` with more explicit rules.

### Issue: Therapist doesn't use characteristic phrases

**Cause**: `opening_style` or `closing_style` not defined or not enforced.

**Fix**: Add characteristic phrases to persona metadata and emphasize in consistency guidance.

### Issue: Therapist blends with other styles

**Cause**: System prompt priority order incorrect.

**Fix**: Ensure persona consistency guidance is added FIRST in system prompt, before other guidance.

## Key Files

### 1. Edge Function
**File**: `supabase/functions/generate-ai-response/index.ts`

**Key Functions**:
- `buildPersonaConsistencyGuidance()` - Enforces personality consistency
- `getPersonaStyleMetadata()` - Retrieves persona style metadata
- `buildSystemPrompt()` - Assembles complete system prompt

### 2. Persona Definitions
**File**: `constants/TherapistPersonas.ts`

**Contains**:
- `TherapistPersona` interface
- `THERAPIST_PERSONAS` array with all persona metadata
- Helper functions (`getPersonaById`, `getPersonaSystemPrompt`)

### 3. Database Schema
**Table**: `user_preferences`

**Column**: `therapist_persona_id` (text, nullable)

**Purpose**: Stores user's selected therapist persona

## Summary

This implementation ensures **consistent therapist personalities** by:

1. **Defining stable personality traits** for each therapist (sentence length, question frequency, emotional depth)
2. **Enforcing consistency** through explicit system prompt guidance
3. **Preventing personality drift** with strict rules against blending styles
4. **Using token limits** to enforce word count ranges
5. **Maintaining characteristic language patterns** (opening/closing phrases, metaphor use)

**Result**: Users bond with recognizable, consistent therapist personalities that build emotional trust over time.

## Next Steps

1. ✅ **Deploy Edge Function** with persona consistency enforcement
2. ✅ **Test each therapist** for consistency across multiple conversations
3. ✅ **Monitor user feedback** for personality recognition
4. ✅ **Adjust token limits** if responses are too long/short
5. ✅ **Strengthen guidance** if personality drift occurs

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-XX  
**Status**: ✅ Implemented and Ready for Testing
