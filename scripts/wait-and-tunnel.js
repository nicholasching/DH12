#!/usr/bin/env node

/**
 * Wait a few seconds for Next.js to start, then run the tunnel
 */

console.log('⏳ Waiting 5 seconds for Next.js to start...');

setTimeout(() => {
  console.log('🚇 Starting Cloudflare Tunnel...\n');
  const { spawn } = require('child_process');
  const tunnel = spawn('cloudflared', ['tunnel', '--config', 'cloudflared-config.yml', 'run'], {
    stdio: 'inherit',
    shell: true
  });
  
  tunnel.on('error', (error) => {
    console.error('❌ Failed to start tunnel:', error.message);
    process.exit(1);
  });
  
  tunnel.on('exit', (code) => {
    process.exit(code || 0);
  });
}, 5000);
