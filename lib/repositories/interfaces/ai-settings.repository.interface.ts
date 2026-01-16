import { UserOwnedEntity } from '../generic.repository';
import { TransactionClient } from '@/lib/db/transaction';

export type AIFeatureType = 'resume' | 'coverLetter' | 'enhance' | 'template';

export interface ModelPreference {
  providerId: string | null;
  modelId: string | null;
}

export interface UserAISettingsData extends UserOwnedEntity {
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

export interface IUserAISettingsRepository {
  findByUserId(userId: string, tx?: TransactionClient): Promise<UserAISettingsData | null>;
  upsert(data: UpsertAISettingsInput, tx?: TransactionClient): Promise<UserAISettingsData>;
  updateFeaturePreference(
    userId: string,
    feature: AIFeatureType,
    providerId: string | null,
    modelId: string | null,
    tx?: TransactionClient
  ): Promise<UserAISettingsData>;
  getFeaturePreference(userId: string, feature: AIFeatureType, tx?: TransactionClient): Promise<ModelPreference>;
  delete(userId: string, tx?: TransactionClient): Promise<UserAISettingsData>;
  clearFeaturePreference(userId: string, feature: AIFeatureType, tx?: TransactionClient): Promise<UserAISettingsData | null>;
}
