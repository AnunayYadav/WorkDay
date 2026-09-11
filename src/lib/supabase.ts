import { createClient } from '@supabase/supabase-js';
import type { PullRequest, EmployeeState, ProblemIssue, EmployeeProgressRecord } from '../types';
import { PROBLEMS_DATASET, ALL_REPOSITORIES } from './dataset';

// Detect Supabase credentials from .env or persistent user configuration
function resolveSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

  let localUrl = '';
  let localKey = '';
  try {
    localUrl = localStorage.getItem('vhq_supabase_url') || '';
    localKey = localStorage.getItem('vhq_supabase_key') || '';
  } catch (_) {}

  const url = (envUrl || localUrl || '').trim();
  const key = (envKey || localKey || '').trim();

  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('xyzcompany') &&
    !key.includes('dummy') &&
    !key.includes('placeholder')
  );

  return { url, key, isConfigured };
}

let activeConfig = resolveSupabaseConfig();

export let isSupabaseConfigured = activeConfig.isConfigured;
export let supabase = createClient(
  activeConfig.url || 'https://placeholder.supabase.co',
  activeConfig.key || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

export function updateSupabaseConfig(url: string, key: string) {
  try {
    localStorage.setItem('vhq_supabase_url', url.trim());
    localStorage.setItem('vhq_supabase_key', key.trim());
  } catch (_) {}
  activeConfig = { url: url.trim(), key: key.trim(), isConfigured: true };
  isSupabaseConfigured = true;
  supabase = createClient(url.trim(), key.trim(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
}

/**
 * Supabase Authentication Service (GitHub OAuth & Enterprise Credentials)
 */
export const AuthService = {
  async signInWithGitHub(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
    }
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) return { success: false, error: error.message };
      if (data?.url) {
        window.location.href = data.url;
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'OAuth failure' };
    }
  },

  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase project credentials are not configured.' };
    }
    try {
      let targetEmail = email.trim().toLowerCase();

      // Check if user entered their company-allotted corporate email or handle (e.g. jordan.hayes@virtualhq.corp or @username)
      if (targetEmail.includes('@virtualhq.') || !targetEmail.includes('@')) {
        const cleanHandle = targetEmail.replace(/^@/, '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .or(`corporate_email.eq.${targetEmail},handle.eq.${cleanHandle}`)
          .maybeSingle();

        if (profile?.email) {
          targetEmail = profile.email;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: targetEmail, password });
      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Incorrect email or password, or this account is not registered yet. Please check your credentials or switch to Register.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Please confirm your email address before signing in, or disable email confirmation in Supabase settings.';
        }
        return { success: false, error: msg };
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to authentication service.' };
    }
  },

  async signUpWithEmail(
    email: string, 
    password: string, 
    fullName: string,
    githubUsername?: string
  ): Promise<{ success: boolean; error?: string; user?: any; corporateEmail?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase project credentials are not configured.' };
    }
    try {
      const cleanGh = (githubUsername || '').trim().replace(/^@/, '');
      const avatarUrl = cleanGh ? `https://github.com/${cleanGh}.png` : '';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            github_username: cleanGh,
            avatar_url: avatarUrl
          }
        }
      });
      if (error) {
        let msg = error.message;
        if (msg.includes('User already registered')) {
          msg = 'An account with this email already exists. Please switch to Sign In.';
        } else if (msg.includes('Password should be at least')) {
          msg = 'Password must be at least 6 characters long.';
        }
        return { success: false, error: msg };
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration service unavailable.' };
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    try {
      localStorage.removeItem('vhq_active_emp');
      sessionStorage.removeItem('vhq_active_emp');
      localStorage.removeItem('vhq_active_session_v3');
      localStorage.removeItem('vhq_scratchpad');
    } catch (_) {}
  },

  async getSession() {
    if (!isSupabaseConfigured) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch (e) {
      return null;
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  }
};

/**
 * Cloud Storage & Realtime Synchronization Service
 * Direct bidirectional Supabase database integration
 */
