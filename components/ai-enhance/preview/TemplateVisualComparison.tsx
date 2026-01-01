'use client';

/**
 * Template Visual Comparison Component
 * 
 * Displays side-by-side visual previews of original and enhanced templates.
 */

import { SideBySideComparison, PreviewIframe } from './SideBySideComparison';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import { sampleResume } from '@/lib/templates/constants/sample-resume';
import { useMemo } from 'react';

export interface TemplateVisualComparisonProps {
  originalHtml: string;
  originalCss: string;
  enhancedHtml: string | null;
  enhancedCss: string | null;
  /** AI enhancement is in progress */
  isEnhancing?: boolean;
  className?: string;
}

/**
 * Side-by-side visual preview of original and enhanced templates
 */
export function TemplateVisualComparison({
  originalHtml,
  originalCss,
  enhancedHtml,
  enhancedCss,
  isEnhancing = false,
  className,
}: Readonly<TemplateVisualComparisonProps>) {
  // Generate preview HTML for original template
  const originalPreview = useMemo(() => {
    try {
      return renderTemplateClientSide({
        htmlTemplate: originalHtml,
        cssStyles: originalCss,
        resumeData: sampleResume,
      });
    } catch {
      return null;
    }
  }, [originalHtml, originalCss]);

  // Generate preview HTML for enhanced template
  const enhancedPreview = useMemo(() => {
    if (!enhancedHtml) return null;
    try {
      return renderTemplateClientSide({
        htmlTemplate: enhancedHtml,
        cssStyles: enhancedCss || originalCss,
        resumeData: sampleResume,
      });
    } catch {
      return null;
    }
  }, [enhancedHtml, enhancedCss, originalCss]);

  const hasEnhancement = enhancedHtml !== null;

  return (
    <SideBySideComparison
      originalLabel="Original Template"
      enhancedLabel="Enhanced Template"
      originalContent={
        <PreviewIframe
          htmlContent={originalPreview}
          title="Original Template Preview"
          emptyMessage="No preview available"
        />
      }
      enhancedContent={
        <PreviewIframe
          htmlContent={hasEnhancement ? enhancedPreview : null}
          isLoading={isEnhancing}
          title="Enhanced Template Preview"
          emptyMessage="Enter instructions and click Enhance to generate"
        />
      }
      isLoading={isEnhancing}
      className={className}
    />
  );
}
