/**
 * Custom hook for fetching and rendering template previews
 * Logic for fetching template by ID and rendering it server-side
 */

import { useState, useEffect, useRef } from 'react';
import { getTemplate } from '@/app/actions/template';
import { renderTemplateServerSide } from '@/components/shared/rendering/client-renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import type { DeepPartial } from '@/lib/types';
import { clientLogger } from '@/lib/utils/client-logger';

const logger = clientLogger.forComponent('useTemplatePreview');

interface UseTemplatePreviewProps {
  templateId: string | null;
  resumeData: Resume | DeepPartial<Resume>;
}

export function useTemplatePreview({ templateId, resumeData }: UseTemplatePreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    let isCancelled = false;

    async function fetchAndRender() {
      if (!templateId) {
        setHtmlContent(null);
        setTemplate(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch template data if we don't have it or ID changed
        const templateResult = await getTemplate(templateId);
        
        if (isCancelled) return;

        if (!templateResult.success) {
          throw new Error(templateResult.error || 'Failed to fetch template');
        }

        const templateData = templateResult.data;
        if (isCancelled) return;
        setTemplate(templateData);

        // 2. Render template server-side
        if (templateData?.htmlTemplate) {
          const renderedHtml = await renderTemplateServerSide({
            htmlTemplate: templateData.htmlTemplate,
            resumeData: resumeData as Resume,
          });

          if (!isCancelled) {
            setHtmlContent(renderedHtml);
          }
        } else {
          throw new Error('Template has no HTML content');
        }
      } catch (err) {
        if (!isCancelled) {
          logger.error('Error fetching/rendering template preview', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          // Don't clear htmlContent here to keep previous version visible
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    // Debounce rendering to avoid layout shifts and excessive server calls
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Use shorter delay for initial mount, longer for updates
    const delay = isInitialMount.current ? 0 : 400;
    isInitialMount.current = false;

    timeoutRef.current = setTimeout(() => {
      fetchAndRender();
    }, delay);

    return () => {
      isCancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [templateId, resumeData]);

  return { htmlContent, template, isLoading, error };
}
