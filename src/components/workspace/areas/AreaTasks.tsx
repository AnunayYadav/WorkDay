import React, { useState } from 'react';
import type { ProblemIssue } from '../../../types';

interface AreaTasksProps {
  activeTask: ProblemIssue | null;
  completedTasks: ProblemIssue[];
  queuedTasks: ProblemIssue[];
  onOpenStudio: (task: ProblemIssue) => void;
}

export const AreaTasks: React.FC<AreaTasksProps> = ({
  activeTask,
  completedTasks,
  queuedTasks,
  onOpenStudio
}) => {
  const [taskFilter, setTaskFilter] = useState<'active' | 'completed' | 'backlog'>('active');

  const lvl = (activeTask?.level || 'Easy').toLowerCase();

  return (
    <section className="workspace-area active" id="areaTasks">
      <div className="area-header">
        <h1 className="area-title">My Tasks</h1>
        <p className="area-subtitle">Assigned sprint deliverables, solved solutions, and upcoming backlog progression.</p>
      </div>

      <div className="tasks-container">
        {/* Filter Bar */}
        <div className="tasks-toolbar">
          <div className="tasks-filter-group">
            <button
              type="button"
              className={`filter-chip ${taskFilter === 'active' ? 'active' : ''}`}
              onClick={() => setTaskFilter('active')}
            >
              Current Active (<span id="taskCountActive">{activeTask ? '1' : '0'}</span>)
            </button>
            <button
              type="button"
              className={`filter-chip ${taskFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setTaskFilter('completed')}
            >
              Completed (<span id="taskCountDone">{completedTasks.length}</span>)
            </button>
            <button
              type="button"
              className={`filter-chip ${taskFilter === 'backlog' ? 'active' : ''}`}
              onClick={() => setTaskFilter('backlog')}
            >
              Upcoming Backlog (<span id="taskCountBacklog">{queuedTasks.length}</span>)
            </button>
          </div>
        </div>

        {/* 1. Active Task View Subpane */}
        {taskFilter === 'active' && (
          <div id="tasksViewActive" className="tasks-subview">
            <div className="active-task-hero-card" id="tasksActiveCardContainer">
              {activeTask ? (
                <div className="active-task-hero-card" style={{ margin: 0, border: 'none', background: 'transparent', padding: 0 }}>
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      <span>Conform code fix to {activeTask.role} standards</span>
                    </div>
                    <div className="ac-check-item">
                      <span className="ac-ico">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      <span>Pass all automated unit &amp; regression assertions</span>
                    </div>
                    <div className="ac-check-item">
                      <span className="ac-ico">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                        </svg>
                        <span>Solve in Monaco Studio →</span>
                      </button>
                      <button
                        type="button"
                        className="btn-upload-zip-trigger"
                        onClick={() => onOpenStudio(activeTask)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                        <span>Upload Solution .zip</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="tasks-empty-state">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.6">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <div className="empty-h">Sprint Clear</div>
                  <div className="empty-sub">No active tasks pending. All deliverables completed!</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Completed Tasks View Subpane */}
        {taskFilter === 'completed' && (
          <div id="tasksViewCompleted" className="tasks-subview">
            <div className="completed-tasks-list" id="tasksCompletedContainer">
              {completedTasks.length === 0 ? (
                <div className="tasks-empty-state">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.6" style={{ marginBottom: '0.5rem' }}>
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/>
                  </svg>
                  <div className="empty-h">No Completed Tasks Yet</div>
                  <div className="empty-sub">Solve and submit your active sprint problem to pass automated tests and earn PR merge credits.</div>
                </div>
              ) : (
                completedTasks.map((task) => (
                  <div key={task.s_no} className="completed-task-card">
                    <div className="c-task-top">
                      <div className="c-task-badges">
                        <span className="badge-solved">✓ MERGED</span>
                        <span className={`issue-level-pill ${(task.level || 'Easy').toLowerCase()}`}>{task.level}</span>
                        <span className="mono" style={{ fontSize: '0.72rem', color: '#64748b' }}>Issue #{task.issue_no}</span>
                      </div>
                      <span className="mono" style={{ fontSize: '0.72rem', color: '#64748b' }}>Passed CI Benchmarks</span>
                    </div>
                    <h3 className="c-task-title">{task.role}: Resolved #{task.issue_no}</h3>
                    <div className="c-task-meta mono">
                      <span>Repo: {task.repo}</span>
                      <span>Submission: Monaco Web Studio (+50 XP)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. Backlog Tasks View Subpane */}
        {taskFilter === 'backlog' && (
          <div id="tasksViewBacklog" className="tasks-subview">
            <div className="backlog-tasks-list" id="tasksBacklogContainer">
              {queuedTasks.length === 0 ? (
                <div className="tasks-empty-state">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.6" style={{ marginBottom: '0.5rem' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <div className="empty-h">Backlog Cleared</div>
                  <div className="empty-sub">All sprint problem deliverables in your career progression queue are completed.</div>
                </div>
              ) : (
                queuedTasks.map((prob, idx) => (
                  <div key={prob.s_no} className="backlog-task-row">
                    <div className="b-info">
                      <div className="b-title">Sprint Deliverable #{prob.issue_no} in {prob.repo}</div>
                      <div className="b-sub mono">
                        Difficulty: <span className={`issue-level-pill ${(prob.level || 'Easy').toLowerCase()}`}>{prob.level}</span> · Role: {prob.role}
                      </div>
                    </div>
                    <span className="backlog-lock-pill mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Unlocks after Task #{idx === 0 ? (activeTask ? activeTask.issue_no : 'current') : queuedTasks[idx - 1].issue_no}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
