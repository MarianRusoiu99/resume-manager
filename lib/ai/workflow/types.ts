/**
 * Workflow Types
 * 
 * Type definitions for the configurable AI workflow engine
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';

/**
 * Progress callback for real-time updates
 */
export type ProgressCallback = (
  stepId: string,
  message: string,
  progress: number
) => void;

/**
 * Context passed through the workflow
 */
export interface WorkflowContext {
  /** AI provider instance */
  provider: AIProvider;
  /** Model ID to use */
  modelId: string;
  /** Raw job description text */
  jobDescription: string;
  /** User's profile resume - the source of truth */
  userResume: Resume;
  /** Optional user ID */
  userId?: string;
  /** Progress callback for streaming updates */
  onProgress?: ProgressCallback;
  /** Results accumulated from previous steps */
  results: WorkflowResults;
}

/**
 * Results accumulated during workflow execution
 */
export interface WorkflowResults {
  /** Extracted job title */
  jobTitle?: string;
  /** Extracted company name */
  companyName?: string;
  /** Optimized resume */
  resume?: Resume;
  /** Generated cover letter */
  coverLetter?: string;
  /** Any additional data from steps */
  [key: string]: unknown;
}

/**
 * A single workflow step
 */
export interface WorkflowStep {
  /** Unique identifier for the step */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description shown during progress */
  description: string;
  /** Progress percentage when this step starts */
  progressStart: number;
  /** Progress percentage when this step completes */
  progressEnd: number;
  /** Execute the step */
  execute: (context: WorkflowContext) => Promise<Partial<WorkflowResults>>;
  /** Optional: Skip this step based on context */
  shouldSkip?: (context: WorkflowContext) => boolean;
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  /** Workflow name */
  name: string;
  /** Workflow description */
  description: string;
  /** Ordered list of steps */
  steps: WorkflowStep[];
}

/**
 * Result of workflow execution
 */
export interface WorkflowResult {
  success: boolean;
  results: WorkflowResults;
  error?: string;
  /** Steps that were executed */
  executedSteps: string[];
  /** Steps that were skipped */
  skippedSteps: string[];
  /** Total execution time in ms */
  executionTime: number;
}
