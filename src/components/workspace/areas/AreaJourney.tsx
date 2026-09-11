import React from 'react';
import type { EmployeeState, ProblemIssue } from '../../../types';

interface AreaJourneyProps {
  employee: EmployeeState;
  totalXp: number;
  completedCount: number;
  activeTask: ProblemIssue | null;
  completedTasks: ProblemIssue[];
}

export const AreaJourney: React.FC<AreaJourneyProps> = ({
  employee,
  totalXp,
  completedCount,
  activeTask,
  completedTasks
}) => {
  const maxLevel1Xp = 1000;
  const progressPct = Math.min(100, Math.round((totalXp / maxLevel1Xp) * 100));
  const currentLevel = totalXp >= 1000 ? 2 : 1;

  const milestones = [
    { num: '01', title: 'Induction', meta: '+100 XP', isDone: true, isCurrent: false },
    { num: '02', title: 'Dev Setup', meta: '+100 XP', isDone: true, isCurrent: false },
    { num: '03', title: 'First PR Solved', meta: '+50 XP', isDone: completedCount >= 1, isCurrent: completedCount === 0 },
    { num: '04', title: 'Sprint Backlog #2', meta: '+50 XP', isDone: completedCount >= 2, isCurrent: completedCount === 1 },
    { num: '05', title: 'Code Review Sync', meta: '+50 XP', isDone: completedCount >= 3, isCurrent: completedCount === 2 },
    { num: '06', title: 'Promotion Gate', meta: '1,000 XP', isDone: totalXp >= 1000, isCurrent: completedCount >= 3 && totalXp < 1000 }
  ];

  let activeStepKicker = 'CURRENT: RESOLVE ACTIVE SPRINT ISSUE #1';
  if (completedCount === 1) {
    activeStepKicker = 'CURRENT: MERGE SPRINT BACKLOG DELIVERABLE #2';
  } else if (completedCount >= 2 && totalXp < 1000) {
    activeStepKicker = `CURRENT: PROGRESSING TOWARDS LEVEL 2 (${1000 - totalXp} XP TO PROMOTION)`;
  } else if (totalXp >= 1000) {
    activeStepKicker = 'PROMOTION GATE ELIGIBLE: MID-LEVEL REVIEW READY';
  }

  return (
    <section className="workspace-area active" id="areaJourney">
      <div className="area-header">
        <h1 className="area-title">Career Progression &amp; Milestones</h1>
        <p className="area-subtitle">
          Track your engineering trajectory, verified sprint PR merges, earned credits, and promotion requirements.
        </p>
      </div>

      <div className="apple-journey-container">
        {/* 1. TOP PROGRESSION HERO CARD */}
        <div className="journey-hero-card">
          <div className="j-hero-left">
            <div className="j-level-badge mono" id="journeyLevelBadge">Level {currentLevel}</div>
            <div className="j-title-block">
              <h2 className="j-role-title" id="journeyRoleName">{employee.selectedRole?.title || 'Frontend Developer (Junior)'}</h2>
              <span className="j-role-meta mono" id="journeyStageName">
                Sprint Track · {completedCount > 0 ? `${completedCount} Solved Deliverables` : 'Active Contributor'}
              </span>
            </div>
          </div>

          <div className="j-progress-block">
            <div className="j-bar-header mono">
              <span>EXPERIENCE CREDITS</span>
              <span id="journeyXpRatio">{totalXp} / 1,000 XP ({progressPct}%)</span>
            </div>
            <div className="j-xp-track">
              <div className="j-xp-fill" id="journeyXpFill" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>

          <div className="j-hero-stats">
            <div className="j-stat-box mono">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span id="journeyTotalXpText">{totalXp} XP</span>
            </div>
            <div className="j-stat-box mono">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span id="journeySolvedCountText">{completedCount} Solved</span>
            </div>
          </div>
        </div>

        {/* 2. HORIZONTAL MILESTONE STEPPER */}
        <div className="journey-milestones-card">
          <div className="j-card-header">
            <span className="card-kicker">ENGINEERING CAREER TRACK MILESTONES</span>
            <span className="j-active-step-indicator mono" id="journeyActiveStepKicker">{activeStepKicker}</span>
          </div>

          <div className="journey-stepper" id="journeyStepperTrack">
            {milestones.map((m) => {
              const stateClass = m.isDone ? 'completed' : (m.isCurrent ? 'current' : 'locked');
              return (
                <div key={m.num} className={`stepper-step ${stateClass}`}>
                  <div className="step-indicator-circle">
                    {m.isDone ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : m.isCurrent ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    )}
                  </div>
                  <span className="step-num">NODE {m.num}</span>
                  <div className="step-title">{m.title}</div>
                  <div className="step-meta">{m.meta}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. CORPORATE LEVELS GRID */}
        <div className="career-levels-grid">
          <div className={`level-tier-card ${currentLevel === 1 ? 'active' : 'locked'}`} id="tierCard1">
            <div className="tier-top">
              <span className="tier-tag mono">LEVEL 1</span>
              <span className={`tier-status-pill mono ${currentLevel === 1 ? 'active' : 'locked'}`} id="tierStatus1">
                {currentLevel === 1 ? 'ACTIVE' : 'COMPLETED'}
              </span>
            </div>
            <h3 className="tier-name">Junior Engineer</h3>
            <p className="tier-desc">Core problem solving, unit test authoring, and guided sprint pull requests.</p>
            <div className="tier-req mono">0 — 1,000 XP Credits</div>
          </div>

          <div className={`level-tier-card ${currentLevel === 2 ? 'active' : 'locked'}`} id="tierCard2">
            <div className="tier-top">
              <span className="tier-tag mono">LEVEL 2</span>
              <span className={`tier-status-pill mono ${currentLevel === 2 ? 'active' : 'locked'}`} id="tierStatus2">
                {currentLevel === 2 ? 'ACTIVE' : 'LOCKED'}
              </span>
            </div>
            <h3 className="tier-name">Mid-Level Engineer</h3>
            <p className="tier-desc">Autonomous sprint ownership, cross-repo bug fixes, and code review assignments.</p>
            <div className="tier-req mono">1,000 — 2,500 XP Credits</div>
          </div>

          <div className="level-tier-card locked" id="tierCard3">
            <div className="tier-top">
              <span className="tier-tag mono">LEVEL 3</span>
              <span className="tier-status-pill locked mono" id="tierStatus3">LOCKED</span>
            </div>
            <h3 className="tier-name">Senior Engineer</h3>
            <p className="tier-desc">Architecture leadership, performance optimization, and mentor review approvals.</p>
            <div className="tier-req mono">2,500 — 5,000 XP Credits</div>
          </div>

          <div className="level-tier-card locked" id="tierCard4">
            <div className="tier-top">
              <span className="tier-tag mono">LEVEL 4</span>
              <span className="tier-status-pill locked mono" id="tierStatus4">LOCKED</span>
            </div>
            <h3 className="tier-name">Staff / Principal</h3>
            <p className="tier-desc">Organization-wide system design, security audits, and cross-squad alignment.</p>
            <div className="tier-req mono">5,000+ XP Credits</div>
          </div>
        </div>

        {/* 4. ACTIVE SPRINT DELIVERABLES & OBJECTIVES */}
        <div className="sprint-objectives-card">
          <div className="j-card-header">
            <span className="card-kicker">SPRINT OBJECTIVES &amp; DELIVERABLES</span>
            <span className="mono" style={{ fontSize: '0.72rem', color: '#71717a' }} id="journeyObjectivesCount">
              Synced with Sprint Progression
            </span>
          </div>
          <div className="objectives-list" id="journeyObjectivesList">
            {activeTask && (
              <div className="objective-item">
                <div className="obj-left">
                  <div className="obj-icon active">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                    </svg>
                  </div>
                  <div className="obj-info">
                    <span className="obj-title">Active Sprint Deliverable: Issue #{activeTask.issue_no}</span>
                    <span className="obj-sub mono">Repo: {activeTask.repo} · +50 XP Reward</span>
                  </div>
                </div>
                <span className="obj-badge active mono">ACTIVE SPRINT</span>
              </div>
            )}

            {completedTasks.map((cTask) => (
              <div key={cTask.s_no} className="objective-item">
                <div className="obj-left">
                  <div className="obj-icon done">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="obj-info">
                    <span className="obj-title">Solved &amp; Merged: Issue #{cTask.issue_no}</span>
                    <span className="obj-sub mono">Repo: {cTask.repo} · Passed All CI Benchmarks</span>
                  </div>
                </div>
                <span className="obj-badge done mono">MERGED (+50 XP)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
