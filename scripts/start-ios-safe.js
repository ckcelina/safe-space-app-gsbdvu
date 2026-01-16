#!/usr/bin/env node

const { spawn } = require('child_process');

const RUN_ID = 'run4';

function sendLog(message, data, hypothesisId, location) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: RUN_ID,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

sendLog(
  'start-ios-safe begin',
  { command: 'expo start', platform: 'ios' },
  'H6',
  'scripts/start-ios-safe.js:24'
);

const expo = spawn('expo', ['start'], {
  env: { ...process.env, EXPO_NO_TELEMETRY: '1' },
  stdio: ['inherit', 'pipe', 'pipe'],
});

sendLog(
  'expo start spawned',
  { pid: expo.pid },
  'H6',
  'scripts/start-ios-safe.js:36'
);

let didOpen = false;

function handleLine(line) {
  if (!line) return;
  const match = line.match(/exp:\/\/\S+/);
  if (!match || didOpen) return;

  const url = match[0];
  didOpen = true;
  sendLog(
    'expo url detected',
    { url },
    'H7',
    'scripts/start-ios-safe.js:50'
  );

  const opener = spawn('xcrun', ['simctl', 'openurl', 'booted', url], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  opener.on('exit', (code) => {
    sendLog(
      'simctl openurl exit',
      { url, exitCode: code },
      'H6',
      'scripts/start-ios-safe.js:63'
    );
  });

  opener.on('error', (error) => {
    sendLog(
      'simctl openurl error',
      { url, name: error?.name, message: error?.message },
      'H6',
      'scripts/start-ios-safe.js:74'
    );
  });
}

function streamLines(stream) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const parts = buffer.split('\n');
    buffer = parts.pop() || '';
    parts.forEach((line) => handleLine(line.trim()));
  });
}

streamLines(expo.stdout);
streamLines(expo.stderr);

expo.on('exit', (code, signal) => {
  sendLog(
    'expo start exit',
    { exitCode: code, signal, didOpen },
    'H6',
    'scripts/start-ios-safe.js:98'
  );
  process.exit(code ?? 0);
});

expo.on('error', (error) => {
  sendLog(
    'expo start error',
    { name: error?.name, message: error?.message },
    'H6',
    'scripts/start-ios-safe.js:110'
  );
  process.exit(1);
});
