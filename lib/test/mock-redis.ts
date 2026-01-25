/**
 * Mock Redis Client
 *
 * Provides mock Redis implementations for testing cache operations without a real Redis connection.
 * Includes both a simple stub mock (for unit tests) and an in-memory implementation (for integration tests).
 *
 * @example
 * ```ts
 * // Using the simple mock for unit tests
 * import { describe, it, expect, beforeEach, vi } from 'vitest';
 * import { redisMock, resetRedisMock } from '@/__tests__/utils/mock-redis';
 *
 * // Mock the Redis import
 * vi.mock('@/lib/cache/redis', () => ({
 *   redis: redisMock,
 * }));
 *
 * describe('CacheService', () => {
 *   beforeEach(() => {
 *     resetRedisMock();
 *   });
 *
 *   it('should get cached value', async () => {
 *     redisMock.get.mockResolvedValue('cached-value');
 *
 *     const result = await cacheService.get('my-key');
 *
 *     expect(redisMock.get).toHaveBeenCalledWith('my-key');
 *     expect(result).toBe('cached-value');
 *   });
 *
 *   it('should set value with expiry', async () => {
 *     redisMock.set.mockResolvedValue('OK');
 *
 *     await cacheService.set('my-key', 'my-value', 3600);
 *
 *     expect(redisMock.set).toHaveBeenCalled();
 *   });
 * });
 * ```
 *
 * @example
 * ```ts
 * // Using the in-memory mock for more realistic testing
 * import { mockRedis, resetInMemoryRedisMock, createMockRedis } from '@/__tests__/utils/mock-redis';
 *
 * describe('CacheWithExpiry', () => {
 *   beforeEach(() => {
 *     resetInMemoryRedisMock();
 *   });
 *
 *   it('should store and retrieve values', async () => {
 *     await mockRedis.set('key', 'value');
 *     const result = await mockRedis.get('key');
 *     expect(result).toBe('value');
 *   });
 *
 *   it('should handle expiration', async () => {
 *     await mockRedis.set('key', 'value', { EX: 1 }); // 1 second expiry
 *     // Value is available immediately
 *     expect(await mockRedis.get('key')).toBe('value');
 *   });
 *
 *   it('should support incr/decr operations', async () => {
 *     await mockRedis.set('counter', '5');
 *     const newValue = await mockRedis.incr('counter');
 *     expect(newValue).toBe(6);
 *   });
 * });
 * ```
 *
 * @example
 * ```ts
 * // Creating isolated mock instances for parallel tests
 * import { createMockRedis } from '@/__tests__/utils/mock-redis';
 *
 * it('should work with isolated redis instances', async () => {
 *   const redis1 = createMockRedis();
 *   const redis2 = createMockRedis();
 *
 *   await redis1.set('key', 'value1');
 *   await redis2.set('key', 'value2');
 *
 *   expect(await redis1.get('key')).toBe('value1');
 *   expect(await redis2.get('key')).toBe('value2');
 * });
 * ```
 *
 * @module mock-redis
 */

// Simple stub mock for unit tests (vi.fn() based)
export { redisMock, resetRedisMock } from '@/lib/test/mocks/redis-mock';

// In-memory implementation for more realistic testing
export {
  mockRedis,
  createMockRedis,
  resetRedisMock as resetInMemoryRedisMock,
} from '@/lib/test/mocks/redis';
