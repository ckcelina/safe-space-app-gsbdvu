
# Expo Server Stability - Quick Reference

## 🚀 Quick Start

```bash
# Standard start (recommended)
npm run dev

# Safe start with auto-recovery
npm run dev:safe

# Platform-specific
npm run ios
npm run android
npm run web
```

## 🧹 Maintenance Commands

```bash
# Clean caches
npm run clean

# Full reset (clean + reinstall)
npm run reset

# Manual health check
node scripts/health-check.js
```

## 🔍 Visual Health Indicator

**Location:** Top-right corner (development only)

**Status Colors:**
- 🟢 **Green** = Connected and healthy
- 🟠 **Orange** = Reconnecting
- 🔴 **Red** = Disconnected

**Tap to expand** for detailed information.

## 🛠️ Troubleshooting

### Server won't start
```bash
npm run reset
```

### Port conflicts
```bash
npx kill-port 8081 19000 19001 19002
```

### Cache issues
```bash
npm run clean
npm run dev -- --clear
```

### Watchman issues
```bash
watchman watch-del-all
```

## 📊 Monitoring

**Console Logs:**
- `[ExpoServerHealth]` - Network monitoring
- `[MetroGuard]` - Connection recovery
- `[StartupValidator]` - Startup checks
- `[Startup]` - General logs

**Log File:**
```bash
tail -f expo-server.log
```

## ⚙️ Configuration

**Location:** `utils/metroConnectionGuard.ts`

```typescript
maxRetries: 5              // Max recovery attempts
initialRetryDelay: 1000    // Initial delay (ms)
maxRetryDelay: 30000       // Max delay (ms)
enableAutoRecovery: true   // Enable/disable
```

## 🎯 Best Practices

1. ✅ Use `npm run dev` (includes health checks)
2. ✅ Monitor the health indicator
3. ✅ Run `npm run clean` daily
4. ✅ Keep Node.js 18+ updated
5. ✅ Use stable network connection

## 🆘 Emergency Recovery

```bash
# Nuclear option - fixes 99% of issues
npm run reset
npm run dev:safe
```

## 📝 Key Features

- ✅ Automatic crash recovery
- ✅ Network monitoring
- ✅ Exponential backoff retry
- ✅ Pre-flight health checks
- ✅ Visual status indicator
- ✅ Comprehensive logging
- ✅ Cache management
- ✅ Port conflict detection

## 🔗 Full Documentation

See `EXPO_SERVER_STABILITY_COMPLETE.md` for detailed information.
