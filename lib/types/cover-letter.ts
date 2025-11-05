/**
 * Cover Letter Types
 */

import { Prisma } from '@prisma/client';

export type CoverLetterWithResume = Prisma.CoverLetterGetPayload<{
  include: {
    resume: {
      select: {
        id: true;
        jobDescription: true;
        resume: true;
        createdAt: true;
      };
    };
  };
}>;

export type CoverLetterListItem = Prisma.CoverLetterGetPayload<{
  include: {
    resume: {
      select: {
        id: true;
        jobDescription: true;
        createdAt: true;
      };
    };
  };
}>;

export interface CoverLetterMetadata {
  model?: string;
  tokens?: number;
  generationTime?: number;
  personalInstructions?: string;
}
