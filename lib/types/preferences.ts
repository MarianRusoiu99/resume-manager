/**
 * User Preferences Type Definitions
 * 
 * Proper type definitions for user preferences and settings
 */

import type { AIFeatureType } from '@/lib/repositories/interfaces';

/**
 * AI feature preference
 */
export interface AIFeaturePreference {
  feature: AIFeatureType;
  modelId: string;
  providerId: string;
}

/**
 * Template preferences
 */
export interface TemplatePreferences {
  defaultProfileId?: string;
  defaultTemplateId?: string;
}

/**
 * Editor preferences
 */
export interface EditorPreferences {
  autoSave?: boolean;
  autoSaveInterval?: number;
  theme?: string;
}

/**
 * User preferences structure
 */
export interface UserPreferences {
  ai?: AIFeaturePreference[];
  template?: TemplatePreferences;
  editor?: EditorPreferences;
  [key: string]: unknown; // Allow for future extensibility
}

/**
 * API response wrapper for preferences
 */
export interface PreferencesResponse {
  success: boolean;
  data?: UserPreferences;
  error?: string;
}
