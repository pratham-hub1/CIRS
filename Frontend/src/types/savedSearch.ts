import { ItemCategory, ItemType } from './enums';

export interface SavedSearchCriteria {
  q?: string;
  category?: ItemCategory;
  type?: ItemType;
  location?: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  criteria: SavedSearchCriteria;
  active: boolean;
  createdAt: string;
}

export interface CreateSavedSearchPayload {
  name: string;
  criteria: SavedSearchCriteria;
}
