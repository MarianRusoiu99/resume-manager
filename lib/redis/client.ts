/**
 * Redis/Cache Client Factory
 * 
 * Creates and manages the appropriate cache/pubsub provider based on configuration.
 * Supports Redis (production) and in-memory (development/fallback).
 */

import { env } from '../config';
import { logger } from '../utils/logger';
import { CacheProvider, PubSubProvider } from './types';
import { MemoryCacheProvider, MemoryPubSubProvider } from './memory-provider';
import { RedisCacheProvider, RedisPubSubProvider, RedisProvider, RedisOptions } from './redis-provider';

/**
 * Provider type configuration
 */
export type ProviderType = 'redis' | 'memory' | 'auto';

/**
 * Client configuration options
 */
export interface ClientConfig {
  /**
   * Provider type: 'redis', 'memory', or 'auto' (default)
   * 'auto' will use Redis if REDIS_URL is set, otherwise memory
   */
  provider?: ProviderType;
  
  /**
   * Redis-specific options (ignored for memory provider)
   */
  redis?: RedisOptions;
  
  /**
   * Key prefix for all operations
   */
  keyPrefix?: string;
}

/**
 * Singleton instances
 */
let cacheInstance: CacheProvider | null = null;
let pubsubInstance: PubSubProvider | null = null;
let combinedInstance: (CacheProvider & PubSubProvider) | null = null;

/**
 * Get default configuration from environment
 */
function getDefaultConfig(): ClientConfig {
  return {
    provider: env.hasRedis ? 'redis' : 'memory',
    redis: env.REDIS_URL ? { url: env.REDIS_URL } : undefined,
    keyPrefix: env.REDIS_KEY_PREFIX,
  };
}

/**
 * Determine which provider to use
 */
function resolveProvider(config: ClientConfig): 'redis' | 'memory' {
  if (config.provider === 'redis') return 'redis';
  if (config.provider === 'memory') return 'memory';
  
  // Auto-detect
  return env.hasRedis ? 'redis' : 'memory';
}

/**
 * Get the cache provider instance (singleton)
 */
export function getCacheProvider(config?: ClientConfig): CacheProvider {
  if (cacheInstance) return cacheInstance;
  
  const mergedConfig = { ...getDefaultConfig(), ...config };
  const providerType = resolveProvider(mergedConfig);
  
  if (providerType === 'redis') {
    cacheInstance = new RedisCacheProvider({
      ...mergedConfig.redis,
      keyPrefix: mergedConfig.keyPrefix,
    });
    logger.info('Using Redis cache provider');
  } else {
    cacheInstance = new MemoryCacheProvider();
    logger.warn('Using in-memory cache provider (not suitable for multi-instance deployments)');
  }
  
  return cacheInstance;
}

/**
 * Get the pubsub provider instance (singleton)
 */
export function getPubSubProvider(config?: ClientConfig): PubSubProvider {
  if (pubsubInstance) return pubsubInstance;
  
  const mergedConfig = { ...getDefaultConfig(), ...config };
  const providerType = resolveProvider(mergedConfig);
  
  if (providerType === 'redis') {
    pubsubInstance = new RedisPubSubProvider({
      ...mergedConfig.redis,
      keyPrefix: mergedConfig.keyPrefix,
    });
    logger.info('Using Redis pubsub provider');
  } else {
    pubsubInstance = new MemoryPubSubProvider();
    logger.warn('Using in-memory pubsub provider (not suitable for multi-instance deployments)');
  }
  
  return pubsubInstance;
}

/**
 * Get a combined cache + pubsub provider instance (singleton)
 */
export function getRedisClient(config?: ClientConfig): CacheProvider & PubSubProvider {
  if (combinedInstance) return combinedInstance;
  
  const mergedConfig = { ...getDefaultConfig(), ...config };
  const providerType = resolveProvider(mergedConfig);
  
  if (providerType === 'redis') {
    combinedInstance = new RedisProvider({
      ...mergedConfig.redis,
      keyPrefix: mergedConfig.keyPrefix,
    });
    logger.info('Using Redis provider for cache and pubsub');
  } else {
    // Create a combined memory provider
    const cache = new MemoryCacheProvider();
    const pubsub = new MemoryPubSubProvider();
    combinedInstance = {
      name: 'memory',
      isConnected: () => true,
      // Cache
      get: cache.get.bind(cache),
      set: cache.set.bind(cache),
      delete: cache.delete.bind(cache),
      exists: cache.exists.bind(cache),
      expire: cache.expire.bind(cache),
      ttl: cache.ttl.bind(cache),
      incr: cache.incr.bind(cache),
      decr: cache.decr.bind(cache),
      mget: cache.mget.bind(cache),
      mset: cache.mset.bind(cache),
      deletePattern: cache.deletePattern.bind(cache),
      // PubSub
      publish: pubsub.publish.bind(pubsub),
      subscribe: pubsub.subscribe.bind(pubsub),
      psubscribe: pubsub.psubscribe.bind(pubsub),
      // Disconnect both
      disconnect: async () => {
        await Promise.all([cache.disconnect(), pubsub.disconnect()]);
      },
    };
    logger.warn('Using in-memory provider for cache and pubsub (not suitable for multi-instance deployments)');
  }
  
  return combinedInstance;
}

/**
 * Reset all singleton instances (useful for testing)
 */
export async function resetProviders(): Promise<void> {
  const disconnectPromises: Promise<void>[] = [];
  
  if (cacheInstance) {
    disconnectPromises.push(cacheInstance.disconnect());
    cacheInstance = null;
  }
  if (pubsubInstance) {
    disconnectPromises.push(pubsubInstance.disconnect());
    pubsubInstance = null;
  }
  if (combinedInstance) {
    disconnectPromises.push(combinedInstance.disconnect());
    combinedInstance = null;
  }
  
  await Promise.all(disconnectPromises);
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<{
  connected: boolean;
  provider: string;
  latencyMs?: number;
  error?: string;
}> {
  const client = getRedisClient();
  
  if (!client.isConnected()) {
    return {
      connected: false,
      provider: client.name,
      error: 'Not connected',
    };
  }
  
  try {
    const start = Date.now();
    await client.set('__health_check__', 'ok', 1);
    const latencyMs = Date.now() - start;
    
    return {
      connected: true,
      provider: client.name,
      latencyMs,
    };
  } catch (error) {
    return {
      connected: false,
      provider: client.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
