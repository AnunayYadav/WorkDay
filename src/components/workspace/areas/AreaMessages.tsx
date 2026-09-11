import React, { useState } from 'react';
import type { EmployeeState } from '../../../types';

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
  const [activeThread, setActiveThread] = useState<'marcus' | 'devon' | 'sarah' | 'eng'>('marcus');
  const [inputVal, setInputVal] = useState('');

  const [threads, setThreads] = useState<Record<string, MessageItem[]>>({
    marcus: [
      {
        id: 'm1',
        sender: employee.selectedRole?.manager?.name || 'Marcus Vance',
        isMe: false,
        text: `Welcome to the engineering squad, ${employee.preferredName}! Take your time reviewing ticket on your desk. Make sure all unit tests pass before opening the pull request.`,
        time: '10:12 AM'
      },
      {
        id: 'm2',
        sender: employee.fullName,
        isMe: true,
        text: 'Thanks! I am working on the solution patch right now and running the unit test suite.',
        time: '10:14 AM'
      },
      {
        id: 'm3',
        sender: employee.selectedRole?.manager?.name || 'Marcus Vance',
        isMe: false,
        text: 'Sounds good. Ping me here or during our 2:30 PM 1-on-1 if you hit any roadbumps.',
        time: '10:16 AM'
      }
    ],
    devon: [
      {
        id: 'd1',
        sender: 'Devon Reed',
        isMe: false,
        text: `Hey ${employee.preferredName || 'there'}! If you need any help with the shared component styling or theme tokens, let me know.`,
        time: '09:45 AM'
      }
    ],
    sarah: [
      {
        id: 's1',
        sender: 'Sarah Chen',
        isMe: false,
        text: 'Welcome aboard! Our Figma design system specs are linked in the Company portal if you want to inspect tokens.',
        time: '09:50 AM'
      }
    ],
    eng: [
      {
        id: 'e1',
        sender: 'Engineering Bot',
        isMe: false,
        text: 'Sprint 01 kickoff completed. All 16 production repositories verified and CI runners are online.',
        time: '09:00 AM'
      }
    ]
  });

  const handleSend = (e: React.FormEvent) => {
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

    setThreads(prev => ({
      ...prev,
      [activeThread]: [...(prev[activeThread] || []), userMsg]
    }));

    setInputVal('');

    // Auto-reply
    setTimeout(() => {
      let replyText = `Got it, ${employee.preferredName}. Keep up the great velocity.`;
      if (activeThread === 'marcus') {
        replyText = `Understood. Make sure to commit the solution patch and run specs in Monaco Studio.`;
      } else if (activeThread === 'devon') {
        replyText = `Nice! Let me know once you submit the PR and I can also take a look at the diff.`;
      } else if (activeThread === 'sarah') {
        replyText = `Awesome, thanks for the update!`;
      }

      const botReply: MessageItem = {
        id: String(Date.now() + 1),
        sender: activeThread === 'marcus' ? (employee.selectedRole?.manager?.name || 'Marcus Vance') : (activeThread === 'devon' ? 'Devon Reed' : 'Sarah Chen'),
        isMe: false,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setThreads(prev => ({
        ...prev,
        [activeThread]: [...(prev[activeThread] || []), botReply]
      }));
    }, 1000);
  };

  const contactDetails: Record<string, { name: string; role: string }> = {
    marcus: { name: employee.selectedRole?.manager?.name || 'Marcus Vance', role: 'Engineering Director · Direct Manager' },
    devon: { name: 'Devon Reed', role: 'Staff Frontend · Squad Teammate' },
    sarah: { name: 'Sarah Chen', role: 'UI/UX Engineer · Squad Teammate' },
    eng: { name: '#engineering-core', role: 'Organization Announcements & Sprint Updates' }
  };

  const currentContact = contactDetails[activeThread];

  return (
    <section className="workspace-area active" id="areaMessages">
      <div className="area-header">
        <h1 className="area-title">Messages</h1>
        <p className="area-subtitle">Internal channels and direct messaging.</p>
      </div>

      <div className="messages-shell">
        {/* Left Pane: Channels & People */}
        <div className="msg-channels-pane">
          <div className="msg-pane-header">CHANNELS &amp; DIRECT</div>
          <div className="msg-channel-list">
            <button
              type="button"
              className={`msg-channel-btn ${activeThread === 'marcus' ? 'active' : ''}`}
              onClick={() => setActiveThread('marcus')}
            >
              <div className="msg-avatar-sm">{employee.selectedRole?.manager?.initials || 'MV'}</div>
              <div className="msg-channel-meta">
                <span className="c-name">{employee.selectedRole?.manager?.name || 'Marcus Vance'}</span>
                <span className="c-sub">Engineering Director</span>
              </div>
            </button>

            <button
              type="button"
              className={`msg-channel-btn ${activeThread === 'devon' ? 'active' : ''}`}
              onClick={() => setActiveThread('devon')}
            >
              <div className="msg-avatar-sm">DR</div>
              <div className="msg-channel-meta">
                <span className="c-name">Devon Reed</span>
                <span className="c-sub">Staff Frontend</span>
              </div>
            </button>

            <button
              type="button"
              className={`msg-channel-btn ${activeThread === 'sarah' ? 'active' : ''}`}
              onClick={() => setActiveThread('sarah')}
            >
              <div className="msg-avatar-sm">SC</div>
              <div className="msg-channel-meta">
                <span className="c-name">Sarah Chen</span>
                <span className="c-sub">UI/UX Engineer</span>
              </div>
            </button>

            <button
              type="button"
              className={`msg-channel-btn ${activeThread === 'eng' ? 'active' : ''}`}
              onClick={() => setActiveThread('eng')}
            >
              <div className="msg-avatar-sm">#</div>
              <div className="msg-channel-meta">
                <span className="c-name">#engineering-core</span>
                <span className="c-sub">Announcements</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Pane: Active Conversation */}
        <div className="msg-chat-pane">
          <div className="chat-top-header">
            <div className="chat-contact-info">
              <span className="contact-name" id="chatContactName">{currentContact.name}</span>
              <span className="contact-role" id="chatContactRole">{currentContact.role}</span>
            </div>
          </div>

          {/* Message Stream */}
          <div className="chat-stream-scroll" id="messagesChatStream">
            {(threads[activeThread] || []).map(msg => (
              <div key={msg.id} className={`chat-bubble ${msg.isMe ? 'user' : 'manager'}`}>
                <div className="bubble-body">{msg.text}</div>
                <span className="bubble-time">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="chat-input-bar">
            <input
              type="text"
              className="chat-input"
              id="chatInputMsg"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Send a message..."
            />
            <button type="submit" className="btn-send-chat" id="btnSendMsg">
              Send →
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
