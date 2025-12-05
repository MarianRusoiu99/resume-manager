/**
 * Cache Interface
 * 
 * Generic cache interface for dependency injection.
 * Allows swapping cache implementations (in-memory, Redis, etc.)
 */

/**
 * Generic Cache Interface
 * 
 * @typeParam T - The type of data stored in the cache
 */
export interface ICache<T = unknown> {
  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get(key: string): T | null;

  /**
   * Set value in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Optional TTL override in seconds
   */
  set(key: string, data: T, ttlSeconds?: number): void;

  /**
   * Delete value from cache
   * @param key - Cache key to delete
   */
  delete(key: string): void;

  /**
   * Clear all cache entries
   */
  clear(): void;

  /**
   * Get current cache size
   */
  size(): number;

  /**
   * Check if key exists in cache (and is not expired)
   */
  has?(key: string): boolean;

  /**
   * Clean up expired entries
   */
  cleanup?(): void;
}

/**
 * Async cache interface for distributed caches (Redis, etc.)
 */
export interface IAsyncCache<T = unknown> {
  get(key: string): Promise<T | null>;
  set(key: string, data: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has?(key: string): Promise<boolean>;
}
