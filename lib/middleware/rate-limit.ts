/**
 * Rate Limiting Middleware for Next.js API Routes
 * 
 * Simple in-memory rate limiter suitable for single-server deployments.
 * For production with multiple servers, consider using Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  message?: string;  // Custom error message
}

class RateLimiter {
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
  isRateLimited(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // If no entry exists or entry has expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return false;
    }

    // If within limit, increment counter
    if (entry.count < config.maxRequests) {
      entry.count++;
      return false;
    }

    // Rate limit exceeded
    return true;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string, config: RateLimitConfig): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until reset for an identifier
   */
  getResetTime(identifier: string): number | null {
    const entry = this.requests.get(identifier);
    if (!entry) return null;
    return entry.resetTime;
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
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
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
export function applyRateLimit(
  identifier: string,
  config: RateLimitConfig,
  requestId?: string
): Response | null {
  const isLimited = rateLimiter.isRateLimited(identifier, config);
  
  if (isLimited) {
    const resetTime = rateLimiter.getResetTime(identifier);
    const remaining = rateLimiter.getRemaining(identifier, config);
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
export function addRateLimitHeaders(
  response: Response,
  identifier: string,
  config: RateLimitConfig
): Response {
  const remaining = rateLimiter.getRemaining(identifier, config);
  const resetTime = rateLimiter.getResetTime(identifier);

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
