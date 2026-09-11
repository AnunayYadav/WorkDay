import React, { useState, useEffect } from 'react';
import type { EmployeeState, ProblemIssue, PullRequest, EmployeeProgressRecord, UserRoleType } from '../../types';
import { CloudStorage } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

import { AreaHome } from './areas/AreaHome';
import { AreaJourney } from './areas/AreaJourney';
import { AreaTasks } from './areas/AreaTasks';
import { AreaProjects } from './areas/AreaProjects';
import { AreaMessages } from './areas/AreaMessages';
import { AreaCalendar } from './areas/AreaCalendar';
import { AreaTeam } from './areas/AreaTeam';
import { AreaManager } from './areas/AreaManager';
import { AreaMeetings } from './areas/AreaMeetings';
import { AreaCompany } from './areas/AreaCompany';
import { AreaManagerDashboard } from './areas/AreaManagerDashboard';
import { AreaHRDashboard } from './areas/AreaHRDashboard';

interface CorporateWorkspaceProps {
  employee: EmployeeState;
  onOpenStudio: (issue: ProblemIssue) => void;
  onSignOut: () => void;
}

export type TabType = 
  | 'home'
  | 'journey'
  | 'tasks'
  | 'projects'
  | 'messages'
  | 'calendar'
  | 'team'
  | 'manager'
  | 'meetings'
  | 'company'
  | 'manager_dashboard'
  | 'hr_dashboard';

