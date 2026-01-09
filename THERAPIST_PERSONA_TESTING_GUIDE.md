
# Therapist Persona Testing Guide

## 🧪 Quick Test Script

### Test Message: "I'm feeling overwhelmed and don't know what to do."

### Expected Responses by Persona:

#### 1. **Dr. Elias** (Calm & Grounding)
**Expected Style:**
- Slow, calming language
- Grounding techniques
- Reassurance
- No urgency

**Example Response:**
> "Let's take a breath for a moment. I can hear that you're feeling overwhelmed. That's a lot to carry. You're safe here, and we can take this one step at a time. What feels most heavy right now?"

**Key Indicators:**
- ✅ Uses "Let's take a breath"
- ✅ Validates feelings
- ✅ Offers safety/reassurance
- ✅ Asks gentle question

---

#### 2. **Noah** (Direct & Practical)
**Expected Style:**
- Clear, concise language
- Practical focus
- Structured approach
- Actionable steps

**Example Response:**
> "Okay. Let's break this down. What's the most urgent thing? Not everything—just one thing. What needs to happen first?"

**Key Indicators:**
- ✅ Uses "Okay" or "Let's break this down"
- ✅ Focuses on action
- ✅ Asks clarifying questions
- ✅ Short, direct sentences

---

#### 3. **Maya** (Gentle & Validating)
**Expected Style:**
- Warm, empathetic language
- Emotional validation
- No rushing to solutions
- Supportive framing

**Example Response:**
> "That sounds really heavy to carry. Of course you feel overwhelmed—anyone would in your situation. Your feelings are valid. What do you need right now?"

**Key Indicators:**
- ✅ Uses "That sounds really heavy"
- ✅ Validates emotions explicitly
- ✅ Normalizes feelings
- ✅ Asks about needs

---

#### 4. **Claire** (Reflective & Insightful)
**Expected Style:**
- Thoughtful questions
- Pattern recognition
- Encourages self-awareness
- Exploratory approach

**Example Response:**
> "Something in what you said feels important. You're noticing that you feel overwhelmed. I'm curious—what do you think is keeping you in this place? What does that bring up for you?"

**Key Indicators:**
- ✅ Uses "Something in what you said..."
- ✅ Asks reflective questions
- ✅ Encourages exploration
- ✅ Ends with "What does that bring up for you?"

---

#### 5. **Ruth** (Nurturing & Wise)
**Expected Style:**
- Warm, caring language
- Reassurance
- Gentle perspective
- Comforting tone

**Example Response:**
> "Oh love, of course you feel this way. You're carrying so much, and it's okay to feel heavy. You're not failing. You're human. Be gentle with yourself today. What would help you feel more grounded?"

**Key Indicators:**
- ✅ Uses "Oh love" or "Sweetheart"
- ✅ Offers reassurance
- ✅ Reminds to be gentle with self
- ✅ Warm, nurturing tone

---

#### 6. **Jordan** (Encouraging & Uplifting)
**Expected Style:**
- Encouraging language
- Strength-focused
- Affirming
- Forward momentum

**Example Response:**
> "I'm proud of you for sharing this. I know it's hard. But here's what I see: you're still here. You're still trying. That takes strength. What's one small thing you can do today? You've got this—small steps count."

**Key Indicators:**
- ✅ Uses "I'm proud of you"
- ✅ Highlights strengths
- ✅ Encourages action
- ✅ Ends with "You've got this"

---

#### 7. **Aisha** (Curious & Exploratory)
**Expected Style:**
- Open-ended questions
- Curious approach
- Explores perspectives
- No fixing or steering

**Example Response:**
> "Can I get curious with you for a second? You're feeling overwhelmed. That's interesting. What if we looked at this from a different angle? What's one assumption you're making that might not be true? What else are you noticing?"

**Key Indicators:**
- ✅ Uses "Can I get curious with you?"
- ✅ Asks open-ended questions
- ✅ Explores perspectives
- ✅ Ends with "What else are you noticing?"

---

#### 8. **Ken** (Balanced & Analytical)
**Expected Style:**
- Balances emotion and logic
- Structured thinking
- Calm, composed tone
- Integrates feelings and reasoning

**Example Response:**
> "Let's break this down logically. You're feeling overwhelmed because there's a disconnect between what you expected and what's happening. What are the facts? What are the feelings? How do they connect? Does that framework help?"

