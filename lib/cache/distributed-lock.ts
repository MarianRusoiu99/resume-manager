/**
 * Distributed Lock Implementation
 *
 * Provides distributed locking for coordinating concurrent access across
 * multiple server instances. Uses Redis SET NX EX pattern for atomic
 * lock acquisition with automatic expiry.
 *
 * @example
 * ```ts
 * const acquired = await acquireLock('profile-cache-lock:user123');
 * if (acquired) {
 *   try {
 *     // Critical section
 *   } finally {
 *     await releaseLock('profile-cache-lock:user123');
 *   }
 * }
 * ```
 *
 * @example Using withLock helper
 * ```ts
 * const result = await withLock('my-resource', async () => {
 *   // Critical section - automatically unlocked on completion
 *   return someValue;
 * });
 * ```
 */

import { getCacheProvider } from '@/lib/redis/client';
import { RedisCacheProvider } from '@/lib/redis/cache-provider';
import { logger } from '@/lib/utils/logger';

/** Default lock TTL in milliseconds */
const DEFAULT_LOCK_TTL_MS = 5000;

/** Lock key prefix for namespacing */
const LOCK_PREFIX = 'lock:';

/** In-memory lock store for memory provider fallback */
const memoryLocks = new Map<string, { expiresAt: number }>();

/**
 * Acquire a distributed lock on a key.
 *
 * Uses Redis SET NX EX for atomic lock acquisition with automatic expiry.
 * Falls back to in-memory locking when Redis is unavailable.
 *
 * @param key - The lock key (will be prefixed with 'lock:')
 * @param ttlMs - Lock time-to-live in milliseconds (default: 5000ms)
 * @returns true if lock was acquired, false if already held by another process
 */
export async function acquireLock(
  key: string,
  ttlMs: number = DEFAULT_LOCK_TTL_MS
): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${key}`;
  const ttlSeconds = Math.ceil(ttlMs / 1000);

  try {
    const provider = getCacheProvider();

    if (provider.name === 'redis' && provider instanceof RedisCacheProvider) {
      const client = provider.getClient();
      const result = await client.set(lockKey, '1', 'EX', ttlSeconds, 'NX');
      const acquired = result === 'OK';

      if (acquired) {
        logger.debug(`Acquired distributed lock: ${lockKey}`);
      }

      return acquired;
    }

    // Fallback to in-memory locking for non-Redis providers
    return acquireMemoryLock(lockKey, ttlMs);
  } catch (error) {
    logger.error(`Failed to acquire lock: ${lockKey}`, error);
    // On error, proceed without lock (fallback behavior)
    return false;
  }
}

/**
 * Release a distributed lock.
 *
 * @param key - The lock key (will be prefixed with 'lock:')
 * @returns true if lock was released, false if lock didn't exist
 */
export async function releaseLock(key: string): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${key}`;

  try {
    const provider = getCacheProvider();

    if (provider.name === 'redis' && provider instanceof RedisCacheProvider) {
      const client = provider.getClient();
      const result = await client.del(lockKey);
      const released = result > 0;

      if (released) {
        logger.debug(`Released distributed lock: ${lockKey}`);
      }

      return released;
    }

    // Fallback to in-memory locking for non-Redis providers
    return releaseMemoryLock(lockKey);
  } catch (error) {
    logger.error(`Failed to release lock: ${lockKey}`, error);
    return false;
  }
}

/**
 * Execute a function while holding a distributed lock.
 *
 * Automatically acquires the lock before execution and releases it after,
 * even if an error occurs. If the lock cannot be acquired, proceeds without
 * the lock after a timeout (fallback behavior for resilience).
 *
 * @param key - The lock key
 * @param fn - The function to execute while holding the lock
 * @param options - Lock options
 * @returns The result of the function, or undefined if lock acquisition failed
 */
export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  options: {
    /** Lock TTL in milliseconds (default: 5000ms) */
    ttlMs?: number;
    /** Timeout for waiting to acquire lock in milliseconds (default: 1000ms) */
    acquireTimeoutMs?: number;
    /** Retry interval when waiting for lock in milliseconds (default: 50ms) */
    retryIntervalMs?: number;
  } = {}
): Promise<T | undefined> {
  const {
    ttlMs = DEFAULT_LOCK_TTL_MS,
    acquireTimeoutMs = 1000,
    retryIntervalMs = 50,
  } = options;

  const startTime = Date.now();
  let acquired = false;

  // Try to acquire lock with retries
  while (Date.now() - startTime < acquireTimeoutMs) {
    acquired = await acquireLock(key, ttlMs);
    if (acquired) break;
    await sleep(retryIntervalMs);
  }

  if (!acquired) {
    logger.warn(`Lock acquisition timed out for: ${key}, proceeding without lock`);
    // Fallback: proceed without lock for resilience
    return fn();
  }

  try {
    return await fn();
  } finally {
    await releaseLock(key);
  }
}

/**
 * Acquire an in-memory lock (fallback when Redis is unavailable)
 */
function acquireMemoryLock(lockKey: string, ttlMs: number): boolean {
  const now = Date.now();

  // Clean up expired locks
  for (const [key, lock] of memoryLocks.entries()) {
    if (now > lock.expiresAt) {
      memoryLocks.delete(key);
    }
  }

  const existingLock = memoryLocks.get(lockKey);
  if (existingLock && now <= existingLock.expiresAt) {
    return false; // Lock is held
  }

  memoryLocks.set(lockKey, { expiresAt: now + ttlMs });
  logger.debug(`Acquired in-memory lock: ${lockKey}`);
  return true;
}

/**
 * Release an in-memory lock
 */
function releaseMemoryLock(lockKey: string): boolean {
  const deleted = memoryLocks.delete(lockKey);
  if (deleted) {
    logger.debug(`Released in-memory lock: ${lockKey}`);
  }
  return deleted;
}

/**
 * Sleep helper for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clear all in-memory locks (useful for testing)
 */
export function clearMemoryLocks(): void {
  memoryLocks.clear();
}
