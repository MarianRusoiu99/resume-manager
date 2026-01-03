import { auditLogService } from '@/lib/services';
import { calculateAICost } from '../../pricing';
import type { OrchestratorOptions, NormalizedUsage } from './types';

/**
 * Logs AI usage for auditing
 */
export function logUsage(
  options: OrchestratorOptions,
  usage: NormalizedUsage,
  finishReason: string,
  feature: string
): void {
  const cost = calculateAICost(options.modelId, usage);

  auditLogService.logAsync({
    userId: options.userId,
    action: 'AI_GENERATE' as any,
    resourceType: 'AI_MODEL',
    resourceId: options.modelId,
    metadata: {
      feature,
      usage,
      cost,
      finishReason,
    },
  });
}

/**
 * Normalizes AI SDK usage to our format
 */
export function normalizeUsage(usage: {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
} | undefined): NormalizedUsage {
  const promptTokens = usage?.promptTokens ?? usage?.inputTokens ?? 0;
  const completionTokens = usage?.completionTokens ?? usage?.outputTokens ?? 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: usage?.totalTokens ?? (promptTokens + completionTokens),
  };
}
