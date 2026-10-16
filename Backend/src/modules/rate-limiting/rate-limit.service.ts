import { Injectable } from '@nestjs/common';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

@Injectable()
export class RateLimitService {
  // Key -> Array of request timestamps (epoch ms)
  private readonly hits = new Map<string, number[]>();

  /**
   * Evaluates request against sliding window limit (FR-36).
   */
  checkLimit(
    key: string,
    limit: number,
    ttlSeconds: number,
  ): RateLimitResult {
    const now = Date.now();
    const windowStart = now - ttlSeconds * 1000;

    let timestamps = this.hits.get(key) || [];

    // Filter out hits outside sliding window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      const oldestHit = timestamps[0];
      const resetTime = oldestHit + ttlSeconds * 1000;
      this.hits.set(key, timestamps);
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    // Add current request
    timestamps.push(now);
    this.hits.set(key, timestamps);

    return {
      allowed: true,
      remaining: limit - timestamps.length,
      resetTime: now + ttlSeconds * 1000,
    };
  }

  /**
   * Reset hits for a given key (useful for tests and manual resets).
   */
  reset(key: string): void {
    this.hits.delete(key);
  }

  /**
   * Clear all stored rate-limit records.
   */
  clearAll(): void {
    this.hits.clear();
  }
}
