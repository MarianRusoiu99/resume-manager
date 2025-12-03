/**
 * API Providers Endpoint
 * GET /api/settings/api-providers - Get all providers for the user
 * POST /api/settings/api-providers - Add a new provider
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-handler';
import { apiProviderService } from '@/lib/services/api-provider.service';
import { z } from 'zod';

const addProviderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  provider: z.enum(['openai', 'anthropic', 'google']),
  apiKey: z.string().min(10, 'API key is required'),
});

export const GET = createApiHandler(async (request, context, session) => {
  const result = await apiProviderService.getUserProvidersWithModels(session.user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
});

export const POST = createApiHandler(
  async (request, context, session, body) => {
    const result = await apiProviderService.addProvider({
      userId: session.user.id,
      ...body!,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  },
  { bodySchema: addProviderSchema }
);
