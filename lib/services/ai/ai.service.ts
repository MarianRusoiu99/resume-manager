import { resolveAIModelOrThrow } from '@/lib/ai/runtime';
import { enhanceText } from '@/lib/ai/features/enhance';
import { optimizeResume } from '@/lib/ai/agents/resume-optimization/agent';
import { generateCoverLetter } from '@/lib/ai/agents/cover-letter/agent';
import { success, failure, type ServiceResult } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { apiProviderService } from '@/lib/services/api-providers';
import { withResilience } from '@/lib/resilience';
import type { ResolvedAIModel, AIModelFeature } from '@/lib/ai/runtime/types';
import type { Resume } from '@/lib/validations/jsonresume';
import type { ContentType } from '@/lib/validations/settings';

export interface EnhanceTextInput {
  content: string;
  instructions: string;
  context?: string;
  contentType: ContentType;
  modelId?: string;
  attachments?: Array<{
    type: string;
    content: string;
    name: string;
  }>;
}

export interface EnhanceTextResult {
  enhancedContent: string;
  metadata: {
    model: string;
    provider: string;
    contentType: ContentType;
  };
}

export interface OptimizeResumeInput {
  jobDescription: string;
  userResume: Resume;
  modelId?: string;
}

export interface OptimizeResumeResult {
  resume: Resume;
  jobTitle: string;
  companyName: string;
}

export interface GenerateCoverLetterInput {
  jobDescription: string;
  userResume: Resume;
  modelId?: string;
}

export interface GenerateCoverLetterResult {
  content: string;
  subject?: string;
  jobTitle?: string;
  companyName?: string;
  recipientName?: string;
}

export interface IAIService {
  enhanceText(userId: string, input: EnhanceTextInput): Promise<ServiceResult<EnhanceTextResult>>;
  optimizeResume(userId: string, input: OptimizeResumeInput): Promise<ServiceResult<OptimizeResumeResult>>;
  generateCoverLetter(userId: string, input: GenerateCoverLetterInput): Promise<ServiceResult<GenerateCoverLetterResult>>;
}

export class AIService implements IAIService {
  private async executeWithResilience<T>(
    userId: string,
    feature: AIModelFeature,
    modelId: string | undefined,
    operation: (resolvedModel: ResolvedAIModel) => Promise<T>
  ): Promise<ServiceResult<T>> {
    const resilienceOptions = {
      retry: 'ai' as const,
      timeout: 'ai' as const,
      circuitBreaker: `ai-${feature}`,
      operationName: `AI ${feature}`,
    };

    try {
      // We still handle fallback manually because it's a domain-specific logic 
      // (switching models/providers), while withResilience handles transient faults.
      return await this.withFallback(userId, feature, modelId, (resolvedModel) => 
        withResilience(() => operation(resolvedModel), resilienceOptions)
      );
    } catch (error) {
      logger.error(`Resilient AI operation failed for ${feature}`, error);
      return failure(`AI operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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

    const fallbacks = modelsResult.data.allModels.filter((m) => m.id !== primaryModel?.modelId);
    
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
    
    return this.executeWithResilience(userId, 'enhance', input.modelId, async (resolvedModel) => {
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

  async optimizeResume(userId: string, input: OptimizeResumeInput): Promise<ServiceResult<OptimizeResumeResult>> {
    return this.executeWithResilience(userId, 'resume', input.modelId, async (resolvedModel) => {
      return optimizeResume({
        model: resolvedModel.provider.createLanguageModel(resolvedModel.modelKey),
        jobDescription: input.jobDescription,
        userResume: input.userResume,
        userId,
      });
    });
  }

  async generateCoverLetter(userId: string, input: GenerateCoverLetterInput): Promise<ServiceResult<GenerateCoverLetterResult>> {
    return this.executeWithResilience(userId, 'coverLetter', input.modelId, async (resolvedModel) => {
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
