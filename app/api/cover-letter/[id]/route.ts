/**
 * Cover Letter Detail API Routes
 * 
 * GET /api/cover-letter/[id] - Get a specific cover letter
 *   - Used for initial data fetching in components
 * 
 * PUT /api/cover-letter/[id] - Update a cover letter
 *   - @deprecated Prefer using updateCoverLetter server action from '@/app/actions/cover-letter'
 *   - Kept for backward compatibility
 * 
 * DELETE /api/cover-letter/[id] - Delete a cover letter
 *   - @deprecated Prefer using deleteCoverLetter server action from '@/app/actions/cover-letter'
 *   - Kept for backward compatibility
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-handler';
import { coverLetterService } from '@/lib/services/cover-letter.service';
import { z } from 'zod';

const updateSchema = z.object({
  content: z.string().min(1).optional(),
  contentJson: z.string().optional(), // Yoopta editor JSON state
  jobDescription: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  resumeId: z.string().optional().nullable(),
});

export const GET = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;
  // ServiceResult is automatically converted to NextResponse with proper status codes
  return coverLetterService.getCoverLetter(id, session.user.id);
});

export const PUT = createApiHandler(
  async (request, { params }, session, body) => {
    const { id } = await params;
    // ServiceResult is automatically converted to NextResponse with proper status codes
    return coverLetterService.updateCoverLetter(id, session.user.id, body!);
  },
  { bodySchema: updateSchema }
);

export const DELETE = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;
  const result = await coverLetterService.deleteCoverLetter(id, session.user.id);

  // For delete, return { success: true } on success for backward compatibility
  if (result.success) {
    return NextResponse.json({ success: true });
  }
  return result;
});
