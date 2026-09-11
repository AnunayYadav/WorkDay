import React, { useState } from 'react';
import type { EmployeeState, ProblemIssue } from '../../../types';

interface AreaHomeProps {
  employee: EmployeeState;
  activeTask: ProblemIssue | null;
  completedCount: number;
  totalXp: number;
  queuedTasks: ProblemIssue[];
  onOpenStudio: (task: ProblemIssue) => void;
  onNavigate: (area: string) => void;
}

export const AreaHome: React.FC<AreaHomeProps> = ({
  employee,
  activeTask,
  completedCount,
  totalXp,
  queuedTasks,
  onOpenStudio,
  onNavigate
}) => {
  const [scratchpad, setScratchpad] = useState<string>(
    localStorage.getItem('vhq_scratchpad') || 'Standup notes: Reviewing sprint issues and API specifications.'
  );

  const handleScratchpadChange = (val: string) => {
    setScratchpad(val);
    localStorage.setItem('vhq_scratchpad', val);
  };

  const lvl = (activeTask?.level || 'Easy').toLowerCase();

  return (
    <section className="workspace-area active" id="areaHome">
      <div className="area-header">
        <h1 className="area-title" id="deskGreeting">
          Good morning, {employee.preferredName || 'Engineer'}.
        </h1>
        <p className="area-subtitle" id="homeSprintSubtitle">
          Sprint 01 Focus · {activeTask ? '1' : '0'} Active Deliverable Assigned · {completedCount} Completed
        </p>
      </div>

      {/* Dynamic Active Deliverable Card Container */}
      <div className="home-active-task-container" id="homeActiveTaskContainer">
        {activeTask ? (
          <div className="active-task-hero-card">
            <div className="hero-task-topline">
              <div className="hero-task-badges">
                <span className="badge-sprint-active">
                  <span className="pulse-dot"></span>
                  ACTIVE SPRINT 01
                </span>
                <span className={`issue-level-pill ${lvl}`}>{activeTask.level}</span>
                <a
                  href={activeTask.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge-repo-link"
                  title={`Open ${activeTask.repo} on GitHub`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>{activeTask.repo} · #{activeTask.issue_no}</span>
                </a>
              </div>
              <span className="mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned to You</span>
            </div>

            <h2 className="hero-task-title">
              Sprint Issue #{activeTask.issue_no}: Resolve module in {activeTask.repo.split('/')[1] || activeTask.repo}
            </h2>
            <p className="hero-task-desc">
              Investigate and resolve open issue #{activeTask.issue_no} in {activeTask.repo}. Inspect reproduction state, conform to architectural conventions, and verify unit specs.
            </p>

            <div className="hero-task-ac-list">
              <span className="ac-title">ACCEPTANCE CRITERIA</span>
              <div className="ac-check-item">
                <span className="ac-ico">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>Conform code fix to {activeTask.role} standards</span>
              </div>
              <div className="ac-check-item">
                <span className="ac-ico">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>Pass all automated unit &amp; regression assertions</span>
              </div>
              <div className="ac-check-item">
                <span className="ac-ico">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>Submit PR to Lead Manager for Code Review (+50 XP)</span>
              </div>
            </div>

            <div className="hero-task-actions-row">
              <div className="hero-task-cta-group">
                <button
                  type="button"
                  className="btn-open-ide btn-action-ide"
                  onClick={() => onOpenStudio(activeTask)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                  <span>Solve in Monaco Studio →</span>
                </button>
                <button
                  type="button"
                  className="btn-upload-zip-trigger"
                  onClick={() => onOpenStudio(activeTask)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                  <span>Upload Solution .zip</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="tasks-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8' }}>All sprint deliverables completed! Check back next cycle.</p>
          </div>
        )}
      </div>

      {/* Real Sprint Telemetry Strip */}
      <div className="sprint-telemetry-strip">
        <div className="telemetry-box">
          <span className="t-label">ASSIGNED DELIVERABLES</span>
          <span className="t-val" id="homeMetricAssigned">{activeTask ? '1 Active' : '0 Active'}</span>
        </div>
        <div className="telemetry-box">
          <span className="t-label">COMPLETED &amp; MERGED</span>
          <span className="t-val" id="homeMetricCompleted">{completedCount} Solved</span>
        </div>
        <div className="telemetry-box">
          <span className="t-label">EARNED SPRINT XP</span>
          <span className="t-val" id="homeMetricXp">{totalXp} XP</span>
        </div>
        <div className="telemetry-box">
          <span className="t-label">PIPELINE INTEGRITY</span>
          <span className="t-val" style={{ color: '#ffffff' }}>100% CI Passing</span>
        </div>
      </div>

      {/* Backlog Queue Preview */}
      <div className="backlog-preview-card executive-card">
        <div className="card-kicker-row">
          <span className="card-kicker">UP NEXT IN SPRINT (BACKLOG PROGRESSION)</span>
          <span className="backlog-count-pill mono" id="homeBacklogCount">
            {queuedTasks.length > 0 ? `${queuedTasks.length} Queued in Backlog` : 'Backlog Clear'}
          </span>
        </div>
        <div id="homeBacklogPreviewList" className="backlog-preview-list">
          {queuedTasks.slice(0, 2).map(prob => (
            <div key={prob.s_no} className="backlog-preview-item">
              <div className="b-left">
                <span className="mono" style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  #{prob.issue_no}
                </span>
                <span className="b-name">{prob.repo}</span>
                <span className={`issue-level-pill ${(prob.level || 'Easy').toLowerCase()}`}>{prob.level}</span>
              </div>
              <span className="b-status mono">Up Next</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desk Quick Actions & Standup Row */}
      <div className="desk-bottom-row" style={{ marginTop: '1.5rem' }}>
        <div className="executive-card scratchpad-card-clean">
          <div className="card-kicker-row">
            <span className="card-kicker">PERSONAL DESK NOTES</span>
            <span className="scratch-status mono" id="scratchStatus">SAVED</span>
          </div>
          <textarea
            className="desk-scratchpad mono"
            id="deskScratchpad"
            value={scratchpad}
            onChange={(e) => handleScratchpadChange(e.target.value)}
            placeholder="Meeting notes, API endpoints, or personal checklist..."
          />
        </div>

        <div className="executive-card standup-mini-card">
          <div className="card-kicker-row">
            <span className="card-kicker">DAILY STANDUP</span>
          </div>
          <p className="mini-card-text">Room #402 is active. Join your manager and squad for daily sprint sync.</p>
          <button
            type="button"
            className="btn-clean-standup"
            id="btnJumpToStandup"
            onClick={() => onNavigate('meetings')}
          >
            Enter Standup Room →
          </button>
        </div>
      </div>
    </section>
  );
};
