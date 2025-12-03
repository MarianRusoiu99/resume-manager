/**
 * Available Models Endpoint
 * GET /api/settings/api-providers/models - Get all available models from all providers
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-handler';
import { apiProviderService } from '@/lib/services/api-provider.service';

export const GET = createApiHandler(async (request, context, session) => {
  const result = await apiProviderService.getAvailableModels(session.user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
});
