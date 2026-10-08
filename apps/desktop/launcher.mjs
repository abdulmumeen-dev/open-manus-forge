#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';

const port = Number(process.env.OPEN_MANUS_PORT ?? 8787);
const server = spawn(process.execPath, ['--import', 'tsx', 'apps/server/src/index.ts'], { stdio: 'inherit', env: { ...process.env, OPEN_MANUS_HOST: '127.0.0.1', OPEN_MANUS_PORT: String(port) } });
const waitForServer = () => new Promise((resolve, reject) => {
  const started = Date.now();
  const check = () => {
    const req = createServer().listen(0, '127.0.0.1', () => {
      req.close();
      fetch(`http://127.0.0.1:${port}/health`).then((r) => r.ok ? resolve() : retry()).catch(retry);
    });
    function retry() { req.close(); if (Date.now() - started > 15000) reject(new Error('Local server did not start')); else setTimeout(check, 250); }
  };
  check();
});
try {
  await waitForServer();
  const url = `http://127.0.0.1:${port}`;
  console.log(`Open Manus Forge desktop shell: ${url}`);
  const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', url] : [url];
  execFile(command, args, () => {});
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  server.kill();
  process.exitCode = 1;
}
const stop = () => { server.kill('SIGTERM'); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
