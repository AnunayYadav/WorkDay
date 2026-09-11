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

  // Instant local cache hydration to prevent visual flicker or unwanted onboarding trigger on refresh
  const [employee, setEmployee] = useState<EmployeeState | null>(() => {
    try {
      const cached = localStorage.getItem('vhq_active_emp');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  });

  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>(() => {
    try {
      const cached = localStorage.getItem('vhq_active_emp');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.isSigned) return 'workspace';
      }
    } catch (_) {}
    return 'landing';
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingOnboardAfterAuth, setPendingOnboardAfterAuth] = useState(false);
  const [activeStudioIssue, setActiveStudioIssue] = useState<ProblemIssue | null>(null);

  // Load employee profile on startup and auto-navigate only if real active Supabase session exists
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const session = await AuthService.getSession();
        if (!session?.user) {
          // Unauthenticated! Clear local cache and stay strictly on landing view
          await CloudStorage.clearEmployee();
          if (isMounted) {
            setEmployee(null);
            setCurrentView('landing');
            setIsOnboardingOpen(false);
          }
          return;
        }

        // Live Supabase user session exists: query Supabase profiles
        const user = session.user;
        const saved = await CloudStorage.getEmployee();

        if (!isMounted) return;

        if (saved && saved.isSigned) {
          setEmployee(saved);
          setCurrentView('workspace');
          setIsOnboardingOpen(false);
        } else if (saved && !saved.isSigned) {
          setEmployee(saved);
          setCurrentView('landing');
          setIsOnboardingOpen(true);
        } else {
          // Fresh profile needed for authenticated user
          const meta = user.user_metadata || {};
          const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Engineering Recruit';
          const cleanGh = (meta.github_username || meta.user_name || user.email?.split('@')[0] || 'engineer').toLowerCase();
          const baseEmp: EmployeeState = {
            fullName,
            preferredName: fullName.split(' ')[0],
            handle: cleanGh,
            empId: `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
            department: 'engineering',
            selectedRole: PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0],
            signatureDataUrl: '',
            isSigned: false,
            currentStep: 1,
            email: user.email,
            corporateEmail: `${cleanGh}@virtualhq.corp`,
            githubUsername: cleanGh,
            avatarUrl: meta.avatar_url || `https://github.com/${cleanGh}.png`,
            authProvider: (user.app_metadata?.provider as any) || 'email',
            userId: user.id,
            userType: 'employee',
            totalXp: 200
          };
          setEmployee(baseEmp);
          setCurrentView('landing');
          setIsOnboardingOpen(true);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      }
    };

    initAuth();

    // Listen to Supabase Auth State changes (login, logout, token refresh)
    const authListener = AuthService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Ignore INITIAL_SESSION to prevent racing with initAuth on page refresh
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (event === 'SIGNED_OUT' || !session?.user) {
        await CloudStorage.clearEmployee();
        setEmployee(null);
        setCurrentView('landing');
        setIsOnboardingOpen(false);
        setIsAuthModalOpen(false);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const existing = await CloudStorage.getEmployee();

        if (existing && existing.isSigned) {
          setEmployee(existing);
          setIsAuthModalOpen(false);
          setIsOnboardingOpen(false);
          setCurrentView('workspace');
          return;
        }

        const meta = user.user_metadata || {};
        const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Engineering Recruit';
        const cleanGh = (meta.github_username || meta.user_name || user.email?.split('@')[0] || 'engineer').toLowerCase();
        const baseEmp: EmployeeState = existing || {
          fullName,
          preferredName: fullName.split(' ')[0],
          handle: cleanGh,
          empId: `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
          department: 'engineering',
          selectedRole: PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0],
          signatureDataUrl: '',
          isSigned: false,
          currentStep: 1,
          email: user.email,
          corporateEmail: `${cleanGh}@virtualhq.corp`,
          githubUsername: cleanGh,
          avatarUrl: meta.avatar_url || `https://github.com/${cleanGh}.png`,
          authProvider: (user.app_metadata?.provider as any) || 'email',
          userId: user.id,
          userType: 'employee',
          totalXp: 200
        };

        setEmployee(baseEmp);
        setIsAuthModalOpen(false);
        if (baseEmp.isSigned) {
          setCurrentView('workspace');
          setIsOnboardingOpen(false);
        } else {
          setIsOnboardingOpen(true);
        }
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
    const session = await AuthService.getSession();
    const resolvedEmp: EmployeeState = {
      ...newEmp,
      userId: newEmp.userId || session?.user?.id,
      email: newEmp.email || session?.user?.email,
      isSigned: true,
      currentStep: 5
    };

    setEmployee(resolvedEmp);
    setIsOnboardingOpen(false);
    setCurrentView('workspace');
    await CloudStorage.saveEmployee(resolvedEmp);

    showToast({
      title: 'Welcome to VirtualHQ!',
      message: `Credentials issued for ${resolvedEmp.fullName} (${resolvedEmp.empId}).`,
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
