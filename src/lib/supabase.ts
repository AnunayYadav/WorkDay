import { createClient } from '@supabase/supabase-js';
import type { PullRequest, EmployeeState, ProblemIssue, EmployeeProgressRecord } from '../types';
import { PROBLEMS_DATASET, ALL_REPOSITORIES } from './dataset';

// Supabase Modern API Connection Credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY 
  || import.meta.env.VITE_SUPABASE_ANON_KEY 
  || 'sb_publishable_dummy_key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)
);

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Supabase Authentication Service (GitHub OAuth & Enterprise Credentials)
 */
export const AuthService = {
  async signInWithGitHub(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'OAuth failure' };
    }
  },

  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async signUpWithEmail(email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string; user?: any }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message };
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
    sessionStorage.removeItem('vhq_active_emp');
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
    // Save to Supabase profiles table
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('profiles').upsert({
          emp_id: data.empId,
          full_name: data.fullName,
          preferred_name: data.preferredName,
          handle: data.handle,
          department: data.department,
          role_title: data.selectedRole?.title,
          role_level: data.selectedRole?.level,
          is_signed: data.isSigned,
          signature_url: data.signatureDataUrl,
          auth_provider: data.authProvider || 'github',
          avatar_url: data.avatarUrl || '',
          email: data.email || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'emp_id' });

        if (error) {
          console.error('[Supabase Cloud] Error upserting employee profile:', error.message);
        }
      } catch (e) {
        console.error('[Supabase Cloud] Profile sync error:', e);
      }
    }

    // Keep active session in memory/sessionStorage for instant page hydration
    sessionStorage.setItem('vhq_active_emp', JSON.stringify(data));
    return true;
  },

  async getEmployee(): Promise<EmployeeState | null> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {
            const role = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering.find(r => r.title === data.role_title) 
              || PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0];

            return {
              fullName: data.full_name,
              preferredName: data.preferred_name,
              handle: data.handle,
              empId: data.emp_id,
              department: data.department,
              selectedRole: role,
              signatureDataUrl: data.signature_url || '',
              isSigned: data.is_signed,
              currentStep: 4,
              email: data.email,
              avatarUrl: data.avatar_url,
              authProvider: data.auth_provider,
              userId: data.user_id,
              userType: 'employee',
              totalXp: data.total_xp || 200
            };
          }
        }
      } catch (e) {
        console.error('[Supabase Cloud] Error fetching user profile:', e);
      }
    }

    // Active session check
    const raw = sessionStorage.getItem('vhq_active_emp');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isSupabaseConfigured && parsed?.empId) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('emp_id', parsed.empId)
            .maybeSingle();
          if (data?.total_xp) {
            parsed.totalXp = data.total_xp;
          }
        } catch (_) {}
      }
      return parsed;
    }
    return null;
  },

  async clearEmployee(): Promise<void> {
    sessionStorage.removeItem('vhq_active_emp');
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
          modified_code: prData.codePatch,
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
