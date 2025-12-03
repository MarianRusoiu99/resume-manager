/**
 * Shared Types for AI Agents
 * 
 * Common type definitions used across all agents
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';

/**
 * Base input for all AI agents
 */
export interface BaseAgentInput {
  /** AI provider instance */
  provider: AIProvider;
  /** Model ID to use */
  modelId: string;
  /** Raw job description text */
  jobDescription: string;
  /** User's profile resume - the source of truth */
  userResume: Resume;
}

/**
 * Common metadata extracted from job descriptions
 */
export interface JobMetadata {
  jobTitle: string;
  companyName: string;
}

/**
 * Base result type with job metadata
 */
export interface BaseAgentResult extends JobMetadata {
  /** Indicates successful generation */
  success: boolean;
}
