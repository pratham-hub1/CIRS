import { ItemCategory } from '../../../domain/enums';

export interface ScorableItem {
  id: string;
  category: ItemCategory;
  itemName: string;
  description: string;
  colour: string;
  brand: string;
  identifyingMarks: string;
  serialNumber?: string | null;
  dateLost?: Date | string | null;
  dateFound?: Date | string | null;
  lastKnownLocation?: string | null;
  foundLocation?: string | null;
}

export class MatchScorer {
  private static readonly MAX_DATE_DIFF_DAYS = 30;

  /**
   * WF-3: Computes a deterministic, symmetric, bounded score in [0, 1].
   * score(A, B) === score(B, A)
   */
  public static computeScore(a: ScorableItem, b: ScorableItem): number {
    // WF-3(e): Exact-key completeness - matching serial numbers yield 1.0
    if (this.hasMatchingSerialNumber(a.serialNumber, b.serialNumber)) {
      return 1.0;
    }

    let score = 0.0;

    // 1. Category match (Weight: 0.40)
    if (a.category && b.category && a.category === b.category) {
      score += 0.4;
    }

    // 2. Keyword overlap (Weight: 0.35)
    const tokensA = this.extractTokens(a);
    const tokensB = this.extractTokens(b);
    const textSimilarity = this.jaccardSimilarity(tokensA, tokensB);
    score += textSimilarity * 0.35;

    // 3. Date proximity (Weight: 0.15)
    const dateA = a.dateLost || a.dateFound;
    const dateB = b.dateLost || b.dateFound;
    if (dateA && dateB) {
      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) {
        const daysDiff = Math.abs(timeA - timeB) / (1000 * 60 * 60 * 24);
        if (daysDiff <= this.MAX_DATE_DIFF_DAYS) {
          const dateFactor = 1 - daysDiff / this.MAX_DATE_DIFF_DAYS;
          score += dateFactor * 0.15;
        }
      }
    }

    // 4. Location similarity (Weight: 0.10)
    const locTokensA = this.extractLocationTokens(a);
    const locTokensB = this.extractLocationTokens(b);
    const locSimilarity = this.jaccardSimilarity(locTokensA, locTokensB);
    score += locSimilarity * 0.1;

    // Bound in [0, 1] and round to 4 decimal places for exact determinism
    const bounded = Math.max(0.0, Math.min(1.0, score));
    return Math.round(bounded * 10000) / 10000;
  }

  private static hasMatchingSerialNumber(
    s1?: string | null,
    s2?: string | null,
  ): boolean {
    if (!s1 || !s2) return false;
    const norm1 = s1.trim().toLowerCase();
    const norm2 = s2.trim().toLowerCase();
    return norm1.length > 0 && norm1 === norm2;
  }

  private static extractTokens(item: ScorableItem): Set<string> {
    const combined = [
      item.itemName,
      item.description,
      item.colour,
      item.brand,
      item.identifyingMarks,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const words = combined.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
    return new Set(words.filter((w) => w.length > 1));
  }

  private static extractLocationTokens(item: ScorableItem): Set<string> {
    const loc = [item.lastKnownLocation, item.foundLocation]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const words = loc.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
    return new Set(words.filter((w) => w.length > 1));
  }

  private static jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 && setB.size === 0) return 0.0;
    if (setA.size === 0 || setB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const token of setA) {
      if (setB.has(token)) {
        intersectionCount++;
      }
    }

    const unionCount = setA.size + setB.size - intersectionCount;
    return unionCount > 0 ? intersectionCount / unionCount : 0.0;
  }
}
