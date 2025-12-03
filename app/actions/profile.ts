'use server'

import { profileService } from '@/lib/services/profile.service';
import { withServerAction } from '@/lib/actions/with-server-action';
import { resumeSchema, type Resume } from '@/lib/validations/jsonresume';

/**
 * Get all profiles for the current user
 */
export const getProfiles = withServerAction(
    'getProfiles',
    async (session) => {
        const result = await profileService.getProfiles(session.user.id);

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data || [];
    },
    { resourceType: 'profile' }
);

/**
 * Get a specific profile by ID
 */
export const getProfile = withServerAction(
    'getProfile',
    async (session, profileId: string) => {
        const result = await profileService.getProfileById(profileId, session.user.id);

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data;
    },
    { resourceType: 'profile' }
);

/**
 * Create a new profile
 */
export const createProfile = withServerAction(
    'createProfile',
    async (session, name: string, resume: Resume, isDefault: boolean = false) => {
        // Validate resume data
        const validationResult = resumeSchema.safeParse(resume);
        if (!validationResult.success) {
            throw new Error('Invalid resume data: ' + validationResult.error.issues[0].message);
        }

        const result = await profileService.createProfile(
            session.user.id,
            name,
            validationResult.data,
            isDefault
        );

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data;
    },
    {
        auditAction: 'PROFILE_CREATE',
        resourceType: 'profile',
        revalidatePaths: ['/profile'],
    }
);

/**
 * Update an existing profile
 */
export const updateProfile = withServerAction(
    'updateProfile',
    async (
        session,
        profileId: string,
        data: Partial<{ name: string; resume: Resume; isDefault: boolean }>
    ) => {
        // Validate resume data if provided
        if (data.resume) {
            const validationResult = resumeSchema.safeParse(data.resume);
            if (!validationResult.success) {
                throw new Error('Invalid resume data: ' + validationResult.error.issues[0].message);
            }
            data.resume = validationResult.data;
        }

        const result = await profileService.updateProfile(
            profileId,
            session.user.id,
            data
        );

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data;
    },
    {
        auditAction: 'PROFILE_UPDATE',
        resourceType: 'profile',
        revalidatePaths: ['/profile'],
    }
);

/**
 * Delete a profile
 */
export const deleteProfile = withServerAction(
    'deleteProfile',
    async (session, profileId: string) => {
        const result = await profileService.deleteProfile(profileId, session.user.id);

        if (!result.success) {
            throw new Error(result.error);
        }

        return undefined;
    },
    {
        auditAction: 'PROFILE_DELETE',
        resourceType: 'profile',
        revalidatePaths: ['/profile'],
    }
);

/**
 * Set a profile as default
 */
export const setDefaultProfile = withServerAction(
    'setDefaultProfile',
    async (session, profileId: string) => {
        const result = await profileService.setDefaultProfile(profileId, session.user.id);

        if (!result.success) {
            throw new Error(result.error);
        }

        return undefined;
    },
    {
        auditAction: 'PROFILE_SET_DEFAULT',
        resourceType: 'profile',
        revalidatePaths: ['/profile'],
    }
);

/**
 * Duplicate a profile
 */
export const duplicateProfile = withServerAction(
    'duplicateProfile',
    async (session, profileId: string, newName?: string) => {
        const result = await profileService.duplicateProfile(
            profileId,
            session.user.id,
            newName
        );

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data;
    },
    {
        auditAction: 'PROFILE_CREATE',
        resourceType: 'profile',
        revalidatePaths: ['/profile'],
    }
);
