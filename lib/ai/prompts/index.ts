/**
 * Centralized Prompt Management
 * 
 * Main export point for all AI prompts used in the resume optimization system
 */

// Agent-specific prompts
export * from './agents/job-analysis';
export * from './agents/content-optimization';

// Shared instructions
export * from './shared/json-instructions';
export * from './shared/formatting-instructions';
