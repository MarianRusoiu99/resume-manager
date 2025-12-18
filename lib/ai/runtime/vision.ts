import type { ResolvedAIModel } from './types';

const DEFAULT_VISION_MODELS: Record<string, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.0-flash',
};

export function getDefaultVisionModelKey(providerType: string): string | null {
  return DEFAULT_VISION_MODELS[providerType.toLowerCase()] ?? null;
}

export function resolveVisionModelKey(resolved: Pick<ResolvedAIModel, 'providerType' | 'modelKey'>): string {
  return getDefaultVisionModelKey(resolved.providerType) ?? resolved.modelKey;
}
