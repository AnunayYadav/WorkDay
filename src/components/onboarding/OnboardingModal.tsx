import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PROBLEMS_DATASET } from '../../lib/dataset';
import type { DepartmentRole, EmployeeState } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (employee: EmployeeState) => void;
  initialData?: EmployeeState | null;
}

type DeptCategory = 'engineering' | 'infrastructure' | 'data' | 'product';

const DIALOGUES: Record<number, string> = {
  1: '"Welcome to VirtualHQ. Today marks Day 1 of your corporate journey. Let’s establish your employee identity and corporate handle."',
  2: '"Every engineer at VirtualHQ drives direct open-source velocity. Select the department and specialization track that fits your technical ambitions."',
  3: '"Here is your official Corporate Appointment Letter. Review the performance benchmarks and execute your handwritten virtual signature below."',
  4: '"Meet your Engineering Director and assigned squad. Your daily standups and code reviews will be coordinated directly through this team."',
  5: '"Your smartcard credentials and Level 1 clearance have been provisioned in the enterprise directory. Step inside your virtual office when you’re ready."'
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialData
}) => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [preferredName, setPreferredName] = useState(initialData?.preferredName || '');
  const [handle, setHandle] = useState(initialData?.handle || '');
  const [empId] = useState(initialData?.empId || `VHQ-${Math.floor(1000 + Math.random() * 9000)}`);
  
  const [activeDept, setActiveDept] = useState<DeptCategory>('engineering');
  const availableRoles = (PROBLEMS_DATASET.DEPARTMENT_ROLES[activeDept] || PROBLEMS_DATASET.DEPARTMENT_ROLES.engineering) as unknown as DepartmentRole[];
  const [selectedRole, setSelectedRole] = useState<DepartmentRole>(
    initialData?.selectedRole || availableRoles[0]
  );

  // Canvas Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSigned, setIsSigned] = useState(initialData?.isSigned || false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>(initialData?.signatureDataUrl || '');
  const [strokeCount, setStrokeCount] = useState(0);

  // 3D badge tilt ref
  const badgeCardRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);

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
      if (initialData.selectedRole) setSelectedRole(initialData.selectedRole);
      if (initialData.signatureDataUrl) setSignatureUrl(initialData.signatureDataUrl);
      if (initialData.isSigned !== undefined) setIsSigned(initialData.isSigned);
    }
  }, [initialData]);

  // Handle signature drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.4;
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
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setStrokeCount(prev => prev + 1);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
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
    }
  };

  const handleAdoptSig = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokeCount < 3) return;
    setSignatureUrl(canvas.toDataURL());
    setIsSigned(true);
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

  const handleFinish = () => {
    confetti({
      particleCount: 140,
      spread: 85,
      origin: { y: 0.6 }
    });

    const cleanHandle = handle.trim() || initialData?.handle || 'engineer';
    const corpEmail = initialData?.corporateEmail || `${cleanHandle}@virtualhq.corp`;

    const emp: EmployeeState = {
      fullName: fullName.trim() || initialData?.fullName || 'Engineering Recruit',
      preferredName: preferredName.trim() || initialData?.preferredName || 'Engineer',
      handle: cleanHandle,
      corporateEmail: corpEmail,
      githubUsername: initialData?.githubUsername || cleanHandle,
      empId,
      department: activeDept,
      selectedRole,
      signatureDataUrl: signatureUrl || '',
      isSigned: true,
      currentStep: 5,
      email: initialData?.email || '',
      avatarUrl: initialData?.avatarUrl || `https://github.com/${initialData?.githubUsername || cleanHandle}.png`,
      authProvider: initialData?.authProvider || 'github',
      userId: initialData?.userId,
      userType: 'employee',
      totalXp: initialData?.totalXp || 200
    };
    onComplete(emp);
  };

  return (
    <div id="onboardingModal" className={`onboarding-modal ${isOpen ? 'active' : ''}`} aria-hidden={!isOpen}>
      {/* Onboarding Header */}
      <header className="onboard-header">
        <div className="header-left">
          <span className="company-tag">VIRTUALHQ CORP</span>
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
                <h3 className="step-title">Employee Identity</h3>
                <p className="step-desc">Establish your official employee identity within the VirtualHQ corporate directory.</p>
              </div>

              <form id="profileForm" className="onboard-form" onSubmit={(e) => e.preventDefault()}>
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
                  <label htmlFor="empHandle">Corporate Email Handle</label>
                  <div className="input-with-suffix">
                    <input
                      type="text"
                      id="empHandle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      placeholder="first.last"
                    />
                    <span className="suffix">@virtualhq.corp</span>
                  </div>
                </div>

                <div className="step-actions right-align">
                  <button
                    type="button"
                    className="btn-step-next"
                    id="btnStep1Next"
                    onClick={() => {
                      if (!fullName.trim()) return alert('Please enter your full name');
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
                <span className="step-kicker">STEP 02</span>
                <h3 className="step-title">Department & Career Track</h3>
                <p className="step-desc">Select your specialization. Your daily tickets, reporting manager, and codebase will align with this track.</p>
              </div>

              {/* Department Selector Chips */}
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

              {/* Minimalist Role List */}
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
                <button type="button" className="btn-step-next" id="btnStep2Next" onClick={() => setStep(3)}>
                  Review Offer Letter →
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
                    <div className="letterhead-seal">VH</div>
                    <div className="letterhead-details">
                      <span className="letterhead-company">VIRTUALHQ TECHNOLOGIES INC.</span>
                      <span className="letterhead-dept">DIVISION OF HUMAN CAPITAL & EXECUTIVE TALENT · 100 ENTERPRISE BLVD</span>
                    </div>
                  </div>
                  <div className="letterhead-meta">
                    <span className="paper-date" id="paperDocDate">September 10, 2026</span>
                    <span className="paper-ref mono" id="offerRefCode">REF: {empId}-EMP</span>
                  </div>
                </div>

                <div className="paper-divider"></div>

                {/* Paper Body Text */}
                <div className="paper-body">
                  <div className="recipient-box">
                    <span className="confidential-label">STRICTLY CONFIDENTIAL · EMPLOYEE APPOINTMENT</span>
                    <h4 className="recip-name" id="offerCandidateName">{fullName}</h4>
                    <span className="recip-title" id="offerRoleTitle">{selectedRole.title}</span>
                    <span className="recip-dept" id="offerDeptName">{selectedRole.title} Department</span>
                  </div>

                  <p className="paper-paragraph">
                    Dear <strong id="salutationName">{preferredName}</strong>,
                  </p>

                  <p className="paper-paragraph">
                    On behalf of the Executive Leadership of <strong>VirtualHQ Technologies Inc.</strong>, we are pleased to confirm your appointment as{' '}
                    <strong id="letterRole">{selectedRole.title}</strong> in our <strong id="letterDept">{selectedRole.title} Department</strong>.{' '}
                    In this capacity, you will report directly to <strong id="letterManager">{selectedRole.manager.name} ({selectedRole.manager.title})</strong>.
                  </p>

                  {/* Paper Terms Table */}
                  <table className="paper-terms-table">
                    <tbody>
                      <tr>
                        <td className="col-label">Employee Identification</td>
                        <td className="col-val mono" id="offerEmpId">{empId}</td>
                      </tr>
                      <tr>
                        <td className="col-label">Reporting Line</td>
                        <td className="col-val" id="offerHierarchy">VP Engineering → {selectedRole.manager.name} → You</td>
                      </tr>
                      <tr>
                        <td className="col-label">Performance Stipend</td>
                        <td className="col-val mono">2,400 Corporate Performance Credits / Sprint</td>
                      </tr>
                      <tr>
                        <td className="col-label">Probationary Milestone</td>
                        <td className="col-val">Sprint 01 Task Submission & Manager Code Review</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="paper-paragraph legal-clause">
                    <strong>Terms of Induction:</strong> You will be evaluated on technical deliverable quality, sprint SLA adherence, and proactive collaboration in daily standups. All code, design assets, and documentation authored within VirtualHQ remain proprietary enterprise property.
                  </p>

                  {/* Interactive Handwritten Signature Area */}
                  <div className="signature-block">
                    <div className="sig-header-row">
                      <span className="sig-instruction">EMPLOYEE VIRTUAL SIGNATURE (SIGN WITH FINGER / MOUSE)</span>
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
                        Adopt Signature & File Contract
                      </button>
                    </div>
                  </div>

                  {/* Official Red Ink Stamp (Appears upon signing) */}
                  <div className={`official-ink-stamp ${isSigned ? 'stamped' : ''}`} id="officialInkStamp">
                    <div className="stamp-inner">
                      <span className="stamp-org">VIRTUALHQ INC.</span>
                      <span className="stamp-action">COUNTERSIGNED & FILED</span>
                      <span className="stamp-date" id="stampDate">SEP 10, 2026</span>
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
                  onClick={() => setStep(4)}
                >
                  Meet Manager & Team →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Reporting Manager & Squad */}
          {step === 4 && (
            <div className="onboard-step active" id="step4">
              <div className="step-header">
                <span className="step-kicker">STEP 04</span>
                <h3 className="step-title">Reporting Manager & Team</h3>
                <p className="step-desc">Meet your direct reporting manager and the virtual teammates you will collaborate with.</p>
              </div>

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

              <div className="step-actions">
                <button type="button" className="btn-step-back" id="btnStep4Back" onClick={() => setStep(3)}>
                  ← Back
                </button>
                <button type="button" className="btn-step-next" id="btnStep4Next" onClick={() => setStep(5)}>
                  Issue Corporate Badge →
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
                        <span className="id-brand-name">VIRTUALHQ</span>
                        <span className="id-brand-sub">IDENTITY & SECURITY MANAGEMENT</span>
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
                      <span className="tier-label" id="badgeTier">LEVEL 01 · TIER A</span>
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
                        <span className="id-label">ALLOTTED CORPORATE EMAIL</span>
                        <span className="id-emp-role mono" style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
                          {initialData?.corporateEmail || `${handle.trim() || 'engineer'}@virtualhq.corp`}
                        </span>
                      </div>
                      <div className="id-field">
                        <span className="id-label">ROLE / DESIGNATION</span>
                        <span className="id-emp-role" id="badgeEmpRole">{selectedRole.title}</span>
                      </div>
                      <div className="id-field">
                        <span className="id-label">DIVISION</span>
                        <span className="id-emp-dept" id="badgeEmpDept">{selectedRole.title} DIVISION</span>
                      </div>
                    </div>
                  </div>

                  {/* Holographic Security Foil Ribbon */}
                  <div className="id-security-foil">
                    <div className="foil-track">
                      <span>SECURE · VIRTUALHQ CORP · ENCRYPTED NFC 13.56 MHz · AUTHENTICATED EMPLOYEE · ACCESS GRANTED · </span>
                      <span>SECURE · VIRTUALHQ CORP · ENCRYPTED NFC 13.56 MHz · AUTHENTICATED EMPLOYEE · ACCESS GRANTED · </span>
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
                      <span className="m-val mono">INTERNAL</span>
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
                  Step Inside Your Virtual Office →
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
