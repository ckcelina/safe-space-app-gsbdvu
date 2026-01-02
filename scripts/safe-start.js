
#!/usr/bin/env node

/**
 * Safe Start Script
 * 
 * Starts the Expo server with automatic recovery and health monitoring.
 * 
 * Features:
 * - Automatic restart on crash
 * - Health monitoring
 * - Exponential backoff
 * - Graceful shutdown
 * - Process cleanup
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

let serverProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 5;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const RESTART_DELAY_BASE = 2000; // 2 seconds
let healthCheckInterval = null;
let isShuttingDown = false;

// ============================================================================
// Logging
// ============================================================================
const logFile = path.join(__dirname, '..', 'expo-server.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

// ============================================================================
// Health Check
// ============================================================================
function checkMetroHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8081/status', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// ============================================================================
// Start Server
// ============================================================================
function startServer() {
  if (isShuttingDown) {
    log('Shutdown in progress, not starting server');
    return;
  }

  log('🚀 Starting Expo server with auto-recovery...');
  log(`Restart count: ${restartCount}/${MAX_RESTARTS}`);
  
  // Calculate delay with exponential backoff
  const delay = RESTART_DELAY_BASE * Math.pow(2, restartCount);
  
  serverProcess = spawn('npx', ['expo', 'start', '--tunnel', '--clear'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_NO_TELEMETRY: '1',
      EXPO_NO_METRO_LAZY: '1',
      FORCE_COLOR: '1',
    },
  });

  serverProcess.on('exit', (code, signal) => {
    log(`Server exited with code ${code} and signal ${signal}`);
    
    if (isShuttingDown) {
      log('Shutdown complete');
      return;
    }

    if (code !== 0 && restartCount < MAX_RESTARTS) {
      restartCount++;
      log(`⚠️  Server crashed. Restarting in ${delay}ms (${restartCount}/${MAX_RESTARTS})...`);
      setTimeout(startServer, delay);
    } else if (restartCount >= MAX_RESTARTS) {
      log('❌ Max restart attempts reached. Please check logs.');
      log(`Log file: ${logFile}`);
      cleanup();
      process.exit(1);
    }
  });

  serverProcess.on('error', (error) => {
    log(`Server error: ${error.message}`);
  });

  // Reset restart count on successful start
  setTimeout(() => {
    if (serverProcess && !serverProcess.killed) {
      log('✅ Server started successfully');
      restartCount = 0;
    }
  }, 10000); // Consider successful if running for 10 seconds
}

// ============================================================================
// Health Monitoring
// ============================================================================
function startHealthMonitoring() {
  log('Starting health monitoring...');
  
  healthCheckInterval = setInterval(async () => {
    if (isShuttingDown) {
      return;
    }

    const isHealthy = await checkMetroHealth();
    
    if (!isHealthy && serverProcess && !serverProcess.killed) {
      log('⚠️  Metro server unresponsive. Restarting...');
      serverProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if not terminated
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          log('Force killing unresponsive server...');
          serverProcess.kill('SIGKILL');
        }
      }, 5000);
    } else if (isHealthy) {
      log('✅ Health check passed');
    }
  }, HEALTH_CHECK_INTERVAL);
}

// ============================================================================
// Cleanup
// ============================================================================
function cleanup() {
  log('Cleaning up...');
  
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
  
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================
function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }
  
  isShuttingDown = true;
  log(`\n👋 Received ${signal}. Shutting down gracefully...`);
  
  cleanup();
  
  setTimeout(() => {
    log('Shutdown complete');
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  log(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`);
});

// ============================================================================
// Start
// ============================================================================
log('═══════════════════════════════════════════════════');
log('Expo Safe Start');
log('═══════════════════════════════════════════════════');
log(`Log file: ${logFile}`);
log(`Max restarts: ${MAX_RESTARTS}`);
log(`Health check interval: ${HEALTH_CHECK_INTERVAL}ms`);
log('═══════════════════════════════════════════════════\n');

startServer();
startHealthMonitoring();
