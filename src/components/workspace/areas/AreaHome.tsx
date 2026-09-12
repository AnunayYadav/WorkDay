import React, { useState } from 'react';
import { 
  Calendar, 
  Code, 
  Package, 
  ArrowRight, 
  GitBranch, 
  FileText
} from 'lucide-react';
import { taskItemToProblemIssue, type EmployeeState, type ProblemIssue, type TaskItem } from '../../../types';

interface AreaHomeProps {
  employee: EmployeeState;
  activeTask: ProblemIssue | null;
  completedCount: number;
  totalXp: number;
  queuedTasks: ProblemIssue[];
  onOpenStudio: (task: ProblemIssue) => void;
  onNavigate: (area: string) => void;
  managerTasks?: TaskItem[];
}

export const AreaHome: React.FC<AreaHomeProps> = ({
  employee,
  activeTask,
  completedCount,
  totalXp,
  onOpenStudio,
  onNavigate,
  managerTasks: allManagerTasks = []
}) => {
  const [scratchpad, setScratchpad] = useState<string>(
    localStorage.getItem('vhq_scratchpad') || 'Sprint notes: Reviewing assigned deliverables and repository specifications.'
  );

  // Filter to only active (non-completed) manager tasks for display
  const managerTasks = allManagerTasks.filter(t => t.status !== 'completed');

  const handleScratchpadChange = (val: string) => {
    setScratchpad(val);
    localStorage.setItem('vhq_scratchpad', val);
  };

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

  const totalAssignedCount = (activeTask ? 1 : 0) + managerTasks.length;

  return (
    <section className="workspace-area active" id="areaHome" style={{ maxWidth: '1180px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* 1. Greeting & Sprint Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '-0.025em',
          margin: '0 0 0.4rem 0'
        }}>
          Good morning, {employee.preferredName || employee.fullName?.split(' ')[0] || 'Engineer'}.
        </h1>
        <p style={{
          fontSize: '0.86rem',
          color: '#a1a1aa',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>Sprint 01 Focus</span>
          <span style={{ color: '#52525b' }}>•</span>
          <span>{totalAssignedCount} Active Deliverable{totalAssignedCount !== 1 ? 's' : ''} Assigned</span>
          <span style={{ color: '#52525b' }}>•</span>
          <span>{completedCount} Completed</span>
        </p>
      </div>

      {/* 2. Active Deliverables Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', color: '#71717a', textTransform: 'uppercase' }}>
              Active Deliverables
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#a1a1aa',
              padding: '1px 6px',
              borderRadius: '10px'
            }}>
              {totalAssignedCount}
            </span>
          </div>
        </div>

        {/* Manager-Assigned Active Deliverables */}
        {managerTasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {managerTasks.map(task => (
              <div
                key={task.id}
                style={{
                  background: '#121215',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  transition: 'border-color 0.15s ease'
                }}
                className="executive-task-card"
              >
                {/* Topline: Task Key, Repository, In Sprint indicator, Assignee */}
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.7rem',
                      color: '#a1a1aa'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      <span>In Sprint</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.72rem', color: '#71717a' }}>
                    <span style={{ textTransform: 'capitalize' }}>{task.priority} Priority</span>
                    <span>•</span>
                    <span>Assigned by {task.assignedByName || 'Manager'}</span>
                  </div>
                </div>

                {/* Main Deliverable Title & Description */}
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

                {/* Bottom Row: Due date & Actions */}
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
                    {task.dueDate && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} className="text-zinc-500" />
                        <span>Due {formatDueDate(task.dueDate)}</span>
                      </span>
                    )}
                    <span>Assigned {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
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
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Package size={13} />
                      <span>Upload Archive</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTask ? (
          /* Single Active Task Fallback */
          <div
            style={{
              background: '#121215',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem'
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
                  #{activeTask.issue_no}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#94a3b8' }}>
                  <GitBranch size={12} className="text-zinc-500" />
                  <span>{activeTask.repo}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#a1a1aa' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span>In Sprint</span>
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Assigned to You</span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f5', margin: '0 0 0.35rem 0' }}>
                {cleanTaskTitle(activeTask.role, activeTask.repo, activeTask.issue_no)}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                Investigate and resolve deliverable #{activeTask.issue_no} in {activeTask.repo}.
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <span style={{ fontSize: '0.74rem', color: '#71717a' }}>Sprint 01 Focus</span>
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
                  cursor: 'pointer'
                }}
              >
                <Code size={13} />
                <span>Open in Monaco Editor</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div style={{
            background: '#121215',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center'
          }}>
            <FileText size={28} className="text-zinc-600" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f4f4f5', margin: '0 0 0.3rem 0' }}>
              No Active Sprint Deliverables
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#71717a', maxWidth: '340px', margin: '0 auto' }}>
              Your sprint desk is clear. Deliverables assigned by leadership will appear here automatically.
            </p>
          </div>
        )}
      </div>

      {/* 3. Executive Telemetry Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#71717a', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Assigned Deliverables
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f4f4f5' }}>
            {totalAssignedCount} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#a1a1aa' }}>Active</span>
          </div>
        </div>

        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#71717a', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Completed &amp; Merged
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f4f4f5' }}>
            {completedCount} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#a1a1aa' }}>Solved</span>
          </div>
        </div>

        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#71717a', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Earned Sprint XP
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f4f4f5' }}>
            {totalXp} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#a1a1aa' }}>XP</span>
          </div>
        </div>

        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#71717a', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Pipeline Integrity
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f4f4f5' }}>
            100% <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#a1a1aa' }}>CI Passing</span>
          </div>
        </div>
      </div>

      {/* 4. Desk Notes & Standup Sync */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div style={{
          background: '#121215',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#71717a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Personal Desk Notes
            </span>
            <span style={{ fontSize: '0.66rem', color: '#52525b', fontFamily: 'monospace' }}>SAVED</span>
          </div>
          <textarea
            value={scratchpad}
            onChange={(e) => handleScratchpadChange(e.target.value)}
            placeholder="Sprint notes, endpoints, or personal checklist..."
            style={{
              flex: 1,
              minHeight: '90px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#d4d4d8',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{
          background: '#121215',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#71717a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Manager Sync &amp; Meetings
            </span>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: '0.6rem 0 1rem 0' }}>
              Review standup coordinates, team calendar, or schedule a 1-on-1 with leadership.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('meetings')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: '#f4f4f5',
              fontSize: '0.74rem',
              fontWeight: 500,
              padding: '0.45rem 1rem',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <span>View Meetings &amp; Schedule</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

    </section>
  );
};
