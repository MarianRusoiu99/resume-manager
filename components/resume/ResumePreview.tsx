/**
 * Unified Resume Preview Component (Refactored)
 * Follows SOLID principles with separated concerns
 */

'use client';

import { useRef, useMemo } from 'react';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTemplatePreview } from '@/hooks/useTemplatePreview';
import { createComponentLogger } from '@/lib/utils/client-logger';

// Custom hooks
import { useTemplateSelection } from '../preview/useTemplateSelection';
import { useResumeData } from '../preview/useResumeData';
import { useExportPDF } from '../preview/useExportPDF';
import { usePagination } from '../preview/usePagination';
import { usePreviewScale } from '../preview/usePreviewScale';
import { useIframeResize } from '../preview/useIframeResize';

// UI Components
import { PreviewContent } from '../preview/PreviewContent';

const logger = createComponentLogger('ResumePreview');

interface UnifiedResumePreviewProps {
  /** Resume data to preview */
  resumeData: Resume;
  /** Optional resume ID for fetching data */
  resumeId?: string;
  /** Optional profile ID for fetching data and saving template preference */
  profileId?: string;
  /** Optional callback when template changes */
  onTemplateChange?: (templateId: string | null) => void;
  /** Show template selector */
  showTemplateSelector?: boolean;
  /** Show card wrapper */
  showCard?: boolean;
  /** Preview key for forcing refresh */
  previewKey?: number;
  /** Custom class name */
  className?: string;
  /** Custom template HTML (for live editing in TemplateEditor) */
  templateHtml?: string;
  /** Custom template CSS (for live editing in TemplateEditor) */
  templateCss?: string;
}

export function ResumePreview({
  resumeData,
  resumeId,
  profileId,
  onTemplateChange,
  showTemplateSelector = true,
  showCard = true,
  previewKey = 0,
  className = '',
  templateHtml,
  templateCss,
}: Readonly<UnifiedResumePreviewProps>) {
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom hooks for separated concerns
  const { selectedTemplateId, handleTemplateChange: onTemplateSelect } = useTemplateSelection({
    resumeId,
    profileId,
    onTemplateChange,
  });

  const { resume, handleRefresh } = useResumeData({
    resumeData,
    resumeId,
    previewKey,
  });

  const { isExportingPDF, handleExportPDF } = useExportPDF();

  const handleExport = () => {
    handleExportPDF({
      resume,
      templateId: templateHtml ? null : selectedTemplateId,
      templateHtml,
      templateCss,
      fileName: resume.basics?.name ? `${resume.basics.name.replaceAll(' ', '_')}_Resume.pdf` : 'resume.pdf',
    });
  };

  const { isFullscreen, toggleFullscreen } = usePagination();

  const { scale } = usePreviewScale({
    containerRef,
    isFullscreen,
  });

  // Fetch template preview (only when not using custom template)
  const { htmlContent: fetchedHtmlContent, isLoading, error } = useTemplatePreview({
    templateId: templateHtml ? null : selectedTemplateId,
    resumeData: resume,
  });

  // Render custom template if provided
  const customHtmlContent = useMemo(() => {
    if (!templateHtml) return null;

    try {
      return renderTemplateClientSide({
        htmlTemplate: templateHtml,
        cssStyles: templateCss || '',
        resumeData: resume,
      });
    } catch (err) {
      logger.error('Error rendering custom template', err);
      return null;
    }
  }, [templateHtml, templateCss, resume]);

  // Use custom HTML if provided, otherwise use fetched template
  const htmlContent = customHtmlContent || fetchedHtmlContent;

  // Handle iframe resizing
  useIframeResize({
    iframeRef,
    htmlContent,
  });

  useIframeResize({
    iframeRef: fullscreenIframeRef,
    htmlContent,
  });


  if (showCard) {
    return (
          
        <Card className={className}>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>See how your resume looks with different templates</CardDescription>
          </CardHeader>
          <CardContent>
            <PreviewContent
              showTemplateSelector={showTemplateSelector && !templateHtml}
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={onTemplateSelect}
              resumeId={resumeId}
              templateHtml={templateHtml}
              isExportingPDF={isExportingPDF}
              onExportPDF={handleExport}
              onToggleFullscreen={toggleFullscreen}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              error={error}
              htmlContent={htmlContent}
              scale={scale}
              iframeRef={iframeRef}
              containerRef={containerRef}
            />
          </CardContent>
        </Card>
    );
  }

  return (
    <PreviewContent
        showTemplateSelector={showTemplateSelector && !templateHtml}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={onTemplateSelect}
        resumeId={resumeId}
        templateHtml={templateHtml}
        isExportingPDF={isExportingPDF}
        onExportPDF={handleExport}
        onToggleFullscreen={toggleFullscreen}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        error={error}
        htmlContent={htmlContent}
        scale={scale}
        iframeRef={iframeRef}
        containerRef={containerRef}
      />
  );
}
