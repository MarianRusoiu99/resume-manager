'use server'

import { auth } from '@/lib/auth/config';
import { coverLetterService } from '@/lib/services/cover-letter.service';
import type { ActionResult } from './types';
import { revalidatePath } from 'next/cache';


/**
 * Get all cover letters for the current user
 */
export async function getCoverLetters(): Promise<ActionResult<unknown[]>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await coverLetterService.getUserCoverLetters(session.user.id);

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to fetch cover letters' };
        }

        return { success: true, data: (result.data?.coverLetters || []) as unknown[] };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch cover letters'
        };
    }
}

/**
 * Get a specific cover letter by ID
 */
export async function getCoverLetter(coverLetterId: string): Promise<ActionResult<unknown>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await coverLetterService.getCoverLetter(coverLetterId, session.user.id);

        if (!result.success || !result.data) {
            return { success: false, error: result.error || 'Cover letter not found' };
        }

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch cover letter'
        };
    }
}

/**
 * Create a new cover letter
 */
export async function createCoverLetter(
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
): Promise<ActionResult<unknown>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await coverLetterService.createCoverLetter({
            userId: session.user.id,
            content,
            jobDescription,
            jobTitle,
            companyName,
            metadata: metadata || {},
        });

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to create cover letter' };
        }

        // Revalidate cover letter pages
        revalidatePath('/cover-letters');

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create cover letter'
        };
    }
}

/**
 * Update an existing cover letter
 */
export async function updateCoverLetter(
    coverLetterId: string,
    data: Partial<{
        content: string;
        jobDescription: string;
        jobTitle: string;
        companyName: string;
    }>
): Promise<ActionResult<unknown>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await coverLetterService.updateCoverLetter(
            coverLetterId,
            session.user.id,
            data
        );

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to update cover letter' };
        }

        // Revalidate affected pages
        revalidatePath('/cover-letters');
        revalidatePath(`/cover-letters/${coverLetterId}`);

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update cover letter'
        };
    }
}

/**
 * Delete a cover letter
 */
export async function deleteCoverLetter(coverLetterId: string): Promise<ActionResult<void>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await coverLetterService.deleteCoverLetter(coverLetterId, session.user.id);

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to delete cover letter' };
        }

        // Revalidate cover letter pages
        revalidatePath('/cover-letters');

        return { success: true, data: undefined };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete cover letter'
        };
    }
}
