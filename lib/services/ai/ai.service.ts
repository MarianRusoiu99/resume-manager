import { resolveAIModelOrThrow } from '@/lib/ai/runtime';
import { enhanceText, streamEnhanceText } from '@/lib/ai/features/enhance';
import { optimizeResume } from '@/lib/ai/agents/resume-optimization/agent';
import { generateCoverLetter } from '@/lib/ai/agents/cover-letter/agent';
import { success, failure, type ServiceResult } from '@/lib/types/service-result';
import { logger } from '@/lib/utils/logger';
import { apiProviderService } from '@/lib/services/api-providers';
import type { 
  IAIService, 
  EnhanceTextInput, 
  EnhanceTextResult,
  OptimizeResumeInput,
  OptimizeResumeResult,
  GenerateCoverLetterInput,
  GenerateCoverLetterResult
} from '../interfaces/ai.service.interface';
import type { ResolvedAIModel, AIModelFeature } from '@/lib/ai/runtime/types';

export class AIService implements IAIService {
  private async withFallback<T>(
    userId: string,
    feature: AIModelFeature,
    modelId: string | undefined,
    operation: (resolvedModel: ResolvedAIModel) => Promise<T>
  ): Promise<ServiceResult<T>> {
    let primaryModel: ResolvedAIModel | null = null;
    try {
      primaryModel = await resolveAIModelOrThrow({ userId, feature, modelId });
      const result = await operation(primaryModel);
      return success(result);
    } catch (error) {
      logger.warn(`Primary AI model failed for ${feature}, attempting fallback`, {
        userId,
        feature,
        modelId: primaryModel?.modelId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const modelsResult = await apiProviderService.getAvailableModels(userId);
    if (!modelsResult.success) return failure('No AI providers available');

    const fallbacks = modelsResult.data.allModels.filter((m: any) => m.id !== primaryModel?.modelId);
    
    for (const fallback of fallbacks) {
      try {
        const providerResult = await apiProviderService.getProviderInstance(fallback.providerId, userId);
        if (!providerResult.success) continue;

        const resolvedFallback: ResolvedAIModel = {
          provider: providerResult.data.provider,
          providerId: fallback.providerId,
          providerType: providerResult.data.providerType,
          modelId: fallback.id,
          modelKey: fallback.modelKey,
          feature,
        };

        logger.info(`Using fallback model for ${feature}`, { modelId: fallback.id });
        const result = await operation(resolvedFallback);
        return success(result);
      } catch (error) {
        logger.warn(`Fallback AI model ${fallback.id} failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return failure(`AI operation failed for ${feature} after trying all available providers.`);
  }

  async enhanceText(userId: string, input: EnhanceTextInput): Promise<ServiceResult<EnhanceTextResult>> {
    const hasImages = input.attachments?.some(a => a.type.startsWith('image/'));
    
    return this.withFallback(userId, 'enhance', input.modelId, async (resolvedModel) => {
      let modelKey = resolvedModel.modelKey;
      
      if (hasImages) {
        const { resolveVisionModelKey } = await import('@/lib/ai/runtime/vision');
        modelKey = resolveVisionModelKey(resolvedModel);
      }

      return enhanceText(
        resolvedModel.provider.createLanguageModel(modelKey),
        resolvedModel.providerType,
        modelKey,
        {
          content: input.content,
          instructions: input.instructions,
          context: input.context,
          contentType: input.contentType,
          attachments: input.attachments,
        },
        userId
      );
    });
  }

  async streamEnhanceText(userId: string, input: EnhanceTextInput): Promise<ServiceResult<Response>> {
    try {
      const resolvedModel = await resolveAIModelOrThrow({
        userId,
        feature: 'enhance',
        modelId: input.modelId,
      });

      const hasImages = input.attachments?.some(a => a.type.startsWith('image/'));
      let modelKey = resolvedModel.modelKey;

      if (hasImages) {
        const { resolveVisionModelKey } = await import('@/lib/ai/runtime/vision');
        modelKey = resolveVisionModelKey(resolvedModel);
      }

      const result = await streamEnhanceText(
        resolvedModel.provider.createLanguageModel(modelKey),
        {
          content: input.content,
          instructions: input.instructions,
          context: input.context,
          contentType: input.contentType,
          attachments: input.attachments,
        },
        userId
      );

      return success(result.toTextStreamResponse());
    } catch (error) {
      logger.error('AI streaming enhancement failed', error);
      return failure(error instanceof Error ? error.message : 'AI streaming enhancement failed');
    }
  }

  async optimizeResume(userId: string, input: OptimizeResumeInput): Promise<ServiceResult<OptimizeResumeResult>> {
    return this.withFallback(userId, 'resume', input.modelId, async (resolvedModel) => {
      return optimizeResume({
        model: resolvedModel.provider.createLanguageModel(resolvedModel.modelKey),
        jobDescription: input.jobDescription,
        userResume: input.userResume,
        userId,
      });
    });
  }

  async generateCoverLetter(userId: string, input: GenerateCoverLetterInput): Promise<ServiceResult<GenerateCoverLetterResult>> {
    return this.withFallback(userId, 'coverLetter', input.modelId, async (resolvedModel) => {
      return generateCoverLetter({
        model: resolvedModel.provider.createLanguageModel(resolvedModel.modelKey),
        jobDescription: input.jobDescription,
        userResume: input.userResume,
        userId,
      });
    });
  }
}

export const aiService = new AIService();
