#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', '.cursor', 'debug.log');

function log(entry) {
  try {
    const logDir = path.dirname(LOG_PATH);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
  } catch (e) {}
}

// #region agent log
log({location:'scripts/check-ios-simulator.js:15',message:'Starting iOS simulator check',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
// #endregion

function checkXcode() {
  try {
    // #region agent log
    log({location:'scripts/check-ios-simulator.js:27',message:'Checking Xcode installation',data:{before:'checking'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion
    
    const xcodePath = execSync('xcode-select -p', { encoding: 'utf-8' }).trim();
    const xcodeVersion = execSync('xcodebuild -version', { encoding: 'utf-8' }).trim();
    
    // #region agent log
    log({location:'scripts/check-ios-simulator.js:33',message:'Xcode check result',data:{xcodePath,xcodeVersion:xcodeVersion.split('\n')[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion
    
    return { installed: true, path: xcodePath, version: xcodeVersion.split('\n')[0] };
  } catch (error) {
    // #region agent log
    log({location:'scripts/check-ios-simulator.js:40',message:'Xcode not found',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion
    
    return { installed: false, error: error.message };
  }
}

function checkSimulators() {
  try {
    // #region agent log
    log({location:'scripts/check-ios-simulator.js:49',message:'Checking available simulators',data:{before:'checking'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    
    const output = execSync('xcrun simctl list devices available', { encoding: 'utf-8' });
    const devices = output.split('\n').filter(line => line.trim() && !line.includes('=='));
    
    // #region agent log
    log({location:'scripts/check-ios-simulator.js:55',message:'Simulator check result',data:{deviceCount:devices.length,devices:devices.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    
    return { available: devices.length > 0, devices, count: devices.length };
  } catch (error) {
    // #region agent log
    log({location:'scripts/check-ios-simulator.js:62',message:'Simulator check error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    
    return { available: false, error: error.message };
  }
}

function checkSimulatorApp() {
  try {
    // #region agent log
    log({location:'scripts/check-ios-simulator.js:72',message:'Checking if Simulator.app exists',data:{before:'checking'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
    // #endregion
    
    const output = execSync('pgrep -fl Simulator || echo "not-running"', { encoding: 'utf-8' });
    const isRunning = !output.includes('not-running');
    
    // #region agent log
    log({location:'scripts/check-ios-simulator.js:78',message:'Simulator.app status',data:{isRunning,output:output.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
    // #endregion
    
    return { running: isRunning };
  } catch (error) {
    return { running: false, error: error.message };
  }
}

const xcode = checkXcode();
const simulators = checkSimulators();
const simulatorApp = checkSimulatorApp();

// #region agent log
log({location:'scripts/check-ios-simulator.js:89',message:'Diagnostic summary',data:{xcodeInstalled:xcode.installed,simulatorsAvailable:simulators.available,simulatorCount:simulators.count,simulatorAppRunning:simulatorApp.running},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'});
// #endregion

console.log('\n📱 iOS Simulator Diagnostics\n');
console.log('Xcode:', xcode.installed ? `✅ ${xcode.version}` : '❌ Not installed');
console.log('Simulators:', simulators.available ? `✅ ${simulators.count} available` : '❌ None installed');
console.log('Simulator.app:', simulatorApp.running ? '✅ Running' : '⚠️  Not running\n');

if (!xcode.installed) {
  console.log('❌ Xcode is not installed. Please install Xcode from the App Store.');
  process.exit(1);
}

if (!simulators.available) {
  console.log('❌ No iOS simulators are installed.');
  console.log('\n📖 To install simulators:');
  console.log('1. Open Xcode');
  console.log('2. Go to Xcode → Settings → Platforms (or Components)');
  console.log('3. Download at least one iOS Simulator runtime');
  console.log('4. Alternatively, run: xcodebuild -downloadPlatform iOS');
  console.log('\n💡 Opening Simulator.app to help with installation...\n');
  try {
    execSync('open -a Simulator', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Could not open Simulator.app automatically');
  }
  process.exit(1);
}

console.log('✅ iOS simulators are available and ready to use!\n');
process.exit(0);

