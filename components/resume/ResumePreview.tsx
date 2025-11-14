/**
 * Unified Resume Preview Component (Refactored)
 * Follows SOLID principles with separated concerns
 */

'use client';

import { useRef, useMemo } from 'react';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTemplatePreview } from '@/lib/hooks/useTemplatePreview';

// Custom hooks
import { useTemplateSelection } from './preview/useTemplateSelection';
import { useResumeData } from './preview/useResumeData';
import { useExportPDF } from './preview/useExportPDF';
import { usePagination } from './preview/usePagination';
import { usePreviewScale } from './preview/usePreviewScale';
import { useIframePagination } from './preview/useIframePagination';

// UI Components
import { PreviewContent } from './preview/PreviewContent';
import { FullscreenModal } from './preview/FullscreenModal';

interface UnifiedResumePreviewProps {
  /** Resume data to preview */
  resumeData: Resume;
  /** Optional resume ID for fetching data */
  resumeId?: string;
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
    onTemplateChange,
  });

  const { resume, handleRefresh } = useResumeData({
    resumeData,
    resumeId,
    previewKey,
  });

  const { isExportingPDF, handleExportPDF } = useExportPDF();

  const handleExport = () => {
    if (!resumeId) {
      console.warn('Cannot export: resumeId is required');
      return;
    }
    handleExportPDF(resumeId);
  };

  const { currentPage, totalPages, isFullscreen, setCurrentPage, setTotalPages, toggleFullscreen } = usePagination();

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
      console.error('Error rendering custom template:', err);
      return null;
    }
  }, [templateHtml, templateCss, resume]);

  // Use custom HTML if provided, otherwise use fetched template
  const htmlContent = customHtmlContent || fetchedHtmlContent;

  // Handle iframe pagination
  useIframePagination({
    iframeRef,
    fullscreenIframeRef,
    htmlContent,
    currentPage,
    setTotalPages,
    setCurrentPage,
  });

  if (showCard) {
    return (
      <>
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
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              iframeRef={iframeRef}
              containerRef={containerRef}
            />
          </CardContent>
        </Card>

        <FullscreenModal
          isOpen={isFullscreen}
          onClose={toggleFullscreen}
          htmlContent={htmlContent}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          fullscreenIframeRef={fullscreenIframeRef}
        />
      </>
    );
  }

  return (
    <>
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
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        iframeRef={iframeRef}
        containerRef={containerRef}
      />
      
      <FullscreenModal
        isOpen={isFullscreen}
        onClose={toggleFullscreen}
        htmlContent={htmlContent}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        fullscreenIframeRef={fullscreenIframeRef}
      />
    </>
  );
}
