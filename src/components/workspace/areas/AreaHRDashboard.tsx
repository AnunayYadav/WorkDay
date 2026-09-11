import React, { useState, useEffect } from 'react';
import type { EmployeeState } from '../../../types';
import { CloudStorage } from '../../../lib/supabase';

interface AreaHRDashboardProps {
  employee: EmployeeState;
}

export const AreaHRDashboard: React.FC<AreaHRDashboardProps> = ({ employee }) => {
  const [employees, setEmployees] = useState<EmployeeState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractEmp, setSelectedContractEmp] = useState<EmployeeState | null>(null);

  // Announcement state
  const [announcementContent, setAnnouncementContent] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    CloudStorage.listProfiles().then((profiles) => {
      setEmployees(profiles);
      setLoading(false);
    });
  }, []);

  // Department distribution
  const deptCount: Record<string, number> = {};
  employees.forEach(emp => {
    const dept = emp.department || 'engineering';
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  });

  const signedCount = employees.filter(e => e.isSigned).length;
  const completionRate = employees.length > 0 ? Math.round((signedCount / employees.length) * 100) : 100;

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementContent.trim()) return;

    setPublishing(true);
    await CloudStorage.createTeamPost({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `post-${Date.now()}`,
      name: `${employee.fullName} (HR Operations)`,
      avatar: employee.preferredName ? employee.preferredName.slice(0, 2).toUpperCase() : 'HR',
      role: 'Head of People & Culture',
      content: announcementContent.trim(),
      reactions: { likes: 0 }
    });

    // Also push to announcements channel in messages
    await CloudStorage.sendMessage(employee.empId, '#announcements', {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      sender: `${employee.fullName} (HR)`,
      isMe: true,
      text: announcementContent.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setAnnouncementContent('');
    setPublishing(false);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 4000);
  };

  if (loading && employees.length === 0) {
    return (
      <section className="workspace-area active" id="areaHRDashboard">
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#71717a' }}>
          <div className="pulse-indicator" style={{ margin: '0 auto 1rem' }}></div>
          Loading workforce directory &amp; HR records...
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-area active" id="areaHRDashboard">
      {/* Header */}
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
                PEOPLE &amp; TALENT OPERATIONS
              </span>
              <span style={{ fontSize: '0.8rem', color: '#71717a' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{employee.companyName || 'Enterprise'} Workspace</span>
            </div>
            <h1 className="area-title">HR Leadership &amp; Compliance Console</h1>
            <p className="area-subtitle">
              Workforce headcount distribution, legal contract signatures verification, and organization management.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="analytics-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">TOTAL HEADCOUNT</span>
            <span className="badge-live">LIVE</span>
          </div>
          <div className="stat-num">{employees.length}</div>
          <div className="stat-label">Registered Corporate Employees</div>
        </div>

        <div className="stat-card executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">ONBOARDING COMPLIANCE</span>
            <span className="mono" style={{ fontSize: '0.75rem', color: '#4ade80' }}>
              {completionRate}%
            </span>
          </div>
          <div className="stat-num">{signedCount}/{employees.length}</div>
          <div className="stat-label">Contracts Executed &amp; Signed</div>
        </div>

        <div className="stat-card executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">DEPARTMENTS</span>
            <span className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>ORG TRACKS</span>
          </div>
          <div className="stat-num">{Object.keys(deptCount).length || 4}</div>
          <div className="stat-label">Active Functional Units</div>
        </div>

        <div className="stat-card executive-card">
          <div className="card-kicker-row">
            <span className="card-kicker">PRIMARY COMPANY</span>
            <span className="mono" style={{ fontSize: '0.75rem', color: '#e4e4e7' }}>WORKSPACE</span>
          </div>
          <div className="stat-num" style={{ fontSize: '1.4rem' }}>{employee.companyName || 'Stripe'}</div>
          <div className="stat-label">@{employee.companyDomain || 'stripe.corp'}</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="hr-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        {/* Left Column: Signed Employment Contracts Archive */}
        <div className="executive-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <span className="card-kicker">LEGAL COMPLIANCE ARCHIVE</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                Executed Contracts &amp; Handwritten Signatures
              </h3>
            </div>
            <span className="mono" style={{ fontSize: '0.72rem', color: '#4ade80' }}>
              ENCRYPTED AUDIT TRAIL
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '1rem' }}>
            All legal onboarding agreements with cryptographically secured handwritten SVG vector signatures.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {employees.map(emp => (
              <div
                key={emp.empId}
                style={{
                  padding: '0.85rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{emp.fullName}</strong>
                    <span className="mono" style={{ fontSize: '0.72rem', color: '#71717a' }}>({emp.empId})</span>
                    {emp.isSigned ? (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        color: '#4ade80',
                        border: '1px solid rgba(34, 197, 94, 0.25)'
                      }}>
                        ✓ SIGNED
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.25)'
                      }}>
                        PENDING
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.2rem' }}>
                    {emp.selectedRole?.title || 'Engineer'} • {emp.corporateEmail || `${emp.handle}@${emp.companyDomain || 'stripe.corp'}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {emp.signatureDataUrl ? (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                      onClick={() => setSelectedContractEmp(emp)}
                    >
                      View Signed Deed →
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#71717a', fontStyle: 'italic' }}>
                      Awaiting Signature
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Company Broadcast & Department Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Post Company Announcement */}
          <div className="executive-card">
            <div className="card-kicker-row">
              <span className="card-kicker">EXECUTIVE BROADCAST</span>
              <span className="mono" style={{ fontSize: '0.7rem', color: '#38bdf8' }}>ALL CHANNELS</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.6rem' }}>
              Broadcast Announcement
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '1rem' }}>
              Publishes official notice directly to `#announcements` and the enterprise Watercooler feed.
            </p>

            <form onSubmit={handlePublishAnnouncement}>
              <textarea
                value={announcementContent}
                onChange={e => setAnnouncementContent(e.target.value)}
                rows={3}
                placeholder="Type organization announcement, holiday update, or executive message..."
                style={{
                  width: '100%',
                  background: '#12141a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  marginBottom: '0.8rem'
                }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {publishSuccess && (
                  <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                    ✓ Broadcast sent across organization!
                  </span>
                )}
                {!publishSuccess && <span></span>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={publishing || !announcementContent.trim()}
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                >
                  {publishing ? 'Publishing...' : 'Broadcast to Company →'}
                </button>
              </div>
            </form>
          </div>

          {/* Department Breakdown */}
          <div className="executive-card">
            <div className="card-kicker-row">
              <span className="card-kicker">TALENT DISTRIBUTION</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.8rem' }}>
              Headcount by Track
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {Object.entries(deptCount).map(([dept, count]) => {
                const percentage = Math.round((count / employees.length) * 100);
                return (
                  <div key={dept} style={{ marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                      <span style={{ textTransform: 'capitalize', color: '#f4f4f5' }}>{dept}</span>
                      <span className="mono" style={{ color: '#71717a' }}>{count} ({percentage}%)</span>
                    </div>
                    <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percentage}%`, background: '#ffffff', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: View Signed Contract & Vector Signature */}
      {selectedContractEmp && (
        <div className="modal-backdrop" onClick={() => setSelectedContractEmp(null)}>
          <div className="modal-content executive-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="card-kicker-row">
              <span className="card-kicker">OFFICIAL CONTRACT ARCHIVE</span>
              <span className="mono" style={{ fontSize: '0.72rem', color: '#4ade80' }}>VERIFIED RECORD</span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.3rem' }}>
              Confidential Employment Deed
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '1.25rem' }}>
              {selectedContractEmp.companyName || 'Enterprise'} Proprietary Rights &amp; Code of Conduct
            </p>

            {/* Document Details */}
            <div style={{
              background: '#090a0f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>EMPLOYEE</span>
                  <strong style={{ color: '#ffffff' }}>{selectedContractEmp.fullName}</strong>
                </div>
                <div>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>EMPLOYEE ID</span>
                  <span className="mono" style={{ color: '#ffffff' }}>{selectedContractEmp.empId}</span>
                </div>
                <div>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>CORPORATE EMAIL</span>
                  <span className="mono" style={{ color: '#38bdf8' }}>{selectedContractEmp.corporateEmail}</span>
                </div>
                <div>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>ASSIGNED ROLE</span>
                  <span style={{ color: '#ffffff' }}>{selectedContractEmp.selectedRole?.title}</span>
                </div>
              </div>

              {/* Exact Handwritten Signature Box */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px dashed rgba(255, 255, 255, 0.12)'
              }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#71717a', marginBottom: '0.5rem' }}>
                  DIGITALLY EXECUTED HANDWRITTEN SIGNATURE:
                </span>

                <div style={{
                  background: '#040508',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px'
                }}>
                  {selectedContractEmp.signatureDataUrl ? (
                    <img
                      src={selectedContractEmp.signatureDataUrl}
                      alt={`Signature of ${selectedContractEmp.fullName}`}
                      style={{ maxHeight: '90px', filter: 'invert(1)', opacity: 0.95 }}
                    />
                  ) : (
                    <span style={{ color: '#71717a', fontSize: '0.8rem' }}>No signature data recorded</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.7rem', color: '#71717a' }}>
                  <span>Certification: SHA256 Verification Timestamp</span>
                  <span className="mono">STATUS: SEALED &amp; FILED</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedContractEmp(null)}
              >
                Close Contract Deed
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
