/**
 * Resume Optimization Agent - Main Export
 */

// Prompt (for customization)
export { 
  RESUME_OPTIMIZATION_SYSTEM_PROMPT,
  RESUME_OPTIMIZATION_USER_PROMPT,
  buildResumeOptimizationPrompt 
} from './prompt';

// Agent
export {
  optimizeResume,
  optimizedResumeSchema,
  type OptimizedResume,
  type OptimizeResumeInput,
  type OptimizeResumeResult,
} from './agent';
