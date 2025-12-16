/**
 * API Providers Endpoint
 * GET /api/settings/api-providers - Get all providers for the user
 * POST /api/settings/api-providers - Add a new provider
 * 
 * Rate limited to 10 requests per minute for security
 */

import { createApiHandler } from '@/lib/api-handler';
import { apiProviderService } from '@/lib/services/api-provider.service';
import { addApiProviderSchema } from '@/lib/validations/api-schemas';

export const GET = createApiHandler(
  async (request, context, session) => {
    // ServiceResult is automatically converted to NextResponse
    return apiProviderService.getUserProvidersWithModels(session.user.id);
  },
  { rateLimit: 'apiKeys' }
);

export const POST = createApiHandler(
  async (request, _context, session, body) => {
    // Extract audit context from request
    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    return apiProviderService.addProvider({
      userId: session.user.id,
      ...body!,
      auditContext,
    });
  },
  { bodySchema: addApiProviderSchema, rateLimit: 'apiKeys', verifyUser: true }
);
