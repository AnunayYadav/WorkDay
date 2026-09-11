import { useState, useEffect } from 'react';
import type { EmployeeState, ProblemIssue, PullRequest } from './types';
import { CloudStorage, AuthService } from './lib/supabase';
import { ToastProvider, useToast } from './lib/toast';
import { LandingView } from './components/landing/LandingView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AuthModal } from './components/auth/AuthModal';
import { CorporateWorkspace } from './components/workspace/CorporateWorkspace';
import { MonacoStudio } from './components/ide/MonacoStudio';
import { PROBLEMS_DATASET } from './lib/dataset';

function AppContent() {
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<EmployeeState | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingOnboardAfterAuth, setPendingOnboardAfterAuth] = useState(false);
  const [activeStudioIssue, setActiveStudioIssue] = useState<ProblemIssue | null>(null);

  // Load employee profile on startup and auto-navigate only if real active Supabase session exists
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const session = await AuthService.getSession();
      if (!session?.user) {
        // Unauthenticated! Stay strictly on landing page, clear any orphaned state
        await CloudStorage.clearEmployee();
        if (isMounted) {
          setEmployee(null);
          setCurrentView('landing');
        }
        return;
      }

      // Live Supabase authenticated session exists
      const saved = await CloudStorage.getEmployee();
      if (isMounted && saved) {
        setEmployee(saved);
        if (saved.isSigned) {
          setCurrentView('workspace');
        } else {
          setIsOnboardingOpen(true);
        }
      }
    };

    initAuth();

    // Listen to Supabase Auth State changes (e.g. GitHub OAuth callback redirect)
    const authListener = AuthService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const user = session.user;
        const existing = await CloudStorage.getEmployee();
        if (existing && existing.isSigned) {
          setEmployee(existing);
          setIsAuthModalOpen(false);
          setCurrentView('workspace');
          return;
        }

        const meta = user.user_metadata || {};
        const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || '';
        const defaultRole = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0];

        const oauthEmp: EmployeeState = {
          fullName,
          preferredName: fullName ? fullName.split(' ')[0] : '',
          handle: (meta.user_name || meta.preferred_username || user.email?.split('@')[0] || '').toLowerCase(),
          empId: existing?.empId || `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
          department: 'engineering',
          selectedRole: existing?.selectedRole || defaultRole,
          signatureDataUrl: existing?.signatureDataUrl || '',
          isSigned: Boolean(existing?.isSigned),
          currentStep: existing?.isSigned ? 4 : 1,
          email: user.email,
          avatarUrl: meta.avatar_url,
          authProvider: 'github',
          userId: user.id,
          userType: 'employee'
        };

        setEmployee(oauthEmp);
        setIsAuthModalOpen(false);

        if (oauthEmp.isSigned) {
          await CloudStorage.saveEmployee(oauthEmp);
          setCurrentView('workspace');
          showToast({
            title: 'GitHub Verified',
            message: `Authenticated as ${oauthEmp.fullName} (${oauthEmp.empId}).`,
            type: 'success'
          });
        } else {
          // Open onboarding to pick role and sign contract
          setIsOnboardingOpen(true);
          showToast({
            title: 'GitHub Verified',
            message: `Welcome ${oauthEmp.fullName || 'Engineer'}! Complete your specialization onboarding and contract signature.`,
            type: 'info'
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setEmployee(null);
        setCurrentView('landing');
      }
    });

    return () => {
      isMounted = false;
      authListener?.data?.subscription?.unsubscribe();
    };
  }, []);

  // When user clicks "Get Started" / "Start Onboarding" on landing page
  const handleStartOnboarding = () => {
    if (employee && employee.isSigned) {
      setCurrentView('workspace');
      return;
    }

    if (employee && !employee.isSigned) {
      setIsOnboardingOpen(true);
      return;
    }

    // Must authenticate first
    setPendingOnboardAfterAuth(true);
    setIsAuthModalOpen(true);
    showToast({
      title: 'Authentication Required',
      message: 'Please sign in or create an account to begin official corporate onboarding.',
      type: 'info'
    });
  };

  const handleCompleteOnboarding = async (newEmp: EmployeeState) => {
    setEmployee(newEmp);
    await CloudStorage.saveEmployee(newEmp);
    setIsOnboardingOpen(false);
    setCurrentView('workspace');
    showToast({
      title: 'Welcome to VirtualHQ!',
      message: `Credentials issued for ${newEmp.fullName} (${newEmp.empId}).`,
      type: 'success'
    });
  };

  const handleAuthenticated = async (authEmp: EmployeeState) => {
    setEmployee(authEmp);
    setIsAuthModalOpen(false);

    if (pendingOnboardAfterAuth || !authEmp.isSigned) {
      setPendingOnboardAfterAuth(false);
      setIsOnboardingOpen(true);
      showToast({
        title: 'Authentication Successful',
        message: `Welcome, ${authEmp.fullName}! Proceed to complete your role onboarding.`,
        type: 'success'
      });
    } else {
      await CloudStorage.saveEmployee(authEmp);
      setCurrentView('workspace');
      showToast({
        title: 'Welcome Back',
        message: `Signed in as ${authEmp.fullName}.`,
        type: 'success'
      });
    }
  };

  const handleOpenStudio = (issue: ProblemIssue) => {
    setActiveStudioIssue(issue);
  };

  const handlePrSubmitted = (pr: PullRequest) => {
    showToast({
      title: 'PR In Manager Review',
      message: `${pr.id} awaiting code review from lead mentor.`,
      type: 'info'
    });
  };

  return (
    <>
      {/* 1. Landing View */}
      {currentView === 'landing' && (
        <LandingView
          onOpenOnboard={handleStartOnboarding}
          onOpenAuth={() => {
            setPendingOnboardAfterAuth(false);
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* 2. Corporate Workspace Desk */}
      {currentView === 'workspace' && employee && (
        <>
          <CorporateWorkspace
            employee={employee}
            onOpenStudio={handleOpenStudio}
            onSignOut={async () => {
              await AuthService.signOut();
              await CloudStorage.clearEmployee();
              setEmployee(null);
              setCurrentView('landing');
            }}
          />
          
          {/* Monaco / VS Code Studio Overlay */}
          {activeStudioIssue && (
            <MonacoStudio
              issue={activeStudioIssue}
              employee={employee}
              onClose={() => setActiveStudioIssue(null)}
              onPrSubmitted={handlePrSubmitted}
            />
          )}
        </>
      )}

      {/* Onboarding Flow Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={handleCompleteOnboarding}
        initialData={employee}
      />

      {/* Enterprise SSO / GitHub Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingOnboardAfterAuth(false);
        }}
        onAuthenticated={handleAuthenticated}
        isForOnboarding={pendingOnboardAfterAuth}
      />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
