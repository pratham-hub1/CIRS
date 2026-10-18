import { ItemCategory, ItemStatus, ItemType, Role } from './enums';

export interface ItemImage {
  id?: string;
  url: string;
  sortOrder?: number;
}

export interface Item {
  id: string;
  caseId: string;
  type: ItemType;
  reporterId: string;
  campusId: string;
  departmentId?: string | null;
  itemName: string;
  category: ItemCategory;
  description: string;
  colour: string;
  brand: string;
  identifyingMarks: string;
  serialNumber?: string | null;
  status: ItemStatus;
  dateLost?: string | null;
  lastKnownLocation?: string | null;
  dateFound?: string | null;
  foundLocation?: string | null;
  storageLocationId?: string | null;
  storageLocation?: {
    id: string;
    name: string;
  } | null;
  images: (ItemImage | string)[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  reporter?: {
    id: string;
    name: string;
    email: string;
    role?: Role;
  };
  claims?: any[];
}

export interface PublicItem {
  caseId: string;
  type: ItemType;
  itemName: string;
  category: ItemCategory;
  description: string;
  colour: string;
  brand: string;
  identifyingMarks: string;
  status: ItemStatus;
  dateLost?: string | null;
  lastKnownLocation?: string | null;
  dateFound?: string | null;
  foundLocation?: string | null;
  images: string[];
  createdAt: string;
}

export interface CreateItemPayload {
  type: ItemType;
  itemName: string;
  category: ItemCategory;
  description: string;
  colour: string;
  brand: string;
  identifyingMarks: string;
  serialNumber?: string;
  dateLost?: string;
  lastKnownLocation?: string;
  dateFound?: string;
  foundLocation?: string;
  storageLocationId?: string;
  images?: string[];
}

export interface UpdateItemPayload {
  itemName?: string;
  category?: ItemCategory;
  description?: string;
  colour?: string;
  brand?: string;
  identifyingMarks?: string;
  serialNumber?: string;
  lastKnownLocation?: string;
  foundLocation?: string;
  storageLocationId?: string;
}

export interface CaseMessage {
  id: string;
  itemId: string;
  senderId: string;
  body: string;
  visibleToStaff: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    email?: string;
    role: Role;
  };
}

export interface ItemsFilterParams {
  category?: ItemCategory;
  status?: ItemStatus;
  type?: ItemType;
  search?: string;
  limit?: number;
  cursor?: string;
}
