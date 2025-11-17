import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { profileService } from '@/lib/services/profile.service';
import { z } from 'zod';

const duplicateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

/**
 * POST /api/profile/[id]/duplicate - Duplicate a profile
 */
export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const validation = duplicateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const result = await profileService.duplicateProfile(
      id,
      session.user.id,
      validation.data.name
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error duplicating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
