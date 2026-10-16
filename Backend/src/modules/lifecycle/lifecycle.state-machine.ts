import { BadRequestException } from '@nestjs/common';
import { ItemStatus } from '../../domain/enums';

/**
 * Item state machine events as defined in 05-workflows.md §1 (WF-1).
 */
export type ItemEvent =
  | 'ITEM_LOCATED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REVERTED'
  | 'HANDOVER_COMPLETE'
  | 'ARCHIVE'
  | 'RETENTION_ELAPSED'
  | 'CLOSE';

/**
 * Transition Table (05-workflows.md §1)
 *
 * | From                  | Event                   | To                     | Guard / actor
 * |-----------------------|-------------------------|------------------------|--------------------
 * | LOST_REPORTED         | item located / matched  | FOUND                  | staff-confirmed
 * | LOST_REPORTED         | close                   | ARCHIVED               | owner or staff
 * | FOUND                 | claim approved          | READY_FOR_COLLECTION   | claim is APPROVED (creates hold)
 * | READY_FOR_COLLECTION  | claim reverted          | FOUND                  | claim rejected / withdrawn / token expired
 * | READY_FOR_COLLECTION  | handover complete       | RETURNED               | two-way handover (§4)
 * | RETURNED              | archive                 | ARCHIVED               | post-return handled
 * | FOUND                 | retention elapsed       | UNCLAIMED              | staff action after policy window
 *
 * Terminal states: ARCHIVED, UNCLAIMED (no outgoing transitions).
 */
export const ITEM_TRANSITION_MAP: Record<
  ItemStatus,
  Partial<Record<ItemEvent, ItemStatus>>
> = {
  [ItemStatus.LOST_REPORTED]: {
    ITEM_LOCATED: ItemStatus.FOUND,
    CLOSE: ItemStatus.ARCHIVED,
  },
  [ItemStatus.FOUND]: {
    CLAIM_APPROVED: ItemStatus.READY_FOR_COLLECTION,
    RETENTION_ELAPSED: ItemStatus.UNCLAIMED,
  },
  [ItemStatus.READY_FOR_COLLECTION]: {
    CLAIM_REVERTED: ItemStatus.FOUND,
    HANDOVER_COMPLETE: ItemStatus.RETURNED,
  },
  [ItemStatus.RETURNED]: {
    ARCHIVE: ItemStatus.ARCHIVED,
  },
  [ItemStatus.ARCHIVED]: {},
  [ItemStatus.UNCLAIMED]: {},
};

/**
 * Totality & determinism: returns the unique target state or throws BadRequestException.
 */
export function getNextItemStatus(currentStatus: ItemStatus, event: ItemEvent): ItemStatus {
  const allowed = ITEM_TRANSITION_MAP[currentStatus];
  const next = allowed ? allowed[event] : undefined;
  if (!next) {
    throw new BadRequestException(
      `Invalid item transition: cannot process event '${event}' from state '${currentStatus}'`,
    );
  }
  return next;
}

/**
 * Checks if moving directly to targetStatus is valid from currentStatus according to the state machine.
 */
export function canTransitionItem(
  currentStatus: ItemStatus,
  targetStatus: ItemStatus,
): { allowed: boolean; event?: ItemEvent } {
  const events = ITEM_TRANSITION_MAP[currentStatus];
  if (!events) {
    return { allowed: false };
  }

  for (const [evt, next] of Object.entries(events)) {
    if (next === targetStatus) {
      return { allowed: true, event: evt as ItemEvent };
    }
  }

  return { allowed: false };
}
