
# AI Tone System - Quick Reference

## Tone Categories & Characteristics

### 🌸 Gentle & Supportive
**When to use:** User needs emotional validation, comfort, or a soft approach

| Tone ID | Display Name | Key Characteristics |
|---------|--------------|---------------------|
| `warm_hug` | Warm Hug | Deeply validating, generous reassurance, soft language |
| `therapy_room` | Therapy Room | Reflective questions, professional warmth, safe space |
| `best_friend` | Best Friend | Casual, relatable, conversational, supportive |
| `nurturing_parent` | Nurturing Parent | Protective, unconditional support, encourages self-care |
| `soft_truth` | Soft Truth | Honest insights wrapped in kindness, gentle delivery |

### ⚖️ Balanced & Clear
**When to use:** User needs both support and practical guidance

| Tone ID | Display Name | Key Characteristics |
|---------|--------------|---------------------|
| `balanced_blend` | Balanced Blend | Adapts to needs, mixes empathy with practicality |
| `clear_coach` | Clear Coach | Step-by-step guidance, action-oriented, structured |
| `mirror_mode` | Mirror Mode | Reflects thoughts back, promotes self-discovery |
| `calm_direct` | Calm & Direct | Straightforward, solution-focused, no fluff |
| `detective` | Detective | Asks clarifying questions, explores root causes |
| `systems_thinker` | Systems Thinker | Sees patterns, considers context, big picture |
| `attachment_aware` | Attachment-Aware | Attachment theory lens, practical advice |
| `cognitive_clarity` | Cognitive Clarity | Identifies thought patterns, offers reframes |
| `conflict_mediator` | Conflict Mediator | Neutral, balanced, sees multiple perspectives |

### 💪 Direct & Firm
**When to use:** User needs accountability, reality checks, or firm guidance

| Tone ID | Display Name | Key Characteristics |
|---------|--------------|---------------------|
| `tough_love` | Tough Love | Firm but caring, pushes growth, challenges user |
| `straight_shooter` | Straight Shooter | Blunt, honest, no sugar-coating, gets to point |
| `executive_summary` | Executive Summary | Bullet points, concise, action items, efficient |
| `no_nonsense` | No Nonsense | Practical, cuts through noise, minimal emotion |
| `reality_check` | Reality Check | Points out contradictions, grounds in reality |
| `pattern_breaker` | Pattern Breaker | Challenges unhelpful cycles, persistent |
| `accountability_partner` | Accountability Partner | Holds user accountable, checks progress |
| `boundary_enforcer` | Boundary Enforcer | Encourages strong boundaries, assertiveness |

## Response Length by Tone

**Longer responses (detailed, exploratory):**
- Warm Hug
- Therapy Room
- Systems Thinker
- Attachment-Aware
- Cognitive Clarity

**Medium responses (balanced):**
- Balanced Blend
- Clear Coach
- Best Friend
- Soft Truth
- Detective
- Conflict Mediator

**Shorter responses (concise, direct):**
- Executive Summary
- No Nonsense
- Straight Shooter
- Reality Check
- Calm & Direct

## Question vs. Statement Balance

**More questions (exploratory):**
- Therapy Room
- Mirror Mode
- Detective
- Conflict Mediator

**Balanced:**
- Balanced Blend
- Clear Coach
- Attachment-Aware
- Cognitive Clarity

**More statements (directive):**
- Executive Summary
- Straight Shooter
- No Nonsense
- Accountability Partner
- Boundary Enforcer

## Warmth Level

**High warmth:**
- Warm Hug
- Nurturing Parent
- Best Friend

**Medium warmth:**
- Therapy Room
- Soft Truth
- Balanced Blend
- Clear Coach

**Lower warmth (professional/direct):**
- Executive Summary
- No Nonsense
- Straight Shooter
- Reality Check

## Science Mode Behavior

### When ENABLED (`ai_science_mode: true`)
- Include brief mentions of psychology/relationship concepts
- Reference established frameworks (attachment theory, CBT, etc.)
- Suggest 1-3 resources when relevant (books, topics)
- Keep science accessible, not academic
- Only include when it genuinely adds value

**Example phrases:**
- "Research on attachment styles suggests..."
- "In cognitive behavioral therapy, this is called..."
- "You might find 'Nonviolent Communication' by Marshall Rosenberg helpful..."

### When DISABLED (`ai_science_mode: false`)
- Focus purely on emotional support and practical advice
- No research references unless user specifically asks
- No book/resource suggestions
- Keep responses grounded in personal experience

## Tone Selection Tips

### For Users Who Need:
- **Emotional validation** → Warm Hug, Nurturing Parent
- **Professional support** → Therapy Room, Attachment-Aware
- **Practical action steps** → Clear Coach, Executive Summary
- **Self-discovery** → Mirror Mode, Detective
- **Reality checks** → Reality Check, Straight Shooter
- **Accountability** → Accountability Partner, Pattern Breaker
- **Boundary help** → Boundary Enforcer, Tough Love
- **Balanced approach** → Balanced Blend, Calm & Direct

### Common Combinations:
- **Anxious attachment** → Warm Hug or Attachment-Aware
- **Avoidant attachment** → Gentle tones (Soft Truth, Best Friend)
- **People-pleasers** → Boundary Enforcer, Tough Love
- **Overthinkers** → Cognitive Clarity, Executive Summary
- **Conflict situations** → Conflict Mediator, Systems Thinker
- **Stuck in patterns** → Pattern Breaker, Reality Check

## Testing Prompts

Use these to verify tone differences:

### Test Prompt 1: "My partner forgot our anniversary again."
- **Warm Hug**: Validates hurt feelings extensively, offers comfort
- **Executive Summary**: Lists key issues, action items
- **Reality Check**: Points out the pattern, challenges denial

### Test Prompt 2: "I don't know if I should stay in this relationship."
- **Therapy Room**: Asks reflective questions about feelings
- **Detective**: Explores what's behind the uncertainty
- **Straight Shooter**: Directly addresses the core issue

### Test Prompt 3: "I keep making the same mistakes."
- **Pattern Breaker**: Challenges the cycle firmly
- **Cognitive Clarity**: Identifies thought patterns
- **Nurturing Parent**: Offers self-compassion first

## Implementation Notes

### Database Storage
- Only `toneId` is stored (e.g., 'warm_hug')
- Display names and descriptions are never stored
- Default: 'balanced_blend'

### Prompt Injection Point
```
User selects tone → Saved to DB → Loaded by UserPreferencesContext 
→ Passed to edge function → generateAISystemPrompt() 
→ getToneSystemInstruction() → Full prompt to OpenAI
```

### Fallback Behavior
- If tone ID not found → Falls back to 'balanced_blend'
- If preferences not loaded → Uses default preferences
- If edge function fails → Generic fallback message

## Troubleshooting

### Tone not noticeable in responses?
1. Check edge function is receiving `aiToneId` parameter
2. Verify `generateAISystemPrompt()` is being called with tone ID
3. Confirm OpenAI is receiving the full system prompt
4. Test with extreme tones (Warm Hug vs. Executive Summary)

### Science mode not working?
1. Verify `aiScienceMode` is being passed to edge function
2. Check prompt includes science mode section
3. Test with topics that benefit from research (attachment, communication)

### UI showing wrong names?
1. Verify using `tone.displayName` not `tone.name`
2. Check `getToneById()` is finding the correct tone
3. Confirm tone IDs match between UI and database

## Version History
- **v2.0.0** (Current): Enhanced system instructions, strengthened prompts
- **v1.0.0**: Initial implementation with basic tone support
