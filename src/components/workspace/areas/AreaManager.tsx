import React, { useState, useEffect } from 'react';
import type { EmployeeState, PullRequest } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';
import { useToast } from '../../../lib/toast';

interface AreaManagerProps {
  employee: EmployeeState;
  pullRequests: PullRequest[];
  onNavigate?: (area: string) => void;
}

export const AreaManager: React.FC<AreaManagerProps> = ({
  employee,
  pullRequests,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'status' | 'chat'>('status');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [upcomingMeeting, setUpcomingMeeting] = useState<any | null>(null);

  const mgr = employee.selectedRole?.manager || {
    name: 'Reporting Manager',
    title: 'Engineering Director',
    initials: 'RM',
    quote: ''
  };

  useEffect(() => {
    let isMounted = true;
    CloudStorage.listMessages(employee.empId, 'manager').then(msgs => {
      if (isMounted) setChatMessages(msgs || []);
    });
    CloudStorage.listMeetings(employee.empId).then(meets => {
      if (isMounted && meets && meets.length > 0) {
        setUpcomingMeeting(meets[0]);
      }
    });
    return () => { isMounted = false; };
  }, [employee.empId]);

  const handleSendChat = async (textToSend?: string) => {
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

    await CloudStorage.sendMessage(employee.empId, 'manager', newMsg);

    setTimeout(async () => {
      let reply = `Good question, ${employee.preferredName}. Keep the implementation focused on the acceptance criteria and make sure all unit assertions pass green.`;
      if (text.includes('fallback') || text.includes('boundary')) {
        reply = `For error boundaries, return a clean fallback card with a retry CTA and log the error stack to the monitoring pipeline.`;
      } else if (text.includes('criteria') || text.includes('approving')) {
        reply = `Key approval criteria: zero lint errors, 100% unit test coverage for the touched methods, and clean commit formatting.`;
      } else if (text.includes('deadline')) {
        reply = `Sprint 01 wraps up end of day Friday. Merging deliverables puts you on track for Level 2 promotion evaluation.`;
      }

      const replyMsg = {
        id: String(Date.now() + 1),
        sender: mgr.name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
        text: reply
      };
      setChatMessages(prev => [...prev, replyMsg]);
      await CloudStorage.sendMessage(employee.empId, 'manager', replyMsg);
    }, 800);
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved_merged') return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', text: '#34d399', label: 'Merged' };
    if (status === 'changes_requested') return { bg: 'rgba(244, 63, 94, 0.08)', border: 'rgba(244, 63, 94, 0.2)', text: '#fb7185', label: 'Changes Requested' };
    return { bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24', label: 'Pending Review' };
  };

  return (
    <section className="workspace-area active" id="areaManager" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 600,
          color: '#f4f4f5',
          letterSpacing: '-0.025em',
          margin: '0 0 0.3rem 0'
        }}>
          My Manager
        </h1>
        <p style={{
          fontSize: '0.82rem',
          color: '#a1a1aa',
          margin: 0
        }}>
          Reporting manager profile, scheduled 1-on-1s, submitted pull request status, and direct engineering guidance.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Manager Profile */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          {/* Manager Avatar & Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', fontWeight: 700, color: '#f4f4f5'
            }}>
              {mgr.initials}
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f4f4f5', margin: '0 0 0.15rem 0' }}>{mgr.name}</h3>
              <span style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block' }}>{mgr.title}</span>
              <span className="mono" style={{ fontSize: '0.7rem', color: '#71717a', display: 'block', marginTop: '0.25rem' }}>
                {employee.selectedRole?.title?.toUpperCase() || 'ENGINEERING'}
              </span>
            </div>
          </div>

          {/* Quote */}
          {mgr.quote && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1rem'
            }}>
              <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: 0, fontStyle: 'italic', lineHeight: '1.5' }}>
                "{mgr.quote}"
              </p>
            </div>
          )}

          {/* Schedule Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Next 1-on-1</span>
              <span className="mono" style={{ fontSize: '0.75rem', color: '#d4d4d8', fontWeight: 500 }}>
                {upcomingMeeting ? (upcomingMeeting.schedule_time || upcomingMeeting.scheduleTime) : 'Not scheduled'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#71717a' }}>PR Review SLA</span>
              <span className="mono" style={{ fontSize: '0.75rem', color: '#d4d4d8', fontWeight: 500 }}>&lt; 4 Hours</span>
            </div>
          </div>

          {/* Schedule / Join CTA */}
          {upcomingMeeting ? (
            <a
              href={upcomingMeeting.link || `https://meet.jit.si/VirtualHQ-${(employee.companyName || 'corp').toLowerCase().replace(/[^a-z0-9]/g, '')}-${employee.empId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0.55rem 1rem', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f4f4f5', fontSize: '0.78rem', fontWeight: 500,
                textDecoration: 'none', cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              Join Scheduled 1-on-1 →
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('meetings');
                } else {
                  showToast({
                    title: 'Schedule 1-on-1',
                    message: 'Navigate to Meetings to schedule a session with your manager.',
                    type: 'info'
                  });
                }
              }}
              style={{
                width: '100%', padding: '0.55rem 1rem', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#d4d4d8', fontSize: '0.78rem', fontWeight: 500,
                cursor: 'pointer', transition: 'background 0.15s ease'
              }}
            >
              + Schedule 1-on-1
            </button>
          )}
        </div>

        {/* Right Column: PR Status & Direct Line */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          {/* Segmented Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '0.2rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              style={{
                flex: 1, padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none',
                background: activeTab === 'status' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: activeTab === 'status' ? '#f4f4f5' : '#71717a',
                fontSize: '0.76rem', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Submitted PRs ({pullRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1, padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none',
                background: activeTab === 'chat' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: activeTab === 'chat' ? '#f4f4f5' : '#71717a',
                fontSize: '0.76rem', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Direct Line
            </button>
          </div>

          {/* Tab 1: Submitted PR Status Tracker */}
          {activeTab === 'status' && (
            <div>
              {pullRequests.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 0.3rem 0' }}>No pull requests submitted yet.</p>
                  <p style={{ color: '#71717a', fontSize: '0.78rem', margin: 0 }}>
                    Solve a sprint issue in Monaco Studio and click "Submit PR" to send it for manager review.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pullRequests.map(pr => {
                    const statusStyle = getStatusColor(pr.status);
                    return (
                      <div
                        key={pr.id}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      >
                        {/* PR Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d4d4d8' }}>{pr.id}</span>
                            <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>#{pr.issue_no} in {pr.repo.split('/')[1] || pr.repo}</span>
                          </div>
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 500,
                            background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.text
                          }}>
                            {statusStyle.label}
                          </span>
                        </div>

                        {/* PR Title */}
                        <p style={{ fontSize: '0.82rem', color: '#e4e4e7', margin: '0 0 0.5rem 0', fontWeight: 500 }}>{pr.title}</p>

                        {/* Manager Feedback */}
                        {pr.reviewFeedback && (
                          <div style={{
                            padding: '0.6rem 0.8rem', borderRadius: '6px',
                            background: statusStyle.bg,
                            border: `1px solid ${statusStyle.border}`
                          }}>
                            <span style={{ fontSize: '0.7rem', color: '#71717a', display: 'block', marginBottom: '0.2rem' }}>
                              Reviewed by {pr.reviewedBy || mgr.name}
                            </span>
                            <p style={{ fontSize: '0.78rem', color: '#d4d4d8', margin: 0, lineHeight: '1.45' }}>
                              "{pr.reviewFeedback}"
                            </p>
                          </div>
                        )}

                        {/* Pending state hint */}
                        {pr.status === 'pending_review' && !pr.reviewFeedback && (
                          <p style={{ fontSize: '0.72rem', color: '#71717a', margin: 0, fontStyle: 'italic' }}>
                            Awaiting review from {mgr.name}. Typical SLA: &lt; 4 hours.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Direct Line Chat */}
          {activeTab === 'chat' && (
            <div>
              <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '0.8rem' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#71717a' }}>
                    <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: '0 0 0.3rem 0' }}>No messages yet with {mgr.name}.</p>
                    <p style={{ fontSize: '0.78rem', margin: 0 }}>Send a question below or pick a prompt to begin.</p>
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} style={{
                      marginBottom: '0.6rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      background: msg.isMe ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.015)',
                      border: `1px solid rgba(255, 255, 255, ${msg.isMe ? '0.06' : '0.04'})`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', color: msg.isMe ? '#d4d4d8' : '#a1a1aa', fontWeight: 500 }}>{msg.sender}</span>
                        <span className="mono" style={{ fontSize: '0.68rem', color: '#52525b' }}>{msg.time}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#e4e4e7', margin: 0, lineHeight: '1.45' }}>{msg.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                {[
                  'How should I structure the error boundary fallback UI?',
                  'What are your key criteria for approving my PR?',
                  'Can you explain the sprint milestone deadline?'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSendChat(chip)}
                    style={{
                      padding: '0.25rem 0.6rem', borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      color: '#a1a1aa', fontSize: '0.7rem', cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    "{chip}"
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask ${mgr.name} a question...`}
                  style={{
                    flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#e4e4e7', fontSize: '0.78rem', outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#d4d4d8', fontSize: '0.78rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'background 0.15s ease'
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
