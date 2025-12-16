import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Input parameters for resume generation.
 */
export interface GenerateResumeServiceInput {
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
 * Progress callback for streaming updates.
 */
export type ProgressCallback = (step: string, message: string, progress: number) => void;

/**
 * Input parameters for resume generation with progress streaming.
 */
export interface GenerateResumeWithProgressInput extends GenerateResumeServiceInput {
  /** Progress callback for real-time updates */
  onProgress: ProgressCallback;
}

/**
 * Resume data returned from service operations.
 */
export interface ResumeData {
  id: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Result of resume generation operation.
 */
export interface GeneratedResumeData {
  resumeId: string;
  resume: ResumeData;
}

/**
 * Cover letter generation result.
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
 * Return type for the provider resolution step.
 */
export type ResolvedProviderResult = {
  provider: import('@/lib/ai/providers').AIProvider;
  modelId: string;
  providerType: string;
};

export type ResumeWorkflowJobInfo = {
  jobTitle: string;
  companyName: string;
};

export type ValidatedProfileResumeResult = {
  resume: Resume;
  isValidated: boolean;
};
