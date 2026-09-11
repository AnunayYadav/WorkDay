export type UserRoleType = 'employee' | 'manager' | 'hr';

export interface Company {
  id: string;
  name: string;
  domain: string;
  tagline: string;
  description: string;
  headquarters: string;
  founded: string;
  metrics: {
    headcount: string;
    valuation: string;
    uptime: string;
    compliance: string;
  };
  leadership: Array<{
    name: string;
    role: string;
    dept: string;
    initials: string;
  }>;
  benefits: Array<{
    title: string;
    desc: string;
    tier: string;
  }>;
  techStack: string[];
}

export type CompanyPreset = Pick<Company, 'id' | 'name' | 'domain' | 'tagline'>;

export const PRESET_COMPANIES: CompanyPreset[] = [
  { id: 'stripe', name: 'Stripe', domain: 'stripe.corp', tagline: 'Global Financial Infrastructure & Developer APIs' },
  { id: 'linear', name: 'Linear', domain: 'linear.app', tagline: 'Issue Tracking & High-Velocity Engineering' },
  { id: 'meta', name: 'Meta', domain: 'meta.corp', tagline: 'Open Source AI Models & Global Scale Infrastructure' },
  { id: 'google', name: 'Google Cloud', domain: 'google.corp', tagline: 'Distributed Systems & Hyperscale Cloud Infrastructure' },
  { id: 'vercel', name: 'Vercel', domain: 'vercel.corp', tagline: 'Frontend Cloud & Serverless Edge Frameworks' },
  { id: 'supabase', name: 'Supabase', domain: 'supabase.corp', tagline: 'Open Source Postgres & Realtime Backend Infrastructure' }
];

export interface TaskItem {
  id: string;
  assignedToEmpId: string;
  assignedToName: string;
  assignedByEmpId: string;
  assignedByName: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  dueDate?: string;
  repo?: string;
  issueNo?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeState {
  fullName: string;
  preferredName: string;
  handle: string;
  empId: string;
  department: string;
  selectedRole: DepartmentRole;
  signatureDataUrl: string;
  isSigned: boolean;
  currentStep: number;
  email?: string;
  avatarUrl?: string;
  authProvider?: 'github' | 'email' | 'guest';
  userId?: string;
  userType?: UserRoleType;
  totalXp?: number;
  githubUsername?: string;
  corporateEmail?: string;
  companyName?: string;
  companyDomain?: string;
}

export interface EmployeeProgressRecord {
  id?: string;
  emp_id: string;
  repo: string;
  issue_no: string;
  status: 'in_progress' | 'submitted' | 'completed';
  pr_id?: string;
  xp_awarded?: number;
  completed_at?: string;
}

export interface DepartmentRole {
  id: string;
  title: string;
  level: string;
  desc: string;
  tags: string[];
  manager: {
    name: string;
    title: string;
    initials: string;
    quote: string;
  };
  teammates: Array<{
    name: string;
    role: string;
    avatar: string;
  }>;
  problems: ProblemIssue[];
}

export interface ProblemIssue {
  s_no: string;
  issue_no: string;
  level: string;
  role: string;
  repo: string;
  url: string;
  role_heading?: string;
}

export function taskItemToProblemIssue(task: TaskItem): ProblemIssue {
  let issueNo = task.issueNo || '';
  if (!issueNo || issueNo.startsWith('#T-') || issueNo.startsWith('T-')) {
    const match = task.title.match(/\[#?(\d+)\]/);
    if (match) {
      issueNo = match[1];
    } else {
      issueNo = task.issueNo?.replace(/^#/, '') || '41';
    }
  } else {
    issueNo = issueNo.replace(/^#/, '');
  }

  let repo = task.repo || 'enterprise-core';
  const inRepoMatch = (task.description || '').match(/in\s+([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/i) || 
                      (task.title || '').match(/in\s+([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/i);
  if (inRepoMatch) {
    repo = inRepoMatch[1];
  } else {
    const titleParenMatch = task.title.match(/\(([^)]+)\)$/);
    if (titleParenMatch && (!task.repo || task.repo === 'enterprise-core')) {
      repo = titleParenMatch[1].includes('/') ? titleParenMatch[1] : `Dezenix/${titleParenMatch[1]}`;
    }
  }
  // Sanitize repo string (remove trailing dots, slashes, punctuation, whitespace)
  repo = repo.replace(/[./\s]+$/, '').trim();

  let level = 'Medium';
  const levelMatch = task.title.match(/·\s*(Easy|Medium|Hard)/i);
  if (levelMatch) {
    level = levelMatch[1].charAt(0).toUpperCase() + levelMatch[1].slice(1).toLowerCase();
  } else if (task.priority === 'critical') {
    level = 'Hard';
  } else if (task.priority === 'high') {
    level = 'Medium';
  } else if (task.priority === 'low') {
    level = 'Easy';
  }

  let role = task.title;
  const roleMatch = task.title.match(/\[#\d+\]\s*([^·]+)/);
  if (roleMatch) {
    role = roleMatch[1].trim();
  }

  return {
    s_no: task.id,
    issue_no: issueNo,
    level,
    role,
    repo,
    url: repo && issueNo ? `https://github.com/${repo}/issues/${issueNo}` : 'https://github.com',
    role_heading: task.title
  };
}


export interface Repository {
  repo: string;
  name: string;
  desc: string;
  tags: string[];
  stars: string;
  forks: string;
  url: string;
  issues: ProblemIssue[];
}

export interface PullRequest {
  id: string;
  s_no: string;
  issue_no: string;
  repo: string;
  title: string;
  author: string;
  authorRole: string;
  authorDept: string;
  status: 'pending_review' | 'approved_merged' | 'changes_requested';
  submissionType: 'monaco' | 'zip';
  codePatch?: string;
  originalCode?: string;
  modifiedCode?: string;
  zipMeta?: {
    name: string;
    size: string;
    hash: string;
  };
  createdAt: string;
  reviewFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface CalendarEvent {
  id: string;
  start: string;
  dur: string;
  title: string;
  badge?: string;
  isLive?: boolean;
  synced?: boolean;
  desc: string;
  loc: string;
  link?: string;
  platform?: 'google_meet' | 'zoom' | 'teams';
  actionText?: string;
  actionTarget?: 'meetings' | 'manager' | null;
}

export interface MeetingItem {
  id: string;
  title: string;
  type: 'standup' | 'one_on_one' | 'refinement' | 'custom';
  platform: 'google_meet' | 'zoom' | 'teams';
  link: string;
  meetingId: string;
  passcode?: string;
  hostName: string;
  hostTitle: string;
  hostInitials: string;
  scheduleTime: string;
  duration: string;
  isLive?: boolean;
  status: 'upcoming' | 'live' | 'completed';
  agenda: string[];
  attendees: string[];
}

export interface SquadMessage {
  id: string;
  author: string;
  role?: string;
  time: string;
  text: string;
  isUser?: boolean;
  isManager?: boolean;
}

