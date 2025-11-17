/**
 * Job Analysis Prompts - Main Export
 * 
 * Centralized export for all job analysis prompts
 */

export {
  JOB_ANALYSIS_SYSTEM_PROMPT,
  JOB_ANALYSIS_GUIDELINES
} from './system-prompt';

export {
  JOB_ANALYSIS_USER_TEMPLATE,
  formatJobAnalysisPrompt,
  type JobAnalysisPromptInput
} from './user-template';

export {
  formatSimpleJobAnalysisPrompt,
  type SimpleJobAnalysisInput
} from './simple-template';

// Agent execution
export {
  analyzeJob,
  jobAnalysisSchema,
  type JobAnalysisResult,
  type AnalyzeJobInput
} from './agent';
