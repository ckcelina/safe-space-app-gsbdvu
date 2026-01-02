
# Expo Server Monitoring & Testing Guide

## Overview
This guide explains how to monitor the Expo server stability system and verify it's working correctly.

## Real-Time Monitoring

### Console Log Prefixes
All stability system logs use clear prefixes for easy filtering:

- `[ExpoServerHealth]` - Network and health monitoring
- `[MetroGuard]` - Metro connection protection
- `[StartupValidator]` - Startup validation checks
- `[Startup]` - General startup logs
- `[Metro]` - Metro bundler logs

### Filter Logs by System
```bash
# In your terminal, filter logs:
# Network monitoring only
npm run dev | grep "ExpoServerHealth"

# Connection protection only
npm run dev | grep "MetroGuard"

# Startup validation only
npm run dev | grep "StartupValidator"

# All stability logs
npm run dev | grep -E "ExpoServerHealth|MetroGuard|StartupValidator|Startup"
```

## Health Status Indicators

### ✅ Healthy System
```
✅ Safe Space JS loaded
[ExpoServerHealth] ✅ Network healthy: WIFI
[ExpoServerHealth] ✅ Health monitor initialized successfully
[MetroGuard] ✅ Initial connection established
[MetroGuard] ✅ Error handler installed
[StartupValidator] Validation complete: { isValid: true, passedChecks: 4, totalChecks: 4 }
[Startup] ✅ Expo server stability systems initialized
[Startup] ✅ App loaded successfully
```

### ⚠️ Warning Signs
```
[ExpoServerHealth] ⚠️ Network disconnected
[ExpoServerHealth] ⚠️ Internet unreachable
[MetroGuard] ⚠️ Connection error detected
[MetroGuard] Attempting recovery (1/3)...
[StartupValidator] ⚠️ Some startup checks failed
```

### ❌ Critical Issues
```
[MetroGuard] ❌ Max retries exceeded, giving up
[StartupValidator] ❌ Expo Constants: Expo config not found
[StartupValidator] ❌ Platform: Error
```

## Testing Scenarios

### 1. Normal Startup Test
**Steps:**
1. Run `npm run dev`
2. Wait for server to start
3. Check console for success logs

**Expected Output:**
```
✅ Safe Space JS loaded
[ExpoServerHealth] ✅ Health monitor initialized successfully
[MetroGuard] ✅ Initial connection established
[StartupValidator] Validation complete: { isValid: true }
[Startup] ✅ Expo server stability systems initialized
```

**Pass Criteria:**
- All systems initialize successfully
- No error logs
- App loads in Expo Go

### 2. Network Change Test
**Steps:**
1. Start app with WiFi
2. Switch to cellular data
3. Switch back to WiFi
4. Check console logs

**Expected Output:**
```
[ExpoServerHealth] Network state changed: { type: 'CELLULAR', ... }
[ExpoServerHealth] Network state changed: { type: 'WIFI', ... }
[ExpoServerHealth] ✅ Network restored
```

**Pass Criteria:**
- Network changes detected
- No connection loss
- App continues working

### 3. Connection Recovery Test
**Steps:**
1. Start app normally
2. Disable WiFi briefly
3. Re-enable WiFi
4. Check recovery logs

**Expected Output:**
```
[ExpoServerHealth] ⚠️ Network disconnected
[MetroGuard] ⚠️ Connection error detected
[MetroGuard] Attempting recovery (1/3)...
[ExpoServerHealth] ✅ Network restored
[MetroGuard] ✅ Connection marked as successful
```

**Pass Criteria:**
- Disconnection detected
- Recovery attempted
- Connection restored
- App continues working

### 4. Cache Clear Test
**Steps:**
1. Run `npx expo start --clear`
2. Wait for rebuild
3. Check startup logs

**Expected Output:**
```
[Metro] Configuration loaded successfully
[Metro] Cache directory: .../node_modules/.cache/metro
✅ Safe Space JS loaded
[Startup] ✅ Expo server stability systems initialized
```

**Pass Criteria:**
- Cache cleared successfully
- Fresh build completes
- All systems initialize
- App loads normally

### 5. Hot Reload Test
**Steps:**
1. Start app normally
2. Make a small code change
3. Save file
4. Check hot reload

**Expected Output:**
```
[Metro] GET /index.bundle?...
[Metro] Bundled 123ms
[MetroGuard] ✅ Connection marked as successful
```

**Pass Criteria:**
- Changes detected
- Bundle rebuilds
- App updates without crash
- No connection errors

### 6. Tunnel Connection Test
**Steps:**
1. Run `npm run dev` (tunnel mode)
2. Scan QR code
3. Wait for app to load
4. Check connection logs

**Expected Output:**
```
[MetroGuard] Platform: ios
[MetroGuard] ✅ Initial connection established
[Startup] ✅ App loaded successfully
```

**Pass Criteria:**
- Tunnel establishes
- QR code works
- App loads successfully
- No timeout errors

### 7. LAN Connection Test
**Steps:**
1. Run `npm run dev:lan`
2. Connect via LAN URL
3. Check connection stability
4. Monitor logs

**Expected Output:**
```
[MetroGuard] ✅ Initial connection established
[ExpoServerHealth] ✅ Network healthy: WIFI
```

**Pass Criteria:**
- LAN connection works
- Faster than tunnel
- Stable connection
- No disconnections

## Monitoring Dashboard (Console)

### Create a Monitoring Script
Create `scripts/monitor-expo.sh`:

