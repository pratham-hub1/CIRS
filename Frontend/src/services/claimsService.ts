import { apiClient } from './apiClient';
import {
  AddDocumentPayload,
  Claim,
  ClaimDocument,
  CreateAppealPayload,
  CreateClaimPayload,
  PostReturnFeedbackPayload,
  SubmitAnswersPayload,
  Appeal,
} from '../types/claim';
import { DEMO_CLAIMS, DEMO_ITEMS } from './demoFixtures';
import { ClaimStatus, VerificationLevel, AppealStatus } from '../types/enums';

export const claimsService = {
  async createClaim(caseId: string, payload: CreateClaimPayload): Promise<Claim> {
    const idempotencyKey = `claim-${caseId}-${Date.now()}`;
    if (apiClient.isDemoMode()) {
      const targetItem = DEMO_ITEMS.find((i) => i.caseId === caseId) || DEMO_ITEMS[0];
      const newClaim: Claim = {
        id: `claim-${Date.now()}`,
        itemId: targetItem.id,
        itemType: targetItem.type,
        claimantId: 'user-std-101',
        description: payload.description,
        dateLost: payload.dateLost,
        placeLost: payload.placeLost,
        identifyingMarks: payload.identifyingMarks,
        verificationLevel: VerificationLevel.HIGH,
        status: ClaimStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        item: targetItem,
        questions: (payload.answers || []).map((a, idx) => ({
          id: `q-ans-${idx}`,
          claimId: `claim-${Date.now()}`,
          questionText: a.questionText,
          source: 0 as any, // AUTO
          answerText: a.answerText,
          answeredAt: new Date().toISOString(),
        })),
        documents: (payload.documents || []).map((d, idx) => ({
          id: `doc-${idx}`,
          claimId: `claim-${Date.now()}`,
          url: d.url,
          docType: d.docType,
          createdAt: new Date().toISOString(),
        })),
        appeals: [],
      };
      DEMO_CLAIMS.unshift(newClaim);
      return newClaim;
    }
    return apiClient.post<Claim>(`/items/${caseId}/claims`, payload, { idempotencyKey });
  },

  async getMyClaims(): Promise<Claim[]> {
    if (apiClient.isDemoMode()) {
      return DEMO_CLAIMS;
    }
    return apiClient.get<Claim[]>('/claims/mine');
  },

  async getClaimById(id: string): Promise<Claim> {
    if (apiClient.isDemoMode()) {
      const found = DEMO_CLAIMS.find((c) => c.id === id);
      if (!found) {
        throw new Error(`Claim with ID ${id} not found`);
      }
      return found;
    }
    return apiClient.get<Claim>(`/claims/${id}`);
  },

  async withdrawClaim(id: string): Promise<Claim> {
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === id);
      if (claim) {
        claim.status = ClaimStatus.WITHDRAWN;
        return claim;
      }
      throw new Error(`Claim ${id} not found`);
    }
    return apiClient.post<Claim>(`/claims/${id}/withdraw`);
  },

  async submitAnswers(id: string, payload: SubmitAnswersPayload): Promise<Claim> {
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === id);
      if (claim) {
        payload.answers.forEach((ans) => {
          const q = claim.questions.find((x) => x.id === ans.questionId);
          if (q) {
            q.answerText = ans.answerText;
            q.answeredAt = new Date().toISOString();
          }
        });
        claim.status = ClaimStatus.PENDING; // Transitions back to PENDING per backend WF-2
        return claim;
      }
      throw new Error(`Claim ${id} not found`);
    }
    return apiClient.post<Claim>(`/claims/${id}/answers`, payload);
  },

  async addDocument(id: string, payload: AddDocumentPayload): Promise<ClaimDocument> {
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === id);
      const newDoc: ClaimDocument = {
        id: `doc-${Date.now()}`,
        claimId: id,
        url: payload.url,
        docType: payload.docType,
        createdAt: new Date().toISOString(),
      };
      if (claim) {
        claim.documents.push(newDoc);
      }
      return newDoc;
    }
    return apiClient.post<ClaimDocument>(`/claims/${id}/documents`, payload);
  },

  async createAppeal(id: string, payload: CreateAppealPayload): Promise<Appeal> {
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === id);
      const newAppeal: Appeal = {
        id: `appeal-${Date.now()}`,
        claimId: id,
        appellantId: 'user-std-101',
        reason: payload.reason,
        status: AppealStatus.PENDING,
        createdAt: new Date().toISOString(),
      };
      if (claim) {
        claim.appeals.push(newAppeal);
      }
      return newAppeal;
    }
    return apiClient.post<Appeal>(`/claims/${id}/appeals`, payload);
  },

  async redeemToken(claimId: string, code: string): Promise<{ redeemed: boolean; itemId: string }> {
    const idempotencyKey = `redeem-${claimId}-${code}`;
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === claimId);
      if (claim && claim.collectionToken) {
        claim.collectionToken.usedAt = new Date().toISOString();
        return { redeemed: true, itemId: claim.itemId };
      }
      return { redeemed: true, itemId: 'item-1' };
    }
    return apiClient.post<{ redeemed: boolean; itemId: string }>(
      `/claims/${claimId}/redeem`,
      { code },
      { idempotencyKey },
    );
  },

  async confirmReceipt(caseId: string): Promise<{ message?: string }> {
    if (apiClient.isDemoMode()) {
      const item = DEMO_ITEMS.find((i) => i.caseId === caseId);
      if (item) {
        item.status = 'RETURNED' as any;
      }
      return { message: 'Item receipt successfully confirmed.' };
    }
    return apiClient.post<{ message?: string }>(`/items/${caseId}/confirm-receipt`);
  },

  async submitPostReturnFeedback(
    claimId: string,
    payload: PostReturnFeedbackPayload,
  ): Promise<{ message?: string }> {
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === claimId);
      if (claim) {
        claim.postReturnFeedback = JSON.stringify(payload);
      }
      return { message: 'Feedback submitted successfully' };
    }
    return apiClient.post<{ message?: string }>(
      `/claims/${claimId}/post-return-feedback`,
      payload,
    );
  },
};
