/**
 * Shared Input Schemas (prisma-free)
 *
 * Zod schemas/types intended to be imported by both server and client.
 * Do NOT import Prisma types here.
 */

import { z } from 'zod';

export const aiProviderSchema = z.enum(['openai', 'google', 'anthropic']);
export type AIProviderType = z.infer<typeof aiProviderSchema>;

export const addApiProviderInputSchema = z.object({
  name: z.string().min(1).max(100),
  provider: aiProviderSchema,
  apiKey: z.string().min(10).max(500),
});
export type AddApiProviderInput = z.infer<typeof addApiProviderInputSchema>;

export const aiFeatureSchema = z.enum(['resume', 'coverLetter', 'enhance', 'template']);
export type AIFeature = z.infer<typeof aiFeatureSchema>;

export const updateAIPreferenceInputSchema = z.object({
  feature: aiFeatureSchema,
  providerId: z.string().cuid().nullable(),
  modelId: z.string().nullable(),
});
export type UpdateAIPreferenceInput = z.infer<typeof updateAIPreferenceInputSchema>;

