/**
 * Resume Generation API Routes
 * 
 * POST /api/resume/generate - Generate a new resume
 *   - Uses streaming for progress updates via generate-stream endpoint
 * 
 * GET /api/resume/generate - Get all resumes for the user
 *   - Used for initial data fetching in components
 */

import { NextResponse, NextRequest } from 'next/server';
import { resumeService } from '@/lib/services/resume.service';
import { z } from 'zod';
import { checkRateLimit, RateLimitConfigs } from '@/lib/middleware/rate-limit-helpers';
import { resumesCache } from '@/lib/cache/resumes-cache';
import { createApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/utils/logger';

// Request validation schema
const generateResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  profileId: z.string().optional(), // User profile to use as base
  templateId: z.string().optional(),
  modelId: z.string().optional(), // AI model to use
  generateCoverLetter: z.boolean().optional(),
  personalInstructions: z.string().optional(),
});

export const POST = createApiHandler(async (request, context, session) => {
  // Apply rate limiting (5 requests per minute)
  const rateLimitCheck = await checkRateLimit(request as NextRequest, RateLimitConfigs.resumeGeneration);
  if (rateLimitCheck.limited) {
    return rateLimitCheck.response as NextResponse;
  }

  // Parse and validate request body
  const body = await request.json();
  const validation = generateResumeSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: validation.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      },
      { status: 400 }
    );
  }

  const { jobDescription, profileId, templateId, modelId, generateCoverLetter, personalInstructions } = validation.data;

  logger.info(`API: Resume generation request`, {
    userId: session.user.id,
    model: modelId || 'default',
    coverLetter: generateCoverLetter
  });

  // Generate resume (job title and company name will be extracted from description)
  // Cache invalidation is handled in the service
  const result = await resumeService.generateResume({
    userId: session.user.id,
    jobDescription,
    profileId,
    templateId,
    modelId,
    generateCoverLetter,
    personalInstructions
  });

  if (!result.success) {
    logger.error('API: Resume generation failed', { error: result.error });
    return NextResponse.json(
      {
        error: 'Resume generation failed',
        details: result.error
      },
      { status: 500 }
    );
  }

  logger.info(`API: Resume generated successfully`, { resumeId: result.data.resumeId });
  if (result.data.coverLetterId) {
    logger.info(`API: Cover letter saved`, { coverLetterId: result.data.coverLetterId });
  }

  const response = NextResponse.json({
    success: true,
    resumeId: result.data.resumeId,
    resume: result.data.resume,
    coverLetter: result.data.coverLetter,
    coverLetterId: result.data.coverLetterId
  }, { status: 201 });

  return rateLimitCheck.addHeaders(response) as NextResponse;
});

export const GET = createApiHandler(async (request, context, session) => {
  const cacheKey = `resumes:${session.user.id}`;

  // Try to get from cache first
  let resumes = resumesCache.get(cacheKey);

  if (!resumes) {
    // Cache miss - fetch from database
    const result = await resumeService.getUserResumes(session.user.id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    resumes = result.data;
    // Store in cache
    resumesCache.set(cacheKey, resumes);
  }

  return NextResponse.json(resumes);
});
