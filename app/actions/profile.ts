'use server'

import { profileService } from '@/lib/services';
import { withServerAction } from '@/lib/actions/with-server-action';
import { type Resume } from '@/lib/validations/jsonresume';

/**
 * Get all profiles for the current user
 */
export const getProfiles = withServerAction(
    'getProfiles',
    async (session) => profileService.getProfiles(session.user.id),
    { resourceType: 'profile' }
);

/**
 * Get a specific profile by ID
 */
export const getProfile = withServerAction(
    'getProfile',
    async (session, profileId: string) => profileService.getProfileById(profileId, session.user.id),
    { resourceType: 'profile' }
);

/**
 * Create a new profile
 */
export const createProfile = withServerAction(
    'createProfile',
    async (session, name: string, resume: Resume, isDefault: boolean = false) => {
        return profileService.createProfile(
            session.user.id,
            name,
            resume,
            isDefault
        );
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
        data: Partial<{
            name: string;
            resume: Resume;
            isDefault: boolean;
            isPublic: boolean;
            publicSlug: string | null;
            selectedTemplateId: string | null;
        }>
    ) => {
        return profileService.updateProfile(profileId, session.user.id, data);
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
    async (session, profileId: string) => profileService.deleteProfile(profileId, session.user.id),
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
    async (session, profileId: string) => profileService.setDefaultProfile(profileId, session.user.id),
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
    async (session, profileId: string, newName?: string) =>
        profileService.duplicateProfile(profileId, session.user.id, newName),
    {
        auditAction: 'PROFILE_CREATE',
        resourceType: 'profile',
        revalidatePaths: ['/profile'],
    }
);