**Key Indicators:**
- ✅ Uses "Let's break this down logically"
- ✅ Separates facts from feelings
- ✅ Offers frameworks
- ✅ Ends with "Does that framework help?"

---

## 🔍 How to Test

### Step 1: Change Therapist
```
1. Open Safe Space app
2. Go to Settings tab
3. Tap "Communication Style"
4. Select a therapist (e.g., Noah)
5. Tap "Save"
```

### Step 2: Send Test Message
```
1. Go to Chat screen
2. Select a person/topic
3. Send: "I'm feeling overwhelmed and don't know what to do."
4. Wait for response
```

### Step 3: Verify Response Style
```
1. Read the response
2. Check if it matches expected style
3. Look for key indicators (see above)
4. Verify response length (Noah should be shorter, Ruth longer)
```

### Step 4: Check Logs (Optional)
```
1. Go to Supabase Dashboard
2. Edge Functions > Logs
3. Look for: "🎭 Therapist persona selected"
4. Verify correct persona was used
```

---

## 📊 Response Length Comparison

| Persona | Max Tokens | Expected Length |
|---------|-----------|-----------------|
| Noah | 180 | Shortest (1-2 sentences) |
| Dr. Elias | 250 | Medium (2-3 sentences) |
| Jordan | 280 | Medium (2-3 sentences) |
| Maya | 280 | Medium-Long (3-4 sentences) |
| Aisha | 300 | Medium-Long (3-4 sentences) |
| Ken | 300 | Medium-Long (3-4 sentences) |
| Claire | 320 | Long (4-5 sentences) |
| Ruth | 350 | Longest (4-6 sentences) |

---

## 🎯 Key Differences to Look For

### Tone
- **Calm**: Dr. Elias, Ruth
- **Direct**: Noah, Ken
- **Warm**: Maya, Ruth, Jordan
- **Exploratory**: Claire, Aisha

### Question Style
- **Practical**: Noah ("What needs to happen first?")
- **Reflective**: Claire ("What does that bring up for you?")
- **Curious**: Aisha ("What else are you noticing?")
- **Analytical**: Ken ("Does that framework help?")

### Response Structure
- **Bullets/Short**: Noah
- **Paragraphs**: Dr. Elias, Ruth, Claire
- **Mixed**: Maya, Jordan, Aisha, Ken

---

## ✅ Success Criteria

### Persona is Working Correctly If:
- ✅ Response matches expected style
- ✅ Response length is appropriate
- ✅ Key phrases are present
- ✅ Tone feels distinct from other personas
- ✅ Edge function logs show correct persona

### Persona is NOT Working If:
- ❌ All responses sound the same
- ❌ Response length is always the same
- ❌ Key phrases are missing
- ❌ Tone feels generic
- ❌ Edge function logs show wrong persona or default

---

## 🐛 Troubleshooting

### Issue: All responses sound the same
**Check:**
1. Is `therapistPersonaId` being passed to edge function?
2. Are edge function logs showing correct persona?
3. Is the persona config correct in edge function?

### Issue: Responses too similar to default (Dr. Elias)
**Check:**
1. Is the persona ID valid? (e.g., "noah" not "Noah")
2. Is the edge function using the correct config?
3. Are temperature/max_tokens being applied?

### Issue: Responses too long/short
**Check:**
1. Is `max_tokens` set correctly in edge function?
2. Is OpenAI respecting the max_tokens parameter?
3. Are responses being truncated?

---

## 📝 Test Checklist

- [ ] Test Dr. Elias (default)
- [ ] Test Noah (direct)
- [ ] Test Maya (validating)
- [ ] Test Claire (reflective)
- [ ] Test Ruth (nurturing)
- [ ] Test Jordan (encouraging)
- [ ] Test Aisha (curious)
- [ ] Test Ken (analytical)
- [ ] Verify response lengths vary
- [ ] Verify tone differences
- [ ] Check edge function logs
- [ ] Confirm persona switching works

---

## 🎉 Expected Outcome

After testing all 8 personas, you should observe:
- ✅ **Distinct voices**: Each persona sounds different
- ✅ **Consistent behavior**: Same persona gives similar responses
- ✅ **Appropriate length**: Noah is concise, Ruth is longer
- ✅ **Correct tone**: Calm, direct, warm, exploratory, etc.
- ✅ **Reliable switching**: Changing persona changes responses

If all criteria are met, the implementation is working correctly! 🎊
