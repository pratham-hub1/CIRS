import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Claim, Appeal } from '../../types/claim';
import { AppealStatus, ClaimStatus } from '../../types/enums';
import { AppealStatusBadge, ClaimStatusBadge, CategoryBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { PageTransition } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { resolveImageUrl } from '../../services/apiClient';

interface AppealWithClaim {
  appeal: Appeal;
  claim: Claim;
}

export const AdminAppeals: React.FC = () => {
  const { success, error } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppealStatus | ''>('');

  // Decision Modal
  const [targetItem, setTargetItem] = useState<AppealWithClaim | null>(null);
  const [decision, setDecision] = useState<AppealStatus>(AppealStatus.ACCEPTED);
  const [decisionReason, setDecisionReason] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);

  const fetchClaimsWithAppeals = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get all claims to inspect their appeals
      const data = await adminService.getClaims();
      setClaims(data || []);
    } catch (err: any) {
      error(err.message || 'Failed to load appeals');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchClaimsWithAppeals();
  }, [fetchClaimsWithAppeals]);

  // Extract all appeals attached to claims
  const allAppeals: AppealWithClaim[] = useMemo(() => {
    const list: AppealWithClaim[] = [];
    for (const c of claims) {
      if (c.appeals && c.appeals.length > 0) {
        for (const app of c.appeals) {
          list.push({ appeal: app, claim: c });
        }
      }
    }
    // Sort by createdAt descending
    return list.sort(
      (a, b) => new Date(b.appeal.createdAt).getTime() - new Date(a.appeal.createdAt).getTime(),
    );
  }, [claims]);

  // Filtered appeals
  const filteredAppeals = useMemo(() => {
    return allAppeals.filter(({ appeal, claim }) => {
      if (statusFilter && appeal.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = claim.claimant?.name.toLowerCase().includes(q);
        const matchesEmail = claim.claimant?.email.toLowerCase().includes(q);
        const matchesItem = claim.item?.itemName.toLowerCase().includes(q);
        const matchesCase = claim.item?.caseId.toLowerCase().includes(q);
        const matchesReason = appeal.reason.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesItem || matchesCase || matchesReason;
      }
      return true;
    });
  }, [allAppeals, statusFilter, search]);

  // Metrics
  const metrics = useMemo(() => {
    const total = allAppeals.length;
    const pending = allAppeals.filter((a) => a.appeal.status === AppealStatus.PENDING).length;
    const accepted = allAppeals.filter((a) => a.appeal.status === AppealStatus.ACCEPTED).length;
    const rejected = allAppeals.filter((a) => a.appeal.status === AppealStatus.REJECTED).length;
    return { total, pending, accepted, rejected };
  }, [allAppeals]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem) return;

    if (decision === AppealStatus.REJECTED && !decisionReason.trim()) {
      error('Please provide a reason for rejecting the appeal.');
      return;
    }

    setIsDeciding(true);
    try {
      await adminService.decideAppeal(
        targetItem.appeal.id,
        decision,
        decisionReason.trim() || undefined,
      );

      success(
        decision === AppealStatus.ACCEPTED
          ? 'Appeal accepted: Claim reopened to PENDING for reverification.'
          : 'Appeal rejected.',
      );

      setTargetItem(null);
      setDecision(AppealStatus.ACCEPTED);
      setDecisionReason('');
      fetchClaimsWithAppeals();
    } catch (err: any) {
      error(err.message || 'Failed to record appeal decision');
    } finally {
      setIsDeciding(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/40">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appeals Queue</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Review contested claim rejections, evaluate statements, and determine re-evaluations.
              </p>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Appeals</span>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.total}
            </div>
            <p className="text-xs text-slate-500 mt-1">Submitted to date</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Decision</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.pending}
            </div>
            <p className="text-xs text-slate-500 mt-1">Require review</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Accepted (Reopened)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.accepted}
            </div>
            <p className="text-xs text-slate-500 mt-1">Re-evaluating claim</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Rejected</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metrics.rejected}
            </div>
            <p className="text-xs text-slate-500 mt-1">Final decisions</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search appellant, case ID, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AppealStatus | '')}
              aria-label="Filter by appeal status"
              className="w-full sm:w-auto px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            >
              <option value="">All Appeal Statuses</option>
              <option value={AppealStatus.PENDING}>Pending Review</option>
              <option value={AppealStatus.ACCEPTED}>Accepted (Claim Reopened)</option>
              <option value={AppealStatus.REJECTED}>Rejected (Final)</option>
            </select>
          </div>
        </div>

        {/* Appeals Cards List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="space-y-4">
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
              </div>
            </div>
          ) : filteredAppeals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
              <Scale className="w-10 h-10 mx-auto mb-2 opacity-40 text-primary-500" />
              <div className="font-medium text-slate-700 dark:text-slate-300">
                No appeals found in this queue.
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Appeals submitted by claimants following a rejection will appear here for security
                review.
              </p>
            </div>
          ) : (
            filteredAppeals.map(({ appeal, claim }) => (
              <div
                key={appeal.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Header row: Appellant info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-sm">
                      {claim.claimant?.name ? claim.claimant.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {claim.claimant?.name || 'Institutional Member'}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          ({claim.claimant?.email || 'N/A'})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Submitted {new Date(appeal.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Appeal ID: <code className="font-mono text-primary-600">{appeal.id.slice(0, 12)}</code></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AppealStatusBadge status={appeal.status} />
                  </div>
                </div>

                {/* Target Item Reference */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {claim.item?.images && claim.item.images.length > 0 ? (
                        <img
                          src={resolveImageUrl(claim.item.images[0])}
                          alt={claim.item.itemName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {claim.item?.itemName || 'Unspecified Item'}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Case: <span className="font-mono text-primary-600 font-semibold">{claim.item?.caseId}</span></span>
                        <span>•</span>
                        <span>Claim Status: <span className="font-semibold">{claim.status}</span></span>
                      </div>
                    </div>
                  </div>

                  {claim.item?.caseId && (
                    <Link to={`/items/${claim.item.caseId}`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Inspect Case
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Side-by-side statements: Original Rejection Reason & Appeal Statement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original rejection reason */}
                  <div className="p-3.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-800 dark:text-rose-300">
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Original Claim Rejection Reason</span>
                    </div>
                    <p className="text-rose-900 dark:text-rose-200 leading-relaxed italic">
                      "{claim.decisionReason || 'Insufficient proof of ownership provided.'}"
                    </p>
                  </div>

                  {/* Appellant statement */}
                  <div className="p-3.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-800 dark:text-blue-300">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Appellant's Appeal Statement</span>
                    </div>
                    <p className="text-blue-900 dark:text-blue-200 leading-relaxed">
                      "{appeal.reason}"
                    </p>
                  </div>
                </div>

                {/* Footer: Decisions info / Action button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    {appeal.status !== AppealStatus.PENDING ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Decided on {appeal.decidedAt ? new Date(appeal.decidedAt).toLocaleString() : 'N/A'}
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Awaiting security review and verdict
                      </span>
                    )}
                  </div>

                  {appeal.status === AppealStatus.PENDING && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setTargetItem({ appeal, claim });
                        setDecision(AppealStatus.ACCEPTED);
                        setDecisionReason('');
                      }}
                      className="text-xs"
                    >
                      <Scale className="w-3.5 h-3.5 mr-1.5" />
                      Make Decision
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Appeal Decision Modal */}
        <Modal
          isOpen={!!targetItem}
          onClose={() => {
            setTargetItem(null);
            setDecisionReason('');
          }}
          title="Appeal Adjudication"
        >
          {targetItem && (
            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="font-semibold text-slate-900 dark:text-white text-sm">
                  {targetItem.claim.item?.itemName}
                </div>
                <div>
                  <span className="text-slate-500">Appellant:</span>{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {targetItem.claim.claimant?.name}
                  </span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 italic text-slate-700 dark:text-slate-300">
                  "{targetItem.appeal.reason}"
                </div>
              </div>

              {/* Decision Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Adjudication Verdict
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision(AppealStatus.ACCEPTED)}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      decision === AppealStatus.ACCEPTED
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Accept Appeal
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Reopens the claim to <span className="font-semibold">PENDING</span> for
                      security re-verification.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision(AppealStatus.REJECTED)}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      decision === AppealStatus.REJECTED
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-400">
                      <XCircle className="w-4 h-4" />
                      Reject Appeal
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Maintains claim rejection as final. Requires a reason.
                    </p>
                  </button>
                </div>
              </div>

              {/* Reason textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Decision Notes / Reason {decision === AppealStatus.REJECTED && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={decision === AppealStatus.REJECTED}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder={
                    decision === AppealStatus.ACCEPTED
                      ? 'e.g., Appellant provided valid proof of purchase matching serial details.'
                      : 'e.g., Provided statement contradicts original security custody report.'
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTargetItem(null);
                    setDecisionReason('');
                  }}
                  disabled={isDeciding}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={decision === AppealStatus.ACCEPTED ? 'primary' : 'danger'}
                  size="sm"
                  isLoading={isDeciding}
                >
                  Confirm Verdict
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
};
