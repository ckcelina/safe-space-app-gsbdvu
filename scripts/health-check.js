
const http = require('http');

const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 8081,
    path: '/status',
    method: 'GET',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Expo server is healthy (status: ${res.statusCode})`);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });

  req.on('error', (err) => {
    console.error('❌ Expo server is not responding:', err.message);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('❌ Expo server health check timed out');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

checkServer();
