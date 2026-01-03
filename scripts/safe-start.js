
const { spawn } = require('child_process');
const http = require('http');

let expoProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 3;

const checkHealth = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8081/status', { timeout: 2000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
};

const startExpo = () => {
  console.log('🚀 Starting Expo server...');
  console.log('📱 Use Expo Go app to scan the QR code');
  console.log('🌐 Or press w to open in web browser');
  console.log('');
  
  expoProcess = spawn('npx', ['expo', 'start', '--tunnel'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, EXPO_NO_TELEMETRY: '1' }
  });

  expoProcess.on('exit', (code) => {
    if (code !== 0 && restartCount < MAX_RESTARTS) {
      restartCount++;
      console.log('');
      console.log(`⚠️  Expo server stopped unexpectedly. Restarting (${restartCount}/${MAX_RESTARTS})...`);
      console.log('');
      setTimeout(startExpo, 2000);
    } else if (restartCount >= MAX_RESTARTS) {
      console.error('');
      console.error('❌ Max restarts reached. Please check for errors above.');
      console.error('💡 Try running: npm start');
      console.error('');
      process.exit(1);
    }
  });
};

const monitorHealth = async () => {
  setInterval(async () => {
    const healthy = await checkHealth();
    if (!healthy && expoProcess) {
      console.log('');
      console.log('⚠️  Server health check failed, restarting...');
      console.log('');
      expoProcess.kill();
    }
  }, 30000);
};

process.on('SIGINT', () => {
  console.log('');
  console.log('👋 Shutting down Expo server...');
  if (expoProcess) expoProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('👋 Shutting down Expo server...');
  if (expoProcess) expoProcess.kill();
  process.exit(0);
});

startExpo();
setTimeout(monitorHealth, 10000);
