import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  ShieldAlert,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Claim, Appeal } from '../../types/claim';
import { AppealStatus } from '../../types/enums';
import { AppealStatusBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { PageTransition } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { resolveImageUrl } from '../../services/apiClient';
import { celebrateConfetti } from '../../lib/confetti';

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

      celebrateConfetti();
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.06]">
                Adjudication Desk
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">
              Appeals Queue
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-xl">
              Review contested claim rejections, evaluate claimant statements, and execute re-evaluation rulings.
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#12151D] p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Appeals</span>
              <FileText className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-semibold text-white">
              {metrics.total}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Submitted to date</p>
          </div>

          <div className="bg-[#12151D] p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-400/80" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-semibold text-amber-400">
              {metrics.pending}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Awaiting verdict</p>
          </div>

          <div className="bg-[#12151D] p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Accepted</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400/80" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-semibold text-emerald-400">
              {metrics.accepted}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Reopened for verification</p>
          </div>

          <div className="bg-[#12151D] p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Rejected</span>
              <XCircle className="w-4 h-4 text-rose-400/80" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-semibold text-rose-400">
              {metrics.rejected}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Final rulings</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#12151D] p-4 rounded-2xl border border-white/[0.08] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search appellant, case ID, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-black/40 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AppealStatus | '')}
              aria-label="Filter by appeal status"
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-black/40 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20 font-mono"
            >
              <option value="" className="bg-[#12151D]">All Appeal Statuses</option>
              <option value={AppealStatus.PENDING} className="bg-[#12151D]">Pending Review</option>
              <option value={AppealStatus.ACCEPTED} className="bg-[#12151D]">Accepted (Claim Reopened)</option>
              <option value={AppealStatus.REJECTED} className="bg-[#12151D]">Rejected (Final)</option>
            </select>
          </div>
        </div>

        {/* Appeals Cards List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-[#12151D] rounded-2xl border border-white/[0.08] p-6 space-y-4">
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
            </div>
          ) : filteredAppeals.length === 0 ? (
            <div className="bg-[#12151D] rounded-2xl border border-white/[0.08] p-12 text-center text-neutral-500">
              <Scale className="w-8 h-8 mx-auto mb-2 opacity-30 text-neutral-400" />
              <div className="font-medium text-white text-sm">
                No appeals found in this queue.
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Contested claim appeals will automatically appear here for supervisory determination.
              </p>
            </div>
          ) : (
            filteredAppeals.map(({ appeal, claim }) => (
              <div
                key={appeal.id}
                className="bg-[#12151D] rounded-2xl border border-white/[0.08] p-5 space-y-4 hover:border-white/[0.14] transition-all"
              >
                {/* Header row: Appellant info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/[0.06] text-white border border-white/[0.1] flex items-center justify-center font-semibold text-xs">
                      {claim.claimant?.name ? claim.claimant.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm flex items-center gap-2">
                        {claim.claimant?.name || 'Institutional Member'}
                        <span className="text-xs font-mono text-neutral-400">
                          ({claim.claimant?.email || 'N/A'})
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5 font-mono">
                        <span>Submitted {new Date(appeal.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Appeal ID: <code>{appeal.id.slice(0, 10)}</code></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AppealStatusBadge status={appeal.status} />
                  </div>
                </div>

                {/* Target Item Reference */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/[0.06] text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/40 border border-white/[0.08] overflow-hidden flex items-center justify-center flex-shrink-0">
                      {claim.item?.images && claim.item.images.length > 0 ? (
                        <img
                          src={resolveImageUrl(claim.item.images[0])}
                          alt={claim.item.itemName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">
                        {claim.item?.itemName || 'Unspecified Item'}
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-2 font-mono mt-0.5">
                        <span>Case: <span className="text-white font-medium">{claim.item?.caseId}</span></span>
                        <span>•</span>
                        <span>Claim Status: <span className="text-neutral-300">{claim.status}</span></span>
                      </div>
                    </div>
                  </div>

                  {claim.item?.caseId && (
                    <Link to={`/items/${claim.item.caseId}`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-neutral-300 hover:text-white">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        View Case
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Side-by-side statements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Original rejection reason */}
                  <div className="p-3.5 rounded-xl bg-black/30 border border-rose-500/15 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-medium text-rose-300">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Original Claim Rejection Rationale</span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed italic">
                      "{claim.decisionReason || 'Insufficient proof of ownership provided.'}"
                    </p>
                  </div>

                  {/* Appellant statement */}
                  <div className="p-3.5 rounded-xl bg-black/30 border border-blue-500/15 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-medium text-blue-300">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span>Appellant's Contestation Statement</span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed">
                      "{appeal.reason}"
                    </p>
                  </div>
                </div>

                {/* Footer: Decisions info / Action button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-neutral-500">
                    {appeal.status !== AppealStatus.PENDING ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Decided on {appeal.decidedAt ? new Date(appeal.decidedAt).toLocaleString() : 'N/A'}
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
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
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.08] text-xs space-y-2">
                <div className="font-semibold text-white text-sm">
                  {targetItem.claim.item?.itemName}
                </div>
                <div>
                  <span className="text-neutral-400">Appellant:</span>{' '}
                  <span className="font-medium text-neutral-200">
                    {targetItem.claim.claimant?.name}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] italic text-neutral-300">
                  "{targetItem.appeal.reason}"
                </div>
              </div>

              {/* Decision Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-300">
                  Select Adjudication Verdict
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision(AppealStatus.ACCEPTED)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      decision === AppealStatus.ACCEPTED
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-white/[0.08] bg-black/20 hover:border-white/[0.16] text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      Accept Appeal
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Reopens the claim to <span className="font-medium text-white">PENDING</span> for
                      security re-verification.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision(AppealStatus.REJECTED)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      decision === AppealStatus.REJECTED
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                        : 'border-white/[0.08] bg-black/20 hover:border-white/[0.16] text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium text-xs text-rose-300">
                      <XCircle className="w-4 h-4" />
                      Reject Appeal
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Maintains claim rejection as final. Requires a reason.
                    </p>
                  </button>
                </div>
              </div>

              {/* Reason textarea */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Decision Notes / Reason {decision === AppealStatus.REJECTED && <span className="text-rose-400">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={decision === AppealStatus.REJECTED}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder={
                    decision === AppealStatus.ACCEPTED
                      ? 'e.g. Appellant submitted valid proof of purchase matching serial details.'
                      : 'e.g. Provided statement contradicts original security custody report.'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-black/40 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
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
