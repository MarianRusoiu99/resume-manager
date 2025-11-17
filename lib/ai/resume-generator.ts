/**
 * Simple Resume Generator using Vercel AI SDK
 * 
 * A streamlined workflow for resume generation with structured outputs
 * Now supports multiple AI providers through the provider abstraction layer
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';
import {
  analyzeJob,
  type JobAnalysisResult,
  optimizeResume,
  type OptimizedResume,
  generateCoverLetter,
  type CoverLetterResult,
} from '@/lib/ai/agents';

// Re-export types for convenience
export type { JobAnalysisResult, OptimizedResume, CoverLetterResult };

// ============================================================================
// Types
// ============================================================================

export interface GenerateResumeInput {
  provider: AIProvider;
  modelId: string;
  jobDescription: string;
  userResume: Resume;
  includeCoverLetter?: boolean;
  personalInstructions?: string;
  userId?: string;
}

export interface GenerateResumeResult {
  success: boolean;
  resume?: Resume;
  coverLetter?: string;
  jobAnalysis?: JobAnalysisResult; // Include job analysis with extracted job title
  error?: string;
  tokensUsed?: number;
}

// ============================================================================
// Main Workflow
// ============================================================================

/**
 * Generate an optimized resume (and optionally a cover letter)
 * 
 * This is the main entry point that orchestrates the entire workflow:
 * 1. Analyze job description
 * 2. Generate optimized resume
 * 3. Generate cover letter (if requested)
 */
export async function generateResume(
  input: GenerateResumeInput
): Promise<GenerateResumeResult> {
  try {
    console.log('🚀 Starting resume generation workflow');

    // Step 1: Analyze the job
    console.log('🔍 Step 1: Analyzing job description...');
    const jobAnalysis = await analyzeJob({
      provider: input.provider,
      modelId: input.modelId,
      jobDescription: input.jobDescription,
    });
    console.log(`   ✓ Found job: ${jobAnalysis.jobTitle} at ${jobAnalysis.companyName}`);

    // Step 2: Generate optimized resume
    console.log('✨ Step 2: Generating optimized resume...');
    const optimizedResume = await optimizeResume({
      provider: input.provider,
      modelId: input.modelId,
      jobAnalysis,
      userResume: input.userResume,
      personalInstructions: input.personalInstructions,
    });
    console.log('   ✓ Resume optimized');

    // Step 3: Generate cover letter (if requested)
    let coverLetter: string | undefined;
    if (input.includeCoverLetter) {
      console.log('📝 Step 3: Generating cover letter...');
      const coverLetterResult = await generateCoverLetter({
        provider: input.provider,
        modelId: input.modelId,
        jobAnalysis,
        userResume: input.userResume,
        optimizedResume,
      });
      coverLetter = coverLetterResult.content;
      console.log('   ✓ Cover letter generated');
    }

    console.log('✅ Resume generation complete!');

    return {
      success: true,
      resume: optimizedResume as Resume,
      coverLetter,
      jobAnalysis, // Include job analysis for extracting title and company
    };
  } catch (error) {
    console.error('❌ Resume generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
