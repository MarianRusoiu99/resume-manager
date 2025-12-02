'use server'

import { auth } from '@/lib/auth/config';
import { profileService } from '@/lib/services/profile.service';
import type { ActionResult } from './types';
import { revalidatePath } from 'next/cache';
import { resumeSchema, type Resume } from '@/lib/validations/jsonresume';


/**
 * Get all profiles for the current user
 */
export async function getProfiles(): Promise<ActionResult<unknown[]>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await profileService.getProfiles(session.user.id);

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to fetch profiles' };
        }

        return { success: true, data: (result.data || []) as unknown[] };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch profiles'
        };
    }
}

/**
 * Get a specific profile by ID
 */
export async function getProfile(profileId: string): Promise<ActionResult<unknown>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await profileService.getProfileById(profileId, session.user.id);

        if (!result.success || !result.data) {
            return { success: false, error: result.error || 'Profile not found' };
        }

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch profile'
        };
    }
}

/**
 * Create a new profile
 */
export async function createProfile(
    name: string,
    resume: Resume,
    isDefault: boolean = false
): Promise<ActionResult<unknown>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // Validate resume data
        const validationResult = resumeSchema.safeParse(resume);
        if (!validationResult.success) {
            return {
                success: false,
                error: 'Invalid resume data: ' + validationResult.error.issues[0].message
            };
        }

        const result = await profileService.createProfile(
            session.user.id,
            name,
            validationResult.data,
            isDefault
        );

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to create profile' };
        }

        // Revalidate profile pages
        revalidatePath('/profile');

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create profile'
        };
    }
}

/**
 * Update an existing profile
 */
export async function updateProfile(
    profileId: string,
    data: Partial<{ name: string; resume: Resume; isDefault: boolean }>
): Promise<ActionResult<unknown>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // Validate resume data if provided
        if (data.resume) {
            const validationResult = resumeSchema.safeParse(data.resume);
            if (!validationResult.success) {
                return {
                    success: false,
                    error: 'Invalid resume data: ' + validationResult.error.issues[0].message
                };
            }
            data.resume = validationResult.data;
        }

        const result = await profileService.updateProfile(
            profileId,
            session.user.id,
            data
        );

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to update profile' };
        }

        // Revalidate affected pages
        revalidatePath('/profile');
        revalidatePath(`/profile/${profileId}`);

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update profile'
        };
    }
}

/**
 * Delete a profile
 */
export async function deleteProfile(profileId: string): Promise<ActionResult<void>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await profileService.deleteProfile(profileId, session.user.id);

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to delete profile' };
        }

        // Revalidate profile pages
        revalidatePath('/profile');

        return { success: true, data: undefined };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete profile'
        };
    }
}

/**
 * Set a profile as default
 */
export async function setDefaultProfile(profileId: string): Promise<ActionResult<void>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await profileService.setDefaultProfile(profileId, session.user.id);

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to set default profile' };
        }

        // Revalidate profile pages
        revalidatePath('/profile');

        return { success: true, data: undefined };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to set default profile'
        };
    }
}

/**
 * Duplicate a profile
 */
export async function duplicateProfile(
    profileId: string,
    newName?: string
): Promise<ActionResult<unknown>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await profileService.duplicateProfile(
            profileId,
            session.user.id,
            newName
        );

        if (!result.success) {
            return { success: false, error: result.error || 'Failed to duplicate profile' };
        }

        // Revalidate profile pages
        revalidatePath('/profile');

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to duplicate profile'
        };
    }
}
