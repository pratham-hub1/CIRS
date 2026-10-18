import { apiClient } from './apiClient';
import { PublicItem } from '../types/item';
import { CreateSavedSearchPayload, SavedSearch } from '../types/savedSearch';
import { PaginatedResponse } from '../types/api';
import { DEMO_ITEMS, DEMO_SAVED_SEARCHES } from './demoFixtures';
import { ItemCategory, ItemStatus, ItemType } from '../types/enums';

export interface FeedQueryParams {
  category?: ItemCategory;
  status?: ItemStatus;
  type?: ItemType;
  q?: string;
  limit?: number;
  cursor?: string;
}

export const searchService = {
  async getCommunityFeed(params?: FeedQueryParams): Promise<PaginatedResponse<PublicItem>> {
    if (apiClient.isDemoMode()) {
      let publicItems: PublicItem[] = DEMO_ITEMS.filter(
        (i) => i.status !== ItemStatus.ARCHIVED && i.status !== ItemStatus.UNCLAIMED,
      ).map((item) => ({
        caseId: item.caseId,
        type: item.type,
        itemName: item.itemName,
        category: item.category,
        description: item.description,
        colour: item.colour,
        brand: item.brand,
        identifyingMarks: item.identifyingMarks,
        status: item.status,
        dateLost: item.dateLost,
        lastKnownLocation: item.lastKnownLocation,
        dateFound: item.dateFound,
        foundLocation: item.foundLocation,
        images: (item.images || []).map((img) => (typeof img === 'string' ? img : img.url)),
        createdAt: item.createdAt,
      }));

      if (params?.type) {
        publicItems = publicItems.filter((i) => i.type === params.type);
      }
      if (params?.category) {
        publicItems = publicItems.filter((i) => i.category === params.category);
      }
      if (params?.status) {
        publicItems = publicItems.filter((i) => i.status === params.status);
      }
      if (params?.q) {
        const q = params.q.toLowerCase();
        publicItems = publicItems.filter(
          (i) =>
            i.itemName.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.brand.toLowerCase().includes(q) ||
            i.colour.toLowerCase().includes(q) ||
            (i.foundLocation && i.foundLocation.toLowerCase().includes(q)) ||
            (i.lastKnownLocation && i.lastKnownLocation.toLowerCase().includes(q)),
        );
      }

      return {
        data: publicItems,
        nextCursor: undefined,
        total: publicItems.length,
      };
    }

    return apiClient.get<PaginatedResponse<PublicItem>>('/feed', {
      params: params as Record<string, any>,
    });
  },

  async getSavedSearches(): Promise<SavedSearch[]> {
    if (apiClient.isDemoMode()) {
      return DEMO_SAVED_SEARCHES;
    }
    return apiClient.get<SavedSearch[]>('/saved-searches');
  },

  async createSavedSearch(payload: CreateSavedSearchPayload): Promise<SavedSearch> {
    if (apiClient.isDemoMode()) {
      const newWatch: SavedSearch = {
        id: `ss-${Date.now()}`,
        userId: 'user-std-101',
        name: payload.name,
        criteria: payload.criteria,
        active: true,
        createdAt: new Date().toISOString(),
      };
      DEMO_SAVED_SEARCHES.unshift(newWatch);
      return newWatch;
    }
    return apiClient.post<SavedSearch>('/saved-searches', payload);
  },

  async deleteSavedSearch(id: string): Promise<{ message?: string }> {
    if (apiClient.isDemoMode()) {
      const idx = DEMO_SAVED_SEARCHES.findIndex((s) => s.id === id);
      if (idx !== -1) {
        DEMO_SAVED_SEARCHES.splice(idx, 1);
      }
      return { message: 'Watch deleted' };
    }
    return apiClient.delete<{ message?: string }>(`/saved-searches/${id}`);
  },
};
