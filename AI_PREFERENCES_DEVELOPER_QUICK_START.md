
# AI Preferences - Developer Quick Start

## 🚀 5-Minute Setup

### 1. Run Database Migration (1 min)
```sql
-- Copy MIGRATION_ADD_AI_PREFERENCES.sql and run in Supabase SQL Editor
-- This adds ai_tone_id and ai_science_mode columns to users table
```

### 2. Update Edge Function (2 min)
```typescript
// In your generate-ai-response Edge Function:

// 1. Add to request interface
interface Request {
  // ... existing fields
  aiToneId?: string;
  aiScienceMode?: boolean;
}

// 2. Update prompt generation
import { generateAISystemPrompt } from './aiPrompt.ts';

const systemPrompt = generateAISystemPrompt({
  personName: req.personName,
  relationshipType: req.personRelationshipType,
  currentSubject: req.currentSubject,
  conversationContext: { hasDeathMention: detectDeathMention(req.messages) },
  aiToneId: req.aiToneId || 'balanced_blend',  // NEW
  aiScienceMode: req.aiScienceMode || false,   // NEW
});

// 3. Deploy
// supabase functions deploy generate-ai-response
```

### 3. Test (2 min)
```bash
# Start app
npm run ios  # or npm run web

# Test flow:
# 1. Create account → AI preferences screen appears
# 2. Select a tone → Continue
# 3. Go to Settings → AI Style Preferences
# 4. Change tone → Start conversation → Verify tone change
```

## 📁 Key Files

### New Files
- `constants/AITones.ts` - 22 tone definitions
- `contexts/UserPreferencesContext.tsx` - State management
- `app/ai-preferences-onboarding.tsx` - Onboarding screen
- `MIGRATION_ADD_AI_PREFERENCES.sql` - Database schema

### Modified Files
- `app/_layout.tsx` - Added UserPreferencesProvider
- `app/signup.tsx` - Navigate to AI preferences
- `app/(tabs)/settings.tsx` - AI preferences UI
- `app/(tabs)/(home)/chat.tsx` - Pass preferences to Edge Function
- `prompts/aiPrompt.ts` - Tone logic (v1.1.0)
- `types/database.types.ts` - User interface

## 🔧 How It Works

```
User selects tone in Settings
         ↓
UserPreferencesContext updates
         ↓
Saved to Supabase users table
         ↓
Chat screen reads preferences
         ↓
Passes to Edge Function
         ↓
Edge Function uses tone in prompt
         ↓
OpenAI generates response with tone
         ↓
User sees personalized response
```

## 🎨 Adding a New Tone

1. Add to `constants/AITones.ts`:
```typescript
{
  id: 'my_new_tone',
  name: 'My New Tone',
  description: 'Description here',
  category: 'balanced',
}
```

2. Add to `prompts/aiPrompt.ts` in `getToneInstruction()`:
```typescript
my_new_tone: 'Instruction for AI on how to use this tone.',
```

3. Update database constraint:
```sql
ALTER TABLE users DROP CONSTRAINT users_ai_tone_id_check;
ALTER TABLE users ADD CONSTRAINT users_ai_tone_id_check 
CHECK (ai_tone_id IN ('balanced_blend', 'my_new_tone', ...));
```

## 🧪 Testing Tones

```typescript
// Test different tones in chat
const testTones = [
  'warm_hug',      // Should be very empathetic
  'straight_shooter', // Should be direct
  'balanced_blend',   // Should be balanced
];

// For each tone:
// 1. Set in Settings
// 2. Send: "I'm feeling really sad about my relationship"
// 3. Verify response matches tone style
```

## 🐛 Common Issues

### Preferences not saving
```typescript
// Check UserPreferencesContext is wrapped correctly
<AuthProvider>
  <UserPreferencesProvider>  {/* Must be inside AuthProvider */}
    <App />
  </UserPreferencesProvider>
</AuthProvider>
```

### Tone not changing
```typescript
// Verify Edge Function receives params
console.log('AI Preferences:', req.aiToneId, req.aiScienceMode);

// Check prompt includes tone instruction
console.log('System Prompt:', systemPrompt);
```

### TypeScript errors
```bash
# Regenerate types from Supabase
npx supabase gen types typescript --project-id zjzvkxvahrbuuyzjzxol > types/supabase.ts
```

## 📚 API Reference

### UserPreferencesContext
```typescript
const { preferences, updatePreferences, loading } = useUserPreferences();

// preferences.ai_tone_id: string
// preferences.ai_science_mode: boolean
// updatePreferences(patch): Promise<{success: boolean, error?: string}>
```

### AITones
```typescript
import { AI_TONES, getToneById, getTonesByCategory } from '@/constants/AITones';

const tone = getToneById('warm_hug');
const gentleTones = getTonesByCategory('gentle');
```

### generateAISystemPrompt
```typescript
import { generateAISystemPrompt } from '@/prompts/aiPrompt';

const prompt = generateAISystemPrompt({
  personName: 'Alex',
  relationshipType: 'Partner',
  currentSubject: 'Communication',
  aiToneId: 'warm_hug',
  aiScienceMode: true,
});
```

## 🔐 Security Notes

- Preferences are user-scoped (RLS enforced)
- Tone IDs validated by database constraint
- No sensitive data in preferences
- Edge Function validates tone ID before use

## 📈 Performance

- Preferences cached in Context (no extra DB calls per message)
- Index on `ai_tone_id` for fast lookups
- Tone instruction adds ~200 chars to prompt (negligible)
- Science mode adds ~300 chars when enabled

## 🎯 Future Enhancements

- [ ] Tone preview examples
- [ ] Per-person tone settings
- [ ] Custom tone creation (premium)
- [ ] Tone recommendations based on usage
- [ ] A/B test default tones

---

**Questions?** Check `AI_PREFERENCES_IMPLEMENTATION_SUMMARY.md` for full details.
