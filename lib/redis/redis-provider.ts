/**
 * Redis Provider Implementation
 * 
 * Production-ready Redis provider using ioredis.
 * Supports both caching and pub/sub functionality.
 */

import Redis from 'ioredis';
import { CacheProvider, PubSubProvider, MessageHandler } from './types';
import { RedisOptions } from './connection';
import { RedisCacheProvider } from './cache-provider';
import { RedisPubSubProvider } from './pubsub-provider';

export * from './types';
export * from './connection';
export * from './cache-provider';
export * from './pubsub-provider';

/**
 * Combined Redis provider for both caching and pub/sub
 */
export class RedisProvider implements CacheProvider, PubSubProvider {
  readonly name = 'redis';
  private readonly cacheProvider: RedisCacheProvider;
  private readonly pubsubProvider: RedisPubSubProvider;

  constructor(options: RedisOptions = {}) {
    this.cacheProvider = new RedisCacheProvider(options);
    this.pubsubProvider = new RedisPubSubProvider(options);
  }

  isConnected(): boolean {
    return this.cacheProvider.isConnected() && this.pubsubProvider.isConnected();
  }

  // Cache methods
  get = <T>(key: string) => this.cacheProvider.get<T>(key);
  set = <T>(key: string, value: T, ttlSeconds?: number) => this.cacheProvider.set(key, value, ttlSeconds);
  delete = (key: string) => this.cacheProvider.delete(key);
  exists = (key: string) => this.cacheProvider.exists(key);
  expire = (key: string, ttlSeconds: number) => this.cacheProvider.expire(key, ttlSeconds);
  ttl = (key: string) => this.cacheProvider.ttl(key);
  incr = (key: string) => this.cacheProvider.incr(key);
  decr = (key: string) => this.cacheProvider.decr(key);
  mget = <T>(keys: string[]) => this.cacheProvider.mget<T>(keys);
  mset = <T>(entries: Array<{ key: string; value: T; ttlSeconds?: number }>) => this.cacheProvider.mset(entries);
  deletePattern = (pattern: string) => this.cacheProvider.deletePattern(pattern);

  // PubSub methods
  publish = <T>(channel: string, message: T) => this.pubsubProvider.publish(channel, message);
  subscribe = <T>(channel: string, handler: MessageHandler<T>) => this.pubsubProvider.subscribe(channel, handler);
  psubscribe = <T>(pattern: string, handler: MessageHandler<T>) => this.pubsubProvider.psubscribe(pattern, handler);

  async disconnect(): Promise<void> {
    await Promise.all([
      this.cacheProvider.disconnect(),
      this.pubsubProvider.disconnect(),
    ]);
  }

  /**
   * Get the underlying cache client for advanced operations
   */
  getCacheClient(): Redis {
    return this.cacheProvider.getClient();
  }
}
