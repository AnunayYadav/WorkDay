import React, { useState, useEffect } from 'react';
import type { EmployeeState } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';

interface AreaCalendarProps {
  employee: EmployeeState;
  onNavigate: (area: string) => void;
}

export const AreaCalendar: React.FC<AreaCalendarProps> = ({ employee, onNavigate }) => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mgr = employee.selectedRole?.manager || {
    name: 'Marcus Vance',
    title: 'Engineering Director'
  };

  useEffect(() => {
    let isMounted = true;
    CloudStorage.listMeetings(employee.empId).then((data) => {
      if (isMounted) {
        setMeetings(data || []);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [employee.empId]);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <section className="workspace-area active" id="areaCalendar">
      <div className="area-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="area-title">Calendar &amp; Schedule</h1>
          <p className="area-subtitle">
            Synchronized corporate timeline for sprint standups, PR reviews, and mentorship milestones with {mgr.name}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('meetings')}
          style={{
            background: '#ffffff',
            color: '#090a0f',
            fontWeight: 600,
            fontSize: '0.82rem',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          + Schedule New Meeting
        </button>
      </div>

      <div className="calendar-layout">
        <div className="executive-card calendar-timeline-card">
          <div className="cal-header-row">
            <h3 className="cal-date-title">Today — {todayStr}</h3>
            <span className="cal-tz mono">Times in local timezone (UTC+05:30)</span>
          </div>

          {loading && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#71717a' }}>
              <span style={{ fontSize: '0.85rem' }}>Loading calendar events...</span>
            </div>
          )}

          {!loading && meetings.length === 0 && (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                color: '#a1a1aa'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
                No Events on Your Calendar Today
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#71717a', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
                You have no scheduled calls or standups for today. When meetings are scheduled with your manager, they will appear on this timeline.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('meetings')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  cursor: 'pointer'
                }}
              >
                Go to Meetings Hub →
              </button>
            </div>
          )}

          {!loading && meetings.length > 0 && (
            <div className="timeline-events-list" id="calendarEventsList">
              {meetings.map((m) => {
                const sched = m.schedule_time || m.scheduleTime || 'Today';
                const hostName = m.host_name || m.hostName || mgr.name;
                const link = m.link || 'https://meet.google.com';
                const plat = m.platform || 'google_meet';

                return (
                  <div key={m.id} className="timeline-event active">
                    <div className="event-time-col mono">
                      <span className="start">{sched.split('–')[0]?.trim() || sched}</span>
                      <span className="dur">{m.duration || '30 mins'}</span>
                    </div>
                    <div className="event-body">
                      <div className="event-title-row">
                        <span className="event-title">{m.title}</span>
                        <span className="event-badge live" style={{ background: plat === 'zoom' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}>
                          {plat === 'zoom' ? 'Zoom' : 'Google Meet'}
                        </span>
                      </div>
                      <p className="event-desc">
                        Hosted by {hostName}. {Array.isArray(m.agenda) && m.agenda.length > 0 ? `Agenda: ${m.agenda.join(' · ')}` : 'Sprint coordination & PR review.'}
                      </p>
                      <div className="event-footer">
                        <span className="event-loc mono" style={{ color: '#a1a1aa' }}>
                          {m.meeting_id || m.meetingId ? `ID: ${m.meeting_id || m.meetingId}` : 'Web Conference'}
                        </span>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-event-action"
                          style={{ textDecoration: 'none' }}
                        >
                          Join Meeting →
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
