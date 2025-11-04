/**
 * AI Types - Main Export
 * 
 * Centralized type definitions with validation
 */

// Agent result types
export * from './agent-results';
export type {
  JobAnalysisResult,
  JobAnalysisRawResponse,
  ProfileMatchResult,
  FormatValidationResult,
  FormatValidationIssue,
  CoverLetterResult,
  AgentResult
} from './agent-results';

export {
  JobAnalysisResultSchema,
  ProfileMatchResultSchema,
  FormatValidationResultSchema,
  CoverLetterResultSchema,
  isSuccessfulResult,
  isFailedResult,
  validateAgentResult
} from './agent-results';

// Workflow state types
export * from './workflow-state';
export type {
  WorkflowState,
  WorkflowOptions,
  WorkflowResult,
  WorkflowStepResult
} from './workflow-state';

export {
  hasJobAnalysis,
  hasProfileMatch,
  hasOptimizedResume,
  hasFormatValidation,
  hasGeneratedResume,
  hasCoverLetter,
  validateWorkflowInput,
  createWorkflowState
} from './workflow-state';

// Provider types
export * from './provider-types';
export type {
  AIProviderName,
  ProviderConfig,
  ProviderCapabilities,
  ProviderHealthCheck,
  ProviderUsage,
  ProviderMessage,
  CompletionOptions,
  CompletionResponse,
  AIProvider,
  ProviderFactory,
  MessageRole
} from './provider-types';

export {
  AI_PROVIDER_NAMES,
  ProviderConfigSchema,
  isAIProviderName,
  validateProviderConfig
} from './provider-types';

// Re-export for backward compatibility
export type { Resume } from '@/lib/validations/jsonresume';

/**
 * Common validation result type
 */
export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Generic error result
 */
export interface ErrorResult {
  error: string;
  code?: string;
  details?: unknown;
}
