/**
 * Rate limiting types
 */

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  message?: string;  // Custom error message
}

export interface RateLimiterBackend {
  checkLimit(identifier: string, limit: number, windowMs: number): Promise<boolean>;
  getCount(identifier: string): Promise<number>;
  getTTL(identifier: string): Promise<number>;
  clear(identifier: string): Promise<void>;
  clearAll(): Promise<void>;
}
