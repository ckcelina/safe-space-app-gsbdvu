
# iOS Widget Setup Checklist

Use this checklist to ensure the iOS Home Screen widget is properly configured and working.

## Pre-Build Checklist

### 1. Dependencies
- [ ] `@bacons/apple-targets` is installed (check package.json)
- [ ] Version is ^3.0.2 or higher
- [ ] Run `npm install` if needed

### 2. Configuration Files
- [ ] `app.json` includes `@bacons/apple-targets` plugin
- [ ] `app.json` has iOS entitlements for App Group
- [ ] `targets.json` exists with widget configuration
- [ ] App Group ID is consistent across all files

### 3. Context Files
- [ ] `contexts/WidgetContext.tsx` is updated with shared storage
- [ ] `contexts/ThemeContext.tsx` triggers widget updates
- [ ] App Group ID matches in both contexts
- [ ] Platform checks are in place (iOS only)

### 4. Widget Files
- [ ] `ios/SafeSpaceWidget/SafeSpaceWidget.swift` exists
- [ ] `ios/SafeSpaceWidget/Info.plist` exists
- [ ] Swift code compiles without errors
- [ ] App Group ID matches in Swift code

## Build Checklist

### 1. Prebuild
```bash
# Clean prebuild
npx expo prebuild -p ios --clean

# Check for errors in output
# Look for widget extension creation
```

- [ ] Prebuild completes without errors
- [ ] Widget extension folder created in ios/
- [ ] No warnings about missing entitlements

### 2. Xcode Configuration
```bash
# Open project in Xcode
open ios/YourApp.xcworkspace
```

- [ ] Main app target has App Groups capability
- [ ] `group.com.safespace.app` is enabled for main app
- [ ] SafeSpaceWidget extension target exists
- [ ] Widget extension has App Groups capability
- [ ] `group.com.safespace.app` is enabled for widget
- [ ] Both targets use same App Group ID

### 3. Signing
- [ ] Main app target has valid signing certificate
- [ ] Widget extension has valid signing certificate
- [ ] Both targets use same team ID
- [ ] Provisioning profiles include App Groups

### 4. Build
- [ ] Project builds successfully in Xcode
- [ ] No Swift compilation errors
- [ ] No entitlement errors
- [ ] Widget extension is included in build

## Testing Checklist

### 1. Widget Availability
- [ ] Build and run app on device or simulator
- [ ] Long press Home Screen
- [ ] Tap "+" button
- [ ] Search for "Safe Space"
- [ ] Widget appears in gallery
- [ ] Both small and medium sizes available

### 2. Widget Appearance
- [ ] Add small widget to Home Screen
- [ ] Widget shows Safe Space logo
- [ ] Widget has gradient background
- [ ] Add medium widget to Home Screen
- [ ] Widget shows logo, title, and subtitle
- [ ] Colors match default theme (Soft Rose)

### 3. Theme Updates
- [ ] Open Safe Space app
- [ ] Go to Settings → Theme Selection
- [ ] Change to Ocean Blue
- [ ] Return to Home Screen
- [ ] Widget updates to blue gradient (within 10 seconds)
- [ ] Repeat for Forest Green
- [ ] Widget updates to green gradient
- [ ] Repeat for Sunny Yellow
- [ ] Widget updates to yellow gradient
- [ ] Change back to Soft Rose
- [ ] Widget updates to pink gradient

### 4. Data Persistence
- [ ] Change theme to Ocean Blue
- [ ] Force quit app
- [ ] Check widget still shows Ocean Blue
- [ ] Restart device
- [ ] Check widget still shows Ocean Blue
- [ ] Open app
- [ ] Verify theme is still Ocean Blue

### 5. Fallback Behavior
- [ ] Delete app (removes all data)
- [ ] Add widget to Home Screen
- [ ] Widget shows default theme (Soft Rose)
- [ ] Reinstall app
- [ ] Select Forest Green theme
- [ ] Widget updates to Forest Green

### 6. Edge Cases
- [ ] Test with airplane mode on
- [ ] Widget still works (no network needed)
- [ ] Test with low battery mode
- [ ] Widget still updates
- [ ] Test with multiple widgets
- [ ] All widgets show same theme
- [ ] Test rapid theme changes
- [ ] Widget updates correctly

