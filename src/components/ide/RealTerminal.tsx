import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface RealTerminalProps {
  onClear?: () => void;
}

export const RealTerminal: React.FC<RealTerminalProps> = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const connectWebSocket = () => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (e) {
        // ignore
      }
    }

    setConnectionStatus('connecting');
    const ws = new WebSocket('ws://localhost:8082');
    socketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      if (termInstanceRef.current) {
        termInstanceRef.current.write(event.data);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
    };
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', Menlo, monospace",
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
      rows: 10,
      cols: 80
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    termInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    let inputBuffer = '';

    term.onData((data) => {
      // Enter key (dispatch command and reset line buffer)
      if (data === '\r' || data === '\n' || data === '\r\n') {
        inputBuffer = '';
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send('\r\n');
        }
        return;
      }

      // Backspace key (\x7f or \x08)
      if (data === '\x7f' || data === '\x08') {
        // Only allow backspacing if user has actually typed characters on this line
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send('\x7f');
          }
        }
        // At beginning of prompt (or space after >), safely ignore backspace so cursor never hangs
        return;
      }

      // Ctrl+C (SIGINT)
      if (data === '\x03') {
        inputBuffer = '';
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send('\x03');
        }
        return;
      }

      // Normal keystrokes
      inputBuffer += data;
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(data);
      }
    });

    // Initial connection
    connectWebSocket();

    // Resize observer to auto-fit terminal on layout change
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // ignore
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      if (socketRef.current) {
        socketRef.current.close();
      }
      term.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top status bar inside terminal */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.2rem 0.6rem',
        background: '#141416',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: '0.72rem',
        fontFamily: 'monospace'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: connectionStatus === 'connected' ? '#10b981' : (connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444')
          }} />
          <span style={{ color: '#94a3b8' }}>
            {connectionStatus === 'connected' ? 'Host Shell Active (powershell / bash)' : (connectionStatus === 'connecting' ? 'Connecting to terminal bridge...' : 'Bridge Offline')}
          </span>
        </div>

        {connectionStatus !== 'connected' && (
          <button
            type="button"
            onClick={connectWebSocket}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '3px',
              padding: '0.1rem 0.4rem',
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
          >
            Reconnect Bridge
          </button>
        )}
      </div>

      <div
        ref={terminalRef}
        style={{
          flex: 1,
          width: '100%',
          height: 'calc(100% - 26px)',
          overflow: 'hidden',
          backgroundColor: '#18181b',
          padding: '0.3rem 0.5rem'
        }}
      />
    </div>
  );
};
