/**
 * Resume Workflow Service
 * 
 * Provides high-level API for executing the resume generation workflow
 * Handles user context, API key resolution, and error management
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { ResumeGenerationState } from './types';
import { createInitialState } from './utils';
import { compileResumeWorkflow } from './graph';
import {
  jobAnalysisNode,
  profileMatchingNode,
  contentOptimizationNode,
  formatValidationNode,
  outputGenerationNode,
  coverLetterGenerationNode
} from './nodes';

export interface GenerateResumeInput {
  userId: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  userResume: Resume;
  includeCoverLetter?: boolean;
  personalInstructions?: string;
}

export interface GenerateResumeResult {
  success: boolean;
  resume?: Resume;
  coverLetter?: string;
  errors?: string[];
  tokensUsed?: number;
  state?: ResumeGenerationState;
}

/**
 * Resume Workflow Service
 * Encapsulates workflow execution logic
 */
export class ResumeWorkflowService {
  /**
   * Generate a resume using the complete AI workflow
   * 
   * @param input - User ID, job description, and profile
   * @returns Generated resume or errors
   */
  async generateResume(input: GenerateResumeInput): Promise<GenerateResumeResult> {
    try {
      console.log('\n🚀 Starting resume generation workflow');
      console.log(`   User ID: ${input.userId}`);
      console.log(`   Job: ${input.jobTitle || 'Not specified'} at ${input.companyName || 'Not specified'}`);

      // Create initial state
      const initialState = createInitialState(
        input.jobDescription,
        input.userResume,
        {
          jobTitle: input.jobTitle,
          companyName: input.companyName,
          personalInstructions: input.personalInstructions,
          includeCoverLetter: input.includeCoverLetter
        }
      );

      // Execute workflow steps manually (since we need to pass userId)
      // IMPORTANT: Nodes return Partial<State>, so we must MERGE updates
      // Step 1: Analyze job
      console.log('\n🔍 Step 1: Analyzing job description...');
      let state: ResumeGenerationState = { ...initialState, ...(await jobAnalysisNode(initialState, input.userId)) };
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state
        };
      }

      // Step 2: Match profile
      console.log('\n🎯 Step 2: Matching profile to job...');
      state = { ...state, ...(await profileMatchingNode(state, input.userId)) };
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state
        };
      }

      // Step 3: Optimize content
      console.log('\n✨ Step 3: Optimizing content...');
      state = { ...state, ...(await contentOptimizationNode(state, input.userId)) };
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state
        };
      }

            // Step 4: Validate format
      console.log('\n✅ Step 4: Validating format...');
      state = { ...state, ...(await formatValidationNode(state, input.userId)) };
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state
        };
      }

      // Step 5: Generate output
      console.log('\n📄 Step 5: Generating final output...');
      state = { ...state, ...(await outputGenerationNode(state)) };
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state
        };
      }

      if (!state.generatedResume) {
        return {
          success: false,
          errors: ['Failed to generate resume: No output produced'],
          state
        };
      }

      // Step 6 (Optional): Generate cover letter
      let coverLetterContent: string | undefined;
      if (input.includeCoverLetter) {
        console.log('\n✉️ Step 6: Generating cover letter...');
        
        // Store current error count to detect new errors
        const previousErrorCount = state.errors?.length || 0;
        
        // Merge personalInstructions into state for cover letter generation
        const coverLetterUpdate = await coverLetterGenerationNode(
          { ...state, personalInstructions: input.personalInstructions },
          input.userId
        );
        
        // Merge cover letter update into state
        state = { ...state, ...coverLetterUpdate };
        
        // Check if NEW errors were added during cover letter generation
        const newErrorCount = state.errors?.length || 0;
        const hasNewErrors = newErrorCount > previousErrorCount;
        
        if (hasNewErrors) {
          console.warn('⚠️ Cover letter generation failed, continuing without it');
          const newErrors = state.errors?.slice(previousErrorCount) || [];
          console.warn('   New errors:', newErrors);
        } else if (state.coverLetter) {
          coverLetterContent = state.coverLetter.content;
        }
      }

      const finalState = state as ResumeGenerationState;

      console.log('\n✅ Resume generation completed successfully');
      console.log(`   Tokens used: ${finalState.tokensUsed || 0}`);
      if (coverLetterContent) {
        console.log(`   Cover letter: Generated (${coverLetterContent.length} characters)`);
      }

      return {
        success: true,
        resume: finalState.generatedResume,
        coverLetter: coverLetterContent,
        tokensUsed: finalState.tokensUsed,
        state: finalState
      };
    } catch (error) {
      console.error('\n❌ Workflow execution failed:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Validate that a user can generate resumes (todo check tokens or number of generations)
   * 
   * @param userId - User ID to check
   * @returns True if user has active OpenAI key
   */
  async canGenerateResume(): Promise<boolean> {
    
    return await true;
  }

  /**
   * Get the compiled workflow graph (for advanced usage)
   * Note: This returns the graph without user context
   * Use generateResume() for normal workflow execution
   */
  getCompiledWorkflow() {
    return compileResumeWorkflow();
  }
}

// Export singleton instance
export const resumeWorkflowService = new ResumeWorkflowService();

/**
 * Convenience function for generating a resume
 * 
 * @param input - Generation parameters
 * @returns Generated resume result
 */
export async function generateResume(input: GenerateResumeInput): Promise<GenerateResumeResult> {
  return resumeWorkflowService.generateResume(input);
}
