import { BadRequestException } from '@nestjs/common';
import { ItemStatus } from '../src/domain/enums';
import {
  getNextItemStatus,
  canTransitionItem,
  ItemEvent,
} from '../src/modules/lifecycle/lifecycle.state-machine';

describe('WF-1: Item State Machine Correctness', () => {
  describe('Valid transitions (05-workflows.md §1)', () => {
    it('LOST_REPORTED + ITEM_LOCATED -> FOUND', () => {
      expect(getNextItemStatus(ItemStatus.LOST_REPORTED, 'ITEM_LOCATED')).toBe(
        ItemStatus.FOUND,
      );
      expect(canTransitionItem(ItemStatus.LOST_REPORTED, ItemStatus.FOUND).allowed).toBe(true);
    });

    it('LOST_REPORTED + CLOSE -> ARCHIVED', () => {
      expect(getNextItemStatus(ItemStatus.LOST_REPORTED, 'CLOSE')).toBe(
        ItemStatus.ARCHIVED,
      );
      expect(canTransitionItem(ItemStatus.LOST_REPORTED, ItemStatus.ARCHIVED).allowed).toBe(true);
    });

    it('FOUND + CLAIM_APPROVED -> READY_FOR_COLLECTION', () => {
      expect(getNextItemStatus(ItemStatus.FOUND, 'CLAIM_APPROVED')).toBe(
        ItemStatus.READY_FOR_COLLECTION,
      );
      expect(
        canTransitionItem(ItemStatus.FOUND, ItemStatus.READY_FOR_COLLECTION).allowed,
      ).toBe(true);
    });

    it('FOUND + RETENTION_ELAPSED -> UNCLAIMED', () => {
      expect(getNextItemStatus(ItemStatus.FOUND, 'RETENTION_ELAPSED')).toBe(
        ItemStatus.UNCLAIMED,
      );
      expect(canTransitionItem(ItemStatus.FOUND, ItemStatus.UNCLAIMED).allowed).toBe(true);
    });

    it('READY_FOR_COLLECTION + CLAIM_REVERTED -> FOUND', () => {
      expect(
        getNextItemStatus(ItemStatus.READY_FOR_COLLECTION, 'CLAIM_REVERTED'),
      ).toBe(ItemStatus.FOUND);
      expect(
        canTransitionItem(ItemStatus.READY_FOR_COLLECTION, ItemStatus.FOUND).allowed,
      ).toBe(true);
    });

    it('READY_FOR_COLLECTION + HANDOVER_COMPLETE -> RETURNED', () => {
      expect(
        getNextItemStatus(ItemStatus.READY_FOR_COLLECTION, 'HANDOVER_COMPLETE'),
      ).toBe(ItemStatus.RETURNED);
      expect(
        canTransitionItem(ItemStatus.READY_FOR_COLLECTION, ItemStatus.RETURNED).allowed,
      ).toBe(true);
    });

    it('RETURNED + ARCHIVE -> ARCHIVED', () => {
      expect(getNextItemStatus(ItemStatus.RETURNED, 'ARCHIVE')).toBe(
        ItemStatus.ARCHIVED,
      );
      expect(canTransitionItem(ItemStatus.RETURNED, ItemStatus.ARCHIVED).allowed).toBe(true);
    });
  });

  describe('WF-1 (a, b, c): Totality, Determinism & Validity (invalid transitions strictly rejected)', () => {
    const invalidPairs: Array<[ItemStatus, ItemEvent]> = [
      [ItemStatus.LOST_REPORTED, 'CLAIM_APPROVED'],
      [ItemStatus.LOST_REPORTED, 'HANDOVER_COMPLETE'],
      [ItemStatus.FOUND, 'HANDOVER_COMPLETE'],
      [ItemStatus.FOUND, 'ARCHIVE'],
      [ItemStatus.READY_FOR_COLLECTION, 'ITEM_LOCATED'],
      [ItemStatus.READY_FOR_COLLECTION, 'ARCHIVE'],
      [ItemStatus.RETURNED, 'CLAIM_APPROVED'],
      [ItemStatus.RETURNED, 'HANDOVER_COMPLETE'],
      [ItemStatus.RETURNED, 'UNCLAIMED' as any],
    ];

    for (const [state, event] of invalidPairs) {
      it(`rejects invalid transition (${state}, ${event})`, () => {
        expect(() => getNextItemStatus(state, event)).toThrow(BadRequestException);
      });
    }

    it('canTransitionItem rejects illegal jumps', () => {
      expect(canTransitionItem(ItemStatus.LOST_REPORTED, ItemStatus.RETURNED).allowed).toBe(false);
      expect(canTransitionItem(ItemStatus.FOUND, ItemStatus.RETURNED).allowed).toBe(false);
      expect(canTransitionItem(ItemStatus.FOUND, ItemStatus.ARCHIVED).allowed).toBe(false);
      expect(canTransitionItem(ItemStatus.READY_FOR_COLLECTION, ItemStatus.ARCHIVED).allowed).toBe(false);
    });
  });

  describe('WF-1 (d): Termination (terminal states have zero outgoing transitions)', () => {
    const allEvents: ItemEvent[] = [
      'ITEM_LOCATED',
      'CLAIM_APPROVED',
      'CLAIM_REVERTED',
      'HANDOVER_COMPLETE',
      'ARCHIVE',
      'RETENTION_ELAPSED',
      'CLOSE',
    ];

    it('ARCHIVED is strictly terminal', () => {
      for (const event of allEvents) {
        expect(() => getNextItemStatus(ItemStatus.ARCHIVED, event)).toThrow(
          BadRequestException,
        );
      }
      for (const status of Object.values(ItemStatus)) {
        expect(canTransitionItem(ItemStatus.ARCHIVED, status).allowed).toBe(false);
      }
    });

    it('UNCLAIMED is strictly terminal', () => {
      for (const event of allEvents) {
        expect(() => getNextItemStatus(ItemStatus.UNCLAIMED, event)).toThrow(
          BadRequestException,
        );
      }
      for (const status of Object.values(ItemStatus)) {
        expect(canTransitionItem(ItemStatus.UNCLAIMED, status).allowed).toBe(false);
      }
    });
  });
});
