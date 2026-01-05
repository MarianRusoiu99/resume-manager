import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from './ai.service';
import { success, failure } from '@/lib/types/service-result';

import { resolveAIModelOrThrow } from '@/lib/ai/runtime';
import { enhanceText } from '@/lib/ai/features/enhance';
import { optimizeResume } from '@/lib/ai/agents/resume-optimization/agent';
import { generateCoverLetter } from '@/lib/ai/agents/cover-letter/agent';
import { apiProviderService } from '@/lib/services/api-providers';
import type { 
  EnhanceTextInput, 
  OptimizeResumeInput, 
  GenerateCoverLetterInput 
} from '../interfaces/ai.service.interface';

// Mock the dependencies
vi.mock('@/lib/ai/runtime', () => ({
  resolveAIModelOrThrow: vi.fn(),
}));

vi.mock('@/lib/ai/features/enhance', () => ({
  enhanceText: vi.fn(),
}));

vi.mock('@/lib/ai/agents/resume-optimization/agent', () => ({
  optimizeResume: vi.fn(),
}));

vi.mock('@/lib/ai/agents/cover-letter/agent', () => ({
  generateCoverLetter: vi.fn(),
}));

vi.mock('@/lib/services/api-providers', () => ({
  apiProviderService: {
    getAvailableModels: vi.fn(),
    getProviderInstance: vi.fn(),
  },
}));

