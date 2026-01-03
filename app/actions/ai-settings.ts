'use server'

import { userAISettingsService } from '@/lib/services';
import { withServerAction } from '@/lib/actions/with-server-action';
import type { AIFeatureType, UpsertAISettingsInput } from '@/lib/repositories/interfaces';

interface FeaturePreferenceData {
  feature: AIFeatureType;
  providerId: string | null;
  modelId: string | null;
}

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
    async (session, data: FeaturePreferenceData) => {
        return userAISettingsService.updateFeaturePreference({
            userId: session.user.id,
            ...data
        });
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
    async (session, preferences: Omit<UpsertAISettingsInput, 'userId'>) => {
        return userAISettingsService.updateAllPreferences(session.user.id, {
            ...preferences,
            userId: session.user.id
        });
    },
    {
        auditAction: 'SETTINGS_UPDATE',
        resourceType: 'ai-settings',
        revalidatePaths: ['/settings'],
    }
);
