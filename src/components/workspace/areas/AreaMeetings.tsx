import React, { useState, useEffect } from 'react';
import type { EmployeeState } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';
import { useToast } from '../../../lib/toast';

interface AreaMeetingsProps {
  employee: EmployeeState;
}

export const AreaMeetings: React.FC<AreaMeetingsProps> = ({ employee }) => {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Form states for scheduling a real meeting with manager
  const [meetTitle, setMeetTitle] = useState('');
  const meetType = 'one_on_one';
  const [platform, setPlatform] = useState<'google_meet' | 'zoom' | 'teams'>('google_meet');
  const [meetLink, setMeetLink] = useState('');
  const [meetId, setMeetId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const duration = '30 mins';
  const [agendaText, setAgendaText] = useState('');

  const mgr = employee.selectedRole?.manager || {
    name: 'Marcus Vance',
    title: 'Engineering Director',
    initials: 'MV',
    quote: ''
  };

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const data = await CloudStorage.listMeetings(employee.empId);
      setMeetings(data || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [employee.empId]);

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    showToast({
      title: 'Link Copied',
      message: 'Meeting link copied to clipboard.',
      type: 'success'
    });
  };

  const handleDeleteMeeting = async (id: string) => {
    await CloudStorage.deleteMeeting(employee.empId, id);
    setMeetings(prev => prev.filter(m => m.id !== id));
    showToast({
      title: 'Meeting Removed',
      message: 'The meeting has been removed from your schedule.',
      type: 'info'
    });
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim() || !scheduleTime.trim()) {
      showToast({
        title: 'Required Fields',
        message: 'Please provide a meeting title and scheduled time.',
        type: 'warning'
      });
      return;
    }

    const cleanLink = meetLink.trim() || (platform === 'zoom' ? 'https://zoom.us/join' : 'https://meet.google.com/new');
    const agendaList = agendaText.split('\n').map(s => s.trim()).filter(Boolean);

    const newMeeting = {
      id: `meet-${Date.now()}`,
      empId: employee.empId,
      title: meetTitle.trim(),
      type: meetType,
      platform,
      link: cleanLink,
      meetingId: meetId.trim() || cleanLink.split('/').pop() || '',
      passcode: passcode.trim(),
      hostName: mgr.name,
      hostTitle: mgr.title,
      hostInitials: mgr.initials,
      scheduleTime: scheduleTime.trim(),
      duration,
      status: 'upcoming',
      agenda: agendaList,
      attendees: [mgr.name, `${employee.fullName} (You)`]
    };

    await CloudStorage.createMeeting(newMeeting);
    setMeetings(prev => [newMeeting, ...prev]);
    setIsScheduleOpen(false);
    setMeetTitle('');
    setMeetLink('');
    setMeetId('');
    setPasscode('');
    setScheduleTime('');
    setAgendaText('');

    showToast({
      title: 'Meeting Scheduled',
      message: `Session booked with ${mgr.name}.`,
      type: 'success'
    });
  };

  return (
    <section className="workspace-area active" id="areaMeetings">
      <div className="area-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="area-title">Meetings &amp; Standups</h1>
          <p className="area-subtitle">
            Synchronize directly with reporting manager {mgr.name} ({mgr.title}). Real meeting links, Google Meet &amp; Zoom coordinates.
          </p>
        </div>

        <button
          type="button"
          className="btn-action-primary"
          style={{
            background: '#ffffff',
            color: '#090a0f',
            fontWeight: 600,
            fontSize: '0.82rem',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'opacity 0.15s ease'
          }}
          onClick={() => setIsScheduleOpen(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Schedule Meeting with Manager
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#71717a' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <span style={{ fontSize: '0.85rem' }}>Loading meetings from Supabase...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && meetings.length === 0 && (
        <div className="executive-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '2rem auto' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            color: '#a1a1aa'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
            No Scheduled Meetings Yet
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#71717a', lineHeight: '1.5', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            You have no upcoming standups or mentorship sessions listed with your manager <strong style={{ color: '#d4d4d8' }}>{mgr.name}</strong>.
          </p>
          <button
            type="button"
            className="btn-action-primary"
            style={{
              background: '#ffffff',
              color: '#090a0f',
              fontWeight: 600,
              fontSize: '0.82rem',
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={() => setIsScheduleOpen(true)}
          >
            + Schedule 1-on-1 or Standup
          </button>
        </div>
      )}

      {/* Meetings List */}
      {!loading && meetings.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
          {meetings.map((m) => {
            const hostName = m.host_name || m.hostName || mgr.name;
            const hostTitle = m.host_title || m.hostTitle || mgr.title;
            const schedTime = m.schedule_time || m.scheduleTime || 'Scheduled Today';
            const meetUrl = m.link || 'https://meet.google.com';
            const plat = m.platform || 'google_meet';

            return (
              <div
                key={m.id}
                className="executive-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      background: plat === 'zoom' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {plat === 'zoom' ? 'Zoom Meeting' : plat === 'teams' ? 'Microsoft Teams' : 'Google Meet'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMeeting(m.id)}
                      title="Cancel / Remove Meeting"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#71717a',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '2px 6px'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Title & Host */}
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
                    {m.title}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.85rem' }}>
                    Host: <span style={{ color: '#ffffff', fontWeight: 500 }}>{hostName}</span> ({hostTitle})
                  </div>

                  {/* Details Box */}
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    marginBottom: '1rem',
                    fontSize: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#71717a' }}>Schedule:</span>
                      <span style={{ color: '#ffffff', fontWeight: 500 }} className="mono">{schedTime}</span>
                    </div>
                    {m.meeting_id || m.meetingId ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#71717a' }}>Meeting ID:</span>
                        <span style={{ color: '#d4d4d8' }} className="mono">{m.meeting_id || m.meetingId}</span>
                      </div>
                    ) : null}
                    {m.passcode ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#71717a' }}>Passcode:</span>
                        <span style={{ color: '#d4d4d8' }} className="mono">{m.passcode}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Agenda List if present */}
                  {Array.isArray(m.agenda) && m.agenda.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Agenda Focus
                      </span>
                      <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.5' }}>
                        {m.agenda.map((ag: string, idx: number) => (
                          <li key={idx}>{ag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <a
                    href={meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: '#ffffff',
                      color: '#090a0f',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      textDecoration: 'none'
                    }}
                  >
                    Join Call →
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(meetUrl)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#d4d4d8',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isScheduleOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#0e1015',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            padding: '1.75rem',
            color: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>Schedule Meeting with Manager</h2>
                <p style={{ fontSize: '0.78rem', color: '#71717a', marginTop: '2px' }}>
                  Direct sync with {mgr.name} ({mgr.title})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                  Meeting Title / Topic
                </label>
                <input
                  type="text"
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                  placeholder="e.g. 1-on-1 Code Review & Architecture Sync"
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: '#181a20',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    placeholder="e.g. Today at 03:00 PM UTC+05:30"
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                  Meeting Link (Google Meet / Zoom URL)
                </label>
                <input
                  type="url"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder={platform === 'zoom' ? 'https://zoom.us/j/123456789' : 'https://meet.google.com/abc-defg-hij'}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                    Meeting ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={meetId}
                    onChange={(e) => setMeetId(e.target.value)}
                    placeholder="e.g. 948 201 442"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                    Passcode (Optional)
                  </label>
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="e.g. vhq2026"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                  Agenda Notes (One per line)
                </label>
                <textarea
                  rows={3}
                  value={agendaText}
                  onChange={(e) => setAgendaText(e.target.value)}
                  placeholder="Review code patch&#10;Sprint SLA progress"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#a1a1aa',
                    fontWeight: 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#090a0f',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Confirm &amp; Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
