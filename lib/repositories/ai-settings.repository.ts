/**
 * User AI Settings Repository
 * Compatibility layer over the new normalized AI preference schema.
 */

import { prisma } from '@/lib/db/index';
import { PrismaClient, Prisma, type AiFeatureKey } from '@prisma/client';
import { GenericUserOwnedRepository, PrismaArgs } from './generic.repository';
import type { 
  IUserAISettingsRepository, 
  UserAISettingsData, 
  UpsertAISettingsInput, 
  AIFeatureType, 
  ModelPreference 
} from './interfaces/ai-settings.repository.interface';

function toFeatureKey(feature: AIFeatureType): AiFeatureKey {
  return feature as AiFeatureKey;
}

function blankSettings(userId: string): UserAISettingsData {
  const now = new Date();
  return {
    id: userId,
    userId,
    resumeProviderId: null,
    resumeModelId: null,
    coverLetterProviderId: null,
    coverLetterModelId: null,
    enhanceProviderId: null,
    enhanceModelId: null,
    templateProviderId: null,
    templateModelId: null,
    createdAt: now,
    updatedAt: now,
  };
}

function applyPreference(settings: UserAISettingsData, feature: AIFeatureType, pref: ModelPreference) {
  switch (feature) {
    case 'resume':
      return { ...settings, resumeProviderId: pref.providerId, resumeModelId: pref.modelId };
    case 'coverLetter':
      return {
        ...settings,
        coverLetterProviderId: pref.providerId,
        coverLetterModelId: pref.modelId,
      };
    case 'enhance':
      return { ...settings, enhanceProviderId: pref.providerId, enhanceModelId: pref.modelId };
    case 'template':
      return {
        ...settings,
        templateProviderId: pref.providerId,
        templateModelId: pref.modelId,
      };
    default:
      return settings;
  }
}

/**
 * User AI Settings Repository
 * 
 * Inherits from GenericUserOwnedRepository but maps the normalized UserAiPreference rows
 * to a flat UserAISettingsData object for compatibility.
 */
export class UserAISettingsRepository extends GenericUserOwnedRepository<
  UserAISettingsData,
  UpsertAISettingsInput,
  UpsertAISettingsInput
> implements IUserAISettingsRepository {
  
  constructor(dbClient: PrismaClient = prisma) {
    super('userAiPreference', dbClient);
  }

  private async getPreferenceRows(userId: string) {
    return this.db.userAiPreference.findMany({
      where: { userId },
      select: {
        feature: true,
        providerId: true,
        modelId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get AI settings for a user
   */
  async findByUserId(userId: string): Promise<UserAISettingsData | null> {
    const rows = await this.getPreferenceRows(userId);
    if (rows.length === 0) return null;

    let settings = blankSettings(userId);
    let createdAt = rows[0].createdAt;
    let updatedAt = rows[0].updatedAt;

    for (const row of rows) {
      const feature = row.feature as AIFeatureType;
      settings = applyPreference(settings, feature, {
        providerId: row.providerId,
        modelId: row.modelId,
      });

      if (row.createdAt < createdAt) createdAt = row.createdAt;
      if (row.updatedAt > updatedAt) updatedAt = row.updatedAt;
    }

    return {
      ...settings,
      createdAt,
      updatedAt,
    };
  }

  /**
   * Create or update AI settings for a user
   *
   * Upserts one row per feature that is present in `data`.
   */
  async upsert(data: UpsertAISettingsInput): Promise<UserAISettingsData> {
    const { userId, ...settings } = data;

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    const upsertOrDeleteFeature = (
      feature: AIFeatureType,
      providerId?: string | null,
      modelId?: string | null
    ) => {
      if (providerId === undefined && modelId === undefined) return;

      // `UserAiPreference.providerId` is required in the new schema.
      // Treat clearing a preference as deleting the row.
      if (providerId === null || providerId === undefined) {
        operations.push(
          this.db.userAiPreference.deleteMany({
            where: { userId, feature: toFeatureKey(feature) },
          })
        );
        return;
      }

      operations.push(
        this.db.userAiPreference.upsert({
          where: { userId_feature: { userId, feature: toFeatureKey(feature) } },
          create: {
            userId,
            feature: toFeatureKey(feature),
            providerId,
            modelId: modelId ?? null,
          },
          update: {
            providerId,
            modelId: modelId ?? null,
            updatedAt: new Date(),
          },
        })
      );
    };

    upsertOrDeleteFeature('resume', settings.resumeProviderId, settings.resumeModelId);
    upsertOrDeleteFeature('coverLetter', settings.coverLetterProviderId, settings.coverLetterModelId);
    upsertOrDeleteFeature('enhance', settings.enhanceProviderId, settings.enhanceModelId);
    upsertOrDeleteFeature('template', settings.templateProviderId, settings.templateModelId);

    if (operations.length > 0) {
      await this.db.$transaction(operations);
    }

    return (await this.findByUserId(userId)) ?? blankSettings(userId);
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
    // `UserAiPreference.providerId` is required in the new schema.
    // Clearing a preference is represented by deleting the row.
    if (!providerId) {
      await this.db.userAiPreference.deleteMany({
        where: { userId, feature: toFeatureKey(feature) },
      });
      return (await this.findByUserId(userId)) ?? blankSettings(userId);
    }

    await this.db.userAiPreference.upsert({
      where: { userId_feature: { userId, feature: toFeatureKey(feature) } },
      create: {
        userId,
        feature: toFeatureKey(feature),
        providerId,
        modelId: modelId ?? null,
      },
      update: {
        providerId,
        modelId: modelId ?? null,
        updatedAt: new Date(),
      },
    });

    return (await this.findByUserId(userId)) ?? blankSettings(userId);
  }

  /**
   * Get preference for a specific feature
   */
  async getFeaturePreference(userId: string, feature: AIFeatureType): Promise<ModelPreference> {
    const preference = await this.db.userAiPreference.findUnique({
      where: { userId_feature: { userId, feature: toFeatureKey(feature) } },
      select: {
        providerId: true,
        modelId: true,
      },
    });

    return {
      providerId: preference?.providerId ?? null,
      modelId: preference?.modelId ?? null,
    };
  }

  /**
   * Delete AI settings for a user
   */
  override async delete(userId: string): Promise<UserAISettingsData | null> {
    await this.db.userAiPreference.deleteMany({ where: { userId } });
    return null;
  }

  /**
   * Clear a specific feature's preference (set to null)
   */
  async clearFeaturePreference(userId: string, feature: AIFeatureType): Promise<UserAISettingsData | null> {
    await this.db.userAiPreference.deleteMany({
      where: { userId, feature: toFeatureKey(feature) },
    });
    return this.findByUserId(userId);
  }

  // Implement required methods from GenericRepository that don't map directly
  async findById(id: string, userId?: string): Promise<UserAISettingsData | null> {
    return this.findByUserId(userId || id);
  }

  async findAll(_?: PrismaArgs): Promise<UserAISettingsData[]> {
    // This is not really used for this repository as it's user-centric
    return [];
  }

  async create(data: UpsertAISettingsInput): Promise<UserAISettingsData> {
    return this.upsert(data);
  }

  async update(id: string, data: UpsertAISettingsInput, userId?: string): Promise<UserAISettingsData> {
    return this.upsert({ ...data, userId: userId || data.userId });
  }
}

export const userAISettingsRepository = new UserAISettingsRepository();
