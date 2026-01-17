/**
 * Cover Letter Types
 */

import type { CoverLetter } from '@prisma/client';

// Re-export for convenience
export type { CoverLetter };

export type CoverLetterListItem = CoverLetter;

export type CoverLetterWithResume = CoverLetter & {
  resume?: {
    id: string;
    jobPosting?: { description: string } | null;
  } | null;
  jobPosting?: {
    title: string | null;
    description: string;
    company?: { name: string } | null;
  } | null;
};

/**
 * Result of cover letter generation
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
