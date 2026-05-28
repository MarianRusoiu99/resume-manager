/**
 * Resume Core Types
 * 
 * Type definitions for resume generation, management, and related operations.
 */

import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Normalized metadata for resume operations
 */
export interface ResumeMetadata {
  generatedAt: string;
  model: string;
  totalTokens: number;
  processingTime: number;
}

/**
 * Input parameters for resume generation
 */
export interface GenerateResumeInput {
  userId: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  templateId?: string;
  modelId?: string;
  profileId?: string;
}

/**
 * Progress callback for streaming updates during generation
 */
export type ProgressCallback = (step: string, message: string, progress: number) => void;

/**
 * Input parameters for resume generation with progress streaming
 */
export interface GenerateResumeWithProgressInput extends GenerateResumeInput {
  onProgress: ProgressCallback;
}

/**
 * Resume data returned from service operations
 */
export interface ResumeData {
  id: string;
  content: Resume;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Result of resume generation operation
 */
export interface GeneratedResumeResult {
  resumeId: string;
  resume: ResumeData;
}

/**
 * Resume list item for display in lists/grids
 */
export interface ResumeListItem {
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string;
  content: Resume;
  templateId: string | null;
  metadata: ResumeMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detailed resume data for editing/viewing
 */
export interface ResumeDetails {
  id: string;
  jobDescription: string;
  jobMetadata: Record<string, unknown>;
  jobTitle: string;
  companyName: string | null;
  content: Resume;
  metadata: ResumeMetadata;
  templateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Updated resume data after modification
 */
export interface UpdatedResumeData {
  id: string;
  resume: Resume;
  jobDescription: string;
  jobMetadata: Record<string, unknown>;
  template: unknown;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full generated resume entity as returned from API
 */
export interface GeneratedResume {
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string;
  content: Resume;
  templateId: string | null;
  customization: Record<string, unknown> | null;
  pdfUrl: string | null;
  coverLetter: string | null;
  isEdited: boolean;
  aiGeneratedContent: Resume;
  sectionOrder?: string[] | null;
  metadata: ResumeMetadata;
  createdAt: string;
  updatedAt: string;
}
