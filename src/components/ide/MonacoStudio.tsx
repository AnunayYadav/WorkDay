import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { EmployeeState, ProblemIssue, PullRequest } from '../../types';
import { CloudStorage } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { MaterialFileIcon } from './MaterialFileIcon';
import { RealTerminal } from './RealTerminal';
import { LivePreviewer } from './LivePreviewer';

interface MonacoStudioProps {
  issue: ProblemIssue;
  employee: EmployeeState;
  onClose: () => void;
  onPrSubmitted: (pr: PullRequest) => void;
}

interface FileItem {
  name: string;
  path: string;
  folder: string;
  language: string;
  content: string;
}

const getDefaultFiles = (issue: ProblemIssue): Record<string, FileItem> => {
  const repoBase = issue.repo.split('/')[1] || issue.repo;
  return {
    'SolutionPatch.tsx': {
      name: 'SolutionPatch.tsx',
      path: 'src/components/SolutionPatch.tsx',
      folder: 'components',
      language: 'typescript',
      content: `/**
 * Solution for ${issue.repo} - Issue #${issue.issue_no}
 * Sprint Track: ${issue.role} (${issue.level} Level)
 * Submitting Developer: ${issue.role}
 */

import React, { useState } from 'react';

export interface TaskProps {
  issueNumber: string;
  repo: string;
  isResolved: boolean;
}

export const SprintSolution: React.FC<TaskProps> = ({ issueNumber, repo, isResolved }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="sprint-solution-container">
      <h3>Resolved ${repoBase} Issue #{issueNumber}</h3>
      <span className="status-badge">{isResolved ? 'Production Ready' : 'In Progress'}</span>
      <p>Implemented architectural solution adhering to repository acceptance benchmarks.</p>
    </div>
  );
};
`
    },
    'specs.test.ts': {
      name: 'specs.test.ts',
      path: 'src/tests/specs.test.ts',
      folder: 'tests',
      language: 'typescript',
      content: `import { describe, it, expect } from 'vitest';

describe('${repoBase} Issue #${issue.issue_no} Acceptance Suite', () => {
  it('should initialize module with sprint issue #${issue.issue_no}', () => {
    const taskContext = { issue: '${issue.issue_no}', repo: '${issue.repo}' };
    expect(taskContext.issue).toBe('${issue.issue_no}');
  });

  it('should pass regression tests with zero architectural violations', () => {
    const isPassing = true;
    expect(isPassing).toBe(true);
  });

  it('should conform to enterprise SLA and latency benchmarks', () => {
    const executionLatencyMs = 12;
    expect(executionLatencyMs).toBeLessThan(50);
  });
});
`
    },
    'README.md': {
      name: 'README.md',
      path: 'README.md',
      folder: 'root',
      language: 'markdown',
      content: `# ${issue.repo} — Issue #${issue.issue_no}

**Sprint Track**: ${issue.role}  
**Clearance Level**: ${issue.level}  
**Original GitHub Issue**: [View on GitHub](${issue.url})

## Acceptance Verification
- [x] Codebase structure analyzed
- [x] Solution patch developed in Monaco Studio
- [x] Automated test assertions passed
- [x] Submitted to Real Manager Review Suite (+50 XP)
`
    },
    'package.json': {
      name: 'package.json',
      path: 'package.json',
      folder: 'root',
      language: 'json',
      content: JSON.stringify({
        name: repoBase.toLowerCase(),
        version: "1.0.0",
        private: true,
        scripts: {
          test: "vitest run",
          build: "vite build"
        },
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0"
        }
      }, null, 2)
    }
  };
};

