import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  FolderArchive, 
  FileCode, 
  ArrowLeft, 
  RotateCcw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { PullRequest, EmployeeState } from '../../types';
import { CloudStorage } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

interface ManagerReviewDashboardProps {
  onBackToDesk: () => void;
  employee: EmployeeState;
  onPrUpdated?: (pr: PullRequest) => void;
}

export const ManagerReviewDashboard: React.FC<ManagerReviewDashboardProps> = ({
  onBackToDesk,
  employee,
  onPrUpdated
}) => {
  const { showToast } = useToast();
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [selectedPrId, setSelectedPrId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'merged' | 'changes'>('all');
  const [managerNotes, setManagerNotes] = useState<string>('');
  const reviewerName = employee.selectedRole?.manager?.name || 'Marcus Vance (Engineering Director)';
  const [isProcessing, setIsProcessing] = useState(false);

  // Load PRs on mount
  useEffect(() => {
    loadPullRequests();
  }, []);

  const loadPullRequests = async () => {
    const list = await CloudStorage.listPullRequests();
    setPullRequests(list);
    if (list.length > 0 && !selectedPrId) {
      setSelectedPrId(list[0].id);
    }
  };

  const selectedPr = pullRequests.find(p => p.id === selectedPrId);

  const filteredPrs = pullRequests.filter(pr => {
    if (filter === 'pending') return pr.status === 'pending_review';
    if (filter === 'merged') return pr.status === 'approved_merged';
    if (filter === 'changes') return pr.status === 'changes_requested';
    return true;
  });

  const handleApproveAndMerge = async () => {
    if (!selectedPr) return;
    setIsProcessing(true);

    try {
      const feedback = managerNotes.trim() || 'Code review passed all architectural benchmarks and test assertions. Approved & merged.';
      const updated: PullRequest = {
        ...selectedPr,
        status: 'approved_merged',
        reviewFeedback: feedback,
        reviewedBy: reviewerName,
        reviewedAt: new Date().toISOString()
      };

      await CloudStorage.savePullRequest(updated);
      await loadPullRequests();

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });

      showToast({
        title: 'PR Approved & Merged',
        message: `${selectedPr.id} has been merged into main! +50 XP granted to ${selectedPr.author}.`,
        type: 'success'
      });

      setManagerNotes('');
      if (onPrUpdated) onPrUpdated(updated);
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Error',
        message: 'Failed to update PR status.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedPr) return;
    if (!managerNotes.trim()) {
      showToast({
        title: 'Feedback Required',
        message: 'Please provide constructive feedback before requesting changes.',
        type: 'warning'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const updated: PullRequest = {
        ...selectedPr,
        status: 'changes_requested',
        reviewFeedback: managerNotes.trim(),
        reviewedBy: reviewerName,
        reviewedAt: new Date().toISOString()
      };

      await CloudStorage.savePullRequest(updated);
      await loadPullRequests();

      showToast({
        title: 'Changes Requested',
        message: `Returned ${selectedPr.id} with refinement instructions to ${selectedPr.author}.`,
        type: 'info'
      });

      setManagerNotes('');
      if (onPrUpdated) onPrUpdated(updated);
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Error',
        message: 'Failed to update PR status.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyTemplate = (text: string) => {
    setManagerNotes(text);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Top Evaluation Suite Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/90 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToDesk}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Employee Desk</span>
          </button>

          <div className="h-5 w-px bg-zinc-800" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                ENGINEERING MANAGER CODE REVIEW SUITE
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Mentor & Lead Mode
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Review and evaluate actual employee code contributions submitted for open-source sprint issues.
            </p>
          </div>
        </div>

        {/* Lead Reviewer Identity */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-white block">{reviewerName}</span>
            <span className="text-[10px] text-zinc-500 font-mono">Lead Evaluator • Active Session</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            MV
          </div>
        </div>
      </header>

      {/* Main Review Dashboard Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: PR Submissions List */}
        <div className="w-80 sm:w-96 border-r border-zinc-800 bg-zinc-900/40 flex flex-col shrink-0">
          {/* Filters Bar */}
          <div className="p-3 border-b border-zinc-800 flex items-center gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'merged', label: 'Merged' },
              { id: 'changes', label: 'Rework' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* PR Items Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredPrs.length === 0 ? (
              <div className="text-center py-12 px-4 text-zinc-500">
                <GitPullRequest className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No pull requests matching this filter.</p>
                <p className="text-[11px] mt-1 text-zinc-600">
                  Switch to Employee Desk, open an issue in Monaco Studio, and submit a PR.
                </p>
              </div>
            ) : (
              filteredPrs.map(pr => {
                const isSelected = pr.id === selectedPrId;
                return (
                  <div
                    key={pr.id}
                    onClick={() => setSelectedPrId(pr.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-white">{pr.id}</span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          #{pr.issue_no}
                        </span>
                      </div>

                      {/* Status Tag */}
                      {pr.status === 'pending_review' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-2.5 h-2.5" /> Pending
                        </span>
                      )}
                      {pr.status === 'approved_merged' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Merged
                        </span>
                      )}
                      {pr.status === 'changes_requested' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-2.5 h-2.5" /> Changes
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-200 mt-2 line-clamp-1">
                      {pr.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 pt-2 border-t border-zinc-800/60">
                      <span>Author: <strong className="text-zinc-300">{pr.author}</strong></span>
                      <span className="font-mono text-zinc-500">
                        {new Date(pr.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Selected PR Detail, Code Diff, & Review Action */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-y-auto p-6 space-y-6">
          {selectedPr ? (
            <>
              {/* PR Metadata Summary Box */}
              <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-indigo-400">{selectedPr.id}</span>
                      <h3 className="text-base font-bold text-white">{selectedPr.title}</h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Target Repo: <code className="text-zinc-200 font-mono">{selectedPr.repo}</code> (Issue #{selectedPr.issue_no})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedPr.status === 'pending_review' && (
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Awaiting Manager Review
                      </span>
                    )}
                    {selectedPr.status === 'approved_merged' && (
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Merged into Production (+50 XP)
                      </span>
                    )}
                    {selectedPr.status === 'changes_requested' && (
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Refinement Requested
                      </span>
                    )}
                  </div>
                </div>

                {/* Submitter Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase">Submitted By</span>
                    <span className="text-zinc-200">{selectedPr.author}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase">Role / Dept</span>
                    <span className="text-zinc-200">{selectedPr.authorRole}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase">Submission Type</span>
                    <span className="text-indigo-400">
                      {selectedPr.submissionType === 'zip' ? 'Solution ZIP Archive' : 'Monaco Code Studio'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase">Timestamp</span>
                    <span className="text-zinc-400">
                      {new Date(selectedPr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Code Diff or Archive Inspector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    Code Changes & Solution Diff
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Unified Diff Viewer
                  </span>
                </div>

                {selectedPr.submissionType === 'zip' && selectedPr.zipMeta ? (
                  <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
                    <FolderArchive className="w-10 h-10 text-indigo-400 mx-auto" />
                    <h5 className="text-sm font-semibold text-white">{selectedPr.zipMeta.name}</h5>
                    <p className="text-xs text-zinc-400">
                      File Size: {selectedPr.zipMeta.size} • Checksum: <code className="text-zinc-500">{selectedPr.zipMeta.hash.slice(0, 18)}...</code>
                    </p>
                    <button className="px-4 py-2 mt-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition">
                      Download & Extract Archive for Inspection
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs overflow-hidden">
                    <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>src/solution.ts</span>
                      <span className="text-emerald-400">+28 lines, -4 lines</span>
                    </div>
                    <pre className="p-4 text-zinc-300 overflow-x-auto leading-relaxed">
                      <code>{selectedPr.codePatch || `// No direct diff patch recorded.`}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Previous Feedback Log (if already reviewed) */}
              {selectedPr.reviewFeedback && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Recorded Review from {selectedPr.reviewedBy || 'Manager'}:</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {selectedPr.reviewedAt ? new Date(selectedPr.reviewedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-zinc-300 italic pt-1">"{selectedPr.reviewFeedback}"</p>
                </div>
              )}

              {/* Manager Evaluation & Decision Console */}
              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    Manager Review Feedback & Decision
                  </h4>
                  <span className="text-xs text-zinc-400">
                    Acting as: <strong>{reviewerName}</strong>
                  </span>
                </div>

                {/* Feedback Quick Templates */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Quick Review Feedback Templates:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Clean implementation and tests pass without regressions. Approved for main.',
                      'Good effort, but please handle edge cases where input is null or undefined.',
                      'Please adhere to ESLint formatting rules and add inline comments for public methods.'
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => applyTemplate(tpl)}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition text-left"
                      >
                        "{tpl.slice(0, 45)}..."
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manager Notes Textarea */}
                <div>
                  <textarea
                    rows={3}
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="Type detailed code review comments, suggestions, or required modifications..."
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Decision Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-zinc-400">
                    Approving will automatically mark the sprint task resolved and credit <strong>+50 XP</strong> to the employee.
                  </span>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleRequestChanges}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Request Changes
                    </button>

                    <button
                      onClick={handleApproveAndMerge}
                      disabled={isProcessing}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                    >
                      <Check className="w-4 h-4" />
                      Approve & Merge (+50 XP)
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-3">
              <GitPullRequest className="w-12 h-12 stroke-1 opacity-40" />
              <p className="text-sm">Select a pull request from the queue to start review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
