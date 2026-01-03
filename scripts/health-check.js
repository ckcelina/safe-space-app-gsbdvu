
/**
 * Expo Server Health Check Script
 * 
 * Runs comprehensive pre-flight checks before starting the Expo server
 * to ensure a stable development environment.
 * 
 * Checks:
 * 1. Node modules installation
 * 2. Cache cleanup (Metro, Expo)
 * 3. Watchman cache (if available)
 * 4. Port availability
 * 5. Node version compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

console.log('🔍 Running pre-flight health checks...\n');

// ============================================================================
// Check 1: Node modules
// ============================================================================
console.log('📦 Checking node_modules...');
if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
  console.error('❌ node_modules not found. Run: npm install');
  process.exit(1);
}
console.log('✅ node_modules found\n');

// ============================================================================
// Check 2: Node version
// ============================================================================
console.log('🔧 Checking Node version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.warn(`⚠️  Node ${nodeVersion} detected. Node 18+ recommended.`);
} else {
  console.log(`✅ Node ${nodeVersion}\n`);
}

// ============================================================================
// Check 3: Clear stale Metro cache
// ============================================================================
console.log('🧹 Clearing Metro cache...');
const metroCache = path.join(__dirname, '..', 'node_modules', '.cache', 'metro');
if (fs.existsSync(metroCache)) {
  try {
    fs.rmSync(metroCache, { recursive: true, force: true });
    console.log('✅ Metro cache cleared\n');
  } catch (error) {
    console.warn('⚠️  Failed to clear Metro cache:', error.message, '\n');
  }
} else {
  console.log('✅ Metro cache already clean\n');
}

// ============================================================================
// Check 4: Clear .expo cache
// ============================================================================
console.log('🧹 Clearing .expo cache...');
const expoCache = path.join(__dirname, '..', '.expo');
if (fs.existsSync(expoCache)) {
  try {
    fs.rmSync(expoCache, { recursive: true, force: true });
    console.log('✅ .expo cache cleared\n');
  } catch (error) {
    console.warn('⚠️  Failed to clear .expo cache:', error.message, '\n');
  }
} else {
  console.log('✅ .expo cache already clean\n');
}

// ============================================================================
// Check 5: Watchman (optional but recommended)
// ============================================================================
console.log('👁️  Checking Watchman...');
try {
  execSync('watchman watch-del-all', { stdio: 'ignore' });
  console.log('✅ Watchman cache cleared\n');
} catch (e) {
  console.log('⚠️  Watchman not available (optional)\n');
}

// ============================================================================
// Check 6: Port availability
// ============================================================================
console.log('🔌 Checking port availability...');
const portsToCheck = [8081, 19000, 19001, 19002];
let portsInUse = [];

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      portsInUse.push(port);
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

(async () => {
  for (const port of portsToCheck) {
    const isAvailable = await checkPort(port);
    if (!isAvailable) {
      console.log(`⚠️  Port ${port} is in use`);
    }
  }

  if (portsInUse.length > 0) {
    console.log('\n⚠️  Some ports are in use. Expo will try to use alternative ports.');
    console.log('   If you experience issues, try: npx kill-port', portsInUse.join(' '));
  } else {
    console.log('✅ All ports available\n');
  }

  // ============================================================================
  // Check 7: Disk space
  // ============================================================================
  console.log('💾 Checking disk space...');
  try {
    if (process.platform !== 'win32') {
      const df = execSync('df -h .', { encoding: 'utf8' });
      const lines = df.split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        const available = parts[3];
        console.log(`✅ Available disk space: ${available}\n`);
      }
    } else {
      console.log('✅ Disk space check skipped on Windows\n');
    }
  } catch (error) {
    console.log('⚠️  Could not check disk space\n');
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Health checks passed!');
  console.log('═══════════════════════════════════════════════════\n');
})();
