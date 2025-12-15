/**
 * Resume Generation API Routes
 * 
 * POST /api/resume/generate - Generate a new resume
 *   - Uses streaming for progress updates via generate-stream endpoint
 * 
 * GET /api/resume/generate - Get all resumes for the user
 *   - Used for initial data fetching in components
 */

import { resumeService } from '@/lib/services/resume.service';
import { z } from 'zod';
import { resumesCache } from '@/lib/cache/resumes-cache';
import { createApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/utils/logger';

const generateResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  profileId: z.string().optional(),
  templateId: z.string().optional(),
  modelId: z.string().optional(),
});

export const POST = createApiHandler(
  async (request, context, session, body) => {
    logger.info(`API: Resume generation request`, {
      userId: session.user.id,
      model: body?.modelId || 'default',
    });

    const result = await resumeService.generateResume({
      userId: session.user.id,
      jobDescription: body!.jobDescription,
      profileId: body?.profileId,
      templateId: body?.templateId,
      modelId: body?.modelId,
    });

    if (!result.success) {
      logger.error('API: Resume generation failed', { error: result.error });
    }

    return result;
  },
  {
    verifyUser: true,
    rateLimit: 'resumeGeneration',
    bodySchema: generateResumeSchema,
  }
);

export const GET = createApiHandler(
  async (request, context, session) => {
    const cacheKey = `resumes:${session.user.id}`;

    let resumes = resumesCache.get(cacheKey);

    if (!resumes) {
      const result = await resumeService.getUserResumes(session.user.id);
      if (!result.success) {
        return result;
      }

      resumes = result.data;
      resumesCache.set(cacheKey, resumes);
    }

    return { success: true, data: resumes };
  },
  {
    verifyUser: false,
    rateLimit: 'general',
  }
);
