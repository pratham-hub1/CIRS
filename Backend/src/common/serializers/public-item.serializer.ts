import { ItemCategory, ItemStatus, ItemType } from '../../domain/enums';

/**
 * PublicItemDto defines the strict allowlist of fields exposed on public surfaces
 * (e.g. /feed, public search, non-owner item fetch).
 *
 * SENSITIVE FIELDS FORBIDDEN ON PUBLIC SURFACES (FR-12, FR-38, INT-5):
 * - Phone numbers
 * - Personal email / email
 * - Student ID
 * - Ownership proof / proof documents / verification answers
 */
export class PublicItemDto {
  caseId!: string;
  type!: ItemType;
  itemName!: string;
  category!: ItemCategory;
  description!: string;
  colour!: string;
  brand!: string;
  identifyingMarks!: string;
  status!: ItemStatus;
  dateLost?: Date | null;
  lastKnownLocation?: string | null;
  dateFound?: Date | null;
  foundLocation?: string | null;
  images!: string[];
  createdAt!: Date;
}

export const PUBLIC_ITEM_ALLOWED_FIELDS = [
  'caseId',
  'type',
  'itemName',
  'category',
  'description',
  'colour',
  'brand',
  'identifyingMarks',
  'status',
  'dateLost',
  'lastKnownLocation',
  'dateFound',
  'foundLocation',
  'images',
  'createdAt',
] as const;

export const FORBIDDEN_SENSITIVE_FIELD_NAMES = [
  'phone',
  'phoneNumber',
  'email',
  'personalEmail',
  'studentId',
  'ownershipProof',
  'proof',
  'proofDocuments',
  'verificationAnswers',
  'answers',
  'password',
  'passwordHash',
] as const;

export function serializePublicItem(raw: Record<string, any>): PublicItemDto {
  const result: any = {};
  for (const field of PUBLIC_ITEM_ALLOWED_FIELDS) {
    if (field in raw) {
      result[field] = raw[field];
    }
  }
  return result as PublicItemDto;
}
