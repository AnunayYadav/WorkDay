import { WebSocketServer } from 'ws';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const PORT = 8082;
const wss = new WebSocketServer({ port: PORT });

console.log(`\x1b[36m[VirtualHQ Terminal Bridge]\x1b[0m Service started on ws://localhost:${PORT}`);

wss.on('connection', (ws, req) => {
  const isWindows = process.platform === 'win32';
  const shell = isWindows ? 'powershell.exe' : (process.env.SHELL || 'bash');
  const args = isWindows ? ['-NoLogo'] : [];

  // Parse target repo name from query string or default to active workspace
  let repoName = 'workspace';
  try {
    const reqUrl = new URL(req.url || '', 'http://localhost');
    const paramRepo = reqUrl.searchParams.get('repo');
    if (paramRepo) {
      repoName = paramRepo.replace(/[^a-zA-Z0-9_.-]/g, '_');
    }
  } catch (_) {}

  // Create real workspace folder on disk for this repository
  const workspacesRoot = path.resolve('workspaces');
  const cwd = path.join(workspacesRoot, repoName);
  try {
    fs.mkdirSync(cwd, { recursive: true });
  } catch (e) {
    console.error(`Failed to create workspace directory: ${cwd}`, e);
  }

  console.log(`\x1b[32m[VirtualHQ Terminal Bridge]\x1b[0m Client connected for repo "${repoName}". Spawning shell: ${shell} in ${cwd}`);

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
      let str = data.toString('utf-8');
      if (isWindows) {
        str = str.replace(/\x08/g, '\b \b');
      }
      ws.send(str);
    }
  });

  ptyProcess.stderr.on('data', (data) => {
    if (ws.readyState === ws.OPEN) {
      let str = data.toString('utf-8');
      if (isWindows) {
        str = str.replace(/\x08/g, '\b \b');
      }
      ws.send(str);
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

  let currentLineChars = 0;

  ws.on('message', (message) => {
    try {
      let msgStr = message.toString();

      // Handle JSON control frames (file sync, writes, deletes)
      if (msgStr.startsWith('{')) {
        try {
          const payload = JSON.parse(msgStr);

          // Full workspace files sync
          if (payload.type === 'sync_files' && payload.files) {
            for (const [relPath, item] of Object.entries(payload.files)) {
              if (!relPath || typeof relPath !== 'string') continue;
              const fullPath = path.join(cwd, relPath);
              fs.mkdirSync(path.dirname(fullPath), { recursive: true });
              fs.writeFileSync(fullPath, item.content || '', 'utf-8');
            }
            return;
          }

          // Single file write/update
          if (payload.type === 'write_file' && payload.path) {
            const fullPath = path.join(cwd, payload.path);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, payload.content || '', 'utf-8');
            return;
          }

          // Delete file
          if (payload.type === 'delete_file' && payload.path) {
            const fullPath = path.join(cwd, payload.path);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
            return;
          }

          if (payload.type === 'resize') {
            return;
          }
        } catch (_) {}
      }

      // Enter key - reset line counter
      if (msgStr === '\r' || msgStr === '\n' || msgStr === '\r\n') {
        currentLineChars = 0;
        if (ptyProcess.stdin && !ptyProcess.stdin.destroyed) {
          ptyProcess.stdin.write('\r\n');
        }
        return;
      }

      // Backspace key (\x7f or \x08)
      if (msgStr === '\x7f' || msgStr === '\x08') {
        if (currentLineChars > 0) {
          currentLineChars--;
          if (ptyProcess.stdin && !ptyProcess.stdin.destroyed) {
            ptyProcess.stdin.write(isWindows ? '\x08' : '\x7f');
          }
        }
        return;
      }

      // Ctrl+C (SIGINT)
      if (msgStr === '\x03') {
        currentLineChars = 0;
        if (ptyProcess.stdin && !ptyProcess.stdin.destroyed) {
          ptyProcess.stdin.write('\x03');
        }
        return;
      }

      // Normal characters
      currentLineChars += msgStr.length;
      if (ptyProcess.stdin && !ptyProcess.stdin.destroyed) {
        ptyProcess.stdin.write(msgStr);
      }
    } catch (e) {
      console.error('[VirtualHQ Terminal Bridge] Message error:', e);
    }
  });

  ws.on('close', () => {
    console.log(`\x1b[33m[VirtualHQ Terminal Bridge]\x1b[0m Client disconnected. Terminating shell.`);
    try {
      ptyProcess.kill();
    } catch (e) {
      // ignore
    }
  });

  ws.on('error', (err) => {
    console.error(`\x1b[31m[VirtualHQ Terminal Bridge] WebSocket error:\x1b[0m`, err);
  });
});
