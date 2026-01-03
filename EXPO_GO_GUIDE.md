# How to Run Safe Space App on Your Phone with Expo Go

## 🚀 Quick Start (Recommended)

### Method 1: Using LAN Connection (Fastest & Most Reliable)

**Requirements:**
- Your computer and phone must be on the **same WiFi network**
- Expo Go app installed on your phone

**Steps:**

1. **Start the dev server without tunnel:**
```bash
npx expo start
```

2. **On your phone:**
   - Open **Expo Go** app
   - On iOS: Tap "Scan QR Code" and scan the QR in your terminal
   - On Android: The app should appear automatically, or scan the QR

3. **If QR doesn't work:**
   - Look for the Metro Bundler URL in the terminal (e.g., `exp://192.168.1.100:8081`)
   - In Expo Go, tap "Enter URL manually"
   - Type the URL shown in your terminal

---

## Method 2: Using Tunnel (If Different Networks)

**Use this if your phone and computer are on different networks**

1. **Start with tunnel mode:**
```bash
npx expo start --tunnel
```

2. **Wait for ngrok to connect** (may take 30-60 seconds)
   - If it times out, try again - ngrok can be slow sometimes

3. **Scan the QR code** or use the `exp://` URL provided

---

## Method 3: Direct Development Build (Most Reliable)

**If tunnels keep failing, use Expo Go with direct connection:**

1. **Find your computer's local IP:**
```bash
# On Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows:
ipconfig | findstr "IPv4"
```

2. **Start Expo:**
```bash
npx expo start --host lan
```

3. **Manually enter URL in Expo Go:**
   - Format: `exp://YOUR_IP:8081`
   - Example: `exp://192.168.1.100:8081`

---

## Method 4: Using Natively (Your Current Setup)

**If Natively still isn't working, try these fixes:**

1. **Update package.json script:**
```json
{
  "scripts": {
    "dev": "EXPO_NO_TELEMETRY=1 expo start --clear",
    "dev:tunnel": "EXPO_NO_TELEMETRY=1 expo start --clear --tunnel",
    "dev:lan": "EXPO_NO_TELEMETRY=1 expo start --clear --lan"
  }
}
```

2. **Run with LAN instead of tunnel:**
```bash
npm run dev:lan
```

3. **Let Natively handle the connection** (should auto-connect to Expo Go)

---

## 📱 Expo Go Setup

**Make sure you have Expo Go installed:**
- **iOS**: [Expo Go on App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Expo Go on Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## 🔧 Troubleshooting

### Issue: "ngrok tunnel took too long to connect"

**Solution:**
```bash
# Use LAN instead
npx expo start --lan
```

### Issue: "Unable to connect to Expo Go"

**Solutions:**
1. Make sure phone and computer are on same WiFi
2. Disable VPN on both devices
3. Check firewall isn't blocking port 8081
4. Try restarting Expo server: `Ctrl+C` then start again

### Issue: Metro Bundler shows network errors

**This is OK!** The errors you see are just Expo trying to check for updates online. They won't affect local development.

**Just ignore these and proceed to scan the QR code:**
```
TypeError: fetch failed
```

### Issue: App loads but shows blank screen

**Solution:**
1. Check the error logs in Expo Go
2. Check Metro Bundler terminal for JavaScript errors
3. Try clearing cache: `npx expo start --clear`

---

## ✅ Recommended Workflow

**For everyday development:**

```bash
# Start in one terminal
npx expo start --lan

# Keep terminal open and scan QR in Expo Go
# App will auto-reload when you save files
```

**For testing with others (different networks):**

```bash
# Use tunnel mode
npx expo start --tunnel

# Share the exp:// URL with testers
```

---

## 🎯 What Should Happen

Once connected successfully, you should see:

1. **In Terminal:**
   ```
   Metro Bundler ready
   exp://192.168.1.100:8081
   ```

2. **On Phone:**
   - App loads in Expo Go
   - You see your Safe Space app login screen
   - Any code changes auto-reload

---

## 🆘 Still Having Issues?

Try this step-by-step:

1. **Stop all Expo processes:**
```bash
pkill -f expo
pkill -f metro
```

2. **Clear Expo cache:**
```bash
npx expo start --clear
```

3. **Make sure phone and computer are on same WiFi**

4. **Open Expo Go on phone FIRST**

5. **Then start the server:**
```bash
npx expo start --lan
```

6. **Scan QR or enter URL manually**

---

## 💡 Pro Tips

- **Fast Refresh**: Save files and app updates automatically
- **Shake Device**: Opens developer menu in Expo Go
- **Remote Debugging**: Shake → Debug Remote JS
- **Element Inspector**: Shake → Toggle Element Inspector

---

**Need help?** Check these common connection modes:
- `--lan` - Local network (fastest, same WiFi required)
- `--localhost` - Same computer only
- `--tunnel` - Works across networks (slower, may timeout)
- No flag - Auto-detects best option
