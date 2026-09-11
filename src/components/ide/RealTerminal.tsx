import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export interface RealTerminalHandle {
  clear: () => void;
  reconnect: () => void;
  executeCommand: (cmd: string) => void;
}

interface FileItem {
  name: string;
  path: string;
  folder: string;
  language: string;
  content: string;
  originalContent?: string;
}

interface RealTerminalProps {
  repoBase: string;
  files: Record<string, FileItem>;
  issueNo?: string;
  onFilesChange?: (newFiles: Record<string, FileItem>) => void;
  onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected') => void;
}

export const RealTerminal = forwardRef<RealTerminalHandle, RealTerminalProps>(({
  repoBase,
  files,
  issueNo = '487',
  onFilesChange,
  onStatusChange
}, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  // Command input buffer & history state
  const currentLineRef = useRef<string>('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const getPrompt = () => `\x1b[36mPS C:\\workspace\\${repoBase}>\x1b[0m `;

  const printPrompt = () => {
    if (termInstanceRef.current) {
      termInstanceRef.current.write(`\r\n${getPrompt()}`);
      currentLineRef.current = '';
    }
  };

  const executeCommandLine = (rawCmd: string) => {
    const term = termInstanceRef.current;
    if (!term) return;

    const trimmed = rawCmd.trim();
    if (!trimmed) {
      printPrompt();
      return;
    }

    // Save to history
    historyRef.current.push(trimmed);
    historyIndexRef.current = historyRef.current.length;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const currentFiles = filesRef.current;

    term.write('\r\n');

    // 1. npm run build / npm build
    if (trimmed === 'npm run build' || trimmed === 'npm build') {
      term.write(`\x1b[90m> ${repoBase.toLowerCase()}@0.1.0 build\x1b[0m\r\n`);
      term.write(`\x1b[90m> vite build\x1b[0m\r\n\r\n`);
      term.write(`\x1b[34mvite v5.4.2\x1b[0m building client bundle for production...\r\n`);
      term.write(`\x1b[90mtransforming modules...\x1b[0m\r\n`);

      // Inspect files for syntax errors
      let syntaxError: { file: string; message: string } | null = null;
      for (const [fPath, f] of Object.entries(currentFiles)) {
        if (f.name.endsWith('.json')) {
          try {
            JSON.parse(f.content);
          } catch (e: any) {
            syntaxError = { file: fPath, message: e.message };
            break;
          }
        }
      }

      if (syntaxError) {
        term.write(`\r\n\x1b[31m[vite] Internal error in ${syntaxError.file}:\x1b[0m\r\n`);
        term.write(`\x1b[31m${syntaxError.message}\x1b[0m\r\n\r\n`);
        term.write(`\x1b[31mnpm ERR! code ELIFECYCLE\x1b[0m\r\n`);
        term.write(`\x1b[31mnpm ERR! errno 1\x1b[0m\r\n`);
      } else {
        const fileCount = Object.keys(currentFiles).length || 24;
        term.write(`\x1b[32m✓\x1b[0m ${fileCount} modules transformed.\r\n`);
        term.write(`\x1b[90mrendering chunks...\x1b[0m\r\n`);
        term.write(`\x1b[36mdist/index.html\x1b[0m                     0.88 kB │ gzip: 0.44 kB\r\n`);
        term.write(`\x1b[36mdist/assets/index.css\x1b[0m              14.20 kB │ gzip: 3.12 kB\r\n`);
        term.write(`\x1b[36mdist/assets/index.js\x1b[0m              142.80 kB │ gzip: 41.20 kB\r\n\r\n`);
        term.write(`\x1b[32m✓ built in 1.18s\x1b[0m\r\n`);
      }
      printPrompt();
      return;
    }

    // 2. npm test / npm t / npm run test
    if (trimmed === 'npm test' || trimmed === 'npm t' || trimmed === 'npm run test') {
      term.write(`\x1b[90m> ${repoBase.toLowerCase()}@0.1.0 test\x1b[0m\r\n`);
      term.write(`\x1b[90m> vitest run\x1b[0m\r\n\r\n`);
      term.write(`\x1b[7m\x1b[1m RUN \x1b[0m \x1b[90mv1.6.0 C:/workspace/${repoBase}\x1b[0m\r\n\r\n`);
      term.write(` \x1b[32m✓\x1b[0m tests/issue-${issueNo}.spec.ts (3 tests) \x1b[90m28ms\x1b[0m\r\n`);
      term.write(`   \x1b[32m✓\x1b[0m module syntax and exports integrity check\r\n`);
      term.write(`   \x1b[32m✓\x1b[0m deliverable acceptance assertions passed\r\n`);
      term.write(`   \x1b[32m✓\x1b[0m latency and CI benchmark validation (<50ms)\r\n\r\n`);
      term.write(`\x1b[1mTest Files\x1b[0m  \x1b[32m1 passed\x1b[0m (1)\r\n`);
      term.write(`     \x1b[1mTests\x1b[0m  \x1b[32m3 passed\x1b[0m (3)\r\n`);
      term.write(`  \x1b[1mDuration\x1b[0m  138ms\r\n`);
      printPrompt();
      return;
    }

    // 3. git status
    if (trimmed === 'git status') {
      const modifiedList = Object.entries(currentFiles).filter(([_, f]) => f.content !== f.originalContent);
      term.write(`On branch feature/issue-${issueNo}\r\n`);
      if (modifiedList.length === 0) {
        term.write(`nothing to commit, working tree clean\r\n`);
      } else {
        term.write(`Changes not staged for commit:\r\n`);
        term.write(`  (use "git add <file>..." to update what will be committed)\r\n\r\n`);
        modifiedList.forEach(([_, f]) => {
          term.write(`\t\x1b[31mmodified:   ${f.path || f.name}\x1b[0m\r\n`);
        });
        term.write(`\r\nno changes added to commit (use "git add" to stage)\r\n`);
      }
      printPrompt();
      return;
    }

    // 4. git diff
    if (trimmed.startsWith('git diff')) {
      const modifiedList = Object.entries(currentFiles).filter(([_, f]) => f.content !== f.originalContent);
      if (modifiedList.length === 0) {
        term.write(`\x1b[90m(no changes detected)\x1b[0m\r\n`);
      } else {
        modifiedList.forEach(([_, f]) => {
          const orig = (f.originalContent || '').split('\n');
          const mod = f.content.split('\n');
          term.write(`\x1b[1mdiff --git a/${f.path} b/${f.path}\x1b[0m\r\n`);
          term.write(`\x1b[31m--- a/${f.path}\x1b[0m\r\n`);
          term.write(`\x1b[32m+++ b/${f.path}\x1b[0m\r\n`);
          const max = Math.min(Math.max(orig.length, mod.length), 30);
          for (let i = 0; i < max; i++) {
            if (orig[i] !== mod[i]) {
              if (orig[i] !== undefined) term.write(`\x1b[31m-${orig[i]}\x1b[0m\r\n`);
              if (mod[i] !== undefined) term.write(`\x1b[32m+${mod[i]}\x1b[0m\r\n`);
            }
          }
        });
      }
      printPrompt();
      return;
    }

    // 5. ls / dir
    if (cmd === 'ls' || cmd === 'dir') {
      const fileKeys = Object.keys(currentFiles);
      if (fileKeys.length === 0) {
        term.write(`(empty workspace)\r\n`);
      } else {
        term.write(`\x1b[1m    Directory: C:\\workspace\\${repoBase}\x1b[0m\r\n\r\n`);
        term.write(`Mode                 Length Name\r\n`);
        term.write(`----                 ------ ----\r\n`);
        fileKeys.slice(0, 40).forEach(key => {
          const f = currentFiles[key];
          const len = f ? (f.content?.length || 0).toString().padStart(6, ' ') : '     0';
          const isMod = f?.content !== f?.originalContent;
          const nameColor = isMod ? '\x1b[33m' : '\x1b[37m';
          term.write(`-a----               ${len} ${nameColor}${key}\x1b[0m\r\n`);
        });
        if (fileKeys.length > 40) {
          term.write(`\x1b[90m... and ${fileKeys.length - 40} more files\x1b[0m\r\n`);
        }
      }
      printPrompt();
      return;
    }

    // 6. cat / type
    if (cmd === 'cat' || cmd === 'type') {
      const target = args[0];
      if (!target) {
        term.write(`Usage: ${cmd} <filename>\r\n`);
      } else {
        const found = currentFiles[target] || Object.values(currentFiles).find(f => f.name === target || f.path === target);
        if (found) {
          const lines = found.content.split('\n');
          lines.slice(0, 60).forEach(l => term.write(`${l}\r\n`));
          if (lines.length > 60) {
            term.write(`\x1b[90m... (${lines.length - 60} lines truncated)\x1b[0m\r\n`);
          }
        } else {
          term.write(`\x1b[31mFile not found: ${target}\x1b[0m\r\n`);
        }
      }
      printPrompt();
      return;
    }

    // 7. touch
    if (cmd === 'touch') {
      const target = args[0];
      if (!target) {
        term.write(`Usage: touch <filename>\r\n`);
      } else {
        const updated = {
          ...currentFiles,
          [target]: {
            name: target.split('/').pop() || target,
            path: target,
            folder: target.includes('/') ? target.split('/')[0] : 'root',
            language: 'plaintext',
            content: '',
            originalContent: ''
          }
        };
        onFilesChange?.(updated);
        term.write(`\x1b[32mCreated file: ${target}\x1b[0m\r\n`);
      }
      printPrompt();
      return;
    }

    // 8. clear / cls
    if (cmd === 'clear' || cmd === 'cls') {
      term.clear();
      printPrompt();
      return;
    }

    // 9. pwd
    if (cmd === 'pwd') {
      term.write(`C:\\workspace\\${repoBase}\r\n`);
      printPrompt();
      return;
    }

    // 10. help
    if (cmd === 'help') {
      term.write(`\x1b[1mAvailable Workspace Commands:\x1b[0m\r\n`);
      term.write(`  \x1b[36mnpm run build\x1b[0m   Build & compile virtual workspace files\r\n`);
      term.write(`  \x1b[36mnpm test\x1b[0m        Run CI acceptance regression test suite\r\n`);
      term.write(`  \x1b[36mgit status\x1b[0m      Inspect modified files in the editor\r\n`);
      term.write(`  \x1b[36mgit diff\x1b[0m        View unified diff of all modifications\r\n`);
      term.write(`  \x1b[36mls / dir\x1b[0m        List files in repository file structure\r\n`);
      term.write(`  \x1b[36mcat <file>\x1b[0m      Print contents of a workspace file\r\n`);
      term.write(`  \x1b[36mtouch <file>\x1b[0m    Create a new file in the workspace\r\n`);
      term.write(`  \x1b[36mpwd\x1b[0m             Print current workspace path\r\n`);
      term.write(`  \x1b[36mclear / cls\x1b[0m     Clear the terminal screen\r\n`);
      printPrompt();
      return;
    }

    // Unknown command
    term.write(`\x1b[31m${cmd}: The term '${cmd}' is not recognized as a command.\x1b[0m\r\n`);
    term.write(`\x1b[90mType 'help' for a list of available workspace commands.\x1b[0m\r\n`);
    printPrompt();
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      termInstanceRef.current?.clear();
      printPrompt();
    },
    reconnect: () => {
      termInstanceRef.current?.clear();
      termInstanceRef.current?.write(`\x1b[90mSession re-initialized.\x1b[0m\r\n`);
      printPrompt();
    },
    executeCommand: (cmd: string) => {
      if (termInstanceRef.current) {
        termInstanceRef.current.write(cmd);
        executeCommandLine(cmd);
      }
    }
  }));

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Menlo, monospace",
      letterSpacing: 0,
      lineHeight: 1.25,
      theme: {
        background: '#18181b',
        foreground: '#e4e4e7',
        cursor: '#38bdf8',
        cursorAccent: '#18181b',
        selectionBackground: 'rgba(56, 189, 248, 0.3)',
        black: '#18181b',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f4f4f5',
        brightBlack: '#71717a',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff'
      },
      convertEol: true,
      rows: 12,
      cols: 90
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (_) {}
    }, 50);

    termInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    // Print welcome banner & prompt
    term.write(`\x1b[1m\x1b[34mVirtualHQ Terminal\x1b[0m \x1b[90m[Workspace: C:\\workspace\\${repoBase}]\x1b[0m\r\n`);
    term.write(`\x1b[90mInteractive workspace shell active. Run \x1b[36mnpm run build\x1b[90m, \x1b[36mnpm test\x1b[90m, or \x1b[36mhelp\x1b[90m.\x1b[0m\r\n`);
    printPrompt();
    onStatusChange?.('connected');

    // Handle interactive typing
    term.onData((data) => {
      // Enter key
      if (data === '\r' || data === '\n') {
        const cmd = currentLineRef.current;
        executeCommandLine(cmd);
        return;
      }

      // Backspace key
      if (data === '\x7f' || data === '\x08') {
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Ctrl + C
      if (data === '\x03') {
        currentLineRef.current = '';
        term.write('^C');
        printPrompt();
        return;
      }

      // Up arrow (history back)
      if (data === '\x1b[A') {
        if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const prevCmd = historyRef.current[historyIndexRef.current];
          while (currentLineRef.current.length > 0) {
            term.write('\b \b');
            currentLineRef.current = currentLineRef.current.slice(0, -1);
          }
          currentLineRef.current = prevCmd;
          term.write(prevCmd);
        }
        return;
      }

      // Down arrow (history forward)
      if (data === '\x1b[B') {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current++;
          const nextCmd = historyRef.current[historyIndexRef.current];
          while (currentLineRef.current.length > 0) {
            term.write('\b \b');
            currentLineRef.current = currentLineRef.current.slice(0, -1);
          }
          currentLineRef.current = nextCmd;
          term.write(nextCmd);
        } else if (historyIndexRef.current === historyRef.current.length - 1) {
          historyIndexRef.current++;
          while (currentLineRef.current.length > 0) {
            term.write('\b \b');
            currentLineRef.current = currentLineRef.current.slice(0, -1);
          }
        }
        return;
      }

      // Tab completion
      if (data === '\t') {
        const tokens = currentLineRef.current.split(' ');
        const lastToken = tokens[tokens.length - 1];
        if (lastToken) {
          const matches = Object.keys(filesRef.current).filter(k => k.startsWith(lastToken));
          if (matches.length === 1) {
            const completion = matches[0].slice(lastToken.length);
            currentLineRef.current += completion;
            term.write(completion);
          }
        }
        return;
      }

      // Normal characters
      currentLineRef.current += data;
      term.write(data);
    });

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (_) {}
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, [repoBase]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#18181b', overflow: 'hidden' }}>
      <div
        ref={terminalRef}
        style={{
          width: '100%',
          height: '100%',
          padding: '0.4rem 0.6rem',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
});

RealTerminal.displayName = 'RealTerminal';
