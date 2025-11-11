/**
 * API Provider by ID Endpoint
 * PATCH /api/settings/api-providers/[id] - Update a provider
 * DELETE /api/settings/api-providers/[id] - Delete a provider
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { apiProviderService } from '@/lib/services/api-provider.service';
import { z } from 'zod';

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(10).optional(),
  models: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProviderSchema.parse(body);

    const result = await apiProviderService.updateProvider(
      id,
      session.user.id,
      validatedData
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await apiProviderService.deleteProvider(id, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    );
  }
}
