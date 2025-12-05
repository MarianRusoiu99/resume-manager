/**
 * PubSub Provider Interface
 * 
 * Abstraction layer for publish/subscribe functionality.
 * Allows swapping between Redis, in-memory, or other providers.
 */

/**
 * Message handler callback type
 */
export type MessageHandler<T = unknown> = (channel: string, message: T) => void;

/**
 * PubSub provider interface - implement this for different backends
 */
export interface PubSubProvider {
  /**
   * Provider name for logging/debugging
   */
  readonly name: string;

  /**
   * Check if the provider is connected and ready
   */
  isConnected(): boolean;

  /**
   * Publish a message to a channel
   */
  publish<T>(channel: string, message: T): Promise<void>;

  /**
   * Subscribe to a channel
   * Returns an unsubscribe function
   */
  subscribe<T>(channel: string, handler: MessageHandler<T>): Promise<() => void>;

  /**
   * Subscribe to a pattern (e.g., "notifications:*")
   * Returns an unsubscribe function
   */
  psubscribe<T>(pattern: string, handler: MessageHandler<T>): Promise<() => void>;

  /**
   * Gracefully disconnect
   */
  disconnect(): Promise<void>;
}

/**
 * Cache provider interface - implement this for different backends
 */
export interface CacheProvider {
  /**
   * Provider name for logging/debugging
   */
  readonly name: string;

  /**
   * Check if the provider is connected and ready
   */
  isConnected(): boolean;

  /**
   * Get a value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache with optional TTL (seconds)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Delete a key from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Set expiration on a key (seconds)
   */
  expire(key: string, ttlSeconds: number): Promise<boolean>;

  /**
   * Get remaining TTL of a key (seconds), -1 if no expiry, -2 if not exists
   */
  ttl(key: string): Promise<number>;

  /**
   * Increment a numeric value
   */
  incr(key: string): Promise<number>;

  /**
   * Decrement a numeric value
   */
  decr(key: string): Promise<number>;

  /**
   * Get multiple keys at once
   */
  mget<T>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Set multiple keys at once
   */
  mset<T>(entries: Array<{ key: string; value: T; ttlSeconds?: number }>): Promise<void>;

  /**
   * Delete keys matching a pattern (use with caution)
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Gracefully disconnect
   */
  disconnect(): Promise<void>;
}

/**
 * Combined provider interface for services that need both
 */
export interface RedisLikeProvider extends CacheProvider, PubSubProvider {}
