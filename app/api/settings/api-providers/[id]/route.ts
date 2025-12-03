/**
 * API Provider by ID Endpoint
 * PATCH /api/settings/api-providers/[id] - Update a provider
 * DELETE /api/settings/api-providers/[id] - Delete a provider
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-handler';
import { apiProviderService } from '@/lib/services/api-provider.service';
import { z } from 'zod';

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(10).optional(),
  models: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = createApiHandler(
  async (request, { params }, session, body) => {
    const { id } = await params;

    const result = await apiProviderService.updateProvider(
      id,
      session.user.id,
      body!
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.data.message });
  },
  { bodySchema: updateProviderSchema }
);

export const DELETE = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await apiProviderService.deleteProvider(id, session.user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: result.data.message });
});
