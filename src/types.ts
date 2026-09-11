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
  userType?: 'employee' | 'manager';
  totalXp?: number;
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
  actionText?: string;
  actionTarget?: 'meetings' | 'manager' | null;
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
