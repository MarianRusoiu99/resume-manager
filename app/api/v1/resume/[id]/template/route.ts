import { NextResponse } from 'next/server';
import { generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { templateRepository } from '@/lib/repositories/template.repository';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api-handler';

// Validation schema for template update
const updateTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
});

/**
 * PATCH /api/resume/[id]/template - Update template for a resume
 */
export const PATCH = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  // Parse and validate request body
  const body = await request.json();
  const validation = updateTemplateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { templateId } = validation.data;

  // Verify template exists
  const template = await templateRepository.findById(templateId);
  if (!template) {
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );
  }

  // Get resume and verify ownership
  const resume = await generatedResumeRepository.findByIdAndUserId(id, session.user.id);
  if (!resume) {
    return NextResponse.json(
      { error: 'Resume not found' },
      { status: 404 }
    );
  }

  // Update template (this also clears PDF URL)
  const updatedResume = await generatedResumeRepository.updateTemplate(id, templateId);

  return NextResponse.json({
    success: true,
    resume: {
      id: updatedResume.id,
      templateId: updatedResume.templateId,
    },
    message: 'Template updated successfully',
  });
});
