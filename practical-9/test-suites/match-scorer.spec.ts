import { MatchScorer, ScorableItem } from '../src/modules/matching/scorer/match-scorer';
import { ItemCategory } from '../src/domain/enums';

describe('MatchScorer (WF-3: Matching Engine Correctness)', () => {
  const itemA: ScorableItem = {
    id: 'item-1',
    category: ItemCategory.ELECTRONICS,
    itemName: 'HP Laptop Pavilion 15',
    description: 'Silver HP laptop with black charger in gray sleeve',
    colour: 'Silver',
    brand: 'HP',
    identifyingMarks: 'Scratch near trackpad and Linux sticker',
    serialNumber: 'HP-SN-998877',
    dateLost: new Date('2026-10-10T10:00:00Z'),
    lastKnownLocation: 'Library 2nd Floor',
  };

  const itemB: ScorableItem = {
    id: 'item-2',
    category: ItemCategory.ELECTRONICS,
    itemName: 'HP Pavilion Laptop',
    description: 'Found silver laptop with grey case and charger',
    colour: 'Silver',
    brand: 'HP',
    identifyingMarks: 'Scratch near trackpad',
    serialNumber: 'hp-sn-998877', // Same serial (case-insensitive)
    dateFound: new Date('2026-10-11T12:00:00Z'),
    foundLocation: 'Library',
  };

  const itemDifferentSerial: ScorableItem = {
    ...itemB,
    serialNumber: 'HP-DIFFERENT-1234',
  };

  const itemNoSerial: ScorableItem = {
    ...itemB,
    serialNumber: null,
  };

  const itemANoSerial: ScorableItem = {
    ...itemA,
    serialNumber: null,
  };

  describe('WF-3(a): Determinism', () => {
    it('identical inputs produce identical scores across multiple invocations', () => {
      const score1 = MatchScorer.computeScore(itemA, itemB);
      const score2 = MatchScorer.computeScore(itemA, itemB);
      const score3 = MatchScorer.computeScore(itemA, itemB);

      expect(score1).toBe(score2);
      expect(score2).toBe(score3);
    });
  });

  describe('WF-3(c): Symmetry', () => {
    it('score(A, B) strictly equals score(B, A)', () => {
      const scoreAB = MatchScorer.computeScore(itemANoSerial, itemNoSerial);
      const scoreBA = MatchScorer.computeScore(itemNoSerial, itemANoSerial);

      expect(scoreAB).toBe(scoreBA);
    });

    it('symmetry holds when fields are partially filled or mismatched', () => {
      const partial1: ScorableItem = {
        id: '1',
        category: ItemCategory.WALLETS,
        itemName: 'Leather wallet',
        description: 'Contains cards',
        colour: 'Brown',
        brand: 'Titan',
        identifyingMarks: '',
        dateLost: new Date('2026-10-01'),
        lastKnownLocation: 'Cafeteria',
      };

      const partial2: ScorableItem = {
        id: '2',
        category: ItemCategory.WALLETS,
        itemName: 'Brown wallet',
        description: '',
        colour: 'Brown',
        brand: '',
        identifyingMarks: 'Credit card inside',
        dateFound: new Date('2026-10-03'),
        foundLocation: 'Canteen bench',
      };

      expect(MatchScorer.computeScore(partial1, partial2)).toBe(
        MatchScorer.computeScore(partial2, partial1),
      );
    });
  });

  describe('WF-3(d): Boundedness', () => {
    it('score is always bounded in [0, 1]', () => {
      const testCases = [
        [itemA, itemB],
        [itemA, itemDifferentSerial],
        [itemANoSerial, itemNoSerial],
        [
          { id: '1', category: ItemCategory.KEYS, itemName: '', description: '', colour: '', brand: '', identifyingMarks: '' },
          { id: '2', category: ItemCategory.ELECTRONICS, itemName: 'XYZ', description: 'ABC', colour: 'Red', brand: 'Foo', identifyingMarks: 'Bar' },
        ],
      ];

      for (const [a, b] of testCases) {
        const score = MatchScorer.computeScore(a as any, b as any);
        expect(score).toBeGreaterThanOrEqual(0.0);
        expect(score).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('WF-3(e): Exact-Key Completeness', () => {
    it('matching non-null serial numbers score exactly 1.0', () => {
      const score = MatchScorer.computeScore(itemA, itemB);
      expect(score).toBe(1.0);
    });

    it('falls back to fuzzy matching when serial numbers differ', () => {
      const score = MatchScorer.computeScore(itemA, itemDifferentSerial);
      expect(score).toBeLessThan(1.0);
      expect(score).toBeGreaterThan(0.0);
    });
  });

  describe('WF-3(g): No-Crash Guarantee', () => {
    it('handles nulls, undefined, and empty objects without throwing', () => {
      const empty1: ScorableItem = {
        id: '1',
        category: ItemCategory.OTHERS,
        itemName: '',
        description: '',
        colour: '',
        brand: '',
        identifyingMarks: '',
        dateLost: null,
        serialNumber: null,
      };

      const empty2: ScorableItem = {
        id: '2',
        category: ItemCategory.OTHERS,
        itemName: '',
        description: '',
        colour: '',
        brand: '',
        identifyingMarks: '',
        dateFound: null,
        serialNumber: null,
      };

      expect(() => MatchScorer.computeScore(empty1, empty2)).not.toThrow();
      expect(MatchScorer.computeScore(empty1, empty2)).toBe(0.4); // category match
    });
  });
});
