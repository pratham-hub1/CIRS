export enum Role {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  ADMIN = 'ADMIN',
}

export enum ItemType {
  LOST = 'LOST',
  FOUND = 'FOUND',
}

export enum ItemCategory {
  ELECTRONICS = 'ELECTRONICS',
  WALLETS = 'WALLETS',
  DOCUMENTS = 'DOCUMENTS',
  BAGS = 'BAGS',
  CLOTHING = 'CLOTHING',
  ACCESSORIES = 'ACCESSORIES',
  STATIONERY = 'STATIONERY',
  KEYS = 'KEYS',
  OTHERS = 'OTHERS',
}

export enum ItemStatus {
  LOST_REPORTED = 'LOST_REPORTED',
  FOUND = 'FOUND',
  READY_FOR_COLLECTION = 'READY_FOR_COLLECTION',
  RETURNED = 'RETURNED',
  ARCHIVED = 'ARCHIVED',
  UNCLAIMED = 'UNCLAIMED',
}

export enum ClaimStatus {
  PENDING = 'PENDING',
  INFO_REQUESTED = 'INFO_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum VerificationLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum StorageLocationName {
  SECURITY_OFFICE = 'SECURITY_OFFICE',
  LIBRARY = 'LIBRARY',
  LABORATORY = 'LABORATORY',
  DEPARTMENT_OFFICE = 'DEPARTMENT_OFFICE',
  RECEPTION = 'RECEPTION',
}

export enum NotificationType {
  REPORT_SUBMITTED = 'REPORT_SUBMITTED',
  POSSIBLE_MATCH = 'POSSIBLE_MATCH',
  NEW_CLAIM = 'NEW_CLAIM',
  MORE_INFO_NEEDED = 'MORE_INFO_NEEDED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  READY_FOR_COLLECTION = 'READY_FOR_COLLECTION',
  ITEM_RETURNED = 'ITEM_RETURNED',
}

export enum MatchStatus {
  SUGGESTED = 'SUGGESTED',
  CONFIRMED = 'CONFIRMED',
  DISMISSED = 'DISMISSED',
}

export enum AppealStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum Channel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
}

export enum QuestionSource {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

// User-friendly display mappings
export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  [ItemCategory.ELECTRONICS]: 'Electronics',
  [ItemCategory.WALLETS]: 'Wallets & Purses',
  [ItemCategory.DOCUMENTS]: 'Cards & Documents',
  [ItemCategory.BAGS]: 'Bags & Backpacks',
  [ItemCategory.CLOTHING]: 'Clothing & Apparel',
  [ItemCategory.ACCESSORIES]: 'Watches & Accessories',
  [ItemCategory.STATIONERY]: 'Books & Stationery',
  [ItemCategory.KEYS]: 'Keys & Keychains',
  [ItemCategory.OTHERS]: 'Other Items',
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
  [ItemStatus.LOST_REPORTED]: 'Lost Reported',
  [ItemStatus.FOUND]: 'Found (In Custody)',
  [ItemStatus.READY_FOR_COLLECTION]: 'Ready for Collection',
  [ItemStatus.RETURNED]: 'Returned to Owner',
  [ItemStatus.ARCHIVED]: 'Archived',
  [ItemStatus.UNCLAIMED]: 'Unclaimed / Disposed',
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  [ClaimStatus.PENDING]: 'Under Review',
  [ClaimStatus.INFO_REQUESTED]: 'More Info Requested',
  [ClaimStatus.APPROVED]: 'Claim Approved',
  [ClaimStatus.REJECTED]: 'Claim Rejected',
  [ClaimStatus.WITHDRAWN]: 'Withdrawn',
};

export const STORAGE_LOCATION_LABELS: Record<StorageLocationName, string> = {
  [StorageLocationName.SECURITY_OFFICE]: 'Campus Security Office',
  [StorageLocationName.LIBRARY]: 'Central Library Lost & Found Desk',
  [StorageLocationName.LABORATORY]: 'Department Laboratory Desk',
  [StorageLocationName.DEPARTMENT_OFFICE]: 'Dean / Department Office',
  [StorageLocationName.RECEPTION]: 'Main Campus Reception',
};
