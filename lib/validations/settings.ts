/**
 * Settings Validation Schemas
 * 
 * Centralized Zod schemas for Settings and AI configuration.
 * Single source of truth for all settings-related validation.
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

// ============================================================================
// AI SETTINGS SCHEMAS
// ============================================================================

/**
 * AI feature types that can have custom model preferences
 */
export const aiFeatureSchema = z.enum(['resume', 'coverLetter', 'enhance', 'template']);
export type AIFeature = z.infer<typeof aiFeatureSchema>;

/**
 * Schema for updating a feature's AI model preference
 */
export const updateAIPreferenceSchema = z.object({
  feature: aiFeatureSchema,
  providerId: z.string().cuid().nullable(),
  modelId: z.string().nullable(),
});

/**
 * Schema for batch updating all AI preferences
 */
export const updateAllAIPreferencesSchema = z.object({
  resumeProviderId: z.string().cuid().nullable().optional(),
  resumeModelId: z.string().nullable().optional(),
  coverLetterProviderId: z.string().cuid().nullable().optional(),
  coverLetterModelId: z.string().nullable().optional(),
  enhanceProviderId: z.string().cuid().nullable().optional(),
  enhanceModelId: z.string().nullable().optional(),
  templateProviderId: z.string().cuid().nullable().optional(),
  templateModelId: z.string().nullable().optional(),
});

export type UpdateAIPreferenceInput = z.infer<typeof updateAIPreferenceSchema>;
export type UpdateAllAIPreferencesInput = z.infer<typeof updateAllAIPreferencesSchema>;

// ============================================================================
// AI ENHANCEMENT SCHEMAS
// ============================================================================

/**
 * Content types that can be enhanced
 */
export const contentTypeSchema = z.enum(['text', 'html', 'css', 'markdown']);
export type ContentType = z.infer<typeof contentTypeSchema>;

/**
 * Maximum content length for AI enhancement (approx ~12k tokens)
 */
export const MAX_CONTENT_LENGTH = 50000;
export const MAX_INSTRUCTIONS_LENGTH = 1000;
export const MAX_CONTEXT_LENGTH = 5000;

/**
 * Schema for AI text enhancement request
 */
export const enhanceRequestSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(MAX_CONTENT_LENGTH, `Content must be less than ${MAX_CONTENT_LENGTH} characters`),
  instructions: z.string()
    .min(1, 'Instructions are required')
    .max(MAX_INSTRUCTIONS_LENGTH, `Instructions must be less than ${MAX_INSTRUCTIONS_LENGTH} characters`),
  context: z.string()
    .max(MAX_CONTEXT_LENGTH, `Context must be less than ${MAX_CONTEXT_LENGTH} characters`)
    .optional(),
  contentType: contentTypeSchema.default('text'),
  modelId: z.string().optional(),
  attachments: z.array(z.object({
    type: z.string(),
    content: z.string(),
    name: z.string(),
  })).optional(),
});

export type EnhanceRequestInput = z.infer<typeof enhanceRequestSchema>;

/**
 * Schema for AI enhancement response
 */
export const enhanceResponseSchema = z.object({
  success: z.boolean(),
  enhancedContent: z.string(),
  metadata: z.object({
    model: z.string(),
    provider: z.string(),
    contentType: contentTypeSchema,
  }),
});

export type EnhanceResponse = z.infer<typeof enhanceResponseSchema>;

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
