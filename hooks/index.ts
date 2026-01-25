/**
 * Hooks Barrel Exports
 * 
 * Centralized exports for all custom hooks organized by category.
 * 
 * @example
 * ```typescript
 * import { useAutoSave, useTemplatePreview, useMobile } from '@/hooks';
 * ```
 */

// ============================================================================
// Core Hooks - Generic, low-level utilities
// ============================================================================

export { useAutoSave } from './core/useAutoSave';
export { useDebouncedCallback } from './core/useDebouncedCallback';
export { useIsMobile as useMobile } from './core/useMobile';
export { useAsyncOperation } from './core/useAsyncOperation';

// ============================================================================
// UI Hooks - UI-related state and interactions
// ============================================================================

export { useToastAction } from './ui/useToastAction';
export { useListForm } from './ui/useListForm';
export { useCardPreview } from './ui/useCardPreview';

// ============================================================================
// Data Hooks - Data fetching and persistence
// ============================================================================

export { useResourceOperations } from './data/useResourceOperations';
export type { ResourceOperationsConfig, ResourceOperationsReturn } from './data/useResourceOperations';
export { useResourceCollection } from './data/useResourceCollection';
export { useSettingsManager } from './data/useSettingsManager';

// ============================================================================
// Feature Hooks - Domain-specific business logic
// ============================================================================

export { useTemplatePreview } from './features/useTemplatePreview';
export { useTemplatePreview as useTemplatePreviewLegacy } from './features/useTemplatePreviewLegacy';
export { useAIModels } from './useAIModels';
export type { AIModel } from './useAIModels';
export { useFeatureModelPreference } from './useFeatureModelPreference';
export { useResumeImport } from './useResumeImport';
export { useAutoSaveForm } from './useAutoSaveForm';
export { useAutoBreadcrumbs } from './useAutoBreadcrumbs';
export { useComponentLogger } from './useComponentLogger';

// Re-exports from modules
export { useCoverLetterOperations } from '@/modules/cover-letter/hooks/useCoverLetterOperations';
export { useResumeOperations } from '@/modules/resume/hooks/useResumeOperations';

// Re-exports from components/preview
export {
  useTemplateSelection,
  useResumeData,
  useExportPDF,
  usePagination,
  usePreviewScale,
  useIframeResize,
} from '@/components/preview';
