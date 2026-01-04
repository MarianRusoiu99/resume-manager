/**
 * Rate Limiting Middleware for Next.js API Routes
 * 
 * Supports both Redis-backed (production) and in-memory (development) rate limiting.
 * Redis-backed rate limiting is suitable for multi-server deployments.
 */

import { getCacheProvider } from '@/lib/redis/client';
import { env } from '@/lib/config/env';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  message?: string;  // Custom error message
}

/**
 * Redis-backed rate limiter for production use
 */
class RedisRateLimiter {
  private cache = getCacheProvider();
  
  async checkLimit(identifier: string, limit: number, windowMs: number): Promise<boolean> {
    const key = `rate-limit:${identifier}`;
    const current = await this.cache.get<string>(key);
    const count = current ? parseInt(current, 10) : 0;
    
    if (count >= limit) return false;
    
    await this.cache.incr(key);
    if (count === 0) {
      await this.cache.expire(key, Math.ceil(windowMs / 1000));
    }
    return true;
  }
  
  async getCount(identifier: string): Promise<number> {
    const key = `rate-limit:${identifier}`;
    const current = await this.cache.get<string>(key);
    return current ? parseInt(current, 10) : 0;
  }
  
  async getTTL(identifier: string): Promise<number> {
    const key = `rate-limit:${identifier}`;
    return this.cache.ttl(key);
  }
  
  async clear(identifier: string): Promise<void> {
    const key = `rate-limit:${identifier}`;
    await this.cache.delete(key);
  }
  
  async clearAll(): Promise<void> {
    await this.cache.deletePattern('rate-limit:*');
  }
}

/**
 * In-memory rate limiter for development/testing
 */
class MemoryRateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request should be rate limited
   */
  async checkLimit(identifier: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // If no entry exists or entry has expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    // If within limit, increment counter
    if (entry.count < limit) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get count for an identifier
   */
  async getCount(identifier: string): Promise<number> {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.count;
  }

  /**
   * Get TTL in seconds
   */
  async getTTL(identifier: string): Promise<number> {
    const entry = this.requests.get(identifier);
    if (!entry) return -2; // Key doesn't exist
    const remaining = Math.ceil((entry.resetTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1; // -1 means expired
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Clear single entry
   */
  async clear(identifier: string): Promise<void> {
    this.requests.delete(identifier);
  }

  /**
   * Clear all entries (useful for testing)
   */
  async clearAll(): Promise<void> {
    this.requests.clear();
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

/**
 * Unified rate limiter interface
 */
class RateLimiter {
  private backend: RedisRateLimiter | MemoryRateLimiter;
  
  constructor() {
    // Use Redis in production if available, otherwise fall back to memory
    if (env.hasRedis) {
      this.backend = new RedisRateLimiter();
    } else {
      this.backend = new MemoryRateLimiter();
    }
  }
  
  /**
   * Check if a request should be rate limited
   */
  async isRateLimited(identifier: string, config: RateLimitConfig): Promise<boolean> {
    const allowed = await this.backend.checkLimit(identifier, config.maxRequests, config.windowMs);
    return !allowed;
  }
  
  /**
   * Get remaining requests for an identifier
   */
  async getRemaining(identifier: string, config: RateLimitConfig): Promise<number> {
    const count = await this.backend.getCount(identifier);
    return Math.max(0, config.maxRequests - count);
  }
  
  /**
   * Get time until reset for an identifier
   */
  async getResetTime(identifier: string, config: RateLimitConfig): Promise<number | null> {
    const ttl = await this.backend.getTTL(identifier);
    if (ttl < 0) return null;
    return Date.now() + (ttl * 1000);
  }
  
  /**
   * Clear all entries (useful for testing)
   */
  async clear(): Promise<void> {
    await this.backend.clearAll();
  }
  
  /**
   * Cleanup on destroy (for memory backend)
   */
  destroy(): void {
    if (this.backend instanceof MemoryRateLimiter) {
      this.backend.destroy();
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimitConfigs = {
  // Authentication endpoints (5 requests per 15 minutes)
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.'
  },
  
  // Resume generation (5 requests per minute)
  resumeGeneration: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: 'Too many resume generation requests. Please wait a moment.'
  },
  
  // API key operations (10 requests per minute)
  apiKeys: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Too many API key operations. Please wait a moment.'
  },
  
  // Profile updates (20 requests per minute)
  profileUpdates: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Too many profile updates. Please wait a moment.'
  },
  
  // General API (30 requests per minute)
  general: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Too many requests. Please wait a moment.'
  },
  
  // PDF export (10 requests per minute)
  pdfExport: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Too many PDF export requests. Please wait a moment.'
  }
} as const;

/**
 * Create a rate limit response with headers
 */
export function createRateLimitResponse(
  message: string,
  resetTime: number | null,
  remaining: number,
  limit: number,
  requestId?: string
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
  };

  if (resetTime) {
    headers['X-RateLimit-Reset'] = Math.ceil(resetTime / 1000).toString();
    headers['Retry-After'] = Math.ceil((resetTime - Date.now()) / 1000).toString();
  }

  return new Response(
    JSON.stringify({
      error: message,
      retryAfter: resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : null,
      requestId,
    }),
    {
      status: 429,
      headers
    }
  );
}

/**
 * Apply rate limiting to a request
 * 
 * @param identifier - Unique identifier for the client (IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null otherwise
 */
export async function applyRateLimit(
  identifier: string,
  config: RateLimitConfig,
  requestId?: string
): Promise<Response | null> {
  const isLimited = await rateLimiter.isRateLimited(identifier, config);
  
  if (isLimited) {
    const resetTime = await rateLimiter.getResetTime(identifier, config);
    const remaining = await rateLimiter.getRemaining(identifier, config);
    return createRateLimitResponse(
      config.message || 'Too many requests',
      resetTime,
      remaining,
      config.maxRequests,
      requestId
    );
  }

  return null;
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer userId if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

/**
 * Add rate limit headers to a successful response
 */
export async function addRateLimitHeaders(
  response: Response,
  identifier: string,
  config: RateLimitConfig
): Promise<Response> {
  const remaining = await rateLimiter.getRemaining(identifier, config);
  const resetTime = await rateLimiter.getResetTime(identifier, config);

  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  if (resetTime) {
    headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Export the rate limiter instance for testing
export { rateLimiter };
