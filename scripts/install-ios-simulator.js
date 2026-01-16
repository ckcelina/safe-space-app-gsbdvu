#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('\n📥 Installing iOS Simulator Runtime...\n');

try {
  // Try the modern approach: xcodebuild -downloadPlatform
  console.log('Attempting to download iOS simulator runtime...');
  console.log('This may take several minutes depending on your internet connection...\n');
  
  execSync('xcodebuild -downloadPlatform iOS', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('\n✅ iOS Simulator runtime downloaded successfully!\n');
} catch (error) {
  console.log('\n⚠️  Automatic download failed. Please install manually:\n');
  console.log('1. Open Xcode');
  console.log('2. Go to Xcode → Settings (Preferences) → Platforms');
  console.log('3. Click the "+" button or download iOS runtime');
  console.log('4. Wait for download to complete\n');
  console.log('Alternative: Use xcode-select --install if command line tools are missing\n');
  process.exit(1);
}

