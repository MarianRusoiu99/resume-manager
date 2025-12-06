/**
 * User AI Settings Repository
 * Handles database operations for user AI model preferences
 */

import { prisma } from '@/lib/db';

/**
 * AI feature types that can have model preferences
 */
export type AIFeatureType = 'resume' | 'coverLetter' | 'enhance' | 'template';

/**
 * Model preference for a specific feature
 */
export interface ModelPreference {
  providerId: string | null;
  modelId: string | null;
}

/**
 * All AI settings for a user
 */
export interface UserAISettingsData {
  id: string;
  userId: string;
  resumeProviderId: string | null;
  resumeModelId: string | null;
  coverLetterProviderId: string | null;
  coverLetterModelId: string | null;
  enhanceProviderId: string | null;
  enhanceModelId: string | null;
  templateProviderId: string | null;
  templateModelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating/updating AI settings
 */
export interface UpsertAISettingsInput {
  userId: string;
  resumeProviderId?: string | null;
  resumeModelId?: string | null;
  coverLetterProviderId?: string | null;
  coverLetterModelId?: string | null;
  enhanceProviderId?: string | null;
  enhanceModelId?: string | null;
  templateProviderId?: string | null;
  templateModelId?: string | null;
}

class UserAISettingsRepository {
  /**
   * Get AI settings for a user
   */
  async findByUserId(userId: string): Promise<UserAISettingsData | null> {
    return prisma.userAISettings.findUnique({
      where: { userId },
    });
  }

  /**
   * Create or update AI settings for a user
   */
  async upsert(data: UpsertAISettingsInput): Promise<UserAISettingsData> {
    const { userId, ...settings } = data;
    
    return prisma.userAISettings.upsert({
      where: { userId },
      create: {
        userId,
        ...settings,
      },
      update: settings,
    });
  }

  /**
   * Update a specific feature's model preference
   */
  async updateFeaturePreference(
    userId: string,
    feature: AIFeatureType,
    providerId: string | null,
    modelId: string | null
  ): Promise<UserAISettingsData> {
    const updateData: Record<string, string | null> = {};
    
    switch (feature) {
      case 'resume':
        updateData.resumeProviderId = providerId;
        updateData.resumeModelId = modelId;
        break;
      case 'coverLetter':
        updateData.coverLetterProviderId = providerId;
        updateData.coverLetterModelId = modelId;
        break;
      case 'enhance':
        updateData.enhanceProviderId = providerId;
        updateData.enhanceModelId = modelId;
        break;
      case 'template':
        updateData.templateProviderId = providerId;
        updateData.templateModelId = modelId;
        break;
    }

    return prisma.userAISettings.upsert({
      where: { userId },
      create: {
        userId,
        ...updateData,
      },
      update: updateData,
    });
  }

  /**
   * Get preference for a specific feature
   */
  async getFeaturePreference(
    userId: string,
    feature: AIFeatureType
  ): Promise<ModelPreference> {
    const settings = await this.findByUserId(userId);
    
    if (!settings) {
      return { providerId: null, modelId: null };
    }

    switch (feature) {
      case 'resume':
        return {
          providerId: settings.resumeProviderId,
          modelId: settings.resumeModelId,
        };
      case 'coverLetter':
        return {
          providerId: settings.coverLetterProviderId,
          modelId: settings.coverLetterModelId,
        };
      case 'enhance':
        return {
          providerId: settings.enhanceProviderId,
          modelId: settings.enhanceModelId,
        };
      case 'template':
        return {
          providerId: settings.templateProviderId,
          modelId: settings.templateModelId,
        };
      default:
        return { providerId: null, modelId: null };
    }
  }

  /**
   * Delete AI settings for a user
   */
  async delete(userId: string): Promise<void> {
    await prisma.userAISettings.delete({
      where: { userId },
    }).catch(() => {
      // Ignore if settings don't exist
    });
  }

  /**
   * Clear a specific feature's preference (set to null)
   */
  async clearFeaturePreference(
    userId: string,
    feature: AIFeatureType
  ): Promise<UserAISettingsData | null> {
    return this.updateFeaturePreference(userId, feature, null, null);
  }
}

export const userAISettingsRepository = new UserAISettingsRepository();