export const CorporateWorkspace: React.FC<CorporateWorkspaceProps> = ({
  employee,
  onOpenStudio,
  onSignOut
}) => {
  const { showToast } = useToast();
  const [currentRole, setCurrentRole] = useState<UserRoleType>(employee.userType || 'employee');
  const [activeArea, setActiveArea] = useState<TabType>(() => {
    if (employee.userType === 'manager') return 'manager_dashboard';
    if (employee.userType === 'hr') return 'hr_dashboard';
    return 'home';
  });
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [roleProblems, setRoleProblems] = useState<ProblemIssue[]>([]);
  const [employeeProgress, setEmployeeProgress] = useState<EmployeeProgressRecord[]>([]);
  const [liveTime, setLiveTime] = useState<string>('10:45 AM');

  // Load pull requests on startup and subscribe to cloud realtime changes
  useEffect(() => {
    CloudStorage.listPullRequests().then(prs => setPullRequests(prs));

    const sub = CloudStorage.subscribeToPullRequests(() => {
      CloudStorage.listPullRequests().then(prs => setPullRequests(prs));
    });

    return () => {
      sub.unsubscribe();
    };
  }, []);

  // Fetch role-wise assigned problems from Supabase
  useEffect(() => {
    let isMounted = true;
    CloudStorage.listRoleProblems(employee.selectedRole?.title, employee.department).then(data => {
      if (isMounted) {
        setRoleProblems(data || []);
      }
    });
    return () => { isMounted = false; };
  }, [employee.selectedRole?.title, employee.department]);

  // Fetch employee progress from Supabase and subscribe to realtime updates
  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      const list = await CloudStorage.getEmployeeProgress(employee.empId);
      if (isMounted) setEmployeeProgress(list);
    };

    fetchProgress();

    const sub = CloudStorage.subscribeToEmployeeProgress(employee.empId, () => {
      fetchProgress();
    });

    return () => {
      isMounted = false;
      sub.unsubscribe();
    };
  }, [employee.empId]);

  // Live corporate clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute problems chain and cloud synced progress
  const problems = roleProblems;
  const mergedPrs = pullRequests.filter(p => p.status === 'approved_merged');
  const completedIssuesSet = new Set([
    ...mergedPrs.map(p => p.issue_no),
    ...employeeProgress.filter(p => p.status === 'completed').map(p => p.issue_no)
  ]);
  
  const completedTasks = problems.filter(p => completedIssuesSet.has(p.issue_no));
  const remainingTasks = problems.filter(p => !completedIssuesSet.has(p.issue_no));
  const activeTask = remainingTasks.length > 0 ? remainingTasks[0] : null;
  const queuedTasks = remainingTasks.slice(1);

  const baseInductionXp = 200;
  const earnedXp = completedTasks.reduce((acc, t) => acc + (t.level === 'Hard' ? 100 : t.level === 'Medium' ? 75 : 50), 0);
  const totalXp = Math.max(employee.totalXp || 200, baseInductionXp + earnedXp);

  const handleOpenStudioAndTrack = (task: ProblemIssue) => {
    CloudStorage.recordTaskProgress(employee.empId, task.repo, task.issue_no, 'in_progress');
    onOpenStudio(task);
  };

  // Manager PR actions
  const handleApprovePr = async (pr: PullRequest, feedback: string) => {
    const finalFb = feedback.trim() || 'Code review passed all benchmarks. Approved & merged.';
    const updated: PullRequest = {
      ...pr,
      status: 'approved_merged',
      reviewFeedback: finalFb,
      reviewedBy: employee.selectedRole?.manager?.name || 'Marcus Vance',
      reviewedAt: new Date().toISOString()
    };
    await CloudStorage.savePullRequest(updated);
    await CloudStorage.recordTaskCompletion(employee.empId, pr.repo, pr.issue_no, pr.id, 50);
    const refreshed = await CloudStorage.listPullRequests();
    setPullRequests(refreshed);
    showToast({
      title: 'PR Approved & Merged',
      message: `${pr.id} merged into main! +50 XP granted.`,
      type: 'success'
    });
  };

  const handleRequestChangesPr = async (pr: PullRequest, feedback: string) => {
    if (!feedback.trim()) {
      showToast({ title: 'Feedback Required', message: 'Please add review comments before requesting changes.', type: 'warning' });
      return;
    }
    const updated: PullRequest = {
      ...pr,
      status: 'changes_requested',
      reviewFeedback: feedback.trim(),
      reviewedBy: employee.selectedRole?.manager?.name || 'Marcus Vance',
      reviewedAt: new Date().toISOString()
    };
    await CloudStorage.savePullRequest(updated);
    const refreshed = await CloudStorage.listPullRequests();
    setPullRequests(refreshed);
    showToast({ title: 'Changes Requested', message: `Returned ${pr.id} to author with feedback.`, type: 'info' });
  };

  const handleRoleSwitch = (newRole: UserRoleType) => {
    setCurrentRole(newRole);
    employee.userType = newRole;
    CloudStorage.saveEmployee({ ...employee, userType: newRole }).catch(() => {});
    if (newRole === 'manager') setActiveArea('manager_dashboard');
    else if (newRole === 'hr') setActiveArea('hr_dashboard');
    else setActiveArea('home');
    showToast({
      title: 'Privilege Level Updated',
      message: `Active clearance switched to ${newRole.toUpperCase()} mode.`,
      type: 'info'
    });
  };

  const areaTitles: Record<TabType, string> = {
    home: 'My Desk',
    journey: 'Career Journey',
    tasks: 'My Tasks',
    projects: 'Projects',
    messages: currentRole === 'manager' ? 'Squad Comms' : 'Messages',
    calendar: 'Calendar',
    team: currentRole === 'manager' ? 'Engineering Squad' : currentRole === 'hr' ? 'Workforce Directory' : 'My Team',
    manager: 'My Manager',
    meetings: currentRole === 'manager' ? 'Squad Meetings' : 'Meetings',
    company: `${employee.companyName || 'Enterprise'} Portal`,
    manager_dashboard: 'Engineering Leadership Console',
    hr_dashboard: 'HR Leadership & Compliance'
  };

  useEffect(() => {
    if (currentRole === 'manager') {
      const employeeOnlyAreas: TabType[] = ['home', 'journey', 'tasks', 'projects', 'manager', 'calendar', 'hr_dashboard'];
      if (employeeOnlyAreas.includes(activeArea)) {
        setActiveArea('manager_dashboard');
      }
    } else if (currentRole === 'hr') {
      const nonHrAreas: TabType[] = ['home', 'journey', 'tasks', 'projects', 'manager', 'calendar', 'manager_dashboard'];
      if (nonHrAreas.includes(activeArea)) {
        setActiveArea('hr_dashboard');
      }
    }
  }, [currentRole, activeArea]);

  const pendingPrCount = pullRequests.filter(p => p.status === 'pending_review').length;

  return (
    <div className="corporate-workspace active" id="corporateWorkspace">
      
      {/* Left Persistent Executive Sidebar */}
      <aside className="workspace-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-glyph">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ffffff" strokeWidth="2"/>
                <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2"/>
                <path d="M2 12L12 17L22 12" stroke="#ffffff" strokeWidth="2"/>
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">WorkDay</span>
              <span className="brand-dept mono" id="sideDeptTitle">
                {employee.companyName ? `${employee.companyName.toUpperCase()} · ` : ''}
                {currentRole === 'manager'
                  ? (employee.selectedRole?.title?.toLowerCase().includes('manager') || employee.selectedRole?.title?.toLowerCase().includes('director') || employee.selectedRole?.title?.toLowerCase().includes('lead')
                      ? employee.selectedRole.title.toUpperCase()
                      : 'ENGINEERING MANAGER')
                  : currentRole === 'hr'
                    ? 'HR & TALENT DIRECTOR'
                    : (employee.selectedRole?.title?.toUpperCase() || 'ENGINEERING DIVISION')}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Areas Menu - Role Aware */}
        <nav className="sidebar-nav">
          {/* MANAGER VIEW: Pure Management & Squad Controls */}
          {currentRole === 'manager' ? (
            <>
              <div className="nav-group">
                <div className="nav-group-label">MANAGEMENT</div>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'manager_dashboard' ? 'active' : ''}`}
                  data-target-area="manager_dashboard"
                  id="navItemManagerDashboard"
                  onClick={() => setActiveArea('manager_dashboard')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="9" />
                      <rect x="14" y="3" width="7" height="5" />
                      <rect x="14" y="12" width="7" height="9" />
                      <rect x="3" y="16" width="7" height="5" />
                    </svg>
                  </div>
                  <span className="nav-label">Manager Console</span>
                  {pendingPrCount > 0 ? (
                    <span className="event-badge live" style={{ marginLeft: 'auto' }}>
                      {pendingPrCount} PR
                    </span>
                  ) : (
                    <span className="mono" style={{ fontSize: '0.65rem', color: '#4ade80', marginLeft: 'auto' }}>
                      L4+
                    </span>
                  )}
                </button>
              </div>

              <div className="nav-group">
                <div className="nav-group-label">SQUAD &amp; COLLABORATION</div>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'team' ? 'active' : ''}`}
                  data-target-area="team"
                  id="navItemTeam"
                  onClick={() => setActiveArea('team')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span className="nav-label">Engineering Squad</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'messages' ? 'active' : ''}`}
                  data-target-area="messages"
                  id="navItemMessages"
                  onClick={() => setActiveArea('messages')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span className="nav-label">Squad Comms</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'meetings' ? 'active' : ''}`}
                  data-target-area="meetings"
                  id="navItemMeetings"
                  onClick={() => setActiveArea('meetings')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <span className="nav-label">Squad Meetings</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'company' ? 'active' : ''}`}
                  data-target-area="company"
                  id="navItemCompany"
                  onClick={() => setActiveArea('company')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                    </svg>
                  </div>
                  <span className="nav-label">{employee.companyName || 'Company'} Hub</span>
                </button>
              </div>
            </>
          ) : currentRole === 'hr' ? (
            /* HR VIEW: People Operations & Directory */
            <>
              <div className="nav-group">
                <div className="nav-group-label">PEOPLE &amp; COMPLIANCE</div>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'hr_dashboard' ? 'active' : ''}`}
                  data-target-area="hr_dashboard"
                  id="navItemHRDashboard"
                  onClick={() => setActiveArea('hr_dashboard')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <span className="nav-label">HR Console</span>
                  <span className="event-badge live" style={{ marginLeft: 'auto' }}>EXEC</span>
                </button>
              </div>

              <div className="nav-group">
                <div className="nav-group-label">ORGANIZATION</div>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'team' ? 'active' : ''}`}
                  data-target-area="team"
                  id="navItemTeam"
                  onClick={() => setActiveArea('team')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span className="nav-label">Workforce Directory</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'messages' ? 'active' : ''}`}
                  data-target-area="messages"
                  id="navItemMessages"
                  onClick={() => setActiveArea('messages')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span className="nav-label">Messages</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'meetings' ? 'active' : ''}`}
                  data-target-area="meetings"
                  id="navItemMeetings"
                  onClick={() => setActiveArea('meetings')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <span className="nav-label">Meetings</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'company' ? 'active' : ''}`}
                  data-target-area="company"
                  id="navItemCompany"
                  onClick={() => setActiveArea('company')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                    </svg>
                  </div>
                  <span className="nav-label">{employee.companyName || 'Company'}</span>
                </button>
              </div>
            </>
          ) : (
            /* EMPLOYEE VIEW: Individual Contributor Desktop & Solver */
            <>
              <div className="nav-group">
                <div className="nav-group-label">MAIN</div>
                
                <button
                  type="button"
                  className={`nav-item ${activeArea === 'home' ? 'active' : ''}`}
                  data-target-area="home"
                  id="navItemHome"
                  onClick={() => setActiveArea('home')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <span className="nav-label">Home</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'journey' ? 'active' : ''}`}
                  data-target-area="journey"
                  id="navItemJourney"
                  onClick={() => setActiveArea('journey')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                    </svg>
                  </div>
                  <span className="nav-label">Journey</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'tasks' ? 'active' : ''}`}
                  data-target-area="tasks"
                  id="navItemTasks"
                  onClick={() => setActiveArea('tasks')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 11 12 14 22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  </div>
                  <span className="nav-label">My Tasks</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'projects' ? 'active' : ''}`}
                  data-target-area="projects"
                  id="navItemProjects"
                  onClick={() => setActiveArea('projects')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span className="nav-label">Projects</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'messages' ? 'active' : ''}`}
                  data-target-area="messages"
                  id="navItemMessages"
                  onClick={() => setActiveArea('messages')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span className="nav-label">Messages</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'calendar' ? 'active' : ''}`}
                  data-target-area="calendar"
                  id="navItemCalendar"
                  onClick={() => setActiveArea('calendar')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <span className="nav-label">Calendar</span>
                </button>
              </div>

              <div className="nav-group">
                <div className="nav-group-label">WORKPLACE</div>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'team' ? 'active' : ''}`}
                  data-target-area="team"
                  id="navItemTeam"
                  onClick={() => setActiveArea('team')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span className="nav-label">My Team</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'manager' ? 'active' : ''}`}
                  data-target-area="manager"
                  id="navItemManager"
                  onClick={() => setActiveArea('manager')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span className="nav-label">Manager Review</span>
                  {pendingPrCount > 0 && (
                    <span className="event-badge live" style={{ marginLeft: 'auto' }}>
                      {pendingPrCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'meetings' ? 'active' : ''}`}
                  data-target-area="meetings"
                  id="navItemMeetings"
                  onClick={() => setActiveArea('meetings')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </div>
                  <span className="nav-label">Meetings</span>
                </button>

                <button
                  type="button"
                  className={`nav-item ${activeArea === 'company' ? 'active' : ''}`}
                  data-target-area="company"
                  id="navItemCompany"
                  onClick={() => setActiveArea('company')}
                >
                  <div className="nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                    </svg>
                  </div>
                  <span className="nav-label">{employee.companyName || 'Company'}</span>
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Sidebar Footer User Profile */}
        <div className="sidebar-footer">
          <div className="user-identity-box">
            <div className="user-initials-badge" id="sideUserInitials" style={{ overflow: 'hidden', padding: 0 }}>
              {employee.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={employee.fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                employee.preferredName?.slice(0, 2).toUpperCase() || 'WD'
              )}
            </div>
            <div className="user-id-info">
              <span className="user-full-name" id="sideUserName">{employee.fullName}</span>
              <span className="user-role-label" style={{ fontSize: '0.72rem', color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={employee.corporateEmail || `${employee.handle}@${employee.companyDomain || 'stripe.corp'}`}>
                {employee.corporateEmail || `${employee.handle}@${employee.companyDomain || 'stripe.corp'}`}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-sidebar-exit"
            id="btnExitWorkspace"
            onClick={onSignOut}
            title="Return to Public Hub"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Exit</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Stage Area */}
      <div className="workspace-main-stage">
        
        {/* Executive Top Utility Bar */}
        <header className="stage-topbar">
          <div className="stage-topbar-left">
            <div className="breadcrumb-trail">
              <span className="crumb-org">WorkDay</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-dept" id="topbarDeptCrumb">{employee.companyName || 'Enterprise'}</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current" id="topbarCurrentCrumb">
                {areaTitles[activeArea]}
              </span>
            </div>
          </div>

          <div className="stage-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Active Company Badge */}
            <span style={{
              fontSize: '0.72rem',
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 600
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" />
                <path d="M16 6h.01" />
                <path d="M12 6h.01" />
                <path d="M12 10h.01" />
                <path d="M12 14h.01" />
                <path d="M16 10h.01" />
                <path d="M16 14h.01" />
                <path d="M8 10h.01" />
                <path d="M8 14h.01" />
              </svg>
              {employee.companyName || 'Stripe'}
            </span>

            {/* Interactive 3-Tier Role Switcher */}
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '2px'
            }}>
              {[
                {
                  role: 'employee' as UserRoleType,
                  label: 'Employee',
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  )
                },
                {
                  role: 'manager' as UserRoleType,
                  label: 'Manager',
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  )
                },
                {
                  role: 'hr' as UserRoleType,
                  label: 'HR',
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  )
                }
              ].map(item => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleRoleSwitch(item.role)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: currentRole === item.role ? 600 : 400,
                    color: currentRole === item.role ? '#ffffff' : '#71717a',
                    background: currentRole === item.role ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {employee.corporateEmail && (
              <span style={{ fontSize: '0.72rem', color: '#e4e4e7', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 500 }} title={`Allotted Enterprise Identity: ${employee.corporateEmail}`}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></span>
                {employee.corporateEmail}
              </span>
            )}
            <div className="corporate-clock" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.8rem' }}>
              <span className="c-time" id="stageLiveClock">{liveTime}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Stage Content Viewport */}
        <main className="stage-content-viewport">
          {activeArea === 'home' && (
            <AreaHome
              employee={{ ...employee, userType: currentRole }}
              activeTask={activeTask}
              completedCount={completedTasks.length}
              totalXp={totalXp}
              queuedTasks={queuedTasks}
              onOpenStudio={handleOpenStudioAndTrack}
              onNavigate={(area) => setActiveArea(area as TabType)}
            />
          )}

          {activeArea === 'journey' && (
            <AreaJourney
              employee={{ ...employee, userType: currentRole }}
              totalXp={totalXp}
              completedCount={completedTasks.length}
              activeTask={activeTask}
              completedTasks={completedTasks}
            />
          )}

          {activeArea === 'tasks' && (
            <AreaTasks
              employee={{ ...employee, userType: currentRole }}
              activeTask={activeTask}
              completedTasks={completedTasks}
              queuedTasks={queuedTasks}
              onOpenStudio={handleOpenStudioAndTrack}
            />
          )}

          {activeArea === 'projects' && (
            <AreaProjects
              activeTask={activeTask}
              queuedTasks={queuedTasks}
              onOpenStudio={handleOpenStudioAndTrack}
            />
          )}

          {activeArea === 'messages' && (
            <AreaMessages employee={{ ...employee, userType: currentRole }} />
          )}

          {activeArea === 'calendar' && (
            <AreaCalendar
              employee={{ ...employee, userType: currentRole }}
              onNavigate={(area) => setActiveArea(area as TabType)}
            />
          )}

          {activeArea === 'team' && (
            <AreaTeam
              employee={{ ...employee, userType: currentRole }}
              onNavigate={(area) => setActiveArea(area as TabType)}
            />
          )}

          {activeArea === 'manager' && (
            <AreaManager
              employee={{ ...employee, userType: currentRole }}
              pullRequests={pullRequests}
              onApprovePr={handleApprovePr}
              onRequestChangesPr={handleRequestChangesPr}
            />
          )}

          {activeArea === 'meetings' && (
            <AreaMeetings employee={{ ...employee, userType: currentRole }} />
          )}

          {activeArea === 'company' && (
            <AreaCompany employee={{ ...employee, userType: currentRole }} />
          )}

          {activeArea === 'manager_dashboard' && (
            <AreaManagerDashboard
              employee={{ ...employee, userType: currentRole }}
              onNavigateTab={(tab) => setActiveArea(tab as TabType)}
            />
          )}

          {activeArea === 'hr_dashboard' && (
            <AreaHRDashboard employee={{ ...employee, userType: currentRole }} />
          )}
        </main>
      </div>
    </div>
  );
};
