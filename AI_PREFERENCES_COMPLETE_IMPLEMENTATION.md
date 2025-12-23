
# AI Style Preferences - Complete Implementation Guide

## ✅ What's Already Implemented

The AI Style Preferences feature is **fully implemented** in your Safe Space app. Here's what's working:

### 1. Database Layer ✅
- **Table**: `public.user_preferences` exists with:
  - `user_id` (UUID, PK, FK to auth.users)
  - `ai_tone_id` (text, default 'balanced_blend')
  - `ai_science_mode` (boolean, default false)
  - RLS policies enabled
  - Check constraint for valid tone IDs

### 2. Frontend Implementation ✅

#### A. Context Provider
- **File**: `contexts/UserPreferencesContext.tsx`
- Loads preferences on login
- Provides `updatePreferences()` function
- Falls back to defaults if no preferences found
- Wrapped in `app/_layout.tsx` inside AuthProvider

#### B. AI Tone Metadata
- **File**: `constants/AITones.ts`
- 22 tone options with:
  - Display names
  - Short descriptions
  - Full system instructions
  - Category grouping (gentle/balanced/direct)
- Helper functions: `getToneById()`, `getTonesByCategory()`, `getToneSystemInstruction()`

#### C. Onboarding Screen
- **File**: `app/ai-preferences-onboarding.tsx`
- Shows after signup (before home screen)
- Displays all 22 tones grouped by category
- Science mode toggle
- Skip option available
- Saves preferences to Supabase

#### D. Settings Screen
- **File**: `app/(tabs)/settings.tsx`
- "AI Style Preferences" section
- Opens modal to change tone
- Inline toggle for science mode
- Updates immediately with toast feedback

#### E. Chat Integration
- **File**: `app/(tabs)/(home)/chat.tsx`
- Reads preferences from `useUserPreferences()`
- Passes `aiToneId` and `aiScienceMode` to Edge Function
- Includes in request body when calling `generate-ai-response`

### 3. Prompt Generation ✅
- **File**: `prompts/aiPrompt.ts`
- `generateAISystemPrompt()` function
- Injects tone instructions prominently
- Adds science mode section if enabled
- Includes conversation context (subject, grief detection)

## ⚠️ What Needs to Be Done

### **CRITICAL: Update Supabase Edge Function**

The Edge Function needs to be updated to use the AI preferences. I've created the updated version for you.

#### Step 1: Deploy the Updated Edge Function

The file `supabase-edge-function-example.ts` has been updated with:
- AI tone instructions embedded
- `aiToneId` and `aiScienceMode` parameter handling
- Enhanced system prompt generation
- Proper logging for debugging

**To deploy:**

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref zjzvkxvahrbuuyzjzxol

# 4. Create the function directory structure
mkdir -p supabase/functions/generate-ai-response

# 5. Copy the updated Edge Function code
# Copy the content from supabase-edge-function-example.ts
# to supabase/functions/generate-ai-response/index.ts

# 6. Deploy the function
supabase functions deploy generate-ai-response

# 7. Verify deployment
supabase functions list
```

#### Step 2: Verify Environment Variables

Make sure your Edge Function has the OpenAI API key:

```bash
# Set the OpenAI API key (if not already set)
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

#### Step 3: Test the Integration

1. **Open the app** and go to Settings
2. **Change the AI tone** to something distinctive (e.g., "Executive Summary" or "Warm Hug")
3. **Enable Science Mode**
4. **Go to a chat** and send a message
5. **Verify the response** matches the selected tone:
   - Executive Summary: Should be bullet points, concise
   - Warm Hug: Should be long, validating, gentle
   - Science Mode ON: Should include psychology concepts/resources

## 📋 Testing Checklist

### Frontend Tests ✅
- [x] Onboarding shows AI preferences screen after signup
- [x] Settings has "AI Style Preferences" section
- [x] Tone modal displays all 22 tones grouped by category
- [x] Science mode toggle works in settings
- [x] Preferences save to Supabase
- [x] Preferences load on login
- [x] Chat passes preferences to Edge Function

### Backend Tests (After Edge Function Deployment)
- [ ] Edge Function receives `aiToneId` parameter
- [ ] Edge Function receives `aiScienceMode` parameter
- [ ] System prompt includes tone instructions
- [ ] Science mode adds research/resources when enabled
- [ ] Different tones produce noticeably different responses
- [ ] Logs show tone ID and science mode in Edge Function

