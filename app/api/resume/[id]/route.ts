import { NextResponse } from 'next/server';
import { resumeService } from '@/lib/services/resume.service';
import { resumesCache } from '@/lib/cache/resumes-cache';
import { createApiHandler } from '@/lib/api-handler';

/**
 * GET /api/resume/[id] - Get a specific resume
 */
export const GET = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  // Get resume (with ownership verification)
  const resume = await resumeService.getResume(id, session.user.id);

  if (!resume) {
    return NextResponse.json(
      { error: 'Resume not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(resume);
});

/**
 * DELETE /api/resume/[id] - Delete a specific resume
 */
export const DELETE = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  // Delete resume (with ownership verification)
  await resumeService.deleteResume(id, session.user.id);

  // Invalidate cache after deleting a resume
  const cacheKey = `resumes:${session.user.id}`;
  resumesCache.delete(cacheKey);

  return NextResponse.json(
    { success: true, message: 'Resume deleted successfully' }
  );
});

/**
 * PATCH /api/resume/[id] - Update resume content or template
 */
export const PATCH = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;
  const body = await request.json();

  // Handle template update separately if only templateId is provided
  if (body.templateId !== undefined && !body.resume) {
    const updatedResume = await resumeService.updateResumeTemplate(
      id,
      session.user.id,
      body.templateId
    );

    // Invalidate cache after updating
    const cacheKey = `resumes:${session.user.id}`;
    resumesCache.delete(cacheKey);

    return NextResponse.json(updatedResume);
  }

  // Update the resume content
  const updatedResume = await resumeService.updateResumeContent(
    id,
    session.user.id,
    body.resume
  );

  // Invalidate cache after updating
  const cacheKey = `resumes:${session.user.id}`;
  resumesCache.delete(cacheKey);

  return NextResponse.json(updatedResume);
});

