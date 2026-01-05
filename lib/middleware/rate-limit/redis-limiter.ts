/**
 * Redis-backed rate limiter for production use
 */

import { getCacheProvider } from '@/lib/redis/client';
import type { RateLimiterBackend } from './types';

export class RedisRateLimiter implements RateLimiterBackend {
  private cache = getCacheProvider();
  
  async checkLimit(identifier: string, limit: number, windowMs: number): Promise<boolean> {
    const key = `rate-limit:${identifier}`;
    const current = await this.cache.get<string>(key);
    const count = current ? parseInt(current, 10) : 0;
    
    if (count >= limit) return false;
    
    await this.cache.incr(key);
    if (count === 0) {
      await this.cache.expire(key, Math.ceil(windowMs / 1000));
    }
    return true;
  }
  
  async getCount(identifier: string): Promise<number> {
    const key = `rate-limit:${identifier}`;
    const current = await this.cache.get<string>(key);
    return current ? parseInt(current, 10) : 0;
  }
  
  async getTTL(identifier: string): Promise<number> {
    const key = `rate-limit:${identifier}`;
    return this.cache.ttl(key);
  }
  
  async clear(identifier: string): Promise<void> {
    const key = `rate-limit:${identifier}`;
    await this.cache.delete(key);
  }
  
  async clearAll(): Promise<void> {
    await this.cache.deletePattern('rate-limit:*');
  }
}
