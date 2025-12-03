'use client';

import { useState, useEffect } from 'react';
import type { Resume } from '@/lib/validations/jsonresume';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  htmlTemplate: string;
  cssStyles: string;
}

interface UseTemplatePreviewOptions {
  templateId: string | null;
  resumeData: Resume;
}

/**
 * Hook for template preview rendering
 * Fetches template from API and renders client-side (no server round-trip for rendering)
 */
export function useTemplatePreview({ templateId, resumeData }: UseTemplatePreviewOptions) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAndRenderTemplate() {
      if (!templateId) {
        setHtmlContent('');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch template data from API
        const templateResponse = await fetch(`/api/template/${templateId}`);
        if (!templateResponse.ok) {
          throw new Error('Failed to fetch template');
        }

        const template: Template = await templateResponse.json();

        // Render template client-side (no API call needed!)
        const html = renderTemplateClientSide({
          htmlTemplate: template.htmlTemplate,
          cssStyles: template.cssStyles,
          resumeData,
        });

        setHtmlContent(html);
      } catch (err) {
        console.error('Template preview error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load template');
        setHtmlContent('');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndRenderTemplate();
  }, [templateId, resumeData]);

  return { htmlContent, isLoading, error };
}
