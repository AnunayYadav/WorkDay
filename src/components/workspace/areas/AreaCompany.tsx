import React, { useState, useEffect } from 'react';
import type { EmployeeState, Company } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';

interface AreaCompanyProps {
  employee?: EmployeeState;
}

export const AreaCompany: React.FC<AreaCompanyProps> = ({ employee }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [companyEmployees, setCompanyEmployees] = useState<EmployeeState[]>([]);
  const [loading, setLoading] = useState(true);

  const empCompanyName = employee?.companyName || 'Stripe';
  const empCompanyDomain = employee?.companyDomain || 'stripe.corp';

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      CloudStorage.getCompany(empCompanyName || empCompanyDomain),
      CloudStorage.listProfiles()
    ]).then(([comp, profiles]) => {
      if (!isMounted) return;

      if (comp) {
        setCompany(comp);
      } else {
        // Construct standard company fallback if not found in db
        setCompany({
          id: empCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: empCompanyName,
          domain: empCompanyDomain,
          tagline: `${empCompanyName} Enterprise Engineering & Infrastructure`,
          description: `${empCompanyName} builds industry-leading platforms and open-source infrastructure for developers worldwide.`,
          headquarters: 'San Francisco, CA',
          founded: '2015',
          metrics: {
            headcount: '5,000+',
            valuation: 'Enterprise Leader',
            uptime: '99.99%',
            compliance: 'SOC 2 Type II · ISO 27001'
          },
          leadership: [
            { name: employee?.selectedRole?.manager?.name || 'Marcus Vance', role: 'VP of Engineering', dept: 'ENGINEERING', initials: 'MV' },
            { name: 'Elena Rostova', role: 'Chief Executive Officer', dept: 'EXECUTIVE', initials: 'ER' },
            { name: 'David Park', role: 'Chief Technology Officer', dept: 'TECHNOLOGY', initials: 'DP' }
          ],
          benefits: [
            { title: 'Global Healthcare & Wellness', desc: '100% employer-sponsored health, dental, and vision coverage.', tier: 'HEALTH' },
            { title: 'Home Office & Equipment', desc: 'Top-tier workstation allowance plus continuous monthly broadband stipend.', tier: 'STIPEND' },
            { title: 'Continuous Learning Grant', desc: '$2,500 annual budget for conferences, courses, and certifications.', tier: 'GROWTH' }
          ],
          techStack: ['TypeScript', 'React', 'Node.js', 'Go', 'PostgreSQL', 'Docker', 'AWS']
        });
      }

      // Filter colleagues from same company
      const sameCompany = profiles.filter(p => 
        p.companyName?.toLowerCase() === empCompanyName.toLowerCase() ||
        p.companyDomain?.toLowerCase() === empCompanyDomain.toLowerCase()
      );
      setCompanyEmployees(sameCompany.length > 0 ? sameCompany : profiles);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [empCompanyName, empCompanyDomain]);

  const userName = employee?.fullName || 'Engineering Recruit';
  const roleTitle = employee?.selectedRole?.title || 'Engineer';
  const deptName = (employee?.department ? employee.department.charAt(0).toUpperCase() + employee.department.slice(1) : 'Engineering') + ' Division';
  const mgrName = employee?.selectedRole?.manager?.name || 'Executive Director';
  const empIdStr = employee?.empId || 'WD-1001';

  if (loading && !company) {
    return (
      <section className="workspace-area active" id="areaCompany">
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#71717a' }}>
          <div className="pulse-indicator" style={{ margin: '0 auto 1rem' }}></div>
          Loading corporate directory &amp; repository...
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-area active" id="areaCompany">
      {/* Area Header */}
      <div className="area-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <span className="mono" style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.7rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                color: '#e4e4e7',
                letterSpacing: '0.05em'
              }}>
                WORKDAY CORPORATE REPOSITORY
              </span>
              <span style={{ fontSize: '0.8rem', color: '#71717a' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Verified Cloud Tenant</span>
            </div>
            <h1 className="area-title">{company?.name || empCompanyName} Portal &amp; Directory</h1>
            <p className="area-subtitle">
              Corporate overview, executive leadership, verified digital employment contract deed, and organization directory.
            </p>
          </div>
        </div>
      </div>

      {/* Enterprise Company Overview Banner */}
      <div className="company-overview-banner">
        <div className="comp-header-row">
          <div className="comp-title-block">
            <div className="comp-logo-box">
              {(company?.name || empCompanyName).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="comp-name-title">{company?.name || empCompanyName}</h2>
              <p className="comp-tagline">{company?.tagline || 'Enterprise Technology Organization'}</p>
            </div>
          </div>
          <div className="comp-headquarters-pill mono">
            📍 {company?.headquarters || 'San Francisco, CA'} · Founded {company?.founded || '2015'}
          </div>
        </div>

        {/* Key Corporate Metrics */}
        <div className="comp-metrics-grid">
          <div className="comp-metric-item">
            <span className="comp-m-val mono">{company?.metrics?.headcount || `${companyEmployees.length}+`}</span>
            <span className="comp-m-label">Global Headcount</span>
            <span className="comp-m-sub mono">Registered in Supabase Directory</span>
          </div>
          <div className="comp-metric-item">
            <span className="comp-m-val mono">{company?.metrics?.valuation || 'Series B'}</span>
            <span className="comp-m-label">Enterprise Capitalization</span>
            <span className="comp-m-sub mono">Verified Market Tier</span>
          </div>
          <div className="comp-metric-item">
            <span className="comp-m-val mono">{company?.metrics?.uptime || '99.99%'}</span>
            <span className="comp-m-label">Production SLA</span>
            <span className="comp-m-sub mono">Global Edge Latency &lt; 25ms</span>
          </div>
          <div className="comp-metric-item">
            <span className="comp-m-val mono">{company?.metrics?.compliance || 'SOC 2'}</span>
            <span className="comp-m-label">Compliance &amp; Security</span>
            <span className="comp-m-sub mono">Audit Certified</span>
          </div>
        </div>
      </div>

      {/* Section 1: Executive Leadership & Corporate Hierarchy */}
      <div className="company-section">
        <div className="section-kicker-row">
          <span className="card-kicker">EXECUTIVE LEADERSHIP &amp; SQUAD HEADS</span>
          <span className="roadmap-note mono">OFFICE OF THE CEO &amp; OPERATING COMMITTEE</span>
        </div>

        <div className="leadership-grid">
          {(company?.leadership && company.leadership.length > 0 ? company.leadership : [
            { name: mgrName, role: 'VP of Engineering', dept: 'ENGINEERING', initials: 'MV' },
            { name: 'Elena Rostova', role: 'Chief Executive Officer', dept: 'EXECUTIVE', initials: 'ER' },
            { name: 'David Park', role: 'Chief Financial Officer', dept: 'FINANCE', initials: 'DP' }
          ]).map((leader, idx) => (
            <div key={idx} className="exec-leader-card">
              <div className="exec-avatar">{leader.initials || leader.name.slice(0, 2).toUpperCase()}</div>
              <div className="exec-meta">
                <span className="exec-name">{leader.name}</span>
                <span className="exec-role">{leader.role}</span>
                <span className="exec-dept mono">{leader.dept}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Technology Stack & Core Competencies */}
      {company?.techStack && company.techStack.length > 0 && (
        <div className="company-section">
          <div className="section-kicker-row">
            <span className="card-kicker">PRIMARY TECHNOLOGY STACK &amp; FRAMEWORKS</span>
            <span className="roadmap-note mono">VERIFIED PRODUCTION RUNTIME</span>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {company.techStack.map((tech) => (
              <span
                key={tech}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#e4e4e7',
                  fontSize: '0.82rem',
                  fontWeight: 500
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Official Employee Employment Records & Signed Deed */}
      <div className="company-section">
        <div className="section-kicker-row">
          <span className="card-kicker">OFFICIAL EMPLOYEE RECORDS &amp; CREDENTIALS</span>
          <span className="roadmap-note mono">DIGITALLY VERIFIED REPOSITORY</span>
        </div>
        <div className="hr-grid">
          {/* Left Column: Archived Signed Paper Offer Letter View */}
          <div className="hr-contract-col">
            <div className="executive-card hr-contract-card">
              <div className="contract-card-header">
                <div>
                  <span className="card-kicker">OFFICIAL CONTRACT ARCHIVE</span>
                  <h3 className="contract-headline">Executive Appointment Order</h3>
                </div>
                <span className="contract-sealed-badge mono">✓ COUNTERSIGNED &amp; FILED</span>
              </div>

              {/* Archived Paper Letter Container */}
              <div className="archived-paper-letter">
                <div className="archived-letter-header">
                  <div className="archived-seal">{(company?.name || empCompanyName).slice(0, 2).toUpperCase()}</div>
                  <div>
                    <span className="a-company">{(company?.name || empCompanyName).toUpperCase()} TECHNOLOGIES INC.</span>
                    <span className="a-sub">DIVISION OF HUMAN CAPITAL &amp; EXECUTIVE TALENT</span>
                  </div>
                  <span className="a-ref mono" id="hrContractRef">REF: {empIdStr}-EMP</span>
                </div>

                <div className="a-body">
                  <p className="a-p">
                    This official deed confirms the appointment of <strong style={{ color: '#0f172a' }}>{userName}</strong> as{' '}
                    <strong>{roleTitle}</strong> in the <strong>{deptName}</strong> at {company?.name || empCompanyName}.
                  </p>

                  <div className="a-terms-mini">
                    <div className="a-row">
                      <span className="a-lbl">Employee ID:</span>
                      <span className="a-val mono">{empIdStr}</span>
                    </div>
                    <div className="a-row">
                      <span className="a-lbl">Corporate Email:</span>
                      <span className="a-val mono">{employee?.corporateEmail || `${employee?.handle || 'engineer'}@${empCompanyDomain}`}</span>
                    </div>
                    <div className="a-row">
                      <span className="a-lbl">Clearance Tier:</span>
                      <span className="a-val mono">LEVEL 01 · TIER A</span>
                    </div>
                    <div className="a-row">
                      <span className="a-lbl">Reporting Line:</span>
                      <span className="a-val">{mgrName}</span>
                    </div>
                  </div>

                  {/* Real Digitally Preserved Signature */}
                  <div className="a-signature-display">
                    <span className="a-sig-label">EXECUTED HANDWRITTEN SIGNATURE:</span>
                    <div className="a-sig-box" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.6rem', textAlign: 'center', minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {employee?.signatureDataUrl ? (
                        <img
                          src={employee.signatureDataUrl}
                          alt="Employee Signature"
                          style={{ maxHeight: '52px', objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>
                          Verified Digital Fingerprint on Record
                        </span>
                      )}
                    </div>
                    <span className="a-sig-sub mono">DIGITALLY SEALED IN SUPABASE ENTERPRISE VAULT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Organization Roster */}
          <div className="hr-benefits-col">
            <div className="executive-card">
              <div className="card-kicker-row">
                <span className="card-kicker">TEAM DIRECTORY</span>
                <span className="mono" style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                  {companyEmployees.length} COLLEAGUES
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.8rem' }}>
                {company?.name || empCompanyName} Squad Roster
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '340px', overflowY: 'auto' }}>
                {companyEmployees.map(colleague => (
                  <div
                    key={colleague.empId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                        {colleague.fullName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                        {colleague.selectedRole?.title || 'Engineer'} · <span className="mono">{colleague.empId}</span>
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                      {colleague.userType ? colleague.userType.toUpperCase() : 'EMPLOYEE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Corporate Benefits */}
            {company?.benefits && company.benefits.length > 0 && (
              <div className="executive-card" style={{ marginTop: '1.25rem' }}>
                <div className="card-kicker-row">
                  <span className="card-kicker">CORPORATE BENEFITS &amp; PERKS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {company.benefits.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.6rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#f4f4f5' }}>{b.title}</strong>
                        <span className="mono" style={{ fontSize: '0.68rem', color: '#4ade80' }}>{b.tier}</span>
                      </div>
                      <p style={{ fontSize: '0.74rem', color: '#71717a', margin: 0 }}>{b.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
