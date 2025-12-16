import type { AIModel } from '@/lib/ai/providers';

/**
 * Filter models to only include text/chat models.
 * Excludes image, audio, embedding, and moderation models.
 */
export function filterTextModels(models: AIModel[]): AIModel[] {
  return models.filter((model) => {
    const modelId = model.id.toLowerCase();
    const modelName = (model.name || '').toLowerCase();

    const isNonTextModel =
      modelId.includes('dall-e') ||
      modelId.includes('whisper') ||
      modelId.includes('tts') ||
      modelId.includes('embedding') ||
      modelId.includes('moderation') ||
      modelId.includes('vision') ||
      modelId.startsWith('text-embedding') ||
      modelName.includes('vision') ||
      modelName.includes('image') ||
      modelName.includes('audio');

    return !isNonTextModel;
  });
}
