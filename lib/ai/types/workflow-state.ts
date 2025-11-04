/**
 * Workflow State Types
 * 
 * Consolidated and improved state management types
 */

import { BaseMessage } from '@langchain/core/messages';
import type { Resume } from '@/lib/validations/jsonresume';
import type {
  JobAnalysisResult,
  ProfileMatchResult,
  FormatValidationResult,
  CoverLetterResult
} from './agent-results';

/**
 * Core workflow state interface
 */
export interface WorkflowState {
  // Input data
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  userResume: Resume;
  personalInstructions?: string;
  includeCoverLetter?: boolean;

  // Agent results
  jobAnalysis?: JobAnalysisResult;
  profileMatch?: ProfileMatchResult;
  optimizedResume?: Resume;
  formatValidation?: FormatValidationResult;
  generatedResume?: Resume;
  coverLetter?: CoverLetterResult;

  // Workflow metadata
  messages: BaseMessage[];
  currentStep?: string;
  errors: string[];
  tokensUsed: number;
}

/**
 * Workflow configuration options
 */
export interface WorkflowOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  includeCoverLetter?: boolean;
  skipValidation?: boolean;
  customInstructions?: string;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  success: boolean;
  resume?: Resume;
  coverLetter?: CoverLetterResult;
  errors?: string[];
  tokensUsed: number;
  duration: number;
  steps: WorkflowStepResult[];
}

/**
 * Individual step result
 */
export interface WorkflowStepResult {
  step: string;
  success: boolean;
  duration: number;
  tokensUsed: number;
  error?: string;
}

/**
 * Type guards for workflow state
 */
export function hasJobAnalysis(state: WorkflowState): state is WorkflowState & { jobAnalysis: JobAnalysisResult } {
  return state.jobAnalysis !== undefined;
}

export function hasProfileMatch(state: WorkflowState): state is WorkflowState & { profileMatch: ProfileMatchResult } {
  return state.profileMatch !== undefined;
}

export function hasOptimizedResume(state: WorkflowState): state is WorkflowState & { optimizedResume: Resume } {
  return state.optimizedResume !== undefined;
}

export function hasFormatValidation(state: WorkflowState): state is WorkflowState & { formatValidation: FormatValidationResult } {
  return state.formatValidation !== undefined;
}

export function hasGeneratedResume(state: WorkflowState): state is WorkflowState & { generatedResume: Resume } {
  return state.generatedResume !== undefined;
}

export function hasCoverLetter(state: WorkflowState): state is WorkflowState & { coverLetter: CoverLetterResult } {
  return state.coverLetter !== undefined;
}

/**
 * Workflow state validation
 */
export function validateWorkflowInput(state: Partial<WorkflowState>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!state.jobDescription || state.jobDescription.trim().length === 0) {
    errors.push('Job description is required');
  }

  if (!state.userResume) {
    errors.push('User resume is required');
  }

  if (state.jobDescription && state.jobDescription.length < 50) {
    errors.push('Job description should be at least 50 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create initial workflow state
 */
export function createWorkflowState(input: {
  jobDescription: string;
  userResume: Resume;
  jobTitle?: string;
  companyName?: string;
  personalInstructions?: string;
  includeCoverLetter?: boolean;
}): WorkflowState {
  return {
    ...input,
    messages: [],
    errors: [],
    tokensUsed: 0,
    currentStep: 'init'
  };
}
