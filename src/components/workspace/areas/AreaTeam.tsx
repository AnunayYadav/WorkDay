import React, { useState, useEffect } from 'react';
import type { EmployeeState } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';
import { useToast } from '../../../lib/toast';

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
  role?: string;
  reactions?: { likes: number };
}

export const AreaTeam: React.FC<AreaTeamProps> = ({ employee, onNavigate }) => {
  const { showToast } = useToast();
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [inputPost, setInputPost] = useState('');
  const [colleagues, setColleagues] = useState<EmployeeState[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const mgr = employee.selectedRole?.manager || {
    name: 'Marcus Vance',
    title: 'Engineering Director',
    initials: 'MV'
  };

  useEffect(() => {
    let isMounted = true;

    // Load registered colleagues from Supabase
    CloudStorage.listProfiles().then((profiles) => {
      if (isMounted) {
        // Filter out self
        const others = profiles.filter(p => p.empId !== employee.empId && p.fullName);
        setColleagues(others);
      }
    });

    // Load team posts
    CloudStorage.listTeamPosts().then((posts) => {
      if (isMounted) {
        setFeedPosts(posts || []);
        setLoadingPosts(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [employee.empId]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPost.trim()) return;

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      avatar: employee.preferredName?.slice(0, 2).toUpperCase() || 'AM',
      name: employee.fullName,
      role: employee.selectedRole?.title || 'Engineer',
      time: 'Just now',
      content: inputPost.trim(),
      reactions: { likes: 0 }
    };

    setFeedPosts(prev => [newPost, ...prev]);
    setInputPost('');

    await CloudStorage.createTeamPost(newPost);
    showToast({
      title: 'Update Posted',
      message: 'Your update has been shared with the squad.',
      type: 'success'
    });
  };

  return (
    <section className="workspace-area active" id="areaTeam">
      <div className="area-header">
        <h1 className="area-title">My Team &amp; Squad Directory</h1>
        <p className="area-subtitle">
          Direct colleagues in {employee.department || 'Engineering'}, reporting hierarchy, and team watercooler.
        </p>
      </div>

      <div className="team-grid">
        {/* Squad Directory Column */}
        <div className="team-roster-col">
          <div className="executive-card squad-roster-card">
            <div className="card-kicker-row">
              <span className="card-kicker">SQUAD LEADERSHIP &amp; TEAMMATES</span>
              <span className="online-count mono">{1 + colleagues.length} MEMBERS</span>
            </div>

            <div className="squad-members-list">
              {/* Reporting Manager Card */}
              <div className="member-card" style={{ borderLeft: '3px solid rgba(255, 255, 255, 0.4)' }}>
                <div className="m-avatar mono">{mgr.initials}</div>
                <div className="m-info">
                  <div className="m-title-row">
                    <span className="m-name">{mgr.name}</span>
                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', fontWeight: 600 }}>
                      MANAGER
                    </span>
                  </div>
                  <span className="m-role">{mgr.title}</span>
                  <span className="m-tz">Reporting Line · Direct Manager</span>
                </div>
                <button
                  type="button"
                  className="btn-ping-member"
                  onClick={() => onNavigate('messages')}
                >
                  Message
                </button>
              </div>

              {/* Registered Colleagues from Supabase */}
              {colleagues.map((col) => (
                <div key={col.empId} className="member-card">
                  <div className="m-avatar mono" style={{ overflow: 'hidden' }}>
                    {col.avatarUrl ? (
                      <img src={col.avatarUrl} alt={col.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      col.preferredName?.slice(0, 2).toUpperCase() || 'EM'
                    )}
                  </div>
                  <div className="m-info">
                    <div className="m-title-row">
                      <span className="m-name">{col.fullName}</span>
                      <span className="mono" style={{ fontSize: '0.65rem', color: '#71717a' }}>{col.empId}</span>
                    </div>
                    <span className="m-role">{col.selectedRole?.title || 'Engineer'}</span>
                    <span className="m-tz mono" style={{ color: '#a1a1aa' }}>
                      {col.corporateEmail || `${col.handle}@virtualhq.corp`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-ping-member"
                    onClick={() => onNavigate('messages')}
                  >
                    Message
                  </button>
                </div>
              ))}

              {colleagues.length === 0 && (
                <div style={{ padding: '1.5rem 1rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', marginTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.82rem', color: '#a1a1aa', margin: 0, fontWeight: 500 }}>No other colleagues registered yet</p>
                  <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0.25rem 0 0 0' }}>
                    Colleague profiles will appear here automatically when team members sign up in Supabase.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Activity / Watercooler Column */}
        <div className="team-watercooler-col">
          <div className="executive-card watercooler-card">
            <div className="card-kicker-row">
              <span className="card-kicker">SQUAD ACTIVITY FEED</span>
            </div>

            {/* Post Creator */}
            <form className="watercooler-post-form" onSubmit={handleCreatePost}>
              <textarea
                className="wc-input mono"
                value={inputPost}
                onChange={(e) => setInputPost(e.target.value)}
                placeholder="Share a sprint milestone, test result, or note with your squad..."
                rows={2}
              />
              <div className="wc-actions">
                <button type="submit" className="btn-post-wc" disabled={!inputPost.trim()}>
                  Post Update →
                </button>
              </div>
            </form>

            {/* Posts Stream */}
            <div className="wc-feed-stream">
              {loadingPosts && (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#71717a', fontSize: '0.82rem' }}>
                  Loading updates...
                </div>
              )}

              {!loadingPosts && feedPosts.length === 0 && (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
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
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
                    No Team Announcements Yet
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#71717a', maxWidth: '320px', margin: '0 auto' }}>
                    Your squad activity feed is quiet. Share your Day 1 progress or deliverable milestone above.
                  </p>
                </div>
              )}

              {!loadingPosts && feedPosts.length > 0 && feedPosts.map((post) => (
                <div key={post.id} className="wc-post-item">
                  <div className="post-header">
                    <div className="post-avatar mono">{post.avatar}</div>
                    <div className="post-meta">
                      <span className="post-name">{post.name}</span>
                      {post.role && <span style={{ fontSize: '0.7rem', color: '#71717a' }}> · {post.role}</span>}
                    </div>
                    <span className="post-time mono">{post.time}</span>
                  </div>
                  <p className="post-body">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
