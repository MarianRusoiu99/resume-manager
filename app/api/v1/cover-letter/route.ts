/**
 * Cover Letters API
 * GET /api/cover-letter - List all cover letters for the authenticated user
 */

import { createApiHandler } from '@/lib/api/handler';
import { coverLetterService } from '@/lib/services';

export const GET = createApiHandler(async (request, context, session) => {
  // ServiceResult is automatically converted to NextResponse
  return coverLetterService.getUserCoverLetters(session.user.id);
});
