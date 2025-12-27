/**
 * Redis Provider Implementation
 * 
 * Production-ready Redis provider using ioredis.
 * Supports both caching and pub/sub functionality.
 */

import Redis, { RedisOptions as IoRedisOptions } from 'ioredis';
import { logger } from '@/lib/utils/logger';
import { CacheProvider, PubSubProvider, MessageHandler } from './types';

/**
 * Redis connection options
 */
export interface RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  tls?: boolean;
  url?: string; // Redis URL (takes precedence over individual options)
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

/**
 * Parse Redis URL or return individual options
 */
function getRedisConfig(options: RedisOptions): IoRedisOptions {
  if (options.url) {
    return {
      ...parseRedisUrl(options.url),
      keyPrefix: options.keyPrefix,
      maxRetriesPerRequest: options.maxRetriesPerRequest ?? 3,
      enableReadyCheck: options.enableReadyCheck ?? true,
      lazyConnect: options.lazyConnect ?? false,
    };
  }
  
  return {
    host: options.host ?? 'localhost',
    port: options.port ?? 6379,
    password: options.password,
    db: options.db ?? 0,
    keyPrefix: options.keyPrefix,
    maxRetriesPerRequest: options.maxRetriesPerRequest ?? 3,
    enableReadyCheck: options.enableReadyCheck ?? true,
    lazyConnect: options.lazyConnect ?? false,
    tls: options.tls ? {} : undefined,
  };
}

/**
 * Parse a Redis URL into connection options
 */
function parseRedisUrl(url: string): Partial<IoRedisOptions> {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number.parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      db: parsed.pathname ? Number.parseInt(parsed.pathname.slice(1)) || 0 : 0,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  } catch {
    throw new Error(`Invalid Redis URL: ${url}`);
  }
}

/**
 * Redis Cache Provider
 */
export class RedisCacheProvider implements CacheProvider {
  readonly name = 'redis';
  private readonly client: Redis;
  private connected = false;

  constructor(options: RedisOptions = {}) {
    const config = getRedisConfig(options);
    this.client = new Redis(config);
    
    this.client.on('connect', () => {
      this.connected = true;
      logger.info('Redis cache client connected');
    });
    
    this.client.on('error', (error) => {
      logger.error('Redis cache client error', error);
    });
    
    this.client.on('close', () => {
      this.connected = false;
      logger.info('Redis cache client disconnected');
    });
  }

  isConnected(): boolean {
    return this.connected && this.client.status === 'ready';
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.client.del(key);
    return result > 0;
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result > 0;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const values = await this.client.mget(...keys);
    return values.map((value) => {
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    });
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttlSeconds?: number }>): Promise<void> {
    if (entries.length === 0) return;
    
    const pipeline = this.client.pipeline();
    for (const { key, value, ttlSeconds } of entries) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) {
        pipeline.setex(key, ttlSeconds, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    }
    await pipeline.exec();
  }

  async deletePattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;
    
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      
      if (keys.length > 0) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');
    
    return deleted;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Get the underlying Redis client for advanced operations
   */
  getClient(): Redis {
    return this.client;
  }
}

/**
 * Redis PubSub Provider
 * 
 * Uses separate subscriber connection as required by Redis
 */
export class RedisPubSubProvider implements PubSubProvider {
  readonly name = 'redis';
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private connected = false;
  private readonly handlers = new Map<string, Set<MessageHandler<unknown>>>();
  private readonly patternHandlers = new Map<string, Set<MessageHandler<unknown>>>();

  constructor(options: RedisOptions = {}) {
    const config = getRedisConfig(options);
    
    // Publisher connection
    this.publisher = new Redis(config);
    this.publisher.on('connect', () => {
      logger.info('Redis publisher connected');
    });
    this.publisher.on('error', (error) => {
      logger.error('Redis publisher error', error);
    });
    
    // Subscriber connection (separate as required by Redis)
    this.subscriber = new Redis(config);
    this.subscriber.on('connect', () => {
      this.connected = true;
      logger.info('Redis subscriber connected');
    });
    this.subscriber.on('error', (error) => {
      logger.error('Redis subscriber error', error);
    });
    this.subscriber.on('close', () => {
      this.connected = false;
    });
    
    // Handle incoming messages
    this.subscriber.on('message', (channel, message) => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        const parsed = this.parseMessage(message);
        for (const handler of channelHandlers) {
          try {
            handler(channel, parsed);
          } catch (error) {
            logger.error('Redis message handler error', error, { channel });
          }
        }
      }
    });
    
    // Handle pattern messages
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      const patternHandlers = this.patternHandlers.get(pattern);
      if (patternHandlers) {
        const parsed = this.parseMessage(message);
        for (const handler of patternHandlers) {
          try {
            handler(channel, parsed);
          } catch (error) {
            logger.error('Redis pattern handler error', error, { pattern });
          }
        }
      }
    });
  }

  private parseMessage(message: string): unknown {
    try {
      return JSON.parse(message);
    } catch {
      return message;
    }
  }

  isConnected(): boolean {
    return this.connected && this.subscriber.status === 'ready';
  }

  async publish<T>(channel: string, message: T): Promise<void> {
    const serialized = typeof message === 'string' ? message : JSON.stringify(message);
    await this.publisher.publish(channel, serialized);
  }

  async subscribe<T>(channel: string, handler: MessageHandler<T>): Promise<() => void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    
    this.handlers.get(channel)!.add(handler as MessageHandler<unknown>);
    
    return () => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.delete(handler as MessageHandler<unknown>);
        if (channelHandlers.size === 0) {
          this.handlers.delete(channel);
          void this.subscriber.unsubscribe(channel);
        }
      }
    };
  }

  async psubscribe<T>(pattern: string, handler: MessageHandler<T>): Promise<() => void> {
    if (!this.patternHandlers.has(pattern)) {
      this.patternHandlers.set(pattern, new Set());
      await this.subscriber.psubscribe(pattern);
    }
    
    this.patternHandlers.get(pattern)!.add(handler as MessageHandler<unknown>);
    
    return () => {
      const patternHandlers = this.patternHandlers.get(pattern);
      if (patternHandlers) {
        patternHandlers.delete(handler as MessageHandler<unknown>);
        if (patternHandlers.size === 0) {
          this.patternHandlers.delete(pattern);
          void this.subscriber.punsubscribe(pattern);
        }
      }
    };
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit(),
    ]);
  }
}

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
