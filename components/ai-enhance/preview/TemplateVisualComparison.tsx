'use client';

/**
 * Template Visual Comparison Component
 * 
 * Displays side-by-side visual previews of original and enhanced templates.
 */

import { SideBySideComparison, PreviewIframe } from './SideBySideComparison';
import { renderTemplateServerSide } from '@/lib/utils/client-renderer';
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
    setIsLoadingOriginal(true);

    renderTemplateServerSide({
      htmlTemplate: originalHtml,
      resumeData: sampleResume,
    })
      .then((html) => {
        if (!cancelled) {
          setOriginalPreview(html);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOriginalPreview(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingOriginal(false);
        }
      });

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
    setIsLoadingEnhanced(true);

    renderTemplateServerSide({
      htmlTemplate: enhancedHtml,
      resumeData: sampleResume,
    })
      .then((html) => {
        if (!cancelled) {
          setEnhancedPreview(html);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnhancedPreview(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingEnhanced(false);
        }
      });

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
