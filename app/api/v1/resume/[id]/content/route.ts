/**
 * API Route: PATCH /api/resume/:id/content
 * Updates resume content for a specific resume
 */

import { NextResponse } from 'next/server';
import { generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { z } from 'zod';
import { resumeSchema, type Resume } from '@/lib/validations/jsonresume';
import { createApiHandler } from '@/lib/api-handler';

// Validation schema for resume content - use JSON Resume schema
const contentSchema = z.object({
  content: resumeSchema
});

export const PATCH = createApiHandler(async (request, { params }, session) => {
  const { id: resumeId } = await params;

  // Parse and validate request body
  const body = await request.json();
  const validation = contentSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Invalid content data',
        details: validation.error.issues,
      },
      { status: 400 }
    );
  }

  const { content } = validation.data;

  // Verify resume exists and belongs to user
  const resume = await generatedResumeRepository.findById(resumeId);

  if (!resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  }

  if (resume.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update resume content using JSON Resume format
  const updatedResume = await generatedResumeRepository.update(
    resumeId,
    content as Resume
  );

  return NextResponse.json({
    success: true,
    resume: updatedResume,
  });
});
