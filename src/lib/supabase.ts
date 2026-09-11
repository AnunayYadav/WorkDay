import { createClient } from '@supabase/supabase-js';
import type { PullRequest, EmployeeState, ProblemIssue, EmployeeProgressRecord } from '../types';
import { PROBLEMS_DATASET } from './dataset';

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
    // 1. Immediately cache in localStorage & sessionStorage so client state is instant and never lost
    try {
      localStorage.setItem('vhq_active_emp', JSON.stringify(data));
      sessionStorage.setItem('vhq_active_emp', JSON.stringify(data));
    } catch (_) {}

    if (isSupabaseConfigured) {
      try {
        let effectiveUserId = data.userId;
        let authEmail = data.email;

        if (!effectiveUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          effectiveUserId = user?.id;
          authEmail = authEmail || user?.email;
        }

        if (!effectiveUserId) {
          const { data: { session } } = await supabase.auth.getSession();
          effectiveUserId = session?.user?.id;
          authEmail = authEmail || session?.user?.email;
        }

        if (effectiveUserId) {
          const profilePayload = {
            user_id: effectiveUserId,
            emp_id: data.empId || `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
            full_name: data.fullName || 'Engineering Recruit',
            preferred_name: data.preferredName || (data.fullName ? data.fullName.split(' ')[0] : 'Engineer'),
            handle: data.handle || 'engineer',
            department: data.department || 'engineering',
            role_title: data.selectedRole?.title || 'Frontend Developer (Junior)',
            role_level: data.selectedRole?.level || 'LEVEL 1 · JUNIOR',
            is_signed: Boolean(data.isSigned),
            signature_url: data.signatureDataUrl || '',
            auth_provider: data.authProvider || 'email',
            avatar_url: data.avatarUrl || '',
            email: authEmail || data.email || '',
            corporate_email: data.corporateEmail || `${data.handle || 'engineer'}@virtualhq.corp`,
            github_username: data.githubUsername || data.handle || '',
            total_xp: data.totalXp ?? 200,
            updated_at: new Date().toISOString()
          };

          // 1. Try updating existing row by user_id
          const { data: updatedRows, error: updateErr } = await supabase
            .from('profiles')
            .update(profilePayload)
            .eq('user_id', effectiveUserId)
            .select();

          let success = !updateErr && Boolean(updatedRows && updatedRows.length > 0);

          if (updateErr) {
            console.warn('[Supabase Cloud] Full profile update failed:', updateErr.message, '- attempting core update');
            const corePayload = {
              user_id: effectiveUserId,
              full_name: profilePayload.full_name,
              handle: profilePayload.handle,
              department: profilePayload.department,
              role_title: profilePayload.role_title,
              is_signed: profilePayload.is_signed,
              signature_url: profilePayload.signature_url,
              updated_at: profilePayload.updated_at
            };
            const { error: coreErr } = await supabase
              .from('profiles')
              .update(corePayload)
              .eq('user_id', effectiveUserId);

            if (!coreErr) {
              success = true;
            }
          }

          // 2. If no existing row updated, insert new profile
          if (!success) {
            const { error: insertErr } = await supabase
              .from('profiles')
              .insert(profilePayload);

            if (insertErr) {
              console.warn('[Supabase Cloud] Insert retry with upsert:', insertErr.message);
              await supabase.from('profiles').upsert(profilePayload, { onConflict: 'user_id' });
            }
          }
        }
      } catch (e) {
        console.error('[Supabase Cloud] Profile sync error:', e);
      }
    }

    return true;
  },

  /**
   * Fetch authenticated employee profile directly from Supabase.
   * STRICT: Returns null if no active Supabase user session exists.
   * Resolves roles dynamically across all department tracks.
   */
  async getEmployee(): Promise<EmployeeState | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        try {
          localStorage.removeItem('vhq_active_emp');
          sessionStorage.removeItem('vhq_active_emp');
        } catch (_) {}
        return null;
      }

      // Query live profiles ordered by latest update (avoids single/maybeSingle multi-row crash)
      const { data: rows, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[Supabase Cloud] Error fetching user profile:', error.message);
      }

      if (rows && rows.length > 0) {
        const data = rows[0];

        // Clean up redundant duplicate rows if any exist
        if (rows.length > 1) {
          const duplicateIds = rows.slice(1).map(r => r.id);
          supabase.from('profiles').delete().in('id', duplicateIds).then(() => {});
        }

        // Dynamically find role across all departments (engineering, infrastructure, data, product)
        const deptKey = (data.department && data.department in PROBLEMS_DATASET.DEPARTMENT_ROLES)
          ? (data.department as keyof typeof PROBLEMS_DATASET.DEPARTMENT_ROLES)
          : 'engineering';
        const deptRoles = (PROBLEMS_DATASET.DEPARTMENT_ROLES as any)[deptKey] || PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering;
        const allRoles = Object.values(PROBLEMS_DATASET.DEPARTMENT_ROLES).flat() as any[];

        const role = deptRoles.find((r: any) => r.title === data.role_title)
          || allRoles.find((r: any) => r.title === data.role_title)
          || deptRoles[0];

        let isSignedVal = Boolean(data.is_signed);
        let sigUrl = data.signature_url || '';

        // Check local cache: if user completed onboarding in browser but cloud is lagging, preserve isSigned
        try {
          const cachedStr = localStorage.getItem('vhq_active_emp');
          if (cachedStr) {
            const cached = JSON.parse(cachedStr) as EmployeeState;
            if (cached && cached.isSigned && !isSignedVal) {
              isSignedVal = true;
              sigUrl = sigUrl || cached.signatureDataUrl;
              // Sync back to Supabase
              supabase.from('profiles').update({
                is_signed: true,
                signature_url: sigUrl,
                updated_at: new Date().toISOString()
              }).eq('user_id', user.id).then(() => {});
            }
          }
        } catch (_) {}

        const meta = user.user_metadata || {};
        const profileEmp: EmployeeState = {
          fullName: data.full_name || meta.full_name || meta.name || 'Engineering Recruit',
          preferredName: data.preferred_name || (data.full_name ? data.full_name.split(' ')[0] : 'Engineer'),
          handle: data.handle || meta.user_name || 'engineer',
          empId: data.emp_id,
          department: data.department || deptKey,
          selectedRole: role,
          signatureDataUrl: sigUrl,
          isSigned: isSignedVal,
          currentStep: isSignedVal ? 5 : (data.current_step || 1),
          email: data.email || user.email,
          corporateEmail: data.corporate_email || meta.corporate_email || `${data.handle || 'engineer'}@virtualhq.corp`,
          githubUsername: data.github_username || meta.github_username || data.handle || '',
          avatarUrl: data.avatar_url || meta.avatar_url || (data.github_username ? `https://github.com/${data.github_username}.png` : ''),
          authProvider: data.auth_provider || (user.app_metadata?.provider as any) || 'email',
          userId: data.user_id,
          userType: 'employee',
          totalXp: data.total_xp ?? 200
        };

        try {
          localStorage.setItem('vhq_active_emp', JSON.stringify(profileEmp));
          sessionStorage.setItem('vhq_active_emp', JSON.stringify(profileEmp));
        } catch (_) {}
        return profileEmp;
      }
    } catch (e) {
      console.error('[Supabase Cloud] Error fetching user profile:', e);
    }

    // Check if valid cached state exists for current user
    try {
      const cachedStr = localStorage.getItem('vhq_active_emp');
      if (cachedStr) {
        const cached = JSON.parse(cachedStr) as EmployeeState;
        const { data: { user } } = await supabase.auth.getUser();
        if (user && (cached.userId === user.id || cached.email === user.email || !cached.userId)) {
          cached.userId = user.id;
          cached.email = cached.email || user.email;
          return cached;
        }
      }
    } catch (_) {}

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

  async listProfiles(): Promise<EmployeeState[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const allRoles = Object.values(PROBLEMS_DATASET.DEPARTMENT_ROLES).flat() as any[];
          return data.map((row: any) => {
            const role = allRoles.find((r: any) => r.title === row.role_title) || allRoles[0];
            return {
              fullName: row.full_name,
              preferredName: row.preferred_name,
              handle: row.handle,
              empId: row.emp_id,
              department: row.department,
              selectedRole: role,
              signatureDataUrl: row.signature_url || '',
              isSigned: Boolean(row.is_signed),
              currentStep: 5,
              email: row.email,
              corporateEmail: row.corporate_email || `${row.handle}@virtualhq.corp`,
              githubUsername: row.github_username,
              avatarUrl: row.avatar_url || (row.github_username ? `https://github.com/${row.github_username}.png` : ''),
              authProvider: row.auth_provider,
              userId: row.user_id,
              userType: 'employee',
              totalXp: row.total_xp || 200
            };
          });
        }
      } catch (e) {
        console.error('[Supabase Cloud] Error listing profiles:', e);
      }
    }
    return [];
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
   * Fetch repositories live from Supabase (returns [] if none registered)
   */
  async listRepositories(department: string = 'engineering'): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('repositories').select('*');
        if (department && department !== 'all') {
          query = query.eq('department', department);
        }
        const { data, error } = await query.order('name', { ascending: true });

        if (!error && data) {
          return data.map(row => ({
            id: row.id,
            repo: row.id,
            name: row.name,
            owner: row.owner || row.id.split('/')[0] || 'VirtualHQ',
            url: row.url || `https://github.com/${row.id}`,
            desc: row.description || '',
            tags: Array.isArray(row.tags) ? row.tags : [],
            stars: String(row.stars || '0'),
            forks: String(row.forks || '0'),
            language: row.language || 'TypeScript',
            department: row.department || 'engineering',
            issues: Array.isArray(row.issues) ? row.issues : []
          }));
        }
      } catch (e) {
        console.error('[Supabase Cloud] Error fetching repositories:', e);
      }
    }
    // Try user-scoped localStorage fallback cache
    try {
      const cached = localStorage.getItem('vhq_custom_repos');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_) {}
    return [];
  },

  /**
   * Register a new repository directly in Supabase
   */
  async createRepository(repo: any): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('repositories').upsert({
          id: repo.id || repo.repo,
          name: repo.name,
          owner: repo.owner || repo.repo.split('/')[0] || 'VirtualHQ',
          url: repo.url,
          description: repo.desc || repo.description || '',
          tags: repo.tags || [],
          stars: Number(repo.stars || 0),
          forks: Number(repo.forks || 0),
          language: repo.language || 'TypeScript',
          department: repo.department || 'engineering',
          created_at: new Date().toISOString()
        });

        if (error) {
          console.warn('[Supabase Cloud] Could not save repository to table (may need table creation):', error.message);
        } else {
          return true;
        }
      } catch (e) {
        console.error('[Supabase Cloud] Repo save exception:', e);
      }
    }

    // Persist in local storage cache
    try {
      const existingStr = localStorage.getItem('vhq_custom_repos');
      const list = existingStr ? JSON.parse(existingStr) : [];
      list.push(repo);
      localStorage.setItem('vhq_custom_repos', JSON.stringify(list));
    } catch (_) {}
    return true;
  },

  /**
   * Fetch role-wise assigned problems live from Supabase (returns [] if none)
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
  },

  /**
   * Real Meetings Service connected to Supabase
   */
  async listMeetings(empId: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('emp_id', empId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (_) {}
    }

    try {
      const stored = localStorage.getItem(`vhq_meetings_${empId}`);
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    return [];
  },

  async createMeeting(meeting: any): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('meetings').insert({
          id: meeting.id,
          emp_id: meeting.empId,
          title: meeting.title,
          type: meeting.type || 'standup',
          platform: meeting.platform || 'google_meet',
          link: meeting.link,
          meeting_id: meeting.meetingId || '',
          passcode: meeting.passcode || '',
          host_name: meeting.hostName,
          host_title: meeting.hostTitle || '',
          host_initials: meeting.hostInitials || '',
          schedule_time: meeting.scheduleTime,
          duration: meeting.duration || '30 mins',
          status: meeting.status || 'upcoming',
          agenda: meeting.agenda || [],
          attendees: meeting.attendees || []
        });
        if (!error) return true;
      } catch (_) {}
    }

    try {
      const key = `vhq_meetings_${meeting.empId}`;
      const stored = localStorage.getItem(key);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(meeting);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) {}

    return true;
  },

  async deleteMeeting(empId: string, meetingId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('meetings').delete().eq('id', meetingId);
      } catch (_) {}
    }
    try {
      const key = `vhq_meetings_${empId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const list = JSON.parse(stored).filter((m: any) => m.id !== meetingId);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (_) {}
    return true;
  },

  /**
   * Real Messages Service connected to Supabase
   */
  async listMessages(empId: string, threadId: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('emp_id', empId)
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data;
        }
      } catch (_) {}
    }

    try {
      const key = `vhq_messages_${empId}_${threadId}`;
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    return [];
  },

  async sendMessage(empId: string, threadId: string, msg: any): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('messages').insert({
          id: msg.id,
          emp_id: empId,
          thread_id: threadId,
          sender_name: msg.sender,
          text: msg.text,
          is_me: msg.isMe,
          created_at: new Date().toISOString()
        });
        if (!error) return true;
      } catch (_) {}
    }

    try {
      const key = `vhq_messages_${empId}_${threadId}`;
      const stored = localStorage.getItem(key);
      const list = stored ? JSON.parse(stored) : [];
      list.push(msg);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) {}

    return true;
  },

  /**
   * Real Team Community Feed connected to Supabase
   */
  async listTeamPosts(): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('team_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (_) {}
    }

    try {
      const stored = localStorage.getItem('vhq_team_posts');
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    return [];
  },

  async createTeamPost(post: any): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('team_posts').insert({
          id: post.id,
          author_name: post.name,
          author_avatar: post.avatar,
          author_role: post.role || '',
          content: post.content,
          reactions: post.reactions || { likes: 0 }
        });
        if (!error) return true;
      } catch (_) {}
    }

    try {
      const stored = localStorage.getItem('vhq_team_posts');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(post);
      localStorage.setItem('vhq_team_posts', JSON.stringify(list));
    } catch (_) {}

    return true;
  }
};
