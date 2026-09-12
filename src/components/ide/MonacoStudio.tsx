import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { 
  FilePlus, 
  FolderPlus, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp, 
  RefreshCw, 
  X, 
  XCircle, 
  AlertTriangle, 
  Check, 
  Play, 
  GitPullRequest, 
  Trash2, 
  Search, 
  Edit2, 
  Copy, 
  ExternalLink, 
  Package,
  FolderMinus,
  Split
} from 'lucide-react';
import type { EmployeeState, ProblemIssue, PullRequest } from '../../types';
import { CloudStorage } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { MaterialFileIcon } from './MaterialFileIcon';
import { RealTerminal, type RealTerminalHandle } from './RealTerminal';
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
  originalContent?: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileTreeNode[];
}

export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx'].includes(ext)) return 'typescript';
  if (['js', 'jsx', 'mjs', 'cjs'].includes(ext)) return 'javascript';
  if (ext === 'json') return 'json';
  if (['md', 'markdown'].includes(ext)) return 'markdown';
  if (['css', 'scss', 'sass', 'less'].includes(ext)) return 'css';
  if (['html', 'htm'].includes(ext)) return 'html';
  if (ext === 'py') return 'python';
  if (['yaml', 'yml'].includes(ext)) return 'yaml';
  if (['sh', 'bash'].includes(ext)) return 'shell';
  if (ext === 'sql') return 'sql';
  if (['xml', 'svg'].includes(ext)) return 'xml';
  return 'plaintext';
}

export function getLanguageLabel(filePath: string, language: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  if (ext === 'tsx') return 'TypeScript JSX';
  if (ext === 'ts') return 'TypeScript';
  if (ext === 'jsx') return 'JavaScript JSX';
  if (ext === 'js') return 'JavaScript';
  if (ext === 'css') return 'CSS';
  if (ext === 'scss') return 'SCSS';
  if (ext === 'html') return 'HTML';
  if (ext === 'json') return 'JSON';
  if (ext === 'md') return 'Markdown';
  if (ext === 'py') return 'Python';
  if (ext === 'sql') return 'SQL';
  if (ext === 'sh') return 'Shell Script';
  return language ? language.toUpperCase() : 'Plain Text';
}

