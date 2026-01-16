/**
 * User AI Settings Repository
 * Compatibility layer over the new normalized AI preference schema.
 */

import { prisma } from '@/lib/db/index';
import { PrismaClient, Prisma, type AiFeatureKey } from '@prisma/client';
import { GenericUserOwnedRepository, PrismaArgs } from './generic.repository';
import { TransactionClient } from '@/lib/db/transaction';
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

  private async getPreferenceRows(userId: string, tx?: TransactionClient) {
    return (this.getDelegate(tx) as any).findMany({
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
  async findByUserId(userId: string, tx?: TransactionClient): Promise<UserAISettingsData | null> {
    const rows = await this.getPreferenceRows(userId, tx);
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
  async upsert(data: UpsertAISettingsInput, tx?: TransactionClient): Promise<UserAISettingsData> {
    const { userId, ...settings } = data;

    const delegate = this.getDelegate(tx) as any;
    const upsertOrDeleteFeature = async (
      feature: AIFeatureType,
      providerId?: string | null,
      modelId?: string | null
    ) => {
      if (providerId === undefined && modelId === undefined) return;

      // `UserAiPreference.providerId` is required in the new schema.
      // Treat clearing a preference as deleting the row.
      if (providerId === null || providerId === undefined) {
        await delegate.deleteMany({
          where: { userId, feature: toFeatureKey(feature) },
        });
        return;
      }

      await delegate.upsert({
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
    };

    await upsertOrDeleteFeature('resume', settings.resumeProviderId, settings.resumeModelId);
    await upsertOrDeleteFeature('coverLetter', settings.coverLetterProviderId, settings.coverLetterModelId);
    await upsertOrDeleteFeature('enhance', settings.enhanceProviderId, settings.enhanceModelId);
    await upsertOrDeleteFeature('template', settings.templateProviderId, settings.templateModelId);

    return (await this.findByUserId(userId, tx)) ?? blankSettings(userId);
  }

  /**
   * Update a specific feature's model preference
   */
  async updateFeaturePreference(
    userId: string,
    feature: AIFeatureType,
    providerId: string | null,
    modelId: string | null,
    tx?: TransactionClient
  ): Promise<UserAISettingsData> {
    const delegate = this.getDelegate(tx) as any;

    // `UserAiPreference.providerId` is required in the new schema.
    // Clearing a preference is represented by deleting the row.
    if (!providerId) {
      await delegate.deleteMany({
        where: { userId, feature: toFeatureKey(feature) },
      });
      return (await this.findByUserId(userId, tx)) ?? blankSettings(userId);
    }

    await delegate.upsert({
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

    return (await this.findByUserId(userId, tx)) ?? blankSettings(userId);
  }

  /**
   * Get preference for a specific feature
   */
  async getFeaturePreference(userId: string, feature: AIFeatureType, tx?: TransactionClient): Promise<ModelPreference> {
    const preference = await (this.getDelegate(tx) as any).findUnique({
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
  override async delete(userId: string, tx_or_userId?: TransactionClient | string, maybe_tx?: TransactionClient): Promise<UserAISettingsData> {
    // Handle overloaded signature from GenericRepository
    const actualTx = typeof tx_or_userId !== 'string' ? tx_or_userId : maybe_tx;
    const actualUserId = typeof tx_or_userId === 'string' ? tx_or_userId : userId;

    await (this.getDelegate(actualTx) as any).deleteMany({ where: { userId: actualUserId } });
    // Return blank settings after deletion
    return blankSettings(actualUserId);
  }

  /**
   * Clear a specific feature's preference (set to null)
   */
  async clearFeaturePreference(userId: string, feature: AIFeatureType, tx?: TransactionClient): Promise<UserAISettingsData | null> {
    await (this.getDelegate(tx) as any).deleteMany({
      where: { userId, feature: toFeatureKey(feature) },
    });
    return this.findByUserId(userId, tx);
  }

  // Implement required methods from GenericRepository that don't map directly
  override async findById(id: string, userId?: string, tx?: TransactionClient): Promise<UserAISettingsData | null> {
    return this.findByUserId(userId || id, tx);
  }

  async findAll(_?: PrismaArgs, tx?: TransactionClient): Promise<UserAISettingsData[]> {
    // This is not really used for this repository as it's user-centric
    return [];
  }

  override async create(data: UpsertAISettingsInput, tx?: TransactionClient): Promise<UserAISettingsData> {
    return this.upsert(data, tx);
  }

  override async update(id: string, data: UpsertAISettingsInput, userId?: string, tx?: TransactionClient): Promise<UserAISettingsData> {
    return this.upsert({ ...data, userId: userId || data.userId }, tx);
  }

}

export const userAISettingsRepository = new UserAISettingsRepository();
