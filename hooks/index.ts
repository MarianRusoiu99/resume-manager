/**
 * Hooks Barrel Exports
 * 
 * Centralized exports for all custom hooks organized by category.
 * 
 * @example
 * ```typescript
 * import { useAutoSave, useTemplatePreview, useIsMobile } from '@/hooks';
 * ```
 * 
 * Hook Categories:
 * - Shared: Low-level, reusable hooks (useIsMobile)
 * - Data: Data fetching and persistence (useAutoSave, useDataFetching)
 * - Features: Domain-specific business logic (useTemplatePreview)
 * - Preview: Resume preview-specific hooks (useExportPDF, useTemplateSelection)
 */

// ============================================================================
// Shared Hooks - Low-level, reusable utilities
// ============================================================================

export { useIsMobile } from './useMobile';

// ============================================================================
// Data Hooks - Data fetching and persistence
// ============================================================================

export { useAutoSave } from './useAutoSave';
export { useComponentLogger } from './useComponentLogger';

// ============================================================================
// Feature Hooks - Domain-specific business logic
// ============================================================================

export { useTemplatePreview } from './useTemplatePreview';
export { useCardPreview } from './useCardPreview';
export { useListForm } from './useListForm';
export { useToastAction } from './useToastAction';
export { useAIModels } from './useAIModels';
export type { AIModel } from './useAIModels';
export { useSettingsManager } from './useSettingsManager';
export { useCoverLetterOperations } from './features/useCoverLetterOperations';
export { useResumeOperations } from './features/useResumeOperations';
export { useResourceOperations } from './features/useResourceOperations';
export type { ResourceOperationsConfig, ResourceOperationsReturn } from './features/useResourceOperations';

// ============================================================================
// Preview Hooks - Resume preview-specific (re-exported from components/preview)
// ============================================================================

export {
  useTemplateSelection,
  useResumeData,
  useExportPDF,
  usePagination,
  usePreviewScale,
  useIframeResize,
} from '@/components/preview';
