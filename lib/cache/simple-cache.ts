/**
 * Simple in-memory cache for frequently accessed data
 * 
 * Implements ICache interface for dependency injection.
 * Useful for caching user profiles and other read-heavy data.
 */

import type { ICache } from '@/lib/repositories/interfaces';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Simple Cache Implementation
 * 
 * In-memory cache with TTL support.
 * Implements ICache for dependency injection.
 */
class SimpleCache<T = unknown> implements ICache<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    // Default 5 minutes
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create cache instances for different data types
export const profileCache = new SimpleCache<unknown>(300); // 5 minutes

// Clean up expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    profileCache.cleanup();
  }, 60000);
}

export { SimpleCache };
