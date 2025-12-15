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
        if (!result.success) return result;
        return { success: true, data: result.data };
    },
    { resourceType: 'resume' }
);

/**
 * Get a specific resume by ID
 */
export const getResume = withServerAction(
    'getResume',
    async (session, resumeId: string) => resumeService.getResume(resumeId, session.user.id),
    { resourceType: 'resume' }
);

/**
 * Delete a resume
 */
export const deleteResume = withServerAction(
    'deleteResume',
    async (session, resumeId: string) => resumeService.deleteResume(resumeId, session.user.id),
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

        return resumeService.generateResume(input);
    },
    {
        auditAction: 'RESUME_GENERATE',
        resourceType: 'resume',
        revalidatePaths: ['/resumes'],
    }
);
