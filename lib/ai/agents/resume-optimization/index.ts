/**
 * Resume Optimization Prompts - Main Export
 * 
 * Complete resume optimization for job applications
 */

export {
  RESUME_OPTIMIZATION_SYSTEM_PROMPT,
  RESUME_OPTIMIZATION_GUIDELINES
} from './system-prompt';

export {
  formatResumeOptimizationPrompt,
  type ResumeOptimizationInput
} from './user-template';

// Agent execution
export {
  optimizeResume,
  optimizedResumeSchema,
  type OptimizedResume,
  type OptimizeResumeInput
} from './agent';
