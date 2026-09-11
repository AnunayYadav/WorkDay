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
  onStatusChange
}, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isSyncDoneRef = useRef(false);

  const connectWebSocket = () => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (_) {}
    }

    onStatusChange?.('connecting');
    try {
      const cleanRepoParam = encodeURIComponent(repoBase || 'workspace');
      const ws = new WebSocket(`ws://localhost:8082?repo=${cleanRepoParam}`);
      socketRef.current = ws;

      ws.onopen = () => {
        onStatusChange?.('connected');
        // Initial sync of all virtual files from Monaco to disk in workspaces/[repo]
        if (files && Object.keys(files).length > 0) {
          try {
            ws.send(JSON.stringify({
              type: 'sync_files',
              files
            }));
            isSyncDoneRef.current = true;
          } catch (_) {}
        }
      };

      ws.onmessage = (event) => {
        if (termInstanceRef.current) {
          termInstanceRef.current.write(event.data);
        }
      };

      ws.onclose = () => {
        onStatusChange?.('disconnected');
      };

      ws.onerror = () => {
        onStatusChange?.('disconnected');
      };
    } catch (_) {
      onStatusChange?.('disconnected');
    }
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      termInstanceRef.current?.clear();
    },
    reconnect: () => {
      connectWebSocket();
    },
    executeCommand: (cmd: string) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(cmd + '\r\n');
      }
    }
  }));

  // When files change in Monaco, sync them to disk in the real workspace directory
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && files) {
      try {
        socketRef.current.send(JSON.stringify({
          type: 'sync_files',
          files
        }));
      } catch (_) {}
    }
  }, [files]);

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

    // Direct piping: all user keystrokes in xterm are sent to the real shell process
    term.onData((data) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(data);
      }
    });

    // Auto-fit terminal on layout change
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (_) {}
    });
    resizeObserver.observe(terminalRef.current);

    // Connect to real shell bridge
    connectWebSocket();

    return () => {
      resizeObserver.disconnect();
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (_) {}
      }
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
