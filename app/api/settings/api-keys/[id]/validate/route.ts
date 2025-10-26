import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { apiKeyService } from '@/lib/services/apikey.service';

/**
 * POST /api/settings/api-keys/:id/validate - Test/validate an API key
 */
export async function POST(
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

    const result = await apiKeyService.testAPIKey(session.user.id, id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error validating API key:', error);
    return NextResponse.json(
      { error: 'Failed to validate API key' },
      { status: 500 }
    );
  }
}
