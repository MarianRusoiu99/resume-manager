'use client';

/**
 * Resume Visual Preview Comparison Component
 * 
 * Displays side-by-side visual previews of original and enhanced resumes
 * using the template preview system.
 */

import { SideBySideComparison, PreviewIframe } from './SideBySideComparison';
import { useTemplatePreview } from '@/hooks';
import type { Resume } from '@/lib/validations/jsonresume';

export interface ResumeVisualComparisonProps {
  originalResume: Resume;
  enhancedResume: Resume | null;
  templateId?: string | null;
  /** AI enhancement is in progress */
  isEnhancing?: boolean;
  className?: string;
}

/**
 * Side-by-side visual preview of original and enhanced resumes
 */
export function ResumeVisualComparison({
  originalResume,
  enhancedResume,
  templateId,
  isEnhancing = false,
  className,
}: Readonly<ResumeVisualComparisonProps>) {
  // Fetch preview for original resume
  const {
    htmlContent: originalHtml,
    isLoading: originalLoading,
  } = useTemplatePreview({
    templateId,
    resumeData: originalResume,
  });

  // Fetch preview for enhanced resume (use original if no enhancement yet)
  const {
    htmlContent: enhancedHtml,
    isLoading: enhancedLoading,
  } = useTemplatePreview({
    templateId,
    resumeData: enhancedResume || originalResume,
    // Only render if we have an enhancement
    enabled: true,
  });

  const hasEnhancement = enhancedResume !== null;

  return (
    <SideBySideComparison
      originalLabel="Original Resume"
      enhancedLabel="Enhanced Resume"
      originalContent={
        <PreviewIframe
          htmlContent={originalHtml}
          isLoading={originalLoading}
          title="Original Resume Preview"
          emptyMessage="Loading preview..."
        />
      }
      enhancedContent={
        <PreviewIframe
          htmlContent={hasEnhancement ? enhancedHtml : null}
          isLoading={isEnhancing || (hasEnhancement && enhancedLoading)}
          title="Enhanced Resume Preview"
          emptyMessage="Enter instructions and click Enhance to generate"
        />
      }
      isLoading={isEnhancing}
      className={className}
    />
  );
}
