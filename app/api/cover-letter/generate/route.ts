/**
 * Cover Letter Generation API
 * POST /api/cover-letter/generate
 * 
 * Generates a standalone cover letter without creating a full resume
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resumeService } from '@/lib/services/resume.service';
import { createApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/utils/logger';

// Validation schema
const generateCoverLetterSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  personalInstructions: z.string().optional(),
  modelId: z.string().optional(),
  profileId: z.string().optional(),
});

export const POST = createApiHandler(
  async (request, context, session, body) => {
    logger.info('Generating standalone cover letter', { userId: session.user.id });

    // Generate cover letter using the service method
    const result = await resumeService.generateStandaloneCoverLetter({
      userId: session.user.id,
      jobDescription: body!.jobDescription,
      personalInstructions: body!.personalInstructions,
      modelId: body!.modelId,
      profileId: body!.profileId,
    });

    if (!result.success) {
      logger.error('Cover letter generation failed', new Error(result.error));
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    logger.info('Cover letter generated successfully', { 
      coverLetterId: result.data.coverLetterId,
      userId: session.user.id,
    });

    return NextResponse.json({
      coverLetter: result.data.coverLetter,
      coverLetterId: result.data.coverLetterId,
      metadata: result.data.metadata,
    });
  },
  { bodySchema: generateCoverLetterSchema }
);
