import React, { useState, useEffect } from 'react';
import type { ProblemIssue } from '../../../types';
import { ALL_REPOSITORIES } from '../../../lib/dataset';
import { CloudStorage } from '../../../lib/supabase';

interface AreaProjectsProps {
  activeTask: ProblemIssue | null;
  queuedTasks: ProblemIssue[];
  onOpenStudio: (task: ProblemIssue) => void;
}

export const AreaProjects: React.FC<AreaProjectsProps> = ({
  activeTask,
  queuedTasks,
  onOpenStudio
}) => {
  const [repositories, setRepositories] = useState<any[]>(ALL_REPOSITORIES);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    CloudStorage.listRepositories().then(repos => {
      if (repos && repos.length > 0) {
        setRepositories(repos);
      }
    });
  }, []);

  const activeRepoName = activeTask ? activeTask.repo.toLowerCase() : '';
  const upcomingRepoSet = new Set(queuedTasks.map(p => (p.repo || '').toLowerCase()));

  const filtered = repositories.filter(repo => {
    const rName = (repo.repo || repo.id || '').toLowerCase();
    const isCurrent = activeRepoName && (rName === activeRepoName);
    const isUpcoming = upcomingRepoSet.has(rName);
    const isLocked = !isCurrent && !isUpcoming;

    if (filterType === 'active' && !(isCurrent || isUpcoming)) return false;
    if (filterType === 'locked' && !isLocked) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (repo.name || '').toLowerCase().includes(q);
      const matchRepo = rName.includes(q);
      const matchDesc = (repo.desc || repo.description || '').toLowerCase().includes(q);
      const matchTags = Array.isArray(repo.tags) && repo.tags.some((t: string) => t.toLowerCase().includes(q));
      const matchIssues = Array.isArray(repo.issues) && repo.issues.some((iss: any) =>
        ('#' + iss.issue_no).includes(q) ||
        (iss.role || '').toLowerCase().includes(q) ||
        (iss.level || '').toLowerCase().includes(q)
      );
      return matchName || matchRepo || matchDesc || matchTags || matchIssues;
    }

    return true;
  });



  return (
    <section className="workspace-area active" id="areaProjects">
      <div className="area-header">
        <h1 className="area-title">Projects &amp; Repositories</h1>
        <p className="area-subtitle">16 active open-source production codebases, GitHub issue backlogs, and sprint repositories.</p>
      </div>

      {/* Projects Search & Filter Toolbar */}
      <div className="projects-toolbar">
        <div className="projects-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="projects-search-input"
            id="projectsSearchInput"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by repository name, tech stack, or issue #..."
          />
        </div>
        <div className="projects-filter-chips" id="projectsFilterGroup">
          <button
            type="button"
            className={`p-filter-chip ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Repositories ({ALL_REPOSITORIES.length})
          </button>
          <button
            type="button"
            className={`p-filter-chip ${filterType === 'active' ? 'active' : ''}`}
            onClick={() => setFilterType('active')}
          >
            Current Sprint &amp; Upcoming
          </button>
          <button
            type="button"
            className={`p-filter-chip ${filterType === 'locked' ? 'active' : ''}`}
            onClick={() => setFilterType('locked')}
          >
            Locked Repositories
          </button>
        </div>
      </div>

      {/* Repositories Grid Container */}
      <div className="projects-grid" id="projectsGridContainer">
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem 1rem', textAlign: 'center', color: '#71717a' }}>
            <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#a1a1aa' }}>No matching repositories found.</p>
            <p style={{ fontSize: '0.8rem' }}>Try clearing your search query or switching to "All Repositories".</p>
          </div>
        ) : (
          filtered.map(repo => {
            const rName = repo.repo.toLowerCase();
            const isCurrent = activeRepoName && (rName === activeRepoName);
            const isUpcoming = upcomingRepoSet.has(rName);

            let statusClass = 'locked';
            if (isCurrent) statusClass = 'current';
            else if (isUpcoming) statusClass = 'upcoming';

            return (
              <div key={repo.repo} className={`repo-card ${statusClass}`}>
                <div className="repo-header-status-row">
                  {isCurrent ? (
                    <span className="repo-status-pill current">
                      <span className="status-dot-green"></span>CURRENT SPRINT
                    </span>
                  ) : isUpcoming ? (
                    <span className="repo-status-pill upcoming">QUEUED IN BACKLOG</span>
                  ) : (
                    <span className="repo-status-pill locked">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      {' '}LOCKED · LEVEL 2 REQUIRED
                    </span>
                  )}
                  {repo.url && (
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-github-link"
                      title={`Open ${repo.repo} on GitHub`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      <span>GitHub ↗</span>
                    </a>
                  )}
                </div>

                <div className="repo-card-top">
                  <div className="repo-identity">
                    <div className="repo-title-block">
                      <h3 className="repo-name">{repo.name}</h3>
                      <span className="repo-slug mono">{repo.repo}</span>
                    </div>
                  </div>
                  <div className="repo-stats-pills">
                    <span className="stat-pill mono">★ {repo.stars}</span>
                    <span className="stat-pill mono">⑂ {repo.forks}</span>
                  </div>
                </div>

                <p className="repo-desc">{repo.desc}</p>

                <div className="repo-tags-row">
                  {(repo.tags || []).map((tag: string) => (
                    <span key={tag} className="role-tag">{tag}</span>
                  ))}
                </div>

                {isCurrent && activeTask && (
                  <div className="repo-current-sprint-action">
                    <div className="act-info">
                      <span><strong>Active Deliverable:</strong> Issue #{activeTask.issue_no}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-repo-work-issue"
                      onClick={() => onOpenStudio(activeTask)}
                    >
                      Work on Issue →
                    </button>
                  </div>
                )}

                <div className="repo-issues-section">
                  <div className="issues-section-header">
                    <span className="issues-sec-title">ISSUES IN THIS REPOSITORY</span>
                    <span className="issues-count mono">{(repo.issues || []).length} available</span>
                  </div>
                  <div className="repo-issues-list">
                    {(repo.issues || []).slice(0, 4).map((iss: any) => {
                      const lvl = (iss.level || 'medium').toLowerCase();
                      return (
                        <div key={iss.s_no} className="repo-issue-item">
                          <div className="issue-main-info">
                            <span className={`issue-level-pill ${lvl}`}>{iss.level || 'Medium'}</span>
                            <span className="issue-code mono">#{iss.issue_no}</span>
                            <span className="issue-role-tag">{iss.role}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn-repo-solve"
                              onClick={() => onOpenStudio(iss)}
                            >
                              <span>Solve in IDE →</span>
                            </button>
                            {iss.url && (
                              <a
                                href={iss.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-issue-view"
                                title="Open issue on GitHub"
                              >
                                <span>GitHub ↗</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
