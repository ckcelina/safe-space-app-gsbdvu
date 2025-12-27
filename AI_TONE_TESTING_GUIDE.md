
# AI Tone Testing Guide

## Quick Test Script

Use this script to quickly verify that each AI tone is working correctly.

## Primary Tones (6)

### 1. Warm & Supportive
**Settings:** AI Preferences → Warm & Supportive

**Test Message:** "I'm feeling really overwhelmed with everything going on"

**Expected Response Characteristics:**
- ✅ Starts with emotional validation ("That sounds really hard")
- ✅ Gentle, comforting language
- ✅ Acknowledges feelings generously
- ✅ Soft tone, no harsh words
- ✅ Supportive suggestions wrapped in understanding

**Example Good Response:**
> "That sounds really hard. It makes complete sense you'd feel overwhelmed right now—there's a lot on your plate. What's weighing on you most? I'm here to listen."

**Example Bad Response (not matching tone):**
> "You need to prioritize. What's the most important thing?" ❌ (Too direct, not warm enough)

---

### 2. Balanced & Clear
**Settings:** AI Preferences → Balanced & Clear

**Test Message:** "I don't know if I should talk to them about this or just let it go"

**Expected Response Characteristics:**
- ✅ Validates feelings briefly
- ✅ Offers practical guidance
- ✅ Balanced between warm and direct
- ✅ Mix of empathy and action
- ✅ Clear but not harsh

**Example Good Response:**
> "I hear you—that's a tough call. Let's think about what matters most here. If you don't say anything, will it keep bothering you? Sometimes clarity is worth the discomfort of speaking up."

**Example Bad Response:**
> "That sounds so hard! Take all the time you need to figure it out." ❌ (Too soft, not practical enough)

---

### 3. Reflective
**Settings:** AI Preferences → Reflective

**Test Message:** "I keep saying I'll set boundaries but then I don't"

**Expected Response Characteristics:**
- ✅ Mirrors back what user said
- ✅ Asks questions to promote self-discovery
- ✅ Points out patterns
- ✅ Minimal direct advice
- ✅ Uses user's own words

**Example Good Response:**
> "I'm hearing that you want to set boundaries, and something's stopping you from following through. What do you think happens in that moment when you're about to set a boundary but don't?"

**Example Bad Response:**
> "You should practice setting small boundaries first." ❌ (Too directive, not reflective enough)

---

### 4. Calm & Direct
**Settings:** AI Preferences → Calm & Direct

**Test Message:** "I'm so confused about what to do"

**Expected Response Characteristics:**
- ✅ Gets to the point quickly
- ✅ Brief acknowledgment of feelings
- ✅ Focuses on solutions
- ✅ Clear and concise
- ✅ No unnecessary softening

**Example Good Response:**
> "I hear you. Let's focus on what matters. What's the decision you're facing, and what are your options?"

**Example Bad Response:**
> "That sounds really confusing and overwhelming. It's okay to feel uncertain. Take your time to process everything." ❌ (Too soft, not direct enough)

---

### 5. Reality Check
**Settings:** AI Preferences → Reality Check

**Test Message:** "They said they'd change but nothing's different. Maybe I'm being too harsh?"

**Expected Response Characteristics:**
- ✅ Points out contradictions
- ✅ Grounds in reality
- ✅ Challenges gently but clearly
- ✅ Balances honesty with compassion
- ✅ Helps user see clearly

**Example Good Response:**
> "I hear you, and the reality is their actions aren't matching their words. You're not being too harsh—you're noticing what's actually happening. What does that tell you?"

