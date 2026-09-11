import React, { useState, useEffect } from 'react';
import type { EmployeeState, PullRequest, TaskItem } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';

interface AreaManagerDashboardProps {
  employee: EmployeeState;
  onNavigateTab?: (tab: string) => void;
}

export const AreaManagerDashboard: React.FC<AreaManagerDashboardProps> = ({
  employee,
  onNavigateTab
}) => {
  const [squadMembers, setSquadMembers] = useState<EmployeeState[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // New task form state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssigneeEmpId, setTaskAssigneeEmpId] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskItem['priority']>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskRepo, setTaskRepo] = useState('enterprise-core');
  const [savingTask, setSavingTask] = useState(false);

  // New meeting form state
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('Sprint Architecture Alignment');
  const [meetingPlatform, setMeetingPlatform] = useState<'meet' | 'zoom'>('meet');
  const [meetingDate, setMeetingDate] = useState('Today at 3:00 PM EST');
  const [savingMeeting, setSavingMeeting] = useState(false);

  // PR Review inspection state
  const [inspectingPR, setInspectingPR] = useState<PullRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const loadDashboardData = async () => {
    try {
      const [profiles, allTasks, allPrs] = await Promise.all([
        CloudStorage.listProfiles(),
        CloudStorage.listAssignedTasks(),
        CloudStorage.listPullRequests()
      ]);

      setSquadMembers(profiles);
      setTasks(allTasks);
      setPullRequests(allPrs);

      // Default assignee to first squad member
      if (profiles.length > 0 && !taskAssigneeEmpId) {
        setTaskAssigneeEmpId(profiles[0].empId);
      }
    } catch (err) {
      console.error('[Manager Dashboard] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const unsubTasks = CloudStorage.subscribeToTasks(() => {
      CloudStorage.listAssignedTasks().then(setTasks);
    });

    const subPrs = CloudStorage.subscribeToPullRequests(() => {
      CloudStorage.listPullRequests().then(setPullRequests);
    });

    return () => {
      unsubTasks();
      subPrs.unsubscribe();
    };
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskAssigneeEmpId) return;

    setSavingTask(true);
    const assignee = squadMembers.find(m => m.empId === taskAssigneeEmpId);
    const assigneeName = assignee?.fullName || 'Teammate';

    const created = await CloudStorage.createAssignedTask({
      assignedToEmpId: taskAssigneeEmpId,
      assignedToName: assigneeName,
      assignedByEmpId: employee.empId,
      assignedByName: employee.fullName,
      title: taskTitle.trim(),
      description: taskDesc.trim() || 'Complete assigned acceptance criteria and link pull request.',
      priority: taskPriority,
      status: 'todo',
      dueDate: taskDueDate || 'Next Sprint',
      repo: taskRepo,
      issueNo: `#T-${Math.floor(100 + Math.random() * 900)}`
    });

    if (created) {
      setTasks(prev => [created, ...prev]);
      setTaskTitle('');
      setTaskDesc('');
      setShowNewTaskModal(false);
    }
    setSavingTask(false);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskItem['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await CloudStorage.updateTaskStatus(taskId, newStatus);
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMeeting(true);

    const link = meetingPlatform === 'meet'
      ? `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
      : `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const meetingId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `meet-${Date.now()}`;
    await CloudStorage.createMeeting({
      id: meetingId,
      empId: employee.empId,
      title: meetingTitle,
      platform: meetingPlatform === 'meet' ? 'google_meet' : 'zoom',
      link,
      hostName: employee.fullName,
      hostTitle: 'Engineering Manager',
      hostInitials: employee.preferredName?.slice(0, 2).toUpperCase() || 'EM',
      scheduleTime: meetingDate,
      duration: '30 mins',
      status: 'upcoming'
    });

    setSavingMeeting(false);
    setShowMeetingModal(false);
    alert(`Meeting scheduled! Live link broadcasted to squad: ${link}`);
  };

  const handleMergePR = async (pr: PullRequest) => {
    await CloudStorage.updatePullRequestStatus(pr.id, 'approved_merged', reviewComment || 'Approved by Engineering Manager');
    setPullRequests(prev => prev.map(p => p.id === pr.id ? { ...p, status: 'approved_merged' } : p));
    setInspectingPR(null);
    setReviewComment('');
  };

  const pendingPRs = pullRequests.filter(p => p.status === 'pending_review');

  if (loading && squadMembers.length === 0) {
    return (
      <section className="workspace-area active" id="areaManagerDashboard">
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#71717a' }}>
          <div className="pulse-indicator" style={{ margin: '0 auto 1rem' }}></div>
          Loading engineering squad &amp; management console...
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-area active" id="areaManagerDashboard">
      {/* Header */}
      <div className="area-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <span className="mono" style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.7rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                color: '#e4e4e7',
                letterSpacing: '0.05em'
              }}>
                MANAGEMENT CLEARANCE L4+
              </span>
              <span style={{ fontSize: '0.8rem', color: '#71717a' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{employee.companyName || 'Enterprise'} Engineering</span>
            </div>
            <h1 className="area-title">Engineering Director &amp; Squad Hub</h1>
            <p className="area-subtitle">
              Sprint delegation, code review queue, squad health oversight, and architecture planning.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowMeetingModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Schedule Squad Sync
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowNewTaskModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Delegate Sprint Task
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="analytics-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">REGISTERED SQUAD</span>
            <span className="badge-live">LIVE</span>
          </div>
          <div className="stat-num">{squadMembers.length}</div>
          <div className="stat-label">Active Engineers &amp; Recruits</div>
        </div>

        <div className="stat-card executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">PR CODE REVIEWS</span>
            <span className="mono" style={{ fontSize: '0.75rem', color: pendingPRs.length > 0 ? '#f59e0b' : '#71717a' }}>
              {pendingPRs.length} PENDING
            </span>
          </div>
          <div className="stat-num">{pendingPRs.length}</div>
          <div className="stat-label">Pull Requests Awaiting Sign-off</div>
        </div>

        <div className="stat-card executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">ACTIVE DELEGATIONS</span>
            <span className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>SPRINT</span>
          </div>
          <div className="stat-num">{tasks.filter(t => t.status !== 'completed').length}</div>
          <div className="stat-label">In-Flight Delegated Tasks</div>
        </div>

        <div className="stat-card executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">SQUAD COMPLETION</span>
            <span className="mono" style={{ fontSize: '0.75rem', color: '#4ade80' }}>
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 100}%
            </span>
          </div>
          <div className="stat-num">
            {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
          </div>
          <div className="stat-label">Delivered Sprint Deliverables</div>
        </div>
      </div>

      {/* Main Grid: Left Delegated Tasks, Right PR Review Queue & Squad Roster */}
      <div className="manager-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        {/* Left Column: Delegated Tasks Table */}
        <div className="executive-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <span className="card-kicker">SPRINT TICKETS &amp; ASSIGNMENTS</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                Assigned Team Deliverables
              </h3>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
              onClick={() => setShowNewTaskModal(true)}
            >
              + New Ticket
            </button>
          </div>

          {tasks.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px' }}>
              <p style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '0.8rem' }}>
                No sprint tasks have been delegated yet. Assign tickets to squad engineers to kick off sprint progress.
              </p>
              <button className="btn btn-secondary" onClick={() => setShowNewTaskModal(true)}>
                Delegate First Ticket
              </button>
            </div>
          ) : (
            <div className="tasks-table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#71717a' }}>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Ticket</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Assignee</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Priority</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#f4f4f5' }}>{t.title}</div>
                        <div className="mono" style={{ fontSize: '0.72rem', color: '#71717a' }}>
                          {t.issueNo || '#TASK'} • {t.repo || 'core'}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ color: '#d4d4d8' }}>{t.assignedToName}</span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className={`badge-priority ${t.priority}`}>
                          {t.priority.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value as any)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#e4e4e7',
                            padding: '0.25rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {t.status !== 'completed' ? (
                          <button
                            onClick={() => handleUpdateTaskStatus(t.id, 'completed')}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: '#4ade80',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Sign-off
                          </button>
                        ) : (
                          <span className="mono" style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                            Delivered
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: PR Review Queue & Squad Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* PR Review Queue */}
          <div className="executive-card">
            <div className="card-kicker-row">
              <span className="card-kicker">PR CODE REVIEWS</span>
              <span className="mono" style={{ fontSize: '0.72rem', color: '#71717a' }}>{pendingPRs.length} READY</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.8rem' }}>
              Pending Pull Requests
            </h3>

            {pendingPRs.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#71717a', fontSize: '0.8rem' }}>
                All squad pull requests have been merged and approved.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingPRs.map(pr => (
                  <div
                    key={pr.id}
                    style={{
                      padding: '0.8rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>{pr.title}</span>
                      <span className="mono" style={{ fontSize: '0.7rem', color: '#38bdf8' }}>#{pr.issue_no}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.6rem' }}>
                      Submitted by <strong style={{ color: '#e4e4e7' }}>{pr.author}</strong> on repo <span className="mono">{pr.repo}</span>
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => setInspectingPR(pr)}
                      >
                        Inspect Diff
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => handleMergePR(pr)}
                      >
                        Merge &amp; Award XP
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Squad Roster */}
          <div className="executive-card">
            <div className="card-kicker-row">
              <span className="card-kicker">ENGINEERING SQUAD</span>
              <span className="mono" style={{ fontSize: '0.72rem', color: '#71717a' }}>{squadMembers.length} MEMBERS</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.8rem' }}>
              Direct Reports &amp; Engineers
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
              {squadMembers.map(member => (
                <div
                  key={member.empId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="mono" style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      color: '#ffffff'
                    }}>
                      {member.preferredName ? member.preferredName.slice(0, 2).toUpperCase() : 'EN'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f4f4f5' }}>
                        {member.fullName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a' }}>
                        {member.selectedRole?.title || 'Software Engineer'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="mono" style={{ fontSize: '0.7rem', color: '#4ade80' }}>
                      {member.totalXp || 200} XP
                    </span>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab('messages')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#a1a1aa',
                          cursor: 'pointer',
                          padding: '0.2rem'
                        }}
                        title="Chat"
                      >
                        💬
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Delegate New Sprint Task */}
      {showNewTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowNewTaskModal(false)}>
          <div className="modal-content executive-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="card-kicker-row">
              <span className="card-kicker">DIRECT DELEGATION</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
              Assign Sprint Task
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '1.25rem' }}>
              Create a formal engineering deliverable synced to Supabase and assigned to a squad engineer.
            </p>

            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                  Assignee (Squad Engineer)
                </label>
                <select
                  value={taskAssigneeEmpId}
                  onChange={e => setTaskAssigneeEmpId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                  required
                >
                  {squadMembers.map(m => (
                    <option key={m.empId} value={m.empId}>
                      {m.fullName} ({m.selectedRole?.title || 'Engineer'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement resilient WebSocket reconnect handler"
                  style={{
                    width: '100%',
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#12141a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (P0)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                    Target Due Date
                  </label>
                  <input
                    type="text"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    placeholder="e.g. Friday 5:00 PM"
                    style={{
                      width: '100%',
                      background: '#12141a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                    Repository
                  </label>
                  <input
                    type="text"
                    value={taskRepo}
                    onChange={e => setTaskRepo(e.target.value)}
                    placeholder="enterprise-core"
                    style={{
                      width: '100%',
                      background: '#12141a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                  Technical Description &amp; Acceptance Criteria
                </label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="Outline the architectural expectations, unit tests required, and pull request target..."
                  style={{
                    width: '100%',
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingTask || !taskTitle.trim()}
                >
                  {savingTask ? 'Assigning...' : 'Confirm Assignment →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Meeting */}
      {showMeetingModal && (
        <div className="modal-backdrop" onClick={() => setShowMeetingModal(false)}>
          <div className="modal-content executive-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="card-kicker-row">
              <span className="card-kicker">MEETING LAUNCHER</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
              Broadcast Squad Meeting
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '1.25rem' }}>
              Generate an active video meeting room and sync it directly to the team's Calendar.
            </p>

            <form onSubmit={handleScheduleMeeting}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                    Platform
                  </label>
                  <select
                    value={meetingPlatform}
                    onChange={e => setMeetingPlatform(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#12141a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="meet">Google Meet</option>
                    <option value="zoom">Zoom Video</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                    Time / Window
                  </label>
                  <input
                    type="text"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#12141a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMeetingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingMeeting}
                >
                  {savingMeeting ? 'Generating...' : 'Launch Meeting →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: PR Diff Viewer */}
      {inspectingPR && (
        <div className="modal-backdrop" onClick={() => setInspectingPR(null)}>
          <div className="modal-content executive-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="card-kicker-row">
              <span className="card-kicker">CODE REVIEW • #{inspectingPR.issue_no}</span>
              <span className="mono" style={{ fontSize: '0.72rem', color: '#4ade80' }}>+50 XP MERGE</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.3rem' }}>
              {inspectingPR.title}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '1rem' }}>
              Author: <strong style={{ color: '#ffffff' }}>{inspectingPR.author}</strong> • Repo: <span className="mono">{inspectingPR.repo}</span>
            </p>

            {/* Git Diff Simulation / Preview */}
            <div style={{
              background: '#090a0f',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '0.85rem',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              maxHeight: '260px',
              overflowY: 'auto',
              marginBottom: '1rem',
              color: '#d4d4d8'
            }}>
              <div style={{ color: '#71717a', marginBottom: '0.4rem' }}>diff --git a/src/core.ts b/src/core.ts</div>
              <div style={{ color: '#71717a', marginBottom: '0.4rem' }}>index e69de29..4b825dc 100644</div>
              <div style={{ color: '#38bdf8' }}>@@ -14,6 +14,14 @@ export class EnterpriseHandler &#123;</div>
              <div style={{ color: '#4ade80', background: 'rgba(34, 197, 94, 0.08)', padding: '0.1rem 0.3rem' }}>
                +   // Verified implementation of {inspectingPR.title}
              </div>
              <div style={{ color: '#4ade80', background: 'rgba(34, 197, 94, 0.08)', padding: '0.1rem 0.3rem' }}>
                +   export const status = 'production_ready';
              </div>
              <div style={{ color: '#4ade80', background: 'rgba(34, 197, 94, 0.08)', padding: '0.1rem 0.3rem' }}>
                +   return resolveTelemetryMetrics(config);
              </div>
              <div style={{ color: '#71717a', marginTop: '0.4rem' }}>&nbsp;&nbsp;   return super.execute();</div>
              <div style={{ color: '#71717a' }}>&nbsp;&nbsp; &#125;</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '0.3rem' }}>
                Review Feedback &amp; Verification Note
              </label>
              <input
                type="text"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="e.g. Unit tests passing, clean architectural decoupling."
                style={{
                  width: '100%',
                  background: '#12141a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setInspectingPR(null)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleMergePR(inspectingPR)}
              >
                Approve &amp; Merge PR →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
