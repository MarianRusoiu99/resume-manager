/**
 * User AI Settings Service (Facade)
 *
 * This file exists to preserve stable import paths while the implementation
 * lives in `lib/services/user-ai-settings/`.
 */

export {
  UserAISettingsService,
  userAISettingsService,
  AI_FEATURES,
} from './user-ai-settings';

export type {
  AIFeatureConfig,
  FeatureModelSelection,
  ResolvedAISettings,
  UpdateFeaturePreferenceInput,
  AIFeatureType,
  ModelPreference,
} from './user-ai-settings';
