'use client';

/**
 * Template Visual Comparison Component
 * 
 * Displays side-by-side visual previews of original and enhanced templates.
 */

import { SideBySideComparison, PreviewIframe } from './SideBySideComparison';
import { renderTemplateServerSide } from '@/components/core/data-display/rendering/client-renderer';
import { sampleResume } from '@/lib/templates/constants/sample-resume';
import { useState, useEffect } from 'react';

export interface TemplateVisualComparisonProps {
  originalHtml: string;
  enhancedHtml: string | null;
  /** AI enhancement is in progress */
  isEnhancing?: boolean;
  className?: string;
}

/**
 * Side-by-side visual preview of original and enhanced templates
 */
export function TemplateVisualComparison({
  originalHtml,
  enhancedHtml,
  isEnhancing = false,
  className,
}: Readonly<TemplateVisualComparisonProps>) {
  // State for rendered previews
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(true);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);

  // Generate preview HTML for original template
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setIsLoadingOriginal(true);
      try {
        const html = await renderTemplateServerSide({
          htmlTemplate: originalHtml,
          resumeData: sampleResume,
        });
        if (!cancelled) setOriginalPreview(html);
      } catch (err) {
        if (!cancelled) setOriginalPreview(null);
      } finally {
        if (!cancelled) setIsLoadingOriginal(false);
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [originalHtml]);

  // Generate preview HTML for enhanced template
  useEffect(() => {
    if (!enhancedHtml) {
      setEnhancedPreview(null);
      setIsLoadingEnhanced(false);
      return;
    }

    let cancelled = false;

    const render = async () => {
      setIsLoadingEnhanced(true);
      try {
        const html = await renderTemplateServerSide({
          htmlTemplate: enhancedHtml,
          resumeData: sampleResume,
        });
        if (!cancelled) setEnhancedPreview(html);
      } catch (err) {
        if (!cancelled) setEnhancedPreview(null);
      } finally {
        if (!cancelled) setIsLoadingEnhanced(false);
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [enhancedHtml]);

  const hasEnhancement = enhancedHtml !== null;

  return (
    <SideBySideComparison
      originalLabel="Original Template"
      enhancedLabel="Enhanced Template"
      originalContent={
        <PreviewIframe
          htmlContent={originalPreview}
          isLoading={isLoadingOriginal}
          title="Original Template Preview"
          emptyMessage="No preview available"
        />
      }
      enhancedContent={
        <PreviewIframe
          htmlContent={hasEnhancement ? enhancedPreview : null}
          isLoading={isEnhancing || isLoadingEnhanced}
          title="Enhanced Template Preview"
          emptyMessage="Enter instructions and click Enhance to generate"
        />
      }
      isLoading={isEnhancing}
      className={className}
    />
  );
}
