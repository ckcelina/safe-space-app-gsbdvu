
# Expo Go Connection Fix Guide

## Current Status
✅ **Expo server IS running** - Metro bundler is working correctly
✅ Configuration is correct
✅ No code errors blocking startup

## Issue
The Expo development server is running, but you may not be able to connect with Expo Go.

## Solutions (Try in order)

### 1. Check Terminal Output
Look for the QR code and connection URLs in your terminal. You should see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### 2. Try Different Connection Methods

#### Option A: Use LAN instead of Tunnel
```bash
npm run dev
# Then press 's' to switch to LAN mode
```

#### Option B: Use Direct IP Connection
1. In terminal, note your local IP (e.g., `exp://192.168.1.100:8081`)
2. Open Expo Go app
3. Tap "Enter URL manually"
4. Enter the exp:// URL

#### Option C: Restart with Different Flags
```bash
# Stop current server (Ctrl+C)
# Try without tunnel:
npx expo start --clear

# Or try with LAN:
npx expo start --clear --lan
```

### 3. Verify Expo Go App
- Make sure Expo Go is installed and updated on your device
- iOS: Download from App Store
- Android: Download from Google Play Store

### 4. Network Troubleshooting
- Ensure your phone and computer are on the **same WiFi network**
- Disable VPN if active
- Check firewall settings aren&apos;t blocking port 8081

### 5. Clear Expo Cache
```bash
# Stop server, then:
npx expo start --clear --reset-cache
```

### 6. Reinstall Expo CLI (if needed)
```bash
npm install -g expo-cli@latest
```

## Quick Test
1. Open terminal where you ran `npm run dev`
2. Press `w` to open in web browser - this confirms the server is working
3. If web works, the issue is device connection, not the server

## Current Server Status
Your server is running successfully at:
- Web bundled successfully (8258ms)
- Metro is serving requests
- No critical errors in logs

## Next Steps
1. Check if you can see the QR code in terminal
2. Try opening in web browser (press `w`)
3. If web works, focus on device connection
4. Try LAN mode instead of tunnel mode

## Still Having Issues?
The server is confirmed working. The issue is likely:
- Network connectivity between device and computer
- Expo Go app needs update
- Firewall blocking connections
