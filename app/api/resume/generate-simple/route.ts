/**
 * Simple Resume Generation API (using Vercel AI SDK)
 * 
 * This is a demonstration endpoint showing how to use the simple workflow.
 * This is NOT meant to replace the main generation endpoint, but to show
 * how the Vercel AI SDK workflow can be integrated.
 * 
 * POST /api/resume/generate-simple
 * 
 * Body: {
 *   jobDescription: string,
 *   apiKey: string,  // User must provide their OpenAI API key
 * }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateResume } from '@/lib/ai';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { profileService } from '@/lib/services/profile.service';
import type { Resume } from '@/lib/validations/jsonresume';
import { createApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/utils/logger';

// Request validation schema
const generateResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  apiKey: z.string().min(20, 'Valid OpenAI API key required'),
});

/**
 * POST /api/resume/generate-simple
 * 
 * Generate a resume using the simple workflow (Vercel AI SDK)
 * This is a demonstration endpoint - production apps should store API keys securely
 */
export const POST = createApiHandler(async (request, context, session) => {
  // Parse and validate request
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

  const { jobDescription, apiKey } = validation.data;

  logger.info(`Simple API: Resume generation for user ${session.user.id}`);

  // Get user's profile (their current resume)
  const profileResult = await profileService.getProfile(session.user.id);

  if (!profileResult.success) {
    return NextResponse.json(
      { error: profileResult.error },
      { status: 404 }
    );
  }

  if (!profileResult.data) {
    return NextResponse.json(
      { error: 'Profile not found. Please create a profile first.' },
      { status: 404 }
    );
  }

  const profileData = profileResult.data;

  // Type guard to ensure we have a profile with resume field
  if (!profileData || typeof profileData !== 'object' || !('resume' in profileData)) {
    return NextResponse.json(
      { error: 'Profile structure is invalid. Please update your profile.' },
      { status: 400 }
    );
  }

  // Extract resume from profile
  const userResume = profileData.resume as Resume;

  // Create OpenAI provider instance
  const provider = new OpenAIProvider({
    apiKey,
    type: 'openai',
    name: 'OpenAI'
  });

  // Generate the resume using simple workflow
  const result = await generateResume({
    provider,
    modelId: 'gpt-4o', // Default to GPT-4o for simple workflow
    jobDescription,
    userResume,
  });

  if (!result.success) {
    logger.error('Simple API: Generation failed', { error: result.error });
    return NextResponse.json(
      {
        error: 'Resume generation failed',
        details: result.error
      },
      { status: 500 }
    );
  }

  logger.info('Simple API: Resume generated successfully');

  // Return the generated content
  // Note: This doesn't save to database - just returns the result
  return NextResponse.json({
    success: true,
    resume: result.resume,
    jobTitle: result.jobTitle,
    companyName: result.companyName,
    tokensUsed: result.tokensUsed,
  });
});
