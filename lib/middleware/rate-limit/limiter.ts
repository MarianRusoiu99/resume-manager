/**
 * Unified rate limiter
 */

import { env } from '@/lib/config/env';
import type { RateLimitConfig, RateLimiterBackend } from './types';
import { RedisRateLimiter } from './redis-limiter';
import { MemoryRateLimiter } from './memory-limiter';

export class RateLimiter {
  private backend: RateLimiterBackend;
  
  constructor() {
    // Use Redis in production if available, otherwise fall back to memory
    if (env.hasRedis) {
      this.backend = new RedisRateLimiter();
    } else {
      this.backend = new MemoryRateLimiter();
    }
  }
  
  /**
   * Check if a request should be rate limited
   */
  async isRateLimited(identifier: string, config: RateLimitConfig): Promise<boolean> {
    const allowed = await this.backend.checkLimit(identifier, config.maxRequests, config.windowMs);
    return !allowed;
  }
  
  /**
   * Get remaining requests for an identifier
   */
  async getRemaining(identifier: string, config: RateLimitConfig): Promise<number> {
    const count = await this.backend.getCount(identifier);
    return Math.max(0, config.maxRequests - count);
  }
  
  /**
   * Get time until reset for an identifier
   */
  async getResetTime(identifier: string): Promise<number | null> {
    const ttl = await this.backend.getTTL(identifier);
    if (ttl < 0) return null;
    return Date.now() + (ttl * 1000);
  }
  
  /**
   * Clear all entries (useful for testing)
   */
  async clear(): Promise<void> {
    await this.backend.clearAll();
  }
  
  /**
   * Cleanup on destroy (for memory backend)
   */
  destroy(): void {
    if (this.backend instanceof MemoryRateLimiter) {
      this.backend.destroy();
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
