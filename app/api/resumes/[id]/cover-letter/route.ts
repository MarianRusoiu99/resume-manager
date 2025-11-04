/**
 * Update Cover Letter API
 * PUT /api/resumes/[id]/cover-letter
 * 
 * Updates the cover letter content for an existing resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Validation schema
const updateCoverLetterSchema = z.object({
  coverLetter: z.string().min(1, 'Cover letter cannot be empty'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: resumeId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateCoverLetterSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { coverLetter } = validationResult.data;

    // Check if resume exists and belongs to user
    const existingResume = await prisma.generatedResume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!existingResume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    if (existingResume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this resume' },
        { status: 403 }
      );
    }

    // Update the cover letter
    const updatedResume = await prisma.generatedResume.update({
      where: { id: resumeId },
      data: { 
        coverLetter,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        coverLetter: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      resume: updatedResume,
    });

  } catch (error) {
    console.error('[Update Cover Letter API] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update cover letter' 
      },
      { status: 500 }
    );
  }
}
