/**
 * API Provider by ID Endpoint
 * PATCH /api/settings/api-providers/[id] - Update a provider
 * DELETE /api/settings/api-providers/[id] - Delete a provider
 * POST /api/settings/api-providers/[id]/revoke - Revoke a provider (new)
 * 
 * Rate limited to 10 requests per minute for security
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-handler';
import { apiProviderService } from '@/lib/services/api-provider.service';
import { updateApiProviderSchema } from '@/lib/validations/api-schemas';

export const PATCH = createApiHandler(
  async (request, { params }, session, body) => {
    const { id } = await params;

    // Extract audit context from request
    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    const result = await apiProviderService.updateProvider(
      id,
      session.user.id,
      { ...body!, auditContext }
    );

    if (!result.success) {
      return result;
    }

    return NextResponse.json({ message: result.data.message });
  },
  { bodySchema: updateApiProviderSchema, rateLimit: 'apiKeys' }
);

export const DELETE = createApiHandler(
  async (request, { params }, session) => {
    const { id } = await params;

    // Extract audit context from request
    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    const result = await apiProviderService.deleteProvider(id, session.user.id, auditContext);

    if (!result.success) {
      return result;
    }

    return NextResponse.json({ message: result.data.message });
  },
  { rateLimit: 'apiKeys' }
);
