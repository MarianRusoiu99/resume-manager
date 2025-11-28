/**
 * Cover Letter Types
 */

import type { CoverLetter } from '@prisma/client';

// Re-export for convenience
export type { CoverLetter };

// Type alias for backward compatibility
export type CoverLetterListItem = CoverLetter;

export interface CoverLetterWithResume extends CoverLetter {
    generatedResume?: {
        id: string;
        jobDescription: string;
    } | null;
}
