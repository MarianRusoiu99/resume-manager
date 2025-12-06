/**
 * Redis/Cache Module
 * 
 * Provides abstracted cache and pub/sub functionality with swappable providers.
 * 
 * @example
 * // Get the cache client
 * import { getCacheProvider, getPubSubProvider, getRedisClient } from '@/lib/redis';
 * 
 * // Cache operations
 * const cache = getCacheProvider();
 * await cache.set('key', { data: 'value' }, 300); // TTL 5 minutes
 * const data = await cache.get('key');
 * 
 * // PubSub operations
 * const pubsub = getPubSubProvider();
 * await pubsub.subscribe('notifications:user123', (channel, message) => {
 *   console.log('Received:', message);
 * });
 * await pubsub.publish('notifications:user123', { type: 'NEW_MESSAGE' });
 * 
 * // Combined client
 * const redis = getRedisClient();
 * // Has both cache and pubsub methods
 */

// Types
export type { CacheProvider, PubSubProvider, RedisLikeProvider, MessageHandler } from './types';

// Providers (for direct instantiation if needed)
export { MemoryCacheProvider, MemoryPubSubProvider, MemoryProvider } from './memory-provider';
export { RedisCacheProvider, RedisPubSubProvider, RedisProvider } from './redis-provider';
export type { RedisOptions } from './redis-provider';

// Factory functions (recommended)
export {
  getCacheProvider,
  getPubSubProvider,
  getRedisClient,
  resetProviders,
  checkRedisHealth,
} from './client';
export type { ProviderType, ClientConfig } from './client';