## Debugging Checklist

### 1. Console Logs
- [ ] Check Xcode console for widget logs
- [ ] Look for "[Widget]" prefixed messages
- [ ] Verify theme data is being saved
- [ ] Check for storage errors

### 2. UserDefaults Verification
Add this code to verify data:
```typescript
import { ExtensionStorage } from "@bacons/apple-targets";

const storage = new ExtensionStorage("group.com.safespace.app");
console.log('Theme ID:', storage.get("safe_space_theme_id"));
console.log('Primary:', storage.get("safe_space_theme_primary"));
console.log('Gradient Start:', storage.get("safe_space_theme_gradient_start"));
console.log('Gradient End:', storage.get("safe_space_theme_gradient_end"));
```

- [ ] Theme ID is correct format (ocean_blue, soft_rose, etc.)
- [ ] Primary color is hex format (#RRGGBB)
- [ ] Gradient colors are hex format
- [ ] Values update when theme changes

### 3. Common Issues

**Widget not updating:**
- [ ] Check App Group ID matches everywhere
- [ ] Verify entitlements are correct
- [ ] Try removing and re-adding widget
- [ ] Force quit and reopen app
- [ ] Restart device

**Widget not in gallery:**
- [ ] Check widget extension is in build
- [ ] Verify targets.json is correct
- [ ] Clean build and rebuild
- [ ] Check deployment target (iOS 14.0+)

**Build errors:**
- [ ] Run `npx expo prebuild -p ios --clean`
- [ ] Delete ios/ folder and prebuild again
- [ ] Check Swift syntax
- [ ] Verify bundle identifiers

## Production Checklist

### 1. App Store Preparation
- [ ] Widget screenshots captured
- [ ] Small widget screenshot
- [ ] Medium widget screenshot
- [ ] Multiple themes shown
- [ ] Widget mentioned in app description
- [ ] Privacy policy updated (if needed)

### 2. Testing
- [ ] Test on physical device (not just simulator)
- [ ] Test on multiple iOS versions (14.0+)
- [ ] Test on different iPhone models
- [ ] Test on iPad
- [ ] Test all themes
- [ ] Test all widget sizes

### 3. Documentation
- [ ] User guide created (WIDGET_USER_GUIDE.md)
- [ ] Implementation docs created (IOS_WIDGET_IMPLEMENTATION.md)
- [ ] Setup checklist completed (this file)
- [ ] Known issues documented

### 4. Submission
- [ ] Widget works in TestFlight build
- [ ] Beta testers can add widget
- [ ] No crashes reported
- [ ] Theme updates work reliably
- [ ] Ready for App Store submission

## Post-Launch Checklist

### 1. Monitoring
- [ ] Monitor crash reports for widget issues
- [ ] Check user feedback about widget
- [ ] Track widget adoption rate
- [ ] Monitor theme change frequency

### 2. Support
- [ ] Support team trained on widget features
- [ ] Common issues documented
- [ ] Troubleshooting guide available
- [ ] User guide accessible in app

### 3. Future Improvements
- [ ] Collect user feedback
- [ ] Plan widget enhancements
- [ ] Consider additional widget sizes
- [ ] Explore interactive widgets (iOS 17+)

## Sign-Off

- [ ] All checklist items completed
- [ ] Widget tested and working
- [ ] Documentation complete
- [ ] Ready for production

**Completed by:** _______________
**Date:** _______________
**Notes:** _______________

---

## Quick Reference

**App Group ID:** `group.com.safespace.app`

**UserDefaults Keys:**
- `safe_space_theme_id`
- `safe_space_theme_primary`
- `safe_space_theme_gradient_start`
- `safe_space_theme_gradient_end`

**Theme IDs:**
- `ocean_blue`
- `soft_rose` (default)
- `forest_green`
- `sunny_yellow`

**Minimum iOS Version:** 14.0

**Supported Widget Sizes:** Small, Medium

**Files to Check:**
- `contexts/WidgetContext.tsx`
- `contexts/ThemeContext.tsx`
- `ios/SafeSpaceWidget/SafeSpaceWidget.swift`
- `app.json`
- `targets.json`
