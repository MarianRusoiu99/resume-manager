'use server'

import { resumeService } from '@/lib/services';
import { withServerAction } from '@/lib/actions/with-server-action';
import type { GenerateResumeInput as GenerateResumeServiceInput } from '@/lib/types';
import { parseResumeOrThrow, type Resume } from '@/lib/validations/jsonresume';

/**
 * Import a resume from a file
 */
export const importResume = withServerAction(
    'importResume',
    async (session, formData: FormData) => {
        return resumeService.importResume(session.user.id, formData);
    },
    {
        auditAction: 'RESUME_CREATE',
        resourceType: 'resume',
        revalidatePaths: ['/resumes', '/dashboard'],
    }
);

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
 * Duplicate a resume
 */
export const duplicateResume = withServerAction(
    'duplicateResume',
    async (session, resumeId: string) => resumeService.duplicateResume(resumeId, session.user.id),
    {
        auditAction: 'RESUME_CREATE',
        resourceType: 'resume',
        revalidatePaths: ['/resumes'],
    }
);

/**
 * Update resume content
 */
export const updateResumeContent = withServerAction(
    'updateResumeContent',
    async (session, resumeId: string, content: Resume) =>
        resumeService.updateResumeContent(resumeId, session.user.id, parseResumeOrThrow(content, 'strict')),
    {
        auditAction: 'RESUME_UPDATE',
        resourceType: 'resume',
        revalidatePaths: ['/resumes/[id]'],
    }
);

/**
 * Update resume metadata (title, template, etc.)
 */
export const updateResumeMetadata = withServerAction(
    'updateResumeMetadata',
    async (
        session,
        resumeId: string,
        data: {
            jobTitle?: string;
            companyName?: string;
            templateId?: string | null;
            isPublic?: boolean;
        }
    ) => {
        return resumeService.updateResumeMetadata(resumeId, session.user.id, data);
    },
    {
        auditAction: 'RESUME_UPDATE',
        resourceType: 'resume',
        revalidatePaths: ['/resumes/[id]'],
    }
);

/**
 * Save a generated resume
 */
export const saveGeneratedResume = withServerAction(
    'saveGeneratedResume',
    async (
        session,
        data: {
            resume: Resume;
            jobDescription: string;
            jobTitle?: string;
            companyName?: string;
            templateId?: string;
            metadata?: Record<string, unknown>;
        }
    ) => {
        return resumeService.create({
            userId: session.user.id,
            resume: parseResumeOrThrow(data.resume, 'strict'),
            jobDescription: data.jobDescription,
            jobMetadata: {
                jobTitle: data.jobTitle || 'Optimized Resume',
                companyName: data.companyName || '',
            },
            templateId: data.templateId,
            metadata: data.metadata || {},
        });
    },
    {
        auditAction: 'RESUME_CREATE',
        resourceType: 'resume',
        revalidatePaths: ['/resumes', '/dashboard'],
    }
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
