/**
 * Redis Cache Provider
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { CacheProvider } from './types';
import { RedisOptions, getRedisConfig } from './connection';

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
