/**
 * API Route: POST /api/resume/:id/duplicate
 * Creates a duplicate copy of an existing resume
 */

import type { Resume } from '@/lib/validations/jsonresume';
import { createApiHandler } from '@/lib/api-handler';
import { requireFound, requireOwnership } from '@/lib/auth/guards';
import { success } from '@/lib/types/service-result';
import { generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';

export const POST = createApiHandler(async (request, { params }, session) => {
  const { id: resumeId } = await params;

  const originalResume = requireFound(
    await generatedResumeRepository.findById(resumeId),
    'Resume'
  );

  requireOwnership({
    resourceUserId: originalResume.userId,
    sessionUserId: session.user.id,
  });

  // Create duplicate with modified metadata using JSON Resume format
  const duplicatedResume = await generatedResumeRepository.create({
    userId: session.user.id,
    jobDescription: originalResume.jobDescription,
    jobMetadata: originalResume.jobMetadata as Record<string, unknown>,
    resume: (originalResume.resume || (originalResume as { resumeContent?: unknown }).resumeContent) as Resume,
    templateId: originalResume.templateId || undefined,
    metadata: {
      ...(originalResume.metadata as Record<string, unknown>),
      duplicatedFrom: resumeId,
      duplicatedAt: new Date().toISOString(),
    },
  });

  return success({
    resume: {
      id: duplicatedResume.id,
      jobTitle: (originalResume.jobMetadata as { jobTitle?: string })?.jobTitle || null,
      companyName: (originalResume.jobMetadata as { companyName?: string })?.companyName || null,
      createdAt: duplicatedResume.createdAt,
    },
  });
});
