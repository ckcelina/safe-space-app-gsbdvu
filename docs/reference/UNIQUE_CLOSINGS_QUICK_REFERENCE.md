
# Unique Therapist Closings - Quick Reference

## Therapist Closing Styles

| Therapist | Closing | When to Use |
|-----------|---------|-------------|
| **Dr. Elias** | "We can take this one step at a time." | Soft reassurance, grounding |
| **Noah** | "That's the situation." | Grounded summary, practical |
| **Maya** | "I'm here with you in this." | Emotional presence, validation |
| **Claire** | "What does that bring up for you?" | Open thought, reflection |
| **Ruth** | "Be gentle with yourself today." | Nurturing care, wisdom |
| **Jordan** | "You've got this—small steps count." | Encouragement, confidence |
| **Aisha** | "What else are you noticing?" | Curiosity, exploration |
| **Ken** | "Does that framework help?" | Logical check-in, clarity |

## Rules

### ✅ DO Apply Closing When:
- Conversation naturally winding down
- User sends short acknowledgments ("ok", "thanks")
- User expresses closure ("that helps")
- Response feels complete
- No question at end of response

### ❌ DO NOT Apply Closing When:
- User asking questions
- User in high emotional distress
- User venting
- Conversation actively ongoing
- Response ends with question
- Conversation too short (<4 messages)

## Code Location

**Persona Definitions:**
- `constants/TherapistPersonas.ts` - Client-side definitions
- `supabase/functions/generate-ai-response/index.ts` - Server-side definitions

**Closing Logic:**
- `applyPersonaClosing()` - Main function that applies closings
- `analyzeConversationSlowdown()` - Detects when to apply closings
- `buildPersonaConsistencyGuidance()` - Instructs AI about closing style

## Testing

```typescript
// Test that each persona has a closing style
import { THERAPIST_PERSONAS } from '@/constants/TherapistPersonas';

THERAPIST_PERSONAS.forEach(persona => {
  console.log(`${persona.name}: ${persona.closing_style || 'No closing'}`);
});
```

## Deployment

```bash
# Deploy updated Edge Function
supabase functions deploy generate-ai-response
```

## Monitoring

Watch for:
- Closings appearing too often/rarely
- Closings during inappropriate moments
- User feedback on closing styles
- Persona recognition by closing style

## Quick Fixes

**Closings too frequent?**
→ Adjust `analyzeConversationSlowdown()` thresholds

**Closings not appearing?**
→ Check persona has `closing_style` defined
→ Verify conversation length (4+ messages)
→ Ensure not venting/distress scenario

**Wrong closing appearing?**
→ Verify user's selected therapist persona
→ Check Edge Function has latest definitions
