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
      success('Claim approved! Item hold created and single-use collection token issued.');
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
          ? 'Appeal accepted: Claim reopened to PENDING for re-verification.'
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
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Claim Verifications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review ownership evidence, evaluate verification answers, and issue collection tokens.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ClaimStatus | '')}
            className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Review Statuses</option>
            <option value={ClaimStatus.PENDING}>Pending Review</option>
            <option value={ClaimStatus.INFO_REQUESTED}>Info Requested</option>
            <option value={ClaimStatus.APPROVED}>Approved</option>
            <option value={ClaimStatus.REJECTED}>Rejected</option>
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-3.5">Claim ID</th>
                <th className="px-6 py-3.5">Target Item</th>
                <th className="px-6 py-3.5">Claimant</th>
                <th className="px-6 py-3.5">Verification Level</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No claims awaiting review in this queue.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {claim.id.slice(0, 10)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{claim.item?.itemName}</div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {claim.item?.caseId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{claim.claimant?.name || 'Student'}</div>
                      <div className="text-[11px] text-slate-400">{claim.claimant?.email}</div>
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
                          className="px-2.5 py-1 text-[11px] h-auto font-semibold"
                        >
                          Inspect Evidence
                        </Button>

                        {claim.status === ClaimStatus.PENDING && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleApprove(claim.id)}
                              className="px-2.5 py-1 text-[11px] h-auto font-semibold"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setRejectTargetId(claim.id)}
                              className="px-2.5 py-1 text-[11px] h-auto font-semibold"
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
                            className="px-2.5 py-1 text-[11px] h-auto font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200 flex items-center"
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
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Claimant</span>
                <span className="font-bold text-slate-900 text-sm">{inspectClaim.claimant?.name}</span>
                <span className="text-slate-500 block">{inspectClaim.claimant?.email}</span>
              </div>
              <VerificationLevelBadge level={inspectClaim.verificationLevel} />
            </div>

            {/* Submitted description and marks */}
            <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                Submitted Ownership Details
              </span>
              <p className="text-slate-700 leading-relaxed">
                <strong>Description:</strong> {inspectClaim.description}
              </p>
              <p className="text-slate-700">
                <strong>Identifying Marks:</strong> {inspectClaim.identifyingMarks}
              </p>
              <p className="text-slate-500">
                <strong>Loss Incident:</strong> {inspectClaim.placeLost} on{' '}
                {new Date(inspectClaim.dateLost).toLocaleDateString()}
              </p>
            </div>

            {/* Verification Q&A */}
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                Verification Questions & Answers ({inspectClaim.questions.length})
              </span>
              {inspectClaim.questions.map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">
                    {idx + 1}. {q.questionText}
                  </div>
                  <div className="text-slate-600 bg-white p-2 rounded border border-slate-200/80">
                    {q.answerText ? (
                      q.answerText
                    ) : (
                      <span className="text-purple-600 italic">Unanswered</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Documents */}
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                Proof Documents ({inspectClaim.documents.length})
              </span>
              {inspectClaim.documents.length === 0 ? (
                <p className="text-slate-400 italic">No proof documents attached.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {inspectClaim.documents.map((doc) => (
                    <div key={doc.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <span className="truncate font-medium">{doc.docType}</span>
                      <a href={resolveImageUrl(doc.url)} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline ml-2 font-semibold">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons inside inspection */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRequestInfoTargetId(inspectClaim.id);
                  setInspectClaim(null);
                }}
                className="text-purple-700 bg-purple-50/80 hover:bg-purple-100 border-purple-200"
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
                Approve & Issue Token
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Serial numbers do not match device records, or insufficient proof provided..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Instructions for Claimant <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="Explain what details require clarification..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Custom Verification Question (Optional)
            </label>
            <input
              type="text"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="e.g. What stickers or scratches are on the back?"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-semibold block text-slate-700 mb-1">Claimant Appeal Statement:</span>
            <p className="text-slate-600 italic">"{appealTarget?.reason}"</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Decision
            </label>
            <select
              value={appealDecision}
              onChange={(e) => setAppealDecision(e.target.value as AppealStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
            >
              <option value={AppealStatus.ACCEPTED}>Accept Appeal (Reopen to PENDING)</option>
              <option value={AppealStatus.REJECTED}>Deny Appeal (Terminal Rejection)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Supervisor Decision Remarks (Optional)
            </label>
            <input
              type="text"
              value={appealDecisionReason}
              onChange={(e) => setAppealDecisionReason(e.target.value)}
              placeholder="Comments on appeal determination..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
