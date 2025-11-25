/**
 * Cover Letter Types
 */

import type { CoverLetter } from '@prisma/client';

export interface CoverLetterListItem extends CoverLetter { }

export interface CoverLetterWithResume extends CoverLetter {
    generatedResume?: {
        id: string;
        jobDescription: string;
    } | null;
}
