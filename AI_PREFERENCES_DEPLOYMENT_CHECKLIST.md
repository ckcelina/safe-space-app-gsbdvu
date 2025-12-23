
# AI Style Preferences - Deployment Checklist

Use this checklist to ensure the AI Preferences feature is fully deployed and working.

## ✅ Pre-Deployment

### Database
- [ ] Run `MIGRATION_ADD_AI_PREFERENCES.sql` in Supabase SQL Editor
- [ ] Verify columns exist: `SELECT ai_tone_id, ai_science_mode FROM users LIMIT 1;`
- [ ] Check constraint is valid: `SELECT conname FROM pg_constraint WHERE conname = 'users_ai_tone_id_check';`
- [ ] Verify index exists: `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_users_ai_tone_id';`

### Edge Function
- [ ] Copy updated `prompts/aiPrompt.ts` to Edge Function directory
- [ ] Update Edge Function to accept `aiToneId` and `aiScienceMode` parameters
- [ ] Update call to `generateAISystemPrompt()` with new params
- [ ] Deploy: `supabase functions deploy generate-ai-response`
- [ ] Check deployment logs for errors

### Code
- [ ] All new files are committed
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `npm run lint`
- [ ] App builds successfully: `npm run ios` or `npm run web`

## ✅ Testing

### Onboarding Flow
- [ ] Create a new test account
- [ ] Verify AI preferences screen appears after signup
- [ ] Select a tone (e.g., "Warm Hug")
- [ ] Toggle Science mode ON
- [ ] Tap "Continue"
- [ ] Verify navigation to Home screen
- [ ] Check database: tone and science mode are saved

### Settings
- [ ] Log in to existing account
- [ ] Go to Settings
- [ ] Find "AI Style Preferences" card
- [ ] Verify current tone is displayed
- [ ] Tap "AI Tone" row
- [ ] Modal opens with all 22 tones
- [ ] Select a different tone
- [ ] Tap "Save"
- [ ] Verify success toast appears
- [ ] Close and reopen Settings
- [ ] Verify new tone is displayed
- [ ] Toggle Science mode switch
- [ ] Verify success toast appears
- [ ] Check database: changes are saved

### Chat Integration
- [ ] Set tone to "Warm Hug" in Settings
- [ ] Start a new conversation
- [ ] Send a message about feeling sad
- [ ] Verify AI response is warm and empathetic
- [ ] Change tone to "Straight Shooter"
- [ ] Send another message
- [ ] Verify AI response is more direct
- [ ] Enable Science mode
- [ ] Ask about relationship patterns
- [ ] Verify AI includes psychology insights or resources

### Edge Cases
- [ ] Skip AI preferences during onboarding
- [ ] Verify default tone (Balanced Blend) is used
- [ ] Log out and log back in
- [ ] Verify preferences persist
- [ ] Change tone while in a conversation
- [ ] Verify next AI message uses new tone
- [ ] Test with free and premium accounts
- [ ] Test on iOS and web

## ✅ Post-Deployment

### Monitoring
- [ ] Check Supabase Edge Function logs for errors
- [ ] Monitor error tracking for new issues
- [ ] Check database for NULL values in new columns
- [ ] Verify no performance degradation

### User Feedback
- [ ] Monitor support emails for AI preference questions
- [ ] Check app reviews for tone-related feedback
- [ ] Track which tones are most popular (optional analytics)

### Documentation
- [ ] Share `AI_PREFERENCES_USER_GUIDE.md` with support team
- [ ] Update internal documentation
- [ ] Add to release notes

## 🐛 Rollback Plan

If critical issues arise:

### Quick Fix (Preferences not saving)
1. Check RLS policies on `users` table
2. Verify Edge Function is deployed
3. Check for typos in column names

### Full Rollback (Major issues)
1. Edge Function: Redeploy previous version
2. Database: Columns can stay (they're optional)
3. App: Revert commits for AI preferences
4. Users will default to Balanced Blend tone

## 📊 Success Metrics

After 1 week, check:
- [ ] % of users who set AI preferences during onboarding
- [ ] % of users who change preferences in Settings
- [ ] Most popular tone styles
- [ ] Science mode adoption rate
- [ ] Support tickets related to AI preferences
- [ ] User satisfaction (if surveyed)

## 🎉 Launch Announcement

Consider announcing the feature:
- In-app notification or banner
- Email to existing users
- Social media post
- App Store update notes

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Issues Encountered**: _____________

**Resolution**: _____________
