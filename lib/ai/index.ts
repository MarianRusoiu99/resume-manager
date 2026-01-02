/**
 * AI Module
 * 
 * Main exports for AI functionality including workflows and generators
 */

// Resume Generator
export {
  generateResume,
  type GenerateResumeInput,
  type GenerateResumeResult,
} from './workflow/resume-generation';

export type { OptimizedResume } from './agents';

// Workflow Engine
export * from './workflow';

// AI Features
export * from './features/enhance';
