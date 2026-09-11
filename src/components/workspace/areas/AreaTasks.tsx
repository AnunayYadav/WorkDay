import React, { useState } from 'react';
import { taskItemToProblemIssue, type ProblemIssue, type EmployeeState, type TaskItem } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';

interface AreaTasksProps {
  activeTask: ProblemIssue | null;
  completedTasks: ProblemIssue[];
  queuedTasks: ProblemIssue[];
  onOpenStudio: (task: ProblemIssue) => void;
  employee?: EmployeeState;
  managerTasks?: TaskItem[];
  onUpdateManagerTasks?: (tasks: TaskItem[]) => void;
}

export const AreaTasks: React.FC<AreaTasksProps> = ({
  activeTask,
  completedTasks,
  queuedTasks,
  onOpenStudio,
  managerTasks: assignedTasks = [],
  onUpdateManagerTasks: setAssignedTasks = () => {}
}) => {
  const [taskFilter, setTaskFilter] = useState<'active' | 'assigned' | 'completed' | 'backlog'>('active');


  const lvl = (activeTask?.level || 'Easy').toLowerCase();

  // Safe date formatter that handles both ISO strings and legacy pre-formatted strings
  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return 'End of Sprint';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime()) && d.getFullYear() > 2020) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (_) {}
    // If parsing failed or year is wrong, return the raw string
    return dateStr;
  };

  return (
    <section className="workspace-area active" id="areaTasks">
      <div className="area-header">
        <h1 className="area-title">My Tasks &amp; Sprint Deliverables</h1>
        <p className="area-subtitle">Assigned sprint tickets, manager delegations, solved solutions, and upcoming backlog progression.</p>
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
              Current Active (<span id="taskCountActive">{(activeTask ? 1 : 0) + assignedTasks.filter(t => t.status !== 'completed').length}</span>)
            </button>
            <button
              type="button"
              className={`filter-chip ${taskFilter === 'assigned' ? 'active' : ''}`}
              onClick={() => setTaskFilter('assigned')}
            >
              Manager Delegations (<span id="taskCountAssigned">{assignedTasks.length}</span>)
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
            {/* Dataset-based active task hero card */}
            {activeTask && (
              <div className="active-task-hero-card" id="tasksActiveCardContainer">
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
              </div>
            )}

            {/* Manager-Assigned Active Tasks in Active View */}
            {assignedTasks.filter(t => t.status !== 'completed').length > 0 && (
              <div style={{ marginTop: activeTask ? '1.25rem' : 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="card-kicker-row" style={{ marginBottom: '0.15rem' }}>
                  <span className="card-kicker">MANAGER ASSIGNED SPRINT TASKS</span>
                  <span className="badge-live">LIVE</span>
                </div>
                {assignedTasks.filter(t => t.status !== 'completed').map(task => {
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

                  const handleStatusChange = async (newStatus: TaskItem['status']) => {
                    await CloudStorage.updateTaskStatus(task.id, newStatus);
                    setAssignedTasks(assignedTasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                  };

                  return (
                    <div
                      key={task.id}
                      style={{
                        background: '#0e1014',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderLeft: `3px solid ${pStyle.color}`,
                        borderRadius: '12px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        transition: 'border-color 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span className="badge-sprint-active">
                            <span className="pulse-dot"></span>
                            ACTIVE SPRINT
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '5px',
                            background: pStyle.bg,
                            color: pStyle.color,
                            border: `1px solid ${pStyle.border}`,
                            textTransform: 'uppercase'
                          }}>
                            {task.priority} PRIORITY
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
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Status:</span>
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(e.target.value as TaskItem['status'])}
                            style={{
                              background: '#18181b',
                              color: task.status === 'completed' ? '#4ade80' : '#ffffff',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">In Review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                        {task.title}
                      </h3>

                      {task.description && (
                        <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>
                          {task.description}
                        </p>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingTop: '0.75rem',
                        fontSize: '0.75rem',
                        color: '#71717a',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span>👤 Delegated by: <strong style={{ color: '#e4e4e7' }}>{task.assignedByName || task.assignedByEmpId}</strong></span>
                          {task.dueDate && (
                            <span>📅 Due: <strong style={{ color: '#fb923c' }}>{formatDueDate(task.dueDate)}</strong></span>
                          )}
                        </div>
                        <span className="mono">
                          Assigned: {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="hero-task-actions-row" style={{ marginTop: '0.25rem' }}>
                        <div className="hero-task-cta-group">
                          <button
                            type="button"
                            className="btn-open-ide btn-action-ide"
                            onClick={() => onOpenStudio(taskItemToProblemIssue(task))}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                            </svg>
                            <span>Edit in Monaco Editor →</span>
                          </button>
                          <button
                            type="button"
                            className="btn-upload-zip-trigger"
                            onClick={() => onOpenStudio(taskItemToProblemIssue(task))}
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
                  );
                })}
              </div>
            )}

            {/* Empty state when both are empty */}
            {!activeTask && assignedTasks.filter(t => t.status !== 'completed').length === 0 && (
              <div className="active-task-hero-card" id="tasksActiveCardContainer">
                <div className="tasks-empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div className="empty-h" style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
                    No Active Sprint Deliverable Assigned
                  </div>
                  <div className="empty-sub" style={{ fontSize: '0.82rem', color: '#71717a', maxWidth: '380px', margin: '0 auto' }}>
                    There are currently no active sprint tickets. When deliverables are created or assigned by your manager, they will appear here.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Manager Delegated Assigned Tasks View Subpane */}
        {taskFilter === 'assigned' && (
          <div id="tasksViewAssigned" className="tasks-subview">
            <div className="assigned-tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {assignedTasks.length === 0 ? (
                <div className="tasks-empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
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
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                  </div>
                  <div className="empty-h" style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
                    No Delegated Tasks Yet
                  </div>
                  <div className="empty-sub" style={{ fontSize: '0.82rem', color: '#71717a', maxWidth: '380px', margin: '0 auto' }}>
                    Your Engineering Manager hasn't delegated specific tickets to you yet. When sprint tasks are dispatched from the Manager Console, they sync here in real time.
                  </div>
                </div>
              ) : (
                assignedTasks.map((task) => {
                  const priorityColors: Record<string, { bg: string; color: string; border: string }> = {
                    urgent: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
                    high: { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
                    medium: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
                    low: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
                  };
                  const pStyle = priorityColors[task.priority] || priorityColors.medium;

                  const handleStatusChange = async (newStatus: TaskItem['status']) => {
                    await CloudStorage.updateTaskStatus(task.id, newStatus);
                    setAssignedTasks(assignedTasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                  };

                  return (
                    <div
                      key={task.id}
                      style={{
                        background: '#0e1014',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        transition: 'border-color 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '5px',
                            background: pStyle.bg,
                            color: pStyle.color,
                            border: `1px solid ${pStyle.border}`,
                            textTransform: 'uppercase'
                          }}>
                            {task.priority} PRIORITY
                          </span>
                          <span className="mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>
                            ID: {task.id.slice(0, 8)}
                          </span>
                        </div>

                        {/* Status Select Control */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Status:</span>
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(e.target.value as TaskItem['status'])}
                            style={{
                              background: '#18181b',
                              color: task.status === 'completed' ? '#4ade80' : '#ffffff',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">In Review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                        {task.title}
                      </h3>

                      {task.description && (
                        <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>
                          {task.description}
                        </p>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingTop: '0.75rem',
                        fontSize: '0.75rem',
                        color: '#71717a',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span>👤 Delegated by: <strong style={{ color: '#e4e4e7' }}>{task.assignedByName || task.assignedByEmpId}</strong></span>
                          {task.dueDate && (
                            <span>📅 Due: <strong style={{ color: '#fb923c' }}>{formatDueDate(task.dueDate)}</strong></span>
                          )}
                        </div>
                        <span className="mono">
                          Assigned: {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="hero-task-actions-row" style={{ marginTop: '0.25rem' }}>
                        <div className="hero-task-cta-group">
                          <button
                            type="button"
                            className="btn-open-ide btn-action-ide"
                            onClick={() => onOpenStudio(taskItemToProblemIssue(task))}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                            </svg>
                            <span>Edit in Monaco Editor →</span>
                          </button>
                          <button
                            type="button"
                            className="btn-upload-zip-trigger"
                            onClick={() => onOpenStudio(taskItemToProblemIssue(task))}
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
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 3. Completed Tasks View Subpane */}
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
                <div className="tasks-empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
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
                  <div className="empty-h" style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
                    Backlog Queue Clear
                  </div>
                  <div className="empty-sub" style={{ fontSize: '0.82rem', color: '#71717a', maxWidth: '380px', margin: '0 auto' }}>
                    No upcoming sprint deliverables are queued in Supabase.
                  </div>
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
