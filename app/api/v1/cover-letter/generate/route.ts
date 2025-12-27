/**
 * Cover Letter Generation API
 * POST /api/cover-letter/generate
 * 
 * Generates a standalone cover letter without creating a full resume
 */

import { resumeService } from '@/lib/services/resume.service';
import { notificationService } from '@/lib/services/notification.service';
import { createApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/utils/logger';
import { generateStandaloneCoverLetterSchema } from '@/lib/validations/api-schemas';
import { success } from '@/lib/types/service-result';

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
      return result;
    }

    // Create notification for the user
    await notificationService.notifyCoverLetterGenerated(
      session.user.id,
      result.data.coverLetterId,
      result.data.metadata?.jobTitle as string | undefined,
      result.data.metadata?.companyName as string | undefined
    );

    logger.info('Cover letter generated successfully', { 
      coverLetterId: result.data.coverLetterId,
      userId: session.user.id,
    });

    return success({
      coverLetter: result.data.coverLetter,
      coverLetterId: result.data.coverLetterId,
      metadata: result.data.metadata,
    });
  },
  { bodySchema: generateStandaloneCoverLetterSchema, verifyUser: true }
);
