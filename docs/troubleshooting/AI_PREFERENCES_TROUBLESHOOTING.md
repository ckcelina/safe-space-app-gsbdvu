
# AI Style Preferences - Troubleshooting Guide

## 🔍 Common Issues & Solutions

### Issue 1: Preferences Not Saving

**Symptoms:**
- Selecting a tone in Settings doesn't persist
- Science mode toggle doesn't stay on/off
- No success toast appears

**Possible Causes & Solutions:**

#### A) Database migration not run
```bash
# Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('ai_tone_id', 'ai_science_mode');

# If empty, run MIGRATION_ADD_AI_PREFERENCES.sql
```

#### B) RLS policies blocking updates
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Ensure this policy exists:
-- "Users can update own profile" FOR UPDATE USING (auth.uid() = user_id)
```

#### C) User ID mismatch
```typescript
// In browser console, check:
console.log('User ID:', userId);
console.log('Auth UID:', authUser?.id);

// These should match. If not, check AuthContext.
```

#### D) Network error
```typescript
// Check browser Network tab for failed requests
// Look for 400/500 errors on Supabase API calls
```

**Fix:**
1. Run migration if not done
2. Verify RLS policies
3. Check browser console for errors
4. Test with a fresh account

---

### Issue 2: Tone Not Changing in Conversations

**Symptoms:**
- Changed tone in Settings
- AI responses still sound the same
- No difference between "Warm Hug" and "Straight Shooter"

**Possible Causes & Solutions:**

#### A) Edge Function not updated
```bash
# Check Edge Function deployment
supabase functions list

# Redeploy with updated code
supabase functions deploy generate-ai-response

# Check logs
supabase functions logs generate-ai-response
```

#### B) Preferences not passed to Edge Function
```typescript
// In chat.tsx, verify this code exists:
const { data: aiResponse } = await supabase.functions.invoke(
  'generate-ai-response',
  {
    body: {
      // ... other fields
      aiToneId: preferences.ai_tone_id,  // ← Must be here
      aiScienceMode: preferences.ai_science_mode,  // ← Must be here
    },
  }
);
```

#### C) Edge Function not using tone parameter
```typescript
// In Edge Function, verify:
const systemPrompt = generateAISystemPrompt({
  personName: req.personName,
  // ... other fields
  aiToneId: req.aiToneId || 'balanced_blend',  // ← Must be here
  aiScienceMode: req.aiScienceMode || false,  // ← Must be here
});
```

#### D) OpenAI not respecting system prompt
```typescript
// Check OpenAI API call includes system message:
const messages = [
  { role: 'system', content: systemPrompt },  // ← Must be first
  ...conversationMessages,
];
```

**Fix:**
1. Redeploy Edge Function with updated code
2. Check Edge Function logs for errors
3. Verify tone parameter is passed through entire chain
4. Test with extreme tones (Warm Hug vs Straight Shooter)

---

### Issue 3: Science Mode Not Working

**Symptoms:**
- Science mode is ON
- AI responses don't include psychology insights
- No book/article recommendations

**Possible Causes & Solutions:**

#### A) Science mode not passed to Edge Function
```typescript
// Same as Issue 2B - verify aiScienceMode is passed
```

#### B) Prompt doesn't include science instruction
```typescript
// In prompts/aiPrompt.ts, verify this block exists:
${aiScienceMode ? `SCIENCE & RESOURCES MODE (ENABLED):
- When relevant, briefly mention psychology/relationship science concepts
- Suggest 1–3 reputable resources when appropriate
...` : ''}
```

#### C) User input doesn't warrant science response
```
// Science mode only activates when relevant
// Try asking: "Why do I keep repeating this pattern?"
// Or: "What does psychology say about attachment?"
```

**Fix:**
1. Verify science mode is true in database
2. Check Edge Function receives aiScienceMode=true
3. Test with questions that warrant psychology insights
4. Check Edge Function logs for prompt content

---

### Issue 4: Onboarding Screen Not Appearing

**Symptoms:**
- New user signs up
- Goes directly to Home instead of AI preferences
- Skips onboarding step

**Possible Causes & Solutions:**

#### A) Navigation not updated
```typescript
// In app/signup.tsx, verify:
router.replace('/ai-preferences-onboarding');  // Not /(tabs)/(home)
```

#### B) Route not registered
```typescript
// In app/_layout.tsx, verify this exists:
<Stack.Screen
  name="ai-preferences-onboarding"
  options={{
    headerShown: false,
    gestureEnabled: false,
    animation: "slide_from_right",
  }}
/>
```

#### C) File not created
```bash
# Check file exists
ls app/ai-preferences-onboarding.tsx
```

**Fix:**
1. Verify signup.tsx navigates to correct route
2. Check _layout.tsx includes route
3. Ensure file exists and exports default component
4. Clear app cache and rebuild

---

### Issue 5: TypeScript Errors

**Symptoms:**
- Red squiggly lines in IDE
- Build fails with type errors
- "Property does not exist" errors

**Common Errors & Solutions:**

#### A) `Property 'ai_tone_id' does not exist on type 'User'`
```typescript
// Update types/database.types.ts:
export interface User {
  // ... existing fields
  ai_tone_id?: string;
  ai_science_mode?: boolean;
}
```

#### B) `Cannot find module '@/constants/AITones'`
```bash
# Verify file exists
ls constants/AITones.ts

