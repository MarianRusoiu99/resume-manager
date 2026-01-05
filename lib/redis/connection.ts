/**
 * Redis connection configuration and utilities
 */

import { RedisOptions as IoRedisOptions } from 'ioredis';
import { ValidationError } from '@/lib/errors';

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
export function getRedisConfig(options: RedisOptions): IoRedisOptions {
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
export function parseRedisUrl(url: string): Partial<IoRedisOptions> {
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
    throw new ValidationError(`Invalid Redis URL: ${url}`);
  }
}
