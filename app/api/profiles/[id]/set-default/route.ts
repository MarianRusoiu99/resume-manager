import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { profileService } from '@/lib/services/profile.service';

/**
 * POST /api/profiles/[id]/set-default - Set a profile as default
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

    const result = await profileService.setDefaultProfile(
      id,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting default profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