```bash
#!/bin/bash

echo "🔍 Expo Server Monitoring Dashboard"
echo "===================================="
echo ""

# Start Expo with monitoring
npm run dev 2>&1 | while read line; do
  # Color code different log types
  if [[ $line == *"✅"* ]]; then
    echo -e "\033[0;32m$line\033[0m"  # Green for success
  elif [[ $line == *"⚠️"* ]]; then
    echo -e "\033[0;33m$line\033[0m"  # Yellow for warnings
  elif [[ $line == *"❌"* ]]; then
    echo -e "\033[0;31m$line\033[0m"  # Red for errors
  elif [[ $line == *"[ExpoServerHealth]"* ]] || \
       [[ $line == *"[MetroGuard]"* ]] || \
       [[ $line == *"[StartupValidator]"* ]]; then
    echo -e "\033[0;36m$line\033[0m"  # Cyan for system logs
  else
    echo "$line"
  fi
done
```

Make it executable:
```bash
chmod +x scripts/monitor-expo.sh
```

Run it:
```bash
./scripts/monitor-expo.sh
```

## Performance Metrics

### Startup Time
**Measure:**
```
Time from "Safe Space JS loaded" to "App loaded successfully"
```

**Expected:**
- Development: < 2 seconds
- First load: < 5 seconds
- With cache: < 1 second

### Health Check Frequency
**Measure:**
```
Time between "[ExpoServerHealth]" logs
```

**Expected:**
- Network changes: Immediate
- Periodic checks: Every 30 seconds

### Recovery Time
**Measure:**
```
Time from "Connection error detected" to "Connection marked as successful"
```

**Expected:**
- First retry: ~2 seconds
- Second retry: ~4 seconds
- Third retry: ~6 seconds

## Automated Testing

### Create Test Script
Create `scripts/test-expo-stability.js`:

```javascript
#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing Expo Server Stability...\n');

const tests = [
  {
    name: 'Startup Test',
    command: 'timeout 30 npm run dev:localhost',
    check: (output) => output.includes('✅ Safe Space JS loaded'),
  },
  {
    name: 'Health Monitor Test',
    command: 'timeout 30 npm run dev:localhost',
    check: (output) => output.includes('[ExpoServerHealth] ✅'),
  },
  {
    name: 'Metro Guard Test',
    command: 'timeout 30 npm run dev:localhost',
    check: (output) => output.includes('[MetroGuard] ✅'),
  },
  {
    name: 'Validator Test',
    command: 'timeout 30 npm run dev:localhost',
    check: (output) => output.includes('[StartupValidator]'),
  },
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  console.log(`Running: ${test.name}...`);
  
  exec(test.command, (error, stdout, stderr) => {
    const output = stdout + stderr;
    
    if (test.check(output)) {
      console.log(`✅ ${test.name} PASSED\n`);
      passed++;
    } else {
      console.log(`❌ ${test.name} FAILED\n`);
      failed++;
    }
    
    if (index === tests.length - 1) {
      console.log('\n📊 Test Results:');
      console.log(`   Passed: ${passed}/${tests.length}`);
      console.log(`   Failed: ${failed}/${tests.length}`);
      process.exit(failed > 0 ? 1 : 0);
    }
  });
});
```

Run tests:
```bash
node scripts/test-expo-stability.js
```

## Continuous Monitoring

### Log to File
```bash
# Log all output to file
npm run dev 2>&1 | tee expo-server.log

# Log only stability systems
npm run dev 2>&1 | grep -E "ExpoServerHealth|MetroGuard|StartupValidator" | tee stability.log
```

### Monitor File
```bash
# Watch logs in real-time
tail -f expo-server.log

# Watch stability logs only
tail -f stability.log
```

### Analyze Logs
```bash
# Count success messages
grep -c "✅" expo-server.log

# Count warnings
grep -c "⚠️" expo-server.log

# Count errors
grep -c "❌" expo-server.log

# Show all errors
grep "❌" expo-server.log
```

## Alerts and Notifications

### Create Alert Script
Create `scripts/alert-on-error.sh`:

```bash
#!/bin/bash

npm run dev 2>&1 | while read line; do
  echo "$line"
  
  # Alert on critical errors
  if [[ $line == *"❌"* ]]; then
    # macOS notification
    osascript -e "display notification \"$line\" with title \"Expo Server Error\""
    
    # Or send to Slack/Discord/etc
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$line\"}" \
    #   YOUR_WEBHOOK_URL
  fi
done
```

## Troubleshooting Monitoring

### No Logs Appearing
1. Check if development mode: `__DEV__` should be true
2. Verify console.log is not suppressed
3. Check terminal output settings

### Logs Too Verbose
1. Filter by prefix: `grep "ExpoServerHealth"`
2. Reduce health check frequency in config
3. Disable specific systems if needed

### Performance Impact
1. All monitoring is development-only
2. Zero production overhead
3. Minimal development impact
4. Can be disabled if needed

## Best Practices

### Daily Monitoring
- Check startup logs each morning
- Review any warnings from previous day
- Clear cache weekly
- Update dependencies monthly

### Before Deployment
- Run full test suite
- Check all systems pass
- Review error logs
- Clear cache and test

### After Updates
- Test startup sequence
- Verify all systems initialize
- Check for new warnings
- Monitor for 24 hours

## Summary

The monitoring system provides:
- ✅ Real-time health status
- ✅ Automatic error detection
- ✅ Detailed diagnostics
- ✅ Performance metrics
- ✅ Automated testing
- ✅ Continuous monitoring
- ✅ Alert capabilities

All monitoring is **development-only** with **zero production impact**.
