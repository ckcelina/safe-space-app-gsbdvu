
# iOS Widget Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Safe Space Home Screen widget.

## Quick Diagnostics

### Is the widget working?
1. Can you find the widget in the widget gallery? → If NO, see [Widget Not in Gallery](#widget-not-in-gallery)
2. Does the widget appear on your Home Screen? → If NO, see [Widget Won't Add](#widget-wont-add)
3. Does the widget show the correct theme? → If NO, see [Widget Shows Wrong Theme](#widget-shows-wrong-theme)
4. Does the widget update when you change themes? → If NO, see [Widget Not Updating](#widget-not-updating)

## Common Issues

### Widget Not in Gallery

**Symptoms:**
- Widget doesn't appear when searching in widget gallery
- "Safe Space" search returns no results
- Widget gallery shows other apps but not Safe Space

**Causes:**
- Widget extension not included in build
- Deployment target too low
- Build configuration error
- App not properly installed

**Solutions:**

1. **Verify Build Configuration**
   ```bash
   # Clean and rebuild
   npx expo prebuild -p ios --clean
   ```
   - Check console output for widget extension creation
   - Look for "SafeSpaceWidget" in build logs

2. **Check Xcode Project**
   - Open `ios/YourApp.xcworkspace` in Xcode
   - Verify SafeSpaceWidget target exists
   - Check target is included in scheme
   - Ensure deployment target is iOS 14.0+

3. **Verify targets.json**
   - File exists in project root
   - Contains widget configuration
   - Bundle identifier is correct
   - Deployment target is "14.0" or higher

4. **Reinstall App**
   - Delete app from device
   - Clean build folder in Xcode (Cmd+Shift+K)
   - Build and run again
   - Check widget gallery

### Widget Not Updating

**Symptoms:**
- Widget shows old theme after changing in app
- Widget doesn't reflect current app theme
- Widget stuck on one theme

**Causes:**
- App Group not configured correctly
- UserDefaults not being saved
- Widget not receiving reload signal
- iOS caching old widget data

**Solutions:**

1. **Verify App Group Configuration**
   - Open Xcode
   - Select main app target
   - Go to Signing & Capabilities
   - Check "App Groups" capability exists
   - Verify `group.com.safespace.app` is enabled
   - Repeat for SafeSpaceWidget target
   - Both must have same App Group ID

2. **Check Console Logs**
   - Run app in Xcode
   - Change theme in app
   - Look for these logs:
     ```
     [Widget] Theme data saved to shared storage: {...}
     [Widget] Widget refresh triggered after theme update
     ```
   - If missing, check WidgetContext implementation

3. **Verify Data is Being Saved**
   - Add debug code to app:
     ```typescript
     import { ExtensionStorage } from "@bacons/apple-targets";
     
     const storage = new ExtensionStorage("group.com.safespace.app");
     console.log('Saved theme:', storage.get("safe_space_theme_id"));
     ```
   - Run app and change theme
   - Check console for saved values
   - If null/undefined, storage isn't working

4. **Force Widget Refresh**
   - Remove widget from Home Screen
   - Force quit Safe Space app
   - Reopen app
   - Add widget back to Home Screen
   - Change theme
   - Check if widget updates

5. **iOS Cache Issue**
   - Restart iPhone
   - Sometimes iOS caches widget data
   - Restart clears cache

### Widget Shows Wrong Theme

**Symptoms:**
- Widget shows different theme than app
- Widget always shows pink (Soft Rose)
- Widget theme doesn't match selection

**Causes:**
- Theme data not synced
- Widget reading old data
- App Group mismatch
- Default theme being used

**Solutions:**

1. **Check Theme Mapping**
   - Verify theme IDs match between app and widget
   - App uses: OceanBlue, SoftRose, ForestGreen, SunnyYellow
   - Widget expects: ocean_blue, soft_rose, forest_green, sunny_yellow
   - Check THEME_ID_MAP in ThemeContext.tsx

2. **Verify Current Theme**
   - Open app
   - Go to Settings → Theme Selection
   - Note which theme is selected
   - Check if it matches widget
   - If not, select theme again

3. **Check UserDefaults Values**
   - Add debug code:
     ```typescript
     const storage = new ExtensionStorage("group.com.safespace.app");
     console.log('Theme ID:', storage.get("safe_space_theme_id"));
     console.log('Primary:', storage.get("safe_space_theme_primary"));
     console.log('Gradient Start:', storage.get("safe_space_theme_gradient_start"));
     console.log('Gradient End:', storage.get("safe_space_theme_gradient_end"));
     ```
   - All values should be present
   - Theme ID should match selected theme
   - Colors should be hex format (#RRGGBB)

4. **Reset Theme**
   - Change to a different theme
   - Wait 10 seconds
   - Change back to desired theme
   - Check widget

### Widget Won't Add

**Symptoms:**
- Widget appears in gallery but won't add to Home Screen
- Error when trying to add widget
- Widget disappears after adding

**Causes:**
- iOS Home Screen full
- Widget configuration error
- Entitlements issue
- iOS bug

**Solutions:**

1. **Check Home Screen Space**
   - Ensure you have space for widget
   - Small widget needs 2x2 grid
   - Medium widget needs 4x2 grid
   - Remove other widgets if needed

2. **Try Different Size**
   - If medium won't add, try small
   - If small won't add, try medium
   - Helps identify size-specific issues

3. **Restart iPhone**
   - Sometimes iOS widget system needs restart
   - Hold power button → Slide to power off
   - Wait 30 seconds
   - Turn back on
   - Try adding widget again

4. **Reinstall App**
   - Delete Safe Space app
   - Restart iPhone
   - Reinstall from App Store
   - Try adding widget

### Widget Crashes

**Symptoms:**
- Widget shows "Unable to Load"
- Widget displays error message
- Widget is blank/empty

**Causes:**
- Swift code error
- Missing data
- Entitlements issue
- iOS version incompatibility

**Solutions:**

1. **Check iOS Version**
   - Widgets require iOS 14.0+
   - Go to Settings → General → About
   - Check iOS version
   - Update if below 14.0

2. **Check Xcode Console**
   - Connect device to Mac
   - Open Xcode
   - Window → Devices and Simulators
   - Select device
   - View device logs
   - Look for SafeSpaceWidget errors

3. **Verify Swift Code**
   - Open `ios/SafeSpaceWidget/SafeSpaceWidget.swift`
   - Check for syntax errors
   - Ensure all imports are correct
   - Verify UserDefaults suite name matches

4. **Check Fallback Logic**
   - Widget should never crash if data missing
   - Should show default theme (Soft Rose)
   - Verify `defaultTheme` is defined
   - Check `loadFromUserDefaults()` has fallbacks

### Build Errors

**Symptoms:**
- Xcode build fails
- Swift compilation errors
- Entitlements errors
- Signing errors

**Solutions:**

1. **Clean Build**
   ```bash
   # Delete iOS folder
   rm -rf ios
   
   # Clean prebuild
   npx expo prebuild -p ios --clean
   ```

2. **Check Swift Syntax**
   - Open SafeSpaceWidget.swift
   - Look for red error markers
   - Fix any syntax errors
   - Common issues:
     - Missing semicolons
     - Incorrect type annotations
     - Missing imports

3. **Verify Entitlements**
   - Main app: Check Signing & Capabilities
   - Widget: Check Signing & Capabilities
   - Both must have App Groups
   - Both must use same App Group ID
   - No typos in group ID

4. **Check Signing**
   - Both targets need valid certificates
   - Both targets need provisioning profiles
   - Profiles must include App Groups
   - Use same team ID for both

5. **Update Xcode**
   - Ensure Xcode is up to date
   - Widgets require Xcode 12+
   - Update via Mac App Store

## Advanced Debugging

### Enable Verbose Logging

Add to WidgetContext.tsx:
```typescript
const updateWidgetTheme = useCallback((themeData: WidgetThemeData) => {
  console.log('[Widget] Updating theme:', themeData);
  
  if (Platform.OS === 'ios' && storage) {
    try {
      storage.set(THEME_KEYS.THEME_ID, themeData.themeId);
      console.log('[Widget] Saved theme ID:', themeData.themeId);
      
      storage.set(THEME_KEYS.THEME_PRIMARY, themeData.primaryHex);
      console.log('[Widget] Saved primary:', themeData.primaryHex);
      
      storage.set(THEME_KEYS.THEME_GRADIENT_START, themeData.gradientStartHex);
      console.log('[Widget] Saved gradient start:', themeData.gradientStartHex);
      
      storage.set(THEME_KEYS.THEME_GRADIENT_END, themeData.gradientEndHex);
      console.log('[Widget] Saved gradient end:', themeData.gradientEndHex);
      
      ExtensionStorage.reloadWidget();
      console.log('[Widget] Reload triggered');
    } catch (error) {
      console.error('[Widget] Error:', error);
    }
  }
}, []);
```

### Verify Storage Access

Add to app:
```typescript
import { ExtensionStorage } from "@bacons/apple-targets";

function testWidgetStorage() {
  const storage = new ExtensionStorage("group.com.safespace.app");
  
  // Test write
  storage.set("test_key", "test_value");
  console.log('Write test: OK');
  
  // Test read
  const value = storage.get("test_key");
  console.log('Read test:', value === "test_value" ? 'OK' : 'FAIL');
  
  // Test theme data
  console.log('Theme ID:', storage.get("safe_space_theme_id"));
  console.log('Primary:', storage.get("safe_space_theme_primary"));
  console.log('Gradient Start:', storage.get("safe_space_theme_gradient_start"));
  console.log('Gradient End:', storage.get("safe_space_theme_gradient_end"));
}
```

### Check Widget Timeline

Add to SafeSpaceWidget.swift:
```swift
func getTimeline(in context: Context, completion: @escaping (Timeline<SafeSpaceEntry>) -> Void) {
    print("[Widget] getTimeline called")
    
    let theme = WidgetThemeData.loadFromUserDefaults()
    print("[Widget] Loaded theme: \(theme.themeId)")
    
    let entry = SafeSpaceEntry(date: Date(), theme: theme)
    let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
    let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
    
    print("[Widget] Timeline created, next update: \(nextUpdate)")
    completion(timeline)
}
```

## Platform-Specific Issues

### iOS 14.x
- Widgets may take longer to update
- Try force-touching widget → Edit Widget
- Remove and re-add if stuck

### iOS 15.x
- Widget refresh is faster
- Smart Stack may hide widget
- Check Smart Stack settings

### iOS 16+
- Lock Screen widgets not supported (Home Screen only)
- Interactive widgets not yet implemented
- Standard widget behavior

### iOS 17+
- Interactive widgets available (future enhancement)
- Faster refresh times
- Better animation support

## Simulator vs Device

### Simulator Issues
- Widget updates may be slower
- App Group access can be flaky
- Some features may not work
- Always test on real device

### Device Testing
- More reliable widget behavior
- Accurate performance testing
- Real-world user experience
- Required for App Store submission

## Getting Help

### Before Contacting Support

1. **Check this guide** - Most issues are covered here
2. **Check console logs** - Look for error messages
3. **Try basic fixes** - Restart, reinstall, rebuild
4. **Test on device** - Not just simulator
5. **Document the issue** - Screenshots, logs, steps to reproduce

### Information to Provide

When reporting widget issues, include:
- iOS version
- Device model
- App version
- Steps to reproduce
- Console logs
- Screenshots
- What you've already tried

### Support Channels

1. Check documentation (IOS_WIDGET_IMPLEMENTATION.md)
2. Review user guide (WIDGET_USER_GUIDE.md)
3. Search existing issues
4. Contact support through app (Settings → Support)

## Prevention

### Best Practices

1. **Always test on device** before releasing
2. **Test all themes** to ensure they work
3. **Test widget sizes** (small and medium)
4. **Monitor console logs** during development
5. **Keep Xcode updated** to latest version
6. **Test on multiple iOS versions** if possible
7. **Document any issues** you encounter

### Regular Checks

- Verify App Group configuration after Xcode updates
- Check widget after app updates
- Test widget after iOS updates
- Monitor user feedback about widget

## Known Limitations

1. **Update Delay**: Widgets may take 5-10 seconds to update after theme change
2. **iOS Caching**: Sometimes iOS caches widget data, requiring restart
3. **Simulator**: Widget behavior less reliable in simulator
4. **Network**: Widget doesn't need network, but app does for other features
5. **Customization**: Widget text/layout not customizable by user

## Future Improvements

Planned enhancements:
- Faster update times
- Interactive widgets (iOS 17+)
- Large widget size
- Custom widget text
- Widget configuration options

---

**Still having issues?** Contact support through the app (Settings → Support) with:
- Description of the problem
- Steps to reproduce
- Screenshots
- Console logs (if available)
