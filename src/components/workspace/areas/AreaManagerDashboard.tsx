import React, { useState, useEffect, useMemo } from 'react';
import type { EmployeeState, PullRequest, TaskItem } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';
import { useToast } from '../../../lib/toast';
import { PROBLEMS_DATASET } from '../../../lib/dataset';

interface AreaManagerDashboardProps {
  employee: EmployeeState;
  onNavigateTab?: (tab: string) => void;
}

interface DispatchMessage {
  id: string;
  sender: string;
  text: string;
  empId?: string;
  threadId?: string;
  time: string;
  createdAt?: string;
}

export const AreaManagerDashboard: React.FC<AreaManagerDashboardProps> = ({
  employee,
  onNavigateTab
}) => {
  const { showToast } = useToast();
  const [squadMembers, setSquadMembers] = useState<EmployeeState[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [recentDispatches, setRecentDispatches] = useState<DispatchMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Task filtering & search
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'review' | 'completed'>('all');
  const [taskSearch, setTaskSearch] = useState('');

  // New task form state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<string>('custom');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssigneeEmpId, setTaskAssigneeEmpId] = useState('unassigned');
  const [taskCustomAssigneeName, setTaskCustomAssigneeName] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskItem['priority']>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskRepo, setTaskRepo] = useState('enterprise-core');
  const [savingTask, setSavingTask] = useState(false);

  // Extract all available technical problems from PROBLEMS_DATASET
  const availableProblems = useMemo(() => {
    const list: { id: string; issueNo: string; repo: string; title: string; level: 'Easy' | 'Medium' | 'Hard'; role: string; url: string; description: string }[] = [];
    const roles = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering || [];
    roles.forEach(r => {
      (r.problems || []).forEach(p => {
        list.push({
          id: `${p.repo}#${p.issue_no}`,
          issueNo: p.issue_no,
          repo: p.repo,
          title: `${r.title} — Deliverable #${p.issue_no}`,
          level: p.level as any,
          role: r.title,
          url: p.url,
          description: `Resolve technical deliverable #${p.issue_no} in ${p.repo}. Ensure tests pass and submit PR for managerial sign-off.`
        });
      });
    });
    return list;
  }, []);

  // New meeting form state
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('Sprint Architecture Alignment');
  const [meetingPlatform, setMeetingPlatform] = useState<'meet' | 'zoom'>('meet');
  const [meetingDate, setMeetingDate] = useState('');
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);

  // Dispatch composer state
  const [dispatchRecipient, setDispatchRecipient] = useState('#general');
  const [dispatchText, setDispatchText] = useState('');
  const [sendingDispatch, setSendingDispatch] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  // PR Review inspection state
  const [inspectingPR, setInspectingPR] = useState<PullRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const loadDashboardData = async () => {
    try {
      const [profiles, allTasks, allPrs, allMeetings, generalMsgs] = await Promise.all([
        CloudStorage.listProfiles(employee.companyName || 'Stripe', 'employee'),
        CloudStorage.listAssignedTasks(),
        CloudStorage.listPullRequests(),
        CloudStorage.listMeetings(employee.empId),
        CloudStorage.listMessages(employee.empId, '#general')
      ]);

      setSquadMembers(profiles);
      setTasks(allTasks);
      setPullRequests(allPrs);
      setMeetings(allMeetings || []);
      setRecentDispatches((generalMsgs || []).slice(-5));

      // Default assignee to first squad member or unassigned
      if (profiles.length > 0) {
        setTaskAssigneeEmpId(profiles[0].empId);
      } else {
        setTaskAssigneeEmpId('unassigned');
      }
    } catch (err) {
      console.error('[Manager Dashboard] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // 1. Tasks Realtime
    const unsubTasks = CloudStorage.subscribeToTasks(() => {
      CloudStorage.listAssignedTasks().then(setTasks);
    });

    // 2. PRs Realtime
    const subPrs = CloudStorage.subscribeToPullRequests(() => {
      CloudStorage.listPullRequests().then(setPullRequests);
    });

    // 3. Meetings Realtime
    const unsubMeetings = CloudStorage.subscribeToMeetings(() => {
      CloudStorage.listMeetings(employee.empId).then(setMeetings);
    });

    // 4. Squad Messages Realtime
    const unsubSquadMsgs = CloudStorage.subscribeToSquadMessages((newMsg) => {
      setRecentDispatches(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        const updated = [...prev, newMsg];
        return updated.slice(-6);
      });
    });

    return () => {
      unsubTasks();
      subPrs.unsubscribe();
      unsubMeetings();
      unsubSquadMsgs();
    };
  }, [employee.empId, employee.companyName]);

  // Handle selecting an available problem from backlog
  const handleSelectProblem = (probId: string) => {
    setSelectedProblemId(probId);
    if (probId === 'custom') {
      setTaskTitle('');
      setTaskRepo('enterprise-core');
      setTaskPriority('medium');
      setTaskDesc('');
      return;
    }
    const found = availableProblems.find(p => p.id === probId);
    if (found) {
      setTaskTitle(found.title);
      setTaskRepo(found.repo);
      setTaskPriority(found.level === 'Hard' ? 'critical' : found.level === 'Medium' ? 'high' : 'medium');
      setTaskDesc(found.description);
    }
  };

  // Proper deadline helper
  const setDeadlinePreset = (preset: string) => {
    const now = new Date();
    let target = new Date();
    if (preset === 'today_5pm') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0);
    } else if (preset === 'tomorrow') {
      target = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      target.setHours(12, 0, 0, 0);
    } else if (preset === 'friday') {
      const dayOfWeek = now.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
      target = new Date(now.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
      target.setHours(17, 0, 0, 0);
    } else if (preset === 'next_sprint') {
      target = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      target.setHours(17, 0, 0, 0);
    }
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const minutes = String(target.getMinutes()).padStart(2, '0');
    setTaskDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const formatDisplayDeadline = (isoOrStr: string) => {
    if (!isoOrStr) return 'End of Current Sprint';
    try {
      const d = new Date(isoOrStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (_) {}
    return isoOrStr;
  };

  // Handle task creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      showToast({ title: 'Task Title Required', message: 'Please specify or select a deliverable title.', type: 'error' });
      return;
    }

    setSavingTask(true);
    let targetEmpId = taskAssigneeEmpId;
    let targetAssigneeName = 'Squad Engineer';

    if (targetEmpId === 'custom_assignee') {
      targetAssigneeName = taskCustomAssigneeName.trim() || 'Assigned Engineer';
      targetEmpId = `WD-CUSTOM-${Date.now().toString().slice(-4)}`;
    } else if (targetEmpId === 'unassigned' || !targetEmpId) {
      targetAssigneeName = 'Sprint Backlog (Unassigned)';
      targetEmpId = 'unassigned';
    } else {
      const foundSquad = squadMembers.find(m => m.empId === targetEmpId);
      targetAssigneeName = foundSquad?.fullName || 'Squad Engineer';
    }

    const dueFormatted = formatDisplayDeadline(taskDueDate);

    const created = await CloudStorage.createAssignedTask({
      assignedToEmpId: targetEmpId,
      assignedToName: targetAssigneeName,
      assignedByEmpId: employee.empId,
      assignedByName: employee.fullName,
      title: taskTitle.trim(),
      description: taskDesc.trim() || 'Complete assigned acceptance criteria and link pull request.',
      priority: taskPriority,
      status: 'todo',
      dueDate: taskDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      repo: taskRepo,
      issueNo: `#T-${Math.floor(100 + Math.random() * 900)}`
    });

    if (created) {
      setTasks(prev => [created, ...prev]);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setSelectedProblemId('custom');
      setShowNewTaskModal(false);

      // Automated realtime notification to squad general channel
      const notifyMsg: DispatchMessage = {
        id: `msg-${Date.now()}`,
        sender: employee.fullName,
        text: `[Sprint Dispatch] Delegated deliverable: "${taskTitle.trim()}" to ${targetAssigneeName} (Target Deadline: ${dueFormatted}).`,
        empId: employee.empId,
        threadId: '#general',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
      };
      await CloudStorage.sendMessage(employee.empId, '#general', notifyMsg).catch(() => {});

      showToast({
        title: 'Deliverable Delegated',
        message: `Assigned "${taskTitle.trim()}" to ${targetAssigneeName}.`,
        type: 'success'
      });
    }
    setSavingTask(false);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskItem['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await CloudStorage.updateTaskStatus(taskId, newStatus);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to cancel and delete this delegated task?')) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await CloudStorage.deleteAssignedTask(taskId);
    showToast({ title: 'Task Removed', message: 'Delegated sprint task was removed.', type: 'info' });
  };

  // Handle meeting schedule
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMeeting(true);

    const companyClean = (employee.companyName || 'corp').toLowerCase().replace(/[^a-z0-9]/g, '');
    const roomSlug = `${meetingTitle.trim().replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36)}`;
    const link = `https://meet.jit.si/WorkDay-${companyClean}-${roomSlug}`;

    const meetingId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `meet-${Date.now()}`;
    const scheduleTimeStr = meetingDate.trim() || 'Today at 3:00 PM EST';

    const newMeeting = {
      id: meetingId,
      empId: employee.empId,
      title: meetingTitle,
      platform: meetingPlatform === 'meet' ? 'google_meet' : 'zoom',
      link,
      meetingId: meetingPlatform === 'meet' ? `meet-${Math.random().toString(36).substring(2, 6)}` : `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      passcode: '902100',
      hostName: employee.fullName,
      hostTitle: 'Engineering Manager',
      hostInitials: employee.preferredName?.slice(0, 2).toUpperCase() || 'EM',
      scheduleTime: scheduleTimeStr,
      duration: '30 mins',
      status: 'upcoming'
    };

    await CloudStorage.createMeeting(newMeeting);
    setMeetings(prev => [newMeeting, ...prev]);

    // Broadcast automated notification to squad general channel
    const notifyMsg = {
      id: `msg-${Date.now()}`,
      sender: employee.fullName,
      text: `[Automated Dispatch] Scheduled a new squad sync: "${meetingTitle}" at ${scheduleTimeStr}. Meeting link: ${link}`,
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      empId: employee.empId,
      threadId: '#general'
    };
    await CloudStorage.sendMessage(employee.empId, '#general', notifyMsg);

    setSavingMeeting(false);
    setShowMeetingModal(false);
    setMeetingDate('');
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
    await CloudStorage.deleteMeeting(employee.empId, meetingId);
  };

  const handleCopyLink = (meeting: any) => {
    navigator.clipboard.writeText(meeting.link || '');
    setCopiedMeetingId(meeting.id);
    setTimeout(() => setCopiedMeetingId(null), 2000);
  };

  // Handle PR merge
  const handleMergePR = async (pr: PullRequest) => {
    await CloudStorage.updatePullRequestStatus(pr.id, 'approved_merged', reviewComment || 'Approved by Engineering Manager');
    setPullRequests(prev => prev.map(p => p.id === pr.id ? { ...p, status: 'approved_merged' } : p));
    setInspectingPR(null);
    setReviewComment('');
  };

  // Handle sending squad dispatch
  const handleSendDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchText.trim()) return;

    setSendingDispatch(true);
    const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`;
    const newMsg: DispatchMessage = {
      id: msgId,
      sender: `${employee.fullName} (Manager)`,
      text: dispatchText.trim(),
      empId: employee.empId,
      threadId: dispatchRecipient,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    await CloudStorage.sendMessage(employee.empId, dispatchRecipient, newMsg);
    setRecentDispatches(prev => [...prev, newMsg].slice(-6));
    setDispatchText('');
    setDispatchStatus('Broadcast sent to squad in realtime.');
    setTimeout(() => setDispatchStatus(null), 3500);
    setSendingDispatch(false);
  };

  // Filter tasks
  const pendingPRs = pullRequests.filter(p => p.status === 'pending_review');
  const filteredTasks = tasks.filter(t => {
    if (taskFilter !== 'all' && t.status !== taskFilter) return false;
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchAssignee = (t.assignedToName || '').toLowerCase().includes(q);
      const matchIssue = (t.issueNo || '').toLowerCase().includes(q);
      return matchTitle || matchAssignee || matchIssue;
    }
    return true;
  });

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
              <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{employee.companyName || 'Enterprise'} Engineering Hub</span>
            </div>
            <h1 className="area-title">Engineering Director &amp; Squad Hub</h1>
            <p className="area-subtitle">
              Sprint delegation, code review queue, live squad communications, and meeting schedules.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowMeetingModal(true)}
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
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Assign Task to Employee
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
          <div className="stat-label">Active Direct Reports ({employee.companyName || 'Company'})</div>
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
          <div className="stat-label">In-Flight Delegated Deliverables</div>
        </div>

        <div className="stat-card executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">UPCOMING SYNCS</span>
            <span className="mono" style={{ fontSize: '0.75rem', color: '#a78bfa' }}>CALENDAR</span>
          </div>
          <div className="stat-num">{meetings.length}</div>
          <div className="stat-label">Scheduled Squad Video Meetings</div>
        </div>
      </div>

      {/* Main Grid: Left Delegated Tasks, Right PR Review Queue & Squad Roster */}
      <div className="manager-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Left Column: Delegated Tasks Table with Search & Filter Tabs */}
        <div className="executive-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span className="card-kicker">SPRINT TICKETS &amp; ASSIGNMENTS</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                Delegated Squad Deliverables
              </h3>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowNewTaskModal(true)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Assign Task to Employee
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.25rem', borderRadius: '6px' }}>
              {(['all', 'todo', 'in_progress', 'review', 'completed'] as const).map(tab => {
                const count = tab === 'all' ? tasks.length : tasks.filter(t => t.status === tab).length;
                const label = tab === 'all' ? 'All' : tab === 'todo' ? 'To Do' : tab === 'in_progress' ? 'In Progress' : tab === 'review' ? 'Review' : 'Delivered';
                return (
                  <button
                    key={tab}
                    onClick={() => setTaskFilter(tab)}
                    style={{
                      background: taskFilter === tab ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      color: taskFilter === tab ? '#ffffff' : '#a1a1aa',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.74rem',
                      fontWeight: taskFilter === tab ? 600 : 400,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <input
                type="text"
                value={taskSearch}
                onChange={e => setTaskSearch(e.target.value)}
                placeholder="Search tickets or assignees..."
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.75rem',
                  color: '#ffffff'
                }}
              />
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.01)' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                margin: '0 auto 0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </div>
              <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 600, margin: '0 0 0.4rem' }}>
                No Sprint Tasks Delegated Yet
              </h4>
              <p style={{ color: '#8e8e93', fontSize: '0.82rem', maxWidth: '440px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                {tasks.length === 0
                  ? 'Assign technical deliverables to squad engineers, pick from available curriculum issues, set target deadlines, and track completion.'
                  : 'No sprint tasks match the active filter or search criteria.'}
              </p>
              {tasks.length === 0 && (
                <button className="btn btn-primary" onClick={() => setShowNewTaskModal(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Assign First Task to Employee
                </button>
              )}
            </div>
          ) : (
            <div className="tasks-table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#71717a' }}>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Ticket</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Assignee</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Priority</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Deadline</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#f4f4f5' }}>{t.title}</div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: '#71717a' }}>
                          {t.issueNo || '#TASK'} • {t.repo || 'core'}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span style={{ color: '#d4d4d8', fontWeight: 500 }}>{t.assignedToName}</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span className={`badge-priority ${t.priority}`}>
                          {t.priority.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span className="mono" style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
                          {t.dueDate ? formatDisplayDeadline(t.dueDate) : 'Next Sprint'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value as any)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#e4e4e7',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem'
                          }}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="completed">Delivered</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          {t.status !== 'completed' ? (
                            <button
                              onClick={() => handleUpdateTaskStatus(t.id, 'completed')}
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                color: '#4ade80',
                                padding: '0.2rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                              title="Sign-off & Mark Delivered"
                            >
                              ✓ Sign-off
                            </button>
                          ) : (
                            <span className="mono" style={{ fontSize: '0.7rem', color: '#4ade80' }}>
                              Delivered
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              opacity: 0.6,
                              padding: '0.2rem',
                              cursor: 'pointer'
                            }}
                            title="Cancel / Delete Task"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
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

            {squadMembers.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#71717a', fontSize: '0.8rem' }}>
                No engineers have registered under {employee.companyName || 'this company'} yet. When real engineers sign up and select {employee.companyName || 'this company'}, they will appear here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto' }}>
                {squadMembers.map(member => (
                <div
                  key={member.empId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
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
                        onClick={() => {
                          setDispatchRecipient(member.empId);
                          const commsCard = document.getElementById('squadCommunicationsHub');
                          commsCard?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={`Direct Dispatch to ${member.fullName}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Scheduled Squad Meetings & Live Comms Dispatch Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Card: Scheduled Squad Meetings & Video Syncs */}
        <div className="executive-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <span className="card-kicker">CALENDAR &amp; VIDEO SYNCS</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                Scheduled Squad Meetings
              </h3>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
              onClick={() => setShowMeetingModal(true)}
            >
              + Schedule Sync
            </button>
          </div>

          {meetings.length === 0 ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px' }}>
              <p style={{ color: '#71717a', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
                No active video syncs scheduled for the squad. Schedule architecture reviews or daily standups to sync with engineers.
              </p>
              <button className="btn btn-secondary" onClick={() => setShowMeetingModal(true)}>
                Schedule First Sync
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {meetings.map((m: any) => {
                const isGoogle = m.platform === 'google_meet' || !m.platform?.includes('zoom');
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '0.85rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          background: isGoogle ? 'rgba(34, 197, 94, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                          color: isGoogle ? '#4ade80' : '#38bdf8',
                          border: isGoogle ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)'
                        }}>
                          {isGoogle ? 'GOOGLE MEET' : 'ZOOM VIDEO'}
                        </span>
                        <span style={{ fontWeight: 600, color: '#f4f4f5', fontSize: '0.88rem' }}>{m.title}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#71717a' }}>
                        Time: <span style={{ color: '#d4d4d8' }}>{m.schedule_time || m.scheduleTime || 'Upcoming'}</span> • Host: <span style={{ color: '#d4d4d8' }}>{m.host_name || m.hostName || employee.fullName}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', textDecoration: 'none' }}
                      >
                        Join Room ↗
                      </a>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleCopyLink(m)}
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem' }}
                        title="Copy Meeting URL"
                      >
                        {copiedMeetingId === m.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => handleDeleteMeeting(m.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          opacity: 0.6,
                          cursor: 'pointer',
                          padding: '0.2rem'
                        }}
                        title="Cancel Meeting"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card: Live Squad Communications & Dispatch Widget */}
        <div className="executive-card" id="squadCommunicationsHub">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <span className="card-kicker">REALTIME COMMUNICATIONS</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                Squad Dispatch Console
              </h3>
            </div>
            {onNavigateTab && (
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                onClick={() => onNavigateTab('messages')}
              >
                Open Comms Hub →
              </button>
            )}
          </div>

          {/* Mini Live Feed */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '6px',
            padding: '0.75rem',
            marginBottom: '1rem',
            maxHeight: '140px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {recentDispatches.length === 0 ? (
              <div style={{ color: '#71717a', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
                No active dispatches yet. Use the composer below to broadcast instructions.
              </div>
            ) : (
              recentDispatches.map((d) => (
                <div key={d.id} style={{ fontSize: '0.76rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a', marginBottom: '0.15rem' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{d.sender}</span>
                    <span className="mono" style={{ fontSize: '0.68rem' }}>{d.time || 'now'}</span>
                  </div>
                  <div style={{ color: '#e4e4e7', wordBreak: 'break-word' }}>{d.text}</div>
                </div>
              ))
            )}
          </div>

          {/* Quick Dispatch Composer */}
          <form onSubmit={handleSendDispatch}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select
                value={dispatchRecipient}
                onChange={e => setDispatchRecipient(e.target.value)}
                style={{
                  background: '#12141a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  maxWidth: '180px'
                }}
              >
                <option value="#general">#general (Broadcast)</option>
                <option value="#announcements">#announcements (P0)</option>
                <option value="#engineering">#engineering (Tech)</option>
                {squadMembers.map(m => (
                  <option key={m.empId} value={m.empId}>
                    {m.fullName}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={dispatchText}
                onChange={e => setDispatchText(e.target.value)}
                placeholder="Type real-time announcement or engineer prompt..."
                style={{
                  flex: 1,
                  background: '#12141a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem'
                }}
                required
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={sendingDispatch || !dispatchText.trim()}
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
              >
                {sendingDispatch ? 'Sending...' : 'Dispatch →'}
              </button>
            </div>

            {dispatchStatus && (
              <div className="mono" style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '0.25rem' }}>
                ✓ {dispatchStatus}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Modal: Delegate New Sprint Task */}
      {showNewTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowNewTaskModal(false)}>
          <div className="modal-content executive-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div className="card-kicker-row" style={{ margin: 0 }}>
                <span className="card-kicker">DIRECT SPRINT DELEGATION</span>
                <span className="mono" style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
                  {employee.companyName || 'Corporate'} Workspace
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  lineHeight: 1,
                  padding: 0
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
              Assign Sprint Deliverable
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#8e939e', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Delegate an engineering ticket to squad engineers, select from available curriculum problems, and configure delivery SLAs.
            </p>

            <form onSubmit={handleCreateTask}>
              {/* Step 1: Select Employee */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#d4d4d8', marginBottom: '0.35rem', fontWeight: 500 }}>
                  1. Select Assignee (Squad Member)
                </label>
                <select
                  value={taskAssigneeEmpId}
                  onChange={e => setTaskAssigneeEmpId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#ffffff',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-premium)',
                    outline: 'none'
                  }}
                >
                  {squadMembers.length > 0 && (
                    <optgroup label={`Active Direct Reports (${employee.companyName || 'Company'})`}>
                      {squadMembers.map(m => (
                        <option key={m.empId} value={m.empId}>
                          {m.fullName} ({m.selectedRole?.title || 'Engineer'}) · {m.corporateEmail || m.email || m.empId}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Sprint Backlog">
                    <option value="unassigned">Sprint Backlog (Unassigned / Any Engineer)</option>
                  </optgroup>
                  <option value="custom_assignee">+ Assign by Custom Name or Email...</option>
                </select>

                {taskAssigneeEmpId === 'custom_assignee' && (
                  <input
                    type="text"
                    value={taskCustomAssigneeName}
                    onChange={e => setTaskCustomAssigneeName(e.target.value)}
                    placeholder="e.g. Alex Morgan (alex@company.corp)"
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      background: '#12141a',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-premium)'
                    }}
                    required
                  />
                )}
              </div>

              {/* Step 2: Choose Available Task from Backlog */}
              <div style={{ marginBottom: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', color: '#d4d4d8', fontWeight: 500 }}>
                    2. Choose Task from Available Engineering Backlog
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                    {availableProblems.length} Curriculum Issues
                  </span>
                </div>
                <select
                  value={selectedProblemId}
                  onChange={e => handleSelectProblem(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#ffffff',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-premium)',
                    outline: 'none'
                  }}
                >
                  <option value="custom">-- Write Custom Sprint Ticket (Manual Input) --</option>
                  <optgroup label="Frontend Engineering Issues">
                    {availableProblems.filter(p => p.role.includes('Frontend')).map(p => (
                      <option key={p.id} value={p.id}>
                        [#{p.issueNo}] {p.role} · {p.level} ({p.repo.split('/')[1] || p.repo})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Backend & Fullstack Engineering Issues">
                    {availableProblems.filter(p => !p.role.includes('Frontend')).slice(0, 25).map(p => (
                      <option key={p.id} value={p.id}>
                        [#{p.issueNo}] {p.role} · {p.level} ({p.repo.split('/')[1] || p.repo})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Task Title */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#d4d4d8', marginBottom: '0.35rem', fontWeight: 500 }}>
                  Deliverable Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement resilient WebSocket reconnect handler"
                  style={{
                    width: '100%',
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#ffffff',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-premium)'
                  }}
                  required
                />
              </div>

              {/* Priority & Repository */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#d4d4d8', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Priority / SLA
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#12141a',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#ffffff',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-premium)'
                    }}
                  >
                    <option value="low">P3 - Low</option>
                    <option value="medium">P2 - Medium</option>
                    <option value="high">P1 - High (Sprint Priority)</option>
                    <option value="critical">P0 - Blocker (Critical)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#d4d4d8', marginBottom: '0.35rem', fontWeight: 500 }}>
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
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#ffffff',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-premium)'
                    }}
                  />
                </div>
              </div>

              {/* Step 3: Proper Deadline */}
              <div style={{ marginBottom: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', color: '#d4d4d8', fontWeight: 500 }}>
                    3. Target Deadline &amp; Due Date
                  </label>
                  {taskDueDate && (
                    <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 500 }}>
                      Target: {formatDisplayDeadline(taskDueDate)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDeadlinePreset('today_5pm')}
                  >
                    Today 5:00 PM
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDeadlinePreset('tomorrow')}
                  >
                    Tomorrow 12:00 PM
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDeadlinePreset('friday')}
                  >
                    Sprint Friday 5:00 PM
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDeadlinePreset('next_sprint')}
                  >
                    Next Sprint (2 Wks)
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#ffffff',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-premium)',
                    colorScheme: 'dark'
                  }}
                  required
                />
              </div>

              {/* Technical Description & Acceptance Criteria */}
              <div style={{ marginBottom: '1.35rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#d4d4d8', marginBottom: '0.35rem', fontWeight: 500 }}>
                  Technical Description &amp; Acceptance Criteria
                </label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="Outline architectural expectations, required test coverage, and pull request sign-off criteria..."
                  style={{
                    width: '100%',
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#ffffff',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-premium)',
                    lineHeight: 1.45
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
                  {savingTask ? 'Assigning...' : 'Confirm & Assign Deliverable →'}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div className="card-kicker-row" style={{ margin: 0 }}>
                <span className="card-kicker">MEETING LAUNCHER</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMeetingModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  lineHeight: 1,
                  padding: 0
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
              Broadcast Squad Meeting
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '1.25rem' }}>
              Generate an active video meeting room and sync it directly to the team's Calendar and squad feed.
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
                    placeholder="e.g. Today at 3:00 PM EST"
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
                  className="btn btn-accent"
                  disabled={savingMeeting}
                  style={{ fontWeight: 600 }}
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
