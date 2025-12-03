'use server'

import { resumeService } from '@/lib/services/resume.service';
import { withServerAction } from '@/lib/actions/with-server-action';
import type { GenerateResumeServiceInput } from '@/lib/services/resume.service';

/**
 * Get all resumes for the current user
 */
export const getResumes = withServerAction(
    'getResumes',
    async (session) => {
        const result = await resumeService.getUserResumes(session.user.id);
        return result || [];
    },
    { resourceType: 'resume' }
);

/**
 * Get a specific resume by ID
 */
export const getResume = withServerAction(
    'getResume',
    async (session, resumeId: string) => {
        const result = await resumeService.getResume(resumeId, session.user.id);

        if (!result) {
            throw new Error('Resume not found');
        }

        return result;
    },
    { resourceType: 'resume' }
);

/**
 * Delete a resume
 */
export const deleteResume = withServerAction(
    'deleteResume',
    async (session, resumeId: string) => {
        const result = await resumeService.deleteResume(resumeId, session.user.id);

        if (!result.success) {
            throw new Error(result.error);
        }

        return undefined;
    },
    {
        auditAction: 'RESUME_DELETE',
        resourceType: 'resume',
        revalidatePaths: ['/resumes'],
    }
);

/**
 * Generate AI-optimized resume
 */
export const generateResume = withServerAction(
    'generateResume',
    async (
        session,
        profileId: string,
        jobDescription: string,
        modelId: string,
        options?: {
            jobTitle?: string;
            companyName?: string;
        }
    ) => {
        const input: GenerateResumeServiceInput = {
            userId: session.user.id,
            profileId,
            jobDescription,
            modelId,
            jobTitle: options?.jobTitle,
            companyName: options?.companyName,
        };

        const result = await resumeService.generateResume(input);

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data;
    },
    {
        auditAction: 'RESUME_GENERATE',
        resourceType: 'resume',
        revalidatePaths: ['/resumes'],
    }
);
