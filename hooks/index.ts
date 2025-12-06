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
 * - Shared: Low-level, reusable hooks (useIsMobile, useKeyboardShortcut)
 * - Data: Data fetching and persistence (useAutoSave, useDataFetching)
 * - Features: Domain-specific business logic (useTemplatePreview, useProfileSave)
 * - Preview: Resume preview-specific hooks (useExportPDF, useTemplateSelection)
 */

// ============================================================================
// Shared Hooks - Low-level, reusable utilities
// ============================================================================

export { useIsMobile } from './use-mobile';
export { useKeyboardShortcut } from './useKeyboardShortcut';

// ============================================================================
// Data Hooks - Data fetching and persistence
// ============================================================================

export { useAutoSave } from './useAutoSave';
export { useFetch, useAction } from './useDataFetching';

// ============================================================================
// Feature Hooks - Domain-specific business logic
// ============================================================================

export { useTemplatePreview } from './useTemplatePreview';
export { useProfileSave } from './useProfileSave';
export { useCardPreview } from './useCardPreview';
export { useListForm } from './use-list-form';

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
