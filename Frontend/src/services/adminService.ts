import { apiClient } from './apiClient';
import {
  AdminAnalyticsData,
  AdminItemsQueryParams,
  AdminItemsResponse,
  AuditLogResponse,
  CreateStorageLocationPayload,
  StorageLocation,
  UpdateStorageLocationPayload,
} from '../types/admin';
import { Item } from '../types/item';
import { Claim, Appeal } from '../types/claim';
import { AppealStatus, ClaimStatus, ItemStatus, StorageLocationName } from '../types/enums';
import {
  DEMO_ANALYTICS,
  DEMO_AUDIT_LOGS,
  DEMO_CLAIMS,
  DEMO_ITEMS,
  DEMO_STORAGE_LOCATIONS,
} from './demoFixtures';

export const adminService = {
  async getItems(query?: AdminItemsQueryParams): Promise<AdminItemsResponse> {
    if (apiClient.isDemoMode()) {
      let filtered = [...DEMO_ITEMS];
      if (query?.category) filtered = filtered.filter((i) => i.category === query.category);
      if (query?.status) filtered = filtered.filter((i) => i.status === query.status);
      if (query?.type) filtered = filtered.filter((i) => i.type === query.type);
      if (query?.storageLocationId) {
        filtered = filtered.filter((i) => i.storageLocationId === query.storageLocationId);
      }
      if (query?.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.itemName.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.caseId.toLowerCase().includes(q),
        );
      }
      return {
        total: filtered.length,
        page: query?.page || 1,
        limit: query?.limit || 50,
        totalPages: 1,
        items: filtered,
      };
    }
    return apiClient.get<AdminItemsResponse>('/admin/items', {
      params: query as Record<string, any>,
    });
  },

  async getStorageLocations(): Promise<StorageLocation[]> {
    if (apiClient.isDemoMode()) {
      return DEMO_STORAGE_LOCATIONS;
    }
    return apiClient.get<StorageLocation[]>('/admin/storage-locations');
  },

  async createStorageLocation(payload: CreateStorageLocationPayload): Promise<StorageLocation> {
    if (apiClient.isDemoMode()) {
      const newLoc: StorageLocation = {
        id: `loc-${Date.now()}`,
        campusId: 'campus-1',
        name: payload.name,
        createdAt: new Date().toISOString(),
        _count: { items: 0 },
      };
      DEMO_STORAGE_LOCATIONS.push(newLoc);
      return newLoc;
    }
    return apiClient.post<StorageLocation>('/admin/storage-locations', payload);
  },

  async updateStorageLocation(
    id: string,
    payload: UpdateStorageLocationPayload,
  ): Promise<StorageLocation> {
    if (apiClient.isDemoMode()) {
      const loc = DEMO_STORAGE_LOCATIONS.find((l) => l.id === id);
      if (loc) {
        loc.name = payload.name;
        return loc;
      }
      throw new Error(`Location ${id} not found`);
    }
    return apiClient.patch<StorageLocation>(`/admin/storage-locations/${id}`, payload);
  },

  async getAnalytics(params?: { startDate?: string; endDate?: string }): Promise<AdminAnalyticsData> {
    if (apiClient.isDemoMode()) {
      return DEMO_ANALYTICS;
    }
    return apiClient.get<AdminAnalyticsData>('/admin/analytics', { params });
  },

  async getAuditLog(query?: Record<string, any>): Promise<AuditLogResponse> {
    if (apiClient.isDemoMode()) {
      return {
        total: DEMO_AUDIT_LOGS.length,
        page: 1,
        limit: 50,
        totalPages: 1,
        logs: DEMO_AUDIT_LOGS,
      };
    }
    return apiClient.get<AuditLogResponse>('/admin/audit-log', { params: query });
  },

  async advanceItemStatus(caseId: string, status: ItemStatus): Promise<Item> {
    if (apiClient.isDemoMode()) {
      const item = DEMO_ITEMS.find((i) => i.caseId === caseId);
      if (item) {
        item.status = status;
        return item;
      }
      throw new Error(`Item ${caseId} not found`);
    }
    return apiClient.post<Item>(`/admin/items/${caseId}/status`, { status });
  },

  async markReadyForCollection(caseId: string): Promise<Item> {
    if (apiClient.isDemoMode()) {
      const item = DEMO_ITEMS.find((i) => i.caseId === caseId);
      if (item) {
        item.status = ItemStatus.READY_FOR_COLLECTION;
        return item;
      }
      throw new Error(`Item ${caseId} not found`);
    }
    return apiClient.post<Item>(`/admin/items/${caseId}/ready`);
  },

  async staffHandover(
    caseId: string,
    payload?: { override?: boolean; overrideReason?: string },
  ): Promise<Item> {
    if (apiClient.isDemoMode()) {
      const item = DEMO_ITEMS.find((i) => i.caseId === caseId);
      if (item) {
        item.status = ItemStatus.RETURNED;
        return item;
      }
      throw new Error(`Item ${caseId} not found`);
    }
    return apiClient.post<Item>(`/admin/items/${caseId}/handover`, payload || {});
  },

  async archiveItem(caseId: string): Promise<Item> {
    if (apiClient.isDemoMode()) {
      const item = DEMO_ITEMS.find((i) => i.caseId === caseId);
      if (item) {
        item.status = ItemStatus.ARCHIVED;
        item.archivedAt = new Date().toISOString();
        return item;
      }
      throw new Error(`Item ${caseId} not found`);
    }
    return apiClient.post<Item>(`/admin/items/${caseId}/archive`);
  },

  async markUnclaimed(caseId: string): Promise<Item> {
    if (apiClient.isDemoMode()) {
      const item = DEMO_ITEMS.find((i) => i.caseId === caseId);
      if (item) {
        item.status = ItemStatus.UNCLAIMED;
        return item;
      }
      throw new Error(`Item ${caseId} not found`);
    }
    return apiClient.post<Item>(`/admin/items/${caseId}/unclaimed`);
  },

  async getClaims(status?: ClaimStatus): Promise<Claim[]> {
    if (apiClient.isDemoMode()) {
      if (status) {
        return DEMO_CLAIMS.filter((c) => c.status === status);
      }
      return DEMO_CLAIMS;
    }
    return apiClient.get<Claim[]>('/admin/claims', {
      params: { status },
    });
  },

  async requestMoreInfo(claimId: string, reason: string, questions?: string[]): Promise<Claim> {
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === claimId);
      if (claim) {
        claim.status = ClaimStatus.INFO_REQUESTED;
        if (questions && questions.length > 0) {
          questions.forEach((q, idx) => {
            claim.questions.push({
              id: `q-custom-${Date.now()}-${idx}`,
              claimId,
              questionText: q,
              source: 1 as any, // MANUAL
              answerText: null,
            });
          });
        }
        return claim;
      }
      throw new Error(`Claim ${claimId} not found`);
    }
    return apiClient.post<Claim>(`/admin/claims/${claimId}/request-info`, {
      reason,
      questions,
    });
  },

  async approveClaim(claimId: string): Promise<any> {
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === claimId);
      if (claim) {
        claim.status = ClaimStatus.APPROVED;
        claim.collectionToken = {
          id: `token-${Date.now()}`,
          claimId,
          code: `GSFC-${Math.floor(1000 + Math.random() * 9000)}-OK`,
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          usedAt: null,
          createdAt: new Date().toISOString(),
        };
        const item = DEMO_ITEMS.find((i) => i.id === claim.itemId);
        if (item) {
          item.status = ItemStatus.READY_FOR_COLLECTION;
        }
        return {
          claimId,
          status: ClaimStatus.APPROVED,
          holdCreated: true,
          collectionToken: { issued: true, expiresAt: claim.collectionToken.expiresAt },
        };
      }
      throw new Error(`Claim ${claimId} not found`);
    }
    return apiClient.post<any>(`/admin/claims/${claimId}/approve`);
  },

  async rejectClaim(claimId: string, reason: string): Promise<Claim> {
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === claimId);
      if (claim) {
        claim.status = ClaimStatus.REJECTED;
        claim.decisionReason = reason;
        return claim;
      }
      throw new Error(`Claim ${claimId} not found`);
    }
    return apiClient.post<Claim>(`/admin/claims/${claimId}/reject`, { reason });
  },

  async addQuestions(claimId: string, questions: string[]): Promise<Claim> {
    if (apiClient.isDemoMode()) {
      const claim = DEMO_CLAIMS.find((c) => c.id === claimId);
      if (claim) {
        questions.forEach((q, idx) => {
          claim.questions.push({
            id: `q-add-${Date.now()}-${idx}`,
            claimId,
            questionText: q,
            source: 1 as any, // MANUAL
            answerText: null,
          });
        });
        return claim;
      }
      throw new Error(`Claim ${claimId} not found`);
    }
    return apiClient.post<Claim>(`/admin/claims/${claimId}/questions`, { questions });
  },

  async decideAppeal(
    appealId: string,
    status: AppealStatus,
    decisionReason?: string,
  ): Promise<Appeal> {
    if (apiClient.isDemoMode()) {
      for (const claim of DEMO_CLAIMS) {
        const app = claim.appeals.find((a) => a.id === appealId);
        if (app) {
          app.status = status;
          if (status === AppealStatus.ACCEPTED) {
            claim.status = ClaimStatus.PENDING; // Reopens claim to PENDING per INT-3
          }
          return app;
        }
      }
      throw new Error(`Appeal ${appealId} not found`);
    }
    return apiClient.post<Appeal>(`/admin/appeals/${appealId}/decide`, {
      status,
      decisionReason,
    });
  },
};