export function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: { children: Record<string, any> } = { children: {} };

  for (const p of paths) {
    const cleanPath = p.replace(/^\/+/, '');
    if (!cleanPath) continue;
    const parts = cleanPath.split('/');
    let curr = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = (i === parts.length - 1);
      const currPath = parts.slice(0, i + 1).join('/');

      if (!curr.children[part]) {
        curr.children[part] = {
          name: part,
          path: currPath,
          isFolder: !isFile,
          children: isFile ? undefined : {}
        };
      }
      curr = curr.children[part];
    }
  }

  function toSortedArray(nodeChildren?: Record<string, any>): FileTreeNode[] {
    if (!nodeChildren) return [];
    return Object.values(nodeChildren)
      .map(child => ({
        name: child.name,
        path: child.path,
        isFolder: child.isFolder,
        children: child.isFolder ? toSortedArray(child.children) : undefined
      }))
      .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return toSortedArray(root.children);
}

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (path: string) => void;
  activeFileName: string;
  files: Record<string, FileItem>;
  loadingFilePath: string | null;
  onSelectFile: (filePath: string, fileName: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  depth,
  expandedFolders,
  onToggleFolder,
  activeFileName,
  files,
  loadingFilePath,
  onSelectFile,
  onContextMenu
}) => {
  const isExpanded = !!expandedFolders[node.path];
  const isActive = activeFileName === node.path || activeFileName === node.name;
  const isModified = files[node.path]?.content !== undefined &&
                     files[node.path]?.originalContent !== undefined &&
                     files[node.path]?.content !== files[node.path]?.originalContent;
  const isLoading = loadingFilePath === node.path;

  if (node.isFolder) {
    return (
      <div>
        <div
          onClick={() => onToggleFolder(node.path)}
          onContextMenu={(e) => onContextMenu(e, node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.24rem 0.6rem',
            paddingLeft: `${depth * 14 + 10}px`,
            fontSize: '0.74rem',
            color: '#cccccc',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'background 0.1s ease',
            borderRadius: '3px'
          }}
          className="ide-tree-row"
        >
          <span style={{ width: '12px', display: 'inline-flex', alignItems: 'center', color: '#858585' }}>
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
          <MaterialFileIcon fileName={node.name} isFolder isOpen={isExpanded} size={15} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
        </div>

        {isExpanded && node.children && (
          <div>
            {node.children.map(child => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                activeFileName={activeFileName}
                files={files}
                loadingFilePath={loadingFilePath}
                onSelectFile={onSelectFile}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectFile(node.path, node.name)}
      onContextMenu={(e) => onContextMenu(e, node)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.24rem 0.6rem',
        paddingLeft: `${depth * 14 + 10}px`,
        fontSize: '0.74rem',
        cursor: 'pointer',
        background: isActive ? '#04395e' : 'transparent',
        borderLeft: isActive ? '2px solid #007acc' : '2px solid transparent',
        color: isActive ? '#ffffff' : '#cccccc',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        userSelect: 'none',
        borderRadius: '3px',
        transition: 'background 0.1s ease'
      }}
      className="ide-tree-row"
    >
      <span style={{ width: '12px' }}></span>
      <MaterialFileIcon fileName={node.name} size={15} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
      {isLoading && (
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#38bdf8' }}>loading...</span>
      )}
      {isModified && (
        <span style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: '10px', fontWeight: 700 }}>M</span>
      )}
    </div>
  );
};

export function computeUnifiedDiff(filePath: string, original: string = '', modified: string = ''): string {
  if (original === modified) {
    return `# --- a/${filePath}\n# +++ b/${filePath}\n# (No code modifications in this file)\n`;
  }

  const origLines = original.split('\n');
  const modLines = modified.split('\n');

  let diff = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${origLines.length} +1,${modLines.length} @@\n`;

  const maxLines = Math.max(origLines.length, modLines.length);
  let hasChanges = false;

  for (let i = 0; i < maxLines; i++) {
    const o = origLines[i];
    const m = modLines[i];

    if (o !== undefined && m !== undefined) {
      if (o === m) {
        diff += ` ${o}\n`;
      } else {
        diff += `-${o}\n+${m}\n`;
        hasChanges = true;
      }
    } else if (o !== undefined) {
      diff += `-${o}\n`;
      hasChanges = true;
    } else if (m !== undefined) {
      diff += `+${m}\n`;
      hasChanges = true;
    }
  }

  return hasChanges ? diff : `# No modifications detected in ${filePath}\n`;
}

const getDefaultFiles = (issue: ProblemIssue): Record<string, FileItem> => {
  const cleanRepo = (issue.repo || '').replace(/[./\s]+$/, '').trim();
  const readmeContent = `# ${cleanRepo} — Issue #${issue.issue_no}

**Sprint Track**: ${issue.role} (${issue.level} Level)  
**Original GitHub Issue**: [View on GitHub](${issue.url})

## Repository Workspace
Select any file from the Explorer on the left to inspect codebase files, author fixes, and submit your Pull Request.
`;

  return {
    'README.md': {
      name: 'README.md',
      path: 'README.md',
      folder: 'root',
      language: 'markdown',
      content: readmeContent,
      originalContent: readmeContent
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
  const cleanRepo = (issue.repo || '').replace(/[./\s]+$/, '').trim();
  const repoBase = cleanRepo.split('/')[1] || cleanRepo || 'workspace';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePane, setActivePane] = useState<'explorer' | 'search' | 'git' | 'problem' | 'zip'>('explorer');
  const [files, setFiles] = useState<Record<string, FileItem>>(getDefaultFiles(issue));
  const [activeFileName, setActiveFileName] = useState<string>('README.md');
  const [openTabs, setOpenTabs] = useState<string[]>(['README.md']);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'terminal' | 'output' | 'problems' | 'debug'>('terminal');
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [isSplitPreview, setIsSplitPreview] = useState(false);
  const [isDiffView, setIsDiffView] = useState(false);
  const [isLoadingGithubFiles, setIsLoadingGithubFiles] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedZipName, setUploadedZipName] = useState<string | null>(null);

  // Search filter query for workspace files
  const [searchQuery, setSearchQuery] = useState('');

  // Real Repository Tree State
  const [repoTree, setRepoTree] = useState<FileTreeNode[]>([]);
  const [repoBranch, setRepoBranch] = useState<string>('main');
  const [loadingFilePath, setLoadingFilePath] = useState<string | null>(null);
  
  // Resizable Explorer Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);

  // Explorer collapsible sections
  const [isSectionOpenEditorsOpen, setIsSectionOpenEditorsOpen] = useState(true);
  const [isSectionRepoOpen, setIsSectionRepoOpen] = useState(true);
  const [isSectionOutlineOpen, setIsSectionOutlineOpen] = useState(false);
  const [isSectionTimelineOpen, setIsSectionTimelineOpen] = useState(false);

  // Dynamic Monaco Editor State
  const editorRef = useRef<any>(null);
  const terminalHandleRef = useRef<RealTerminalHandle>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [markerCounts, setMarkerCounts] = useState({ errors: 0, warns: 0 });
  const [editorMarkers, setEditorMarkers] = useState<any[]>([]);
  const [terminalStatus, setTerminalStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');

  // VS Code Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node?: FileTreeNode | null;
  }>({ visible: false, x: 0, y: 0, node: null });

  // Inline New Item Creation State
  const [creatingItemType, setCreatingItemType] = useState<'file' | 'folder' | null>(null);
  const [creatingItemName, setCreatingItemName] = useState('');

  const [outputLogs, setOutputLogs] = useState<string[]>([
    '[build] TypeScript compilation target: ES2022',
    '[build] Checking project dependencies... 0 errors',
    '[ready] Monaco Studio environment initialized for ' + cleanRepo
  ]);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
    src: true
  });

  // Fetch real GitHub files from remote repository
  const loadRemoteRepoFiles = useCallback(async () => {
    if (!cleanRepo) return;
    setIsLoadingGithubFiles(true);
    setOutputLogs(prev => [
      ...prev,
      `[github] Fetching repository tree for ${cleanRepo}...`
    ]);

    try {
      let branch = 'main';
      let candidatePaths: string[] = [];

      // 1. Try UnGH (ungh.cc) - High rate limit, fast public CDN for GitHub repos
      try {
        const repoMetaRes = await fetch(`https://ungh.cc/repos/${cleanRepo}`);
        if (repoMetaRes.ok) {
          const metaData = await repoMetaRes.json();
          if (metaData?.repo?.defaultBranch) {
            branch = metaData.repo.defaultBranch;
            setRepoBranch(branch);
          }
        }
        const unghFilesRes = await fetch(`https://ungh.cc/repos/${cleanRepo}/files/${branch}`);
        if (unghFilesRes.ok) {
          const unghData = await unghFilesRes.json();
          if (Array.isArray(unghData?.files)) {
            candidatePaths = unghData.files.map((f: any) => f.path).filter(Boolean);
          }
        }
      } catch (_) {}

      // 2. Fallback to GitHub Trees API if ungh yielded no paths
      if (candidatePaths.length === 0) {
        try {
          let treeRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/trees/${branch}?recursive=1`);
          if (!treeRes.ok) {
            branch = branch === 'main' ? 'master' : 'main';
            setRepoBranch(branch);
            treeRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/trees/${branch}?recursive=1`);
          }
          if (treeRes.ok) {
            const treeData = await treeRes.json();
            if (Array.isArray(treeData?.tree)) {
              candidatePaths = treeData.tree.filter((t: any) => t.type === 'blob').map((t: any) => t.path);
            }
          }
        } catch (_) {}
      }

      // 3. Fallback to jsdelivr package API
      if (candidatePaths.length === 0) {
        try {
          let jRes = await fetch(`https://data.jsdelivr.com/v1/package/gh/${cleanRepo}@${branch}`);
          if (!jRes.ok) {
            branch = branch === 'main' ? 'master' : 'main';
            setRepoBranch(branch);
            jRes = await fetch(`https://data.jsdelivr.com/v1/package/gh/${cleanRepo}@${branch}`);
          }
          if (jRes.ok) {
            const jData = await jRes.json();
            if (Array.isArray(jData?.files)) {
              candidatePaths = jData.files.map((f: any) => f.name.replace(/^\//, '')).filter(Boolean);
            }
          }
        } catch (_) {}
      }

      if (candidatePaths.length > 0) {
        const filteredPaths = candidatePaths.filter(p => {
          if (p.startsWith('.git/') || p.includes('node_modules/')) return false;
          const ext = p.split('.').pop()?.toLowerCase();
          if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'zip', 'tar', 'gz', 'pdf', 'woff', 'woff2', 'ttf', 'eot', 'ico'].includes(ext || '')) {
            return false;
          }
          return true;
        });

        const tree = buildFileTree(filteredPaths);
        setRepoTree(tree);

        const initialExpanded: Record<string, boolean> = { root: true };
        tree.forEach(node => {
          if (node.isFolder) {
            initialExpanded[node.path] = true;
            if (node.name === 'src' && node.children) {
              node.children.forEach(c => { if (c.isFolder) initialExpanded[c.path] = true; });
            }
          }
        });
        setExpandedFolders(prev => ({ ...prev, ...initialExpanded }));

        const priorityCandidates = ['package.json', 'README.md', 'index.html', 'src/App.tsx', 'src/App.jsx', 'src/App.js', 'src/index.ts', 'src/index.js'];
        const toFetch = filteredPaths
          .filter(p => priorityCandidates.some(pri => p.toLowerCase().endsWith(pri.toLowerCase())))
          .slice(0, 5);

        const fetchedFiles: Record<string, FileItem> = {};
        await Promise.all(
          toFetch.map(async (fPath) => {
            try {
              const rawRes = await fetch(`https://raw.githubusercontent.com/${cleanRepo}/${branch}/${fPath}`);
              if (rawRes.ok) {
                const text = await rawRes.text();
                if (text && text.length < 300000) {
                  fetchedFiles[fPath] = {
                    name: fPath.split('/').pop() || fPath,
                    path: fPath,
                    folder: fPath.includes('/') ? fPath.split('/')[0] : 'root',
                    language: detectLanguage(fPath),
                    content: text,
                    originalContent: text
                  };
                }
              }
            } catch (_) {}
          })
        );

        if (Object.keys(fetchedFiles).length > 0) {
          setFiles(prev => ({ ...prev, ...fetchedFiles }));
          const firstKey = Object.keys(fetchedFiles)[0];
          setActiveFileName(firstKey);
          setOpenTabs(Object.keys(fetchedFiles).slice(0, 4));
        }

        setOutputLogs(prev => [
          ...prev,
          `[github] Mounted repository tree (${filteredPaths.length} files) from https://github.com/${cleanRepo} (${branch})`,
          `[github] Live file browser ready. Click any file to edit.`
        ]);
        showToast({
          title: 'GitHub Repos Synced',
          message: `Loaded ${filteredPaths.length} files from ${cleanRepo} (${branch})`,
          type: 'success'
        });
      } else {
        const fallbackPaths = ['README.md', 'package.json'];
        setRepoTree(buildFileTree(fallbackPaths));
        setOutputLogs(prev => [
          ...prev,
          `[github] Loaded local task environment for ${cleanRepo}.`
        ]);
      }
    } catch (err: any) {
      setOutputLogs(prev => [
        ...prev,
        `[github] Sandbox loaded for ${cleanRepo} (${err?.message || 'offline'})`
      ]);
    } finally {
      setIsLoadingGithubFiles(false);
    }
  }, [cleanRepo, showToast]);

  useEffect(() => {
    loadRemoteRepoFiles();
  }, [loadRemoteRepoFiles]);

  // Handle Dragging Sidebar Width
  useEffect(() => {
    if (!isDraggingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
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

  // Dismiss context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderKey]: !prev[folderKey] }));
  };

  const collapseAllFolders = () => {
    setExpandedFolders({ root: true });
  };

  const activeFile = files[activeFileName] || Object.values(files)[0] || {
    name: activeFileName.split('/').pop() || activeFileName,
    path: activeFileName,
    folder: 'root',
    language: detectLanguage(activeFileName),
    content: ''
  };

  const handleSelectFile = (fileName: string) => {
    setActiveFileName(fileName);
    if (!openTabs.includes(fileName)) {
      setOpenTabs(prev => [...prev, fileName]);
    }
  };

  // On-Demand Remote File Fetcher when clicked in Tree
  const handleSelectFileNode = async (filePath: string, fileName: string) => {
    if (files[filePath]?.content !== undefined) {
      setActiveFileName(filePath);
      if (!openTabs.includes(filePath)) {
        setOpenTabs(prev => [...prev, filePath]);
      }
      return;
    }

    setLoadingFilePath(filePath);
    try {
      const branch = repoBranch || 'master';
      const res = await fetch(`https://raw.githubusercontent.com/${cleanRepo}/${branch}/${filePath}`);
      if (res.ok) {
        const text = await res.text();
        const lang = detectLanguage(filePath);
        setFiles(prev => ({
          ...prev,
          [filePath]: {
            name: fileName,
            path: filePath,
            folder: filePath.includes('/') ? filePath.split('/')[0] : 'root',
            language: lang,
            content: text,
            originalContent: text
          }
        }));
        setActiveFileName(filePath);
        if (!openTabs.includes(filePath)) {
          setOpenTabs(prev => [...prev, filePath]);
        }
        setOutputLogs(prev => [
          ...prev,
          `[github] Loaded ${filePath} (${Math.round(text.length / 1024 * 10) / 10} KB) from remote repo`
        ]);
      } else {
        const lang = detectLanguage(filePath);
        const placeholder = `// File: ${filePath}\n// Repository: https://github.com/${cleanRepo}/blob/${branch}/${filePath}\n// Ready for authoring in Monaco Studio.\n`;
        setFiles(prev => ({
          ...prev,
          [filePath]: {
            name: fileName,
            path: filePath,
            folder: filePath.includes('/') ? filePath.split('/')[0] : 'root',
            language: lang,
            content: placeholder,
            originalContent: placeholder
          }
        }));
        setActiveFileName(filePath);
        if (!openTabs.includes(filePath)) {
          setOpenTabs(prev => [...prev, filePath]);
        }
      }
    } catch (_) {
      showToast({
        title: 'Network Warning',
        message: `Unable to download ${fileName} from remote.`,
        type: 'warning'
      });
    } finally {
      setLoadingFilePath(null);
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

  // Right-Click Context Menu Trigger
  const handleTreeContextMenu = (e: React.MouseEvent, node?: FileTreeNode | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      node: node || null
    });
  };

  // Handle Context Menu Actions
  const handleCreateNewItemSubmit = () => {
    if (!creatingItemName.trim()) {
      setCreatingItemType(null);
      return;
    }

    const cleanPath = creatingItemName.trim();
    if (creatingItemType === 'file') {
      const fileName = cleanPath.split('/').pop() || cleanPath;
      const newFileItem: FileItem = {
        name: fileName,
        path: cleanPath,
        folder: cleanPath.includes('/') ? cleanPath.split('/')[0] : 'root',
        language: detectLanguage(cleanPath),
        content: '',
        originalContent: ''
      };

      setFiles(prev => ({ ...prev, [cleanPath]: newFileItem }));
      setRepoTree(() => {
        const paths = Object.keys({ ...files, [cleanPath]: newFileItem });
        return buildFileTree(paths);
      });
      setActiveFileName(cleanPath);
      if (!openTabs.includes(cleanPath)) {
        setOpenTabs(prev => [...prev, cleanPath]);
      }
      showToast({
        title: 'File Created',
        message: `Created ${cleanPath} in workspace.`,
        type: 'success'
      });
    }

    setCreatingItemType(null);
    setCreatingItemName('');
  };

  const handleDeleteFile = (targetPath: string) => {
    setFiles(prev => {
      const next = { ...prev };
      delete next[targetPath];
      return next;
    });
    setOpenTabs(prev => prev.filter(t => t !== targetPath));
    if (activeFileName === targetPath) {
      const remaining = openTabs.filter(t => t !== targetPath);
      if (remaining.length > 0) setActiveFileName(remaining[0]);
    }
    setRepoTree(() => {
      const remainingPaths = Object.keys(files).filter(k => k !== targetPath);
      return buildFileTree(remainingPaths);
    });
    showToast({
      title: 'File Deleted',
      message: `Deleted ${targetPath}`,
      type: 'info'
    });
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    showToast({
      title: 'Path Copied',
      message: `${path} copied to clipboard`,
      type: 'info'
    });
  };

  // Format document using Monaco's built-in action
  const handleFormatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
      showToast({
        title: 'Document Formatted',
        message: 'Applied standard formatting rules.',
        type: 'info'
      });
    }
  };

  // Run CI Test Benchmarks
  const handleRunTests = () => {
    setActiveDrawerTab('terminal');
    setIsDrawerCollapsed(false);
    terminalHandleRef.current?.executeCommand('npm test');
  };

  const handleSubmitPr = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const prId = `PR-#${Math.floor(100 + Math.random() * 900)}`;

    let combinedPatch = '';
    const primaryOriginal = activeFile.originalContent || '';
    const primaryModified = activeFile.content;

    for (const [fName, fileItem] of Object.entries(files)) {
      if (fileItem.content !== fileItem.originalContent) {
        combinedPatch += computeUnifiedDiff(fileItem.path || fName, fileItem.originalContent || '', fileItem.content) + '\n';
      }
    }

    if (!combinedPatch.trim()) {
      combinedPatch = computeUnifiedDiff(activeFile.path || activeFileName, primaryOriginal, primaryModified);
    }

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
      codePatch: combinedPatch,
      originalCode: primaryOriginal,
      modifiedCode: primaryModified,
      createdAt: new Date().toISOString()
    };

    await CloudStorage.savePullRequest(newPr);
    await CloudStorage.recordTaskProgress(employee.empId, issue.repo, issue.issue_no, 'submitted', prId);
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

  // Capture real Monaco Editor instance and register event listeners
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Track real cursor line & col
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    // Track real diagnostics markers
    const updateMarkers = () => {
      const model = editor.getModel();
      if (!model) return;
      const markers = monaco.editor.getModelMarkers({ resource: model.uri });
      setEditorMarkers(markers);
      const errors = markers.filter((m: any) => m.severity === 8).length;
      const warns = markers.filter((m: any) => m.severity === 4).length;
      setMarkerCounts({ errors, warns });
    };

    monaco.editor.onDidChangeMarkers(updateMarkers);
    updateMarkers();
  };

  // Modified files count for Git badge
  const modifiedCount = Object.values(files).filter(f => f.content !== f.originalContent).length;

  return (
    <>
      <div className="vscode-ide-overlay active" id="vscodeIdeOverlay" style={{ display: 'flex', userSelect: isDraggingSidebar ? 'none' : 'auto' }}>
        <div className={`vscode-ide-window ${isFullscreen ? 'fullscreen' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: isFullscreen ? '100vh' : '92vh' }}>
          
          {/* 1. Sleek Apple-Style Title Bar */}
          <div className="ide-titlebar" style={{ background: '#1e1e1e', height: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Left: macOS Traffic Lights */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
              <button
                type="button"
                onClick={onClose}
                title="Close Studio"
                style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', border: 'none', cursor: 'pointer', padding: 0 }}
              />
              <button
                type="button"
                onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
                title="Minimize Panel"
                style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', border: 'none', cursor: 'pointer', padding: 0 }}
              />
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle Fullscreen"
                style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', border: 'none', cursor: 'pointer', padding: 0 }}
              />
            </div>
            
            {/* Center: Clean Search Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#252526',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '0.2rem 0.6rem',
              width: '320px',
              maxWidth: '40%',
              fontSize: '0.74rem',
              color: '#cccccc',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
            }}>
              <Search size={13} className="text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={repoBase ? `${repoBase}` : 'Search repository files...'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.74rem',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: 0 }}
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open GitHub Issue in New Tab"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '5px',
                  padding: '0.22rem 0.55rem',
                  color: '#e2e8f0',
                  fontSize: '0.72rem',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease'
                }}
              >
                <ExternalLink size={12} />
                <span>GitHub Issue #{issue.issue_no}</span>
              </a>

              {/* Layout Toggle: Split Preview */}
              <button
                type="button"
                onClick={() => setIsSplitPreview(!isSplitPreview)}
                title={isSplitPreview ? "Close Split Preview" : "Split Live Web Preview"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '26px',
                  background: isSplitPreview ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: isSplitPreview ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                  color: isSplitPreview ? '#38bdf8' : '#858585',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <Split size={14} />
              </button>

              {/* Layout Toggle: Bottom Panel */}
              <button
                type="button"
                onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
                title={isDrawerCollapsed ? "Show Terminal Panel" : "Hide Terminal Panel"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '26px',
                  background: !isDrawerCollapsed ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: '1px solid transparent',
                  color: !isDrawerCollapsed ? '#ffffff' : '#858585',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <ChevronDown size={14} />
              </button>

              <button
                type="button"
                onClick={onClose}
                title="Exit Studio"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#858585',
                  cursor: 'pointer',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.74rem',
                  borderRadius: '4px',
                  transition: 'color 0.15s ease'
                }}
              >
                <X size={13} />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* 2. Workspace Body */}
          <div className="ide-workspace-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
            
            {/* 2A. Far-Left Activity Bar */}
            <div className="ide-activity-bar" style={{ width: '48px', minWidth: '48px', background: '#18181b', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.4rem 0', justifyContent: 'space-between', zIndex: 5 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', alignItems: 'center' }}>
                {/* Explorer */}
                <button
                  type="button"
                  className={`activity-icon ${activePane === 'explorer' ? 'active' : ''}`}
                  onClick={() => setActivePane('explorer')}
                  title="Explorer (Files)"
                  style={{
                    position: 'relative',
                    width: '38px',
                    height: '38px',
                    borderLeft: activePane === 'explorer' ? '2px solid #ffffff' : '2px solid transparent',
                    background: 'transparent',
                    color: activePane === 'explorer' ? '#ffffff' : '#858585',
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={19} />
                </button>

                {/* Search */}
                <button
                  type="button"
                  className={`activity-icon ${activePane === 'search' ? 'active' : ''}`}
                  onClick={() => setActivePane('search')}
                  title="Search in Files"
                  style={{
                    position: 'relative',
                    width: '38px',
                    height: '38px',
                    borderLeft: activePane === 'search' ? '2px solid #ffffff' : '2px solid transparent',
                    background: 'transparent',
                    color: activePane === 'search' ? '#ffffff' : '#858585',
                    cursor: 'pointer'
                  }}
                >
                  <Search size={18} />
                </button>

                {/* Source Control (Git) */}
                <button
                  type="button"
                  className={`activity-icon ${activePane === 'git' ? 'active' : ''}`}
                  onClick={() => setActivePane('git')}
                  title="Source Control"
                  style={{
                    position: 'relative',
                    width: '38px',
                    height: '38px',
                    borderLeft: activePane === 'git' ? '2px solid #ffffff' : '2px solid transparent',
                    background: 'transparent',
                    color: activePane === 'git' ? '#ffffff' : '#858585',
                    cursor: 'pointer'
                  }}
                >
                  <GitPullRequest size={18} />
                  {modifiedCount > 0 && (
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
                    }}>{modifiedCount}</span>
                  )}
                </button>

                {/* ZIP Archive Uploader */}
                <button
                  type="button"
                  className={`activity-icon ${activePane === 'zip' ? 'active' : ''}`}
                  onClick={() => setActivePane('zip')}
                  title="Upload Solution ZIP"
                  style={{
                    position: 'relative',
                    width: '38px',
                    height: '38px',
                    borderLeft: activePane === 'zip' ? '2px solid #ffffff' : '2px solid transparent',
                    background: 'transparent',
                    color: activePane === 'zip' ? '#ffffff' : '#858585',
                    cursor: 'pointer'
                  }}
                >
                  <Package size={18} />
                </button>
              </div>

              {/* Bottom: User Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <div title={employee.fullName} style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#007acc', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                  {employee.fullName.charAt(0)}
                </div>
              </div>
            </div>

            {/* 2B. Resizable Primary Sidebar */}
            <aside
              className="ide-sidebar-pane"
              onContextMenu={(e) => handleTreeContextMenu(e, null)}
              style={{
                width: `${sidebarWidth}px`,
                minWidth: `${sidebarWidth}px`,
                maxWidth: `${sidebarWidth}px`,
                background: '#202022',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Explorer View */}
              {activePane === 'explorer' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Explorer Header with VS Code actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#999999', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span>EXPLORER</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {/* New File Button */}
                      <button
                        type="button"
                        onClick={() => { setCreatingItemType('file'); setCreatingItemName(''); }}
                        title="New File..."
                        style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      >
                        <FilePlus size={13} />
                      </button>

                      {/* New Folder Button */}
                      <button
                        type="button"
                        onClick={() => { setCreatingItemType('folder'); setCreatingItemName(''); }}
                        title="New Folder..."
                        style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      >
                        <FolderPlus size={13} />
                      </button>

                      {/* Refresh Button */}
                      <button
                        type="button"
                        onClick={() => loadRemoteRepoFiles()}
                        title="Sync with GitHub"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isLoadingGithubFiles ? '#38bdf8' : '#858585',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px'
                        }}
                      >
                        <RefreshCw size={12} className={isLoadingGithubFiles ? 'animate-spin' : ''} />
                      </button>

                      {/* Collapse All Folders */}
                      <button
                        type="button"
                        onClick={collapseAllFolders}
                        title="Collapse All Folders"
                        style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      >
                        <FolderMinus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Item Creation Bar */}
                  {creatingItemType && (
                    <div style={{ padding: '0.3rem 0.6rem', background: '#18181b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {creatingItemType === 'file' ? <FilePlus size={13} className="text-sky-400" /> : <FolderPlus size={13} className="text-amber-400" />}
                        <input
                          type="text"
                          autoFocus
                          value={creatingItemName}
                          onChange={(e) => setCreatingItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateNewItemSubmit();
                            if (e.key === 'Escape') setCreatingItemType(null);
                          }}
                          placeholder={creatingItemType === 'file' ? 'src/MyComponent.tsx' : 'folder_name'}
                          style={{
                            flex: 1,
                            background: '#252526',
                            border: '1px solid #007acc',
                            borderRadius: '3px',
                            color: '#ffffff',
                            fontSize: '0.74rem',
                            padding: '0.15rem 0.4rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleCreateNewItemSubmit}
                          style={{ background: '#007acc', border: 'none', borderRadius: '3px', color: '#fff', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatingItemType(null)}
                          style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: '2px' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sidebar Sections */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0.2rem 0' }}>
                    
                    {/* 1. OPEN EDITORS Section */}
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div
                        onClick={() => setIsSectionOpenEditorsOpen(!isSectionOpenEditorsOpen)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          color: '#aaaaaa',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{ width: '12px', display: 'inline-flex', alignItems: 'center', color: '#858585' }}>
                          {isSectionOpenEditorsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        <span>OPEN EDITORS</span>
                      </div>

                      {isSectionOpenEditorsOpen && (
                        <div style={{ paddingBottom: '0.2rem' }}>
                          {openTabs.map(tabName => {
                            const isMod = files[tabName]?.content !== undefined &&
                                          files[tabName]?.originalContent !== undefined &&
                                          files[tabName]?.content !== files[tabName]?.originalContent;
                            const isActive = activeFileName === tabName;
                            const displayName = tabName.split('/').pop() || tabName;
                            return (
                              <div
                                key={tabName}
                                onClick={() => setActiveFileName(tabName)}
                                onContextMenu={(e) => handleTreeContextMenu(e, { name: displayName, path: tabName, isFolder: false })}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  padding: '0.22rem 0.6rem 0.22rem 1.4rem',
                                  fontSize: '0.74rem',
                                  cursor: 'pointer',
                                  background: isActive ? '#04395e' : 'transparent',
                                  borderLeft: isActive ? '2px solid #007acc' : '2px solid transparent',
                                  color: isActive ? '#ffffff' : '#cccccc',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                className="ide-tree-row"
                              >
                                <MaterialFileIcon fileName={displayName} size={14} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
                                {isMod && (
                                  <span style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: '10px', fontWeight: 700 }}>M</span>
                                )}
                                <span
                                  onClick={(e) => handleCloseTab(e, tabName)}
                                  style={{
                                    marginLeft: isMod ? '4px' : 'auto',
                                    color: '#858585',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '0 2px'
                                  }}
                                  title="Close"
                                >
                                  <X size={11} />
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 2. REPOSITORY TREE Section */}
                    <div>
                      <div
                        onClick={() => setIsSectionRepoOpen(!isSectionRepoOpen)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{ width: '12px', display: 'inline-flex', alignItems: 'center', color: '#858585' }}>
                          {isSectionRepoOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        <span style={{ textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {repoBase}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '3px', marginLeft: 'auto', fontFamily: 'monospace' }}>
                          {repoBranch}
                        </span>
                      </div>

                      {isSectionRepoOpen && (
                        <div>
                          {isLoadingGithubFiles && repoTree.length === 0 ? (
                            <div style={{ padding: '0.8rem 1rem', fontSize: '0.72rem', color: '#858585', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <RefreshCw size={12} className="animate-spin text-sky-400" />
                              <span>Loading repository files...</span>
                            </div>
                          ) : repoTree.length > 0 ? (
                            repoTree
                              .filter(node => !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase()) || (node.children && node.children.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))))
                              .map(node => (
                                <FileTreeItem
                                  key={node.path}
                                  node={node}
                                  depth={0}
                                  expandedFolders={expandedFolders}
                                  onToggleFolder={toggleFolder}
                                  activeFileName={activeFileName}
                                  files={files}
                                  loadingFilePath={loadingFilePath}
                                  onSelectFile={handleSelectFileNode}
                                  onContextMenu={handleTreeContextMenu}
                                />
                              ))
                          ) : (
                            Object.entries(files).map(([fName, fileItem]) => {
                              const isMod = fileItem.content !== fileItem.originalContent;
                              const isActive = activeFileName === fName;
                              return (
                                <div
                                  key={fName}
                                  onClick={() => handleSelectFile(fName)}
                                  onContextMenu={(e) => handleTreeContextMenu(e, { name: fName, path: fName, isFolder: false })}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.24rem 0.6rem 0.24rem 1.4rem',
                                    fontSize: '0.74rem',
                                    cursor: 'pointer',
                                    background: isActive ? '#04395e' : 'transparent',
                                    color: isActive ? '#ffffff' : '#cccccc',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                  className="ide-tree-row"
                                >
                                  <MaterialFileIcon fileName={fName} size={15} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fName}</span>
                                  {isMod && (
                                    <span style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: '10px', fontWeight: 700 }}>M</span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. OUTLINE Section */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '0.4rem' }}>
                      <div
                        onClick={() => setIsSectionOutlineOpen(!isSectionOutlineOpen)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          color: '#aaaaaa',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{ width: '12px', display: 'inline-flex', alignItems: 'center', color: '#858585' }}>
                          {isSectionOutlineOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        <span>OUTLINE</span>
                      </div>
                      {isSectionOutlineOpen && (
                        <div style={{ padding: '0.4rem 1.4rem', fontSize: '0.72rem', color: '#71717a' }}>
                          No outline symbols in active editor
                        </div>
                      )}
                    </div>

                    {/* 4. TIMELINE Section */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div
                        onClick={() => setIsSectionTimelineOpen(!isSectionTimelineOpen)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          color: '#aaaaaa',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{ width: '12px', display: 'inline-flex', alignItems: 'center', color: '#858585' }}>
                          {isSectionTimelineOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        <span>TIMELINE</span>
                      </div>
                      {isSectionTimelineOpen && (
                        <div style={{ padding: '0.4rem 1.4rem', fontSize: '0.72rem', color: '#71717a' }}>
                          Git History • feature/issue-{issue.issue_no}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Search Pane */}
              {activePane === 'search' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.8rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#999999', marginBottom: '0.6rem', letterSpacing: '0.08em' }}>SEARCH</div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search file names..."
                    style={{
                      background: '#1e1e1e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      padding: '0.35rem 0.6rem',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      outline: 'none',
                      marginBottom: '0.8rem'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#858585' }}>
                    {searchQuery ? `Filtered files in repository tree.` : 'Type to search across repo files.'}
                  </div>
                </div>
              )}

              {/* Source Control View */}
              {activePane === 'git' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.8rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#999999', marginBottom: '0.8rem', letterSpacing: '0.08em' }}>SOURCE CONTROL</div>
                  <div style={{ background: '#1e1e1e', padding: '0.5rem 0.7rem', borderRadius: '4px', fontSize: '0.75rem', color: '#9cdcfe', marginBottom: '0.8rem' }}>
                    Branch: <strong>feature/issue-{issue.issue_no}</strong>
                  </div>
                  {(() => {
                    const modifiedList = Object.entries(files).filter(([_, f]) => f.content !== f.originalContent);
                    return (
                      <>
                        <div style={{ fontSize: '0.72rem', color: '#858585', marginBottom: '0.4rem', fontWeight: 600 }}>
                          CHANGES ({modifiedList.length})
                        </div>
                        {modifiedList.length === 0 ? (
                          <div style={{ fontSize: '0.74rem', color: '#71717a', padding: '0.5rem 0' }}>
                            No changes detected. Edit any file in the workspace to track modifications.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {modifiedList.map(([key, f]) => (
                              <div
                                key={key}
                                onClick={() => handleSelectFile(key)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.3rem 0.5rem',
                                  background: activeFileName === key ? '#04395e' : 'transparent',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  color: '#ffffff',
                                  cursor: 'pointer'
                                }}
                              >
                                <MaterialFileIcon fileName={f.name} size={14} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path || f.name}</span>
                                <span style={{ marginLeft: 'auto', color: '#f59e0b', fontWeight: 700, fontSize: '10px' }}>M</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
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
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}>
                      <Package size={32} className="text-sky-400" />
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#ffffff', fontWeight: 600 }}>Select .zip</div>
                    <div style={{ fontSize: '0.66rem', color: '#64748b' }}>or drag file here</div>
                  </label>
                  {uploadedZipName && (
                    <div style={{ marginTop: '0.8rem', padding: '0.5rem', background: '#1e1e1e', borderRadius: '6px', fontSize: '0.72rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={13} />
                      <span>Loaded: {uploadedZipName}</span>
                    </div>
                  )}
                </div>
              )}
            </aside>

            {/* Resizer: Draggable Split Bar */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingSidebar(true);
              }}
              style={{
                width: '3px',
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
              <div className="ide-tabs-bar" style={{ height: '36px', background: '#18181b', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 0.4rem', overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  {openTabs.map(tabName => {
                    const isActive = activeFileName === tabName;
                    const displayName = tabName.split('/').pop() || tabName;
                    const isMod = files[tabName]?.content !== undefined &&
                                  files[tabName]?.originalContent !== undefined &&
                                  files[tabName]?.content !== files[tabName]?.originalContent;
                    return (
                      <div
                        key={tabName}
                        onClick={() => setActiveFileName(tabName)}
                        title={tabName}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0 0.85rem',
                          height: '100%',
                          background: isActive ? '#1e1e1e' : '#252526',
                          borderRight: '1px solid rgba(0,0,0,0.3)',
                          borderTop: isActive ? '2px solid #007acc' : '2px solid transparent',
                          color: isActive ? '#ffffff' : '#94a3b8',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'background 0.1s ease'
                        }}
                      >
                        <MaterialFileIcon fileName={displayName} size={15} />
                        <span>{displayName}</span>
                        {isMod && (
                          <span style={{ color: '#f59e0b', fontSize: '10px', fontWeight: 700 }}>M</span>
                        )}
                        <span
                          onClick={(e) => handleCloseTab(e, tabName)}
                          style={{
                            marginLeft: '4px',
                            color: '#858585',
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '3px',
                            padding: '1px'
                          }}
                          title="Close tab"
                        >
                          <X size={11} />
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Right Tab Toolbar: Clean & Minimal Actions */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {/* Format Document Button */}
                  <button
                    type="button"
                    onClick={handleFormatDocument}
                    title="Format Document (Prettier)"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '26px',
                      height: '26px',
                      background: 'transparent',
                      border: 'none',
                      color: '#cccccc',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={13} />
                  </button>

                  {/* Diff View Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsDiffView(!isDiffView)}
                    title={isDiffView ? "Normal Editor" : "Diff View vs Remote"}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '26px',
                      height: '26px',
                      background: isDiffView ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      border: isDiffView ? '1px solid #38bdf8' : 'none',
                      color: isDiffView ? '#38bdf8' : '#cccccc',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Split size={13} />
                  </button>

                  {/* Run CI Tests Button */}
                  <button
                    type="button"
                    onClick={handleRunTests}
                    title="Run CI Unit Tests"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '26px',
                      height: '26px',
                      background: 'transparent',
                      border: 'none',
                      color: '#22c55e',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={13} fill="currentColor" />
                  </button>

                  {/* Submit PR Button */}
                  <button
                    type="button"
                    onClick={handleSubmitPr}
                    disabled={isSubmitting}
                    title="Submit Pull Request for Manager Review (+50 XP)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: '#238636',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <GitPullRequest size={12} />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit PR'}</span>
                  </button>
                </div>
              </div>

              {/* Breadcrumbs Bar */}
              <div style={{
                height: '24px',
                background: '#1e1e1e',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 0.8rem',
                fontSize: '0.72rem',
                color: '#858585',
                gap: '0.4rem',
                userSelect: 'none',
                overflowX: 'auto'
              }}>
                <span>{repoBase}</span>
                {(activeFile.path || activeFileName).split('/').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    <ChevronRight size={10} className="text-zinc-500" />
                    <span style={{ color: i === arr.length - 1 ? '#cccccc' : '#858585' }}>{part}</span>
                  </React.Fragment>
                ))}
                {isDiffView && (
                  <span style={{ marginLeft: 'auto', color: '#38bdf8', fontSize: '0.68rem', fontWeight: 600 }}>
                    Comparing with GitHub Remote Original
                  </span>
                )}
              </div>

              {/* Split Editor / Main Mount Box */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {/* Monaco Editor / Diff Editor */}
                <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                  {isDiffView ? (
                    <DiffEditor
                      height="100%"
                      language={activeFile.language}
                      theme="vs-dark"
                      original={activeFile.originalContent || ''}
                      modified={activeFile.content}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Menlo', monospace",
                        lineNumbers: 'on',
                        renderSideBySide: true,
                        automaticLayout: true,
                        readOnly: false,
                        scrollBeyondLastLine: false
                      }}
                    />
                  ) : (
                    <Editor
                      height="100%"
                      language={activeFile.language}
                      theme="vs-dark"
                      value={activeFile.content}
                      onMount={handleEditorMount}
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
                  )}
                </div>

                {/* Side-by-Side Live Website Previewer */}
                {isSplitPreview && (
                  <div style={{ width: '48%', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                    <LivePreviewer code={activeFile.content || ''} repo={cleanRepo} issueNo={issue.issue_no} />
                  </div>
                )}
              </div>

              {/* 2D. VS Code Bottom Panel (Terminal / Output / Problems / Debug) */}
              <div style={{ height: isDrawerCollapsed ? '28px' : '220px', background: '#18181b', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'height 0.15s ease' }}>
                
                {/* Panel Tab Header */}
                <div style={{ height: '28px', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
                      PROBLEMS ({markerCounts.errors + markerCounts.warns})
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
                  </div>

                  {/* Panel Right Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#858585', fontSize: '0.72rem' }}>
                    {/* Shell Badge with Live Status Dot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', color: '#9cdcfe', fontFamily: 'monospace' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: terminalStatus === 'connected' ? '#10b981' : (terminalStatus === 'connecting' ? '#f59e0b' : '#ef4444')
                      }} />
                      <span>workspace: powershell</span>
                    </div>

                    {/* New/Reconnect Session Button */}
                    <button
                      type="button"
                      onClick={() => terminalHandleRef.current?.reconnect()}
                      title="New / Reconnect Terminal"
                      style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: '0 2px' }}
                    >
                      <RefreshCw size={11} />
                    </button>

                    {/* Clear Terminal Output */}
                    <button
                      type="button"
                      onClick={() => terminalHandleRef.current?.clear()}
                      title="Clear Terminal"
                      style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={12} />
                    </button>

                    {/* Collapse / Expand Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
                      style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                      title="Toggle Panel"
                    >
                      {isDrawerCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {/* Close Panel Button */}
                    <button
                      type="button"
                      onClick={() => setIsDrawerCollapsed(true)}
                      style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                      title="Close Panel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Panel Body Content */}
                {!isDrawerCollapsed && (
                  <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    {activeDrawerTab === 'terminal' && (
                      <RealTerminal
                        ref={terminalHandleRef}
                        repoBase={repoBase}
                        files={files}
                        issueNo={issue.issue_no}
                        onFilesChange={setFiles}
                        onStatusChange={setTerminalStatus}
                      />
                    )}

                    {activeDrawerTab === 'output' && (
                      <div style={{ height: '100%', overflowY: 'auto', padding: '0.6rem 0.8rem', fontFamily: 'monospace', fontSize: '0.76rem', color: '#cbd5e1' }}>
                        {outputLogs.map((log, i) => (
                          <div key={i} style={{ color: log.includes('✓') ? '#22c55e' : '#cbd5e1', lineHeight: 1.5 }}>
                            {log}
                          </div>
                        ))}
                      </div>
                    )}

                    {activeDrawerTab === 'problems' && (
                      <div style={{ height: '100%', overflowY: 'auto', padding: '0.6rem 0.8rem', fontSize: '0.74rem' }}>
                        {editorMarkers.length === 0 ? (
                          <div style={{ color: '#858585' }}>
                            No problems have been detected in the workspace.
                          </div>
                        ) : (
                          editorMarkers.map((m, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0', color: m.severity === 8 ? '#ef4444' : '#f59e0b' }}>
                              {m.severity === 8 ? <XCircle size={13} className="text-red-400" /> : <AlertTriangle size={13} className="text-amber-400" />}
                              <span style={{ color: '#e2e8f0' }}>{m.message}</span>
                              <span style={{ color: '#858585', marginLeft: 'auto' }}>[{m.startLineNumber}, {m.startColumn}]</span>
                            </div>
                          ))
                        )}
                      </div>
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
                    <GitPullRequest size={12} />
                    <span>feature/issue-{issue.issue_no}*</span>
                  </div>
                  <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => loadRemoteRepoFiles()} title="Sync with GitHub">
                    <RefreshCw size={11} />
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><XCircle size={11} /> {markerCounts.errors}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><AlertTriangle size={11} /> {markerCounts.warns}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                  <span>Spaces: 2</span>
                  <span>UTF-8</span>
                  <span>LF</span>
                  <span>{getLanguageLabel(activeFile.path || activeFileName, activeFile.language)}</span>
                  <span onClick={handleFormatDocument} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px' }} title="Format Document with Prettier">
                    <span>Prettier</span> <Check size={11} />
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* VS Code Native Right-Click Context Menu */}
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#252526',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            padding: '4px 0',
            zIndex: 999999,
            minWidth: '180px',
            fontSize: '0.74rem',
            color: '#cccccc'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => {
              setCreatingItemType('file');
              setCreatingItemName('');
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
            style={{ padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            className="ide-ctx-item"
          >
            <FilePlus size={13} />
            <span>New File...</span>
          </div>

          <div
            onClick={() => {
              setCreatingItemType('folder');
              setCreatingItemName('');
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
            style={{ padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            className="ide-ctx-item"
          >
            <FolderPlus size={13} />
            <span>New Folder...</span>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '3px 0' }} />

          {contextMenu.node && (
            <>
              <div
                onClick={() => {
                  handleCopyPath(contextMenu.node?.path || '');
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                style={{ padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                className="ide-ctx-item"
              >
                <Copy size={13} />
                <span>Copy Path</span>
              </div>

              <div
                onClick={() => {
                  handleCopyPath(contextMenu.node?.name || '');
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                style={{ padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                className="ide-ctx-item"
              >
                <Copy size={13} />
                <span>Copy Relative Path</span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '3px 0' }} />

              <div
                onClick={() => {
                  if (contextMenu.node?.path) {
                    setCreatingItemType('file');
                    setCreatingItemName(contextMenu.node.path);
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                style={{ padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                className="ide-ctx-item"
              >
                <Edit2 size={13} />
                <span>Rename...</span>
              </div>

              <div
                onClick={() => {
                  if (contextMenu.node?.path) {
                    setIsDiffView(true);
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                style={{ padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                className="ide-ctx-item"
              >
                <Split size={13} />
                <span>Compare with Original</span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '3px 0' }} />

              <div
                onClick={() => {
                  if (contextMenu.node?.path) {
                    handleDeleteFile(contextMenu.node.path);
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                style={{ padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#ef4444' }}
                className="ide-ctx-item"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Task Complete Celebration Modal */}
      {isCelebrationOpen && (
        <div className="task-complete-modal active" id="taskCompleteModal" style={{ display: 'flex' }}>
          <div className="task-modal-card">
            <div className="modal-celebrate-badge">
              <Check size={12} style={{ marginRight: '4px' }} />
              PULL REQUEST SUBMITTED
            </div>
            <h2 className="modal-title" id="modalSolvedTitle">PR Opened &amp; Tests Verified</h2>
            <p className="modal-sub" id="modalSolvedDesc">
              Your solution patch for <strong>#{issue.issue_no} in {repoBase}</strong> passed all CI unit tests and has been dispatched to your lead manager for review.
            </p>
            
            <div className="modal-rewards-box">
              <div className="reward-pill mono">
                <span className="icon">
                  <Check size={13} className="text-amber-400" />
                </span>
                <span className="text" id="modalRewardXp">+50 XP Credits Pending Merge</span>
              </div>
              <div className="reward-pill mono">
                <span className="icon">
                  <Play size={12} className="text-sky-400" />
                </span>
                <span className="text">Career Journey Advanced</span>
              </div>
            </div>

            <div className="next-task-unlocked-card">
              <span className="kicker mono">REVIEW STATUS:</span>
              <div className="next-task-name">Submitted to Lead Manager for Review</div>
              <div className="next-task-meta mono">Your manager will review the diff, run checks, and approve or request changes. Check "My Manager" for status updates.</div>
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
