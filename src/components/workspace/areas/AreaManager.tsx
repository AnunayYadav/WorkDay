import React, { useState } from 'react';
import type { EmployeeState, PullRequest } from '../../../types';
import { useToast } from '../../../lib/toast';

interface InteractiveDiffViewerProps {
  patch: string;
}

const InteractiveDiffViewer: React.FC<InteractiveDiffViewerProps> = ({ patch }) => {
  const lines = (patch || '// Clean repository solution patch').split('\n');
  const additions = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const deletions = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#090a0f', marginBottom: '0.85rem' }}>
      {/* Diff Meta Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <line x1="6" y1="3" x2="6" y2="15"/>
            <circle cx="18" cy="6" r="3"/>
            <circle cx="6" cy="18" r="3"/>
            <path d="M18 9a9 9 0 0 1-9 9"/>
          </svg>
          <span className="mono" style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>GIT UNIFIED DIFF</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.67rem', fontWeight: 600, fontFamily: 'monospace' }}>
            +{additions} lines
          </span>
          <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.67rem', fontWeight: 600, fontFamily: 'monospace' }}>
            -{deletions} lines
          </span>
        </div>
      </div>

      {/* Diff Lines Rendering */}
      <div style={{ maxHeight: '230px', overflowY: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '0.72rem', lineHeight: '1.45', padding: '0.3rem 0' }}>
        {lines.map((line, index) => {
          let bg = 'transparent';
          let color = '#d4d4d8';
          let borderL = '3px solid transparent';

          if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff') || line.startsWith('index')) {
            color = '#94a3b8';
            bg = 'rgba(255,255,255,0.02)';
          } else if (line.startsWith('@@')) {
            bg = 'rgba(56, 189, 248, 0.08)';
            color = '#38bdf8';
            borderL = '3px solid #38bdf8';
          } else if (line.startsWith('+')) {
            bg = 'rgba(34, 197, 94, 0.12)';
            color = '#4ade80';
            borderL = '3px solid #22c55e';
          } else if (line.startsWith('-')) {
            bg = 'rgba(239, 68, 68, 0.12)';
            color = '#f87171';
            borderL = '3px solid #ef4444';
          }

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                background: bg,
                color: color,
                borderLeft: borderL,
                padding: '1px 8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              <span style={{ width: '28px', minWidth: '28px', color: '#52525b', userSelect: 'none', textAlign: 'right', marginRight: '10px', fontSize: '0.68rem' }}>
                {index + 1}
              </span>
              <span>{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AreaManagerProps {
  employee: EmployeeState;
  pullRequests: PullRequest[];
  onApprovePr: (pr: PullRequest, feedback: string) => void;
  onRequestChangesPr: (pr: PullRequest, feedback: string) => void;
}

export const AreaManager: React.FC<AreaManagerProps> = ({
  employee,
  pullRequests,
  onApprovePr,
  onRequestChangesPr
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'review' | 'chat'>('review');
  const [selectedPrId, setSelectedPrId] = useState<string | null>(
    pullRequests.length > 0 ? pullRequests[0].id : null
  );
  const [managerFeedback, setManagerFeedback] = useState('');

  // Manager dialogue chat
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'c1',
      sender: employee.selectedRole?.manager?.name || 'Marcus Vance',
      time: 'Just now',
      isMe: false,
      text: `Welcome to the team! I saw you just wrapped up onboarding. Your primary focus today is ticket #${employee.selectedRole?.problems?.[0]?.issue_no || '104'}. What can I help clarify regarding architecture, test coverage, or our sprint goals?`
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const selectedPr = pullRequests.find(p => p.id === selectedPrId) || pullRequests[0];
  const mgr = employee.selectedRole?.manager || {
    name: 'Marcus Vance',
    title: 'Engineering Director',
    initials: 'MV',
    quote: 'I value clean code, clear communication in standups, and attention to detail. If you are ever blocked on architecture or PR feedback, my door is always open.'
  };

  const handleSendChat = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const newMsg = {
      id: String(Date.now()),
      sender: employee.fullName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      text: text.trim()
    };
    setChatMessages(prev => [...prev, newMsg]);
    if (!textToSend) setChatInput('');

    setTimeout(() => {
      let reply = `Good question, ${employee.preferredName}. Keep the implementation focused on the acceptance criteria and make sure all 3 unit assertions pass green in Monaco Studio.`;
      if (text.includes('fallback') || text.includes('boundary')) {
        reply = `For error boundaries, return a clean glassmorphic fallback card with a retry CTA and log the error stack to the monitoring pipeline.`;
      } else if (text.includes('criteria') || text.includes('approving')) {
        reply = `Key approval criteria: zero lint errors, 100% unit test coverage for the touched methods, and clean commit formatting.`;
      } else if (text.includes('deadline')) {
        reply = `Sprint 01 wraps up end of day Friday. Merging 2 deliverables puts you on track for Level 2 promotion evaluation.`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: mgr.name,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          text: reply
        }
      ]);
    }, 1000);
  };

  return (
    <section className="workspace-area active" id="areaManager">
      <div className="area-header">
        <h1 className="area-title" id="mgrOfficeHeading">My Manager — {mgr.name}</h1>
        <p className="area-subtitle">
          Collaborate directly with your reporting manager. Schedule 1-on-1s, receive PR feedback, and review submitted pull requests.
        </p>
      </div>

      <div className="manager-office-grid">
        {/* Left Column: Direct Manager Profile */}
        <div className="mgr-profile-col">
          <div className="executive-card mgr-status-card">
            <div className="mgr-portrait-wrap">
              <div className="mgr-initials-large" id="mgrLargeInitials">{mgr.initials}</div>
            </div>

            <div className="mgr-bio-block">
              <h3 className="mgr-full-name" id="mgrFullName">{mgr.name}</h3>
              <span className="mgr-executive-title" id="mgrExecTitle">{mgr.title}</span>
              <span className="mgr-dept-badge mono" id="mgrDeptBadge">{employee.selectedRole?.title.toUpperCase()}</span>
            </div>

            <div className="mgr-quote-box">
              <p className="quote-text" id="mgrPhilQuote">
                "{mgr.quote}"
              </p>
            </div>

            <div className="mgr-schedule-box">
              <div className="sched-row">
                <span className="s-label">Next 1-on-1 Review:</span>
                <span className="s-val mono">Today at 2:30 PM UTC</span>
              </div>
              <div className="sched-row">
                <span className="s-label">PR Review SLA:</span>
                <span className="s-val mono">&lt; 4 Hours</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-schedule-sync"
              id="btnBookSync"
              onClick={() => {
                showToast({
                  title: '1-on-1 Agenda Confirmed',
                  message: `Scheduled today at 2:30 PM with ${mgr.name}.`,
                  type: 'success'
                });
              }}
            >
              <span>Confirm 1-on-1 Agenda (Today 2:30 PM)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Code Review Suite & Direct Guidance */}
        <div className="mgr-dialogue-col">
          <div className="executive-card mgr-chat-card" style={{ padding: '1.25rem' }}>
            <div className="chat-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="chat-title-group">
                <span className="chat-title" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>
                  {activeTab === 'review' ? 'REAL MANAGER CODE REVIEW SUITE' : `DIRECT LINE WITH ${mgr.name.toUpperCase()}`}
                </span>
                <span className="chat-sub" style={{ fontSize: '0.74rem', color: '#71717a' }}>
                  {activeTab === 'review' ? 'Inspect PR diffs, review code patches, and grant +50 XP' : 'Real-time engineering guidance and sprint consultation'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className={`filter-chip ${activeTab === 'review' ? 'active' : ''}`}
                  onClick={() => setActiveTab('review')}
                >
                  Code Review ({pullRequests.length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  Direct Chat
                </button>
              </div>
            </div>

            {/* Subpane 1: Code Review */}
            {activeTab === 'review' && (
              <div>
                {pullRequests.length === 0 ? (
                  <div className="tasks-empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>No pull requests submitted yet.</p>
                    <p style={{ color: '#71717a', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                      Open a sprint issue on your desk, solve it in Monaco Studio, and click "Submit PR" to review it here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem' }}>
                    {/* PR List */}
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '0.8rem' }}>
                      <span className="mono" style={{ fontSize: '0.7rem', color: '#71717a', display: 'block', marginBottom: '0.6rem' }}>
                        PULL REQUESTS
                      </span>
                      {pullRequests.map(pr => (
                        <div
                          key={pr.id}
                          onClick={() => setSelectedPrId(pr.id)}
                          style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginBottom: '0.4rem',
                            background: pr.id === selectedPr?.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                            border: pr.id === selectedPr?.id ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b' }}>{pr.id}</span>
                            <span className={`issue-level-pill ${pr.status === 'approved_merged' ? 'easy' : 'medium'}`} style={{ fontSize: '0.65rem' }}>
                              {pr.status === 'approved_merged' ? 'Merged' : 'Pending'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#e4e4e7', display: 'block', marginTop: '0.2rem' }}>#{pr.issue_no} in {pr.repo.split('/')[1] || pr.repo}</span>
                        </div>
                      ))}
                    </div>

                    {/* PR Diff & Review Action */}
                    <div>
                      {selectedPr && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <img
                                src={employee.avatarUrl || `https://github.com/${employee.githubUsername || employee.handle}.png`}
                                alt={selectedPr.author}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', objectFit: 'cover' }}
                              />
                              <div>
                                <h4 style={{ fontSize: '0.92rem', color: '#fff', margin: 0 }}>{selectedPr.title}</h4>
                                <span className="mono" style={{ fontSize: '0.72rem', color: '#71717a' }}>
                                  Author: {selectedPr.author} (@{employee.githubUsername || employee.handle}) · Branch: feature/issue-{selectedPr.issue_no}
                                </span>
                              </div>
                            </div>
                            <span className={`badge-solved`} style={{ display: selectedPr.status === 'approved_merged' ? 'inline-block' : 'none' }}>
                              ✓ MERGED (+50 XP)
                            </span>
                          </div>

                          {/* Syntax Highlighted Unified Diff Viewer */}
                          <InteractiveDiffViewer patch={selectedPr.codePatch || ''} />

                          {selectedPr.status !== 'approved_merged' ? (
                            <div>
                              {/* Quick Feedback Chips */}
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                {[
                                  'LGTM! Merging into main branch.',
                                  'Regression suite passed green (3/3).',
                                  'Clean architecture & specs adherence.'
                                ].map((chip) => (
                                  <button
                                    key={chip}
                                    type="button"
                                    onClick={() => setManagerFeedback(chip)}
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      background: 'rgba(255,255,255,0.04)',
                                      border: '1px solid rgba(255,255,255,0.08)',
                                      color: '#94a3b8',
                                      fontSize: '0.68rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    + {chip}
                                  </button>
                                ))}
                              </div>

                              <textarea
                                className="desk-scratchpad mono"
                                style={{ height: '54px', marginBottom: '0.6rem', fontSize: '0.75rem' }}
                                placeholder="Lead review notes (e.g. 'Verified test assertions and error boundary structure. Clean PR.')..."
                                value={managerFeedback}
                                onChange={(e) => setManagerFeedback(e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <button
                                  type="button"
                                  className="btn-open-ide"
                                  style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', background: '#16a34a', borderColor: '#22c55e' }}
                                  onClick={() => {
                                    onApprovePr(selectedPr, managerFeedback);
                                    setManagerFeedback('');
                                  }}
                                >
                                  Approve &amp; Merge (+50 XP) →
                                </button>
                                <button
                                  type="button"
                                  className="btn-event-action"
                                  style={{ padding: '0.5rem 1rem', fontSize: '0.78rem' }}
                                  onClick={() => {
                                    onRequestChangesPr(selectedPr, managerFeedback);
                                    setManagerFeedback('');
                                  }}
                                >
                                  Request Changes
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                              <span className="mono" style={{ fontSize: '0.74rem', color: '#10b981', display: 'block', fontWeight: 600 }}>
                                ✓ Approved &amp; Merged by {mgr.name} · +50 XP Credits awarded to {employee.fullName}
                              </span>
                              {selectedPr.reviewFeedback && (
                                <p style={{ fontSize: '0.72rem', color: '#a1a1aa', margin: '0.3rem 0 0 0' }}>
                                  Manager Feedback: "{selectedPr.reviewFeedback}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Subpane 2: Direct Dialogue */}
            {activeTab === 'chat' && (
              <div>
                <div className="chat-messages-scroll" id="mgrChatMessages" style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '0.8rem' }}>
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`chat-bubble ${msg.isMe ? 'user' : 'manager'}`} style={{ marginBottom: '0.6rem' }}>
                      <div className="bubble-meta">
                        <span className="bubble-sender" style={{ fontSize: '0.72rem' }}>{msg.sender}</span>
                        <span className="bubble-time mono" style={{ fontSize: '0.68rem', marginLeft: '0.5rem' }}>{msg.time}</span>
                      </div>
                      <div className="bubble-body" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>{msg.text}</div>
                    </div>
                  ))}
                </div>

                <div className="prompt-chips-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                  <button
                    type="button"
                    className="prompt-chip"
                    onClick={() => handleSendChat('How should I structure the error boundary fallback UI?')}
                  >
                    "How should I structure the error boundary fallback UI?"
                  </button>
                  <button
                    type="button"
                    className="prompt-chip"
                    onClick={() => handleSendChat('What are your key criteria for approving my PR?')}
                  >
                    "What are your key criteria for approving my PR?"
                  </button>
                  <button
                    type="button"
                    className="prompt-chip"
                    onClick={() => handleSendChat('Can you explain the sprint milestone deadline?')}
                  >
                    "Can you explain the sprint milestone deadline?"
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="chat-input-bar">
                  <input
                    type="text"
                    className="chat-input"
                    id="mgrChatInput"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Ask ${mgr.name} a question about architecture, code standards, or sprint tickets...`}
                  />
                  <button type="submit" className="btn-send-chat" id="btnSendChatMgr">Send →</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
