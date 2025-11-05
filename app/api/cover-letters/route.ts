/**
 * Cover Letters API
 * GET /api/cover-letters - List all cover letters for the authenticated user
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { coverLetterService } from '@/lib/services/cover-letter.service';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get cover letters
    const result = await coverLetterService.getUserCoverLetters(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Cover Letters API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cover letters' },
      { status: 500 }
    );
  }
}
