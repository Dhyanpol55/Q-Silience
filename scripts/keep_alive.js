/**
 * Q-RESILIENCE AI — Keep-Alive Pinger
 * 
 * Periodically sends an HTTP GET request to keep free-tier cloud instances
 * (Render, Vercel, Railway, Fly.io, etc.) awake and active.
 * 
 * Features:
 * - Uses 100% built-in Node.js modules (https / http) — ZERO external dependencies
 * - Configurable interval (default: 10 minutes)
 * - Immediate initial ping on startup
 * - Detailed timestamps, response latency, and status logging
 * - Graceful shutdown handling (SIGINT / SIGTERM)
 * 
 * Usage:
 *   node scripts/keep_alive.js
 *   TARGET_URL=https://qresilience.vercel.app/ INTERVAL_MINUTES=10 node scripts/keep_alive.js
 */

const https = require('https');
const http = require('http');

// Configuration
const TARGET_URL = process.env.TARGET_URL || 'https://qresilience.vercel.app/';
const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES, 10) || 10;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function ping(url) {
  const startTime = Date.now();
  const isHttps = url.startsWith('https:');
  const client = isHttps ? https : http;

  console.log(`[${formatTimestamp()}] [PING] Sending GET request to: ${url}`);

  const options = {
    method: 'GET',
    headers: {
      'User-Agent': 'KeepAlive-PingBot/1.0 (Q-Resilience Free-Tier Pinger; Node.js built-in)',
      'Accept': '*/*',
    },
    timeout: 15000, // 15 seconds timeout
  };

  const req = client.request(url, options, (res) => {
    let dataLength = 0;

    // Consume response stream to free sockets
    res.on('data', (chunk) => {
      dataLength += chunk.length;
    });

    res.on('end', () => {
      const durationMs = Date.now() - startTime;
      const statusCode = res.statusCode;

      if (statusCode >= 200 && statusCode < 400) {
        console.log(
          `[${formatTimestamp()}] [SUCCESS] HTTP ${statusCode} ${res.statusMessage || 'OK'} - ${durationMs}ms (${dataLength} bytes received)`
        );
      } else {
        console.warn(
          `[${formatTimestamp()}] [WARNING] HTTP ${statusCode} ${res.statusMessage || 'Status Alert'} - ${durationMs}ms`
        );
      }
    });
  });

  req.on('timeout', () => {
    req.destroy(new Error('Connection timed out after 15000ms'));
  });

  req.on('error', (err) => {
    const durationMs = Date.now() - startTime;
    console.error(
      `[${formatTimestamp()}] [FAILED] Ping error after ${durationMs}ms: ${err.message}`
    );
  });

  req.end();
}

console.log('='.repeat(65));
console.log('  Q-RESILIENCE AI — BACKEND KEEP-ALIVE DAEMON');
console.log('='.repeat(65));
console.log(`Target URL : ${TARGET_URL}`);
console.log(`Interval   : Every ${INTERVAL_MINUTES} minutes (${INTERVAL_MS / 1000}s)`);
console.log(`Node engine: ${process.version}`);
console.log('Starting monitoring loop... (Press Ctrl+C to stop)\n');

// 1. Immediate initial ping on startup
ping(TARGET_URL);

// 2. Scheduled recurring ping every 10 minutes
const timer = setInterval(() => {
  ping(TARGET_URL);
}, INTERVAL_MS);

// Graceful cleanup
function handleShutdown(signal) {
  console.log(`\n[${formatTimestamp()}] Received ${signal}. Shutting down Keep-Alive Daemon.`);
  clearInterval(timer);
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
