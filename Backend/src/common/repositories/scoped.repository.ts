import { PrismaService } from '../../modules/prisma/prisma.service';

/**
 * Enforces that the where clause contains the required campusId.
 * Throws a fatal tenancy error if campusId is missing, empty, or undefined (INV-DM-7, INT-6).
 */
export function applyCampusScope<T extends Record<string, any>>(
  campusId: string,
  where: T = {} as T,
): T & { campusId: string } {
  if (!campusId || typeof campusId !== 'string' || campusId.trim() === '') {
    throw new Error('Tenancy violation: campusId must be provided for scoped queries');
  }
  return {
    ...where,
    campusId,
  };
}

/**
 * ScopedRepository ensures that every data query for campus-scoped entities
 * (Item, StorageLocation, etc.) is strictly filtered by campusId.
 * (INV-DM-7, INT-6)
 */
export abstract class ScopedRepository {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Enforces that the where clause contains the required campusId.
   * Throws an error if campusId is missing or undefined.
   */
  protected applyCampusScope<T extends { campusId?: string }>(
    campusId: string,
    where: T = {} as T,
  ): T & { campusId: string } {
    return applyCampusScope(campusId, where);
  }
}

