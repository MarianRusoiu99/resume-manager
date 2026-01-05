'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Resume } from '@/lib/validations/jsonresume';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import type { Template } from '@/lib/types/template';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { getTemplate, getTemplates } from '@/app/actions/template';

const logger = createComponentLogger('useTemplatePreview');

/**
 * Options for the unified template preview hook
 */
interface UseTemplatePreviewOptions {
  /** Resume data to render in template */
  resumeData: Resume | null;
  /** Specific template ID to use (optional - will fallback to default) */
  templateId?: string | null;
  /** Whether to enable fetching/rendering (default: true) */
  enabled?: boolean;
  /** Whether to use fallback template if specific one fails (default: true) */
  useFallback?: boolean;
}

/**
 * Return type for template preview hook
 */
interface UseTemplatePreviewReturn {
  /** Rendered HTML content */
  htmlContent: string;
  /** The template object used */
  template: Template | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually refresh the preview */
  refresh: () => Promise<void>;
}

/**
 * Fetch a template by ID or get default template
 */
async function fetchTemplate(templateId?: string | null, useFallback = true): Promise<Template | null> {
  if (templateId) {
    const result = await getTemplate(templateId);
    if (result.success && result.data) {
      return result.data as unknown as Template;
    }
  }

  if (useFallback) {
    const listResult = await getTemplates();
    if (listResult.success && listResult.data?.length) {
      return listResult.data[0] as unknown as Template;
    }
  }

  return null;
}

/**
 * Unified hook for template preview rendering
 * 
 * Consolidates logic from useCardPreview and original useTemplatePreview.
 * Fetches template from API and renders client-side.
 * 
 * @example Basic usage with specific template
 * ```tsx
 * const { htmlContent, isLoading } = useTemplatePreview({
 *   resumeData: resume,
 *   templateId: 'template-123',
 * });
 * ```
 * 
 * @example With fallback to default template
 * ```tsx
 * const { htmlContent, isLoading, refresh } = useTemplatePreview({
 *   resumeData: resume,
 *   templateId: null, // Will use default template
 *   useFallback: true,
 * });
 * ```
 * 
 * @example Conditionally enabled
 * ```tsx
 * const { htmlContent } = useTemplatePreview({
 *   resumeData: resume,
 *   templateId: selectedTemplateId,
 *   enabled: isPreviewVisible,
 * });
 * ```
 */
export function useTemplatePreview({
  resumeData,
  templateId,
  enabled = true,
  useFallback = true,
}: UseTemplatePreviewOptions): UseTemplatePreviewReturn {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderPreview = useCallback(async () => {
    // Skip if disabled or no resume data
    if (!enabled || !resumeData) {
      setHtmlContent('');
      setTemplate(null);
      setIsLoading(false);
      return;
    }

    // If no templateId and no fallback, clear content
    if (!templateId && !useFallback) {
      setHtmlContent('');
      setTemplate(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const fetchedTemplate = await fetchTemplate(templateId, useFallback);

      if (!fetchedTemplate) {
        throw new NotFoundError('Template');
      }

      setTemplate(fetchedTemplate);

      // Render template client-side
      const html = renderTemplateClientSide({
        htmlTemplate: fetchedTemplate.htmlTemplate,
        resumeData,
      });

      setHtmlContent(html);
    } catch (err) {
      logger.error('Template preview error', err);
      setError(err instanceof Error ? err.message : 'Failed to load template');
      setHtmlContent('');
      setTemplate(null);
    } finally {
      setIsLoading(false);
    }
  }, [resumeData, templateId, enabled, useFallback]);

  // Render on mount and when dependencies change
  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  return {
    htmlContent,
    template,
    isLoading,
    error,
    refresh: renderPreview,
  };
}
