import React, { useState, useEffect, useRef } from 'react';
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
  empId?: string;
  threadId?: string;
}

export const AreaMessages: React.FC<AreaMessagesProps> = ({ employee }) => {
  const mgr = employee.selectedRole?.manager || {
    name: 'Marcus Vance',
    title: 'Engineering Director',
    initials: 'MV'
  };

  const [colleagues, setColleagues] = useState<EmployeeState[]>([]);
  const [activeThread, setActiveThread] = useState<string>('#general');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    let isMounted = true;
    CloudStorage.listProfiles(employee.companyName || 'Stripe').then(profiles => {
      if (isMounted) {
        const others = profiles.filter(p => p.empId !== employee.empId && p.fullName);
        setColleagues(others);
      }
    });
    return () => { isMounted = false; };
  }, [employee.empId, employee.companyName]);

  // Build canonical channel & direct directory
  const channels = [
    { id: '#general', name: '#general', role: 'All-Hands & Squad Chat', initials: '#', isChannel: true },
    { id: '#engineering', name: '#engineering', role: 'Architecture & Deployments', initials: 'EN', isChannel: true },
    { id: '#announcements', name: '#announcements', role: 'Executive Announcements', initials: '📢', isChannel: true },
    { id: `mgr-${mgr.name.toLowerCase().replace(/\s+/g, '_')}`, name: `${mgr.name} (Manager)`, role: mgr.title, initials: mgr.initials, isChannel: false, isManager: true },
    ...colleagues.map((c) => ({
      id: c.empId,
      name: c.fullName,
      role: `${c.userType === 'manager' ? '👔 Manager · ' : c.userType === 'hr' ? '🤝 HR · ' : ''}${c.selectedRole?.title || 'Engineer'}`,
      initials: c.preferredName ? c.preferredName.slice(0, 2).toUpperCase() : 'EM',
      isChannel: false,
      isManager: c.userType === 'manager'
    }))
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

    // Subscribe to realtime messages on this thread
    const unsubscribe = CloudStorage.subscribeToMessages(employee.empId, activeThread, (incomingMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === incomingMsg.id)) return prev;
        return [...prev, incomingMsg];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [activeThread, employee.empId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const textToSend = inputVal.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: MessageItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      sender: employee.fullName,
      isMe: true,
      text: textToSend,
      time: timeStr,
      empId: employee.empId,
      threadId: activeThread
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    await CloudStorage.sendMessage(employee.empId, activeThread, userMsg);

    // If messaging simulated manager thread, trigger intelligent automated acknowledgment
    if (activeChannel.isManager && activeChannel.id.startsWith('mgr-')) {
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        const replyText = `Thanks for the update, ${employee.preferredName}. Keep pushing your deliverables in ${employee.companyName || 'the current sprint'} and feel free to ping me if you need architecture unblocking.`;
        const replyMsg: MessageItem = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now() + 1}`,
          sender: mgr.name,
          isMe: false,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          empId: 'system-manager',
          threadId: activeThread
        };
        setMessages(prev => [...prev, replyMsg]);
        await CloudStorage.sendMessage(employee.empId, activeThread, replyMsg);
      }, 1200);
    }
  };

  return (
    <section className="workspace-area active" id="areaMessages">
      <div className="area-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="area-title">Realtime Messages &amp; Squad Channels</h1>
            <p className="area-subtitle">
              Synchronized team communications across {employee.companyName || 'organization'} channels and private 1-on-1s.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.6rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              color: '#4ade80',
              fontWeight: 500
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }}></span>
              Supabase Realtime Active
            </span>
          </div>
        </div>
      </div>

      <div className="messages-layout">
        {/* Left Threads Directory */}
        <div className="messages-sidebar executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">CHANNELS &amp; DIRECTS</span>
            <span className="mono" style={{ fontSize: '0.7rem', color: '#71717a' }}>{channels.length}</span>
          </div>

          <div className="threads-list">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className={`thread-item ${activeThread === ch.id ? 'active' : ''}`}
                onClick={() => setActiveThread(ch.id)}
              >
                <div className={`t-avatar mono ${ch.isChannel ? 'channel-avatar' : ''}`}>
                  {ch.initials}
                </div>
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
            <div className={`conv-avatar mono ${activeChannel.isChannel ? 'channel-avatar' : ''}`}>
              {activeChannel.initials}
            </div>
            <div className="conv-meta">
              <span className="conv-name">{activeChannel.name}</span>
              <span className="conv-role">{activeChannel.role}</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '0.72rem', color: '#71717a' }}>
                {activeChannel.isChannel ? 'PUBLIC CHANNEL' : 'ENCRYPTED 1-ON-1'}
              </span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="conv-body">
            {loading && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#71717a', fontSize: '0.85rem' }}>
                Connecting to live thread...
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
                  No Messages in {activeChannel.name}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#71717a', maxWidth: '340px', margin: '0 auto' }}>
                  Start the realtime conversation regarding tickets, architecture, or deliverables.
                </p>
              </div>
            )}

            {!loading && messages.length > 0 && (
              <div className="messages-stream">
                {messages.map((m) => {
                  const isMe = m.empId ? m.empId === employee.empId : m.isMe;
                  return (
                    <div key={m.id} className={`msg-bubble ${isMe ? 'msg-me' : 'msg-them'}`}>
                      <div className="msg-author-row">
                        <span className="msg-sender">{isMe ? 'You' : m.sender}</span>
                        <span className="msg-time mono">{m.time}</span>
                      </div>
                      <div className="msg-content">{m.text}</div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="msg-bubble msg-them" style={{ opacity: 0.7 }}>
                    <div className="msg-author-row">
                      <span className="msg-sender">{mgr.name}</span>
                      <span className="msg-time mono">typing...</span>
                    </div>
                    <div className="msg-content" style={{ fontStyle: 'italic', color: '#a1a1aa' }}>
                      Writing a reply...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
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
