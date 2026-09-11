import React, { useState, useEffect } from 'react';
import type { EmployeeState, ProblemIssue, TaskItem } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';

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
  const [managerTasks, setManagerTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    if (employee?.empId) {
      CloudStorage.listAssignedTasks(employee.empId).then(tasks => {
        setManagerTasks(tasks.filter(t => t.status !== 'completed'));
      });
      const unsub = CloudStorage.subscribeToTasks(() => {
        CloudStorage.listAssignedTasks(employee.empId).then(tasks => {
          setManagerTasks(tasks.filter(t => t.status !== 'completed'));
        });
      });
      return () => { unsub(); };
    }
  }, [employee?.empId]);

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
          Sprint 01 Focus · {(activeTask ? 1 : 0) + managerTasks.length} Active Deliverable{((activeTask ? 1 : 0) + managerTasks.length) !== 1 ? 's' : ''} Assigned · {completedCount} Completed
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
        ) : managerTasks.length === 0 ? (
          <div className="executive-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', margin: 0 }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto',
              color: '#a1a1aa'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.3rem' }}>
              No Active Sprint Deliverable
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#71717a', maxWidth: '340px', margin: '0 auto' }}>
              Your sprint desk is clear. Deliverables assigned in Supabase will populate here in real-time.
            </p>
          </div>
        ) : null}
      </div>

      {/* Manager-Assigned Active Sprint Tasks */}
      {managerTasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: activeTask ? '1rem' : 0 }}>
          <div className="card-kicker-row" style={{ marginBottom: '0.25rem' }}>
            <span className="card-kicker">ACTIVE SPRINT TASKS (MANAGER ASSIGNED)</span>
            <span className="badge-live">LIVE</span>
          </div>
          {managerTasks.map(task => {
            const priorityColors: Record<string, { bg: string; color: string; border: string }> = {
              critical: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
              high: { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
              medium: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
              low: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
            };
            const pStyle = priorityColors[task.priority] || priorityColors.medium;
            const statusLabels: Record<string, { label: string; color: string }> = {
              todo: { label: 'TO DO', color: '#a1a1aa' },
              in_progress: { label: 'IN PROGRESS', color: '#38bdf8' },
              review: { label: 'IN REVIEW', color: '#a78bfa' },
              completed: { label: 'DELIVERED', color: '#4ade80' },
            };
            const sStyle = statusLabels[task.status] || statusLabels.todo;

            return (
              <div
                key={task.id}
                className="active-task-hero-card"
                style={{
                  borderLeft: `3px solid ${pStyle.color}`,
                  padding: '1.25rem 1.5rem',
                }}
              >
                <div className="hero-task-topline">
                  <div className="hero-task-badges">
                    <span className="badge-sprint-active">
                      <span className="pulse-dot"></span>
                      ACTIVE SPRINT
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '0.18rem 0.5rem',
                      borderRadius: '5px',
                      background: pStyle.bg,
                      color: pStyle.color,
                      border: `1px solid ${pStyle.border}`,
                      textTransform: 'uppercase'
                    }}>
                      {task.priority}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.18rem 0.5rem',
                      borderRadius: '5px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: sStyle.color,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {sStyle.label}
                    </span>
                    {task.repo && (
                      <span className="badge-repo-link" style={{ cursor: 'default' }}>
                        <span>{task.repo} · {task.issueNo || 'TASK'}</span>
                      </span>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned by {task.assignedByName || 'Manager'}</span>
                </div>

                <h2 className="hero-task-title" style={{ fontSize: '1.15rem' }}>
                  {task.title}
                </h2>
                {task.description && (
                  <p className="hero-task-desc">{task.description}</p>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  fontSize: '0.75rem',
                  color: '#71717a',
                  marginTop: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {task.dueDate && (
                    <span>📅 Due: <strong style={{ color: '#fb923c' }}>{task.dueDate}</strong></span>
                  )}
                  <span className="mono">Assigned: {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Real Sprint Telemetry Strip */}
      <div className="sprint-telemetry-strip">
        <div className="telemetry-box">
          <span className="t-label">ASSIGNED DELIVERABLES</span>
          <span className="t-val" id="homeMetricAssigned">{(activeTask ? 1 : 0) + managerTasks.length} Active</span>
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
          {queuedTasks.length === 0 ? (
            <div style={{ padding: '1.25rem 0.5rem', textAlign: 'center', color: '#71717a', fontSize: '0.78rem' }}>
              No upcoming sprint deliverables queued in Supabase.
            </div>
          ) : (
            queuedTasks.slice(0, 2).map(prob => (
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
            ))
          )}
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
            <span className="card-kicker">MANAGER SYNC &amp; STANDUPS</span>
          </div>
          <p className="mini-card-text">
            Review live Google Meet and Zoom coordinates or schedule a 1-on-1 with {employee.selectedRole?.manager?.name || 'your manager'}.
          </p>
          <button
            type="button"
            className="btn-clean-standup"
            id="btnJumpToStandup"
            onClick={() => onNavigate('meetings')}
          >
            View Meetings &amp; Schedule →
          </button>
        </div>
      </div>
    </section>
  );
};
