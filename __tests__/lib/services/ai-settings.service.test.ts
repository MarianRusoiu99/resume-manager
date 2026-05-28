import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { UserAISettingsRepository } from '@/lib/repositories/ai-settings.repository';
import type { ApiProviderService } from '@/lib/services/api-providers';
import { UserAISettingsService } from '@/lib/services/ai-settings/user-ai-settings.workflow';
import type { UserAISettingsData, ModelPreference } from '@/lib/repositories/interfaces';
import type { ConfiguredModelInfo } from '@/lib/services/api-providers';
import type { ProviderWithModels } from '@/lib/types/ai-settings';
import { AI_FEATURES } from '@/lib/services/ai-settings/features';

vi.mock('@/lib/services/api-providers', () => ({
  apiProviderService: mockDeep<ApiProviderService>(),
}));

vi.mock('@/lib/services/ai-settings/resolver', () => ({
  resolveProviderForFeature: vi.fn().mockResolvedValue({ providerId: 'prov-1', modelId: 'model-1' }),
}));

import { apiProviderService } from '@/lib/services/api-providers';
import { resolveProviderForFeature as mockResolveProviderForFeature } from '@/lib/services/ai-settings/resolver';

const mockApiProviderService = apiProviderService as ReturnType<typeof mockDeep<ApiProviderService>>;

