import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Shield,
  Upload,
  Copy,
  Check,
  Building,
  RotateCcw,
  Send,
  ExternalLink,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { claimsService } from '../../services/claimsService';
import { resolveImageUrl } from '../../services/apiClient';
import { Claim } from '../../types/claim';
import {
  ClaimStatus,
  VerificationLevel,
  STORAGE_LOCATION_LABELS,
  StorageLocationName,
} from '../../types/enums';
import {
  ClaimStatusBadge,
  VerificationLevelBadge,
  CategoryBadge,
} from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import { FileUpload } from '../../components/common/FileUpload';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { useToast } from '../../context/ToastContext';
import { formatRelativeTime } from '../../lib/utils';
import { celebrateConfetti } from '../../lib/confetti';

export const ClaimDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Answering INFO_REQUESTED state
  const [answersState, setAnswersState] = useState<Record<string, string>>({});
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);

  // Upload proof doc modal state
  const [showDocModal, setShowDocModal] = useState(false);
  const [docType, setDocType] = useState('Invoice / Proof of Purchase');
  const [docUrl, setDocUrl] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Appeal modal state
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  // Withdraw dialog state
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Feedback state
  const [isCorrectItem, setIsCorrectItem] = useState(true);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Token copy state
  const [copiedToken, setCopiedToken] = useState(false);

  const loadClaim = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await claimsService.getClaimById(id);
      setClaim(data);
      if (data.postReturnFeedback) {
        setFeedbackSubmitted(true);
      }
    } catch (err: any) {
      console.error('Error loading claim:', err);
      error(err.message || 'Failed to load claim');
    } finally {
      setIsLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    loadClaim();
  }, [loadClaim]);

  const handleCopyCode = () => {
    if (claim?.collectionToken?.code) {
      navigator.clipboard.writeText(claim.collectionToken.code);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      success('Voucher code copied to clipboard');
    }
  };

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswersState((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmitAnswers = async () => {
    if (!id) return;
    const answersList = Object.entries(answersState).map(([questionId, answerText]) => ({
      questionId,
      answerText,
    }));

    if (answersList.length === 0) {
      error('Please fill in answers before submitting');
      return;
    }

    setIsSubmittingAnswers(true);
    try {
      await claimsService.submitAnswers(id, { answers: answersList });
      success('Verification responses submitted to security staff.');
      loadClaim();
    } catch (err: any) {
      error(err.message || 'Failed to submit responses');
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !docUrl) return;

    setIsAddingDoc(true);
    try {
      await claimsService.addDocument(id, {
        docType: docType.trim(),
        url: docUrl,
      });
      success('Proof document attached successfully.');
      setShowDocModal(false);
      setDocUrl('');
      loadClaim();
    } catch (err: any) {
      error(err.message || 'Failed to attach document');
    } finally {
      setIsAddingDoc(false);
    }
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !appealReason.trim()) return;

    setIsSubmittingAppeal(true);
    try {
      await claimsService.createAppeal(id, { reason: appealReason.trim() });
      success('Appeal lodged. Security supervisors will review your evidence.');
      setShowAppealModal(false);
      loadClaim();
    } catch (err: any) {
      error(err.message || 'Failed to submit appeal');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const handleWithdraw = async () => {
    if (!id) return;
    setIsWithdrawing(true);
    try {
      await claimsService.withdrawClaim(id);
      success('Claim withdrawn.');
      setShowWithdrawDialog(false);
      navigate('/my-claims');
    } catch (err: any) {
      error(err.message || 'Failed to withdraw claim');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmittingFeedback(true);
    try {
      await claimsService.submitPostReturnFeedback(id, {
        isCorrectItem,
        comments: feedbackComments.trim() || undefined,
      });
      celebrateConfetti();
      success('Thank you! Recovery confirmation recorded.');
      setFeedbackSubmitted(true);
      loadClaim();
    } catch (err: any) {
      error(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Retrieving claim verification record..." />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-10 text-center bg-[#12151D] rounded-2xl border border-white/[0.07] max-w-md mx-auto text-white">
        <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold">Claim Not Found</h3>
        <p className="text-xs text-neutral-400 mt-1">
          The requested claim record could not be found.
        </p>
        <button
          onClick={() => navigate('/my-claims')}
          className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-white/[0.08] hover:bg-white/[0.12] rounded-xl transition-colors"
        >
          Return to Claims
        </button>
      </div>
    );
  }

  const canWithdraw =
    claim.status === ClaimStatus.PENDING ||
    claim.status === ClaimStatus.INFO_REQUESTED;

  const canAppeal = claim.status === ClaimStatus.REJECTED;

  return (
    <FadeIn className="space-y-8 max-w-5xl mx-auto text-white">
      {/* Top back bar and options */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <button
          onClick={() => navigate('/my-claims')}
          className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Claims
        </button>

        <div className="flex items-center space-x-2">
          {canWithdraw && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWithdrawDialog(true)}
            >
              Withdraw Claim
            </Button>
          )}

          {canAppeal && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAppealModal(true)}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Appeal Decision
            </Button>
          )}
        </div>
      </div>

      {/* Main Status & Collection Card */}
      <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <ClaimStatusBadge status={claim.status} size="md" />
              <VerificationLevelBadge level={claim.verificationLevel} />
              {claim.item && <CategoryBadge category={claim.item.category} />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Claim on {claim.item?.itemName || 'Reported Belonging'}
            </h1>
            <p className="text-xs text-neutral-400 mt-1 font-mono">
              Claim Ref: <span className="text-neutral-300">#{claim.id}</span>
            </p>
          </div>

          {claim.item && (
            <Link
              to={`/items/${claim.item.caseId}`}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.12] transition-colors self-start sm:self-auto"
            >
              <span>View Case #{claim.item.caseId}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-neutral-400" />
            </Link>
          )}
        </div>

        {/* Collection Pass (When Approved) */}
        {claim.status === ClaimStatus.APPROVED && claim.collectionToken && (
          <div className="p-6 sm:p-7 rounded-2xl bg-[#171B26] border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                <Ticket className="w-5 h-5 text-neutral-300" />
                <span>Campus Collection Pass</span>
              </div>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-black uppercase tracking-wider">
                Authorized Handover
              </span>
            </div>

            <div className="bg-neutral-900 p-6 rounded-xl border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 font-mono block">
                  Secure Collection Token
                </span>
                <span className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-widest mt-1.5 block">
                  {claim.collectionToken.code}
                </span>
                <span className="text-xs text-neutral-500 mt-1.5 block font-mono">
                  Valid Until:{' '}
                  {new Date(claim.collectionToken.expiresAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white bg-white/[0.08] border border-white/10 rounded-xl hover:bg-white/[0.14] transition-all self-start sm:self-auto"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5 text-neutral-400" />
                    <span>Copy Token Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Offline Collection Instructions */}
            <div className="text-xs text-neutral-400 space-y-1.5 pt-1">
              <p className="font-semibold text-white">Campus Handover Protocol:</p>
              <p>• Visit the <strong>Campus Security Office (Main Academic Block, Ground Floor)</strong>.</p>
              <p>• Present your university identity card and this 6-character voucher token code to the on-duty officer.</p>
            </div>
          </div>
        )}

        {/* Info Requested Alert */}
        {claim.status === ClaimStatus.INFO_REQUESTED && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1.5">
            <div className="flex items-center font-semibold text-sm text-amber-300">
              <AlertCircle className="w-4 h-4 mr-2 text-amber-400" />
              Additional Verification Required
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              Campus security officers have reviewed your claim and requested responses to the questions below before approving physical collection.
            </p>
          </div>
        )}

        {/* Rejection Reason */}
        {claim.status === ClaimStatus.REJECTED && claim.decisionReason && (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 space-y-1.5">
            <span className="font-semibold text-sm text-rose-300 block">Rejection Rationale:</span>
            <p className="text-rose-200/80 leading-relaxed">{claim.decisionReason}</p>
            <p className="text-[11px] text-rose-400 mt-2">
              If you have supplementary evidence, you may file an appeal for supervisory review.
            </p>
          </div>
        )}

        {/* Submitted Incident Details */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 border-b border-white/[0.06] pb-2">
            Submitted Claim Particulars
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px]">Estimated Date Lost</span>
              <span className="font-semibold text-white mt-1 block">
                {new Date(claim.dateLost).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Place Lost</span>
              <span className="font-semibold text-white mt-1 block">{claim.placeLost}</span>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <span className="text-neutral-500 block text-[11px]">
                Distinguishing Marks Submitted
              </span>
              <span className="text-neutral-300 mt-1 block leading-relaxed">
                {claim.identifyingMarks}
              </span>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <span className="text-neutral-500 block text-[11px]">Description</span>
              <span className="text-neutral-300 mt-1 block leading-relaxed">
                {claim.description}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Questions and Answers */}
        <div className="space-y-4 pt-4 border-t border-white/[0.06]">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 border-b border-white/[0.06] pb-2">
            Verification Questions &amp; Responses
          </h3>

          <div className="space-y-3">
            {claim.questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-neutral-900 border border-white/[0.06] text-xs space-y-2"
              >
                <div className="font-semibold text-white flex items-center justify-between">
                  <span>
                    {idx + 1}. {q.questionText}
                  </span>
                  {q.answeredAt ? (
                    <span className="text-[10px] text-emerald-400 flex items-center font-mono font-semibold">
                      <Check className="w-3 h-3 mr-0.5" /> Answered
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono font-semibold uppercase">
                      Pending Response
                    </span>
                  )}
                </div>

                {q.answerText ? (
                  <div className="bg-white/[0.04] p-3 rounded-lg text-neutral-300">
                    {q.answerText}
                  </div>
                ) : claim.status === ClaimStatus.INFO_REQUESTED ? (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={answersState[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Type your response to this verification question..."
                      className="w-full px-3.5 py-2 text-xs border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500 font-medium"
                    />
                  </div>
                ) : (
                  <p className="text-neutral-500 italic font-mono text-[11px]">No answer provided.</p>
                )}
              </div>
            ))}
          </div>

          {claim.status === ClaimStatus.INFO_REQUESTED && (
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSubmitAnswers}
                isLoading={isSubmittingAnswers}
              >
                Submit Responses to Staff
              </Button>
            </div>
          )}
        </div>

        {/* Attached Proof Documents */}
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Attached Proof Documents ({claim.documents.length})
            </h3>
            <button
              onClick={() => setShowDocModal(true)}
              className="text-xs font-semibold text-white hover:text-neutral-300 flex items-center transition-colors"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-neutral-400" /> Attach Proof Document
            </button>
          </div>

          {claim.documents.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">No proof documents attached to this claim.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {claim.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-neutral-900 text-xs"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <FileText className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="font-semibold text-white truncate">{doc.docType}</span>
                  </div>
                  <a
                    href={resolveImageUrl(doc.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-white hover:underline flex-shrink-0 ml-2"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post-Return Feedback Form */}
        {claim.status === ClaimStatus.APPROVED && (
          <div className="space-y-4 pt-6 border-t border-white/[0.06]">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Post-Collection Recovery Feedback
            </h3>

            {feedbackSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                Thank you! Your recovery audit verification has been safely recorded.
              </div>
            ) : (
              <form
                onSubmit={handleFeedbackSubmit}
                className="p-5 rounded-xl bg-neutral-900 border border-white/[0.06] space-y-4 text-xs"
              >
                <p className="text-neutral-300">
                  Did you receive your exact lost belonging during physical handover at campus security?
                </p>

                <div className="flex items-center space-x-5">
                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-white">
                    <input
                      type="radio"
                      name="correctItem"
                      checked={isCorrectItem}
                      onChange={() => setIsCorrectItem(true)}
                      className="text-white focus:ring-white bg-neutral-800 border-white/20"
                    />
                    <span>Yes, verified exact belonging</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-white">
                    <input
                      type="radio"
                      name="correctItem"
                      checked={!isCorrectItem}
                      onChange={() => setIsCorrectItem(false)}
                      className="text-white focus:ring-white bg-neutral-800 border-white/20"
                    />
                    <span>No, discrepancy observed</span>
                  </label>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px] font-mono">
                    Comments or Officer Feedback (Optional)
                  </label>
                  <input
                    type="text"
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="e.g. Handover was quick and orderly..."
                    className="w-full px-3.5 py-2 text-xs border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingFeedback}
                >
                  Submit Audit Confirmation
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Attach Document Modal */}
      <Modal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        title="Attach Supporting Proof"
        description="Upload additional documents or photos supporting your ownership claim."
      >
        <form onSubmit={handleAddDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Document Description
            </label>
            <input
              type="text"
              required
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="e.g. Purchase Invoice, Warranty Card, Photo with Item"
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-white/10 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <FileUpload
            label="Upload Document / Photo"
            onUploadSuccess={(url) => setDocUrl(url)}
          />

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDocModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAddingDoc}
              disabled={!docUrl}
            >
              Attach Proof
            </Button>
          </div>
        </form>
      </Modal>

      {/* Appeal Decision Modal */}
      <Modal
        isOpen={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        title="Appeal Claim Rejection"
        description="State your reasons and clarification to request supervisor review of this claim."
      >
        <form onSubmit={handleAppealSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Reason for Appeal
            </label>
            <textarea
              required
              rows={4}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Explain why the rejection should be reconsidered and clarify any previously missing details..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAppealModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingAppeal}
            >
              Submit Appeal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Withdraw Claim Dialog */}
      <ConfirmDialog
        isOpen={showWithdrawDialog}
        onClose={() => setShowWithdrawDialog(false)}
        onConfirm={handleWithdraw}
        title="Withdraw This Claim?"
        message="Are you sure you wish to withdraw your ownership claim? You will not be able to re-claim this item."
        confirmLabel="Yes, Withdraw Claim"
        isDestructive={true}
        isLoading={isWithdrawing}
      />
    </FadeIn>
  );
};
