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
import { analyzeJobAgent } from '@/lib/ai/agents/job-analysis.agent';
import { ChatOpenAI } from '@langchain/openai';
import type { ResumeGenerationState } from '@/lib/ai/workflow/types';
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

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY || '';
   
    
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

    // Create initial state for job analysis using JSON Resume (job title and company extracted from description)
    const initialState: ResumeGenerationState = {
      jobDescription,
      userResume,
      messages: [],
      currentStep: 'analyze_job',
      errors: [],
      tokensUsed: 0,
    };

    console.log('[Cover Letter API] Starting job analysis (extracting job title and company)...');
    
    // Step 1: Analyze the job description
    const jobAnalysisResult = await analyzeJobAgent(initialState, apiKey);
    
    if (jobAnalysisResult.errors && jobAnalysisResult.errors.length > 0) {
      console.error('[Cover Letter API] Job analysis failed:', jobAnalysisResult.errors);
      return NextResponse.json(
        { error: jobAnalysisResult.errors.join(', ') },
        { status: 500 }
      );
    }

    if (!jobAnalysisResult.jobAnalysis) {
      return NextResponse.json(
        { error: 'Job analysis failed - no results returned' },
        { status: 500 }
      );
    }

    console.log('[Cover Letter API] Job analysis complete');
    
    // Step 2: Create simple matching results (for standalone cover letter)
    // Extract skills from JSON Resume format
    const technicalSkills = userResume.skills
      ?.filter(skill => skill.keywords && skill.keywords.length > 0)
      .flatMap(skill => skill.keywords || [])
      .slice(0, 5) || [];
    
    const topExperiences = userResume.work
      ?.slice(0, 2)
      .map(w => w.position || '')
      .filter(Boolean) || [];
    
    const matchingResults = {
      overallScore: 80,
      matchingSkills: technicalSkills,
      missingSkills: [],
      topExperiences,
    };

    // Step 3: Generate cover letter using AI
    console.log('[Cover Letter API] Generating cover letter...');
    
    const model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
    });

    // Import and use the cover letter agent dynamically
    const { coverLetterAgent } = await import('@/lib/ai/agents/cover-letter.agent');
    
    const coverLetterInput = {
      jobDescription,
      jobTitle: jobAnalysisResult.jobAnalysis.jobTitle,
      companyName: jobAnalysisResult.jobAnalysis.companyName,
      jobAnalysis: {
        summary: jobAnalysisResult.jobAnalysis.jobSummary,
        requiredSkills: jobAnalysisResult.jobAnalysis.requirements.required,
        preferredSkills: jobAnalysisResult.jobAnalysis.requirements.preferred,
        keyResponsibilities: jobAnalysisResult.jobAnalysis.keyResponsibilities,
      },
      userResume, // Pass the entire JSON Resume
      matchingResults,
      personalInstructions, // Pass user's custom instructions
    };

    const result = await coverLetterAgent(coverLetterInput, model);

    console.log('[Cover Letter API] Cover letter generated successfully');
    console.log(`[Cover Letter API] Word count: ${result.wordCount}`);

    const totalTokens = (jobAnalysisResult.tokensUsed || 0) + (result.wordCount * 1.3);

    // Save cover letter to database
    const coverLetterData = {
      userId: session.user.id,
      content: result.coverLetter,
      jobDescription,
      jobTitle: jobAnalysisResult.jobAnalysis.jobTitle,
      companyName: jobAnalysisResult.jobAnalysis.companyName,
      metadata: {
        model: 'gpt-4-turbo-preview',
        tokens: Math.ceil(totalTokens),
        generationTime: 0, // Could track this if needed
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
      tokensUsed: Math.ceil(totalTokens),
      metadata: {
        jobTitle: jobAnalysisResult.jobAnalysis.jobTitle,
        companyName: jobAnalysisResult.jobAnalysis.companyName,
        wordCount: result.wordCount,
        tone: result.tone,
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
