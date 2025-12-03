/**
 * Rate Limiting Helpers for Next.js API Routes
 * 
 * Provides easy-to-use wrappers for applying rate limiting to API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/dal';
import {
  applyRateLimit,
  getClientIdentifier,
  addRateLimitHeaders,
  RateLimitConfigs,
  type RateLimitConfig
} from './rate-limit';

/**
 * Wrap an API route handler with rate limiting
 * 
 * @example
 * export const POST = withRateLimit(
 *   async (request) => {
 *     // Your handler code
 *     return NextResponse.json({ success: true });
 *   },
 *   RateLimitConfigs.resumeGeneration
 * );
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<Response>,
  config: RateLimitConfig = RateLimitConfigs.general
) {
  return async (request: NextRequest): Promise<Response> => {
    // Get user ID if authenticated via DAL
    const session = await getSession();
    const userId = session?.userId;

    // Get client identifier
    const identifier = getClientIdentifier(request, userId);

    // Check rate limit
    const rateLimitResponse = applyRateLimit(identifier, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Call the actual handler
    const response = await handler(request);

    // Add rate limit headers to successful response
    return addRateLimitHeaders(response, identifier, config);
  };
}

/**
 * Check rate limit without wrapping the handler
 * Useful when you need more control over the response
 * 
 * @example
 * export async function POST(request: NextRequest) {
 *   const rateLimitCheck = await checkRateLimit(request, RateLimitConfigs.resumeGeneration);
 *   if (rateLimitCheck.limited) {
 *     return rateLimitCheck.response!;
 *   }
 * 
 *   // Your handler code
 *   const response = NextResponse.json({ success: true });
 *   return rateLimitCheck.addHeaders(response);
 * }
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RateLimitConfigs.general
): Promise<{
  limited: boolean;
  response: Response | null;
  identifier: string;
  addHeaders: (response: Response) => Response;
}> {
  // Get user ID if authenticated via DAL
  const session = await getSession();
  const userId = session?.userId;

  // Get client identifier
  const identifier = getClientIdentifier(request, userId);

  // Check rate limit
  const rateLimitResponse = applyRateLimit(identifier, config);

  return {
    limited: rateLimitResponse !== null,
    response: rateLimitResponse,
    identifier,
    addHeaders: (response: Response) => addRateLimitHeaders(response, identifier, config)
  };
}

/**
 * Rate limit specific to authenticated users
 * Uses user ID as identifier
 */
export function withAuthRateLimit(
  handler: (request: NextRequest, userId: string) => Promise<Response>,
  config: RateLimitConfig = RateLimitConfigs.general
) {
  return async (request: NextRequest): Promise<Response> => {
    // Check authentication first via DAL
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const identifier = `user:${userId}`;

    // Check rate limit
    const rateLimitResponse = applyRateLimit(identifier, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Call the actual handler with userId
    const response = await handler(request, userId);

    // Add rate limit headers
    return addRateLimitHeaders(response, identifier, config);
  };
}

/**
 * Export rate limit configs for easy access
 */
export { RateLimitConfigs } from './rate-limit';
