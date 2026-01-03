
# Expo Server Quick Start Guide

## 🚀 Starting the Server

### Option 1: Safe Start (Recommended)
```bash
npm run dev
```
This uses auto-restart and health monitoring.

### Option 2: Standard Start
```bash
npm start
```
Standard Expo server with tunnel mode.

### Option 3: Local Network Only
```bash
npm run start:local
```
Faster startup, no tunnel (requires same WiFi network).

## 📱 Platform-Specific Commands

```bash
npm run ios       # Start and open iOS simulator
npm run android   # Start and open Android emulator
npm run web       # Start and open web browser
```

## 🔍 Health Check

Check if the server is running:
```bash
npm run health
```

## 🛠️ Troubleshooting

### Server Won't Start

1. **Clear cache and restart:**
   ```bash
   npm run clean
   ```

2. **Full reset (includes watchman):**
   ```bash
   npm run reset
   ```

3. **Check if port 8081 is in use:**
   ```bash
   # On macOS/Linux:
   lsof -i :8081
   
   # On Windows:
   netstat -ano | findstr :8081
   ```

4. **Kill process on port 8081:**
   ```bash
   # On macOS/Linux:
   kill -9 $(lsof -t -i:8081)
   
   # On Windows:
   # Find PID from netstat command above, then:
   taskkill /PID <PID> /F
   ```

### Common Issues

**"Metro bundler not responding"**
- Run `npm run clean` and try again
- Check if another process is using port 8081

**"Unable to resolve module"**
- Run `npm install` to ensure all dependencies are installed
- Clear cache: `npm run clean`

**"Network request failed"**
- Check your internet connection
- Try `npm run start:local` instead of tunnel mode
- Ensure your device and computer are on the same WiFi network

## 📊 Server Status

The safe-start script includes:
- ✅ Auto-restart on crash (up to 3 times)
- ✅ Health monitoring every 30 seconds
- ✅ Graceful shutdown on Ctrl+C

## 🔧 Advanced Options

### Start without tunnel (faster)
```bash
npx expo start
```

### Start with specific host
```bash
npx expo start --host tunnel
npx expo start --host lan
npx expo start --host localhost
```

### Clear Metro cache
```bash
npx expo start --clear
```

## 💡 Tips

1. **First time setup:** Run `npm install` before starting
2. **Slow startup:** Use `npm run start:local` for faster development
3. **Multiple devices:** Use tunnel mode (`npm start`) to test on devices not on your network
4. **Production testing:** Use `npm run build:web` or `npm run build:android`

## 🆘 Still Having Issues?

1. Check the terminal output for specific error messages
2. Ensure Node.js version is compatible (v18+ recommended)
3. Verify all dependencies are installed: `npm install`
4. Try deleting `node_modules` and reinstalling: `npm run clean`
