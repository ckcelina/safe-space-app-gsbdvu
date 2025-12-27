
# AI Tone Consistency Implementation

## Overview
This implementation ensures that AI-generated responses consistently match the user's selected AI Style Preference by properly mapping each tone to detailed response style guidelines.

## Changes Made

### 1. Edge Function Update (`supabase/functions/generate-ai-response/index.ts`)

**Problem:** The `buildVoiceContract()` function was only adding a generic note about the tone instead of applying the detailed tone-specific instructions.

**Solution:** Replaced the `buildVoiceContract()` function with a comprehensive tone mapping system that includes detailed response style guidelines for each of the 23 AI tones.

#### Updated Function Structure:
```typescript
function buildVoiceContract(aiToneId: string): string {
  if (!aiToneId) return "";

  // Map tone IDs to detailed system instructions
  const toneInstructions: Record<string, string> = {
    // PRIMARY TONES (6 visible by default)
    warm_hug: `...detailed instructions...`,
    balanced_blend: `...detailed instructions...`,
    mirror_mode: `...detailed instructions...`,
    calm_direct: `...detailed instructions...`,
    reality_check: `...detailed instructions...`,
    accountability_partner: `...detailed instructions...`,
    
    // ADVANCED STYLES (17 collapsed by default)
    systems_thinker: `...detailed instructions...`,
    attachment_aware: `...detailed instructions...`,
    // ... and 15 more advanced tones
  };

  const instruction = toneInstructions[aiToneId];
  if (instruction) {
    return instruction;
  }

  // Fallback for unknown tone IDs
  return `\n\nVOICE CONTRACT (Tone: ${aiToneId})\nFollow the tone strictly.\n`;
}
```

### 2. Tone Mapping Details

Each tone now includes:

- **Visual separator** with emoji for clarity
- **Tone name** clearly labeled
- **Response style guidelines** with specific instructions on:
  - Word choice and phrasing
  - Response length and structure
  - Level of warmth vs. directness
  - Balance of emotion vs. action
  - Use of questions vs. statements
- **Example phrases** to guide the AI's language
- **Critical reminder** that the tone is NOT optional

#### Primary Tones (6):

1. **Warm & Supportive** (`warm_hug`)
   - Validating language, gentle pacing, emotional acknowledgment
   - Phrases: "That sounds really hard," "I hear you," "It makes complete sense you'd feel that way"

2. **Balanced & Clear** (`balanced_blend`)
   - Empathy + practical framing, neutral clarity
   - Phrases: "I hear you, and..." "That makes sense. Here's what might help..." "Let's think about..."

3. **Reflective** (`mirror_mode`)
   - Mirrors thoughts, highlights patterns, asks light clarifying questions
   - Phrases: "I'm hearing that..." "It sounds like..." "I notice you said... and also..." "What do you make of that?"

4. **Calm & Direct** (`calm_direct`)
   - Concise, grounded, solution-oriented
   - Phrases: "Here's what I see..." "The reality is..." "What matters most here is..." "Let's focus on..."

5. **Reality Check** (`reality_check`)
   - Respectful challenge, points out inconsistencies without blame
   - Phrases: "I hear you, and the reality is..." "Let's look at what's actually happening..." "You're saying X, but also Y..."

6. **Goal Support** (`accountability_partner`)
   - Structured encouragement, reminders, next steps
   - Phrases: "You said you'd..." "How did that go?" "What's stopping you?" "Let's revisit your commitment..."

#### Advanced Styles (17):

All 17 advanced tones have been mapped with equally detailed instructions:
- Systems Thinker
- Attachment-Aware
- Cognitive Clarity
- Conflict Mediator
- Tough Love
- Straight Shooter
- Executive Summary
- No Nonsense
- Pattern Breaker
- Boundary Enforcer
- Detective
- Therapy Room
- Nurturing Parent
- Best Friend
- Soft Truth

## How It Works

### Flow:
1. User selects an AI Style Preference in the app settings
2. Preference is saved to `user_preferences` table with `ai_tone_id`
3. When user sends a message, the chat screen passes `aiToneId` to the Edge Function
4. Edge Function calls `buildVoiceContract(aiToneId)` to get tone-specific instructions
5. Tone instructions are injected into the system prompt via `buildSystemPrompt()`
6. OpenAI receives the enhanced system prompt and generates a response matching the tone
7. Response is returned to the user with the selected tone applied

### Code Path:
```
chat.tsx (sendMessage)
  ↓
  preferences.ai_tone_id
  ↓
  invokeEdgeSafe('generate-ai-response', { aiToneId, ... })
  ↓
  Edge Function: buildSystemPrompt()
    ↓
    buildVoiceContract(aiToneId)
      ↓
      Returns detailed tone instructions
  ↓
  OpenAI API with enhanced system prompt
  ↓
  AI response matching selected tone
```

## Verification Steps

### 1. Test Each Primary Tone
For each of the 6 primary tones:
- Go to Settings → AI Preferences
- Select the tone
- Start a conversation
- Verify the AI's response matches the tone's characteristics

**Example Test Cases:**

**Warm & Supportive:**
- User: "I'm feeling really overwhelmed with everything"
- Expected: Gentle validation, emotional acknowledgment, soft language
- Example: "That sounds really hard. It makes complete sense you'd feel overwhelmed right now. What's weighing on you most?"

