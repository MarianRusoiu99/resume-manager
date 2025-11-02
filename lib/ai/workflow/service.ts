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
  analyzeJobWorkflowNode,
  profileMatchingWorkflowNode,
  contentOptimizationWorkflowNode,
  formatValidationWorkflowNode,
  outputGeneratorWorkflowNode
} from './agents';

export interface GenerateResumeInput {
  userId: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  userResume: Resume;
}

export interface GenerateResumeResult {
  success: boolean;
  resume?: Resume;
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
          companyName: input.companyName
        }
      );

      // Execute workflow steps manually (since we need to pass userId)
      // Step 1: Analyze job
      console.log('\n🔍 Step 1: Analyzing job description...');
      let state = await analyzeJobWorkflowNode(initialState, input.userId);
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state: state as ResumeGenerationState
        };
      }

      // Step 2: Match profile
      console.log('\n🎯 Step 2: Matching profile to job...');
      state = await profileMatchingWorkflowNode(state as ResumeGenerationState, input.userId);
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state: state as ResumeGenerationState
        };
      }

      // Step 3: Optimize content
      console.log('\n✨ Step 3: Optimizing content...');
      state = await contentOptimizationWorkflowNode(state as ResumeGenerationState, input.userId);
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state: state as ResumeGenerationState
        };
      }

      // Step 4: Validate format
      console.log('\n📐 Step 4: Validating format...');
      state = await formatValidationWorkflowNode(state as ResumeGenerationState, input.userId);
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state: state as ResumeGenerationState
        };
      }

      // Step 5: Generate output
      console.log('\n📄 Step 5: Generating final output...');
      state = await outputGeneratorWorkflowNode(state as ResumeGenerationState);
      if (state.errors && state.errors.length > 0) {
        return {
          success: false,
          errors: state.errors,
          state: state as ResumeGenerationState
        };
      }

      const finalState = state as ResumeGenerationState;

      if (!finalState.generatedResume) {
        return {
          success: false,
          errors: ['Failed to generate resume: No output produced'],
          state: finalState
        };
      }

      console.log('\n✅ Resume generation completed successfully');
      console.log(`   Tokens used: ${finalState.tokensUsed || 0}`);

      return {
        success: true,
        resume: finalState.generatedResume,
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
   * Validate that a user can generate resumes (has API key)
   * 
   * @param userId - User ID to check
   * @returns True if user has active OpenAI key
   */
  async canGenerateResume(userId: string): Promise<boolean> {
    const { hasActiveProvider } = await import('../provider-utils');
    return await hasActiveProvider(userId, 'openai');
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
