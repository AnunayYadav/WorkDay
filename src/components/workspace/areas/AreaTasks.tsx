import React, { useState } from 'react';
import { 
  Calendar, 
  Code, 
  Package, 
  ArrowRight, 
  GitBranch, 
  CheckCircle2, 
  User, 
  Clock, 
  Lock, 
  FileText,
  ExternalLink 
} from 'lucide-react';
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


  // Safe date formatter that handles both ISO strings and legacy pre-formatted strings
  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return 'End of Sprint';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime()) && d.getFullYear() > 2020) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (_) {}
    return dateStr;
  };

  // Clean human-friendly deliverable title generator
  const cleanTaskTitle = (rawTitle: string, repo?: string, issueNo?: string) => {
    if (!rawTitle) return `Sprint Deliverable — ${repo?.split('/')[1] || repo || 'Core'}`;
    let cleaned = rawTitle.replace(/^\[#?\d+\]\s*/, '').trim();
    cleaned = cleaned.replace(/\s*\([^)]*\)\s*$/, '').trim();
    cleaned = cleaned.replace(/\s*·\s*(Easy|Medium|Hard)\b/i, '').trim();
    return cleaned || `Issue #${issueNo || ''} Resolution`;
  };

  const activeSprintCount = (activeTask ? 1 : 0) + assignedTasks.filter(t => t.status !== 'completed').length;

  return (
    <section className="workspace-area active" id="areaTasks" style={{ maxWidth: '1180px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* 1. Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '-0.025em',
          margin: '0 0 0.35rem 0'
        }}>
          Sprint Deliverables
        </h1>
        <p style={{
          fontSize: '0.85rem',
          color: '#a1a1aa',
          margin: 0
        }}>
          Assigned sprint tickets, manager delegations, verified pull requests, and backlog progression.
        </p>
      </div>

      <div className="tasks-container">
        {/* 2. Apple / Linear Segmented Filter Bar */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '0.25rem',
          marginBottom: '1.75rem',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => setTaskFilter('active')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: taskFilter === 'active' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: taskFilter === 'active' ? '#ffffff' : '#a1a1aa'
            }}
          >
            <span>Current Active</span>
            <span style={{
              fontSize: '0.66rem',
              background: taskFilter === 'active' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              padding: '1px 5px',
              borderRadius: '10px'
            }}>
              {activeSprintCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTaskFilter('assigned')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: taskFilter === 'assigned' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: taskFilter === 'assigned' ? '#ffffff' : '#a1a1aa'
            }}
          >
            <span>Manager Delegations</span>
            <span style={{
              fontSize: '0.66rem',
              background: taskFilter === 'assigned' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              padding: '1px 5px',
              borderRadius: '10px'
            }}>
              {assignedTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTaskFilter('completed')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: taskFilter === 'completed' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: taskFilter === 'completed' ? '#ffffff' : '#a1a1aa'
            }}
          >
            <span>Completed</span>
            <span style={{
              fontSize: '0.66rem',
              background: taskFilter === 'completed' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              padding: '1px 5px',
              borderRadius: '10px'
            }}>
              {completedTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTaskFilter('backlog')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: taskFilter === 'backlog' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: taskFilter === 'backlog' ? '#ffffff' : '#a1a1aa'
            }}
          >
            <span>Upcoming Backlog</span>
            <span style={{
              fontSize: '0.66rem',
              background: taskFilter === 'backlog' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              padding: '1px 5px',
              borderRadius: '10px'
            }}>
              {queuedTasks.length}
            </span>
          </button>
        </div>

        {/* 3. Subview 1: Current Active Tasks */}
        {taskFilter === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Primary active dataset deliverable */}
            {activeTask && (
              <div
                style={{
                  background: '#121215',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.4rem 1.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.72rem',
                      color: '#a1a1aa',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      #{activeTask.issue_no}
                    </span>

                    <a
                      href={activeTask.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.74rem',
                        color: '#94a3b8',
                        textDecoration: 'none'
                      }}
                    >
                      <GitBranch size={12} className="text-zinc-500" />
                      <span>{activeTask.repo}</span>
                      <ExternalLink size={10} className="text-zinc-600" />
                    </a>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.7rem',
                      color: '#a1a1aa'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      <span>Sprint Focus</span>
                    </span>

                    <span style={{
                      fontSize: '0.7rem',
                      color: '#71717a',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px'
                    }}>
                      {activeTask.level}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Assigned to You</span>
                </div>

                <div>
                  <h2 style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: '#f4f4f5',
                    letterSpacing: '-0.015em',
                    margin: '0 0 0.4rem 0'
                  }}>
                    {cleanTaskTitle(activeTask.role, activeTask.repo, activeTask.issue_no)}
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>
                    Investigate and resolve open issue #{activeTask.issue_no} in {activeTask.repo}. Inspect reproduction environment, conform to codebase conventions, and pass assertions.
                  </p>
                </div>

                {/* Acceptance Criteria */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: 600, color: '#71717a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Acceptance Criteria
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#d4d4d8' }}>
                    <CheckCircle2 size={13} className="text-zinc-500" />
                    <span>Conform code fix to {activeTask.role} standards</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#d4d4d8' }}>
                    <CheckCircle2 size={13} className="text-zinc-500" />
                    <span>Pass all automated unit and regression assertions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#d4d4d8' }}>
                    <CheckCircle2 size={13} className="text-zinc-500" />
                    <span>Submit PR to Lead Manager for Code Review (+50 XP)</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.74rem', color: '#71717a' }}>
                    <Clock size={12} className="text-zinc-500" />
                    <span>Sprint 01 Priority</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => onOpenStudio(activeTask)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#ffffff',
                        color: '#09090b',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        padding: '0.35rem 0.85rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <Code size={13} />
                      <span>Edit in Monaco Editor</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenStudio(activeTask)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: '#d4d4d8',
                        fontSize: '0.74rem',
                        fontWeight: 500,
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer'
                      }}
                    >
                      <Package size={13} />
                      <span>Upload Archive</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Manager-Assigned Active Tasks */}
            {assignedTasks.filter(t => t.status !== 'completed').map(task => {
              const handleStatusChange = async (newStatus: TaskItem['status']) => {
                await CloudStorage.updateTaskStatus(task.id, newStatus);
                setAssignedTasks(assignedTasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
              };

              return (
                <div
                  key={task.id}
                  style={{
                    background: '#121215',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.72rem',
                        color: '#a1a1aa',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        #{task.issueNo || task.id.slice(0, 5)}
                      </span>

                      {task.repo && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.74rem',
                          color: '#94a3b8'
                        }}>
                          <GitBranch size={12} className="text-zinc-500" />
                          <span>{task.repo}</span>
                        </span>
                      )}

                      <span style={{
                        fontSize: '0.7rem',
                        color: '#71717a',
                        textTransform: 'capitalize'
                      }}>
                        {task.priority} Priority
                      </span>
                    </div>

                    {/* Status Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Status:</span>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(e.target.value as TaskItem['status'])}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: task.status === 'completed' ? '#10b981' : '#d4d4d8',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="todo" style={{ background: '#18181b', color: '#d4d4d8' }}>To Do</option>
                        <option value="in_progress" style={{ background: '#18181b', color: '#d4d4d8' }}>In Progress</option>
                        <option value="review" style={{ background: '#18181b', color: '#d4d4d8' }}>In Review</option>
                        <option value="completed" style={{ background: '#18181b', color: '#10b981' }}>Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: '#f4f4f5',
                      letterSpacing: '-0.01em',
                      margin: '0 0 0.35rem 0'
                    }}>
                      {cleanTaskTitle(task.title, task.repo, task.issueNo)}
                    </h3>
                    {task.description && (
                      <p style={{
                        fontSize: '0.82rem',
                        color: '#94a3b8',
                        lineHeight: 1.5,
                        margin: 0
                      }}>
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.74rem', color: '#71717a' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={12} className="text-zinc-500" />
                        <span>Delegated by {task.assignedByName || 'Manager'}</span>
                      </span>
                      {task.dueDate && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={12} className="text-zinc-500" />
                          <span>Due {formatDueDate(task.dueDate)}</span>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => onOpenStudio(taskItemToProblemIssue(task))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: '#ffffff',
                          color: '#09090b',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.85rem',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Code size={13} />
                        <span>Edit in Monaco Editor</span>
                        <ArrowRight size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenStudio(taskItemToProblemIssue(task))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: '#d4d4d8',
                          fontSize: '0.74rem',
                          fontWeight: 500,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer'
                        }}
                      >
                        <Package size={13} />
                        <span>Upload Archive</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {!activeTask && assignedTasks.filter(t => t.status !== 'completed').length === 0 && (
              <div style={{
                background: '#121215',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '3rem 1.5rem',
                textAlign: 'center'
              }}>
                <FileText size={28} className="text-zinc-600" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f4f4f5', margin: '0 0 0.3rem 0' }}>
                  No Active Sprint Deliverables
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#71717a', maxWidth: '360px', margin: '0 auto' }}>
                  Your sprint board is clear. Deliverables assigned by leadership or the sprint queue will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. Subview 2: Manager Delegations */}
        {taskFilter === 'assigned' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {assignedTasks.length === 0 ? (
              <div style={{
                background: '#121215',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '3rem 1.5rem',
                textAlign: 'center'
              }}>
                <FileText size={28} className="text-zinc-600" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f4f4f5', margin: '0 0 0.3rem 0' }}>
                  No Delegated Tasks
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#71717a', maxWidth: '360px', margin: '0 auto' }}>
                  Your Engineering Manager has not dispatched specific delegations yet.
                </p>
              </div>
            ) : (
              assignedTasks.map((task) => {
                const handleStatusChange = async (newStatus: TaskItem['status']) => {
                  await CloudStorage.updateTaskStatus(task.id, newStatus);
                  setAssignedTasks(assignedTasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                };

                return (
                  <div
                    key={task.id}
                    style={{
                      background: '#121215',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.72rem',
                          color: '#a1a1aa',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>
                          #{task.issueNo || task.id.slice(0, 5)}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'capitalize' }}>
                          {task.priority} Priority
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Status:</span>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(e.target.value as TaskItem['status'])}
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            color: task.status === 'completed' ? '#10b981' : '#d4d4d8',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '6px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="todo" style={{ background: '#18181b', color: '#d4d4d8' }}>To Do</option>
                          <option value="in_progress" style={{ background: '#18181b', color: '#d4d4d8' }}>In Progress</option>
                          <option value="review" style={{ background: '#18181b', color: '#d4d4d8' }}>In Review</option>
                          <option value="completed" style={{ background: '#18181b', color: '#10b981' }}>Completed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f5', margin: '0 0 0.35rem 0' }}>
                        {cleanTaskTitle(task.title, task.repo, task.issueNo)}
                      </h3>
                      {task.description && (
                        <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.74rem', color: '#71717a' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={12} className="text-zinc-500" />
                          <span>Delegated by {task.assignedByName || 'Manager'}</span>
                        </span>
                        {task.dueDate && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={12} className="text-zinc-500" />
                            <span>Due {formatDueDate(task.dueDate)}</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenStudio(taskItemToProblemIssue(task))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: '#ffffff',
                          color: '#09090b',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.85rem',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Code size={13} />
                        <span>Edit in Monaco Editor</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 5. Subview 3: Completed Tasks */}
        {taskFilter === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {completedTasks.length === 0 ? (
              <div style={{
                background: '#121215',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '3rem 1.5rem',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={28} className="text-zinc-600" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f4f4f5', margin: '0 0 0.3rem 0' }}>
                  No Completed Tasks Yet
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#71717a', maxWidth: '360px', margin: '0 auto' }}>
                  Solve and submit your active sprint deliverables to pass automated checks and earn PR merge credits.
                </p>
              </div>
            ) : (
              completedTasks.map((task) => (
                <div
                  key={task.s_no}
                  style={{
                    background: '#121215',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        <CheckCircle2 size={11} />
                        <span>MERGED</span>
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#71717a' }}>
                        Issue #{task.issue_no}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Passed CI Benchmarks</span>
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f4f4f5', margin: 0 }}>
                    {cleanTaskTitle(task.role, task.repo, task.issue_no)}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.74rem',
                    color: '#71717a',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <GitBranch size={12} className="text-zinc-500" />
                      <span>{task.repo}</span>
                    </span>
                    <span>+50 XP Merged</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 6. Subview 4: Upcoming Backlog */}
        {taskFilter === 'backlog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {queuedTasks.length === 0 ? (
              <div style={{
                background: '#121215',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '3rem 1.5rem',
                textAlign: 'center'
              }}>
                <FileText size={28} className="text-zinc-600" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f4f4f5', margin: '0 0 0.3rem 0' }}>
                  Backlog Queue Clear
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#71717a', maxWidth: '360px', margin: '0 auto' }}>
                  No upcoming sprint deliverables are queued in Supabase.
                </p>
              </div>
            ) : (
              queuedTasks.map((prob, idx) => (
                <div
                  key={prob.s_no}
                  style={{
                    background: '#121215',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f4f4f5', marginBottom: '0.25rem' }}>
                      {cleanTaskTitle(prob.role, prob.repo, prob.issue_no)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.74rem', color: '#71717a' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <GitBranch size={12} className="text-zinc-500" />
                        <span>{prob.repo}</span>
                      </span>
                      <span>•</span>
                      <span>#{prob.issue_no}</span>
                      <span>•</span>
                      <span>{prob.level}</span>
                    </div>
                  </div>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.72rem',
                    color: '#71717a',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px'
                  }}>
                    <Lock size={12} className="text-zinc-500" />
                    <span>Unlocks after Task #{idx === 0 ? (activeTask ? activeTask.issue_no : 'current') : queuedTasks[idx - 1].issue_no}</span>
                  </span>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </section>
  );
};
