/**
 * In-memory rate limiter for development/testing
 */

import type { RateLimitEntry, RateLimiterBackend } from './types';

export class MemoryRateLimiter implements RateLimiterBackend {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request should be rate limited
   */
  async checkLimit(identifier: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // If no entry exists or entry has expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    // If within limit, increment counter
    if (entry.count < limit) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get count for an identifier
   */
  async getCount(identifier: string): Promise<number> {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.count;
  }

  /**
   * Get TTL in seconds
   */
  async getTTL(identifier: string): Promise<number> {
    const entry = this.requests.get(identifier);
    if (!entry) return -2; // Key doesn't exist
    const remaining = Math.ceil((entry.resetTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1; // -1 means expired
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Clear single entry
   */
  async clear(identifier: string): Promise<void> {
    this.requests.delete(identifier);
  }

  /**
   * Clear all entries (useful for testing)
   */
  async clearAll(): Promise<void> {
    this.requests.clear();
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}
