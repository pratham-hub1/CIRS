import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { resolveImageUrl } from '../../services/apiClient';
import { Claim, Appeal } from '../../types/claim';
import { ClaimStatus, VerificationLevel, AppealStatus } from '../../types/enums';
import { ClaimStatusBadge, VerificationLevelBadge, CategoryBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { PageTransition } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { celebrateConfetti } from '../../lib/confetti';

export const AdminClaims: React.FC = () => {
  const { success, error } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus | ''>('');

  // Inspect modal
  const [inspectClaim, setInspectClaim] = useState<Claim | null>(null);

  // Reject modal
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Request info modal
  const [requestInfoTargetId, setRequestInfoTargetId] = useState<string | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);

  // Decide appeal modal
  const [appealTarget, setAppealTarget] = useState<Appeal | null>(null);
  const [appealDecision, setAppealDecision] = useState<AppealStatus>(AppealStatus.ACCEPTED);
  const [appealDecisionReason, setAppealDecisionReason] = useState('');
  const [isDecidingAppeal, setIsDecidingAppeal] = useState(false);

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getClaims(selectedStatus || undefined);
      setClaims(data || []);
    } catch (err: any) {
      error(err.message || 'Failed to load claims');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, error]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleApprove = async (claimId: string) => {
    try {
      await adminService.approveClaim(claimId);
      celebrateConfetti();
      success('Claim approved! Item hold created and collection token issued.');
      if (inspectClaim && inspectClaim.id === claimId) {
        setInspectClaim(null);
      }
      fetchClaims();
    } catch (err: any) {
      error(err.message || 'Failed to approve claim');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTargetId || !rejectReason.trim()) return;

    setIsRejecting(true);
    try {
      await adminService.rejectClaim(rejectTargetId, rejectReason.trim());
      success('Claim rejected with specified reason.');
      setRejectTargetId(null);
      setRejectReason('');
      if (inspectClaim && inspectClaim.id === rejectTargetId) {
        setInspectClaim(null);
      }
      fetchClaims();
    } catch (err: any) {
      error(err.message || 'Failed to reject claim');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRequestInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestInfoTargetId || !requestReason.trim()) return;

    setIsRequestingInfo(true);
    try {
      const questions = newQuestionText.trim() ? [newQuestionText.trim()] : undefined;
      await adminService.requestMoreInfo(requestInfoTargetId, requestReason.trim(), questions);
      success('Information request dispatched to claimant.');
      setRequestInfoTargetId(null);
      setRequestReason('');
      setNewQuestionText('');
      if (inspectClaim && inspectClaim.id === requestInfoTargetId) {
        setInspectClaim(null);
      }
      fetchClaims();
    } catch (err: any) {
      error(err.message || 'Failed to send info request');
    } finally {
      setIsRequestingInfo(false);
    }
  };

  const handleDecideAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealTarget) return;

    setIsDecidingAppeal(true);
    try {
      await adminService.decideAppeal(
        appealTarget.id,
        appealDecision,
        appealDecisionReason.trim() || undefined,
      );
      success(
        appealDecision === AppealStatus.ACCEPTED
          ? 'Appeal accepted: Claim reopened to PENDING.'
          : 'Appeal rejected.',
      );
      setAppealTarget(null);
      fetchClaims();
    } catch (err: any) {
      error(err.message || 'Failed to decide appeal');
    } finally {
      setIsDecidingAppeal(false);
    }
  };

  return (
    <PageTransition className="space-y-8 max-w-7xl mx-auto text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              OWNERSHIP ADJUDICATION
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-neutral-400">
              CLAIMS DESK
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
            Claims Queue
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Review ownership evidence, evaluate verification answers, and issue collection vouchers.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ClaimStatus | '')}
            className="py-2 px-3 text-xs border border-white/10 rounded-xl bg-neutral-900 text-neutral-300 font-mono focus:outline-none focus:border-white/40"
          >
            <option value="" className="bg-[#12151D]">All Review Statuses</option>
            <option value={ClaimStatus.PENDING} className="bg-[#12151D]">Pending Review</option>
            <option value={ClaimStatus.INFO_REQUESTED} className="bg-[#12151D]">Info Requested</option>
            <option value={ClaimStatus.APPROVED} className="bg-[#12151D]">Approved</option>
            <option value={ClaimStatus.REJECTED} className="bg-[#12151D]">Rejected</option>
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-neutral-900 border-b border-white/[0.06] text-neutral-400 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-3.5">Claim ID</th>
                <th className="px-6 py-3.5">Target Item</th>
                <th className="px-6 py-3.5">Claimant</th>
                <th className="px-6 py-3.5">Verification</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-neutral-300">
              {isLoading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 font-mono italic">
                    No claims awaiting adjudication in this sector queue.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-white">
                      #{claim.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{claim.item?.itemName}</div>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        #{claim.item?.caseId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{claim.claimant?.name || 'Student'}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{claim.claimant?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <VerificationLevelBadge level={claim.verificationLevel} />
                    </td>
                    <td className="px-6 py-4">
                      <ClaimStatusBadge status={claim.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInspectClaim(claim)}
                          className="px-2.5 py-1 text-[11px] h-auto"
                        >
                          Inspect Evidence
                        </Button>

                        {claim.status === ClaimStatus.PENDING && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleApprove(claim.id)}
                              className="px-2.5 py-1 text-[11px] h-auto"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setRejectTargetId(claim.id)}
                              className="px-2.5 py-1 text-[11px] h-auto"
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {claim.appeals && claim.appeals.length > 0 && claim.appeals[0].status === AppealStatus.PENDING && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setAppealTarget(claim.appeals[0])}
                            className="px-2.5 py-1 text-[11px] h-auto flex items-center"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" /> Decide Appeal
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Claim Modal */}
      {inspectClaim && (
        <Modal
          isOpen={!!inspectClaim}
          onClose={() => setInspectClaim(null)}
          title="Inspect Claim Evidence"
          description={`Claimant verification profile for "${inspectClaim.item?.itemName}"`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs text-white">
            <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-white/[0.06]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-mono">Claimant</span>
                <span className="font-semibold text-white text-sm">{inspectClaim.claimant?.name}</span>
                <span className="text-neutral-400 block text-xs">{inspectClaim.claimant?.email}</span>
              </div>
              <VerificationLevelBadge level={inspectClaim.verificationLevel} />
            </div>

            {/* Submitted description and marks */}
            <div className="space-y-2 p-4 rounded-xl border border-white/[0.06] bg-neutral-900">
              <span className="font-semibold uppercase tracking-wider text-neutral-400 text-[10px] block font-mono">
                Submitted Ownership Details
              </span>
              <p className="text-neutral-300 leading-relaxed">
                <strong>Description:</strong> {inspectClaim.description}
              </p>
              <p className="text-neutral-300">
                <strong>Identifying Marks:</strong> {inspectClaim.identifyingMarks}
              </p>
              <p className="text-neutral-500 font-mono text-[11px]">
                <strong>Loss Incident:</strong> {inspectClaim.placeLost} on{' '}
                {new Date(inspectClaim.dateLost).toLocaleDateString()}
              </p>
            </div>

            {/* Verification Q&A */}
            <div className="space-y-2">
              <span className="font-semibold uppercase tracking-wider text-neutral-400 text-[10px] block font-mono">
                Verification Questions &amp; Answers ({inspectClaim.questions.length})
              </span>
              {inspectClaim.questions.map((q, idx) => (
                <div key={q.id} className="p-3 bg-neutral-900 rounded-xl border border-white/[0.06] space-y-1">
                  <div className="font-semibold text-white">
                    {idx + 1}. {q.questionText}
                  </div>
                  <div className="text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-white/[0.04]">
                    {q.answerText ? (
                      q.answerText
                    ) : (
                      <span className="text-amber-400 italic">Unanswered</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Documents */}
            <div className="space-y-2">
              <span className="font-semibold uppercase tracking-wider text-neutral-400 text-[10px] block font-mono">
                Proof Documents ({inspectClaim.documents.length})
              </span>
              {inspectClaim.documents.length === 0 ? (
                <p className="text-neutral-500 italic">No proof documents attached.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {inspectClaim.documents.map((doc) => (
                    <div key={doc.id} className="p-2.5 rounded-xl bg-neutral-900 border border-white/[0.06] flex justify-between items-center">
                      <span className="truncate font-semibold">{doc.docType}</span>
                      <a href={resolveImageUrl(doc.url)} target="_blank" rel="noreferrer" className="text-white hover:underline ml-2 font-semibold">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons inside inspection */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-white/[0.06]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRequestInfoTargetId(inspectClaim.id);
                  setInspectClaim(null);
                }}
              >
                Request More Info
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  setRejectTargetId(inspectClaim.id);
                  setInspectClaim(null);
                }}
              >
                Reject Claim
              </Button>
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={() => handleApprove(inspectClaim.id)}
              >
                Approve &amp; Issue Token
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectTargetId}
        onClose={() => setRejectTargetId(null)}
        title="Reject Ownership Claim"
        description="Provide a clear explanation for rejecting this claim (accessible to claimant)."
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Serial numbers do not match device records, or insufficient proof provided..."
              className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRejectTargetId(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isRejecting}
            >
              Reject Claim
            </Button>
          </div>
        </form>
      </Modal>

      {/* Request Info Modal */}
      <Modal
        isOpen={!!requestInfoTargetId}
        onClose={() => setRequestInfoTargetId(null)}
        title="Request Additional Information"
        description="Ask the claimant for clarification or add specific security questions."
      >
        <form onSubmit={handleRequestInfoSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1">
              Instructions for Claimant <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="Explain what details require clarification..."
              className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1">
              Custom Verification Question (Optional)
            </label>
            <input
              type="text"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="e.g. What stickers or scratches are on the back?"
              className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRequestInfoTargetId(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isRequestingInfo}
            >
              Send Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Decide Appeal Modal */}
      <Modal
        isOpen={!!appealTarget}
        onClose={() => setAppealTarget(null)}
        title="Decide Claimant Appeal"
        description="Accepting an appeal reopens the claim to PENDING for re-verification."
      >
        <form onSubmit={handleDecideAppealSubmit} className="space-y-4">
          <div className="p-3 bg-neutral-900 rounded-xl border border-white/[0.06] text-xs">
            <span className="font-semibold block text-neutral-300 mb-1">Claimant Appeal Statement:</span>
            <p className="text-neutral-400 italic">"{appealTarget?.reason}"</p>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1">
              Decision
            </label>
            <select
              value={appealDecision}
              onChange={(e) => setAppealDecision(e.target.value as AppealStatus)}
              className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-neutral-900 text-white focus:outline-none focus:ring-1 focus:ring-white font-mono"
            >
              <option value={AppealStatus.ACCEPTED}>Accept Appeal (Reopen to PENDING)</option>
              <option value={AppealStatus.REJECTED}>Deny Appeal (Terminal Rejection)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1">
              Supervisor Decision Remarks (Optional)
            </label>
            <input
              type="text"
              value={appealDecisionReason}
              onChange={(e) => setAppealDecisionReason(e.target.value)}
              placeholder="Comments on appeal determination..."
              className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white font-mono"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAppealTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isDecidingAppeal}
            >
              Submit Determination
            </Button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
};
