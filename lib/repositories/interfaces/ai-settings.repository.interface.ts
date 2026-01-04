import { UserOwnedEntity } from '../generic.repository';

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
  findByUserId(userId: string): Promise<UserAISettingsData | null>;
  upsert(data: UpsertAISettingsInput): Promise<UserAISettingsData>;
  updateFeaturePreference(
    userId: string,
    feature: AIFeatureType,
    providerId: string | null,
    modelId: string | null
  ): Promise<UserAISettingsData>;
  getFeaturePreference(userId: string, feature: AIFeatureType): Promise<ModelPreference>;
  delete(userId: string): Promise<UserAISettingsData>;
  clearFeaturePreference(userId: string, feature: AIFeatureType): Promise<UserAISettingsData | null>;
}