**Calm & Direct:**
- User: "I'm feeling really overwhelmed with everything"
- Expected: Brief acknowledgment, quick move to practical matters
- Example: "I hear you. Let's focus on what matters most. What's the one thing you need to handle first?"

**Reality Check:**
- User: "They said they'd change but nothing's different"
- Expected: Point out contradiction, ground in reality
- Example: "I hear you, and the reality is their actions aren't matching their words. What does that tell you?"

### 2. Test Advanced Tones
- Expand "Advanced Styles" section
- Test a few advanced tones (e.g., Detective, Executive Summary, Boundary Enforcer)
- Verify each applies its unique style

### 3. Test Tone Switching
- Start conversation in one tone
- Switch to a different tone mid-conversation
- Verify the AI adapts to the new tone immediately

### 4. Test Fallback
- If an unknown tone ID is somehow passed, verify the fallback message appears

## Apple App Store Compliance

✅ **Compliant:** All tone instructions:
- Avoid medical, therapeutic, or diagnostic language
- Frame support as emotional guidance and reflection
- Never claim to be a therapist or medical professional
- Use supportive, non-judgmental language
- Empower user choice and self-discovery

## Technical Notes

### No Schema Changes
- ✅ No changes to request/response schemas
- ✅ No changes to Supabase tables
- ✅ No changes to backend APIs
- ✅ Tone-layer adjustment only

### No UI Changes
- ✅ No changes to layout or navigation
- ✅ No changes to AI Preferences screen
- ✅ No changes to chat interface
- ✅ Existing tone selection continues to work

### Performance
- Tone instructions add ~200-500 characters to system prompt
- Negligible impact on OpenAI API latency
- No additional database queries
- No client-side performance impact

## Deployment

### Edge Function Deployment
The Edge Function has been updated locally. To deploy to Supabase:

```bash
# Option 1: Using Supabase CLI (recommended)
supabase functions deploy generate-ai-response

# Option 2: Using Supabase Dashboard
# 1. Go to Edge Functions in Supabase Dashboard
# 2. Select generate-ai-response
# 3. Upload the updated index.ts file
# 4. Deploy
```

### Verification After Deployment
1. Check Edge Function logs for any errors
2. Test a conversation with each primary tone
3. Verify tone instructions appear in system prompt (DEV mode)
4. Confirm AI responses match selected tone

## Troubleshooting

### Issue: AI responses don't match selected tone
**Possible causes:**
1. Edge Function not deployed with latest changes
2. `aiToneId` not being passed from client
3. Tone ID mismatch between client and Edge Function

**Debug steps:**
1. Check Edge Function logs: `supabase functions logs generate-ai-response`
2. Verify `aiToneId` in request payload
3. Add console.log in `buildVoiceContract()` to confirm tone ID
4. Check if tone instructions are in system prompt

### Issue: Unknown tone ID
**Solution:** 
- Verify tone ID matches exactly between `AITones.ts` and Edge Function
- Check for typos in tone IDs
- Fallback will apply generic tone instruction

### Issue: Tone not changing mid-conversation
**Possible causes:**
1. Client not sending updated `aiToneId`
2. Preferences not refreshing after change

**Debug steps:**
1. Check if `preferences.ai_tone_id` updates in UserPreferencesContext
2. Verify new tone ID is sent in next message
3. Check Edge Function receives updated tone ID

## Success Criteria

✅ **Implementation Complete When:**
- [ ] All 23 tones have detailed instructions in Edge Function
- [ ] Each tone produces distinctly different response styles
- [ ] Tone selection reliably affects AI output
- [ ] No changes to UI layout or navigation
- [ ] Apple App Store compliance preserved
- [ ] No schema or API changes
- [ ] Edge Function deployed successfully
- [ ] All primary tones tested and verified
- [ ] Advanced tones tested and verified
- [ ] Tone switching works mid-conversation

## Maintenance

### Adding New Tones
1. Add tone metadata to `constants/AITones.ts`
2. Add tone instructions to `buildVoiceContract()` in Edge Function
3. Deploy Edge Function
4. Test new tone thoroughly

### Updating Existing Tones
1. Update instructions in `buildVoiceContract()`
2. Deploy Edge Function
3. Test updated tone
4. Verify no regression in other tones

## Related Files

- `supabase/functions/generate-ai-response/index.ts` - Edge Function with tone mapping
- `constants/AITones.ts` - Tone metadata and display information
- `contexts/UserPreferencesContext.tsx` - User preference management
- `app/(tabs)/(home)/chat.tsx` - Chat screen that sends tone ID
- `lib/supabase/invokeEdge.ts` - Edge Function invocation wrapper

## Summary

This implementation ensures that AI-generated responses consistently match the user's selected AI Style Preference by:

1. **Mapping each tone** to detailed, specific response style guidelines
2. **Injecting tone instructions** into the system prompt at generation time
3. **Maintaining compliance** with Apple App Store guidelines
4. **Preserving existing architecture** without schema or API changes
5. **Enabling reliable tone switching** that affects AI output immediately

The AI now has clear, actionable instructions for each of the 23 tones, ensuring consistent and predictable behavior that matches user expectations.
