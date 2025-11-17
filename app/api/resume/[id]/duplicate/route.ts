/**
 * API Route: POST /api/resume/:id/duplicate
 * Creates a duplicate copy of an existing resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import type { Resume } from '@/lib/validations/jsonresume';

export async function POST(
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

    // Verify resume exists and belongs to user
    const originalResume = await generatedResumeRepository.findById(resumeId);

    if (!originalResume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (originalResume.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create duplicate with modified metadata using JSON Resume format
    const duplicatedResume = await generatedResumeRepository.create({
      userId: session.user.id,
      jobDescription: originalResume.jobDescription,
      jobMetadata: originalResume.jobMetadata as Record<string, unknown>,
      resume: originalResume.resume as Resume,
      templateId: originalResume.templateId || undefined,
      coverLetter: originalResume.coverLetter || undefined,
      metadata: {
        ...(originalResume.metadata as Record<string, unknown>),
        duplicatedFrom: resumeId,
        duplicatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      resume: {
        id: duplicatedResume.id,
        jobTitle:
          (originalResume.jobMetadata as { jobTitle?: string })?.jobTitle ||
          null,
        companyName:
          (originalResume.jobMetadata as { companyName?: string })
            ?.companyName || null,
        createdAt: duplicatedResume.createdAt,
      },
    });
  } catch (error) {
    console.error('Error duplicating resume:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate resume' },
      { status: 500 }
    );
  }
}
