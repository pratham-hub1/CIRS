import {
  Role,
  UserStatus,
  ItemType,
  ItemCategory,
  ItemStatus,
  ClaimStatus,
  VerificationLevel,
  StorageLocationName,
  NotificationType,
  MatchStatus,
  AppealStatus,
  Channel,
  QuestionSource,
  FileVisibility,
} from '@prisma/client';

export {
  Role,
  UserStatus,
  ItemType,
  ItemCategory,
  ItemStatus,
  ClaimStatus,
  VerificationLevel,
  StorageLocationName,
  NotificationType,
  MatchStatus,
  AppealStatus,
  Channel,
  QuestionSource,
  FileVisibility,
};

export const CATEGORY_VERIFICATION_LEVEL_MAP: Record<ItemCategory, VerificationLevel> = {
  [ItemCategory.ELECTRONICS]: VerificationLevel.HIGH,
  [ItemCategory.WALLETS]: VerificationLevel.HIGH,
  [ItemCategory.BAGS]: VerificationLevel.MEDIUM,
  [ItemCategory.ACCESSORIES]: VerificationLevel.MEDIUM,
  [ItemCategory.DOCUMENTS]: VerificationLevel.LOW,
  [ItemCategory.CLOTHING]: VerificationLevel.LOW,
  [ItemCategory.STATIONERY]: VerificationLevel.LOW,
  [ItemCategory.KEYS]: VerificationLevel.LOW,
  [ItemCategory.OTHERS]: VerificationLevel.LOW,
};

export function getCategoryVerificationLevel(
  category: ItemCategory,
  overrides?: Record<string, VerificationLevel>,
): VerificationLevel {
  if (overrides && overrides[category]) {
    return overrides[category];
  }
  return CATEGORY_VERIFICATION_LEVEL_MAP[category] ?? VerificationLevel.LOW;
}

