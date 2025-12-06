/**
 * Available Models Endpoint
 * GET /api/settings/api-providers/models - Get all available models from all providers
 */

import { createApiHandler } from '@/lib/api-handler';
import { apiProviderService } from '@/lib/services/api-provider.service';

export const GET = createApiHandler(async (request, context, session) => {
  // ServiceResult is automatically converted to NextResponse
  return apiProviderService.getAvailableModels(session.user.id);
});
