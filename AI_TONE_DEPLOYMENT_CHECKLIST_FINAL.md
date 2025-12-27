
# AI Tone Deployment Checklist

## Pre-Deployment

- [x] Code changes completed in `supabase/functions/generate-ai-response/index.ts`
- [x] All 23 tones mapped to detailed instructions
- [x] Documentation created
- [x] No schema changes required
- [x] No UI changes required
- [x] Apple App Store compliance verified

## Deployment Steps

### 1. Deploy Edge Function
- [ ] Deploy `generate-ai-response` Edge Function to Supabase
  ```bash
  supabase functions deploy generate-ai-response
  ```
- [ ] Verify deployment succeeded (no errors in output)
- [ ] Check Edge Function appears in Supabase Dashboard

### 2. Verify Deployment
- [ ] Check Edge Function logs for startup errors
  ```bash
  supabase functions logs generate-ai-response
  ```
- [ ] Verify function is active and responding
- [ ] Test with a simple API call

### 3. Test Primary Tones (6)
- [ ] **Warm & Supportive** - Test gentle, validating response
- [ ] **Balanced & Clear** - Test balanced empathy + practical response
- [ ] **Reflective** - Test mirroring and pattern-highlighting response
- [ ] **Calm & Direct** - Test concise, solution-focused response
- [ ] **Reality Check** - Test respectful challenge response
- [ ] **Goal Support** - Test accountability-focused response

### 4. Test Advanced Tones (Sample)
- [ ] **Detective** - Test question-heavy response
- [ ] **Executive Summary** - Test bullet-point response
- [ ] **Boundary Enforcer** - Test firm boundary-setting response

### 5. Test Edge Cases
- [ ] Tone switching mid-conversation works
- [ ] Multiple messages maintain tone consistency
- [ ] Long conversations maintain tone
- [ ] Different subjects maintain tone
- [ ] Unknown tone ID triggers fallback

### 6. Verify Compliance
- [ ] No medical language in any tone
- [ ] No diagnostic claims in any tone
- [ ] All tones remain supportive
- [ ] All tones remain non-judgmental
- [ ] All tones empower user choice

## Post-Deployment

### 7. Monitor
- [ ] Check Edge Function logs for errors (first 24 hours)
- [ ] Monitor user feedback on tone effectiveness
- [ ] Track any tone-related support tickets
- [ ] Verify no increase in error rates

### 8. Document
- [ ] Update internal documentation with deployment date
- [ ] Share testing guide with QA team
- [ ] Update user-facing documentation if needed
- [ ] Create release notes

## Rollback Plan

If issues are detected:

1. **Immediate:** Revert Edge Function to previous version
   ```bash
   # Redeploy previous version
   supabase functions deploy generate-ai-response --version <previous-version>
   ```

2. **Investigate:** Check logs for specific errors
   ```bash
   supabase functions logs generate-ai-response --tail
   ```

3. **Fix:** Address issues in code

4. **Redeploy:** Deploy fixed version

## Success Criteria

✅ **Deployment successful when:**
- [ ] Edge Function deployed without errors
- [ ] All primary tones tested and working
- [ ] Sample advanced tones tested and working
- [ ] Tone switching works correctly
- [ ] No compliance issues detected
- [ ] No increase in error rates
- [ ] User feedback is positive

## Testing Script

Use this quick script to verify deployment:

```
1. Open app
2. Go to Settings → AI Preferences
3. Select "Warm & Supportive"
4. Start conversation: "I'm feeling overwhelmed"
5. Verify: Response is gentle and validating ✓
6. Select "Calm & Direct"
7. Send: "I don't know what to do"
8. Verify: Response is concise and solution-focused ✓
9. Select "Reality Check"
10. Send: "They said they'd change but nothing's different"
11. Verify: Response challenges gently and grounds in reality ✓
```

If all 3 tests pass, deployment is successful.

## Contact

**Issues or Questions:**
- Check Edge Function logs first
- Review `AI_TONE_TROUBLESHOOTING.md`
- Check `AI_TONE_TESTING_GUIDE.md` for examples

## Timeline

- **Code Complete:** ✅ Done
- **Documentation:** ✅ Done
- **Deployment:** ⏳ Pending
- **Testing:** ⏳ Pending
- **Monitoring:** ⏳ Pending
- **Sign-off:** ⏳ Pending

## Sign-off

- [ ] Developer: Code reviewed and tested locally
- [ ] QA: All test cases passed
- [ ] Product: Tone effectiveness verified
- [ ] Compliance: Apple App Store guidelines met
- [ ] DevOps: Edge Function deployed successfully

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
