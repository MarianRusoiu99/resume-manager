/**
 * API Route: PATCH /api/resume/:id/content
 * Updates resume content for a specific resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { z } from 'zod';
import { resumeSchema, type Resume } from '@/lib/validations/jsonresume';

// Validation schema for resume content - use JSON Resume schema
const contentSchema = z.object({
  content: resumeSchema
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get resume ID from params
    const { id: resumeId } = await context.params;

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
  } catch (error) {
    console.error('Error updating resume content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}
