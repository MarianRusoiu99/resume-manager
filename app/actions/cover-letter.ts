'use server'

import { coverLetterService } from '@/lib/services/cover-letter.service';
import { withServerAction } from '@/lib/actions/with-server-action';

/**
 * Get all cover letters for the current user
 */
export const getCoverLetters = withServerAction(
    'getCoverLetters',
    async (session) => {
        const result = await coverLetterService.getUserCoverLetters(session.user.id);
        if (!result.success) return result;
        return { success: true, data: result.data.coverLetters };
    },
    { resourceType: 'coverLetter' }
);

/**
 * Get a specific cover letter by ID
 */
export const getCoverLetter = withServerAction(
    'getCoverLetter',
    async (session, coverLetterId: string) => coverLetterService.getCoverLetter(coverLetterId, session.user.id),
    { resourceType: 'coverLetter' }
);

/**
 * Create a new cover letter
 */
export const createCoverLetter = withServerAction(
    'createCoverLetter',
    async (
        session,
        content: string,
        jobDescription: string,
        jobTitle?: string,
        companyName?: string,
        metadata?: {
            model?: string;
            tokens?: number;
            generationTime?: number;
            personalInstructions?: string;
        }
    ) => {
        return coverLetterService.createCoverLetter({
            userId: session.user.id,
            content,
            jobDescription,
            jobTitle,
            companyName,
            metadata: metadata || {},
        });
    },
    {
        auditAction: 'COVER_LETTER_CREATE',
        resourceType: 'coverLetter',
        revalidatePaths: ['/cover-letters'],
    }
);

/**
 * Update an existing cover letter
 */
export const updateCoverLetter = withServerAction(
    'updateCoverLetter',
    async (
        session,
        coverLetterId: string,
        data: Partial<{
            content: string;
            jobDescription: string;
            jobTitle: string;
            companyName: string;
        }>
    ) => {
        return coverLetterService.updateCoverLetter(coverLetterId, session.user.id, data);
    },
    {
        auditAction: 'COVER_LETTER_UPDATE',
        resourceType: 'coverLetter',
        revalidatePaths: ['/cover-letters'],
    }
);

/**
 * Delete a cover letter
 */
export const deleteCoverLetter = withServerAction(
    'deleteCoverLetter',
    async (session, coverLetterId: string) => coverLetterService.deleteCoverLetter(coverLetterId, session.user.id),
    {
        auditAction: 'COVER_LETTER_DELETE',
        resourceType: 'coverLetter',
        revalidatePaths: ['/cover-letters'],
    }
);
