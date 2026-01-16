#!/usr/bin/env node

const { execSync } = require('child_process');
function checkXcode() {
  try {
    const xcodePath = execSync('xcode-select -p', { encoding: 'utf-8' }).trim();
    const xcodeVersion = execSync('xcodebuild -version', { encoding: 'utf-8' }).trim();

    return { installed: true, path: xcodePath, version: xcodeVersion.split('\n')[0] };
  } catch (error) {
    return { installed: false, error: error.message };
  }
}

function checkSimulators() {
  try {
    const output = execSync('xcrun simctl list devices available', { encoding: 'utf-8' });
    const devices = output.split('\n').filter(line => line.trim() && !line.includes('=='));

    return { available: devices.length > 0, devices, count: devices.length };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

function checkSimulatorApp() {
  try {
    const output = execSync('pgrep -fl Simulator || echo "not-running"', { encoding: 'utf-8' });
    const isRunning = !output.includes('not-running');

    return { running: isRunning };
  } catch (error) {
    return { running: false, error: error.message };
  }
}

const xcode = checkXcode();
const simulators = checkSimulators();
const simulatorApp = checkSimulatorApp();

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

