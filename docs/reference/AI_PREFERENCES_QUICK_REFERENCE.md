
# AI Style Preferences - Quick Reference Card

## 🚀 Quick Start (3 Steps)

```bash
# 1. Run migration (Supabase SQL Editor)
MIGRATION_ADD_AI_PREFERENCES.sql

# 2. Update Edge Function
# Copy prompts/aiPrompt.ts
# Add aiToneId and aiScienceMode params
# Deploy: supabase functions deploy generate-ai-response

# 3. Test
npm run ios
# Create account → Set preferences → Start chat
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `constants/AITones.ts` | 22 tone definitions |
| `contexts/UserPreferencesContext.tsx` | State management |
| `app/ai-preferences-onboarding.tsx` | Onboarding screen |
| `app/(tabs)/settings.tsx` | Settings UI |
| `app/(tabs)/(home)/chat.tsx` | Pass prefs to AI |
| `prompts/aiPrompt.ts` | Tone logic (v1.1.0) |

## 🎨 22 AI Tones

### Gentle (5)
- warm_hug, therapy_room, best_friend, nurturing_parent, soft_truth

### Balanced (9)
- **balanced_blend** (default), clear_coach, mirror_mode, calm_direct, detective, systems_thinker, attachment_aware, cognitive_clarity, conflict_mediator

### Direct (8)
- tough_love, straight_shooter, executive_summary, no_nonsense, reality_check, pattern_breaker, accountability_partner, boundary_enforcer

## 💾 Database Schema

```sql
ALTER TABLE users ADD COLUMN ai_tone_id TEXT DEFAULT 'balanced_blend';
ALTER TABLE users ADD COLUMN ai_science_mode BOOLEAN DEFAULT false;
```

## 🔧 Code Snippets

### Use Preferences in Component
```typescript
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

const { preferences, updatePreferences } = useUserPreferences();

// Read
console.log(preferences.ai_tone_id);  // 'warm_hug'
console.log(preferences.ai_science_mode);  // true

// Update
await updatePreferences({ ai_tone_id: 'straight_shooter' });
await updatePreferences({ ai_science_mode: true });
```

### Pass to Edge Function
```typescript
const { data } = await supabase.functions.invoke('generate-ai-response', {
  body: {
    personId,
    personName,
    messages,
    aiToneId: preferences.ai_tone_id,
    aiScienceMode: preferences.ai_science_mode,
  },
});
```

### Generate Prompt (Edge Function)
```typescript
import { generateAISystemPrompt } from './aiPrompt.ts';

const prompt = generateAISystemPrompt({
  personName: req.personName,
  relationshipType: req.personRelationshipType,
  currentSubject: req.currentSubject,
  aiToneId: req.aiToneId || 'balanced_blend',
  aiScienceMode: req.aiScienceMode || false,
});
```

## 🎯 User Flow

```
Signup → AI Prefs Onboarding → Home
                ↓
         (or skip, use defaults)
                ↓
         Settings → Change anytime
                ↓
         Chat → AI uses preferences
```

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Prefs not saving | Run migration, check RLS |
| Tone not changing | Update Edge Function |
| Science mode not working | Check aiScienceMode passed |
| Onboarding not showing | Check signup.tsx navigation |
| TypeScript errors | Update types/database.types.ts |

## 📊 Defaults

- **Default Tone**: balanced_blend
- **Default Science Mode**: false
- **Fallback**: If preferences missing, use defaults

## ✅ Testing Checklist

- [ ] Migration ran
- [ ] Edge Function deployed
- [ ] Onboarding appears after signup
- [ ] Settings shows current preferences
- [ ] Can change tone in Settings
- [ ] Science mode toggle works
- [ ] AI responses reflect tone
- [ ] Preferences persist after logout

## 📚 Documentation

- `AI_PREFERENCES_IMPLEMENTATION_SUMMARY.md` - Full details
- `AI_PREFERENCES_DEPLOYMENT_CHECKLIST.md` - Step-by-step
- `AI_PREFERENCES_DEVELOPER_QUICK_START.md` - For devs
- `AI_PREFERENCES_USER_GUIDE.md` - For end users
- `AI_PREFERENCES_TROUBLESHOOTING.md` - Debug guide
- `EDGE_FUNCTION_UPDATE_GUIDE.md` - Edge Function help

## 🎉 Success Criteria

✅ Users can choose from 22 tones
✅ Science mode adds psychology insights
✅ Preferences set in onboarding
✅ Preferences changeable in Settings
✅ AI responses reflect chosen tone
✅ Changes apply immediately
✅ Works on iOS and web
✅ No breaking changes

---

**Version**: 1.0
**Status**: ✅ Complete
**Next**: Run migration → Update Edge Function → Test
