import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PROBLEMS_DATASET } from '../../lib/dataset';
import { CloudStorage } from '../../lib/supabase';
import { PRESET_COMPANIES, type DepartmentRole, type EmployeeState, type CompanyPreset } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (employee: EmployeeState) => void;
  initialData?: EmployeeState | null;
}

type DeptCategory = 'engineering' | 'infrastructure' | 'data' | 'product';

/**
 * Generate a clean, responsive SVG vector data URL from recorded strokes.
 * Uses midpoint quadratic bezier smoothing for calligraphic elegance.
 */
function generateSvgSignature(strokes: Array<Array<{ x: number; y: number }>>, width = 540, height = 110): string {
  if (!strokes || strokes.length === 0) return '';

  let pathD = '';
  for (const stroke of strokes) {
    if (!stroke || stroke.length === 0) continue;
    if (stroke.length === 1) {
      pathD += `M ${stroke[0].x.toFixed(1)} ${stroke[0].y.toFixed(1)} l 0.1 0.1 `;
      continue;
    }
    pathD += `M ${stroke[0].x.toFixed(1)} ${stroke[0].y.toFixed(1)} `;
    for (let i = 1; i < stroke.length - 1; i++) {
      const xc = ((stroke[i].x + stroke[i + 1].x) / 2).toFixed(1);
      const yc = ((stroke[i].y + stroke[i + 1].y) / 2).toFixed(1);
      pathD += `Q ${stroke[i].x.toFixed(1)} ${stroke[i].y.toFixed(1)}, ${xc} ${yc} `;
    }
    const last = stroke[stroke.length - 1];
    pathD += `L ${last.x.toFixed(1)} ${last.y.toFixed(1)} `;
  }

  const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><path d="${pathD.trim()}" fill="none" stroke="#0f172a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}

export const MANAGER_ROLES: DepartmentRole[] = [
  {
    id: 'mgr_core_lead',
    title: 'Engineering Manager · Core Systems',
    level: 'LEVEL M1 · SQUAD LEAD',
    desc: 'Oversees engineering squad velocity, code review merge approvals, sprint ticket assignments, and technical architecture.',
    tags: ['Sprint Planning', 'PR Approvals', 'Architecture', 'Team Velocity'],
    manager: {
      name: 'Elena Rostova',
      title: 'VP of Engineering',
      initials: 'ER',
      quote: 'Leadership is about unblocking your squad and shipping high-leverage systems with velocity and discipline.'
    },
    teammates: [],
    problems: []
  },
  {
    id: 'mgr_tech_lead',
    title: 'Technical Lead Manager · Frontend & Web',
    level: 'LEVEL M1 · TECH LEAD',
    desc: 'Steers web design systems, client-side performance, frontend architecture, and junior/senior engineer mentorship.',
    tags: ['Design Systems', 'React/TypeScript', 'Code Quality', 'Mentorship'],
    manager: {
      name: 'David Singleton',
      title: 'Chief Technology Officer',
      initials: 'DS',
      quote: 'Great technical managers turn ambiguous specifications into rock-solid software architecture.'
    },
    teammates: [],
    problems: []
  },
  {
    id: 'mgr_infra_lead',
    title: 'Platform & Infrastructure Manager',
    level: 'LEVEL M2 · STAFF LEAD',
    desc: 'Directs cloud infrastructure, Kubernetes orchestration, zero-downtime deployments, and SRE incident response pipelines.',
    tags: ['Kubernetes', 'Cloud Infra', 'SRE/Incident Ops', 'Security Audit'],
    manager: {
      name: 'Kavita Patel',
      title: 'Head of Infrastructure',
      initials: 'KP',
      quote: 'Resilient distributed systems are the bedrock of our company scalability.'
    },
    teammates: [],
    problems: []
  },
  {
    id: 'mgr_director',
    title: 'Director of Engineering · Enterprise Platform',
    level: 'LEVEL M3 · DIRECTOR',
    desc: 'Coordinates multi-squad technical roadmaps, manager 1-on-1s, engineering budget allocation, and executive alignment.',
    tags: ['Roadmaps', 'Multi-Squad Governance', 'Executive Strategy', 'Headcount'],
    manager: {
      name: 'Patrick Collison',
      title: 'Chief Executive Officer',
      initials: 'PC',
      quote: 'High agency leadership and relentless operational execution define our technical frontier.'
    },
    teammates: [],
    problems: []
  }
];

export const HR_ROLES: DepartmentRole[] = [
  {
    id: 'hr_people_ops',
    title: 'People Operations & Onboarding Lead',
    level: 'LEVEL HR1 · LEAD',
    desc: 'Directs corporate employee onboarding, verified digital contract execution, corporate compliance, and team culture.',
    tags: ['Onboarding', 'Compliance', 'Contracts', 'Employee Experience'],
    manager: {
      name: 'Claire Hughes Johnson',
      title: 'Chief Operating Officer',
      initials: 'CH',
      quote: 'Exceptional organizations are built on transparent culture, high trust, and meticulous people operations.'
    },
    teammates: [],
    problems: []
  },
  {
    id: 'hr_talent_partner',
    title: 'Strategic Talent & Headcount Partner',
    level: 'LEVEL HR2 · SENIOR',
    desc: 'Manages engineering recruitment, talent compensation bands, offer letter issuances, and squad headcount expansion.',
    tags: ['Headcount Planning', 'Compensation Bands', 'Talent Acquisition', 'RSUs'],
    manager: {
      name: 'Nathaniel Reed',
      title: 'VP of Talent & Culture',
      initials: 'NR',
      quote: 'Attracting and retaining top tier engineering talent is our highest competitive advantage.'
    },
    teammates: [],
    problems: []
  },
  {
    id: 'hr_director_people',
    title: 'Director of People & Corporate Governance',
    level: 'LEVEL HR3 · DIRECTOR',
    desc: 'Architects enterprise governance, equity structures, employee performance review cycles, and labor law compliance.',
    tags: ['Corporate Governance', 'Legal Compliance', 'Global HR', 'Executive Leadership'],
    manager: {
      name: 'Patrick Collison',
      title: 'Chief Executive Officer',
      initials: 'PC',
      quote: 'We operate at global scale with uncompromising standards of operational excellence.'
    },
    teammates: [],
    problems: []
  }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialData
}) => {
  const userRole: 'employee' | 'manager' | 'hr' = initialData?.userType || 'employee';
  const isManager = userRole === 'manager';
  const isHr = userRole === 'hr';

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [preferredName, setPreferredName] = useState(initialData?.preferredName || '');
  const [handle, setHandle] = useState(initialData?.handle || '');
  const [empId, setEmpId] = useState(initialData?.empId || (isManager ? `WD-MGR-${Math.floor(1000 + Math.random() * 9000)}` : isHr ? `WD-HR-${Math.floor(1000 + Math.random() * 9000)}` : `WD-${Math.floor(1000 + Math.random() * 9000)}`));
  
  // Dynamic Companies from Supabase
  const [companies, setCompanies] = useState<CompanyPreset[]>(PRESET_COMPANIES);

  useEffect(() => {
    CloudStorage.listCompanies().then(list => {
      if (list && list.length > 0) {
        setCompanies(list);
      }
    });
  }, []);

  // Company Selection state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => {
    if (initialData?.companyName) {
      const found = PRESET_COMPANIES.find(c => c.name.toLowerCase() === initialData.companyName?.toLowerCase());
      return found ? found.id : 'custom';
    }
    return 'stripe';
  });
  const [customCompanyName, setCustomCompanyName] = useState<string>(() => {
    if (initialData?.companyName && !PRESET_COMPANIES.some(c => c.name.toLowerCase() === initialData.companyName?.toLowerCase())) {
      return initialData.companyName;
    }
    return '';
  });
  const [customCompanyDomain, setCustomCompanyDomain] = useState<string>(() => {
    if (initialData?.companyDomain && !PRESET_COMPANIES.some(c => c.domain.toLowerCase() === initialData.companyDomain?.toLowerCase())) {
      return initialData.companyDomain;
    }
    return '';
  });

  const activePreset = companies.find(c => c.id === selectedCompanyId) || PRESET_COMPANIES.find(c => c.id === selectedCompanyId);
  const activeCompanyName = selectedCompanyId === 'custom'
    ? (customCompanyName.trim() || 'Stripe')
    : (activePreset?.name || 'Stripe');
  const activeCompanyDomain = selectedCompanyId === 'custom'
    ? (customCompanyDomain.trim().toLowerCase() || 'stripe.corp')
    : (activePreset?.domain || 'stripe.corp');

  // Live direct reports / employees from database for this company
  const [companyEmployees, setCompanyEmployees] = useState<EmployeeState[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedSquadEmpIds, setSelectedSquadEmpIds] = useState<string[]>([]);

  const fetchCompanyEmployees = async () => {
    if (!activeCompanyName) return;
    setLoadingEmployees(true);
    try {
      const list = await CloudStorage.listProfiles(activeCompanyName, 'employee');
      setCompanyEmployees(list || []);
    } catch {
      setCompanyEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchCompanyEmployees();
  }, [activeCompanyName, step]);

  // Select all employees by default when company employees are fetched
  useEffect(() => {
    if (companyEmployees && companyEmployees.length > 0) {
      setSelectedSquadEmpIds(companyEmployees.map(e => e.empId));
    } else {
      setSelectedSquadEmpIds([]);
    }
  }, [companyEmployees]);

  const toggleSquadMember = (empId: string) => {
    setSelectedSquadEmpIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const selectAllSquad = () => {
    setSelectedSquadEmpIds(companyEmployees.map(e => e.empId));
  };

  const deselectAllSquad = () => {
    setSelectedSquadEmpIds([]);
  };

  const DIALOGUES: Record<number, string> = {
    1: isManager
      ? `"Welcome to WorkDay. You are onboarding as an Engineering Manager at ${activeCompanyName}. Let's establish your corporate credentials and executive handle."`
      : isHr
        ? `"Welcome to WorkDay. You are entering ${activeCompanyName} as HR Lead. Let's establish your people operations authority and verified handle."`
        : `"Welcome to WorkDay. Today marks Day 1 of your corporate journey at ${activeCompanyName}. Let's establish your company affiliation, employee identity, and corporate handle."`,
    2: isManager
      ? `"As an Engineering Manager at ${activeCompanyName}, you are entrusted with squad velocity and code review quality. Select your leadership scope and management track."`
      : isHr
        ? `"As an HR Lead at ${activeCompanyName}, you govern people operations, onboarding compliance, and talent benchmarks. Select your specialization track."`
        : `"Every engineer at ${activeCompanyName} drives direct product velocity. Select the department and specialization track that fits your technical ambitions."`,
    3: isManager
      ? `"Here is your Executive Employment Agreement & Squad Management Commission for ${activeCompanyName}. Review the management deliverables and execute your signature below."`
      : isHr
        ? `"Here is your Corporate HR Commission & People Operations Charter for ${activeCompanyName}. Review your authority and execute your signature below."`
        : `"Here is your official Corporate Appointment Letter for ${activeCompanyName}. Review the performance benchmarks and execute your handwritten virtual signature below."`,
    4: isManager
      ? `"Here are the registered engineers currently in your squad at ${activeCompanyName}. You will oversee their sprint tasks, 1-on-1s, and PR merge approvals."`
      : isHr
        ? `"Review your People Operations division and registered employee headcount across ${activeCompanyName}."`
        : `"Meet your Engineering Director and assigned squad. Your daily standups and code reviews will be coordinated directly through this team."`,
    5: isManager
      ? `"Your executive credentials and Level M1 Squad Lead clearance have been provisioned in the enterprise directory. Step inside your Manager Command Console."`
      : isHr
        ? `"Your HR administrator privileges and corporate governance credentials have been provisioned. Enter your HR Command Console."`
        : `"Your smartcard credentials and Level 1 clearance have been provisioned in the enterprise directory. Step inside your virtual office when you’re ready."`
  };

  const [activeDept, setActiveDept] = useState<DeptCategory>(
    (initialData?.department as DeptCategory) || 'engineering'
  );

  const availableRoles: DepartmentRole[] = isManager
    ? MANAGER_ROLES
    : isHr
      ? HR_ROLES
      : ((PROBLEMS_DATASET.DEPARTMENT_ROLES[activeDept] || PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering) as unknown as DepartmentRole[]);

  const [selectedRole, setSelectedRole] = useState<DepartmentRole>(() => {
    if (initialData?.selectedRole) return initialData.selectedRole;
    if (isManager) return MANAGER_ROLES[0];
    if (isHr) return HR_ROLES[0];
    return availableRoles[0];
  });

  // Re-sync role when initialData or role category changes
  useEffect(() => {
    if (isManager) {
      const found = MANAGER_ROLES.find(r => r.title === initialData?.selectedRole?.title);
      setSelectedRole(found || MANAGER_ROLES[0]);
    } else if (isHr) {
      const found = HR_ROLES.find(r => r.title === initialData?.selectedRole?.title);
      setSelectedRole(found || HR_ROLES[0]);
    }
  }, [isManager, isHr, initialData?.selectedRole?.title]);

  // Canvas Signature state & vector stroke recording
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const currentStrokeRef = useRef<Array<{ x: number; y: number }>>([]);
  const [isSigned, setIsSigned] = useState(initialData?.isSigned || false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>(initialData?.signatureDataUrl || '');
  const [strokeCount, setStrokeCount] = useState(0);

  // 3D badge tilt ref
  const badgeCardRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);

  // Helper to persist intermediate onboarding progress to local storage & Supabase
  const saveProgressDraft = (overrides?: Partial<EmployeeState>) => {
    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') || (isManager ? 'lead' : isHr ? 'hr.lead' : 'engineer');
    const draft: EmployeeState = {
      fullName: fullName.trim() || initialData?.fullName || (isManager ? 'Engineering Manager' : isHr ? 'HR Lead' : 'Engineering Recruit'),
      preferredName: preferredName.trim() || initialData?.preferredName || (isManager ? 'Lead' : isHr ? 'HR' : 'Engineer'),
      handle: cleanHandle,
      corporateEmail: `${cleanHandle}@${activeCompanyDomain}`,
      githubUsername: initialData?.githubUsername || cleanHandle,
      empId,
      department: isManager ? 'management' : isHr ? 'people' : activeDept,
      selectedRole,
      signatureDataUrl: signatureUrl || '',
      isSigned: isSigned,
      currentStep: step,
      email: initialData?.email || '',
      avatarUrl: initialData?.avatarUrl || `https://github.com/${initialData?.githubUsername || cleanHandle}.png`,
      authProvider: initialData?.authProvider || 'email',
      userId: initialData?.userId,
      userType: initialData?.userType || 'employee',
      totalXp: initialData?.totalXp || 200,
      companyName: activeCompanyName,
      companyDomain: activeCompanyDomain,
      ...overrides
    };
    CloudStorage.saveEmployee(draft).catch(() => {});
  };

  // Sync handle and preferredName when full name changes
  useEffect(() => {
    if (fullName) {
      const parts = fullName.trim().toLowerCase().split(/\s+/);
      if (parts.length > 1) {
        setHandle(`${parts[0]}.${parts[parts.length - 1]}`);
        setPreferredName(parts[0].charAt(0).toUpperCase() + parts[0].slice(1));
      } else if (parts[0]) {
        setHandle(parts[0]);
        setPreferredName(parts[0].charAt(0).toUpperCase() + parts[0].slice(1));
      }
    }
  }, [fullName]);

  // Sync initialData changes (e.g. after auth login)
  useEffect(() => {
    if (initialData) {
      if (initialData.fullName) setFullName(initialData.fullName);
      if (initialData.preferredName) setPreferredName(initialData.preferredName);
      if (initialData.handle) setHandle(initialData.handle);
      if (initialData.empId) setEmpId(initialData.empId);
      if (initialData.companyName) {
        const found = PRESET_COMPANIES.find(c => c.name.toLowerCase() === initialData.companyName?.toLowerCase())
          || companies.find(c => c.name.toLowerCase() === initialData.companyName?.toLowerCase());
        if (found) {
          setSelectedCompanyId(found.id);
        } else {
          setSelectedCompanyId('custom');
          setCustomCompanyName(initialData.companyName);
          if (initialData.companyDomain) setCustomCompanyDomain(initialData.companyDomain);
        }
      }
      if (initialData.department && (initialData.department in PROBLEMS_DATASET.DEPARTMENT_ROLES)) {
        setActiveDept(initialData.department as DeptCategory);
      }
      if (initialData.selectedRole) setSelectedRole(initialData.selectedRole);
      if (initialData.signatureDataUrl) setSignatureUrl(initialData.signatureDataUrl);
      if (initialData.isSigned !== undefined) setIsSigned(initialData.isSigned);
    }
  }, [initialData, companies]);

  // Re-render saved signature on canvas if opening step 3
  useEffect(() => {
    if (step === 3 && canvasRef.current && signatureUrl) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = signatureUrl;
      }
    }
  }, [step, signatureUrl]);

  // Handle signature drawing with vector point capture
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    currentStrokeRef.current = [{ x, y }];

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    currentStrokeRef.current.push({ x, y });

    ctx.lineTo(x, y);
    ctx.stroke();
    setStrokeCount(prev => prev + 1);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
    }

    // Automatically generate exact SVG vector format upon mouse/touch release
    if (strokesRef.current.length > 0) {
      const svgUrl = generateSvgSignature(strokesRef.current, 540, 110);
      if (svgUrl) {
        setSignatureUrl(svgUrl);
        setIsSigned(true);
        // Persist intermediate draft
        saveProgressDraft({ isSigned: true, signatureDataUrl: svgUrl });
      }
    }
  };

  const handleClearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsSigned(false);
      setSignatureUrl('');
      setStrokeCount(0);
      strokesRef.current = [];
      currentStrokeRef.current = [];
      saveProgressDraft({ isSigned: false, signatureDataUrl: '' });
    }
  };

  const handleAdoptSig = () => {
    let finalSig = signatureUrl;
    if (strokesRef.current.length > 0) {
      finalSig = generateSvgSignature(strokesRef.current, 540, 110);
    } else if (canvasRef.current && strokeCount > 0) {
      finalSig = canvasRef.current.toDataURL();
    }
    if (finalSig) {
      setSignatureUrl(finalSig);
      setIsSigned(true);
      saveProgressDraft({ isSigned: true, signatureDataUrl: finalSig });
    }
  };

  // Badge 3D tilt on mousemove
  const handleBadgeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = badgeCardRef.current;
    const sheen = sheenRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -9;
    const rotateY = ((x - centerX) / centerX) * 9;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    if (sheen) {
      sheen.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 65%)`;
    }
  };

  const handleBadgeMouseLeave = () => {
    const card = badgeCardRef.current;
    const sheen = sheenRef.current;
    if (card) {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
    if (sheen) {
      sheen.style.background = 'none';
    }
  };

  const handleFinish = async () => {
    confetti({
      particleCount: 140,
      spread: 85,
      origin: { y: 0.6 }
    });

    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'engineer';
    const corpEmail = `${cleanHandle}@${activeCompanyDomain}`;

    // For managers: populate teammates with the selected squad employees from this company
    let finalSelectedRole = selectedRole;
    if (isManager && companyEmployees.length > 0) {
      const chosenReports = companyEmployees.filter(e => selectedSquadEmpIds.includes(e.empId));
      if (chosenReports.length > 0) {
        finalSelectedRole = {
          ...selectedRole,
          teammates: chosenReports.map(e => ({
            name: e.fullName,
            role: e.selectedRole?.title || 'Engineer',
            avatar: e.avatarUrl || ''
          }))
        };
      }
    }

    const emp: EmployeeState = {
      fullName: fullName.trim() || initialData?.fullName || (isManager ? 'Engineering Manager' : isHr ? 'HR Lead' : 'Engineering Recruit'),
      preferredName: preferredName.trim() || initialData?.preferredName || (isManager ? 'Lead' : isHr ? 'HR' : 'Engineer'),
      handle: cleanHandle,
      corporateEmail: corpEmail,
      githubUsername: initialData?.githubUsername || cleanHandle,
      empId,
      department: isManager ? 'management' : isHr ? 'people' : activeDept,
      selectedRole: finalSelectedRole,
      signatureDataUrl: signatureUrl || '',
      isSigned: true,
      currentStep: 5,
      email: initialData?.email || '',
      avatarUrl: initialData?.avatarUrl || `https://github.com/${initialData?.githubUsername || cleanHandle}.png`,
      authProvider: initialData?.authProvider || 'email',
      userId: initialData?.userId,
      userType: initialData?.userType || 'employee',
      companyName: activeCompanyName,
      companyDomain: activeCompanyDomain,
      totalXp: initialData?.totalXp || 200
    };

    // If user created a custom company, persist it to Supabase companies table
    if (selectedCompanyId === 'custom' && customCompanyName.trim()) {
      await CloudStorage.upsertCompany({
        name: activeCompanyName,
        domain: activeCompanyDomain,
        tagline: `${activeCompanyName} Enterprise Workspace`
      });
    }

    // Instant local & cloud persistence
    await CloudStorage.saveEmployee(emp);
    onComplete(emp);
  };

  return (
    <div id="onboardingModal" className={`onboarding-modal ${isOpen ? 'active' : ''}`} aria-hidden={!isOpen}>
      {/* Onboarding Header */}
      <header className="onboard-header">
        <div className="header-left">
          <span className="company-tag" style={{ color: '#ffffff', fontWeight: 700, letterSpacing: '0.08em' }}>
            WORKDAY ENTERPRISE
          </span>
          <span className="header-divider">/</span>
          <span className="step-counter" id="onboardStepCounter">STAGE 0{step} OF 05</span>
        </div>
        <button className="btn-close-onboard" id="closeOnboardBtn" onClick={onClose} title="Exit Onboarding">
          ✕ Close
        </button>
      </header>

      {/* Main Stage Split */}
      <div className="onboard-stage">
        
        {/* Left Column: HR Character & Executive Dialogue */}
        <aside className="character-pane">
          <div className="character-viewport">
            <div className="character-frame">
              {/* Refined Matte Vector Art HR Character */}
              <svg className="hr-avatar-svg" viewBox="0 0 280 340" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="deskGlow" cx="50%" cy="85%" r="60%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12"/>
                    <stop offset="100%" stopColor="#14161b" stopOpacity="0"/>
                  </radialGradient>
                  <linearGradient id="blazerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2a2e37"/>
                    <stop offset="100%" stopColor="#181a20"/>
                  </linearGradient>
                  <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2d313a"/>
                    <stop offset="100%" stopColor="#1a1c22"/>
                  </linearGradient>
                  <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e8c2a5"/>
                    <stop offset="100%" stopColor="#cf9f82"/>
                  </linearGradient>
                </defs>

                {/* Warm ambient desk reflection */}
                <ellipse cx="140" cy="300" rx="120" ry="40" fill="url(#deskGlow)"/>

                {/* Shoulders & Tailored Dark Blazer */}
                <path d="M50 340 C50 250, 95 210, 140 210 C185 210, 230 250, 230 340 Z" fill="url(#blazerGrad)"/>
                
                {/* Clean White Shirt Collar */}
                <polygon points="140,210 125,255 155,255" fill="#f3f4f6"/>
                <polygon points="140,210 120,240 140,265" fill="#e5e7eb"/>
                <polygon points="140,210 160,240 140,265" fill="#d1d5db"/>

                {/* Neck */}
                <rect x="127" y="170" width="26" height="45" rx="6" fill="url(#skinGrad)"/>

                {/* Face */}
                <ellipse cx="140" cy="135" rx="38" ry="46" fill="url(#skinGrad)"/>

                {/* Hair */}
                <path d="M98 135 C98 80, 120 75, 140 75 C165 75, 182 82, 182 125 C182 140, 178 148, 174 154 C170 135, 162 100, 140 100 C118 100, 108 122, 104 150 Z" fill="url(#hairGrad)"/>

                {/* Minimalist Rim-lit Eyeglasses */}
                <rect x="114" y="126" width="22" height="15" rx="4" stroke="#d1d5db" strokeWidth="2" fill="rgba(255,255,255,0.04)"/>
                <rect x="144" y="126" width="22" height="15" rx="4" stroke="#d1d5db" strokeWidth="2" fill="rgba(255,255,255,0.04)"/>
                <line x1="136" y1="133" x2="144" y2="133" stroke="#d1d5db" strokeWidth="2"/>

                {/* Subtle Neutral Expression */}
                <path d="M133 162 Q140 166 147 162" stroke="#9a3412" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            
            <div className="character-meta">
              <span className="character-name">Elena Vance</span>
              <span className="character-title">Head of People Operations</span>
            </div>
          </div>

          {/* Clean Monochrome Dialogue Box */}
          <div className="dialogue-box">
            <div className="dialogue-speaker">ELENA VANCE · PEOPLE OPERATIONS</div>
            <p className="dialogue-text" id="dialogueText">
              {DIALOGUES[step]}
            </p>
          </div>
        </aside>

        {/* Right Column: Clean Interactive Step Workflows */}
        <main className="interactive-pane">
          
          {/* STEP 1: Employee Identity Setup */}
          {step === 1 && (
            <div className="onboard-step active" id="step1">
              <div className="step-header">
                <span className="step-kicker">STEP 01</span>
                <h3 className="step-title">Enterprise Organization &amp; Identity</h3>
                <p className="step-desc">Select your company affiliation and establish your employee identity in the enterprise directory.</p>
              </div>

              <form id="profileForm" className="onboard-form" onSubmit={(e) => e.preventDefault()}>
                {/* Company / Organization Selector */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ margin: 0, fontWeight: 600, color: '#f4f4f5' }}>Select Your Enterprise Organization</label>
                    <span className="mono" style={{ fontSize: '0.7rem', color: '#71717a' }}>{activeCompanyName}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '0.6rem' }}>
                    Choose your simulated tech employer or configure a custom company and domain.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    {companies.map((preset) => {
                      const isSel = selectedCompanyId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedCompanyId(preset.id)}
                          style={{
                            padding: '0.55rem 0.65rem',
                            borderRadius: '8px',
                            background: isSel ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            border: isSel ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: isSel ? '#ffffff' : '#a1a1aa',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: isSel ? '#ffffff' : '#e4e4e7' }}>
                            {preset.name}
                          </div>
                          <div className="mono" style={{ fontSize: '0.68rem', color: isSel ? '#d4d4d8' : '#71717a', marginTop: '2px' }}>
                            @{preset.domain}
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom Company Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedCompanyId('custom')}
                      style={{
                        padding: '0.55rem 0.65rem',
                        borderRadius: '8px',
                        background: selectedCompanyId === 'custom' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: selectedCompanyId === 'custom' ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: selectedCompanyId === 'custom' ? '#ffffff' : '#a1a1aa',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: selectedCompanyId === 'custom' ? '#ffffff' : '#e4e4e7' }}>
                        + Custom
                      </div>
                      <div className="mono" style={{ fontSize: '0.68rem', color: selectedCompanyId === 'custom' ? '#d4d4d8' : '#71717a', marginTop: '2px' }}>
                        Custom Domain
                      </div>
                    </button>
                  </div>

                  {selectedCompanyId === 'custom' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.6rem' }}>
                      <input
                        type="text"
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        placeholder="Company Name (e.g. Acme Corp)"
                        style={{
                          background: '#12141a',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#ffffff',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.82rem'
                        }}
                      />
                      <input
                        type="text"
                        value={customCompanyDomain}
                        onChange={(e) => setCustomCompanyDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                        placeholder="Domain (e.g. acme.corp)"
                        style={{
                          background: '#12141a',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#ffffff',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="empFullName">Full Legal Name</label>
                  <input
                    type="text"
                    id="empFullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Legal First & Last Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="empPreferredName">Work Display Name</label>
                  <input
                    type="text"
                    id="empPreferredName"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    placeholder="Preferred display name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="empHandle">Choose Corporate Email Handle</label>
                  <div className="input-with-suffix">
                    <input
                      type="text"
                      id="empHandle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      placeholder="first.last"
                    />
                    <span className="suffix">@{activeCompanyDomain}</span>
                  </div>
                </div>

                {/* Minimalist Corporate Email Preview Card */}
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginTop: '0.75rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.68rem', color: '#71717a', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Allotted Corporate Email ({activeCompanyName})
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>
                      {handle.trim() || 'your.handle'}@{activeCompanyDomain}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                      Primary personal email: <span style={{ color: '#a1a1aa' }}>{initialData?.email || 'your-personal@email.com'}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.66rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#d4d4d8',
                    fontWeight: 500,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    whiteSpace: 'nowrap'
                  }}>
                    Auto-Provisioned
                  </span>
                </div>

                <div className="step-actions right-align">
                  <button
                    type="button"
                    className="btn-step-next"
                    id="btnStep1Next"
                    onClick={() => {
                      if (!fullName.trim()) return alert('Please enter your full name');
                      saveProgressDraft({ currentStep: 2 });
                      setStep(2);
                    }}
                  >
                    Continue to Role Selection →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Department & Role Selection */}
          {step === 2 && (
            <div className="onboard-step active" id="step2">
              <div className="step-header">
                <span className="step-kicker">
                  {isManager ? 'STEP 02 · EXECUTIVE MANAGEMENT TRACK' : isHr ? 'STEP 02 · PEOPLE OPERATIONS TRACK' : 'STEP 02'}
                </span>
                <h3 className="step-title">
                  {isManager ? 'Management Scope & Squad Leadership' : isHr ? 'HR Governance & Talent Leadership' : 'Department & Career Track'}
                </h3>
                <p className="step-desc">
                  {isManager 
                    ? `Select your leadership domain. You will direct sprint ticket assignments, PR code reviews, and engineer development for this track at ${activeCompanyName}.`
                    : isHr 
                      ? `Select your HR specialization track for corporate governance, verified contract execution, and workforce compliance at ${activeCompanyName}.`
                      : 'Select your specialization. Your daily tickets, reporting manager, and codebase will align with this track.'}
                </p>
              </div>

              {/* Department Selector Chips (Only for Employees) */}
              {!isManager && !isHr && (
                <div className="dept-pills">
                  {(['engineering', 'infrastructure', 'data', 'product'] as DeptCategory[]).map(dept => (
                    <button
                      key={dept}
                      type="button"
                      className={`dept-pill ${activeDept === dept ? 'active' : ''}`}
                      onClick={() => {
                        setActiveDept(dept);
                        const roles = (PROBLEMS_DATASET.DEPARTMENT_ROLES[dept] || PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering) as unknown as DepartmentRole[];
                        if (roles.length > 0) setSelectedRole(roles[0]);
                      }}
                    >
                      {dept === 'engineering' ? 'Engineering' : dept === 'infrastructure' ? 'Infra & DevOps' : dept === 'data' ? 'Data & AI' : 'Product'}
                    </button>
                  ))}
                </div>
              )}

              {/* Role List */}
              <div className="roles-list" id="rolesGrid">
                {availableRoles.map(role => {
                  const isSelected = selectedRole.id === role.id;
                  return (
                    <div
                      key={role.id}
                      className={`role-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedRole(role)}
                    >
                      <div className="role-radio"></div>
                      <div className="role-content">
                        <div className="role-header-row">
                          <h4 className="role-title">{role.title}</h4>
                          <span className="role-level mono">{role.level}</span>
                        </div>
                        <p className="role-desc">{role.desc}</p>
                        <div className="role-tags">
                          {role.tags.map(tag => (
                            <span key={tag} className="role-tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="step-actions">
                <button type="button" className="btn-step-back" id="btnStep2Back" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn-step-next"
                  id="btnStep2Next"
                  onClick={() => {
                    saveProgressDraft({ currentStep: 3, department: isManager ? 'management' : isHr ? 'people' : activeDept, selectedRole });
                    setStep(3);
                  }}
                >
                  {isManager ? 'Review Executive Agreement →' : isHr ? 'Review HR Commission →' : 'Review Offer Letter →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Authentic Paper Offer Letter & Virtual Hand Signature */}
          {step === 3 && (
            <div className="onboard-step active" id="step3">
              <div className="step-header">
                <span className="step-kicker">STEP 03</span>
                <h3 className="step-title">Appointment Order & Contract</h3>
                <p className="step-desc">Review your official memorandum of employment and sign using your finger, stylus, or mouse below.</p>
              </div>

              {/* Real Paper Offer Letter Container */}
              <div className="paper-offer-letter" id="offerDocument">
                
                {/* Letterhead Header */}
                <div className="paper-header">
                  <div className="letterhead-brand">
                    <div className="letterhead-seal">{activeCompanyName.slice(0, 2).toUpperCase()}</div>
                    <div className="letterhead-details">
                      <span className="letterhead-company">{activeCompanyName.toUpperCase()} TECHNOLOGIES INC.</span>
                      <span className="letterhead-dept">DIVISION OF HUMAN CAPITAL &amp; EXECUTIVE TALENT · 100 ENTERPRISE BLVD</span>
                    </div>
                  </div>
                  <div className="letterhead-meta">
                    <span className="paper-date" id="paperDocDate">September 11, 2026</span>
                    <span className="paper-ref mono" id="offerRefCode">REF: {empId}-EMP</span>
                  </div>
                </div>

                <div className="paper-divider"></div>

                {/* Paper Body Text */}
                <div className="paper-body">
                  <div className="recipient-box">
                    <span className="confidential-label">
                      {isManager 
                        ? 'STRICTLY CONFIDENTIAL · EXECUTIVE MANAGEMENT COMMISSION' 
                        : isHr 
                          ? 'STRICTLY CONFIDENTIAL · HR LEAD APPOINTMENT & CHARTER' 
                          : 'STRICTLY CONFIDENTIAL · EMPLOYEE APPOINTMENT'}
                    </span>
                    <h4 className="recip-name" id="offerCandidateName">{fullName}</h4>
                    <span className="recip-title" id="offerRoleTitle">{selectedRole.title}</span>
                    <span className="recip-dept" id="offerDeptName">
                      {isManager ? 'Engineering Management Division' : isHr ? 'People Operations Division' : `${selectedRole.title} Track`}
                    </span>
                  </div>

                  <p className="paper-paragraph">
                    Dear <strong id="salutationName">{preferredName}</strong>,
                  </p>

                  <p className="paper-paragraph">
                    On behalf of the Executive Leadership of <strong>{activeCompanyName} Technologies Inc.</strong>, we are pleased to confirm your appointment as{' '}
                    <strong id="letterRole">{selectedRole.title}</strong>.{' '}
                    {isManager
                      ? `In this capacity, you will report directly to the VP of Engineering and are entrusted with full operational authority over your engineering squad, PR merge approvals, and sprint velocity at ${activeCompanyName}.`
                      : isHr
                        ? `In this capacity, you will report directly to the Chief Operating Officer and govern digital contract compliance, corporate hiring bands, and workforce health at ${activeCompanyName}.`
                        : `In this capacity, you will report directly to ${selectedRole.manager.name} (${selectedRole.manager.title}).`}
                  </p>

                  {/* Paper Terms Table */}
                  <table className="paper-terms-table">
                    <tbody>
                      <tr>
                        <td className="col-label">Identification Code</td>
                        <td className="col-val mono" id="offerEmpId">{empId}</td>
                      </tr>
                      <tr>
                        <td className="col-label">Corporate Email Allotted</td>
                        <td className="col-val mono" style={{ color: '#0f172a', fontWeight: 600 }}>
                          {(handle.trim() || (isManager ? 'lead' : isHr ? 'hr.lead' : 'engineer')).toLowerCase().replace(/[^a-z0-9._-]/g, '')}@{activeCompanyDomain}
                        </td>
                      </tr>
                      <tr>
                        <td className="col-label">Personal Email Mapped</td>
                        <td className="col-val mono">{initialData?.email || 'user@personal.com'}</td>
                      </tr>
                      <tr>
                        <td className="col-label">Reporting Line</td>
                        <td className="col-val" id="offerHierarchy">
                          {isManager 
                            ? 'Executive Committee → VP Engineering → You (Squad Lead)' 
                            : isHr 
                              ? 'Executive Board → Chief Operating Officer → You (HR Lead)' 
                              : `VP Engineering → ${selectedRole.manager.name} → You`}
                        </td>
                      </tr>
                      <tr>
                        <td className="col-label">Performance &amp; Compensation</td>
                        <td className="col-val mono">
                          {isManager 
                            ? 'Executive Tier · Quarterly Performance Credits & RSUs' 
                            : isHr 
                              ? 'Corporate Operations Tier · Performance Allocation' 
                              : '2,400 Corporate Performance Credits / Sprint'}
                        </td>
                      </tr>
                      <tr>
                        <td className="col-label">Key Milestone</td>
                        <td className="col-val">
                          {isManager 
                            ? 'First Sprint Task Delegation & Squad PR Merge Reviews' 
                            : isHr 
                              ? 'Verified Corporate Roster & Workforce Contract Execution' 
                              : 'Sprint 01 Task Submission & Manager Code Review'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="paper-paragraph legal-clause">
                    <strong>Terms of Agreement:</strong> {isManager 
                      ? `As an Engineering Manager at ${activeCompanyName}, you agree to uphold rigorous software quality standards, conduct thoughtful code reviews, and champion developer velocity.`
                      : isHr 
                        ? `As HR Lead at ${activeCompanyName}, you agree to safeguard employee confidentiality, maintain corporate compliance, and oversee equitable onboarding standards.`
                        : `You will be evaluated on technical deliverable quality, sprint SLA adherence, and proactive collaboration in daily standups.`} All intellectual property, designs, and code remain exclusive enterprise property of {activeCompanyName}.
                  </p>

                  {/* Interactive Handwritten Signature Area */}
                  <div className="signature-block">
                    <div className="sig-header-row">
                      <span className="sig-instruction">
                        {isManager 
                          ? 'EXECUTIVE DIGITAL SIGNATURE (SIGN WITH FINGER / MOUSE)' 
                          : isHr 
                            ? 'HR COMMISSIONER SIGNATURE (SIGN WITH FINGER / MOUSE)' 
                            : 'EMPLOYEE VIRTUAL SIGNATURE (SIGN WITH FINGER / MOUSE)'}
                      </span>
                      <button type="button" className="btn-clear-sig" id="btnClearSig" onClick={handleClearSig}>
                        Clear Signature
                      </button>
                    </div>

                    <div className="signature-pad-wrapper">
                      <canvas
                        ref={canvasRef}
                        id="sigCanvas"
                        width={540}
                        height={110}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <div className="sig-baseline"></div>
                      {!isSigned && strokeCount === 0 && (
                        <span className="sig-placeholder-text" id="sigPlaceholder">
                          Draw your signature here...
                        </span>
                      )}
                    </div>

                    <div className="signature-action-bar">
                      <div className="sig-audit-info" id="sigAuditInfo">
                        <span className="sig-status-dot" style={{ backgroundColor: isSigned ? '#10b981' : '#f59e0b' }}></span>
                        <span id="sigStatusText">
                          {isSigned
                            ? `Adopted: ${new Date().toLocaleTimeString()} (VERIFIED)`
                            : 'Awaiting handwritten digital signature above'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`btn-adopt-sig ${strokeCount >= 3 ? '' : 'disabled'}`}
                        id="btnAdoptSig"
                        disabled={strokeCount < 3}
                        onClick={handleAdoptSig}
                      >
                        Adopt Signature &amp; File Contract
                      </button>
                    </div>
                  </div>

                  {/* Official Red Ink Stamp (Appears upon signing) */}
                  <div className={`official-ink-stamp ${isSigned ? 'stamped' : ''}`} id="officialInkStamp">
                    <div className="stamp-inner">
                      <span className="stamp-org">{activeCompanyName.toUpperCase()} CORP</span>
                      <span className="stamp-action">COUNTERSIGNED &amp; FILED</span>
                      <span className="stamp-date" id="stampDate">SEP 11, 2026</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="step-actions">
                <button type="button" className="btn-step-back" id="btnStep3Back" onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className={`btn-step-next ${isSigned ? '' : 'disabled'}`}
                  id="btnStep3Next"
                  disabled={!isSigned}
                  onClick={() => {
                    saveProgressDraft({ currentStep: 4, isSigned: true, signatureDataUrl: signatureUrl });
                    setStep(4);
                  }}
                >
                  {isManager ? 'View Assigned Squad →' : isHr ? 'View Corporate Workforce →' : 'Meet Manager & Team →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Reporting Manager & Squad (Or Direct Reports for Managers) */}
          {step === 4 && (
            <div className="onboard-step active" id="step4">
              <div className="step-header">
                <span className="step-kicker">
                  {isManager 
                    ? `STEP 04 · YOUR ASSIGNED SQUAD AT ${activeCompanyName.toUpperCase()}` 
                    : isHr 
                      ? `STEP 04 · WORKFORCE GOVERNANCE` 
                      : 'STEP 04'}
                </span>
                <h3 className="step-title">
                  {isManager 
                    ? `Your Direct Reports at ${activeCompanyName}` 
                    : isHr 
                      ? `Registered Workforce at ${activeCompanyName}` 
                      : 'Reporting Manager & Team'}
                </h3>
                <p className="step-desc">
                  {isManager 
                    ? `These are the engineers registered under ${activeCompanyName} in the corporate database who report directly to you for sprint tasks, 1-on-1s, and PR merge reviews.` 
                    : isHr 
                      ? `Active employee headcount and verified contract holders in ${activeCompanyName}'s enterprise directory.` 
                      : 'Meet your direct reporting manager and the virtual teammates you will collaborate with.'}
                </p>
              </div>

              {/* MANAGER VIEW: Live direct reports from database for active company */}
              {isManager && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Executive Lead Summary Card */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Executive Leadership Scope
                      </div>
                      <div style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
                        {selectedRole.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
                        Company: <span style={{ color: '#ffffff', fontWeight: 600 }}>{activeCompanyName}</span> · Domain: <span className="mono" style={{ color: '#a1a1aa' }}>@{activeCompanyDomain}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '980px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        fontWeight: 600
                      }}>
                        {companyEmployees.length} {companyEmployees.length === 1 ? 'Engineer' : 'Engineers'} in Database
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '980px',
                        background: selectedSquadEmpIds.length > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        border: selectedSquadEmpIds.length > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: selectedSquadEmpIds.length > 0 ? '#34d399' : '#a1a1aa',
                        fontWeight: 600
                      }}>
                        {selectedSquadEmpIds.length} Assigned to Squad
                      </span>
                    </div>
                  </div>

                  {/* Direct Reports List */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h5 style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
                          Engineers at {activeCompanyName}
                        </h5>
                        <p style={{ fontSize: '0.72rem', color: '#71717a', margin: '2px 0 0' }}>
                          Select the engineers who will report directly to you for sprint tasks, 1-on-1s, and PR reviews.
                        </p>
                      </div>

                      {companyEmployees.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={selectAllSquad}
                            style={{
                              fontSize: '0.7rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#ffffff',
                              cursor: 'pointer'
                            }}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={deselectAllSquad}
                            style={{
                              fontSize: '0.7rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#a1a1aa',
                              cursor: 'pointer'
                            }}
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={fetchCompanyEmployees}
                            title="Refresh from Database"
                            style={{
                              fontSize: '0.7rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#a1a1aa',
                              cursor: 'pointer'
                            }}
                          >
                            ↻
                          </button>
                        </div>
                      )}
                    </div>

                    {loadingEmployees ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', color: '#71717a', fontSize: '0.82rem' }}>
                        <div className="pulse-indicator" style={{ margin: '0 auto 0.75rem' }}></div>
                        Fetching registered engineers for {activeCompanyName} from database...
                      </div>
                    ) : companyEmployees.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                        {companyEmployees.map(emp => {
                          const isAssigned = selectedSquadEmpIds.includes(emp.empId);
                          return (
                            <div
                              key={emp.empId}
                              onClick={() => toggleSquadMember(emp.empId)}
                              style={{
                                background: isAssigned ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                border: isAssigned ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '0.9rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.55rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isAssigned ? '0 0 16px rgba(59, 130, 246, 0.1)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                                  <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    color: '#ffffff',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                  }}>
                                    {emp.avatarUrl ? (
                                      <img src={emp.avatarUrl} alt={emp.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      (emp.fullName || 'E').slice(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {emp.fullName}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>
                                      {emp.empId} · @{emp.handle}
                                    </div>
                                  </div>
                                </div>

                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '5px',
                                  background: isAssigned ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                                  border: isAssigned ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}>
                                  {isAssigned ? '✓' : ''}
                                </div>
                              </div>

                              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.45rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 500 }}>
                                  {emp.selectedRole?.title || 'Engineering Recruit'}
                                </div>
                                <div className="mono" style={{ fontSize: '0.66rem', color: '#71717a', marginTop: '2px', wordBreak: 'break-all' }}>
                                  {emp.corporateEmail}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                                <span style={{
                                  fontSize: '0.65rem',
                                  color: isAssigned ? '#10b981' : '#a1a1aa',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 600
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAssigned ? '#10b981' : '#71717a' }}></span>
                                  {isAssigned ? 'Assigned to Your Squad' : 'Available in Company'}
                                </span>
                                <span style={{ fontSize: '0.64rem', color: '#71717a', textTransform: 'uppercase' }}>
                                  {emp.department || 'engineering'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{
                        padding: '2.5rem 1.5rem',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px dashed rgba(255, 255, 255, 0.12)',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          margin: '0 auto 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <h4 style={{ color: '#ffffff', fontSize: '0.96rem', fontWeight: 600, margin: 0 }}>
                          No Registered Engineers at {activeCompanyName} Yet
                        </h4>
                        <p style={{ color: '#8e8e93', fontSize: '0.8rem', maxWidth: '440px', margin: '0.5rem auto 0', lineHeight: 1.5 }}>
                          There are currently no registered engineers at {activeCompanyName}. Once real employees create an account and select {activeCompanyName}, they will automatically appear here in your squad roster for sprint delegation and PR reviews.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* HR VIEW: Corporate headcount overview */}
              {isHr && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        HR Administration Scope
                      </div>
                      <div style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
                        {selectedRole.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: '2px' }}>
                        Tenant Organization: <span style={{ color: '#ffffff', fontWeight: 500 }}>{activeCompanyName}</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '4px 10px',
                      borderRadius: '980px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      fontWeight: 600
                    }}>
                      {companyEmployees.length} Registered Workforce
                    </span>
                  </div>

                  <div>
                    <h5 style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Corporate Employee Headcount
                    </h5>
                    {companyEmployees.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                        {companyEmployees.map(emp => (
                          <div
                            key={emp.empId}
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '12px',
                              padding: '0.9rem'
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#ffffff' }}>{emp.fullName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>{emp.selectedRole?.title} · {emp.empId}</div>
                            <div className="mono" style={{ fontSize: '0.66rem', color: '#71717a', marginTop: '4px' }}>{emp.corporateEmail}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#71717a', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        No employees registered under {activeCompanyName} yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EMPLOYEE VIEW: Traditional Reporting Manager & Squad */}
              {!isManager && !isHr && (
                <>
                  {/* Clean Manager Card */}
                  <div className="manager-card" id="managerCard">
                    <div className="manager-avatar-initials" id="mgrInitials">{selectedRole.manager.initials}</div>
                    <div className="manager-info">
                      <div className="manager-header-row">
                        <h4 className="manager-name" id="mgrName">{selectedRole.manager.name}</h4>
                        <span className="manager-role-tag" id="mgrRole">{selectedRole.manager.title}</span>
                      </div>
                      <p className="manager-quote" id="mgrQuote">
                        "{selectedRole.manager.quote}"
                      </p>
                      <div className="manager-cadence">
                        <span className="cadence-item">Daily Standup: 10:00 AM</span>
                        <span className="cadence-sep">·</span>
                        <span className="cadence-item">Channel: #eng-core</span>
                        <span className="cadence-sep">·</span>
                        <span className="cadence-item">1-on-1: Thursdays</span>
                      </div>
                    </div>
                  </div>

                  {/* Teammates Roster */}
                  <div className="teammates-section">
                    <h5 className="teammates-heading">Squad Members</h5>
                    <div className="teammates-grid" id="teammatesGrid">
                      {selectedRole.teammates.map((tm, idx) => (
                        <div key={idx} className="teammate-card">
                          <div className="teammate-avatar-initials">{tm.avatar}</div>
                          <div className="teammate-info">
                            <span className="teammate-name">{tm.name}</span>
                            <span className="teammate-role">{tm.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="step-actions">
                <button type="button" className="btn-step-back" id="btnStep4Back" onClick={() => setStep(3)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn-step-next"
                  id="btnStep4Next"
                  onClick={() => {
                    saveProgressDraft({ currentStep: 5 });
                    setStep(5);
                  }}
                >
                  {isManager ? 'Issue Executive Badge →' : isHr ? 'Issue HR Badge →' : 'Issue Corporate Badge →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Corporate ID Badge & Complete */}
          {step === 5 && (
            <div className="onboard-step active" id="step5">
              <div className="step-header">
                <span className="step-kicker">STEP 05 · ONBOARDING COMPLETE</span>
                <h3 className="step-title">Official Employee Badge</h3>
                <p className="step-desc">Your credentials have been provisioned in the enterprise directory.</p>
              </div>

              {/* Professional Corporate ID Badge Assembly with Lanyard & Clip */}
              <div className="badge-scene">
                <div className="badge-lanyard-assembly">
                  <div className="lanyard-ribbon"></div>
                  <div className="lanyard-hardware">
                    <div className="lanyard-loop"></div>
                    <div className="lanyard-clip">
                      <div className="clip-spring"></div>
                      <div className="clip-jaw"></div>
                    </div>
                  </div>
                </div>

                {/* Authentic RFID Corporate Smartcard */}
                <div
                  className="corporate-id-card"
                  id="holographicBadge"
                  ref={badgeCardRef}
                  onMouseMove={handleBadgeMouseMove}
                  onMouseLeave={handleBadgeMouseLeave}
                >
                  {/* Holographic Sheen Overlay */}
                  <div className="card-sheen" id="cardSheen" ref={sheenRef}></div>

                  {/* Top Slot Punch-hole for Lanyard Clip */}
                  <div className="card-slot-punch"></div>

                  {/* Card Header */}
                  <div className="id-card-header">
                    <div className="id-brand-group">
                      <div className="id-logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M2 12L12 17L22 12" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="id-brand-text">
                        <span className="id-brand-name">{activeCompanyName.toUpperCase()}</span>
                        <span className="id-brand-sub">ENTERPRISE IDENTITY &amp; ACCESS</span>
                      </div>
                    </div>
                    <div className="id-nfc-indicator" title="RFID Contactless Enabled">
                      <svg className="nfc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8.5 16.5C7.5 15.5 7 14 7 12s.5-3.5 1.5-4.5"/>
                        <path d="M12 19c-2-2-3-4.5-3-7s1-5 3-7"/>
                        <path d="M15.5 21.5c-2.8-2.8-4-6.5-4-9.5s1.2-6.7 4-9.5"/>
                      </svg>
                    </div>
                  </div>

                  {/* Smart Chip & Clearance Row */}
                  <div className="id-chip-row">
                    {/* Realistic Gold EMV Contact Chip */}
                    <div className="emv-chip" title="Encrypted Cryptographic Core">
                      <div className="chip-line horiz"></div>
                      <div className="chip-line vert"></div>
                      <div className="chip-core"></div>
                    </div>
                    <div className="id-tier-badge">
                      <span className="tier-dot"></span>
                      <span className="tier-label" id="badgeTier">
                        {isManager ? (selectedRole.level || 'LEVEL M1 · SQUAD LEAD') : isHr ? (selectedRole.level || 'LEVEL HR1 · LEAD') : 'LEVEL 01 · TIER A'}
                      </span>
                    </div>
                  </div>

                  {/* Main Identity Section: Photo & Personal Credentials */}
                  <div className="id-profile-section">
                    <div className="id-photo-frame">
                      <div className="id-avatar-inner" id="badgeAvatarInner">
                        <svg className="id-avatar-svg" viewBox="0 0 100 100" fill="none">
                          <rect width="100" height="100" fill="#1e222b"/>
                          <circle cx="50" cy="36" r="18" fill="#e2e8f0"/>
                          <path d="M20 86 C20 62, 34 56, 50 56 C66 56, 80 62, 80 86 Z" fill="#94a3b8"/>
                          <path d="M42 56 L50 70 L58 56 Z" fill="#64748b"/>
                          <polygon points="50,68 47,86 53,86" fill="#0f172a"/>
                        </svg>
                      </div>
                      <div className="id-photo-corners">
                        <span className="corner tl"></span><span className="corner tr"></span>
                        <span className="corner bl"></span><span className="corner br"></span>
                      </div>
                      <div className="id-verified-seal">SECURE</div>
                    </div>

                    <div className="id-details">
                      <div className="id-field">
                        <span className="id-label">NAME</span>
                        <h4 className="id-emp-name" id="badgeEmpName">{fullName}</h4>
                      </div>
                      <div className="id-field">
                        <span className="id-label">ORGANIZATION</span>
                        <span className="id-emp-role" style={{ color: '#ffffff', fontWeight: 600 }}>{activeCompanyName}</span>
                      </div>
                      <div className="id-field">
                        <span className="id-label">ALLOTTED CORPORATE EMAIL</span>
                        <span className="id-emp-role mono" style={{ fontSize: '0.74rem', color: '#f4f4f5', fontWeight: 600 }}>
                          {(handle.trim() || 'engineer').toLowerCase().replace(/[^a-z0-9._-]/g, '')}@{activeCompanyDomain}
                        </span>
                      </div>
                      <div className="id-field">
                        <span className="id-label">ROLE / DESIGNATION</span>
                        <span className="id-emp-role" id="badgeEmpRole">{selectedRole.title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Holographic Security Foil Ribbon */}
                  <div className="id-security-foil">
                    <div className="foil-track">
                      <span>SECURE · {activeCompanyName.toUpperCase()} CORP · ENCRYPTED NFC 13.56 MHz · AUTHENTICATED EMPLOYEE · ACCESS GRANTED · </span>
                      <span>SECURE · {activeCompanyName.toUpperCase()} CORP · ENCRYPTED NFC 13.56 MHz · AUTHENTICATED EMPLOYEE · ACCESS GRANTED · </span>
                    </div>
                  </div>

                  {/* Metadata Grid: Emp ID, Issued, Expiry, Sector */}
                  <div className="id-meta-grid">
                    <div className="meta-cell">
                      <span className="m-label">EMP ID</span>
                      <span className="m-val mono" id="badgeIdNumber">{empId}</span>
                    </div>
                    <div className="meta-cell">
                      <span className="m-label">ISSUED</span>
                      <span className="m-val mono" id="badgeIssueDate">09/2026</span>
                    </div>
                    <div className="meta-cell">
                      <span className="m-label">CLEARANCE</span>
                      <span className="m-val mono">
                        {isManager ? 'EXECUTIVE CLEARANCE' : isHr ? 'HR PRIVILEGED' : 'INTERNAL'}
                      </span>
                    </div>
                    <div className="meta-cell">
                      <span className="m-label">STATUS</span>
                      <span className="m-val mono status-ok">ACTIVE</span>
                    </div>
                  </div>

                  {/* Card Footer: Barcode & RFID status */}
                  <div className="id-card-footer">
                    <div className="id-barcode-box">
                      <svg className="svg-barcode" viewBox="0 0 160 26" preserveAspectRatio="none">
                        <rect x="0" y="0" width="3" height="26" fill="#cbd5e1"/>
                        <rect x="5" y="0" width="1.5" height="26" fill="#cbd5e1"/>
                        <rect x="8" y="0" width="4" height="26" fill="#cbd5e1"/>
                        <rect x="14" y="0" width="2" height="26" fill="#cbd5e1"/>
                        <rect x="18" y="0" width="1" height="26" fill="#cbd5e1"/>
                        <rect x="21" y="0" width="3" height="26" fill="#cbd5e1"/>
                        <rect x="26" y="0" width="5" height="26" fill="#cbd5e1"/>
                        <rect x="33" y="0" width="2" height="26" fill="#cbd5e1"/>
                        <rect x="37" y="0" width="1.5" height="26" fill="#cbd5e1"/>
                        <rect x="41" y="0" width="4" height="26" fill="#cbd5e1"/>
                        <rect x="48" y="0" width="2" height="26" fill="#cbd5e1"/>
                        <rect x="52" y="0" width="1" height="26" fill="#cbd5e1"/>
                        <rect x="55" y="0" width="3.5" height="26" fill="#cbd5e1"/>
                        <rect x="61" y="0" width="1.5" height="26" fill="#cbd5e1"/>
                        <rect x="65" y="0" width="4" height="26" fill="#cbd5e1"/>
                        <rect x="71" y="0" width="2.5" height="26" fill="#cbd5e1"/>
                        <rect x="76" y="0" width="1" height="26" fill="#cbd5e1"/>
                        <rect x="80" y="0" width="3" height="26" fill="#cbd5e1"/>
                        <rect x="85" y="0" width="2" height="26" fill="#cbd5e1"/>
                        <rect x="89" y="0" width="4.5" height="26" fill="#cbd5e1"/>
                        <rect x="96" y="0" width="1.5" height="26" fill="#cbd5e1"/>
                        <rect x="100" y="0" width="3" height="26" fill="#cbd5e1"/>
                        <rect x="105" y="0" width="1" height="26" fill="#cbd5e1"/>
                        <rect x="108" y="0" width="4" height="26" fill="#cbd5e1"/>
                        <rect x="114" y="0" width="2" height="26" fill="#cbd5e1"/>
                        <rect x="118" y="0" width="3.5" height="26" fill="#cbd5e1"/>
                        <rect x="124" y="0" width="1.5" height="26" fill="#cbd5e1"/>
                        <rect x="128" y="0" width="4" height="26" fill="#cbd5e1"/>
                        <rect x="134" y="0" width="2" height="26" fill="#cbd5e1"/>
                        <rect x="138" y="0" width="1" height="26" fill="#cbd5e1"/>
                        <rect x="141" y="0" width="3.5" height="26" fill="#cbd5e1"/>
                        <rect x="147" y="0" width="2" height="26" fill="#cbd5e1"/>
                        <rect x="152" y="0" width="4" height="26" fill="#cbd5e1"/>
                      </svg>
                      <span className="barcode-text mono" id="badgeBarcodeText">*{empId}-RFID*</span>
                    </div>

                    <div className="id-live-status">
                      <span className="pulse-indicator"></span>
                      <span className="pulse-text">NFC ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Launch Button */}
              <div className="final-launch-wrapper">
                <button className="btn-enter-workspace" id="btnEnterWorkspace" onClick={handleFinish}>
                  {isManager ? 'Open Manager Command Console →' : isHr ? 'Open HR Command Console →' : 'Step Inside Your Virtual Office →'}
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
