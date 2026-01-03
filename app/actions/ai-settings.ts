'use server'

import { userAISettingsService } from '@/lib/services';
import { withServerAction } from '@/lib/actions/with-server-action';
import { z } from 'zod';

/**
 * Get AI settings for the current user
 */
export const getAISettings = withServerAction(
    'getAISettings',
    async (session) => userAISettingsService.getSettings(session.user.id),
    { resourceType: 'ai-settings' }
);

/**
 * Update a specific feature preference
 */
export const updateFeaturePreference = withServerAction(
    'updateFeaturePreference',
    async (session, data: { feature: string; providerId: string | null; modelId: string | null }) => {
        return userAISettingsService.updateFeaturePreference({
            userId: session.user.id,
            ...data
        } as any);
    },
    {
        auditAction: 'SETTINGS_UPDATE',
        resourceType: 'ai-settings',
        revalidatePaths: ['/settings'],
    }
);

/**
 * Update all preferences at once
 */
export const updateAllPreferences = withServerAction(
    'updateAllPreferences',
    async (session, preferences: any) => {
        return userAISettingsService.updateAllPreferences(session.user.id, preferences);
    },
    {
        auditAction: 'SETTINGS_UPDATE',
        resourceType: 'ai-settings',
        revalidatePaths: ['/settings'],
    }
);
