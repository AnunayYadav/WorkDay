import { WebSocketServer } from 'ws';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const PORT = 8082;
const wss = new WebSocketServer({ port: PORT });

console.log(`\x1b[36m[VirtualHQ Terminal Bridge]\x1b[0m Service started on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  const isWindows = process.platform === 'win32';
  const shell = isWindows ? 'powershell.exe' : (process.env.SHELL || 'bash');
  const args = isWindows ? ['-NoLogo'] : [];
  const cwd = process.cwd();

  console.log(`\x1b[32m[VirtualHQ Terminal Bridge]\x1b[0m Client connected. Spawning shell: ${shell} in ${cwd}`);

  const ptyProcess = spawn(shell, args, {
    cwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor'
    }
  });

  ptyProcess.stdout.on('data', (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data.toString('utf-8'));
    }
  });

  ptyProcess.stderr.on('data', (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data.toString('utf-8'));
    }
  });

  ptyProcess.on('close', (code) => {
    console.log(`\x1b[33m[VirtualHQ Terminal Bridge]\x1b[0m Shell process exited with code ${code}`);
    if (ws.readyState === ws.OPEN) {
      ws.send(`\r\n\x1b[33m[Process exited with code ${code}]\x1b[0m\r\n`);
      ws.close();
    }
  });

  ptyProcess.on('error', (err) => {
    console.error(`\x1b[31m[VirtualHQ Terminal Bridge] Shell spawn error:\x1b[0m`, err);
    if (ws.readyState === ws.OPEN) {
      ws.send(`\r\n\x1b[31mShell error: ${err.message}\x1b[0m\r\n`);
    }
  });

  ws.on('message', (message) => {
    try {
      const msgStr = message.toString();
      // Check if message is a JSON control frame (like resize)
      if (msgStr.startsWith('{') && msgStr.includes('"type"')) {
        const parsed = JSON.parse(msgStr);
        if (parsed.type === 'resize') {
          // Window resize hint if needed
          return;
        }
      }
      // Otherwise pipe data directly into shell stdin
      if (ptyProcess.stdin && !ptyProcess.stdin.destroyed) {
        ptyProcess.stdin.write(msgStr);
      }
    } catch {
      // Direct raw data fallback
      if (ptyProcess.stdin && !ptyProcess.stdin.destroyed) {
        ptyProcess.stdin.write(message.toString());
      }
    }
  });

  ws.on('close', () => {
    console.log(`\x1b[33m[VirtualHQ Terminal Bridge]\x1b[0m Client disconnected. Terminating shell process.`);
    try {
      ptyProcess.kill();
    } catch (e) {
      // Process might already be dead
    }
  });

  ws.on('error', (err) => {
    console.error(`\x1b[31m[VirtualHQ Terminal Bridge] WebSocket error:\x1b[0m`, err);
  });
});
