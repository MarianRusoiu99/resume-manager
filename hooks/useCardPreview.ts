"use client";

import { useState, useCallback } from "react";
import type { Resume } from "@/lib/validations/jsonresume";
import type { Template } from "@/lib/types/template";
import { useTemplatePreview } from "./useTemplatePreview";
import { createComponentLogger } from "@/lib/utils/client-logger";
import { apiV1, type TemplateListResponseDto } from '@/lib/client';

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
 * useExportPdf - Hook for PDF export functionality
 * 
 * Extracts common PDF export logic from card components.
 */
interface UseExportPdfOptions {
  content: Resume | null;
  templateId?: string | null;
  fileName?: string;
}

interface UseExportPdfReturn {
  exportPdf: () => Promise<void>;
  isExporting: boolean;
  error: string | null;
}

export function useExportPdf({
  content,
  templateId,
  fileName = "resume",
}: UseExportPdfOptions): UseExportPdfReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async () => {
    if (!content) {
      setError("No content available for export");
      return;
    }

    try {
      setIsExporting(true);
      setError(null);

      let template: Template | null = null;

      if (templateId) {
        const result = await apiV1.TEMPLATE.GET(templateId).get<Template>();
        if (!result.error && result.data) {
          template = result.data;
        }
      }

      if (!template) {
        const templatesResult = await apiV1.TEMPLATE.LIST.get<TemplateListResponseDto<Template>>();
        const fallback = templatesResult.data?.templates?.[0] ?? null;
        if (templatesResult.error || !fallback) {
          throw new Error(templatesResult.error ?? 'No templates available');
        }
        template = fallback;
      }

      const response = await apiV1.EXPORT.PDF.postFetch(
        {
          resume: content,
          template: {
            htmlTemplate: template.htmlTemplate,
          },
          fileName: `${fileName.replaceAll(/\s+/g, '_')}.pdf`,
        },
        { skipSessionCheck: true },
      );

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replaceAll(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      logger.error('Failed to export PDF', err);
      setError(err instanceof Error ? err.message : "Failed to export PDF");
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, [content, templateId, fileName]);

  return {
    exportPdf,
    isExporting,
    error,
  };
}
