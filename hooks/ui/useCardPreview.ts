"use client";

import { useState, useCallback } from "react";
import type { Resume } from "@/lib/validations/jsonresume";
import type { Template } from "@/lib/types/template";
import { useTemplatePreview } from "@/hooks";
import { createComponentLogger } from "@/lib/utils/client-logger";
import { getTemplate, getTemplates } from "@/app/actions/template";
import { NotFoundError, ExternalServiceError } from "@/lib/errors";
import { useExportPDF as useExportPDFInternal } from "@/components/preview/useExportPDF";

const logger = createComponentLogger('useCardPreview');

interface UseCardPreviewOptions {
  /** Resume/profile data to render */
  content: Resume | null;
  /** Optional specific template ID to use */
  templateId?: string | null;
  /** Whether to fetch and generate preview on mount */
  enabled?: boolean;
}

interface UseCardPreviewReturn {
  /** Generated HTML content for preview */
  previewHtml: string | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Refresh the preview */
  refresh: () => Promise<void>;
}

/**
 * useCardPreview - Hook for generating card preview HTML
 * 
 * Thin wrapper around useTemplatePreview for backward compatibility.
 * Extracts common preview generation logic from ProfileCard, ResumeCard, etc.
 * 
 * @example
 * ```tsx
 * const { previewHtml, isLoading, error } = useCardPreview({
 *   content: resumeData,
 *   templateId: resume.templateId,
 * });
 * 
 * return (
 *   <GalleryCard
 *     previewHtml={previewHtml}
 *     isPreviewLoading={isLoading}
 *     {...otherProps}
 *   />
 * );
 * ```
 */
export function useCardPreview({
  content,
  templateId,
  enabled = true,
}: UseCardPreviewOptions): UseCardPreviewReturn {
  const { htmlContent, isLoading, error, refresh } = useTemplatePreview({
    resumeData: content,
    templateId,
    enabled,
    useFallback: true,
  });

  return {
    previewHtml: htmlContent || undefined,
    isLoading,
    error,
    refresh,
  };
}

/**
 * useExportPDF - Hook for PDF export functionality
 * 
 * Extracts common PDF export logic from card components.
 */
interface UseExportPDFOptions {
  content: Resume | null;
  templateId?: string | null;
  fileName?: string;
}

interface UseExportPDFReturn {
  exportPdf: () => Promise<void>;
  isExporting: boolean;
  error: string | null;
}

export function useExportPDF({
  content,
  templateId,
  fileName = "resume",
}: UseExportPDFOptions): UseExportPDFReturn {
  const { handleExportPDF, isExportingPDF } = useExportPDFInternal();
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async () => {
    if (!content) {
      setError("No content available for export");
      return;
    }

    try {
      setError(null);

      await handleExportPDF({
        resume: content,
        templateId,
        fileName: `${fileName.replaceAll(/\s+/g, '_')}.pdf`,
      });
    } catch (err) {
      logger.error('Failed to export PDF', err);
      setError(err instanceof Error ? err.message : "Failed to export PDF");
      throw err;
    }
  }, [content, templateId, fileName, handleExportPDF]);

  return {
    exportPdf,
    isExporting: isExportingPDF,
    error,
  };
}
