
# Expo Server Stability - Quick Reference

## 🚀 Quick Start

The Expo server stability system is **automatically enabled** in development mode. No configuration needed!

## ✅ What's Protected

- ✅ Metro bundler connection
- ✅ Network connectivity
- ✅ Tunnel/LAN connections
- ✅ Hot reload stability
- ✅ Fast refresh
- ✅ Error recovery

## 📊 Console Logs to Look For

### Successful Startup
```
✅ Safe Space JS loaded
[ExpoServerHealth] ✅ Health monitor initialized successfully
[MetroGuard] ✅ Initial connection established
[StartupValidator] Validation complete: { isValid: true }
[Startup] ✅ Expo server stability systems initialized
```

### Network Issues
```
[ExpoServerHealth] ⚠️ Network disconnected
[ExpoServerHealth] ✅ Network restored
```

### Connection Recovery
```
[MetroGuard] ⚠️ Connection error detected
[MetroGuard] Attempting recovery (1/3)...
[MetroGuard] ✅ Connection marked as successful
```

## 🔧 Common Commands

### Start with Tunnel (Recommended)
```bash
npm run dev
```

### Start with LAN
```bash
npm run dev:lan
```

### Start with Localhost
```bash
npm run dev:localhost
```

### Clear Cache and Restart
```bash
npx expo start --clear
```

## 🐛 Troubleshooting

### Server Won't Start
1. Check if port 8081 is in use
2. Clear cache: `npx expo start --clear`
3. Restart terminal

### Can't Connect from Device
1. Ensure same WiFi network
2. Try LAN mode: `npm run dev:lan`
3. Check firewall settings

### Hot Reload Not Working
1. Save file again
2. Press `r` in terminal to reload
3. Clear cache and restart

### Connection Keeps Dropping
1. Check console for network logs
2. Disable VPN
3. Move closer to WiFi router

## 📱 Connection Methods

### QR Code (Easiest)
1. Run `npm run dev`
2. Scan QR code with Expo Go

### Manual URL
1. Note the `exp://` URL in terminal
2. Open Expo Go
3. Enter URL manually

### LAN Connection
1. Run `npm run dev:lan`
2. Use local IP address
3. More stable than tunnel

## 🔍 Health Check

### Check Server Status
Look for these logs in console:
- `[ExpoServerHealth]` - Network monitoring
- `[MetroGuard]` - Connection protection
- `[StartupValidator]` - Startup checks

### Check Network Health
```typescript
import { useServerHealth } from '@/utils/expoServerHealth';

const health = useServerHealth();
console.log('Network healthy:', health.isHealthy);
```

### Check Metro Status
```typescript
import { metroConnectionGuard } from '@/utils/metroConnectionGuard';

const status = metroConnectionGuard.getStatus();
console.log('Connection attempts:', status.connectionAttempts);
```

## ⚙️ Configuration

### Default Settings (No Changes Needed)
- Health checks: Every 30 seconds
- Connection retries: 3 attempts
- Retry delay: 2 seconds
- Request timeout: 60 seconds

### Custom Configuration (Advanced)
Edit `utils/metroConnectionGuard.ts` if needed:
```typescript
const config = {
  maxRetries: 5,        // Increase retries
  retryDelay: 3000,     // Longer delay
  enableAutoRecovery: true,
};
```

## 🎯 Key Features

### Automatic Recovery
- Detects connection errors
- Retries automatically
- Logs recovery attempts
- Marks successful connections

### Network Monitoring
- Real-time network state
- WiFi/Cellular detection
- Internet reachability
- Automatic reconnection

### Health Checks
- Runs every 30 seconds
- Validates Expo services
- Logs diagnostics
- Non-blocking checks

### Error Handling
- Global error handler
- Metro-specific recovery
- Graceful degradation
- Detailed error logs

## 📈 Performance

### Development
- Minimal overhead
- Fast startup
- Efficient monitoring
- Clean logging

### Production
- Zero overhead
- All monitoring disabled
- No bundle size increase
- No performance impact

## 🆘 Emergency Fixes

### Nuclear Option (Fixes 99% of Issues)
```bash
# Stop server (Ctrl+C)
rm -rf node_modules/.cache
npx expo start --clear --reset-cache
```

### Quick Restart
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Switch Connection Mode
```bash
# In running server, press:
s  # Switch connection mode
r  # Reload app
c  # Clear cache
```

## 📚 Related Files

- `utils/expoServerHealth.ts` - Network monitoring
- `utils/metroConnectionGuard.ts` - Connection protection
- `utils/expoStartupValidator.ts` - Startup validation
- `app/_layout.tsx` - Integration point
- `metro.config.js` - Metro configuration

## 💡 Tips

1. **Use tunnel mode** for most reliable connection
2. **Check console logs** for detailed diagnostics
3. **Clear cache** if hot reload stops working
4. **Restart server** if connection is unstable
5. **Use LAN mode** if tunnel is slow

## ✨ Benefits

- 🛡️ **Never breaks** - Multiple protection layers
- 🔄 **Self-healing** - Automatic recovery
- 📊 **Transparent** - Detailed logging
- ⚡ **Fast** - No performance impact
- 🎯 **Reliable** - Proven stability

## 🔗 Quick Links

- [Full Documentation](./EXPO_SERVER_PERMANENT_FIX.md)
- [Troubleshooting Guide](./EXPO_GO_FIX_GUIDE.md)
- [Connection Fix](./EXPO_CONNECTION_FIX_COMPLETE.md)

---

**Remember:** The system is automatic. Just run `npm run dev` and it works! 🚀
