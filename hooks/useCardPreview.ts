"use client";

import { useState, useEffect, useCallback } from "react";
import { renderTemplateClientSide } from "@/lib/utils/client-renderer";
import type { Resume } from "@/lib/validations/jsonresume";

interface Template {
  id: string;
  htmlTemplate: string;
  cssStyles: string;
}

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
 * Extracts common preview generation logic from ProfileCard, ResumeCard, etc.
 * Fetches template and renders resume data client-side.
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
  const [previewHtml, setPreviewHtml] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback(async () => {
    if (!content || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      let template: Template | null = null;

      // Try to fetch specific template if templateId provided
      if (templateId) {
        try {
          const templateResponse = await fetch(`/api/template/${templateId}`);
          if (templateResponse.ok) {
            template = await templateResponse.json();
          }
        } catch {
          // Fall through to default template
        }
      }

      // Fallback to default template
      if (!template) {
        const templatesResponse = await fetch("/api/template?limit=1");
        if (!templatesResponse.ok) {
          throw new Error("Failed to load template");
        }

        const { templates } = await templatesResponse.json();
        if (!templates || templates.length === 0) {
          throw new Error("No templates available");
        }
        template = templates[0];
      }

      // Render preview client-side
      const html = renderTemplateClientSide({
        htmlTemplate: template!.htmlTemplate,
        cssStyles: template!.cssStyles,
        resumeData: content,
      });

      setPreviewHtml(html);
    } catch (err) {
      console.error("Failed to generate preview:", err);
      setError(err instanceof Error ? err.message : "Failed to generate preview");
    } finally {
      setIsLoading(false);
    }
  }, [content, templateId, enabled]);

  // Generate preview on mount and when dependencies change
  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  return {
    previewHtml,
    isLoading,
    error,
    refresh: generatePreview,
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

      // Fetch template
      let template: Template | null = null;

      if (templateId) {
        try {
          const templateResponse = await fetch(`/api/template/${templateId}`);
          if (templateResponse.ok) {
            template = await templateResponse.json();
          }
        } catch {
          // Fall through to default template
        }
      }

      if (!template) {
        const templatesResponse = await fetch("/api/template?limit=1");
        if (!templatesResponse.ok) {
          throw new Error("Failed to load template");
        }

        const { templates } = await templatesResponse.json();
        if (!templates || templates.length === 0) {
          throw new Error("No templates available");
        }
        template = templates[0];
      }

      // Export PDF
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: content,
          template: {
            htmlTemplate: template!.htmlTemplate,
            cssStyles: template!.cssStyles,
          },
          fileName: `${fileName.replaceAll(/\s+/g, "_")}.pdf`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export PDF");
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
      console.error("Failed to export PDF:", err);
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
