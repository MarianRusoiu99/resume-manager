/**
 * In-Memory PubSub and Cache Provider
 * 
 * Fallback provider for development or when Redis is unavailable.
 * NOT suitable for multi-instance deployments.
 */

import { EventEmitter } from 'node:events';
import { CacheProvider, PubSubProvider, MessageHandler } from './types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null; // null = no expiry
}

/**
 * In-memory cache implementation
 */
export class MemoryCacheProvider implements CacheProvider {
  readonly name = 'memory';
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  isConnected(): boolean {
    return true; // Always connected
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    };
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) return false;
    entry.expiresAt = Date.now() + ttlSeconds * 1000;
    return true;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get<number>(key);
    const newValue = (current ?? 0) + 1;
    await this.set(key, newValue);
    return newValue;
  }

  async decr(key: string): Promise<number> {
    const current = await this.get<number>(key);
    const newValue = (current ?? 0) - 1;
    await this.set(key, newValue);
    return newValue;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttlSeconds?: number }>): Promise<void> {
    for (const { key, value, ttlSeconds } of entries) {
      await this.set(key, value, ttlSeconds);
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    // Convert glob pattern to regex
    const regex = new RegExp('^' + pattern.replaceAll('*', '.*').replaceAll('?', '.') + '$');
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

/**
 * In-memory PubSub implementation using Node.js EventEmitter
 */
export class MemoryPubSubProvider implements PubSubProvider {
  readonly name = 'memory';
  private readonly emitter = new EventEmitter();

  constructor() {
    // Increase max listeners for high-traffic scenarios
    this.emitter.setMaxListeners(100);
  }

  isConnected(): boolean {
    return true; // Always connected
  }

  async publish<T>(channel: string, message: T): Promise<void> {
    this.emitter.emit(channel, message);
    // Also emit to pattern subscribers
    this.emitter.emit('__pattern__', channel, message);
  }

  async subscribe<T>(channel: string, handler: MessageHandler<T>): Promise<() => void> {
    const wrappedHandler = (message: T) => handler(channel, message);
    this.emitter.on(channel, wrappedHandler);
    
    return () => {
      this.emitter.off(channel, wrappedHandler);
    };
  }

  async psubscribe<T>(pattern: string, handler: MessageHandler<T>): Promise<() => void> {
    // Convert glob pattern to regex
    const regex = new RegExp('^' + pattern.replaceAll('*', '.*').replaceAll('?', '.') + '$');
    
    const patternHandler = (channel: string, message: T) => {
      if (regex.test(channel)) {
        handler(channel, message);
      }
    };
    
    this.emitter.on('__pattern__', patternHandler);
    
    return () => {
      this.emitter.off('__pattern__', patternHandler);
    };
  }

  async disconnect(): Promise<void> {
    this.emitter.removeAllListeners();
  }
}

/**
 * Combined in-memory provider
 */
export class MemoryProvider implements CacheProvider, PubSubProvider {
  readonly name = 'memory';
  private readonly cacheProvider: MemoryCacheProvider;
  private readonly pubsubProvider: MemoryPubSubProvider;

  constructor() {
    this.cacheProvider = new MemoryCacheProvider();
    this.pubsubProvider = new MemoryPubSubProvider();
  }

  isConnected(): boolean {
    return true;
  }

  // Cache methods
  get<T>(key: string): Promise<T | null> {
    return this.cacheProvider.get<T>(key);
  }
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.cacheProvider.set(key, value, ttlSeconds);
  }
  delete(key: string): Promise<boolean> {
    return this.cacheProvider.delete(key);
  }
  exists(key: string): Promise<boolean> {
    return this.cacheProvider.exists(key);
  }
  expire(key: string, ttlSeconds: number): Promise<boolean> {
    return this.cacheProvider.expire(key, ttlSeconds);
  }
  ttl(key: string): Promise<number> {
    return this.cacheProvider.ttl(key);
  }
  incr(key: string): Promise<number> {
    return this.cacheProvider.incr(key);
  }
  decr(key: string): Promise<number> {
    return this.cacheProvider.decr(key);
  }
  mget<T>(keys: string[]): Promise<(T | null)[]> {
    return this.cacheProvider.mget<T>(keys);
  }
  mset<T>(entries: Array<{ key: string; value: T; ttlSeconds?: number }>): Promise<void> {
    return this.cacheProvider.mset(entries);
  }
  deletePattern(pattern: string): Promise<number> {
    return this.cacheProvider.deletePattern(pattern);
  }

  // PubSub methods
  publish<T>(channel: string, message: T): Promise<void> {
    return this.pubsubProvider.publish(channel, message);
  }
  subscribe<T>(channel: string, handler: MessageHandler<T>): Promise<() => void> {
    return this.pubsubProvider.subscribe(channel, handler);
  }
  psubscribe<T>(pattern: string, handler: MessageHandler<T>): Promise<() => void> {
    return this.pubsubProvider.psubscribe(pattern, handler);
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.cacheProvider.disconnect(),
      this.pubsubProvider.disconnect(),
    ]);
  }
}
