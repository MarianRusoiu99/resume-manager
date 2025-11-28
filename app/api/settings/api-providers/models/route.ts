/**
 * Available Models Endpoint
 * GET /api/settings/api-providers/models - Get all available models from all providers
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { apiProviderService } from '@/lib/services/api-provider.service';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await apiProviderService.getAvailableModels(session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
