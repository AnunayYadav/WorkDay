import React, { useState, useEffect } from 'react';
import type { ProblemIssue } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';
import { useToast } from '../../../lib/toast';

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
  const { showToast } = useToast();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Register new repo drawer
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoSlug, setRepoSlug] = useState('');
  const [repoDesc, setRepoDesc] = useState('');
  const [repoTags, setRepoTags] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [savingRepo, setSavingRepo] = useState(false);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const repos = await CloudStorage.listRepositories();
      setRepositories(repos || []);
    } catch (e) {
      console.error('Error listing repositories:', e);
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleCreateRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim() || !repoSlug.trim()) {
      showToast({
        title: 'Required Fields',
        message: 'Please provide both a repository name and slug (e.g. org/repo).',
        type: 'warning'
      });
      return;
    }

    setSavingRepo(true);
    const newRepo = {
      id: repoSlug.trim(),
      repo: repoSlug.trim(),
      name: repoName.trim(),
      owner: repoSlug.split('/')[0] || 'VirtualHQ',
      url: repoUrl.trim() || `https://github.com/${repoSlug.trim()}`,
      desc: repoDesc.trim(),
      tags: repoTags.split(',').map(t => t.trim()).filter(Boolean),
      stars: '0',
      forks: '0',
      language: 'TypeScript',
      department: 'engineering',
      issues: []
    };

    await CloudStorage.createRepository(newRepo);
    setRepositories(prev => [newRepo, ...prev]);
    setIsRegisterOpen(false);
    setRepoName('');
    setRepoSlug('');
    setRepoDesc('');
    setRepoTags('');
    setRepoUrl('');
    setSavingRepo(false);

    showToast({
      title: 'Repository Registered',
      message: `${newRepo.name} has been synced to Supabase.`,
      type: 'success'
    });
  };

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
      <div className="area-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="area-title">Projects &amp; Repositories</h1>
          <p className="area-subtitle">
            {repositories.length > 0
              ? `${repositories.length} active production codebases and GitHub issue backlogs synced from Supabase.`
              : 'Production codebases, GitHub issue backlogs, and sprint repositories synced with Supabase.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsRegisterOpen(true)}
          style={{
            background: '#ffffff',
            color: '#090a0f',
            fontWeight: 600,
            fontSize: '0.82rem',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Register Repository
        </button>
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
            All Repositories ({repositories.length})
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

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#71717a' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <span style={{ fontSize: '0.85rem' }}>Loading repositories from Supabase...</span>
        </div>
      )}

      {/* Repositories Grid Container */}
      {!loading && (
        <div className="projects-grid" id="projectsGridContainer">
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '4rem 1.5rem', textAlign: 'center' }}>
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
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
                {searchQuery.trim() ? 'No Matching Repositories' : 'No Repositories Synced Yet'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#71717a', maxWidth: '380px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
                {searchQuery.trim()
                  ? 'No repositories match your active search terms. Try clearing the query or selecting All Repositories.'
                  : 'There are currently 0 repositories registered in Supabase. Register your company or open-source codebase to populate the directory.'}
              </p>
              {!searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  style={{
                    background: '#ffffff',
                    color: '#090a0f',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  + Register First Repository
                </button>
              )}
            </div>
          ) : (
            filtered.map(repo => {
              const rName = (repo.repo || repo.id || '').toLowerCase();
              const isCurrent = activeRepoName && (rName === activeRepoName);
              const isUpcoming = upcomingRepoSet.has(rName);

              let statusClass = 'locked';
              if (isCurrent) statusClass = 'current';
              else if (isUpcoming) statusClass = 'upcoming';

              return (
                <div key={repo.repo || repo.id} className={`repo-card ${statusClass}`}>
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
                        title={`Open ${repo.repo || repo.id} on GitHub`}
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
                        <span className="repo-slug mono">{repo.repo || repo.id}</span>
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
                    {(repo.issues || []).length === 0 ? (
                      <div style={{ padding: '0.75rem 0', fontSize: '0.75rem', color: '#71717a' }}>
                        No pending issues indexed for this repository.
                      </div>
                    ) : (
                      <div className="repo-issues-list">
                        {(repo.issues || []).slice(0, 4).map((iss: any) => {
                          const lvl = (iss.level || 'medium').toLowerCase();
                          return (
                            <div key={iss.s_no || iss.issue_no} className="repo-issue-item">
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
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Register Repository Modal */}
      {isRegisterOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="executive-card" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Register Repository
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#71717a', margin: '0.2rem 0 0 0' }}>
                  Add a codebase to Supabase public.repositories for sprint assignments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRepository}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                  Repository Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js Core Portal"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#090a0f',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                  GitHub Slug (owner/repo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. vercel/next.js"
                  value={repoSlug}
                  onChange={(e) => setRepoSlug(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#090a0f',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                  GitHub URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/vercel/next.js"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#090a0f',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="The React framework for the web..."
                  value={repoDesc}
                  onChange={(e) => setRepoDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#090a0f',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '0.35rem' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="React, TypeScript, SSR, Web"
                  value={repoTags}
                  onChange={(e) => setRepoTags(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#090a0f',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'transparent',
                    color: '#a1a1aa',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRepo}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ffffff',
                    color: '#090a0f',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {savingRepo ? 'Saving...' : 'Sync to Supabase →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
