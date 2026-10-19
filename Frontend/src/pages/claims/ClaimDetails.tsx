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

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswersState((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmitAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !claim) return;

    const payloadAnswers = Object.entries(answersState)
      .filter(([_, ans]) => ans.trim().length > 0)
      .map(([questionId, answerText]) => ({
        questionId,
        answerText: answerText.trim(),
      }));

    if (payloadAnswers.length === 0) {
      error('Please provide an answer before submitting.');
      return;
    }

    setIsSubmittingAnswers(true);
    try {
      const updated = await claimsService.submitAnswers(id, { answers: payloadAnswers });
      setClaim(updated);
      success('Answers submitted! Your claim has been returned to PENDING for staff re-evaluation.');
      loadClaim();
    } catch (err: any) {
      error(err.message || 'Failed to submit answers');
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !docUrl) {
      error('Please upload a document file first.');
      return;
    }

    setIsAddingDoc(true);
    try {
      await claimsService.addDocument(id, { url: docUrl, docType });
      success('Supporting proof attached to claim.');
      setShowDocModal(false);
      setDocUrl('');
      loadClaim();
    } catch (err: any) {
      error(err.message || 'Failed to attach proof document');
    } finally {
      setIsAddingDoc(false);
    }
  };

  const handleWithdraw = async () => {
    if (!id) return;
    setIsWithdrawing(true);
    try {
      const updated = await claimsService.withdrawClaim(id);
      setClaim(updated);
      setShowWithdrawDialog(false);
      success('Claim withdrawn successfully');
    } catch (err: any) {
      error(err.message || 'Failed to withdraw claim');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !appealReason.trim()) return;

    setIsSubmittingAppeal(true);
    try {
      await claimsService.createAppeal(id, { reason: appealReason.trim() });
      success('Appeal submitted to campus security supervisor.');
      setShowAppealModal(false);
      setAppealReason('');
      loadClaim();
    } catch (err: any) {
      error(err.message || 'Failed to submit appeal');
    } finally {
      setIsSubmittingAppeal(false);
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
      setFeedbackSubmitted(true);
      success('Thank you for confirming your item recovery feedback!');
    } catch (err: any) {
      error(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleCopyCode = () => {
    if (claim?.collectionToken?.code) {
      navigator.clipboard.writeText(claim.collectionToken.code);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Accessing claim verification dossier..." />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Claim Not Found</h3>
        <button
          onClick={() => navigate('/my-claims')}
          className="mt-4 px-4 py-2 text-xs font-bold text-brand-600 hover:underline"
        >
          Return to My Claims
        </button>
      </div>
    );
  }

  const canWithdraw =
    claim.status === ClaimStatus.PENDING || claim.status === ClaimStatus.INFO_REQUESTED;
  const canAppeal = claim.status === ClaimStatus.REJECTED;

  return (
    <FadeIn className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Top back bar and options */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/my-claims')}
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
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
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-subtle p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <ClaimStatusBadge status={claim.status} size="md" />
              <VerificationLevelBadge level={claim.verificationLevel} />
              {claim.item && <CategoryBadge category={claim.item.category} />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Claim on {claim.item?.itemName || 'Reported Belonging'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Claim Ref: <span className="font-mono text-slate-700">{claim.id}</span>
            </p>
          </div>

          {claim.item && (
            <Link
              to={`/items/${claim.item.caseId}`}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 transition-colors self-start sm:self-auto shadow-subtle"
            >
              <span>View Case {claim.item.caseId}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          )}
        </div>

        {/* Golden Collection Pass (When Approved) */}
        {claim.status === ClaimStatus.APPROVED && claim.collectionToken && (
          <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-amber-500/20 border-2 border-amber-400/60 shadow-elevated space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-base">
                <Ticket className="w-5 h-5 text-amber-600" />
                <span>GSFC University Official Collection Pass</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wider">
                Authorized Handover
              </span>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-amber-300/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-800 block">
                  Single-Use Secure Collection Code
                </span>
                <span className="text-3xl sm:text-4xl font-mono font-black text-slate-900 tracking-widest mt-1.5 block">
                  {claim.collectionToken.code}
                </span>
                <span className="text-xs text-slate-500 mt-1.5 block font-medium">
                  Expires:{' '}
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
                className="inline-flex items-center px-5 py-2.5 text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 rounded-xl hover:bg-amber-200 transition-all self-start sm:self-auto shadow-sm"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-emerald-700" />
                    <span>Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5 text-amber-800" />
                    <span>Copy Voucher Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Offline Collection Instructions */}
            <div className="text-xs text-amber-950/90 space-y-1.5 pt-1 font-medium">
              <p className="font-bold text-amber-950">Campus Handover Protocol:</p>
              <p>• Visit the <strong>Campus Security Office (Main Academic Block, Ground Floor)</strong>.</p>
              <p>• Carry your university student or faculty identity card for visual match.</p>
              <p>• Present this 6-character code to the on-duty security officer for token redemption.</p>
            </div>
          </div>
        )}

        {/* Info Requested Alert */}
        {claim.status === ClaimStatus.INFO_REQUESTED && (
          <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1.5 shadow-subtle">
            <div className="flex items-center font-bold text-sm text-purple-950">
              <AlertCircle className="w-4 h-4 mr-2 text-purple-600 animate-pulse" />
              Additional Verification Required
            </div>
            <p className="text-purple-800 leading-relaxed font-normal">
              Campus security officers have reviewed your claim and requested responses to the questions below before approving physical collection.
            </p>
          </div>
        )}

        {/* Rejection Reason */}
        {claim.status === ClaimStatus.REJECTED && claim.decisionReason && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5 shadow-subtle">
            <span className="font-bold text-sm text-rose-950 block">Rejection Rationale:</span>
            <p className="text-rose-800 leading-relaxed font-normal">{claim.decisionReason}</p>
            <p className="text-[11px] text-rose-700 font-semibold mt-2">
              If you have supplementary evidence, you may file an appeal for supervisory review.
            </p>
          </div>
        )}

        {/* Submitted Incident Details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Submitted Incident Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Estimated Date Lost</span>
              <span className="font-bold text-slate-800 mt-1 block">
                {new Date(claim.dateLost).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Place Lost</span>
              <span className="font-bold text-slate-800 mt-1 block">{claim.placeLost}</span>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <span className="text-slate-400 block font-semibold text-[11px]">
                Identifying Marks Submitted
              </span>
              <span className="text-slate-800 mt-1 block leading-relaxed font-medium">
                {claim.identifyingMarks}
              </span>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <span className="text-slate-400 block font-semibold text-[11px]">Description</span>
              <span className="text-slate-800 mt-1 block leading-relaxed font-medium">
                {claim.description}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Questions and Answers */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Verification Questions & Responses
          </h3>

          <div className="space-y-3">
            {claim.questions.map((q, idx) => {
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      {idx + 1}. {q.questionText}
                    </span>
                    {q.answeredAt ? (
                      <span className="text-[10px] text-emerald-600 flex items-center font-bold">
                        <Check className="w-3 h-3 mr-0.5" /> Answered
                      </span>
                    ) : (
                      <span className="text-[10px] text-purple-600 font-bold uppercase">
                        Pending Response
                      </span>
                    )}
                  </div>

                  {q.answerText ? (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 font-medium">
                      {q.answerText}
                    </div>
                  ) : claim.status === ClaimStatus.INFO_REQUESTED ? (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={answersState[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Type your response to this verification question..."
                        className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
                      />
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No answer provided.</p>
                  )}
                </div>
              );
            })}
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
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Attached Proof Documents ({claim.documents.length})
            </h3>
            <button
              onClick={() => setShowDocModal(true)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center"
            >
              <Upload className="w-3.5 h-3.5 mr-1" /> Attach Additional Proof
            </button>
          </div>

          {claim.documents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No proof documents attached to this claim.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {claim.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs shadow-subtle"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{doc.docType}</span>
                  </div>
                  <a
                    href={resolveImageUrl(doc.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-brand-600 hover:underline flex-shrink-0 ml-2"
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
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Post-Collection Recovery Feedback
            </h3>

            {feedbackSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                Thank you! Your recovery audit verification has been safely recorded.
              </div>
            ) : (
              <form
                onSubmit={handleFeedbackSubmit}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs shadow-subtle"
              >
                <p className="text-slate-700 font-medium">
                  Did you receive your exact lost belonging during physical handover at campus security?
                </p>

                <div className="flex items-center space-x-5">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="radio"
                      name="correctItem"
                      checked={isCorrectItem}
                      onChange={() => setIsCorrectItem(true)}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>Yes, verified exact belonging</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="radio"
                      name="correctItem"
                      checked={!isCorrectItem}
                      onChange={() => setIsCorrectItem(false)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>No, discrepancy observed</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold text-[11px]">
                    Comments or Officer Feedback (Optional)
                  </label>
                  <input
                    type="text"
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="e.g. Handover was quick and orderly..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Document Description
            </label>
            <input
              type="text"
              required
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="e.g. Purchase Invoice, Warranty Card, Photo with Item"
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason for Appeal
            </label>
            <textarea
              required
              rows={4}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Explain why the rejection should be reconsidered and clarify any previously missing details..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
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
