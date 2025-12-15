/**
 * Resume Detail API Routes
 * 
 * GET /api/resume/[id] - Get a specific resume
 *   - Used for initial data fetching in components
 * 
 * PATCH /api/resume/[id] - Update resume content or template
 *   - Used for content updates (no server action equivalent yet)
 * 
 * DELETE /api/resume/[id] - Delete a specific resume
 *   - @deprecated Prefer using deleteResume server action from '@/app/actions/resume'
 *   - Kept for backward compatibility
 */

import { NextResponse } from 'next/server';
import { resumeService } from '@/lib/services/resume.service';
import { createApiHandler } from '@/lib/api-handler';

/**
 * GET /api/resume/[id] - Get a specific resume
 */
export const GET = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  // Get resume (with ownership verification)
  return resumeService.getResume(id, session.user.id);
});

/**
 * DELETE /api/resume/[id] - Delete a specific resume
 */
export const DELETE = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  // Delete resume (with ownership verification) - cache invalidation handled in service
  const result = await resumeService.deleteResume(id, session.user.id);

  if (!result.success) {
    return result;
  }

  return NextResponse.json({ success: true, message: 'Resume deleted successfully' });
});

/**
 * PATCH /api/resume/[id] - Update resume content or template
 */
export const PATCH = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;
  const body = await request.json();

  // Handle template update separately if only templateId is provided
  if (body.templateId !== undefined && !body.resume) {
    const result = await resumeService.updateResumeTemplate(
      id,
      session.user.id,
      body.templateId
    );

    if (!result.success) {
      return result;
    }

    // Cache invalidation handled in service
    return NextResponse.json(result.data);
  }

  // Update the resume content
  const result = await resumeService.updateResumeContent(
    id,
    session.user.id,
    body.resume
  );

  if (!result.success) {
    return result;
  }

  // Cache invalidation handled in service
  return NextResponse.json(result.data);
});

