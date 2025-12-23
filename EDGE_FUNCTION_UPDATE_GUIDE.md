
# Edge Function Update Guide for AI Preferences

## Overview
The Safe Space app now supports AI Style Preferences. Users can choose an AI tone and enable Science & Resources mode.

## Required Edge Function Changes

Your Supabase Edge Function `generate-ai-response` needs to be updated to accept and use the new AI preference parameters.

### 1. Update Function Input Interface

Add these fields to your request body interface:

```typescript
interface GenerateAIResponseRequest {
  personId: string;
  personName: string;
  personRelationshipType?: string;
  messages: Array<{ role: string; content: string; createdAt?: string }>;
  currentSubject?: string;
  // NEW FIELDS:
  aiToneId?: string;
  aiScienceMode?: boolean;
}
```

### 2. Update Prompt Generation Call

When calling `generateAISystemPrompt`, pass the new parameters:

```typescript
import { generateAISystemPrompt, detectDeathMention } from './aiPrompt.ts';

const systemPrompt = generateAISystemPrompt({
  personName: req.personName,
  relationshipType: req.personRelationshipType,
  currentSubject: req.currentSubject,
  conversationContext: {
    hasDeathMention: detectDeathMention(req.messages),
  },
  // NEW PARAMETERS:
  aiToneId: req.aiToneId || 'balanced_blend',
  aiScienceMode: req.aiScienceMode || false,
});
```

### 3. Deploy Updated Edge Function

Copy the updated `prompts/aiPrompt.ts` file to your Edge Function directory and redeploy:

```bash
supabase functions deploy generate-ai-response
```

## Testing

After deployment, test by:

1. Going to Settings → AI Style Preferences
2. Changing the tone (e.g., to "Warm Hug" or "Straight Shooter")
3. Toggling Science & Resources mode ON
4. Starting a new conversation
5. Verifying the AI responds with the selected tone and includes science references when enabled

## Tone IDs Reference

Valid tone IDs:
- `warm_hug`, `therapy_room`, `best_friend`, `nurturing_parent`, `soft_truth`
- `clear_coach`, `tough_love`, `straight_shooter`, `executive_summary`, `no_nonsense`
- `reality_check`, `pattern_breaker`, `accountability_partner`, `boundary_enforcer`
- `balanced_blend` (default), `mirror_mode`, `calm_direct`
- `detective`, `systems_thinker`, `attachment_aware`, `cognitive_clarity`, `conflict_mediator`

## Rollback

If you need to rollback, the Edge Function will still work with the old interface. The new parameters are optional and default to:
- `aiToneId`: `'balanced_blend'`
- `aiScienceMode`: `false`
