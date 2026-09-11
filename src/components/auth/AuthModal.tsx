import React, { useState } from 'react';
import { AuthService, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import type { EmployeeState } from '../../types';
import { PROBLEMS_DATASET } from '../../lib/dataset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (employee: EmployeeState) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'github' | 'email'>('github');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedGithubHandle, setSimulatedGithubHandle] = useState('');

  if (!isOpen) return null;

  const handleGitHubAuth = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      const res = await AuthService.signInWithGitHub();
      if (!res.success) {
        showToast({
          title: 'GitHub Authentication Error',
          message: res.error || 'Failed to initiate GitHub OAuth.',
          type: 'error'
        });
        setLoading(false);
      }
      return;
    }

    // Supabase not yet configured -> Seamless Local GitHub Simulation
    const handle = simulatedGithubHandle.trim() || 'github_engineer';
    const cleanName = handle.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    // Pick default role
    const defaultRole = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0];
    const newEmp: EmployeeState = {
      fullName: cleanName || 'GitHub Engineer',
      preferredName: (cleanName || 'Engineer').split(' ')[0],
      handle: handle.toLowerCase(),
      empId: `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
      department: 'engineering',
      selectedRole: defaultRole,
      signatureDataUrl: '',
      isSigned: true,
      currentStep: 4,
      email: `${handle.toLowerCase()}@github.com`,
      avatarUrl: `https://github.com/${handle}.png`,
      authProvider: 'github',
      userType: 'employee'
    };

    setTimeout(() => {
      setLoading(false);
      onAuthenticated(newEmp);
      onClose();
      showToast({
        title: 'Signed in with GitHub',
        message: `Welcome aboard, ${newEmp.fullName}! Verified as VirtualHQ Engineer.`,
        type: 'success'
      });
    }, 450);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast({ title: 'Fields Required', message: 'Please enter both email and password.', type: 'warning' });
      return;
    }

    setLoading(true);
    if (isSupabaseConfigured) {
      if (isSignUp) {
        const res = await AuthService.signUpWithEmail(email, password, fullName || 'Engineering Recruit');
        setLoading(false);
        if (res.success) {
          showToast({
            title: 'Account Created',
            message: 'Please check your inbox or sign in to proceed.',
            type: 'success'
          });
          setIsSignUp(false);
        } else {
          showToast({ title: 'Sign Up Failed', message: res.error || 'Could not register.', type: 'error' });
        }
      } else {
        const res = await AuthService.signInWithEmail(email, password);
        setLoading(false);
        if (res.success) {
          const defaultRole = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0];
          const name = res.user?.user_metadata?.full_name || email.split('@')[0];
          const newEmp: EmployeeState = {
            fullName: name,
            preferredName: name.split(' ')[0],
            handle: email.split('@')[0].toLowerCase(),
            empId: `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
            department: 'engineering',
            selectedRole: defaultRole,
            signatureDataUrl: '',
            isSigned: true,
            currentStep: 4,
            email: email,
            authProvider: 'email',
            userId: res.user?.id
          };
          onAuthenticated(newEmp);
          onClose();
          showToast({ title: 'Authenticated', message: `Welcome back, ${newEmp.preferredName}!`, type: 'success' });
        } else {
          showToast({ title: 'Authentication Failed', message: res.error || 'Invalid credentials.', type: 'error' });
        }
      }
      return;
    }

    // Local Fallback Simulation
    setTimeout(() => {
      setLoading(false);
      const name = fullName.trim() || email.split('@')[0];
      const defaultRole = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0];
      const newEmp: EmployeeState = {
        fullName: name,
        preferredName: name.split(' ')[0],
        handle: email.split('@')[0].toLowerCase(),
        empId: `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'engineering',
        selectedRole: defaultRole,
        signatureDataUrl: '',
        isSigned: true,
        currentStep: 4,
        email: email,
        authProvider: 'email',
        userType: 'employee'
      };
      onAuthenticated(newEmp);
      onClose();
      showToast({
        title: isSignUp ? 'Registration Verified' : 'Authentication Successful',
        message: `Welcome to VirtualHQ, ${newEmp.preferredName}!`,
        type: 'success'
      });
    }, 450);
  };

  const handleManagerDemoLogin = () => {
    const defaultRole = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0];
    const mgrEmp: EmployeeState = {
      fullName: 'Marcus Vance',
      preferredName: 'Marcus',
      handle: 'marcus_vance',
      empId: 'VHQ-MGR-01',
      department: 'engineering',
      selectedRole: defaultRole,
      signatureDataUrl: '',
      isSigned: true,
      currentStep: 4,
      email: 'm.vance@virtualhq.inc',
      avatarUrl: '',
      authProvider: 'guest',
      userType: 'manager'
    };
    onAuthenticated(mgrEmp);
    onClose();
    showToast({
      title: 'Manager Mode Activated',
      message: 'Logged in as Marcus Vance (VP of Engineering). Full PR review permissions enabled.',
      type: 'success'
    });
  };

  return (
    <div className="onboard-modal-overlay active" style={{ zIndex: 10000 }}>
      <div
        className="executive-card"
        style={{
          width: '460px',
          maxWidth: '92vw',
          padding: '2rem',
          background: '#090b0e',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: '#71717a',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 0.85rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ffffff" strokeWidth="2"/>
              <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2"/>
              <path d="M2 12L12 17L22 12" stroke="#ffffff" strokeWidth="2"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
            VirtualHQ SSO &amp; Auth
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Sign in with your enterprise credentials or GitHub account to sync career progress and code reviews.
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            padding: '4px',
            marginBottom: '1.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('github')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              background: activeTab === 'github' ? '#ffffff' : 'transparent',
              color: activeTab === 'github' ? '#09090b' : '#a1a1aa',
              fontWeight: 600,
              fontSize: '0.78rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            GitHub SSO
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              background: activeTab === 'email' ? '#ffffff' : 'transparent',
              color: activeTab === 'email' ? '#09090b' : '#a1a1aa',
              fontWeight: 600,
              fontSize: '0.78rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Email &amp; Password
          </button>
        </div>

        {/* Tab 1: GitHub SSO */}
        {activeTab === 'github' && (
          <div>
            <button
              type="button"
              disabled={loading}
              onClick={handleGitHubAuth}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                background: '#24292e',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: '1rem'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>{loading ? 'Connecting OAuth...' : 'Continue with GitHub'}</span>
            </button>

            {!isSupabaseConfigured && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#71717a', marginBottom: '0.4rem' }}>
                  OR ENTER GITHUB USERNAME (DEMO SYNC):
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={simulatedGithubHandle}
                    onChange={(e) => setSimulatedGithubHandle(e.target.value)}
                    placeholder="e.g. octocat or yourhandle"
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGitHubAuth}
                    style={{
                      padding: '0.55rem 0.85rem',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Sync Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Email & Password */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#71717a', marginBottom: '0.35rem' }}>
                  FULL LEGAL NAME
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#71717a', marginBottom: '0.35rem' }}>
                CORPORATE EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#71717a', marginBottom: '0.35rem' }}>
                ENTERPRISE PASSWORD
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.7rem',
                marginTop: '0.4rem',
                background: '#ffffff',
                color: '#09090b',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? 'Authenticating...' : isSignUp ? 'Create Corporate Account' : 'Sign In to Workplace'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isSignUp ? 'Already have credentials? Sign in' : 'Need a corporate profile? Register here'}
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Access Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.65rem', color: '#71717a', textAlign: 'center', letterSpacing: '0.06em' }}>
            OR TEST WITH PRE-PROVISIONED DEMO PROFILES:
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                const defaultRole = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0];
                const emp: EmployeeState = {
                  fullName: 'Alex Morgan',
                  preferredName: 'Alex',
                  handle: 'alexmorgan',
                  empId: 'VHQ-8302',
                  department: 'engineering',
                  selectedRole: defaultRole,
                  signatureDataUrl: '',
                  isSigned: true,
                  currentStep: 4,
                  email: 'alex.morgan@virtualhq.inc',
                  userType: 'employee'
                };
                onAuthenticated(emp);
                onClose();
              }}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e4e4e7',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: 600 }}>👨‍💻 Alex Morgan</div>
              <div style={{ fontSize: '0.62rem', color: '#71717a' }}>Junior Engineer</div>
            </button>

            <button
              type="button"
              onClick={handleManagerDemoLogin}
              style={{
                padding: '0.5rem',
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: 600 }}>👔 Marcus Vance</div>
              <div style={{ fontSize: '0.62rem', color: '#64748b' }}>VP / Lead Reviewer</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
