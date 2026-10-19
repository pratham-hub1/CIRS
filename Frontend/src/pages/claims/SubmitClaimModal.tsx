import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { claimsService } from '../../services/claimsService';
import { ItemCategory, VerificationLevel } from '../../types/enums';
import { VerificationLevelBadge } from '../../components/common/Badge';
import { FileUpload } from '../../components/common/FileUpload';
import { useToast } from '../../context/ToastContext';

interface SubmitClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  itemName: string;
  category: ItemCategory;
  onSuccess: () => void;
}

export function getVerificationQuestionsForCategory(category: ItemCategory): string[] {
  switch (category) {
    case ItemCategory.ELECTRONICS:
      return [
        'What is the wallpaper or lock screen image on the device?',
        'What is the exact model, storage capacity, or colour variant?',
        'Are there any distinctive scratches, stickers, or case details?',
      ];
    case ItemCategory.WALLETS:
      return [
        'What cards, identification cards, or documents are inside the wallet?',
        'What is the approximate amount or denominations of currency inside?',
        'What is the brand, colour, and material of the wallet?',
      ];
    case ItemCategory.BAGS:
      return [
        'What items, books, or devices are inside the main and side compartments?',
        'What brand, colour, and keychains or badges are attached to the bag?',
      ];
    case ItemCategory.ACCESSORIES:
      return [
        'What brand, model, or distinctive engravings/markings are on this accessory?',
        'What is the colour, material, and strap/chain style?',
      ];
    case ItemCategory.DOCUMENTS:
      return [
        'What is the full name, roll number, or identifier written on the document?',
        'Which institution, department, or authority issued the document?',
      ];
    case ItemCategory.KEYS:
      return [
        'How many keys are on the ring and what keychains or tags are attached?',
        'What type of locks or vehicles do the keys correspond to?',
      ];
    case ItemCategory.CLOTHING:
    case ItemCategory.STATIONERY:
    case ItemCategory.OTHERS:
    default:
      return [
        'Describe any distinctive labels, brand marks, writing, or contents.',
        'When and where did you lose this item?',
      ];
  }
}

export function getVerificationLevelForCategory(category: ItemCategory): VerificationLevel {
  if (category === ItemCategory.ELECTRONICS || category === ItemCategory.WALLETS) {
    return VerificationLevel.HIGH;
  }
  if (category === ItemCategory.BAGS || category === ItemCategory.ACCESSORIES) {
    return VerificationLevel.MEDIUM;
  }
  return VerificationLevel.LOW;
}

export const SubmitClaimModal: React.FC<SubmitClaimModalProps> = ({
  isOpen,
  onClose,
  caseId,
  itemName,
  category,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const verificationLevel = getVerificationLevelForCategory(category);
  const questions = getVerificationQuestionsForCategory(category);

  const [description, setDescription] = useState('');
  const [dateLost, setDateLost] = useState(new Date().toISOString().slice(0, 16));
  const [placeLost, setPlaceLost] = useState('');
  const [identifyingMarks, setIdentifyingMarks] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<{ url: string; docType: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerChange = (question: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !placeLost.trim() || !identifyingMarks.trim()) {
      error('Please fill out all required claim verification fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qText, aText]) => ({
        questionText: qText,
        answerText: aText.trim(),
      }));

      await claimsService.createClaim(caseId, {
        description: description.trim(),
        dateLost: new Date(dateLost).toISOString(),
        placeLost: placeLost.trim(),
        identifyingMarks: identifyingMarks.trim(),
        answers: formattedAnswers.length > 0 ? formattedAnswers : undefined,
        documents: uploadedDocuments.length > 0 ? uploadedDocuments : undefined,
      });

      success('Ownership claim submitted for review by campus security!');
      onSuccess();
    } catch (err: any) {
      error(err.message || 'Failed to submit ownership claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Ownership Claim"
      description={`Submit proof of ownership for "${itemName}" (Case: ${caseId})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Verification Requirements Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Security Protocol Level
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {category} Category Assessment
            </span>
          </div>
          <VerificationLevelBadge level={verificationLevel} />
        </div>

        {/* Claim Basic Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-md bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Loss Incident & Identifying Details
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Estimated Date & Time Lost <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dateLost}
                onChange={(e) => setDateLost(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Place Lost <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={placeLost}
                onChange={(e) => setPlaceLost(e.target.value)}
                placeholder="e.g. Science Block Lab 2 or Cafeteria"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Identifying Marks & Unique Features <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={identifyingMarks}
              onChange={(e) => setIdentifyingMarks(e.target.value)}
              placeholder="Provide exact details only the true owner would know (e.g. stickers, minor scratches, specific cards inside)..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Claim Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how you came to lose this item and when you noticed it missing..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
            />
          </div>
        </div>

        {/* Verification Questions */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-md bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Category Verification Questions
            </h4>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Answering these questions accurately speeds up approval by campus security officers.
          </p>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {idx + 1}. {q}
                </label>
                <input
                  type="text"
                  value={answers[q] || ''}
                  onChange={(e) => handleAnswerChange(q, e.target.value)}
                  placeholder="Your answer..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Supporting Proof Upload */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-md bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Proof of Ownership (Receipt, Invoice, Photo with item)
            </h4>
          </div>
          <FileUpload
            label="Upload Proof Document or Photo"
            helperText="Purchase invoice, warranty card, previous photo with item, etc. Max: 10 MB."
            onUploadSuccess={(url, name) =>
              setUploadedDocuments((prev) => [...prev, { url, docType: name }])
            }
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            className="px-6"
          >
            Submit Ownership Claim
          </Button>
        </div>
      </form>
    </Modal>
  );
};
