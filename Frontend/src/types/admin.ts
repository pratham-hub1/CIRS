import { ItemCategory, ItemStatus, ItemType, StorageLocationName, Role } from './enums';
import { Item } from './item';

export interface AdminAnalyticsMetrics {
  totalReported: number;
  totalLost: number;
  totalFound: number;
  totalReturned: number;
  recoveryRate: number; // percentage
  pendingClaims: number;
  activeHolds: number;
}

export interface AdminAnalyticsHotspot {
  location: string;
  count: number;
}

export interface AdminAnalyticsData {
  metrics: AdminAnalyticsMetrics;
  statusBreakdown: Record<ItemStatus, number>;
  categoryBreakdown: Record<ItemCategory, number>;
  hotspots: {
    found: AdminAnalyticsHotspot[];
    lost: AdminAnalyticsHotspot[];
  };
}

export interface StorageLocation {
  id: string;
  campusId: string;
  name: StorageLocationName;
  createdAt: string;
  _count?: {
    items: number;
  };
}

export interface CreateStorageLocationPayload {
  name: StorageLocationName;
}

export interface UpdateStorageLocationPayload {
  name: StorageLocationName;
}

export interface AuditLogActor {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  createdAt: string;
  actor?: AuditLogActor | null;
}

export interface AuditLogResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  logs: AuditLogEntry[];
}

export interface AdminItemsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: Item[];
}

export interface AdminItemsQueryParams {
  page?: number;
  limit?: number;
  category?: ItemCategory;
  status?: ItemStatus;
  type?: ItemType;
  storageLocationId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}
