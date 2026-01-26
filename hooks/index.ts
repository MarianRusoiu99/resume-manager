/**
 * Hooks Barrel Exports
 * 
 * Centralized exports for all custom hooks organized by category.
 * 
 * @example
 * ```typescript
 * import { useAutoSave, useTemplatePreview, useMobile } from "@/hooks";
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
// Notification Hooks - Toast and notification management
// ============================================================================

export { useNotificationManager } from './notifications/useNotificationManager';
export type { Notification } from './notifications/useNotificationManager';
export { useToastAction } from './ui/useToastAction';

// ============================================================================
// UI Hooks - UI-related state and interactions
// ============================================================================

export { useListForm } from './ui/useListForm';
export { useCardPreview } from './ui/useCardPreview';
export { useBaseModal } from './ui/useBaseModal';
export { useExportPDF } from '@/components/preview/useExportPDF';
export { useExportPDF as useCardExportPDF } from './ui/useCardPreview';

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
export type { BreadcrumbItem } from './useAutoBreadcrumbs';
export { useComponentLogger } from './useComponentLogger';

// Re-exports from modules
export { useCoverLetterOperations } from '@/modules/cover-letter/hooks/useCoverLetterOperations';
export { useResumeOperations } from '@/modules/resume/hooks/useResumeOperations';

// Re-exports from components/preview
export {
  useTemplateSelection,
  useResumeData,
  usePagination,
  usePreviewScale,
  useIframeResize,
} from '@/components/preview';
