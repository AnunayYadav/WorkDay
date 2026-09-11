import React, { useState, useEffect } from 'react';
import type { EmployeeState } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';

interface AreaMessagesProps {
  employee: EmployeeState;
}

interface MessageItem {
  id: string;
  sender: string;
  isMe: boolean;
  text: string;
  time: string;
}

export const AreaMessages: React.FC<AreaMessagesProps> = ({ employee }) => {
  const mgr = employee.selectedRole?.manager || {
    name: 'Marcus Vance',
    title: 'Engineering Director',
    initials: 'MV'
  };

  const [colleagues, setColleagues] = useState<EmployeeState[]>([]);
  const [activeThread, setActiveThread] = useState<string>('manager');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    let isMounted = true;
    CloudStorage.listProfiles().then(profiles => {
      if (isMounted) {
        const others = profiles.filter(p => p.empId !== employee.empId && p.fullName);
        setColleagues(others);
      }
    });
    return () => { isMounted = false; };
  }, [employee.empId]);

  // Build real channel list from manager & real registered colleagues
  const channels = [
    { id: 'manager', name: mgr.name, role: mgr.title, initials: mgr.initials, isManager: true },
    ...colleagues.map((c) => ({
      id: `emp-${c.empId}`,
      name: c.fullName,
      role: c.selectedRole?.title || 'Engineer',
      initials: c.preferredName ? c.preferredName.slice(0, 2).toUpperCase() : 'EM',
      isManager: false
    })),
    { id: 'announcements', name: '#squad-announcements', role: 'Official Channel', initials: '#', isManager: false }
  ];

  const activeChannel = channels.find(c => c.id === activeThread) || channels[0];

  const loadMessages = async (threadId: string) => {
    setLoading(true);
    try {
      const data = await CloudStorage.listMessages(employee.empId, threadId);
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(activeThread);
  }, [activeThread, employee.empId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: MessageItem = {
      id: String(Date.now()),
      sender: employee.fullName,
      isMe: true,
      text: inputVal.trim(),
      time: timeStr
    };

    const next = [...messages, userMsg];
    setMessages(next);
    setInputVal('');

    await CloudStorage.sendMessage(employee.empId, activeThread, userMsg);

    // If messaging manager, generate direct contextual response
    if (activeThread === 'manager') {
      setTimeout(async () => {
        const replyText = `Thanks for the update, ${employee.preferredName}. Keep moving forward on your deliverables and make sure unit specs pass before submitting the PR.`;
        const replyMsg: MessageItem = {
          id: String(Date.now() + 1),
          sender: mgr.name,
          isMe: false,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, replyMsg]);
        await CloudStorage.sendMessage(employee.empId, activeThread, replyMsg);
      }, 800);
    }
  };

  return (
    <section className="workspace-area active" id="areaMessages">
      <div className="area-header">
        <h1 className="area-title">Messages &amp; Direct Channels</h1>
        <p className="area-subtitle">
          Direct messaging with your reporting manager {mgr.name} and squad teammates.
        </p>
      </div>

      <div className="messages-layout">
        {/* Left Threads Directory */}
        <div className="messages-sidebar executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">CHANNELS &amp; DIRECTS</span>
          </div>

          <div className="threads-list">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className={`thread-item ${activeThread === ch.id ? 'active' : ''}`}
                onClick={() => setActiveThread(ch.id)}
              >
                <div className="t-avatar mono">{ch.initials}</div>
                <div className="t-info">
                  <div className="t-name-row">
                    <span className="t-name">{ch.name}</span>
                  </div>
                  <span className="t-preview">{ch.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Active Conversation Pane */}
        <div className="conversation-pane executive-card">
          {/* Header */}
          <div className="conv-header">
            <div className="conv-avatar mono">{activeChannel.initials}</div>
            <div className="conv-meta">
              <span className="conv-name">{activeChannel.name}</span>
              <span className="conv-role">{activeChannel.role}</span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="conv-body">
            {loading && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#71717a', fontSize: '0.85rem' }}>
                Loading conversation...
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  color: '#a1a1aa'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
                  No Messages Yet
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#71717a', maxWidth: '340px', margin: '0 auto' }}>
                  Start the conversation with <strong style={{ color: '#d4d4d8' }}>{activeChannel.name}</strong> regarding tickets, specs, or sprint progress.
                </p>
              </div>
            )}

            {!loading && messages.length > 0 && (
              <div className="messages-stream">
                {messages.map((m) => (
                  <div key={m.id} className={`msg-bubble ${m.isMe ? 'msg-me' : 'msg-them'}`}>
                    <div className="msg-author-row">
                      <span className="msg-sender">{m.isMe ? 'You' : m.sender}</span>
                      <span className="msg-time mono">{m.time}</span>
                    </div>
                    <div className="msg-content">{m.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form className="conv-input-bar" onSubmit={handleSend}>
            <input
              type="text"
              className="conv-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={`Message ${activeChannel.name}...`}
            />
            <button type="submit" className="btn-send-msg" disabled={!inputVal.trim()}>
              Send →
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
