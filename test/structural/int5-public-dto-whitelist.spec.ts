import {
  PUBLIC_ITEM_ALLOWED_FIELDS,
  FORBIDDEN_SENSITIVE_FIELD_NAMES,
  serializePublicItem,
} from '../../src/common/serializers/public-item.serializer';
import { ItemCategory, ItemStatus, ItemType } from '../../src/domain/enums';

describe('INT-5: Privacy Masking by Construction - Public DTO Whitelist Structural Check', () => {
  it('PUBLIC_ITEM_ALLOWED_FIELDS must never contain sensitive personal or proof fields', () => {
    const allowed = new Set<string>(PUBLIC_ITEM_ALLOWED_FIELDS as readonly string[]);

    for (const forbidden of FORBIDDEN_SENSITIVE_FIELD_NAMES) {
      expect(allowed.has(forbidden)).toBe(false);
    }
  });

  it('serializePublicItem strictly drops any non-whitelisted property', () => {
    const rawData = {
      caseId: 'CIRS-2026-000001',
      type: ItemType.FOUND,
      itemName: 'Smart Phone',
      category: ItemCategory.ELECTRONICS,
      description: 'Found near cafeteria',
      colour: 'Black',
      brand: 'Samsung',
      identifyingMarks: 'Cracked screen protector',
      status: ItemStatus.FOUND,
      dateFound: new Date(),
      foundLocation: 'Cafeteria',
      images: ['https://example.com/phone.jpg'],
      createdAt: new Date(),
      // SENSITIVE DATA THAT MUST BE MASKED:
      phone: '+919876543210',
      email: 'finder@gsfcuniversity.ac.in',
      studentId: 'STU123456',
      ownershipProof: 'Receipt with credit card ending 4321',
      answers: ['PIN is 1234'],
      internalStaffNotes: 'Keep in locked vault',
    };

    const serialized: any = serializePublicItem(rawData);

    expect(serialized.caseId).toBe('CIRS-2026-000001');
    expect(serialized.itemName).toBe('Smart Phone');
    expect(serialized.phone).toBeUndefined();
    expect(serialized.email).toBeUndefined();
    expect(serialized.studentId).toBeUndefined();
    expect(serialized.ownershipProof).toBeUndefined();
    expect(serialized.answers).toBeUndefined();
    expect(serialized.internalStaffNotes).toBeUndefined();

    // Verify all keys in serialized are within PUBLIC_ITEM_ALLOWED_FIELDS
    const allowed = new Set<string>(PUBLIC_ITEM_ALLOWED_FIELDS as readonly string[]);
    for (const key of Object.keys(serialized)) {
      expect(allowed.has(key)).toBe(true);
    }
  });
});
