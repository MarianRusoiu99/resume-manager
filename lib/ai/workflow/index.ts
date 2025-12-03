/**
 * AI Workflow Module
 * 
 * Configurable workflow engine for AI-powered resume and cover letter generation
 */

// Types
export type {
  WorkflowConfig,
  WorkflowContext,
  WorkflowResult,
  WorkflowResults,
  WorkflowStep,
  ProgressCallback,
} from './types';

// Engine
export {
  executeWorkflow,
  createConsoleProgress,
  type ExecuteWorkflowInput,
} from './engine';

// Steps
export {
  optimizeResumeStep,
  generateCoverLetterStep,
  validateResumeStep,
  extractJobMetadataStep,
  availableSteps,
  type StepId,
} from './steps';

// Predefined Workflows
export {
  resumeGenerationWorkflow,
  coverLetterWorkflow,
  fullApplicationWorkflow,
  getWorkflow,
  createCustomWorkflow,
} from './configs';
