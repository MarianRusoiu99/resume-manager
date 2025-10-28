import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { apiKeyService, AIProvider, APIKeyDto } from '@/lib/services/apikey.service';
import { checkRateLimit, RateLimitConfigs } from '@/lib/middleware/rate-limit-helpers';
import { SimpleCache } from '@/lib/cache/simple-cache';

// Cache for API keys list (5 minute TTL)
const apiKeysCache = new SimpleCache<APIKeyDto[]>(300);

/**
 * GET /api/settings/api-keys - List all API keys (masked)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (10 requests per minute)
    const rateLimitCheck = await checkRateLimit(request, RateLimitConfigs.apiKeys);
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response!;
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cacheKey = `api-keys:${session.user.id}`;
    
    // Try to get from cache first
    let keys = apiKeysCache.get(cacheKey);
    
    if (!keys) {
      // Cache miss - fetch from database
      keys = await apiKeyService.getUserAPIKeys(session.user.id);
      // Store in cache
      apiKeysCache.set(cacheKey, keys);
    }

    const response = NextResponse.json(keys);
    return rateLimitCheck.addHeaders(response);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/api-keys - Add a new API key
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (10 requests per minute)
    const rateLimitCheck = await checkRateLimit(request, RateLimitConfigs.apiKeys);
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response!;
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    const result = await apiKeyService.addAPIKey(session.user.id, {
      provider: provider as AIProvider,
      apiKey
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Invalidate cache after adding a new key
    const cacheKey = `api-keys:${session.user.id}`;
    apiKeysCache.delete(cacheKey);

    const response = NextResponse.json(result.key, { status: 201 });
    return rateLimitCheck.addHeaders(response);
  } catch (error) {
    console.error('Error adding API key:', error);
    return NextResponse.json(
      { error: 'Failed to add API key' },
      { status: 500 }
    );
  }
}
