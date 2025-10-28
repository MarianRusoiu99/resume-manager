import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { apiKeyService } from '@/lib/services/apikey.service';
import { SimpleCache } from '@/lib/cache/simple-cache';
import type { APIKeyDto } from '@/lib/services/apikey.service';

// Use the same cache instance as the list endpoint
const apiKeysCache = new SimpleCache<APIKeyDto[]>(300);

/**
 * DELETE /api/settings/api-keys/:id - Delete an API key
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await apiKeyService.deleteAPIKey(session.user.id, id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Invalidate cache after deleting a key
    const cacheKey = `api-keys:${session.user.id}`;
    apiKeysCache.delete(cacheKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
