/**
 * Cover Letters API
 * GET /api/cover-letter - List all cover letters for the authenticated user
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-handler';
import { coverLetterService } from '@/lib/services/cover-letter.service';

export const GET = createApiHandler(async (request, context, session) => {
  const result = await coverLetterService.getUserCoverLetters(session.user.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json(result.data);
});
