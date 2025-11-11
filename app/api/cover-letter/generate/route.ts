/**
 * Cover Letter Generation API
 * POST /api/cover-letter/generate
 * 
 * Generates a standalone cover letter without creating a full resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';
import { profileService } from '@/lib/services/profile.service';
import { coverLetterService } from '@/lib/services/cover-letter.service';
import { generateResume } from '@/lib/ai';
import type { Resume } from '@/lib/validations/jsonresume';

// Validation schema
const generateCoverLetterSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  personalInstructions: z.string().optional(),
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

    const { jobDescription, personalInstructions } = validationResult.data;

    // Get OpenAI API key from environment (BYOK model - users should configure their own keys)
    const apiKey = process.env.OPENAI_API_KEY || '';
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'No API key configured. Please add OPENAI_API_KEY to your environment variables.' 
        },
        { status: 500 }
      );
    }

    // Get user's profile for personalization
    const profileResult = await profileService.getProfile(session.user.id);
    if (!profileResult.data) {
      return NextResponse.json(
        { 
          error: 'Profile not found. Please complete your profile before generating a cover letter.' 
        },
        { status: 400 }
      );
    }

    const profile = profileResult.data;

    // Type guard for profile data with JSON Resume
    if (!profile || typeof profile !== 'object' || !('resume' in profile)) {
      return NextResponse.json(
        { error: 'Invalid profile data' },
        { status: 400 }
      );
    }

    // Validate and extract JSON Resume
    const userResume = profile.resume as Resume;
    
    if (!userResume) {
      return NextResponse.json(
        { error: 'Profile does not contain resume data' },
        { status: 400 }
      );
    }

    console.log('[Cover Letter API] Generating cover letter using Vercel AI SDK...');

    // Generate cover letter using the new workflow
    const result = await generateResume({
      apiKey,
      jobDescription,
      userResume,
      includeCoverLetter: true,
      personalInstructions,
    });

    if (!result.success || !result.coverLetter) {
      console.error('[Cover Letter API] Generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate cover letter' },
        { status: 500 }
      );
    }

    console.log('[Cover Letter API] Cover letter generated successfully');

    // Extract job details from the generated analysis (we could parse jobDescription for this)
    // For now, let's extract from job description
    const jobTitleMatch = jobDescription.match(/(?:position|role|title):\s*([^\n]+)/i);
    const companyMatch = jobDescription.match(/(?:company|organization):\s*([^\n]+)/i);
    
    const jobTitle = jobTitleMatch?.[1]?.trim() || 'Position';
    const companyName = companyMatch?.[1]?.trim() || 'Company';

    // Save cover letter to database
    const coverLetterData = {
      userId: session.user.id,
      content: result.coverLetter,
      jobDescription,
      jobTitle,
      companyName,
      metadata: {
        model: 'gpt-4o',
        tokens: result.tokensUsed || 0,
        generationTime: 0,
        personalInstructions,
      },
    };

    const saveResult = await coverLetterService.createCoverLetter(coverLetterData);
    
    if (!saveResult.success) {
      console.error('[Cover Letter API] Failed to save cover letter:', saveResult.error);
      // Continue anyway - return the generated content even if save fails
    }

    console.log('[Cover Letter API] Cover letter saved to database');

    return NextResponse.json({
      coverLetter: result.coverLetter,
      coverLetterId: saveResult.data?.id,
      tokensUsed: result.tokensUsed || 0,
      metadata: {
        jobTitle,
        companyName,
        generatedAt: new Date().toISOString(),
      },
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
