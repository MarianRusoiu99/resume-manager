/**
 * Shared Input Schemas (prisma-free)
 *
 * Re-exports from the canonical split modules for backward compatibility.
 * New code should import directly from:
 *   - ./ai-providers  for provider schemas
 *   - ./ai-enhancement for enhancement / feature schemas
 */

// Provider schema — canonical definition lives in ai-providers.ts
export {
  aiProviderSchema,
  addApiProviderInputSchema,
  type AIProviderType,
  type AddApiProviderInput,
} from './ai-providers';

// Feature / preference schemas — canonical definition lives in ai-enhancement.ts
export {
  aiFeatureSchema,
  updateAIPreferenceInputSchema,
  type AIFeature,
  type UpdateAIPreferenceInput,
} from './ai-enhancement';
