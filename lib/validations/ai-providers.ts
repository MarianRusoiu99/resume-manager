/**
 * AI Provider Validation Schemas
 * 
 * Zod schemas for AI provider configuration, API key validation,
 * and provider type management.
 * 
 * IMPORTANT: Provider types are derived from Prisma's ProviderType enum
 * to ensure consistency across the application.
 */

import { z } from 'zod';
import { ProviderType } from '@prisma/client';

// ============================================================================
// PROVIDER TYPE SCHEMAS
// ============================================================================

/**
 * Currently supported AI providers
 * Note: Only include providers that have working implementations
 * 
 * - OPENAI: Full support via @ai-sdk/openai
 * - GOOGLE: Full support via @ai-sdk/google
 * - ANTHROPIC: Full support via @ai-sdk/anthropic
 * 
 * COHERE and MISTRAL are defined in Prisma but not yet implemented.
 */
export const SUPPORTED_PROVIDERS = ['OPENAI', 'GOOGLE', 'ANTHROPIC'] as const;
export type SupportedProviderType = typeof SUPPORTED_PROVIDERS[number];

/**
 * Provider type schema (lowercase for API input)
 * Maps to the supported providers
 */
export const providerTypeSchema = z.enum(['openai', 'google', 'anthropic']);

/**
 * Alias for backward compatibility with shared-inputs consumers.
 * Same schema as providerTypeSchema — prefer providerTypeSchema in new code.
 */
export const aiProviderSchema = providerTypeSchema;
export type AIProviderType = z.infer<typeof aiProviderSchema>;

/**
 * All provider types from Prisma (for reference only)
 */
export const allProviderTypesSchema = z.nativeEnum(ProviderType);

// ============================================================================
// API PROVIDER SCHEMAS
// ============================================================================

/**
 * API key format validators by provider
 */
const API_KEY_PATTERNS: Record<SupportedProviderType, RegExp> = {
  OPENAI: /^sk-[a-zA-Z0-9-_]{20,}$/,
  GOOGLE: /^AIza[a-zA-Z0-9_-]{35}$/,
  ANTHROPIC: /^sk-ant-[a-zA-Z0-9-_]{95,}$/,
};

/**
 * API key minimum lengths by provider
 */
const API_KEY_MIN_LENGTHS: Record<SupportedProviderType, number> = {
  OPENAI: 30,
  GOOGLE: 35,
  ANTHROPIC: 100,
};

/**
 * Schema for adding a new API provider
 */
export const addProviderSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  provider: providerTypeSchema,
  apiKey: z.string()
    .min(10, 'API key is too short')
    .max(500, 'API key is too long'),
});

/**
 * Schema for updating an API provider
 */
export const updateProviderSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  apiKey: z.string()
    .min(10, 'API key is too short')
    .max(500, 'API key is too long')
    .optional(),
  isActive: z.boolean().optional(),
  models: z.array(z.string()).min(1, 'At least one model is required').optional(),
});

export type AddProviderInput = z.infer<typeof addProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;

/**
 * Simplified add-provider schema used by client-side forms.
 * Re-exports the same structure previously in shared-inputs.ts.
 */
export const addApiProviderInputSchema = addProviderSchema;
export type AddApiProviderInput = z.infer<typeof addApiProviderInputSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate API key format for a specific provider
 */
export function validateApiKeyFormat(apiKey: string, provider: string): boolean {
  const upperProvider = provider.toUpperCase() as SupportedProviderType;
  const pattern = API_KEY_PATTERNS[upperProvider];
  
  if (!pattern) {
    // Unknown provider - just check minimum length
    return apiKey.length >= 10;
  }
  
  return pattern.test(apiKey);
}

/**
 * Get the minimum required length for a provider's API key
 */
export function getApiKeyMinLength(provider: string): number {
  const upperProvider = provider.toUpperCase() as SupportedProviderType;
  return API_KEY_MIN_LENGTHS[upperProvider] || 10;
}

/**
 * Check if a provider type is currently supported
 */
export function isProviderSupported(provider: string): provider is Lowercase<SupportedProviderType> {
  return SUPPORTED_PROVIDERS.includes(provider.toUpperCase() as SupportedProviderType);
}

/**
 * Convert lowercase provider to Prisma enum value
 */
export function toProviderType(provider: string): ProviderType {
  return provider.toUpperCase() as ProviderType;
}

/**
 * Convert Prisma enum to lowercase API value
 */
export function fromProviderType(provider: ProviderType): string {
  return provider.toLowerCase();
}