**Example Bad Response:**
> "Maybe give them more time. Change is hard." ❌ (Too soft, doesn't challenge)

---

### 6. Goal Support
**Settings:** AI Preferences → Goal Support

**Test Message:** "I said I'd talk to them this week but I haven't yet"

**Expected Response Characteristics:**
- ✅ Holds user accountable
- ✅ Checks on commitments
- ✅ Supportive but firm
- ✅ Focuses on action
- ✅ Asks about obstacles

**Example Good Response:**
> "You said you'd talk to them this week. What's stopping you? Let's figure out what needs to happen for you to follow through."

**Example Bad Response:**
> "That's okay, these things are hard. Take your time." ❌ (Too soft, not accountable enough)

---

## Advanced Tones (Sample Tests)

### Detective
**Test Message:** "I don't know why I keep doing this"

**Expected Response:**
- ✅ Asks clarifying questions
- ✅ Explores the "why"
- ✅ Curious but not interrogating
- ✅ 1-3 questions max

**Example Good Response:**
> "I'm curious about that. What was happening the last time you did this? Have you noticed any patterns or triggers?"

---

### Executive Summary
**Test Message:** "There's so much going on with them and I don't know what to do"

**Expected Response:**
- ✅ Uses bullet points or numbered lists
- ✅ Concise and scannable
- ✅ Clear next steps
- ✅ Business-like format

**Example Good Response:**
> "Key points:
> - Multiple issues happening at once
> - Feeling overwhelmed by complexity
> 
> Next steps:
> 1. Identify the most urgent issue
> 2. Address that first
> 3. Tackle others one at a time
> 
> What's the most pressing concern right now?"

---

### Boundary Enforcer
**Test Message:** "They keep asking me to do things and I can't say no"

**Expected Response:**
- ✅ Encourages strong boundaries
- ✅ Direct about boundary violations
- ✅ Empowers saying no
- ✅ Firm about self-protection

**Example Good Response:**
> "You have the right to say no. It's okay to protect your time and energy. What would it take for you to say no next time they ask?"

---

## Testing Checklist

### Basic Functionality
- [ ] Each primary tone produces distinctly different responses
- [ ] Tone selection persists across app restarts
- [ ] Tone changes take effect immediately in next message
- [ ] Advanced tones work when selected
- [ ] Fallback works for unknown tone IDs

### Tone Consistency
- [ ] Warm & Supportive is consistently gentle and validating
- [ ] Balanced & Clear mixes empathy with practicality
- [ ] Reflective consistently mirrors and asks questions
- [ ] Calm & Direct is consistently concise and solution-focused
- [ ] Reality Check consistently challenges gently
- [ ] Goal Support consistently holds accountable

### Edge Cases
- [ ] Switching tones mid-conversation works
- [ ] Multiple messages in same tone maintain consistency
- [ ] Long conversations maintain tone throughout
- [ ] Tone works with different subjects (General, Relationships, etc.)
- [ ] Tone works with different person types (Friend, Partner, etc.)

### Compliance
- [ ] No medical or therapeutic language in any tone
- [ ] No diagnostic claims in any tone
- [ ] All tones remain supportive and non-judgmental
- [ ] All tones empower user choice

## Common Issues

### Issue: All tones sound the same
**Cause:** Edge Function not deployed with latest changes
**Fix:** Deploy Edge Function with updated `buildVoiceContract()`

### Issue: Tone doesn't change when selected
**Cause:** Preferences not refreshing or not being sent to Edge Function
**Fix:** Check UserPreferencesContext and chat.tsx payload

### Issue: Tone is too subtle
**Cause:** Tone instructions not strong enough
**Fix:** Update tone instructions in Edge Function to be more explicit

### Issue: Tone is too extreme
**Cause:** Tone instructions too aggressive
**Fix:** Soften tone instructions while maintaining distinctiveness

## Success Criteria

✅ **Tones are working correctly when:**
- Each tone produces noticeably different responses
- Users can clearly identify which tone is active
- Tone selection reliably affects AI behavior
- Responses match tone descriptions in UI
- Tone switching works immediately
- All tones remain compliant and supportive

## Reporting Issues

When reporting tone issues, include:
1. Selected tone name and ID
2. User message sent
3. AI response received
4. Expected response characteristics
5. What was wrong with the response
6. Screenshots if helpful

Example:
```
Tone: Warm & Supportive (warm_hug)
User: "I'm feeling overwhelmed"
AI Response: "What's the priority here?"
Expected: Gentle validation, emotional acknowledgment
Issue: Response was too direct, not warm enough
```
