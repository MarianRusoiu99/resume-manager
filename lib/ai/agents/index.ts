/**
 * Centralized Prompt Management
 * 
 * Main export point for all AI prompts used in the resume optimization system
 */

// Agent-specific prompts
export * from './job-analysis';
export * from './content-optimization';
export * from './resume-optimization';
export * from './cover-letter';

// Shared instructions
export * from './shared/json-instructions';
export * from './shared/formatting-instructions';
