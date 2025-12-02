'use server'

import { auth } from '@/lib/auth/config';
import { resumeService } from '@/lib/services/resume.service';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './types';
import type { GenerateResumeServiceInput } from '@/lib/services/resume.service';


/**
 * Get all resumes for the current user
 */
export async function getResumes(): Promise<ActionResult<unknown[]>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await resumeService.getUserResumes(session.user.id);

        return { success: true, data: (result || []) as unknown[] };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch resumes'
        };
    }
}

/**
 * Get a specific resume by ID
 */
export async function getResume(resumeId: string): Promise<ActionResult<unknown>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await resumeService.getResume(resumeId, session.user.id);

        if (!result) {
            return { success: false, error: 'Resume not found' };
        }

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch resume'
        };
    }
}

/**
 * Delete a resume
 */
export async function deleteResume(resumeId: string): Promise<ActionResult<void>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await resumeService.deleteResume(resumeId, session.user.id);

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to delete resume' };
        }

        // Revalidate resume pages
        revalidatePath('/resumes');

        return { success: true, data: undefined };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete resume'
        };
    }
}

/**
 * Generate AI-optimized resume
 */
export async function generateResume(
    profileId: string,
    jobDescription: string,
    modelId: string,
    options?: {
        jobTitle?: string;
        companyName?: string;
        generateCoverLetter?: boolean;
        personalInstructions?: string;
    }
): Promise<ActionResult<unknown>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const input: GenerateResumeServiceInput = {
            userId: session.user.id,
            profileId,
            jobDescription,
            modelId,
            jobTitle: options?.jobTitle,
            companyName: options?.companyName,
            generateCoverLetter: options?.generateCoverLetter,
            personalInstructions: options?.personalInstructions,
        };

        const result = await resumeService.generateResume(input);

        if (!result.success) {
            return {
                success: false,
                error: result.errors?.join(', ') || 'Failed to generate resume'
            };
        }

        // Revalidate resume pages
        revalidatePath('/resumes');

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate resume'
        };
    }
}