export const CloudStorage = {
  async saveEmployee(data: EmployeeState): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const effectiveUserId = data.userId || user?.id;

        const { error } = await supabase.from('profiles').upsert({
          user_id: effectiveUserId,
          emp_id: data.empId,
          full_name: data.fullName,
          preferred_name: data.preferredName,
          handle: data.handle,
          department: data.department,
          role_title: data.selectedRole?.title,
          role_level: data.selectedRole?.level,
          is_signed: data.isSigned,
          signature_url: data.signatureDataUrl,
          auth_provider: data.authProvider || 'email',
          avatar_url: data.avatarUrl || '',
          email: data.email || user?.email || '',
          corporate_email: data.corporateEmail || '',
          github_username: data.githubUsername || data.handle || '',
          total_xp: data.totalXp || 200,
          updated_at: new Date().toISOString()
        }, { onConflict: 'emp_id' });

        if (error) {
          console.error('[Supabase Cloud] Error upserting employee profile:', error.message);
        }
      } catch (e) {
        console.error('[Supabase Cloud] Profile sync error:', e);
      }
    }

    try {
      localStorage.setItem('vhq_active_emp', JSON.stringify(data));
      sessionStorage.setItem('vhq_active_emp', JSON.stringify(data));
    } catch (_) {}
    return true;
  },

  /**
   * Fetch authenticated employee profile directly from Supabase.
   * STRICT: Returns null if no active Supabase user session exists (NO dummy fallbacks).
   */
  async getEmployee(): Promise<EmployeeState | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // No authenticated session in Supabase — purge any stale local cache
        try {
          localStorage.removeItem('vhq_active_emp');
          sessionStorage.removeItem('vhq_active_emp');
        } catch (_) {}
        return null;
      }

      // Query live profile by user_id
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        const role = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering.find(r => r.title === data.role_title) 
          || PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0];

        const meta = user.user_metadata || {};
        const profileEmp: EmployeeState = {
          fullName: data.full_name,
          preferredName: data.preferred_name,
          handle: data.handle,
          empId: data.emp_id,
          department: data.department,
          selectedRole: role,
          signatureDataUrl: data.signature_url || '',
          isSigned: Boolean(data.is_signed),
          currentStep: data.is_signed ? 4 : 1,
          email: data.email || user.email,
          corporateEmail: data.corporate_email || meta.corporate_email || '',
          githubUsername: data.github_username || meta.github_username || data.handle || '',
          avatarUrl: data.avatar_url || meta.avatar_url || '',
          authProvider: data.auth_provider || 'email',
          userId: data.user_id,
          userType: 'employee',
          totalXp: data.total_xp || 200
        };

        try {
          localStorage.setItem('vhq_active_emp', JSON.stringify(profileEmp));
        } catch (_) {}
        return profileEmp;
      }
    } catch (e) {
      console.error('[Supabase Cloud] Error fetching user profile:', e);
    }

    return null;
  },

  async clearEmployee(): Promise<void> {
    try {
      localStorage.removeItem('vhq_active_emp');
      sessionStorage.removeItem('vhq_active_emp');
    } catch (_) {}
  },

  async savePullRequest(prData: PullRequest): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('pull_requests').upsert({
          id: prData.id,
          task_id: prData.s_no,
          issue_no: prData.issue_no,
          repo: prData.repo,
          title: prData.title,
          author: prData.author,
          author_role: prData.authorRole,
          author_dept: prData.authorDept,
          status: prData.status,
          code_patch: prData.codePatch,
          original_code: prData.originalCode || '',
          modified_code: prData.modifiedCode || prData.codePatch || '',
          submission_type: prData.submissionType || 'monaco',
          zip_meta: prData.zipMeta,
          review_feedback: prData.reviewFeedback,
          reviewed_by: prData.reviewedBy,
          reviewed_at: prData.reviewedAt,
          created_at: prData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (error) {
          console.error('[Supabase Cloud] Error saving PR:', error.message);
          return false;
        }
        return true;
      } catch (e) {
        console.error('[Supabase Cloud] PR sync error:', e);
      }
    }
    return true;
  },

  async listPullRequests(): Promise<PullRequest[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('pull_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(row => ({
            id: row.id,
            s_no: row.task_id,
            issue_no: row.issue_no,
            repo: row.repo,
            title: row.title,
            author: row.author,
            authorRole: row.author_role,
            authorDept: row.author_dept,
            status: row.status,
            codePatch: row.code_patch,
            originalCode: row.original_code,
            modifiedCode: row.modified_code,
            submissionType: row.submission_type,
            zipMeta: row.zip_meta,
            reviewFeedback: row.review_feedback,
            reviewedBy: row.reviewed_by,
            reviewedAt: row.reviewed_at,
            createdAt: row.created_at
          }));
        }
      } catch (e) {
        console.error('[Supabase Cloud] Error listing PRs:', e);
      }
    }
    return [];
  },

  async updatePullRequestStatus(prId: string, status: 'approved_merged' | 'changes_requested', feedback?: string) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('pull_requests').update({
          status,
          review_feedback: feedback,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', prId);

        if (error) {
          console.error('[Supabase Cloud] Error updating PR status:', error.message);
          return false;
        }
        return true;
      } catch (e) {
        console.error('[Supabase Cloud] PR update error:', e);
      }
    }
    return true;
  },

  /**
   * Fetch repositories live from Supabase (or fallback to local dataset)
   */
  async listRepositories(department: string = 'engineering'): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('repositories').select('*');
        if (department && department !== 'all') {
          query = query.eq('department', department);
        }
        const { data, error } = await query.order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(row => ({
            id: row.id,
            repo: row.id,
            name: row.name,
            owner: row.owner,
            url: row.url,
            desc: row.description || '',
            tags: Array.isArray(row.tags) ? row.tags : [],
            stars: String(row.stars || '128'),
            forks: String(row.forks || '45'),
            language: row.language || 'TypeScript',
            department: row.department || 'engineering',
            issues: []
          }));
        }
      } catch (e) {
        console.error('[Supabase Cloud] Error fetching repositories:', e);
      }
    }
    return ALL_REPOSITORIES;
  },

  /**
   * Fetch role-wise assigned problems live from Supabase
   */
  async listRoleProblems(roleTitle?: string, department: string = 'engineering'): Promise<ProblemIssue[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('role_problems').select('*');
        if (roleTitle) {
          query = query.ilike('role_title', `%${roleTitle.trim()}%`);
        } else if (department && department !== 'all') {
          query = query.eq('department', department);
        }

        const { data, error } = await query.order('s_no', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map(row => ({
            s_no: String(row.s_no),
            issue_no: row.issue_no,
            level: row.level,
            role: row.role_title,
            repo: row.repo,
            url: row.issue_url,
            role_heading: row.role_title
          }));
        }
      } catch (e) {
        console.error('[Supabase Cloud] Error fetching role problems:', e);
      }
    }

    // Fallback to local dataset if cloud is not yet seeded
    if (roleTitle) {
      for (const dept of Object.keys(PROBLEMS_DATASET.DEPARTMENT_ROLES)) {
        const roles = (PROBLEMS_DATASET.DEPARTMENT_ROLES as any)[dept];
        const match = roles.find((r: any) => r.title.toLowerCase().includes(roleTitle.toLowerCase()));
        if (match && match.problems) {
          return match.problems;
        }
      }
    }
    return [];
  },

  /**
   * Fetch employee's progress records from Supabase
   */
  async getEmployeeProgress(empId: string): Promise<EmployeeProgressRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('employee_progress')
          .select('*')
          .eq('emp_id', empId);

        if (!error && data) {
          return data.map(row => ({
            id: row.id,
            emp_id: row.emp_id,
            repo: row.repo,
            issue_no: row.issue_no,
            status: row.status,
            pr_id: row.pr_id,
            xp_awarded: row.xp_awarded,
            completed_at: row.completed_at
          }));
        }
      } catch (e) {
        console.error('[Supabase Cloud] Error fetching employee progress:', e);
      }
    }
    return [];
  },

  /**
   * Record task in-progress or submitted status
   */
  async recordTaskProgress(
    empId: string,
    repo: string,
    issueNo: string,
    status: 'in_progress' | 'submitted' | 'completed',
    prId?: string,
    xpEarned: number = 0
  ): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('employee_progress').upsert({
          emp_id: empId,
          repo,
          issue_no: issueNo,
          status,
          pr_id: prId || null,
          xp_awarded: xpEarned,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'emp_id,repo,issue_no' });
        return true;
      } catch (e) {
        console.error('[Supabase Cloud] Error recording task progress:', e);
      }
    }
    return true;
  },

  /**
   * Record task completion and sync XP directly to employee profile in Supabase
   */
  async recordTaskCompletion(empId: string, repo: string, issueNo: string, prId: string, xpEarned: number = 50): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        // 1. Upsert employee progress
        await supabase.from('employee_progress').upsert({
          emp_id: empId,
          repo,
          issue_no: issueNo,
          pr_id: prId,
          status: 'completed',
          xp_awarded: xpEarned,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'emp_id,repo,issue_no' });

        // 2. Fetch current profile XP and increment
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('emp_id', empId)
          .maybeSingle();

        const currentXp = profile?.total_xp || 200;
        await supabase
          .from('profiles')
          .update({
            total_xp: currentXp + xpEarned,
            updated_at: new Date().toISOString()
          })
          .eq('emp_id', empId);

        return true;
      } catch (e) {
        console.error('[Supabase Cloud] Error recording task completion:', e);
      }
    }
    return true;
  },

  /**
   * Subscribe to live Supabase Realtime progress updates for this employee
   */
  subscribeToEmployeeProgress(empId: string, onUpdate: (payload: any) => void) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };

    const channel = supabase
      .channel(`public:employee_progress:${empId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employee_progress',
        filter: `emp_id=eq.${empId}`
      }, payload => {
        onUpdate(payload);
      })
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  },

  /**
   * Subscribe to live Supabase Realtime changes across connected employees & managers
   */
  subscribeToPullRequests(onUpdate: (payload: any) => void) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };

    const channel = supabase
      .channel('public:pull_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pull_requests' }, payload => {
        onUpdate(payload);
      })
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};
