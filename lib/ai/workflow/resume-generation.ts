/**
 * Resume Generator using Configurable Workflow Engine
 * 
 * A streamlined workflow for resume generation using the workflow engine.
 * Supports configurable steps and progress tracking.
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';
import {
  executeWorkflow,
  resumeGenerationWorkflow,
  type WorkflowConfig,
  type ProgressCallback,
} from './index';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface GenerateResumeInput {
  provider: AIProvider;
  modelKey: string;
  jobDescription: string;
  userResume: Resume;
  userId?: string;
  /** Optional progress callback for streaming updates */
  onProgress?: ProgressCallback;
  /** Optional custom workflow configuration */
  workflow?: WorkflowConfig;
}

export interface GenerateResumeResult {
  success: boolean;
  resume?: Resume;
  /** Extracted job title from the job description */
  jobTitle?: string;
  /** Extracted company name from the job description */
  companyName?: string;
  error?: string;
  tokensUsed?: number;
  /** Steps that were executed */
  executedSteps?: string[];
  /** Execution time in ms */
  executionTime?: number;
}

// ============================================================================
// Main Workflow
// ============================================================================

/**
 * Generate an optimized resume using the workflow engine
 * 
 * This is the main entry point that orchestrates the resume generation:
 * 1. Takes the user's profile (source of truth) and job description
 * 2. Executes the configured workflow steps
 * 3. Returns the optimized resume with extracted job metadata
 * 
 * IMPORTANT: The optimization NEVER fabricates information. It only:
 * - Rephrases existing content to better match job requirements
 * - Removes or de-emphasizes irrelevant information
 * - Highlights skills and experience that match the job
 * - Uses appropriate keywords from the job description where truthful
 */
export async function generateResume(
  input: GenerateResumeInput
): Promise<GenerateResumeResult> {
  const workflow = input.workflow || resumeGenerationWorkflow;

  logger.info('Starting resume generation', { workflow: workflow.name });
  logger.info('Profile is the source of truth - no fabrication allowed', { workflow: workflow.name });

  const result = await executeWorkflow({
    config: workflow,
    provider: input.provider,
    modelKey: input.modelKey,
    jobDescription: input.jobDescription,
    userResume: input.userResume,
    userId: input.userId,
    onProgress: input.onProgress,
  });

  if (!result.success) {
    logger.error('Workflow failed', undefined, { error: result.error });
    return {
      success: false,
      error: result.error,
      executedSteps: result.executedSteps,
      executionTime: result.executionTime,
    };
  }

  logger.info('Resume generation complete', { executionTime: result.executionTime });

  return {
    success: true,
    resume: result.results.resume as Resume,
    jobTitle: result.results.jobTitle as string,
    companyName: result.results.companyName as string,
    executedSteps: result.executedSteps,
    executionTime: result.executionTime,
  };
}
