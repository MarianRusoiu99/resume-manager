/**
 * Cover Letter Generation API
 * POST /api/cover-letter/generate
 * 
 * Generates a standalone cover letter without creating a full resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';
import { resumeService } from '@/lib/services/resume.service';

// Validation schema
const generateCoverLetterSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  personalInstructions: z.string().optional(),
  modelId: z.string().optional(),
  profileId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = generateCoverLetterSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { jobDescription, personalInstructions, modelId, profileId } = validationResult.data;

    console.log('[Cover Letter API] Generating standalone cover letter...');

    // Generate cover letter using the service method
    const result = await resumeService.generateStandaloneCoverLetter({
      userId: session.user.id,
      jobDescription,
      personalInstructions,
      modelId,
      profileId,
    });

    if (!result.success || !result.coverLetter) {
      console.error('[Cover Letter API] Generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate cover letter' },
        { status: 500 }
      );
    }

    console.log('[Cover Letter API] Cover letter generated and saved successfully');

    return NextResponse.json({
      coverLetter: result.coverLetter,
      coverLetterId: result.coverLetterId,
      metadata: result.metadata,
    });

  } catch (error) {
    console.error('[Cover Letter API] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate cover letter' 
      },
      { status: 500 }
    );
  }
}
