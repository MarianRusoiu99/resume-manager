/**
 * Mock for Redis
 * 
 * Provides an in-memory store that mimics Redis behavior for testing
 */

import { vi } from 'vitest';

/**
 * In-memory Redis mock implementation
 */
export class MockRedis {
  private store: Map<string, { value: string; expiry?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiry: number | undefined;

    if (mode === 'EX' && duration) {
      expiry = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiry = Date.now() + duration;
    }

    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const expiry = Date.now() + seconds * 1000;
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      const entry = this.store.get(key);
      if (entry) {
        // Check if expired
        if (entry.expiry && Date.now() > entry.expiry) {
          this.store.delete(key);
        } else {
          count++;
        }
      }
    }
    return count;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2; // Key doesn't exist

    if (!entry.expiry) return -1; // Key exists but has no expiry

    const ttl = Math.floor((entry.expiry - Date.now()) / 1000);
    if (ttl <= 0) {
      this.store.delete(key);
      return -2;
    }

    return ttl;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;

    entry.expiry = Date.now() + seconds * 1000;
    return 1;
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    const currentValue = entry ? parseInt(entry.value, 10) : 0;
    const newValue = currentValue + 1;
    this.store.set(key, { value: String(newValue), expiry: entry?.expiry });
    return newValue;
  }

  async decr(key: string): Promise<number> {
    const entry = this.store.get(key);
    const currentValue = entry ? parseInt(entry.value, 10) : 0;
    const newValue = currentValue - 1;
    this.store.set(key, { value: String(newValue), expiry: entry?.expiry });
    return newValue;
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching (only supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  async flushdb(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  // Additional methods for testing
  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

/**
 * Create a mock Redis client
 */
export function createMockRedis(): MockRedis {
  return new MockRedis();
}

/**
 * Mock Redis module
 */
export function mockRedisModule() {
  const mockRedis = createMockRedis();
  
  return {
    Redis: vi.fn(() => mockRedis),
    mockRedis,
  };
}
