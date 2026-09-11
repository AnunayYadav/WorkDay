import React, { useState } from 'react';
import type { EmployeeState } from '../../../types';

interface AreaTeamProps {
  employee: EmployeeState;
  onNavigate: (area: string) => void;
}

interface FeedPost {
  id: string;
  avatar: string;
  name: string;
  time: string;
  content: string;
  reactions: string;
}

export const AreaTeam: React.FC<AreaTeamProps> = ({ employee, onNavigate }) => {
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([
    {
      id: 'p1',
      avatar: 'DR',
      name: 'Devon Reed',
      time: '15m ago',
      content: 'Shipped the new token caching layer in core repo! Micro-benchmarks show 34% drop in cold bundle load times. 🎉',
      reactions: '🔥 8 · 🚀 5'
    },
    {
      id: 'p2',
      avatar: 'SC',
      name: 'Sarah Chen',
      time: '42m ago',
      content: 'Updated our dark mode HSL tokens in Figma. Check out the clean monochrome contrast in the company design guidelines.',
      reactions: '❤️ 6 · 👏 4'
    }
  ]);

  const [inputPost, setInputPost] = useState('');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPost.trim()) return;

    const newP: FeedPost = {
      id: String(Date.now()),
      avatar: employee.preferredName?.slice(0, 2).toUpperCase() || 'AM',
      name: employee.fullName,
      time: 'Just now',
      content: inputPost.trim(),
      reactions: '👍 1'
    };

    setFeedPosts([newP, ...feedPosts]);
    setInputPost('');
  };

  return (
    <section className="workspace-area active" id="areaTeam">
      <div className="area-header">
        <h1 className="area-title">My Team</h1>
        <p className="area-subtitle">Engineering squad directory, active tasks, and team watercooler.</p>
      </div>

      <div className="team-grid">
        {/* Virtual Squad Floor Cards */}
        <div className="team-roster-col">
          <div className="executive-card squad-roster-card">
            <div className="card-kicker-row">
              <span className="card-kicker">ENGINEERING SQUAD MEMBERS</span>
              <span className="online-count mono">4 ONLINE</span>
            </div>

            <div className="squad-members-list">
              <div className="member-card">
                <div className="m-avatar">DR</div>
                <div className="m-info">
                  <div className="m-title-row">
                    <span className="m-name">Devon Reed</span>
                    <span className="m-role">Staff Frontend Dev</span>
                  </div>
                  <span className="m-active-task mono">Active: VHQ-101 GraphQL Caching</span>
                  <span className="m-tz">Timezone: UTC-4 (New York) · Working</span>
                </div>
                <button
                  type="button"
                  className="btn-ping-member"
                  onClick={() => onNavigate('messages')}
                >
                  Ping
                </button>
              </div>

              <div className="member-card">
                <div className="m-avatar">SC</div>
                <div className="m-info">
                  <div className="m-title-row">
                    <span className="m-name">Sarah Chen</span>
                    <span className="m-role">UI/UX Engineer</span>
                  </div>
                  <span className="m-active-task mono">Active: VHQ-108 Design System Token Sync</span>
                  <span className="m-tz">Timezone: UTC+8 (Singapore) · Working</span>
                </div>
                <button
                  type="button"
                  className="btn-ping-member"
                  onClick={() => onNavigate('messages')}
                >
                  Ping
                </button>
              </div>

              <div className="member-card">
                <div className="m-avatar">LK</div>
                <div className="m-info">
                  <div className="m-title-row">
                    <span className="m-name">Liam K.</span>
                    <span className="m-role">QA &amp; Automation Lead</span>
                  </div>
                  <span className="m-active-task mono">Active: Playwright E2E Pipeline Validation</span>
                  <span className="m-tz">Timezone: UTC+1 (London) · Working</span>
                </div>
                <button
                  type="button"
                  className="btn-ping-member"
                  onClick={() => onNavigate('messages')}
                >
                  Ping
                </button>
              </div>

              <div className="member-card">
                <div className="m-avatar">PS</div>
                <div className="m-info">
                  <div className="m-title-row">
                    <span className="m-name">Priya Sharma</span>
                    <span className="m-role">Head of Quality Assurance</span>
                  </div>
                  <span className="m-active-task mono">Active: CI/CD Reliability &amp; Release Gates</span>
                  <span className="m-tz">Timezone: UTC+5:30 (Bangalore) · Working</span>
                </div>
                <button
                  type="button"
                  className="btn-ping-member"
                  onClick={() => onNavigate('messages')}
                >
                  Ping
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Company Watercooler / Activity Feed */}
        <div className="team-feed-col">
          <div className="executive-card watercooler-card">
            <div className="card-kicker-row">
              <span className="card-kicker">COMPANY WATERCOOLER &amp; FEED</span>
              <span className="mono" style={{ fontSize: '0.72rem', color: '#71717a' }}>Engineering Lounge</span>
            </div>

            <form onSubmit={handleCreatePost} style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <input
                  type="text"
                  className="chat-input"
                  value={inputPost}
                  onChange={(e) => setInputPost(e.target.value)}
                  placeholder="Share sprint win, architecture thought, or kudos..."
                  style={{ flex: 1, padding: '0.6rem 0.85rem', background: '#090b0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
                <button
                  type="submit"
                  className="btn-send-chat"
                  style={{ padding: '0.6rem 1rem', background: '#ffffff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Post
                </button>
              </div>
            </form>

            <div className="feed-posts-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {feedPosts.map(p => (
                <div key={p.id} style={{ padding: '0.9rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.75rem', color: '#fff' }}>
                      {p.avatar}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f3f4f6' }}>{p.name}</span>
                      <span className="mono" style={{ fontSize: '0.7rem', color: '#71717a', marginLeft: '0.5rem' }}>{p.time}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45, margin: '0.3rem 0 0.5rem' }}>{p.content}</p>
                  <span className="mono" style={{ fontSize: '0.72rem', color: '#f59e0b' }}>{p.reactions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
