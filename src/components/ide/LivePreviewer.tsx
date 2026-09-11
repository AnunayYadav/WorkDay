import React, { useState, useEffect, useRef } from 'react';

interface LivePreviewerProps {
  code: string;
  repo: string;
  issueNo: string;
}

export const LivePreviewer: React.FC<LivePreviewerProps> = ({ code, repo, issueNo }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate sandbox document HTML
  const generatePreviewHtml = (rawCode: string) => {
    // Extract JSX return content or render fallback
    let renderedContent = '';

    // Check if code contains JSX return statement
    const returnMatch = rawCode.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*};?/);
    if (returnMatch && returnMatch[1]) {
      // Basic sanitize JSX to HTML
      renderedContent = returnMatch[1]
        .replace(/className=/g, 'class=')
        .replace(/\{issueNumber\}/g, issueNo)
        .replace(/\{repo\}/g, repo)
        .replace(/\{isResolved \? '(.*?)' : '(.*?)'\}/g, '$1')
        .replace(/\{.*?\}/g, '');
    } else {
      renderedContent = `
        <div class="sprint-solution-container">
          <h3>${repo} — Live Preview</h3>
          <span class="status-badge">Hot Reload Active</span>
          <p>Live sandbox executing code from <code>SolutionPatch.tsx</code></p>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Live Preview</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #090d16;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .sprint-solution-container {
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 12px;
            padding: 2rem;
            max-width: 540px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 25px rgba(56, 189, 248, 0.1);
            animation: fadeIn 0.3s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          h3 {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 0.8rem;
            color: #ffffff;
            letter-spacing: -0.02em;
          }
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 0.3rem 0.8rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            margin-bottom: 1.2rem;
          }
          .status-badge::before {
            content: "";
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 8px #10b981;
          }
          p {
            font-size: 0.9rem;
            line-height: 1.6;
            color: #94a3b8;
          }
          code {
            font-family: 'JetBrains Mono', monospace;
            background: rgba(255, 255, 255, 0.08);
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            color: #38bdf8;
            font-size: 0.85em;
          }
        </style>
      </head>
      <body>
        ${renderedContent}
      </body>
      </html>
    `;
  };

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generatePreviewHtml(code));
        doc.close();
      }
    }
  }, [code, refreshKey]);

  const getWidth = () => {
    switch (device) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1117',
      borderLeft: '1px solid rgba(255,255,255,0.08)'
    }}>
      {/* Browser chrome address bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.4rem 0.8rem',
        background: '#161b22',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        gap: '0.75rem'
      }}>
        {/* Nav buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
            title="Back"
          >
            ←
          </button>
          <button
            type="button"
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
            title="Forward"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => setRefreshKey(k => k + 1)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            title="Reload Frame"
          >
            ↻
          </button>
        </div>

        {/* Address URL pill */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '0.2rem 0.8rem',
          fontSize: '0.75rem',
          color: '#cbd5e1',
          fontFamily: 'monospace'
        }}>
          <span style={{ color: '#10b981', fontSize: '0.7rem' }}>🔒</span>
          <span style={{ color: '#94a3b8' }}>http://localhost:3000/</span>
          <span style={{ color: '#38bdf8' }}>{repo.split('/')[1] || repo}</span>
        </div>

        {/* Device Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#0d1117', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            title="Desktop View (100%)"
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              border: 'none',
              background: device === 'desktop' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: device === 'desktop' ? '#38bdf8' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.7rem'
            }}
          >
            🖥 Desktop
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            title="Tablet View (768px)"
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              border: 'none',
              background: device === 'tablet' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: device === 'tablet' ? '#38bdf8' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.7rem'
            }}
          >
            📱 Tablet
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            title="Mobile View (375px)"
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              border: 'none',
              background: device === 'mobile' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: device === 'mobile' ? '#38bdf8' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.7rem'
            }}
          >
            📱 Mobile
          </button>
        </div>
      </div>

      {/* Sandboxed iframe viewport */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        overflow: 'auto',
        padding: device === 'desktop' ? '0' : '1.5rem'
      }}>
        <iframe
          ref={iframeRef}
          title="Component Live Preview"
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: getWidth(),
            height: '100%',
            minHeight: device === 'desktop' ? '100%' : '560px',
            border: device === 'desktop' ? 'none' : '1px solid rgba(255,255,255,0.15)',
            borderRadius: device === 'desktop' ? '0' : '12px',
            boxShadow: device === 'desktop' ? 'none' : '0 20px 40px rgba(0,0,0,0.8)',
            background: '#090d16',
            transition: 'width 0.25s ease'
          }}
        />
      </div>
    </div>
  );
};
