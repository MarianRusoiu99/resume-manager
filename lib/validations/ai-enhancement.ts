/**
 * AI Enhancement Validation Schemas
 * 
 * Zod schemas for AI enhancement features, AI preferences,
 * content types, and enhancement request/response validation.
 */

import { z } from 'zod';

// ============================================================================
// AI SETTINGS / FEATURE SCHEMAS
// ============================================================================

/**
 * AI feature types that can have custom model preferences
 */
import { AI_FEATURES, type AIFeature } from '@/lib/types/ai-settings';

export { type AIFeature };
export const aiFeatureSchema = z.enum(AI_FEATURES as unknown as [string, ...string[]]);

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

/**
 * Re-export for backward compatibility with shared-inputs consumers.
 */
export const updateAIPreferenceInputSchema = updateAIPreferenceSchema;

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
