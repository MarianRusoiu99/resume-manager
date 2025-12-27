/**
 * API Provider Revoke Endpoint
 * POST /api/settings/api-providers/[id]/revoke - Revoke a provider key
 * 
 * Revokes a key without deleting it, preserving audit history.
 * Rate limited to 10 requests per minute for security.
 */

import { createApiHandler } from '@/lib/api-handler';
import { apiProviderService } from '@/lib/services/api-provider.service';
import { z } from 'zod';

const revokeSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const POST = createApiHandler(
  async (request, { params }, session, body) => {
    const { id } = await params;

    // Extract audit context from request
    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    return apiProviderService.revokeProvider(id, session.user.id, auditContext, body?.reason);
  },
  { bodySchema: revokeSchema, rateLimit: 'apiKeys' }
);
