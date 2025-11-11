/**
 * API Providers Endpoint
 * GET /api/settings/api-providers - Get all providers for the user
 * POST /api/settings/api-providers - Add a new provider
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { apiProviderService } from '@/lib/services/api-provider.service';
import { z } from 'zod';

const addProviderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  provider: z.enum(['openai', 'anthropic', 'google']),
  apiKey: z.string().min(10, 'API key is required'),
  models: z.array(z.string()).min(1, 'At least one model is required'),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await apiProviderService.getUserProviders(session.user.id);

    if (!result.success) {
      console.error('getUserProviders failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching providers:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received provider data:', { ...body, apiKey: '[REDACTED]' });
    
    const validatedData = addProviderSchema.parse(body);
    console.log('Validated data:', { ...validatedData, apiKey: '[REDACTED]' });

    const result = await apiProviderService.addProvider({
      userId: session.user.id,
      ...validatedData,
    });

    if (!result.success) {
      console.error('addProvider failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error adding provider:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to add provider' },
      { status: 500 }
    );
  }
}
