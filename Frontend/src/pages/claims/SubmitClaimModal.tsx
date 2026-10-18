import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
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
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Verification Policy</span>
            <span className="text-sm font-semibold text-slate-800">
              {category} Category Assessment
            </span>
          </div>
          <VerificationLevelBadge level={verificationLevel} />
        </div>

        {/* Claim Basic Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-1">
            1. Loss Incident & Identifying Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Estimated Date/Time Lost <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dateLost}
                onChange={(e) => setDateLost(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Place Lost <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={placeLost}
                onChange={(e) => setPlaceLost(e.target.value)}
                placeholder="e.g. Science Block Lab 2 or Cafeteria"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Identifying Marks & Unique Features <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={identifyingMarks}
              onChange={(e) => setIdentifyingMarks(e.target.value)}
              placeholder="Provide exact details only the true owner would know (e.g. stickers, minor scratches, specific cards inside)..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Claim Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how you came to lose this item and when you noticed it missing..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Verification Questions */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-1">
            2. Category Verification Questions
          </h4>
          <p className="text-xs text-slate-500">
            Answering these questions accurately speeds up approval by campus security officers.
          </p>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  {idx + 1}. {q}
                </label>
                <input
                  type="text"
                  value={answers[q] || ''}
                  onChange={(e) => handleAnswerChange(q, e.target.value)}
                  placeholder="Your answer..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Supporting Proof Upload */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-1">
            3. Proof of Ownership (Receipt, Invoice, Photo with item)
          </h4>
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
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting Claim...' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
