'use client';

import { useState, useEffect } from 'react';
import type { Resume } from '@/lib/validations/jsonresume';

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

        // Fetch template
        const templateResponse = await fetch(`/api/templates/${templateId}`);
        if (!templateResponse.ok) {
          throw new Error('Failed to fetch template');
        }

        const template: Template = await templateResponse.json();

        // Render template with resume data
        const renderResponse = await fetch('/api/templates/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateHtml: template.htmlTemplate,
            templateCss: template.cssStyles,
            resumeData,
          }),
        });

        if (!renderResponse.ok) {
          throw new Error('Failed to render template');
        }

        const { html } = await renderResponse.json();
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
