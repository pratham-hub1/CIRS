import { AppealStatus, ClaimStatus, ItemType, QuestionSource, Role, VerificationLevel } from './enums';
import { Item } from './item';

export interface ClaimQuestion {
  id: string;
  claimId: string;
  questionText: string;
  source: QuestionSource;
  answerText?: string | null;
  answeredAt?: string | null;
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  url: string;
  docType: string;
  createdAt: string;
}

export interface CollectionToken {
  id: string;
  claimId: string;
  code: string;
  expiresAt: string;
  usedAt?: string | null;
  createdAt: string;
}

export interface Appeal {
  id: string;
  claimId: string;
  appellantId: string;
  reason: string;
  status: AppealStatus;
  decidedBy?: string | null;
  decidedAt?: string | null;
  createdAt: string;
}

export interface Claim {
  id: string;
  itemId: string;
  itemType: ItemType;
  claimantId: string;
  description: string;
  dateLost: string;
  placeLost: string;
  identifyingMarks: string;
  verificationLevel: VerificationLevel;
  status: ClaimStatus;
  decidedBy?: string | null;
  decidedAt?: string | null;
  decisionReason?: string | null;
  handoverAt?: string | null;
  receiptConfirmedAt?: string | null;
  postReturnFeedback?: string | null;
  createdAt: string;
  updatedAt: string;
  item?: Item;
  claimant?: {
    id: string;
    name: string;
    email: string;
    role?: Role;
  };
  questions: ClaimQuestion[];
  documents: ClaimDocument[];
  collectionToken?: CollectionToken | null;
  appeals: Appeal[];
}

export interface ClaimAnswerInput {
  questionText: string;
  answerText: string;
}

export interface ClaimDocumentInput {
  url: string;
  docType: string;
}

export interface CreateClaimPayload {
  description: string;
  dateLost: string;
  placeLost: string;
  identifyingMarks: string;
  answers?: ClaimAnswerInput[];
  documents?: ClaimDocumentInput[];
}

export interface SubmitAnswersPayload {
  answers: {
    questionId: string;
    answerText: string;
  }[];
}

export interface AddDocumentPayload {
  url: string;
  docType: string;
}

export interface CreateAppealPayload {
  reason: string;
}

export interface PostReturnFeedbackPayload {
  isCorrectItem: boolean;
  comments?: string;
}