## 🔍 Debugging Guide

### If Tone Doesn't Seem to Work:

1. **Check Edge Function Logs**
   ```bash
   supabase functions logs generate-ai-response
   ```
   Look for:
   - "AI Tone ID: [tone_id]"
   - "Science Mode: true/false"
   - "System prompt length: [number]"

2. **Verify Parameters in Chat**
   - Open `app/(tabs)/(home)/chat.tsx`
   - Check the `supabase.functions.invoke()` call
   - Ensure `aiToneId` and `aiScienceMode` are in the body

3. **Test with Extreme Tones**
   - Try "Executive Summary" (should be very short, bullets)
   - Try "Warm Hug" (should be very long, validating)
   - If both sound the same, Edge Function isn't using preferences

4. **Check Supabase Table**
   ```sql
   SELECT * FROM public.user_preferences WHERE user_id = 'your_user_id';
   ```
   Verify preferences are saved correctly

### If Science Mode Doesn't Work:

1. **Enable Science Mode** in Settings
2. **Ask about a psychology topic** (e.g., "I have attachment issues")
3. **Check if response includes**:
   - Psychology concepts (e.g., "attachment theory suggests...")
   - Book recommendations
   - Research-based advice

4. **Check Edge Function logs** for "Science Mode: true"

## 📊 Feature Overview

### Available Tones (22 total)

**Gentle & Supportive:**
- Warm Hug
- Therapy Room
- Best Friend
- Nurturing Parent
- Soft Truth

**Balanced & Clear:**
- Balanced Blend (default)
- Clear Coach
- Mirror Mode
- Calm & Direct
- Detective
- Systems Thinker
- Attachment-Aware
- Cognitive Clarity
- Conflict Mediator

**Direct & Firm:**
- Tough Love
- Straight Shooter
- Executive Summary
- No Nonsense
- Reality Check
- Pattern Breaker
- Accountability Partner
- Boundary Enforcer

### Science & Resources Mode

When enabled:
- Includes reputable psychology/relationship science concepts
- Suggests 1-3 reading resources when relevant
- Uses frameworks like attachment theory, CBT, etc.
- NO fake quotes or citations

When disabled:
- Focuses on practical emotional support
- No research or resources unless user asks

## 🎯 User Flow

1. **Signup** → Theme Selection → **AI Preferences Onboarding** → Home
2. User selects tone and science mode
3. Preferences saved to `user_preferences` table
4. **Chat** loads preferences via `UserPreferencesContext`
5. Chat passes preferences to Edge Function
6. Edge Function generates customized system prompt
7. OpenAI responds with tone-appropriate message
8. User can change preferences anytime in **Settings**

## 📝 Files Modified/Created

### Created:
- `constants/AITones.ts` - Tone metadata
- `contexts/UserPreferencesContext.tsx` - State management
- `app/ai-preferences-onboarding.tsx` - Onboarding screen
- `prompts/aiPrompt.ts` - Prompt generation
- `supabase-edge-function-example.ts` - Updated Edge Function

### Modified:
- `app/(tabs)/settings.tsx` - Added AI preferences section
- `app/(tabs)/(home)/chat.tsx` - Passes preferences to Edge Function
- `app/_layout.tsx` - Wrapped UserPreferencesProvider
- `app/signup.tsx` - Navigates to AI preferences after signup

## 🚀 Next Steps

1. **Deploy the updated Edge Function** (see Step 1 above)
2. **Test with different tones** to verify it works
3. **Monitor Edge Function logs** for any errors
4. **Gather user feedback** on tone effectiveness
5. **Iterate on tone instructions** if needed

## 💡 Tips

- **Start with extreme tones** (Executive Summary vs. Warm Hug) to verify the feature works
- **Check Edge Function logs** regularly during testing
- **Science mode works best** with psychology/relationship topics
- **Tone instructions are strong** - OpenAI should follow them closely
- **Default tone is "Balanced Blend"** - good for most users

## 🆘 Support

If you encounter issues:
1. Check this guide's Debugging section
2. Review Edge Function logs
3. Verify database table structure
4. Test with a fresh user account
5. Check that preferences are being saved/loaded

---

**Status**: ✅ Frontend Complete | ⚠️ Edge Function Needs Deployment

Once you deploy the updated Edge Function, the AI Style Preferences feature will be fully functional!