function createMockAISettings(overrides: Partial<UserAISettingsData> = {}): UserAISettingsData {
  return {
    id: 'settings-123',
    userId: 'user-123',
    resumeProviderId: null,
    resumeModelId: null,
    coverLetterProviderId: null,
    coverLetterModelId: null,
    enhanceProviderId: null,
    enhanceModelId: null,
    templateProviderId: null,
    templateModelId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createMockModel(overrides: Partial<ConfiguredModelInfo> = {}): ConfiguredModelInfo {
  return {
    id: 'model-123',
    modelKey: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI GPT-4o',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    ...overrides,
  };
}

function createMockProvider(overrides: Partial<ProviderWithModels> = {}): ProviderWithModels {
  return {
    id: 'provider-123',
    name: 'My OpenAI',
    provider: 'openai',
    isActive: true,
    models: [createMockModel()],
    keyPreview: '****abc',
    createdAt: new Date('2024-01-01'),
    lastUsedAt: null,
    ...overrides,
  };
}

describe('UserAISettingsService', () => {
  let service: UserAISettingsService;
  let repositoryMock: ReturnType<typeof mockDeep<UserAISettingsRepository>>;

  beforeEach(() => {
    repositoryMock = mockDeep<UserAISettingsRepository>();
    mockReset(repositoryMock);
    mockReset(mockApiProviderService);
    service = new UserAISettingsService(repositoryMock);
  });

  describe('getSettings', () => {
    it('should return resolved settings with available providers', async () => {
      const settings = createMockAISettings({
        resumeProviderId: 'provider-123',
        resumeModelId: 'model-123',
      });
      const provider = createMockProvider();

      repositoryMock.findByUserId.mockResolvedValue(settings);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [provider],
      });

      const result = await service.getSettings('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.features).toHaveLength(AI_FEATURES.length);
        expect(result.data.availableProviders).toHaveLength(1);
        
        const resumeFeature = result.data.features.find(f => f.feature.id === 'resume');
        expect(resumeFeature?.providerId).toBe('provider-123');
        expect(resumeFeature?.providerName).toBe('My OpenAI');
        expect(resumeFeature?.modelId).toBe('model-123');
        expect(resumeFeature?.modelName).toBe('GPT-4o');
      }
    });

    it('should return empty providers when API call fails', async () => {
      repositoryMock.findByUserId.mockResolvedValue(null);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: false,
        error: 'Provider error',
        code: 'INTERNAL_ERROR',
      });

      const result = await service.getSettings('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.availableProviders).toHaveLength(0);
        expect(result.data.features).toHaveLength(AI_FEATURES.length);
      }
    });

    it('should return null preferences when no settings exist', async () => {
      repositoryMock.findByUserId.mockResolvedValue(null);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.getSettings('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        result.data.features.forEach(feature => {
          expect(feature.providerId).toBeNull();
          expect(feature.modelId).toBeNull();
        });
      }
    });

    it('should resolve all feature types correctly', async () => {
      const settings = createMockAISettings({
        resumeProviderId: 'prov-1',
        resumeModelId: 'mod-1',
        coverLetterProviderId: 'prov-2',
        coverLetterModelId: 'mod-2',
        enhanceProviderId: 'prov-3',
        enhanceModelId: 'mod-3',
        templateProviderId: 'prov-4',
        templateModelId: 'mod-4',
      });

      repositoryMock.findByUserId.mockResolvedValue(settings);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.getSettings('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        const resume = result.data.features.find(f => f.feature.id === 'resume');
        expect(resume?.providerId).toBe('prov-1');
        expect(resume?.modelId).toBe('mod-1');

        const coverLetter = result.data.features.find(f => f.feature.id === 'coverLetter');
        expect(coverLetter?.providerId).toBe('prov-2');
        expect(coverLetter?.modelId).toBe('mod-2');

        const enhance = result.data.features.find(f => f.feature.id === 'enhance');
        expect(enhance?.providerId).toBe('prov-3');
        expect(enhance?.modelId).toBe('mod-3');

        const template = result.data.features.find(f => f.feature.id === 'template');
        expect(template?.providerId).toBe('prov-4');
        expect(template?.modelId).toBe('mod-4');
      }
    });
  });

  describe('getFeaturePreference', () => {
    it('should return preference for a specific feature', async () => {
      const preference: ModelPreference = {
        providerId: 'provider-123',
        modelId: 'model-123',
      };
      repositoryMock.getFeaturePreference.mockResolvedValue(preference);

      const result = await service.getFeaturePreference('user-123', 'resume');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.providerId).toBe('provider-123');
        expect(result.data.modelId).toBe('model-123');
      }
      expect(repositoryMock.getFeaturePreference).toHaveBeenCalledWith('user-123', 'resume');
    });

    it('should return null values when no preference exists', async () => {
      repositoryMock.getFeaturePreference.mockResolvedValue({
        providerId: null,
        modelId: null,
      });

      const result = await service.getFeaturePreference('user-123', 'coverLetter');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.providerId).toBeNull();
        expect(result.data.modelId).toBeNull();
      }
    });

    it('should handle repository errors', async () => {
      repositoryMock.getFeaturePreference.mockRejectedValue(new Error('Database error'));

      const result = await service.getFeaturePreference('user-123', 'enhance');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Database error');
      }
    });
  });

  describe('updateFeaturePreference', () => {
    it('should update preference and return resolved selection', async () => {
      const provider = createMockProvider();
      const updatedSettings = createMockAISettings({
        resumeProviderId: 'provider-123',
        resumeModelId: 'model-123',
      });

      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [provider],
      });
      repositoryMock.updateFeaturePreference.mockResolvedValue(updatedSettings);

      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'resume',
        providerId: 'provider-123',
        modelId: 'model-123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.feature.id).toBe('resume');
        expect(result.data.providerId).toBe('provider-123');
        expect(result.data.providerName).toBe('My OpenAI');
        expect(result.data.modelId).toBe('model-123');
        expect(result.data.modelName).toBe('GPT-4o');
      }
    });

    it('should clear preference when providerId and modelId are null', async () => {
      const clearedSettings = createMockAISettings();
      repositoryMock.updateFeaturePreference.mockResolvedValue(clearedSettings);

      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'resume',
        providerId: null,
        modelId: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.providerId).toBeNull();
        expect(result.data.providerName).toBeNull();
        expect(result.data.modelId).toBeNull();
        expect(result.data.modelName).toBeNull();
      }
      expect(repositoryMock.updateFeaturePreference).toHaveBeenCalledWith('user-123', 'resume', null, null);
    });

    it('should return error for invalid feature type', async () => {
      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'invalid_feature' as never,
        providerId: 'provider-123',
        modelId: 'model-123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid feature type');
      }
    });

    it('should return error when providerId is missing but modelId is provided', async () => {
      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'resume',
        providerId: null,
        modelId: 'model-123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Provider ID is required');
      }
    });

    it('should return error when provider is not found', async () => {
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'resume',
        providerId: 'non-existent',
        modelId: 'model-123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Provider');
        expect(result.code).toBe('NOT_FOUND');
      }
    });

    it('should return error when model is not found in provider', async () => {
      const provider = createMockProvider();
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [provider],
      });

      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'resume',
        providerId: 'provider-123',
        modelId: 'non-existent-model',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Model');
        expect(result.error).toContain('not found');
      }
    });

    it('should normalize model by modelKey', async () => {
      const provider = createMockProvider({
        models: [createMockModel({ id: 'model-uuid', modelKey: 'gpt-4o' })],
      });
      const updatedSettings = createMockAISettings();

      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [provider],
      });
      repositoryMock.updateFeaturePreference.mockResolvedValue(updatedSettings);

      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'resume',
        providerId: 'provider-123',
        modelId: 'gpt-4o',
      });

      expect(result.success).toBe(true);
      expect(repositoryMock.updateFeaturePreference).toHaveBeenCalledWith(
        'user-123',
        'resume',
        'provider-123',
        'model-uuid'
      );
    });

    it('should normalize model by case-insensitive modelKey', async () => {
      const provider = createMockProvider({
        models: [createMockModel({ id: 'model-uuid', modelKey: 'GPT-4o' })],
      });
      const updatedSettings = createMockAISettings();

      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [provider],
      });
      repositoryMock.updateFeaturePreference.mockResolvedValue(updatedSettings);

      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'resume',
        providerId: 'provider-123',
        modelId: 'gpt-4o',
      });

      expect(result.success).toBe(true);
    });

    it('should update provider without model (provider-only preference)', async () => {
      const provider = createMockProvider();
      const updatedSettings = createMockAISettings();

      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [provider],
      });
      repositoryMock.updateFeaturePreference.mockResolvedValue(updatedSettings);

      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'resume',
        providerId: 'provider-123',
        modelId: null,
      });

      expect(result.success).toBe(true);
      expect(repositoryMock.updateFeaturePreference).toHaveBeenCalledWith(
        'user-123',
        'resume',
        'provider-123',
        null
      );
    });

    it('should return error when providers cannot be fetched', async () => {
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: false,
        error: 'API error',
        code: 'INTERNAL_ERROR',
      });

      const result = await service.updateFeaturePreference({
        userId: 'user-123',
        feature: 'resume',
        providerId: 'provider-123',
        modelId: 'model-123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Could not fetch providers');
      }
    });
  });

  describe('updateAllPreferences', () => {
    it('should upsert all preferences and return resolved settings', async () => {
      const input = {
        userId: 'user-123',
        resumeProviderId: 'prov-1',
        resumeModelId: 'mod-1',
      };
      const updatedSettings = createMockAISettings(input);
      const provider = createMockProvider({ id: 'prov-1' });

      repositoryMock.upsert.mockResolvedValue(updatedSettings);
      repositoryMock.findByUserId.mockResolvedValue(updatedSettings);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [provider],
      });

      const result = await service.updateAllPreferences('user-123', input);

      expect(result.success).toBe(true);
      expect(repositoryMock.upsert).toHaveBeenCalledWith(input);
    });

    it('should handle upsert failure', async () => {
      repositoryMock.upsert.mockRejectedValue(new Error('Upsert failed'));

      const result = await service.updateAllPreferences('user-123', {
        userId: 'user-123',
        resumeProviderId: 'prov-1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Upsert failed');
      }
    });
  });

  describe('clearSettings', () => {
    it('should delete all settings for user', async () => {
      repositoryMock.delete.mockResolvedValue(createMockAISettings());

      const result = await service.clearSettings('user-123');

      expect(result.success).toBe(true);
      expect(repositoryMock.delete).toHaveBeenCalledWith('user-123');
    });

    it('should handle delete failure', async () => {
      repositoryMock.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await service.clearSettings('user-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Delete failed');
      }
    });
  });

  describe('resolveProviderForFeature', () => {
    it('should resolve provider for feature and return success result', async () => {
      const result = await service.resolveProviderForFeature('user-123', 'resume');

      expect(result.success).toBe(true);
    });

    it('should pass override model ID when provided', async () => {
      const result = await service.resolveProviderForFeature('user-123', 'resume', 'override-model');

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should wrap repository errors with service error context', async () => {
      repositoryMock.findByUserId.mockRejectedValue(new Error('Connection timeout'));

      const result = await service.getSettings('user-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Connection timeout');
        expect(result.code).toBeDefined();
      }
    });

    it('should handle concurrent operations gracefully', async () => {
      repositoryMock.findByUserId.mockResolvedValue(null);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [],
      });

      const results = await Promise.all([
        service.getSettings('user-1'),
        service.getSettings('user-2'),
        service.getSettings('user-3'),
      ]);

      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty userId', async () => {
      repositoryMock.findByUserId.mockResolvedValue(null);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.getSettings('');

      expect(result.success).toBe(true);
      expect(repositoryMock.findByUserId).toHaveBeenCalledWith('');
    });

    it('should handle special characters in IDs', async () => {
      const specialUserId = 'user-123!@#$%^&*()';
      repositoryMock.findByUserId.mockResolvedValue(null);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.getSettings(specialUserId);

      expect(result.success).toBe(true);
      expect(repositoryMock.findByUserId).toHaveBeenCalledWith(specialUserId);
    });

    it('should handle provider with no models', async () => {
      const settings = createMockAISettings({
        resumeProviderId: 'provider-123',
        resumeModelId: 'model-123',
      });
      const providerNoModels = createMockProvider({ models: [] });

      repositoryMock.findByUserId.mockResolvedValue(settings);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: [providerNoModels],
      });

      const result = await service.getSettings('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        const resumeFeature = result.data.features.find(f => f.feature.id === 'resume');
        expect(resumeFeature?.providerName).toBe('My OpenAI');
        expect(resumeFeature?.modelName).toBe('model-123');
      }
    });

    it('should handle multiple providers', async () => {
      const settings = createMockAISettings({
        resumeProviderId: 'provider-1',
        resumeModelId: 'model-1',
        coverLetterProviderId: 'provider-2',
        coverLetterModelId: 'model-2',
      });
      const providers = [
        createMockProvider({
          id: 'provider-1',
          name: 'OpenAI',
          models: [createMockModel({ id: 'model-1', name: 'GPT-4' })],
        }),
        createMockProvider({
          id: 'provider-2',
          name: 'Anthropic',
          models: [createMockModel({ id: 'model-2', name: 'Claude' })],
        }),
      ];

      repositoryMock.findByUserId.mockResolvedValue(settings);
      mockApiProviderService.getUserProvidersWithModels.mockResolvedValue({
        success: true,
        data: providers,
      });

      const result = await service.getSettings('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        const resume = result.data.features.find(f => f.feature.id === 'resume');
        expect(resume?.providerName).toBe('OpenAI');
        expect(resume?.modelName).toBe('GPT-4');

        const coverLetter = result.data.features.find(f => f.feature.id === 'coverLetter');
        expect(coverLetter?.providerName).toBe('Anthropic');
        expect(coverLetter?.modelName).toBe('Claude');
      }
    });
  });
});
