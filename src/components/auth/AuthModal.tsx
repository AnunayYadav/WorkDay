import React, { useState } from 'react';
import { AuthService, isSupabaseConfigured, updateSupabaseConfig, CloudStorage } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import type { EmployeeState } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (employee: EmployeeState) => void;
  isForOnboarding?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  isForOnboarding: _isForOnboarding = false
}) => {
  const { showToast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Supabase Configuration State (if not configured in .env)
  const [showConfig, setShowConfig] = useState(!isSupabaseConfigured);
  const [configUrl, setConfigUrl] = useState(
    () => localStorage.getItem('vhq_supabase_url') || ''
  );
  const [configKey, setConfigKey] = useState(
    () => localStorage.getItem('vhq_supabase_key') || ''
  );

  if (!isOpen) return null;

  const handleSaveConfigAndAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = configUrl.trim();
    const cleanKey = configKey.trim();

    if (!cleanUrl || !cleanKey) {
      showToast({
        title: 'Credentials Required',
        message: 'Please provide both your Supabase URL and Publishable API Key.',
        type: 'warning'
      });
      return;
    }

    if (!cleanUrl.startsWith('https://')) {
      showToast({
        title: 'Invalid URL',
        message: 'Project URL must start with https:// (e.g. https://your-id.supabase.co)',
        type: 'warning'
      });
      return;
    }

    updateSupabaseConfig(cleanUrl, cleanKey);
    setShowConfig(false);
    showToast({
      title: 'Supabase Connected',
      message: 'Credentials updated. You can now sign in or register.',
      type: 'success'
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!isSupabaseConfigured) {
      setShowConfig(true);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setAuthError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    if (isSignUp) {
      const cleanGh = githubUsername.trim().replace(/^@/, '') || email.split('@')[0];
      const res = await AuthService.signUpWithEmail(email, password, fullName || cleanGh, cleanGh);
      setLoading(false);
      if (res.success && res.user) {
        const user = res.user;
        const name = fullName.trim() || cleanGh;
        const newEmp: EmployeeState = {
          fullName: name,
          preferredName: name.split(' ')[0],
          handle: cleanGh.toLowerCase(),
          githubUsername: cleanGh,
          avatarUrl: `https://github.com/${cleanGh}.png`,
          empId: `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
          department: 'engineering',
          selectedRole: undefined as any,
          signatureDataUrl: '',
          isSigned: false,
          currentStep: 1,
          email: user.email,
          authProvider: 'email',
          userId: user.id,
          userType: 'employee'
        };
        await CloudStorage.saveEmployee(newEmp);
        onAuthenticated(newEmp);
        onClose();
        showToast({
          title: 'Account Created',
          message: `Welcome, ${newEmp.preferredName}! Proceeding to official corporate onboarding.`,
          type: 'success'
        });
      } else {
        const errMsg = res.error || 'Could not register user. Please check your credentials and try again.';
        setAuthError(errMsg);
        showToast({ title: 'Sign Up Failed', message: errMsg, type: 'error' });
      }
    } else {
      const res = await AuthService.signInWithEmail(email, password);
      setLoading(false);
      if (res.success && res.user) {
        const user = res.user;
        // Fetch existing profile from Supabase
        const existing = await CloudStorage.getEmployee();
        if (existing) {
          onAuthenticated(existing);
        } else {
          const meta = user.user_metadata || {};
          const name = meta.full_name || email.split('@')[0];
          const gh = meta.github_username || email.split('@')[0];
          const newEmp: EmployeeState = {
            fullName: name,
            preferredName: name.split(' ')[0],
            handle: gh.toLowerCase(),
            githubUsername: gh,
            avatarUrl: meta.avatar_url || `https://github.com/${gh}.png`,
            corporateEmail: meta.corporate_email || `${gh.toLowerCase()}@virtualhq.corp`,
            empId: `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
            department: 'engineering',
            selectedRole: undefined as any,
            signatureDataUrl: '',
            isSigned: false,
            currentStep: 1,
            email: user.email,
            authProvider: 'email',
            userId: user.id,
            userType: 'employee'
          };
          onAuthenticated(newEmp);
        }
        onClose();
        showToast({ title: 'Authenticated', message: 'Signed in successfully with Supabase.', type: 'success' });
      } else {
        const errMsg = res.error || 'Invalid credentials in Supabase Auth.';
        setAuthError(errMsg);
        showToast({ title: 'Sign In Failed', message: errMsg, type: 'error' });
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        padding: '1.25rem'
      }}
    >
      <div
        style={{
          width: '420px',
          maxWidth: '100%',
          background: 'rgba(22, 22, 26, 0.88)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          padding: '2.25rem 2rem 2rem',
          position: 'relative',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        }}
      >
        {/* Apple Style Round Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#a1a1aa';
          }}
        >
          ✕
        </button>

        {/* 1. Supabase Project Setup View (when URL or Key is missing) */}
        {showConfig ? (
          <form onSubmit={handleSaveConfigAndAuth}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  margin: '0 auto 0.85rem',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.025em', color: '#ffffff', margin: 0 }}>
                Connect Supabase Project
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#8e8e93', margin: '0.4rem auto 0', lineHeight: 1.45 }}>
                Enter your Supabase credentials from your Dashboard to enable real database syncing and GitHub OAuth.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#8e8e93', marginBottom: '0.35rem', fontWeight: 500 }}>
                  PROJECT URL
                </label>
                <input
                  type="url"
                  required
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#8e8e93', marginBottom: '0.35rem', fontWeight: 500 }}>
                  PUBLISHABLE / ANON API KEY
                </label>
                <input
                  type="text"
                  required
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  placeholder="sb_publishable_... or eyJhbGciOi..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.85rem',
                background: '#ffffff',
                border: 'none',
                color: '#000000',
                borderRadius: '980px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Save &amp; Continue with GitHub
            </button>

            {isSupabaseConfigured && (
              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8e8e93',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Cancel &amp; return to sign-in
                </button>
              </div>
            )}
          </form>
        ) : (
          /* 2. Standard Apple Minimal Authentication View */
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.025em', color: '#ffffff', margin: 0 }}>
                {isSignUp ? 'Student Registration' : 'Sign In'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#8e8e93', margin: '0.4rem auto 0', maxWidth: '340px', lineHeight: 1.45 }}>
                {isSignUp 
                  ? 'Register with your student / personal email and GitHub handle to begin your corporate onboarding.'
                  : 'Access your desk with your email or company-allotted @virtualhq.corp address.'}
              </p>
            </div>

            {/* User-facing error callout */}
            {authError && (
              <div style={{
                padding: '0.75rem 0.95rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem'
              }}>
                <span style={{ fontSize: '14px', lineHeight: 1, marginTop: '2px' }}>⚠️</span>
                <div style={{ flex: 1, fontSize: '0.78rem', color: '#fca5a5', lineHeight: 1.45 }}>
                  {authError}
                </div>
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Email & GitHub Handle Authentication Form */}
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {isSignUp && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#8e8e93', marginBottom: '0.35rem', fontWeight: 500 }}>
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (authError) setAuthError(null);
                      }}
                      placeholder="e.g. Jordan Hayes"
                      style={{
                        width: '100%',
                        padding: '0.7rem 0.85rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 500 }}>
                        GitHub Username
                      </label>
                      <span style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>Syncs avatar &amp; repos</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a', fontSize: '0.85rem' }}>@</span>
                      <input
                        type="text"
                        required
                        value={githubUsername}
                        onChange={(e) => {
                          setGithubUsername(e.target.value);
                          if (authError) setAuthError(null);
                        }}
                        placeholder="your-github-username"
                        style={{
                          width: '100%',
                          padding: '0.7rem 0.85rem 0.7rem 1.85rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 500 }}>
                    {isSignUp ? 'Personal / College Email' : 'Email Address'}
                  </label>
                  {isSignUp && (
                    <span style={{ fontSize: '0.66rem', color: '#a1a1aa' }}>e.g. gmail.com or college.edu</span>
                  )}
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder={isSignUp ? "e.g. yourname@gmail.com or student@college.edu" : "your.email@gmail.com or name@virtualhq.corp"}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#8e8e93', marginBottom: '0.35rem', fontWeight: 500 }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  marginTop: '0.4rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'opacity 0.2s ease, transform 0.1s ease',
                  boxShadow: '0 4px 14px rgba(255, 255, 255, 0.12)'
                }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                    </svg>
                    <span>Verifying with Supabase...</span>
                  </>
                ) : (
                  isSignUp ? 'Create Student Account →' : 'Sign In to Workspace →'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setAuthError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8e8e93',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Register with student email'}
                </button>
              </div>
            </form>

            {/* Subtle Supabase Settings Link */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>⚙ Configure Supabase Project Keys</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
