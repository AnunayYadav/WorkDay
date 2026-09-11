import React from 'react';
import type { EmployeeState } from '../../../types';

interface AreaCompanyProps {
  employee?: EmployeeState;
}

export const AreaCompany: React.FC<AreaCompanyProps> = ({ employee }) => {
  const userName = employee?.fullName || 'Corporate Member';
  const userInitials = employee?.preferredName ? employee.preferredName.slice(0, 2).toUpperCase() : 'HQ';
  const roleTitle = employee?.selectedRole?.title || 'Engineer';
  const deptName = (employee?.department ? employee.department.charAt(0).toUpperCase() + employee.department.slice(1) : 'Engineering') + ' Division';
  const mgrName = employee?.selectedRole?.manager?.name || 'Executive Director';
  const mgrTitle = employee?.selectedRole?.manager?.title || 'Division Head';
  const empIdStr = employee?.empId || 'VHQ-8302';

  return (
    <section className="workspace-area active" id="areaCompany">
          <div className="area-header">
            <h1 className="area-title">Company Portal &amp; Directory</h1>
            <p className="area-subtitle">VirtualHQ Technologies Inc. corporate overview, executive leadership, official employment records, enterprise benefits, and single sign-on system access.</p>
          </div>

          {/* Enterprise Company Overview Banner */}
          <div className="company-overview-banner">
            <div className="comp-header-row">
              <div className="comp-title-block">
                <div className="comp-logo-box">VH</div>
                <div>
                  <h2 className="comp-name-title">VirtualHQ Technologies Inc.</h2>
                  <p className="comp-tagline">Enterprise Distributed Workplace Infrastructure &amp; Cloud Workspaces · Delaware C-Corp</p>
                </div>
              </div>
              <div className="comp-headquarters-pill mono">
                📍 101 Mission St, Suite 2400, San Francisco, CA 94105
              </div>
            </div>

            {/* Key Corporate Metrics */}
            <div className="comp-metrics-grid">
              <div className="comp-metric-item">
                <span className="comp-m-val mono">428+</span>
                <span className="comp-m-label">Global Team Members</span>
                <span className="comp-m-sub mono">Distributed across 22 countries</span>
              </div>
              <div className="comp-metric-item">
                <span className="comp-m-val mono">Series B</span>
                <span className="comp-m-label">Capitalization ($48M Raised)</span>
                <span className="comp-m-sub mono">Lead: Benchmark &amp; Sequoia</span>
              </div>
              <div className="comp-metric-item">
                <span className="comp-m-val mono">99.994%</span>
                <span className="comp-m-label">Enterprise Cloud SLA</span>
                <span className="comp-m-sub mono">Global Edge Latency &lt; 28ms</span>
              </div>
              <div className="comp-metric-item">
                <span className="comp-m-val mono">SOC 2 / ISO</span>
                <span className="comp-m-label">Security &amp; Compliance</span>
                <span className="comp-m-sub mono">Type II Verified &amp; ISO-27001</span>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Leadership & Corporate Hierarchy */}
          <div className="company-section">
            <div className="section-kicker-row">
              <span className="card-kicker">EXECUTIVE LEADERSHIP &amp; DEPARTMENT HEADS</span>
              <span className="roadmap-note mono">OFFICE OF THE CEO &amp; OPERATING COMMITTEE</span>
            </div>
            <div className="leadership-grid">
              <div className="exec-leader-card">
                <div className="exec-avatar">ER</div>
                <div className="exec-meta">
                  <span className="exec-name">Elena Rostova</span>
                  <span className="exec-role">Founder &amp; Chief Executive Officer</span>
                  <span className="exec-dept mono">EXECUTIVE OFFICE</span>
                </div>
              </div>
              <div className="exec-leader-card">
                <div className="exec-avatar">MV</div>
                <div className="exec-meta">
                  <span className="exec-name">Marcus Vance</span>
                  <span className="exec-role">VP of Engineering &amp; Technology</span>
                  <span className="exec-dept mono">ENGINEERING &amp; INFRA</span>
                </div>
              </div>
              <div className="exec-leader-card">
                <div className="exec-avatar">CM</div>
                <div className="exec-meta">
                  <span className="exec-name">Claire Moreau</span>
                  <span className="exec-role">Chief Product Officer</span>
                  <span className="exec-dept mono">PRODUCT &amp; DESIGN</span>
                </div>
              </div>
              <div className="exec-leader-card">
                <div className="exec-avatar">DP</div>
                <div className="exec-meta">
                  <span className="exec-name">David Park</span>
                  <span className="exec-role">Chief Financial Officer</span>
                  <span className="exec-dept mono">FINANCE &amp; LEGAL</span>
                </div>
              </div>
              <div className="exec-leader-card">
                <div className="exec-avatar">EV</div>
                <div className="exec-meta">
                  <span className="exec-name">Elena Vance</span>
                  <span className="exec-role">Head of People &amp; Talent</span>
                  <span className="exec-dept mono">HUMAN OPERATIONS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Official Employee Employment Records & Smartcard */}
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

                  {/* Archived Mini Paper Letter Container */}
                  <div className="archived-paper-letter">
                    <div className="archived-letter-header">
                      <div className="archived-seal">VH</div>
                      <div>
                        <span className="a-company">VIRTUALHQ TECHNOLOGIES INC.</span>
                        <span className="a-sub">DIVISION OF HUMAN CAPITAL &amp; EXECUTIVE TALENT</span>
                      </div>
                      <span className="a-ref mono" id="hrContractRef">REF: {empIdStr}-EMP</span>
                    </div>
                    
                    <div className="a-divider"></div>

                    <p className="a-body-text">
                      This certifies that <strong id="hrCandidateName">{userName}</strong> has been formally inducted into the position of{' '}
                      <strong id="hrRoleTitle">{roleTitle}</strong> within the <strong id="hrDeptTitle">{deptName}</strong>, reporting directly to{' '}
                      <strong id="hrManagerName">{mgrName} ({mgrTitle})</strong>.
                    </p>

                    <div className="a-signatures-row">
                      <div className="a-sig-block">
                        <span className="a-sig-label">AUTHORIZED SIGNATORY</span>
                        <span className="a-script-sig">Elena Vance</span>
                        <span className="a-title">Head of People Operations</span>
                      </div>
                      <div className="a-sig-block">
                        <span className="a-sig-label">EMPLOYEE SIGNATURE</span>
                        {employee?.signatureDataUrl ? (
                          <img src={employee.signatureDataUrl} alt="Signature" style={{ height: '36px', maxWidth: '140px', objectFit: 'contain' }} />
                        ) : (
                          <span className="a-script-sig user-sig" id="hrUserSignatureDisplay">{userName}</span>
                        )}
                        <span className="a-title" id="hrSigTimestamp">Executed &amp; Verified</span>
                      </div>
                    </div>

                    <div className="a-red-stamp">
                      <span>VIRTUALHQ INC. · OFFICIAL ARCHIVE · VERIFIED</span>
                    </div>
                  </div>

                  <div className="contract-download-row">
                    <span className="archive-sha mono">SHA-256: {empIdStr}...e1809</span>
                    <button
                      type="button"
                      className="btn-download-contract"
                      id="btnDownloadContract"
                      onClick={() => alert(`Exporting Official VHQ Employment Contract PDF for ${userName}...`)}
                    >
                      <span>Export Contract PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Employee Badge & Security Clearances */}
              <div className="hr-records-col">
                {/* Employee ID Smartcard Preview Card */}
                <div className="executive-card hr-badge-card">
                  <div className="card-kicker-row">
                    <span className="card-kicker">SECURITY CLEARANCE SMARTCARD</span>
                    <span className="badge-status-green mono">ACTIVE · RFID 13.56MHz</span>
                  </div>
                  <div className="hr-smartcard-summary">
                    <div className="hr-badge-avatar" style={{ overflow: 'hidden' }}>
                      {employee?.avatarUrl ? (
                        <img src={employee.avatarUrl} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        userInitials
                      )}
                    </div>
                    <div className="hr-badge-meta">
                      <h4 className="hr-badge-name" id="hrCardName">{userName}</h4>
                      <span className="hr-badge-role" id="hrCardRole">{roleTitle}</span>
                      <span className="hr-badge-dept mono" id="hrCardDept">{deptName.toUpperCase()}</span>
                      <div className="hr-badge-id mono" id="hrCardId">ID: #{empIdStr}</div>
                    </div>
                  </div>
                </div>

                {/* Corporate Policy & Induction Summary */}
                <div className="executive-card hr-handbook-card">
                  <div className="card-kicker-row">
                    <span className="card-kicker">COMPLIANCE &amp; INTEGRATION</span>
                  </div>
                  <div className="handbook-links">
                    <div className="h-item">
                      <span className="h-title">Engineering Code Standards &amp; PR SLAs</span>
                      <span className="h-sub">Review guidelines, 4-hour SLA, automated CI testing</span>
                    </div>
                    <div className="h-item">
                      <span className="h-title">Proprietary Information &amp; IP Policy</span>
                      <span className="h-sub">Enterprise intellectual property and confidential handling</span>
                    </div>
                    <div className="h-item">
                      <span className="h-title">Performance Stipend Credit Schedule</span>
                      <span className="h-sub">Quarterly review and compensation disbursal schedule</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Enterprise Benefits, Perks & Payroll */}
          <div className="company-section">
            <div className="section-kicker-row">
              <span className="card-kicker">COMPENSATION, HEALTH &amp; EMPLOYEE BENEFITS</span>
              <span className="roadmap-note mono">COMPREHENSIVE GLOBAL PACKAGE</span>
            </div>
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">💳</div>
                <div className="benefit-body">
                  <div className="benefit-title-row">
                    <span className="benefit-title">Bi-Monthly Payroll &amp; Direct Deposit</span>
                    <span className="benefit-pill mono">1st &amp; 15th</span>
                  </div>
                  <p className="benefit-desc">Automated ACH salary deposits disbursed bi-weekly with electronic paystubs available in ADP / Workday.</p>
                </div>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">🏥</div>
                <div className="benefit-body">
                  <div className="benefit-title-row">
                    <span className="benefit-title">Platinum Health, Dental &amp; Vision</span>
                    <span className="benefit-pill mono">100% Covered</span>
                  </div>
                  <p className="benefit-desc">Comprehensive medical insurance via UnitedHealthcare PPO + Delta Dental with zero employee premium deductibles.</p>
                </div>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">📈</div>
                <div className="benefit-body">
                  <div className="benefit-title-row">
                    <span className="benefit-title">401(k) Retirement with 6% Match</span>
                    <span className="benefit-pill mono">Instant Vesting</span>
                  </div>
                  <p className="benefit-desc">Vanguard institutional 401(k) program with dollar-for-dollar company match up to 6% of base salary.</p>
                </div>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">🎓</div>
                <div className="benefit-body">
                  <div className="benefit-title-row">
                    <span className="benefit-title">Annual Learning &amp; Certification Budget</span>
                    <span className="benefit-pill mono">$2,500 / yr</span>
                  </div>
                  <p className="benefit-desc">Annual grant for O'Reilly, Coursera, AWS/GCP technical certifications, and international tech conferences.</p>
                </div>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">💻</div>
                <div className="benefit-body">
                  <div className="benefit-title-row">
                    <span className="benefit-title">Home Office &amp; Ergonomics Stipend</span>
                    <span className="benefit-pill mono">$1,200 / yr</span>
                  </div>
                  <p className="benefit-desc">Reimbursement for 4K external monitors, mechanical keyboards, ergonomic desk seating, and high-speed internet.</p>
                </div>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">🏖️</div>
                <div className="benefit-body">
                  <div className="benefit-title-row">
                    <span className="benefit-title">Flexible Paid Time Off &amp; Holidays</span>
                    <span className="benefit-pill mono">24 Days + 11 Hols</span>
                  </div>
                  <p className="benefit-desc">24 paid vacation days, 11 official enterprise holidays, plus unlimited dedicated wellness &amp; sick leave.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Single Sign-On (SSO) Enterprise Systems Directory */}
          <div className="company-section">
            <div className="section-kicker-row">
              <span className="card-kicker">ENTERPRISE SYSTEMS &amp; TOOLING DIRECTORY</span>
              <span className="roadmap-note mono">OKTA / GOOGLE WORKSPACE SSO INTEGRATED</span>
            </div>
            <div className="tools-sso-grid">
              <div className="sso-tool-card">
                <div className="sso-left">
                  <div className="sso-icon">🐙</div>
                  <div className="sso-meta">
                    <span className="sso-name">GitHub Enterprise</span>
                    <span className="sso-sub mono">github.com/orgs/virtualhq</span>
                  </div>
                </div>
                <a href="https://github.com" target="_blank" rel="noopener" className="btn-launch-sso">Launch ↗</a>
              </div>

              <div className="sso-tool-card">
                <div className="sso-left">
                  <div className="sso-icon">💬</div>
                  <div className="sso-meta">
                    <span className="sso-name">Slack Workplace</span>
                    <span className="sso-sub mono">virtualhq.slack.com</span>
                  </div>
                </div>
                <a href="https://slack.com" target="_blank" rel="noopener" className="btn-launch-sso">Launch ↗</a>
              </div>

              <div className="sso-tool-card">
                <div className="sso-left">
                  <div className="sso-icon">📐</div>
                  <div className="sso-meta">
                    <span className="sso-name">Figma Design System</span>
                    <span className="sso-sub mono">figma.com/@virtualhq-tokens</span>
                  </div>
                </div>
                <a href="https://figma.com" target="_blank" rel="noopener" className="btn-launch-sso">Launch ↗</a>
              </div>

              <div className="sso-tool-card">
                <div className="sso-left">
                  <div className="sso-icon">📊</div>
                  <div className="sso-meta">
                    <span className="sso-name">Datadog APM &amp; Logs</span>
                    <span className="sso-sub mono">app.datadoghq.com</span>
                  </div>
                </div>
                <a href="https://datadoghq.com" target="_blank" rel="noopener" className="btn-launch-sso">Launch ↗</a>
              </div>

              <div className="sso-tool-card">
                <div className="sso-left">
                  <div className="sso-icon">☁️</div>
                  <div className="sso-meta">
                    <span className="sso-name">AWS Management Console</span>
                    <span className="sso-sub mono">aws.amazon.com/console</span>
                  </div>
                </div>
                <a href="https://aws.amazon.com" target="_blank" rel="noopener" className="btn-launch-sso">Launch ↗</a>
              </div>

              <div className="sso-tool-card">
                <div className="sso-left">
                  <div className="sso-icon">📑</div>
                  <div className="sso-meta">
                    <span className="sso-name">Notion Corporate Wiki</span>
                    <span className="sso-sub mono">notion.so/virtualhq</span>
                  </div>
                </div>
                <a href="https://notion.so" target="_blank" rel="noopener" className="btn-launch-sso">Launch ↗</a>
              </div>
            </div>
          </div>

          {/* Section 5: Corporate Governance & Compliance Policies */}
          <div className="company-section">
            <div className="section-kicker-row">
              <span className="card-kicker">GOVERNANCE, POLICIES &amp; ETHICS HOTLINE</span>
              <span className="roadmap-note mono">AUDIT COMPLIANCE &amp; LEGAL STANDARDS</span>
            </div>
            <div className="policies-compact-grid">
              <div className="policy-compact-card">
                <span className="policy-card-title">4-Hour Code Review &amp; PR SLA</span>
                <p className="policy-card-desc">All blocking PRs submitted before 15:00 UTC must be reviewed within 4 business hours by squad peers.</p>
                <span className="policy-meta-tag mono">ENG-POL-04 · MANDATORY</span>
              </div>
              <div className="policy-compact-card">
                <span className="policy-card-title">SOC 2 Type II Data Confidentiality</span>
                <p className="policy-card-desc">Production database access is strictly credentialed via HashiCorp Vault with zero persistent root keys.</p>
                <span className="policy-meta-tag mono">SEC-POL-10 · STRICT</span>
              </div>
              <div className="policy-compact-card">
                <span className="policy-card-title">Remote-First Async Communication</span>
                <p className="policy-card-desc">Default to written documentation, public PR context, and recorded standups over ad-hoc video meetings.</p>
                <span className="policy-meta-tag mono">OPS-POL-02 · GUIDELINE</span>
              </div>
              <div className="policy-compact-card">
                <span className="policy-card-title">Anonymous Ethics &amp; HR Helpline</span>
                <p className="policy-card-desc">Encrypted anonymous hotline for reporting compliance violations or workplace harassment.</p>
                <span className="policy-meta-tag mono">compliance-ethics@virtualhq.internal</span>
              </div>
            </div>
          </div>
        </section>
  );
};
