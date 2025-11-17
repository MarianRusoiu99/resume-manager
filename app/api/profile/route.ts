import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { profileService } from '@/lib/services/profile.service';
import { z } from 'zod';

// Schema for creating a new profile
const createProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(100),
  resume: z.object({}).passthrough(), // JSON Resume format
  isDefault: z.boolean().optional(),
});

/**
 * GET /api/profile - Get all profiles for the current user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await profileService.getProfiles(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile - Create a new profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createProfileSchema.safeParse(body);

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

    const { name, resume, isDefault } = validation.data;

    const result = await profileService.createProfile(
      session.user.id,
      name,
      resume,
      isDefault
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
