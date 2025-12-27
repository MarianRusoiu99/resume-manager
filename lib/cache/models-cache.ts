/**
 * AI Models Cache
 * 
 * In-memory cache for AI provider models to reduce API calls.
 * Models are cached per provider with a configurable TTL.
 */

import { SimpleCache } from './simple-cache';

interface AIModel {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
}

interface CachedProviderModels {
  providerId: string;
  providerType: string;
  models: AIModel[];
  fetchedAt: number;
}

/**
 * Cache TTL in seconds (1 hour)
 * Models don't change frequently, so we can cache them longer
 */
const MODEL_CACHE_TTL = 3600;

/**
 * Models cache instance
 */
class ModelsCache extends SimpleCache<CachedProviderModels> {
  constructor() {
    super(MODEL_CACHE_TTL);
  }

  /**
   * Get cache key for a provider
   */
  private getKey(userId: string, providerId: string): string {
    return `models:${userId}:${providerId}`;
  }

  /**
   * Get cached models for a provider
   */
  getProviderModels(userId: string, providerId: string): AIModel[] | null {
    const cached = this.get(this.getKey(userId, providerId));
    return cached?.models ?? null;
  }

  /**
   * Cache models for a provider
   */
  setProviderModels(
    userId: string,
    providerId: string,
    providerType: string,
    models: AIModel[]
  ): void {
    this.set(this.getKey(userId, providerId), {
      providerId,
      providerType,
      models,
      fetchedAt: Date.now(),
    });
  }

  /**
   * Invalidate cache for a provider
   */
  invalidateProvider(userId: string, providerId: string): void {
    this.delete(this.getKey(userId, providerId));
  }

  /**
   * Invalidate all models cache for a user
   * Call this when user adds/removes/updates providers
   */
  invalidateUser(): void {
    // Since SimpleCache doesn't support prefix deletion,
    // we'll need to track user keys separately
    // For now, clear all (safe but less efficient)
    this.clear();
  }
}

/**
 * Singleton models cache instance
 */
export const modelsCache = new ModelsCache();

/**
 * Helper to get or fetch models with caching
 */
export async function getCachedModels(
  userId: string,
  providerId: string,
  providerType: string,
  fetchModels: () => Promise<AIModel[]>
): Promise<AIModel[]> {
  // Try cache first
  const cached = modelsCache.getProviderModels(userId, providerId);
  if (cached) {
    return cached;
  }

  // Fetch from provider
  const models = await fetchModels();
  
  // Cache for future requests
  modelsCache.setProviderModels(userId, providerId, providerType, models);
  
  return models;
}
