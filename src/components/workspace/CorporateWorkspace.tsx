import React, { useState, useEffect } from 'react';
import type { EmployeeState, ProblemIssue, PullRequest } from '../../types';
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
  | 'company';

export const CorporateWorkspace: React.FC<CorporateWorkspaceProps> = ({
  employee,
  onOpenStudio,
  onSignOut
}) => {
  const { showToast } = useToast();
  const [activeArea, setActiveArea] = useState<TabType>('home');
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
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

  // Compute problems chain
  const problems = employee.selectedRole?.problems || [];
  const mergedPrs = pullRequests.filter(p => p.status === 'approved_merged');
  const completedIssuesSet = new Set(mergedPrs.map(p => p.issue_no));
  
  const completedTasks = problems.filter(p => completedIssuesSet.has(p.issue_no));
  const remainingTasks = problems.filter(p => !completedIssuesSet.has(p.issue_no));
  const activeTask = remainingTasks.length > 0 ? remainingTasks[0] : null;
  const queuedTasks = remainingTasks.slice(1);

  const baseInductionXp = 200;
  const earnedXp = completedTasks.length * 50;
  const totalXp = baseInductionXp + earnedXp;

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

  const areaTitles: Record<TabType, string> = {
    home: 'My Desk',
    journey: 'Career Journey',
    tasks: 'My Tasks',
    projects: 'Projects',
    messages: 'Messages',
    calendar: 'Calendar',
    team: 'My Team',
    manager: 'My Manager',
    meetings: 'Meetings',
    company: 'Company'
  };

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
              <span className="brand-title">VirtualHQ</span>
              <span className="brand-dept mono" id="sideDeptTitle">
                {employee.selectedRole?.title.toUpperCase() || 'ENGINEERING DIVISION'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Areas Menu */}
        <nav className="sidebar-nav">
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
              <span className="nav-label">Real Manager Review</span>
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
              <span className="nav-label">Company</span>
            </button>
          </div>
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
                employee.preferredName?.slice(0, 2).toUpperCase() || 'AM'
              )}
            </div>
            <div className="user-id-info">
              <span className="user-full-name" id="sideUserName">{employee.fullName}</span>
              <span className="user-role-label" id="sideUserRole">{employee.selectedRole?.title}</span>
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
            <span>Exit Workspace</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Stage Area */}
      <div className="workspace-main-stage">
        
        {/* Executive Top Utility Bar */}
        <header className="stage-topbar">
          <div className="stage-topbar-left">
            <div className="breadcrumb-trail">
              <span className="crumb-org">VirtualHQ</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-dept" id="topbarDeptCrumb">{employee.selectedRole?.title}</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current" id="topbarCurrentCrumb">
                {areaTitles[activeArea]}
              </span>
            </div>
          </div>

          <div className="stage-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {employee.authProvider === 'github' && (
              <span className="mono" style={{ fontSize: '0.65rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                GitHub Synced
              </span>
            )}
            {employee.userType === 'manager' && (
              <span className="mono" style={{ fontSize: '0.65rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                👔 Lead Reviewer Mode
              </span>
            )}
            <div className="corporate-clock mono">
              <span className="c-time" id="stageLiveClock">{liveTime}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Stage Content Viewport */}
        <main className="stage-content-viewport">
          {activeArea === 'home' && (
            <AreaHome
              employee={employee}
              activeTask={activeTask}
              completedCount={completedTasks.length}
              totalXp={totalXp}
              queuedTasks={queuedTasks}
              onOpenStudio={onOpenStudio}
              onNavigate={(area) => setActiveArea(area as TabType)}
            />
          )}

          {activeArea === 'journey' && (
            <AreaJourney
              employee={employee}
              totalXp={totalXp}
              completedCount={completedTasks.length}
              activeTask={activeTask}
              completedTasks={completedTasks}
            />
          )}

          {activeArea === 'tasks' && (
            <AreaTasks
              activeTask={activeTask}
              completedTasks={completedTasks}
              queuedTasks={queuedTasks}
              onOpenStudio={onOpenStudio}
            />
          )}

          {activeArea === 'projects' && (
            <AreaProjects
              activeTask={activeTask}
              queuedTasks={queuedTasks}
              onOpenStudio={onOpenStudio}
            />
          )}

          {activeArea === 'messages' && (
            <AreaMessages employee={employee} />
          )}

          {activeArea === 'calendar' && (
            <AreaCalendar
              employee={employee}
              onNavigate={(area) => setActiveArea(area as TabType)}
            />
          )}

          {activeArea === 'team' && (
            <AreaTeam
              employee={employee}
              onNavigate={(area) => setActiveArea(area as TabType)}
            />
          )}

          {activeArea === 'manager' && (
            <AreaManager
              employee={employee}
              pullRequests={pullRequests}
              onApprovePr={handleApprovePr}
              onRequestChangesPr={handleRequestChangesPr}
            />
          )}

          {activeArea === 'meetings' && (
            <AreaMeetings employee={employee} />
          )}

          {activeArea === 'company' && (
            <AreaCompany employee={employee} />
          )}
        </main>
      </div>
    </div>
  );
};
