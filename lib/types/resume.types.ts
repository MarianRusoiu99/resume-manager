/**
 * Resume Service Types
 * 
 * Type definitions for resume generation, management, and related operations.
 * These types are used by the ResumeService and its consumers.
 */

/**
 * Input parameters for resume generation
 */
export interface GenerateResumeInput {
  /** User ID who is generating the resume */
  userId: string;
  /** Job description text to analyze */
  jobDescription: string;
  /** Optional job title */
  jobTitle?: string;
  /** Optional company name */
  companyName?: string;
  /** Optional template ID to apply */
  templateId?: string;
  /** Optional AI model ID to use for generation */
  modelId?: string;
  /** Optional profile ID to use (defaults to user's default profile) */
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
  /** Progress callback for real-time updates */
  onProgress: ProgressCallback;
}

/**
 * Resume data returned from service operations
 */
export interface ResumeData {
  id: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Result of resume generation operation
 */
export interface GeneratedResumeData {
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
  content: Record<string, unknown>;
  templateId: string | null;
  metadata: ResumeMetadata;
  createdAt: Date;
  updatedAt: Date;
}

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
 * Detailed resume data for editing/viewing
 */
export interface ResumeDetails {
  id: string;
  jobDescription: string;
  jobMetadata: Record<string, unknown>;
  jobTitle: string;
  companyName: string | null;
  content: Record<string, unknown>;
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
  resume: unknown;
  jobDescription: string;
  jobMetadata: unknown;
  template: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full generated resume entity as returned from API
 * Used in detail pages and full resume operations
 */
export interface GeneratedResume {
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string;
  content: import('@/lib/validations/jsonresume').Resume;
  templateId: string | null;
  customization: Record<string, unknown> | null;
  pdfUrl: string | null;
  coverLetter: string | null;
  isEdited: boolean;
  aiGeneratedContent?: import('@/lib/validations/jsonresume').Resume;
  sectionOrder?: string[] | null;
  metadata: ResumeMetadata;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cover letter generation result
 */
export interface CoverLetterGenerationData {
  coverLetterId: string;
  coverLetter: string;
  metadata: {
    jobTitle: string;
    companyName: string;
    tokensUsed: number;
  };
}

/**
 * Input for standalone cover letter generation
 */
export interface GenerateCoverLetterInput {
  userId: string;
  jobDescription: string;
  personalInstructions?: string;
  modelId?: string;
  profileId?: string;
}
