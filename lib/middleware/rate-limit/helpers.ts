/**
 * Helper functions for rate limiting
 */

import type { RateLimitConfig } from './types';
import { rateLimiter } from './limiter';

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimitConfigs = {
  // Authentication endpoints (10 requests per 15 minutes)
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again later.'
  },
  
  // Registration (3 requests per hour per IP - strictly to prevent abuse)
  registration: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: 'Too many registration attempts. Please try again later.'
  },
  
  // Resume generation (20 requests per hour)
  resumeGeneration: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    message: 'You have reached the hourly limit for resume generation.'
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
  
  // General API (60 requests per minute)
  general: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: 'Too many requests. Please wait a moment.'
  },
  
  // PDF export (5 requests per minute)
  pdfExport: {
    windowMs: 60 * 1000,
    maxRequests: 5,
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
  const resetTime = await rateLimiter.getResetTime(identifier);

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
    const resetTime = await rateLimiter.getResetTime(identifier);
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
