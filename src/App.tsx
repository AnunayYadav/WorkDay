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
  const [activeStudioIssue, setActiveStudioIssue] = useState<ProblemIssue | null>(null);

  // Load employee profile on startup
  useEffect(() => {
    CloudStorage.getEmployee().then(saved => {
      if (saved) {
        setEmployee(saved);
      }
    });

    // Listen to Supabase Auth State changes (e.g. GitHub OAuth callback)
    const authListener = AuthService.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = session.user;
        const meta = user.user_metadata || {};
        const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'VirtualHQ Engineer';
        const defaultRole = PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering[0];

        const oauthEmp: EmployeeState = {
          fullName,
          preferredName: fullName.split(' ')[0],
          handle: (meta.user_name || meta.preferred_username || user.email?.split('@')[0] || 'engineer').toLowerCase(),
          empId: `VHQ-${Math.floor(1000 + Math.random() * 9000)}`,
          department: 'engineering',
          selectedRole: defaultRole,
          signatureDataUrl: '',
          isSigned: true,
          currentStep: 4,
          email: user.email,
          avatarUrl: meta.avatar_url,
          authProvider: 'github',
          userId: user.id,
          userType: 'employee'
        };

        setEmployee(oauthEmp);
        await CloudStorage.saveEmployee(oauthEmp);
        setCurrentView('workspace');
        showToast({
          title: 'GitHub SSO Verified',
          message: `Authenticated as ${oauthEmp.fullName} (${oauthEmp.empId}).`,
          type: 'success'
        });
      }
    });

    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, []);

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
    await CloudStorage.saveEmployee(authEmp);
    setIsAuthModalOpen(false);
    setCurrentView('workspace');
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
          onOpenOnboard={() => setIsOnboardingOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
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
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
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