describe('AIService', () => {
  let service: AIService;
  const mockResolveAIModelOrThrow = vi.mocked(resolveAIModelOrThrow);
  const mockEnhanceText = vi.mocked(enhanceText);
  const mockOptimizeResume = vi.mocked(optimizeResume);
  const mockGenerateCoverLetter = vi.mocked(generateCoverLetter);
  const mockApiProviderService = vi.mocked(apiProviderService);

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AIService();
  });


  describe('enhanceText', () => {
    const mockResolvedModel = {
      provider: {
        createLanguageModel: vi.fn(() => 'mock-model'),
      },
      providerId: 'openai',
      providerType: 'openai',
      modelId: 'gpt-4',
      modelKey: 'gpt-4',
      feature: 'enhance' as const,
    } as any;

    it('should enhance text successfully', async () => {
      const userId = 'user-123';
      const input = {
        content: 'Original text',
        instructions: 'Make it better',
        contentType: 'text' as const,
        modelId: 'gpt-4',
      };

      mockResolveAIModelOrThrow.mockResolvedValue(mockResolvedModel as any);
      mockEnhanceText.mockResolvedValue({
        enhancedContent: 'Enhanced text',
        metadata: {
          model: 'gpt-4',
          provider: 'openai',
          contentType: 'text',
        },
      } as any);

      const result = await service.enhanceText(userId, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enhancedContent).toBe('Enhanced text');
      }
      expect(mockResolveAIModelOrThrow).toHaveBeenCalledWith({
        userId,
        feature: 'enhance',
        modelId: 'gpt-4',
      });
      expect(mockEnhanceText).toHaveBeenCalled();
    });

    it('should handle errors and attempt fallback', async () => {
      const userId = 'user-123';
      const input: EnhanceTextInput = {
        content: 'Original text',
        instructions: 'Make it better',
        contentType: 'text',
      };

      mockResolveAIModelOrThrow.mockRejectedValue(new Error('Primary model failed'));
      mockApiProviderService.getAvailableModels.mockResolvedValue(
        success({
          allModels: [
            { id: 'gpt-3.5', providerId: 'openai', modelKey: 'gpt-3.5-turbo' },
          ],
          providers: [],
        } as any)
      );
      mockApiProviderService.getProviderInstance.mockResolvedValue(
        success({
          provider: {
            createLanguageModel: vi.fn(() => 'fallback-model'),
          } as any,
          providerType: 'openai',
        } as any)
      );
      mockEnhanceText.mockResolvedValue({
        enhancedContent: 'Enhanced with fallback',
        metadata: {
          model: 'gpt-3.5',
          provider: 'openai',
          contentType: 'text',
        },
      } as any);

      const result = await service.enhanceText(userId, input);

      expect(result.success).toBe(true);
      expect(mockApiProviderService.getAvailableModels).toHaveBeenCalledWith(userId);
    });

    it('should fail when no AI providers are available', async () => {
      const userId = 'user-123';
      const input: EnhanceTextInput = {
        content: 'Original text',
        instructions: 'Make it better',
        contentType: 'text',
      };

      mockResolveAIModelOrThrow.mockRejectedValue(new Error('No primary model'));
      mockApiProviderService.getAvailableModels.mockResolvedValue(
        failure('No providers available')
      );

      const result = await service.enhanceText(userId, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No AI providers available');
      }
    });

    it('should handle vision models when attachments include images', async () => {
      const userId = 'user-123';
      const input: EnhanceTextInput = {
        content: 'Analyze this image',
        instructions: 'Describe what you see',
        contentType: 'text',
        attachments: [{ type: 'image/png', content: 'base64data', name: 'test.png' }],
      };

      vi.doMock('@/lib/ai/runtime/vision', () => ({
        resolveVisionModelKey: vi.fn(() => 'gpt-4-vision'),
      }));

      mockResolveAIModelOrThrow.mockResolvedValue(mockResolvedModel as any);
      mockEnhanceText.mockResolvedValue({
        enhancedContent: 'Image description',
        metadata: {
          model: 'gpt-4-vision',
          provider: 'openai',
          contentType: 'text',
        },
      } as any);

      const result = await service.enhanceText(userId, input);

      expect(result.success).toBe(true);
    });
  });

  describe('optimizeResume', () => {
    const mockResolvedModel = {
      provider: {
        createLanguageModel: vi.fn(() => 'mock-model'),
      },
      providerId: 'openai',
      providerType: 'openai',
      modelId: 'gpt-4',
      modelKey: 'gpt-4',
      feature: 'resume' as const,
    };

    it('should optimize resume successfully', async () => {
      const userId = 'user-123';
      const input = {
        jobDescription: 'Software Engineer position',
        userResume: { basics: { name: 'John Doe' } } as any,
        modelId: 'gpt-4',
      };

      mockResolveAIModelOrThrow.mockResolvedValue(mockResolvedModel as any);
      mockOptimizeResume.mockResolvedValue({
        resume: { basics: { name: 'John Doe', summary: 'Optimized' } },
        jobTitle: 'Software Engineer',
        companyName: 'Tech Corp',
      });

      const result = await service.optimizeResume(userId, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('resume');
        expect(result.data.jobTitle).toBe('Software Engineer');
      }
      expect(mockOptimizeResume).toHaveBeenCalledWith({
        model: 'mock-model',
        jobDescription: input.jobDescription,
        userResume: input.userResume,
        userId,
      });
    });

    it('should handle optimization errors', async () => {
      const userId = 'user-123';
      const input = {
        jobDescription: 'Software Engineer position',
        userResume: { basics: { name: 'John Doe' } } as any,
      };

      mockResolveAIModelOrThrow.mockRejectedValue(new Error('Model unavailable'));
      mockApiProviderService.getAvailableModels.mockResolvedValue(
        failure('No models available')
      );

      const result = await service.optimizeResume(userId, input);

      expect(result.success).toBe(false);
    });
  });

  describe('generateCoverLetter', () => {
    const mockResolvedModel = {
      provider: {
        createLanguageModel: vi.fn(() => 'mock-model'),
      },
      providerId: 'openai',
      providerType: 'openai',
      modelId: 'gpt-4',
      modelKey: 'gpt-4',
      feature: 'coverLetter' as const,
    };

    it('should generate cover letter successfully', async () => {
      const userId = 'user-123';
      const input = {
        jobDescription: 'Software Engineer position',
        userResume: { basics: { name: 'John Doe' } } as any,
        modelId: 'gpt-4',
      };

      mockResolveAIModelOrThrow.mockResolvedValue(mockResolvedModel as any);
      mockGenerateCoverLetter.mockResolvedValue({
        content: 'Dear Hiring Manager, ...',
        jobTitle: 'Software Engineer',
        companyName: 'Tech Corp',
      });

      const result = await service.generateCoverLetter(userId, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('content');
        expect(result.data.jobTitle).toBe('Software Engineer');
      }
      expect(mockGenerateCoverLetter).toHaveBeenCalledWith({
        model: 'mock-model',
        jobDescription: input.jobDescription,
        userResume: input.userResume,
        userId,
      });
    });

    it('should handle generation errors', async () => {
      const userId = 'user-123';
      const input = {
        jobDescription: 'Software Engineer position',
        userResume: { basics: { name: 'John Doe' } } as any,
      };

      mockResolveAIModelOrThrow.mockRejectedValue(new Error('Model unavailable'));
      mockApiProviderService.getAvailableModels.mockResolvedValue(
        failure('No models available')
      );

      const result = await service.generateCoverLetter(userId, input);

      expect(result.success).toBe(false);
    });
  });

  describe('fallback mechanism', () => {
    it('should try multiple fallback models before giving up', async () => {
      const userId = 'user-123';
      const input: EnhanceTextInput = {
        content: 'Test content',
        instructions: 'Enhance this',
        contentType: 'text',
      };

      mockResolveAIModelOrThrow.mockRejectedValue(new Error('Primary failed'));
      mockApiProviderService.getAvailableModels.mockResolvedValue(
        success({
          allModels: [
            { id: 'model-1', providerId: 'provider-1', modelKey: 'key-1' },
            { id: 'model-2', providerId: 'provider-2', modelKey: 'key-2' },
          ],
          providers: [],
        } as any)
      );

      // First fallback fails
      mockApiProviderService.getProviderInstance
        .mockResolvedValueOnce(
          success({
            provider: {
              createLanguageModel: vi.fn(() => 'fallback-1'),
            } as any,
            providerType: 'openai',
          } as any)
        )
        .mockResolvedValueOnce(
          success({
            provider: {
              createLanguageModel: vi.fn(() => 'fallback-2'),
            } as any,
            providerType: 'anthropic',
          } as any)
        );

      mockEnhanceText
        .mockRejectedValueOnce(new Error('Fallback 1 failed'))
        .mockResolvedValueOnce({
          enhancedContent: 'Success with fallback 2',
          metadata: {
            model: 'model-2',
            provider: 'anthropic',
            contentType: 'text',
          },
        } as any);

      const result = await service.enhanceText(userId, input);

      expect(result.success).toBe(true);
      expect(mockEnhanceText).toHaveBeenCalledTimes(2);
    });

    it('should fail after all fallbacks are exhausted', async () => {
      const userId = 'user-123';
      const input: EnhanceTextInput = {
        content: 'Test content',
        instructions: 'Enhance this',
        contentType: 'text',
      };

      mockResolveAIModelOrThrow.mockRejectedValue(new Error('Primary failed'));
      mockApiProviderService.getAvailableModels.mockResolvedValue(
        success({
          allModels: [
            { id: 'model-1', providerId: 'provider-1', modelKey: 'key-1' },
          ],
          providers: [],
        } as any)
      );

      mockApiProviderService.getProviderInstance.mockResolvedValue(
        success({
          provider: {
            createLanguageModel: vi.fn(() => 'fallback'),
          } as any,
          providerType: 'openai',
        } as any)
      );

      mockEnhanceText.mockRejectedValue(new Error('All models failed'));

      const result = await service.enhanceText(userId, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('failed for enhance after trying all available providers');
      }
    });
  });
});
