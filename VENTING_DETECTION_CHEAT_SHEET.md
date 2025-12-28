
# Venting Detection - Cheat Sheet

## 🎯 Quick Overview

**What it does**: Detects when users are venting (expressing emotions) vs. seeking advice, and adapts AI responses accordingly.

---

## 🔍 Detection Logic

### Venting Indicators
```
"I'm so tired of..."
"I can't stand..."
"I just need to vent..."
"I'm overwhelmed..."
"I can't handle..."
+ No explicit advice requests
+ High emotional intensity
```

### Advice-Seeking Indicators
```
"What should I do?"
"How can I handle this?"
"Any advice?"
"What do you think?"
"Should I...?"
```

---

## 📏 Response Lengths

| Emotional Intensity | Word Count | Token Limit | Example |
|---------------------|------------|-------------|---------|
| **High** | 20-40 words | 80 tokens | "I hear you. That's overwhelming. You're not alone." |
| **Medium** | 40-60 words | 120 tokens | "That sounds frustrating. It makes sense you'd feel this way. What's hardest right now?" |
| **Low** | 50-80 words | 150 tokens | "I hear what you're saying. That situation sounds difficult. How are you holding up?" |
| **Advice** | 100-150 words | 300+ tokens | Normal guidance with practical suggestions |

---

## ✅ When Venting Detected

### DO:
- ✅ Acknowledge feelings
- ✅ Validate emotions
- ✅ Use short affirmations
- ✅ Reflect back what you hear
- ✅ Allow space for silence
- ✅ Optional: ONE gentle question

### DON'T:
- ❌ Offer solutions
- ❌ Use "you should" language
- ❌ Rush to fix
- ❌ Ask multiple questions
- ❌ Provide lengthy responses
- ❌ Give unsolicited advice

---

## 💬 Example Phrases

### Venting Responses (Use These)
```
"I hear you."
"That sounds really hard."
"That makes complete sense."
"Of course you feel that way."
"I'm here with you."
"That's a lot to carry."
"That's exhausting."
"You deserve better."
```

### Avoid When Venting (Don't Use These)
```
❌ "You should..."
❌ "Try this..."
❌ "Have you tried..."
❌ "What if you..."
❌ "Maybe you could..."
❌ "Here's what I'd do..."
```

---

## 🧪 Quick Tests

### Test 1: High-Intensity Venting
**Input**: "I can't handle this anymore. I'm breaking down."
**Expected**: Brief validation (20-40 words), no advice

### Test 2: Advice-Seeking
**Input**: "What should I do about my boss?"
**Expected**: Normal guidance (100-150 words)

### Test 3: Rhetorical Questions
**Input**: "Why does this always happen to me?"
**Expected**: Brief validation, no literal answers

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| AI giving advice when venting | Check venting indicators, strengthen guidance |
| Responses too long | Reduce maxTokens, add word count limits |
| False positives | Add more advice keywords, adjust thresholds |

---

## 📊 Key Metrics

- **Venting Detection Rate**: % of messages detected as venting
- **Response Length**: Average word count for venting vs. advice
- **User Satisfaction**: Feedback on feeling heard

---

## 📁 Files

- **Edge Function**: `supabase/functions/generate-ai-response/index.ts`
- **Full Docs**: `VENTING_DETECTION_IMPLEMENTATION.md`
- **Testing**: `VENTING_DETECTION_TESTING_GUIDE.md`

---

## 🚀 Deployment

```bash
# Deploy
supabase functions deploy generate-ai-response

# Check logs
supabase functions logs generate-ai-response

# Rollback if needed
supabase functions deploy generate-ai-response --version 37
```

---

## ✨ Summary

**Venting**: Brief validation, no advice
**Advice**: Normal guidance with solutions
**Goal**: User feels heard, not guided

**Status**: ✅ Live
**Version**: 38
**Impact**: High emotional intelligence