# Check tsconfig.json has path alias
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### C) `useUserPreferences is not a function`
```typescript
// Verify import:
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

// Verify provider is wrapped:
<UserPreferencesProvider>
  <App />
</UserPreferencesProvider>
```

**Fix:**
1. Update type definitions
2. Verify all files are created
3. Check imports and exports
4. Restart TypeScript server in IDE

---

### Issue 6: Modal Not Opening

**Symptoms:**
- Tap "AI Tone" in Settings
- Modal doesn't appear
- No error in console

**Possible Causes & Solutions:**

#### A) State not updating
```typescript
// In Settings, verify:
const [showAIPreferencesModal, setShowAIPreferencesModal] = useState(false);

const handleOpenAIPreferencesModal = () => {
  setShowAIPreferencesModal(true);  // ← Must set to true
};
```

#### B) Modal component not rendered
```typescript
// Verify Modal component exists in JSX:
<Modal
  visible={showAIPreferencesModal}
  transparent={true}
  animationType="slide"
  onRequestClose={handleCloseAIPreferencesModal}
>
  {/* Modal content */}
</Modal>
```

#### C) TouchableOpacity not wired
```typescript
// Verify onPress is connected:
<TouchableOpacity
  onPress={handleOpenAIPreferencesModal}  // ← Must call handler
  activeOpacity={0.7}
>
```

**Fix:**
1. Check state management
2. Verify Modal component is rendered
3. Check onPress handlers
4. Look for JavaScript errors in console

---

### Issue 7: Preferences Reset After Logout

**Symptoms:**
- Set preferences
- Log out and log back in
- Preferences are back to default

**Possible Causes & Solutions:**

#### A) Preferences not saved to database
```sql
-- Check database
SELECT id, ai_tone_id, ai_science_mode FROM users WHERE id = 'user-id-here';

-- Should show your selected values, not defaults
```

#### B) UserPreferencesContext not fetching on login
```typescript
// In UserPreferencesContext.tsx, verify:
useEffect(() => {
  if (currentUser) {
    fetchPreferences();  // ← Must fetch on login
  }
}, [currentUser, fetchPreferences]);
```

#### C) Using local state instead of database
```typescript
// Verify updatePreferences saves to Supabase:
const { error } = await supabase
  .from('users')
  .update(patch)
  .eq('id', userId);
```

**Fix:**
1. Verify preferences are saved to database
2. Check UserPreferencesContext fetches on login
3. Test with different accounts
4. Check RLS policies allow SELECT

---

## 🧪 Testing Checklist

Use this to verify everything works:

### Database
- [ ] Migration ran successfully
- [ ] Columns exist: `ai_tone_id`, `ai_science_mode`
- [ ] Constraint exists: `users_ai_tone_id_check`
- [ ] Index exists: `idx_users_ai_tone_id`
- [ ] RLS policies allow SELECT and UPDATE

### Onboarding
- [ ] New user sees AI preferences screen after signup
- [ ] Can select any of 22 tones
- [ ] Can toggle science mode
- [ ] "Continue" saves and navigates to Home
- [ ] "Skip" navigates to Home with defaults

### Settings
- [ ] "AI Style Preferences" card visible
- [ ] Shows current tone name
- [ ] Science mode toggle works
- [ ] Tapping "AI Tone" opens modal
- [ ] Modal shows all 22 tones
- [ ] Can select different tone
- [ ] "Save" updates and closes modal
- [ ] Success toast appears
- [ ] Changes persist after closing Settings

### Chat
- [ ] Set tone to "Warm Hug"
- [ ] AI response is empathetic and gentle
- [ ] Set tone to "Straight Shooter"
- [ ] AI response is direct and concise
- [ ] Enable science mode
- [ ] AI includes psychology insights
- [ ] Disable science mode
- [ ] AI stops including insights

### Edge Cases
- [ ] Skip onboarding → defaults work
- [ ] Log out and log in → preferences persist
- [ ] Change tone mid-conversation → next message uses new tone
- [ ] Multiple users → each has own preferences
- [ ] Invalid tone ID → falls back to balanced_blend

---

## 📞 Still Having Issues?

### Debug Steps

1. **Check Browser Console**
   ```
   Look for red errors
   Check Network tab for failed requests
   Verify UserPreferencesContext logs
   ```

2. **Check Supabase Dashboard**
   ```
   Table Editor → users → verify columns exist
   SQL Editor → run test queries
   Edge Functions → check logs
   ```

3. **Check Database Directly**
   ```sql
   -- Get user's preferences
   SELECT id, email, ai_tone_id, ai_science_mode 
   FROM users 
   WHERE email = 'your-email@example.com';
   
   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'users';
   
   -- Verify constraint
   SELECT conname FROM pg_constraint WHERE conname = 'users_ai_tone_id_check';
   ```

4. **Check Edge Function**
   ```bash
   # View logs
   supabase functions logs generate-ai-response --tail
   
   # Test directly
   curl -X POST https://your-project.supabase.co/functions/v1/generate-ai-response \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"personId":"test","personName":"Test","messages":[],"aiToneId":"warm_hug","aiScienceMode":true}'
   ```

### Get Help

If you're still stuck:
1. Check all documentation files
2. Review implementation code
3. Compare with working examples
4. Check Supabase status page
5. Verify OpenAI API is working

---

**Most issues are caused by:**
1. Migration not run (40%)
2. Edge Function not updated (30%)
3. RLS policies (15%)
4. Code not deployed (10%)
5. Other (5%)

**Start with the migration and Edge Function!**
