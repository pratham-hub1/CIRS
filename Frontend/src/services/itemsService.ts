import { apiClient } from './apiClient';
import {
  CreateItemPayload,
  Item,
  ItemsFilterParams,
  PublicItem,
  UpdateItemPayload,
  CaseMessage,
} from '../types/item';
import { DEMO_ITEMS, DEMO_CASE_MESSAGES } from './demoFixtures';
import { ItemStatus, Role } from '../types/enums';

export const itemsService = {
  async createItem(payload: CreateItemPayload): Promise<Item> {
    if (apiClient.isDemoMode()) {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const caseId = `CIRS-${year}-${randomSuffix}`;
      const newItem: Item = {
        id: `item-${Date.now()}`,
        caseId,
        type: payload.type,
        reporterId: 'user-std-101',
        campusId: 'campus-1',
        itemName: payload.itemName,
        category: payload.category,
        description: payload.description,
        colour: payload.colour,
        brand: payload.brand,
        identifyingMarks: payload.identifyingMarks,
        serialNumber: payload.serialNumber || null,
        status: payload.type === 'LOST' ? ItemStatus.LOST_REPORTED : ItemStatus.FOUND,
        dateLost: payload.dateLost || null,
        lastKnownLocation: payload.lastKnownLocation || null,
        dateFound: payload.dateFound || null,
        foundLocation: payload.foundLocation || null,
        storageLocationId: payload.storageLocationId || null,
        images: payload.images || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      DEMO_ITEMS.unshift(newItem);
      return newItem;
    }
    return apiClient.post<Item>('/items', payload);
  },

  async getItems(params?: ItemsFilterParams): Promise<Item[]> {
    if (apiClient.isDemoMode()) {
      let filtered = [...DEMO_ITEMS];
      if (params?.category) {
        filtered = filtered.filter((i) => i.category === params.category);
      }
      if (params?.status) {
        filtered = filtered.filter((i) => i.status === params.status);
      }
      if (params?.type) {
        filtered = filtered.filter((i) => i.type === params.type);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.itemName.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.brand.toLowerCase().includes(q) ||
            i.colour.toLowerCase().includes(q) ||
            i.caseId.toLowerCase().includes(q),
        );
      }
      return filtered;
    }
    return apiClient.get<Item[]>('/items', { params: params as Record<string, any> });
  },

  async getMyItems(): Promise<Item[]> {
    if (apiClient.isDemoMode()) {
      return DEMO_ITEMS.filter((i) => i.reporterId === 'user-std-101');
    }
    return apiClient.get<Item[]>('/items/mine');
  },

  async getItemByCaseId(caseId: string): Promise<Item | PublicItem> {
    if (apiClient.isDemoMode()) {
      const found = DEMO_ITEMS.find((i) => i.caseId === caseId);
      if (!found) {
        throw new Error(`Case with ID ${caseId} not found`);
      }
      return found;
    }
    return apiClient.get<Item | PublicItem>(`/items/${caseId}`);
  },

  async editItem(caseId: string, payload: UpdateItemPayload): Promise<Item> {
    if (apiClient.isDemoMode()) {
      const index = DEMO_ITEMS.findIndex((i) => i.caseId === caseId);
      if (index !== -1) {
        DEMO_ITEMS[index] = {
          ...DEMO_ITEMS[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        return DEMO_ITEMS[index];
      }
      throw new Error(`Item ${caseId} not found`);
    }
    return apiClient.patch<Item>(`/items/${caseId}`, payload);
  },

  async cancelItem(caseId: string): Promise<Item> {
    if (apiClient.isDemoMode()) {
      const index = DEMO_ITEMS.findIndex((i) => i.caseId === caseId);
      if (index !== -1) {
        DEMO_ITEMS[index].status = ItemStatus.ARCHIVED;
        DEMO_ITEMS[index].archivedAt = new Date().toISOString();
        return DEMO_ITEMS[index];
      }
      throw new Error(`Item ${caseId} not found`);
    }
    return apiClient.post<Item>(`/items/${caseId}/cancel`);
  },

  async getCaseMessages(caseId: string): Promise<CaseMessage[]> {
    if (apiClient.isDemoMode()) {
      return DEMO_CASE_MESSAGES;
    }
    return apiClient.get<CaseMessage[]>(`/items/${caseId}/messages`);
  },

  async addCaseMessage(caseId: string, body: string): Promise<CaseMessage> {
    if (apiClient.isDemoMode()) {
      const newMsg: CaseMessage = {
        id: `msg-${Date.now()}`,
        itemId: 'item-1',
        senderId: 'user-std-101',
        body,
        visibleToStaff: true,
        createdAt: new Date().toISOString(),
        sender: {
          id: 'user-std-101',
          name: 'Aarav Sharma',
          role: Role.STUDENT,
        },
      };
      DEMO_CASE_MESSAGES.push(newMsg);
      return newMsg;
    }
    return apiClient.post<CaseMessage>(`/items/${caseId}/messages`, { body });
  },
};
