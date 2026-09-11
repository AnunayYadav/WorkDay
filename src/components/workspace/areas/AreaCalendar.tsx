import React from 'react';
import type { EmployeeState } from '../../../types';

interface AreaCalendarProps {
  employee: EmployeeState;
  onNavigate: (area: string) => void;
}

export const AreaCalendar: React.FC<AreaCalendarProps> = ({ employee, onNavigate }) => {
  const mgrName = employee.selectedRole?.manager?.name || 'Marcus Vance';

  return (
    <section className="workspace-area active" id="areaCalendar">
      <div className="area-header">
        <h1 className="area-title">Calendar</h1>
        <p className="area-subtitle">Schedule of daily standups, mentorship 1-on-1s, and sprint deadlines.</p>
      </div>

      <div className="calendar-layout">
        <div className="executive-card calendar-timeline-card">
          <div className="cal-header-row">
            <h3 className="cal-date-title">Today — Thursday, September 10, 2026</h3>
            <span className="cal-tz mono">All times in UTC+05:30</span>
          </div>

          <div className="timeline-events-list" id="calendarEventsList">
            {/* Event 1 */}
            <div className="timeline-event active">
              <div className="event-time-col mono">
                <span className="start">10:00 AM</span>
                <span className="dur">15 mins</span>
              </div>
              <div className="event-body">
                <div className="event-title-row">
                  <span className="event-title">Daily Engineering Standup</span>
                  <span className="event-badge live">Live Now</span>
                </div>
                <p className="event-desc">Squad sprint check-in, blocker review, and Day 1 deliverable sync.</p>
                <div className="event-footer">
                  <span className="event-loc mono">Room #402</span>
                  <button
                    type="button"
                    className="btn-event-action"
                    onClick={() => onNavigate('meetings')}
                  >
                    Join Call →
                  </button>
                </div>
              </div>
            </div>

            {/* Event 2 */}
            <div className="timeline-event">
              <div className="event-time-col mono">
                <span className="start">02:30 PM</span>
                <span className="dur">30 mins</span>
              </div>
              <div className="event-body">
                <div className="event-title-row">
                  <span className="event-title">1-on-1 Mentorship &amp; Architecture Review</span>
                </div>
                <p className="event-desc">Direct session with {mgrName} to review sprint PR and career milestone roadmap.</p>
                <div className="event-footer">
                  <span className="event-loc mono">Executive Office #501</span>
                  <span className="event-confirmed mono">✓ Confirmed</span>
                </div>
              </div>
            </div>

            {/* Event 3 */}
            <div className="timeline-event">
              <div className="event-time-col mono">
                <span className="start">04:30 PM</span>
                <span className="dur">45 mins</span>
              </div>
              <div className="event-body">
                <div className="event-title-row">
                  <span className="event-title">Sprint 01 Backlog Refinement</span>
                </div>
                <p className="event-desc">Reviewing next week's story points and QA automation regression suites.</p>
                <div className="event-footer">
                  <span className="event-loc mono">Meeting Room #304</span>
                  <span className="event-confirmed mono">Calendar Invite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