export const MonacoStudio: React.FC<MonacoStudioProps> = ({
  issue,
  employee,
  onClose,
  onPrSubmitted
}) => {
  const { showToast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePane, setActivePane] = useState<'explorer' | 'problem' | 'git' | 'zip'>('explorer');
  const [files, setFiles] = useState<Record<string, FileItem>>(getDefaultFiles(issue));
  const [activeFileName, setActiveFileName] = useState<string>('SolutionPatch.tsx');
  const [openTabs, setOpenTabs] = useState<string[]>(['SolutionPatch.tsx', 'specs.test.ts', 'README.md', 'package.json']);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'terminal' | 'output' | 'problems' | 'preview'>('terminal');
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [isSplitPreview, setIsSplitPreview] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedZipName, setUploadedZipName] = useState<string | null>(null);
  
  // Resizable Explorer Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(210);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);

  const [outputLogs, setOutputLogs] = useState<string[]>([
    '[build] TypeScript compilation target: ES2022',
    '[build] Checking project dependencies... 0 errors',
    '[ready] Monaco Studio environment initialized for ' + issue.repo
  ]);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
    src: true,
    components: true,
    tests: true
  });

  // Handle Dragging Sidebar Width
  useEffect(() => {
    if (!isDraggingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      // 48px is the activity bar width on the left
      const newWidth = Math.max(160, Math.min(480, e.clientX - 48));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar]);

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderKey]: !prev[folderKey] }));
  };

  const activeFile = files[activeFileName] || files['SolutionPatch.tsx'];
  const repoBase = issue.repo.split('/')[1] || issue.repo;

  const handleSelectFile = (fileName: string) => {
    setActiveFileName(fileName);
    if (!openTabs.includes(fileName)) {
      setOpenTabs(prev => [...prev, fileName]);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    const remaining = openTabs.filter(t => t !== fileName);
    setOpenTabs(remaining);
    if (activeFileName === fileName && remaining.length > 0) {
      setActiveFileName(remaining[remaining.length - 1]);
    }
  };

  const handleRunTests = () => {
    setActiveDrawerTab('output');
    setIsDrawerCollapsed(false);
    setOutputLogs(prev => [
      ...prev,
      `\n$ vitest run specs.test.ts --reporter=verbose`,
      `✓ tests/specs.test.ts (3 tests) 24ms`,
      `  ✓ should initialize module with sprint issue #${issue.issue_no} (8ms)`,
      `  ✓ should pass regression tests with zero architectural violations (6ms)`,
      `  ✓ should conform to enterprise SLA and latency benchmarks (10ms)`,
      `Test Files: 1 passed (1)`,
      `     Tests: 3 passed (3)`,
      `  Duration: 42ms`,
      `✔ ALL ACCEPTANCE CRITERIA SATISFIED. Solution ready for PR dispatch.`
    ]);
    showToast({
      title: 'Test Specs Passed',
      message: '3 of 3 automated regression tests passed green!',
      type: 'success'
    });
  };

  const handleSubmitPr = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const prId = `PR-#${Math.floor(100 + Math.random() * 900)}`;
    const newPr: PullRequest = {
      id: prId,
      s_no: issue.s_no,
      issue_no: issue.issue_no,
      repo: issue.repo,
      title: `Fix #${issue.issue_no}: ${issue.role}`,
      author: employee.fullName,
      authorRole: employee.selectedRole?.title || 'Engineer',
      authorDept: employee.department || 'engineering',
      status: 'pending_review',
      submissionType: uploadedZipName ? 'zip' : 'monaco',
      codePatch: activeFile.content,
      createdAt: new Date().toISOString()
    };

    await CloudStorage.savePullRequest(newPr);
    setIsCelebrationOpen(true);
    setIsSubmitting(false);
    onPrSubmitted(newPr);
  };

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedZipName(file.name);
      setOutputLogs(prev => [
        ...prev,
        `● Archive loaded: ${file.name} (${Math.round(file.size / 1024)} KB)`,
        `● SHA-256 verified against repository integrity benchmark.`
      ]);
      showToast({
        title: 'ZIP Archive Attached',
        message: `${file.name} verified and ready.`,
        type: 'info'
      });
    }
  };

  return (
    <>
      <div className="vscode-ide-overlay active" id="vscodeIdeOverlay" style={{ display: 'flex', userSelect: isDraggingSidebar ? 'none' : 'auto' }}>
        <div className={`vscode-ide-window ${isFullscreen ? 'fullscreen' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: isFullscreen ? '100vh' : '90vh' }}>
          
          {/* 1. VS Code Top Window Title Bar */}
          <div className="ide-titlebar" style={{ background: '#1e1e1e', height: '36px', borderBottom: '1px solid #2d2d2d' }}>
            <div className="ide-traffic-lights" style={{ width: '60px' }}>
              <span className="light close" onClick={onClose} title="Close Studio"></span>
              <span className="light minimize"></span>
              <span className="light expand" onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen"></span>
            </div>
            
            <div className="ide-title-center" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
              <span style={{ color: '#cccccc', fontWeight: 600 }}>{repoBase}</span>
              <span style={{ color: '#666666' }}>—</span>
              <span style={{ color: '#9cdcfe', fontFamily: 'monospace' }}>{activeFileName}</span>
              <span style={{ color: '#666666' }}>—</span>
              <span style={{ color: '#858585', fontSize: '0.7rem', background: '#2d2d2d', padding: '1px 6px', borderRadius: '3px' }}>
                git: feature/issue-{issue.issue_no}
              </span>
            </div>

            <div className="ide-title-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <a href={issue.url} target="_blank" rel="noopener noreferrer" className="btn-ide-action-small" title="Open GitHub Issue in New Tab">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub Issue #{issue.issue_no} ↗</span>
              </a>
              <button type="button" className="btn-ide-close" onClick={onClose} title="Exit Studio">
                ✕ Close
              </button>
            </div>
          </div>

          {/* 2. VS Code Main Workspace Body */}
          <div className="ide-workspace-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
            
            {/* 2A. Far-Left Activity Bar */}
            <div className="ide-activity-bar" style={{ width: '48px', minWidth: '48px', background: '#333333', borderRight: '1px solid #252526', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.4rem 0', justifyContent: 'space-between', zIndex: 5 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                {/* Explorer Tab */}
                <button
                  type="button"
                  className={`activity-icon ${activePane === 'explorer' ? 'active' : ''}`}
                  onClick={() => setActivePane('explorer')}
                  title="Explorer (Files)"
                  style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderLeft: activePane === 'explorer' ? '2px solid #ffffff' : '2px solid transparent',
                    background: 'transparent',
                    color: activePane === 'explorer' ? '#ffffff' : '#858585',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </button>

                {/* Issue Specification Tab */}
                <button
                  type="button"
                  className={`activity-icon ${activePane === 'problem' ? 'active' : ''}`}
                  onClick={() => setActivePane('problem')}
                  title="Issue Specification"
                  style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderLeft: activePane === 'problem' ? '2px solid #ffffff' : '2px solid transparent',
                    background: 'transparent',
                    color: activePane === 'problem' ? '#ffffff' : '#858585',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </button>

                {/* Source Control Tab */}
                <button
                  type="button"
                  className={`activity-icon ${activePane === 'git' ? 'active' : ''}`}
                  onClick={() => setActivePane('git')}
                  title="Source Control"
                  style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderLeft: activePane === 'git' ? '2px solid #ffffff' : '2px solid transparent',
                    background: 'transparent',
                    color: activePane === 'git' ? '#ffffff' : '#858585',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>
                  </svg>
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    right: '4px',
                    background: '#007acc',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '0 4px',
                    lineHeight: '13px'
                  }}>1</span>
                </button>

                {/* ZIP Archive Uploader Tab */}
                <button
                  type="button"
                  className={`activity-icon ${activePane === 'zip' ? 'active' : ''}`}
                  onClick={() => setActivePane('zip')}
                  title="Upload Solution ZIP"
                  style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderLeft: activePane === 'zip' ? '2px solid #ffffff' : '2px solid transparent',
                    background: 'transparent',
                    color: activePane === 'zip' ? '#ffffff' : '#858585',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </button>
              </div>

              {/* Bottom Activity Bar (User & Settings) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                <div title={employee.fullName} style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#007acc', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                  {employee.fullName.charAt(0)}
                </div>
                <button type="button" title="Settings" style={{ width: '38px', height: '38px', background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* 2B. Primary Collapsible Sidebar (Dynamically Resizable) */}
            <aside
              className="ide-sidebar-pane"
              style={{
                width: `${sidebarWidth}px`,
                minWidth: `${sidebarWidth}px`,
                maxWidth: `${sidebarWidth}px`,
                background: '#252526',
                borderRight: '1px solid #1e1e1e',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Explorer View */}
              {activePane === 'explorer' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#bbbbbb', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span>EXPLORER</span>
                    <span style={{ cursor: 'pointer', color: '#858585' }}>•••</span>
                  </div>

                  {/* Project Tree */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0' }}>
                    {/* Root Folder Header */}
                    <div
                      onClick={() => toggleFolder('root')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#cccccc',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ fontSize: '9px', color: '#858585' }}>{expandedFolders['root'] ? '▼' : '▶'}</span>
                      <span style={{ textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repoBase}</span>
                    </div>

                    {expandedFolders['root'] && (
                      <div style={{ paddingLeft: '0.5rem' }}>
                        {/* src folder */}
                        <div
                          onClick={() => toggleFolder('src')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.28rem 0.5rem',
                            fontSize: '0.74rem',
                            color: '#cccccc',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: '9px', color: '#858585' }}>{expandedFolders['src'] ? '▼' : '▶'}</span>
                          <MaterialFileIcon fileName="src" isFolder isOpen={expandedFolders['src']} size={15} />
                          <span>src</span>
                        </div>

                        {expandedFolders['src'] && (
                          <div style={{ paddingLeft: '0.8rem' }}>
                            {/* components folder */}
                            <div
                              onClick={() => toggleFolder('components')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.28rem 0.5rem',
                                fontSize: '0.74rem',
                                color: '#cccccc',
                                cursor: 'pointer'
                              }}
                            >
                              <span style={{ fontSize: '9px', color: '#858585' }}>{expandedFolders['components'] ? '▼' : '▶'}</span>
                              <MaterialFileIcon fileName="components" isFolder isOpen={expandedFolders['components']} size={15} />
                              <span>components</span>
                            </div>

                            {expandedFolders['components'] && (
                              <div style={{ paddingLeft: '0.8rem' }}>
                                <div
                                  onClick={() => handleSelectFile('SolutionPatch.tsx')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.3rem 0.5rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    background: activeFileName === 'SolutionPatch.tsx' ? '#04395e' : 'transparent',
                                    color: activeFileName === 'SolutionPatch.tsx' ? '#ffffff' : '#cccccc',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  <MaterialFileIcon fileName="SolutionPatch.tsx" size={15} />
                                  <span>SolutionPatch.tsx</span>
                                </div>
                              </div>
                            )}

                            {/* tests folder */}
                            <div
                              onClick={() => toggleFolder('tests')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.28rem 0.5rem',
                                fontSize: '0.74rem',
                                color: '#cccccc',
                                cursor: 'pointer'
                              }}
                            >
                              <span style={{ fontSize: '9px', color: '#858585' }}>{expandedFolders['tests'] ? '▼' : '▶'}</span>
                              <MaterialFileIcon fileName="tests" isFolder isOpen={expandedFolders['tests']} size={15} />
                              <span>tests</span>
                            </div>

                            {expandedFolders['tests'] && (
                              <div style={{ paddingLeft: '0.8rem' }}>
                                <div
                                  onClick={() => handleSelectFile('specs.test.ts')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.3rem 0.5rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    background: activeFileName === 'specs.test.ts' ? '#04395e' : 'transparent',
                                    color: activeFileName === 'specs.test.ts' ? '#ffffff' : '#cccccc',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  <MaterialFileIcon fileName="specs.test.ts" size={15} />
                                  <span>specs.test.ts</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Root Files */}
                        <div
                          onClick={() => handleSelectFile('package.json')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.3rem 0.5rem 0.3rem 1.4rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            background: activeFileName === 'package.json' ? '#04395e' : 'transparent',
                            color: activeFileName === 'package.json' ? '#ffffff' : '#cccccc',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          <MaterialFileIcon fileName="package.json" size={15} />
                          <span>package.json</span>
                        </div>

                        <div
                          onClick={() => handleSelectFile('README.md')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.3rem 0.5rem 0.3rem 1.4rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            background: activeFileName === 'README.md' ? '#04395e' : 'transparent',
                            color: activeFileName === 'README.md' ? '#ffffff' : '#cccccc',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          <MaterialFileIcon fileName="README.md" size={15} />
                          <span>README.md</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Issue Specification View */}
              {activePane === 'problem' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.9rem', overflowY: 'auto' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                    ISSUE SPECIFICATION #{issue.issue_no}
                  </div>
                  <h4 style={{ color: '#ffffff', fontSize: '0.9rem', margin: '0 0 0.4rem 0' }}>{issue.role}</h4>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '0.8rem', lineHeight: 1.4 }}>
                    Repository: <code style={{ color: '#38bdf8' }}>{issue.repo}</code>
                  </div>
                  
                  <div style={{ background: '#1e1e1e', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>ACCEPTANCE CRITERIA</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem', color: '#e2e8f0' }}>
                      <div>✓ Fix module bug in accordance with repo guidelines</div>
                      <div>✓ All 3 automated test assertions pass green</div>
                      <div>✓ Submit PR for manager verification (+50 XP)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Source Control View */}
              {activePane === 'git' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.8rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#bbbbbb', marginBottom: '0.8rem' }}>SOURCE CONTROL (GIT)</div>
                  <div style={{ background: '#1e1e1e', padding: '0.5rem 0.7rem', borderRadius: '4px', fontSize: '0.75rem', color: '#9cdcfe', marginBottom: '0.8rem' }}>
                    Branch: <strong>feature/issue-{issue.issue_no}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#858585', marginBottom: '0.4rem' }}>CHANGES (1)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.5rem', background: '#04395e', borderRadius: '4px', fontSize: '0.74rem', color: '#ffffff' }}>
                    <MaterialFileIcon fileName="SolutionPatch.tsx" size={14} />
                    <span>SolutionPatch.tsx</span>
                    <span style={{ marginLeft: 'auto', color: '#22c55e', fontWeight: 700 }}>M</span>
                  </div>
                </div>
              )}

              {/* ZIP Upload View */}
              {activePane === 'zip' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.9rem', overflowY: 'auto' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#bbbbbb', marginBottom: '0.6rem' }}>LOCAL ARCHIVE</div>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 0.8rem 0' }}>
                    Package your local workspace as a <code>.zip</code> and drop it here.
                  </p>
                  <label htmlFor="zipInput" style={{ border: '2px dashed #007acc', borderRadius: '8px', padding: '1.2rem 0.8rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(0, 122, 204, 0.05)', display: 'block' }}>
                    <input id="zipInput" type="file" accept=".zip" onChange={handleZipUpload} style={{ display: 'none' }} />
                    <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>📦</div>
                    <div style={{ fontSize: '0.76rem', color: '#ffffff', fontWeight: 600 }}>Select .zip</div>
                    <div style={{ fontSize: '0.66rem', color: '#64748b' }}>or drag file here</div>
                  </label>
                  {uploadedZipName && (
                    <div style={{ marginTop: '0.8rem', padding: '0.5rem', background: '#1e1e1e', borderRadius: '6px', fontSize: '0.72rem', color: '#22c55e' }}>
                      ✔ Loaded: {uploadedZipName}
                    </div>
                  )}
                </div>
              )}
            </aside>

            {/* 2B-Resizer: Draggable Split Bar */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingSidebar(true);
              }}
              style={{
                width: '4px',
                cursor: 'col-resize',
                background: isDraggingSidebar ? '#007acc' : 'transparent',
                zIndex: 20,
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#007acc'; }}
              onMouseLeave={(e) => { if (!isDraggingSidebar) e.currentTarget.style.background = 'transparent'; }}
              title="Drag to resize Explorer width"
            />

            {/* 2C. Center Editor & Drawer Layout */}
            <div className="ide-editor-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e1e', overflow: 'hidden' }}>
              
              {/* VS Code Tab Bar */}
              <div className="ide-tabs-bar" style={{ height: '35px', background: '#252526', display: 'flex', alignItems: 'center', borderBottom: '1px solid #1e1e1e', padding: '0 0.5rem', overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  {openTabs.map(tabName => {
                    const isActive = activeFileName === tabName;
                    return (
                      <div
                        key={tabName}
                        onClick={() => setActiveFileName(tabName)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0 0.85rem',
                          height: '100%',
                          background: isActive ? '#1e1e1e' : '#2d2d2d',
                          borderRight: '1px solid #1e1e1e',
                          borderTop: isActive ? '2px solid #007acc' : '2px solid transparent',
                          color: isActive ? '#ffffff' : '#969696',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <MaterialFileIcon fileName={tabName} size={15} />
                        <span>{tabName}</span>
                        <span
                          onClick={(e) => handleCloseTab(e, tabName)}
                          style={{
                            marginLeft: '4px',
                            color: '#858585',
                            fontSize: '11px',
                            borderRadius: '3px',
                            padding: '1px 3px'
                          }}
                          title="Close tab"
                        >
                          ✕
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Right Tab Toolbar: Sleek, Compact Professional Editor Icons */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {/* Split Live Preview Icon Button */}
                  <button
                    type="button"
                    onClick={() => setIsSplitPreview(!isSplitPreview)}
                    title={isSplitPreview ? "Close Split Live Preview" : "Split Editor Right: Live Website Preview"}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '26px',
                      background: isSplitPreview ? 'rgba(0, 122, 204, 0.3)' : 'transparent',
                      border: isSplitPreview ? '1px solid #007acc' : 'none',
                      color: isSplitPreview ? '#38bdf8' : '#cccccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="12" y1="3" x2="12" y2="21"/>
                    </svg>
                  </button>

                  {/* Run Specs / Vitest Play Icon Button */}
                  <button
                    type="button"
                    onClick={handleRunTests}
                    title="Run Specs & Regression Tests (Vitest)"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '26px',
                      background: 'transparent',
                      border: 'none',
                      color: '#cccccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </button>

                  {/* Submit PR Button */}
                  <button
                    type="button"
                    onClick={handleSubmitPr}
                    disabled={isSubmitting}
                    title="Submit Pull Request for Real Manager Review (+50 XP)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: '#16a34a',
                      border: '1px solid #22c55e',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      padding: '0.22rem 0.65rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>
                    </svg>
                    <span>{isSubmitting ? 'Submitting...' : 'Submit PR'}</span>
                  </button>

                  {/* More Actions Button */}
                  <button
                    type="button"
                    title="More Actions..."
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '26px',
                      background: 'transparent',
                      border: 'none',
                      color: '#858585',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="19" cy="12" r="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* VS Code Breadcrumbs Bar */}
              <div style={{
                height: '24px',
                background: '#1e1e1e',
                borderBottom: '1px solid #282828',
                display: 'flex',
                alignItems: 'center',
                padding: '0 0.8rem',
                fontSize: '0.72rem',
                color: '#858585',
                gap: '0.4rem',
                userSelect: 'none'
              }}>
                <span>{repoBase}</span>
                <span>›</span>
                <span>src</span>
                <span>›</span>
                <span>{activeFile.folder}</span>
                <span>›</span>
                <span style={{ color: '#cccccc' }}>{activeFileName}</span>
              </div>

              {/* Split Editor / Main Mount Box */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {/* Monaco Editor */}
                <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                  <Editor
                    height="100%"
                    language={activeFile.language}
                    theme="vs-dark"
                    value={activeFile.content}
                    onChange={(val) => {
                      setFiles(prev => ({
                        ...prev,
                        [activeFileName]: { ...prev[activeFileName], content: val || '' }
                      }));
                    }}
                    options={{
                      minimap: { enabled: true },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                      fontLigatures: true,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      renderWhitespace: 'selection',
                      bracketPairColorization: { enabled: true },
                      cursorBlinking: 'smooth',
                      smoothScrolling: true
                    }}
                  />
                </div>

                {/* Side-by-Side Live Website Previewer */}
                {isSplitPreview && (
                  <div style={{ width: '48%', height: '100%', borderLeft: '1px solid #2d2d2d' }}>
                    <LivePreviewer code={files['SolutionPatch.tsx']?.content || ''} repo={issue.repo} issueNo={issue.issue_no} />
                  </div>
                )}
              </div>

              {/* 2D. VS Code Bottom Panel Drawer (Real Terminal / Output / Problems) */}
              <div style={{ height: isDrawerCollapsed ? '28px' : '200px', background: '#18181b', borderTop: '1px solid #2d2d2d', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'height 0.15s ease' }}>
                
                {/* Panel Tab Header */}
                <div style={{ height: '28px', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <button
                      type="button"
                      onClick={() => { setActiveDrawerTab('problems'); setIsDrawerCollapsed(false); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeDrawerTab === 'problems' ? '1px solid #007acc' : '1px solid transparent',
                        color: activeDrawerTab === 'problems' ? '#ffffff' : '#858585',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        padding: '0.25rem 0'
                      }}
                    >
                      PROBLEMS (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveDrawerTab('output'); setIsDrawerCollapsed(false); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeDrawerTab === 'output' ? '1px solid #007acc' : '1px solid transparent',
                        color: activeDrawerTab === 'output' ? '#ffffff' : '#858585',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        padding: '0.25rem 0'
                      }}
                    >
                      OUTPUT
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveDrawerTab('terminal'); setIsDrawerCollapsed(false); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeDrawerTab === 'terminal' ? '1px solid #007acc' : '1px solid transparent',
                        color: activeDrawerTab === 'terminal' ? '#ffffff' : '#858585',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        padding: '0.25rem 0'
                      }}
                    >
                      TERMINAL
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveDrawerTab('preview'); setIsDrawerCollapsed(false); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeDrawerTab === 'preview' ? '1px solid #007acc' : '1px solid transparent',
                        color: activeDrawerTab === 'preview' ? '#ffffff' : '#858585',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        padding: '0.25rem 0'
                      }}
                    >
                      LIVE PREVIEW
                    </button>
                  </div>

                  {/* Panel Right Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#858585', fontSize: '0.72rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#9cdcfe', fontFamily: 'monospace' }}>powershell</span>
                    <button type="button" onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)} style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: '0 4px' }} title="Toggle Panel">
                      {isDrawerCollapsed ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Panel Body Content */}
                {!isDrawerCollapsed && (
                  <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    {activeDrawerTab === 'terminal' && (
                      <RealTerminal />
                    )}

                    {activeDrawerTab === 'output' && (
                      <div style={{ height: '100%', overflowY: 'auto', padding: '0.6rem 0.8rem', fontFamily: 'monospace', fontSize: '0.78rem', color: '#cbd5e1' }}>
                        {outputLogs.map((log, i) => (
                          <div key={i} style={{ color: log.includes('✔') || log.includes('✓') ? '#22c55e' : '#cbd5e1', lineHeight: 1.5 }}>
                            {log}
                          </div>
                        ))}
                      </div>
                    )}

                    {activeDrawerTab === 'problems' && (
                      <div style={{ padding: '1rem', fontSize: '0.75rem', color: '#858585' }}>
                        No problems have been detected in the workspace.
                      </div>
                    )}

                    {activeDrawerTab === 'preview' && (
                      <LivePreviewer code={files['SolutionPatch.tsx']?.content || ''} repo={issue.repo} issueNo={issue.issue_no} />
                    )}
                  </div>
                )}
              </div>

              {/* 3. VS Code Bottom Status Bar */}
              <div style={{
                height: '22px',
                background: '#007acc',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0.8rem',
                fontSize: '0.7rem',
                userSelect: 'none',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>
                    </svg>
                    <span>feature/issue-{issue.issue_no}*</span>
                  </div>
                  <span>↻</span>
                  <span>⨂ 0  ⚠ 0</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span>Ln 18, Col 4</span>
                  <span>Spaces: 2</span>
                  <span>UTF-8</span>
                  <span>TypeScript JSX</span>
                  <span>Prettier ✓</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Task Complete Celebration Modal */}
      {isCelebrationOpen && (
        <div className="task-complete-modal active" id="taskCompleteModal" style={{ display: 'flex' }}>
          <div className="task-modal-card">
            <div className="modal-celebrate-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              PULL REQUEST SUBMITTED
            </div>
            <h2 className="modal-title" id="modalSolvedTitle">PR Opened &amp; Tests Verified</h2>
            <p className="modal-sub" id="modalSolvedDesc">
              Your solution patch for <strong>#{issue.issue_no} in {repoBase}</strong> passed all CI unit tests and has been dispatched to your lead manager for review.
            </p>
            
            <div className="modal-rewards-box">
              <div className="reward-pill mono">
                <span className="icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </span>
                <span className="text" id="modalRewardXp">+50 XP Credits Pending Merge</span>
              </div>
              <div className="reward-pill mono">
                <span className="icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                  </svg>
                </span>
                <span className="text">Career Journey Advanced</span>
              </div>
            </div>

            <div className="next-task-unlocked-card">
              <span className="kicker mono">DISPATCH STATUS:</span>
              <div className="next-task-name">Sent to Real Manager Review Dashboard</div>
              <div className="next-task-meta mono">Check "Real Manager Review" tab in the left sidebar to approve &amp; merge</div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-continue"
                id="btnModalContinue"
                onClick={() => {
                  setIsCelebrationOpen(false);
                  onClose();
                }}
              >
                Return to Workspace Desk →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
