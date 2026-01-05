/**
 * Rate Limiting Middleware for Next.js API Routes
 * 
 * Supports both Redis-backed (production) and in-memory (development) rate limiting.
 * Redis-backed rate limiting is suitable for multi-server deployments.
 */

// Export types
export type { RateLimitConfig, RateLimitEntry, RateLimiterBackend } from './types';

// Export limiter implementations
export { RedisRateLimiter } from './redis-limiter';
export { MemoryRateLimiter } from './memory-limiter';
export { RateLimiter, rateLimiter } from './limiter';

// Export helper functions and configs
export {
  RateLimitConfigs,
  createRateLimitResponse,
  getClientIdentifier,
  addRateLimitHeaders,
  applyRateLimit
} from './helpers';
