import { aiService, resumeService, profileService } from '@/lib/services';
import { createApiHandler } from '@/lib/api/handler';
import { generateCoverLetterSchema } from '@/lib/validations/api-schemas';
import { logger } from '@/lib/utils/logger';
import { failure } from '@/lib/types/service-result';
import type { Resume } from '@/lib/validations/jsonresume';

export const POST = createApiHandler(
  async (request, context, session, body) => {
    logger.info(`API: Cover letter generation request`, {
      userId: session.user.id,
      resumeId: body?.resumeId,
      profileId: body?.profileId,
    });

    let resumeContent: Resume | null = null;

    if (body?.resumeId) {
      const resumeResult = await resumeService.getResume(body.resumeId, session.user.id);
      if (!resumeResult.success) return resumeResult;
      resumeContent = resumeResult.data.content as unknown as Resume;
    } else if (body?.profileId) {
      const profileResult = await profileService.getProfileById(body.profileId, session.user.id);
      if (!profileResult.success) return profileResult;
      resumeContent = profileResult.data.resume as unknown as Resume;
    }

    if (!resumeContent) {
      return failure('No resume content found for generation');
    }

    return await aiService.generateCoverLetter(session.user.id, {
      jobDescription: body!.jobDescription,
      userResume: resumeContent,
      modelId: body?.modelId,
    });
  },
  {
    verifyUser: true,
    rateLimit: 'resumeGeneration',
    bodySchema: generateCoverLetterSchema,
  }
);
