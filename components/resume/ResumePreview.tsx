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
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Custom hooks
import { useTemplateSelection } from '../preview/useTemplateSelection';
import { useResumeData } from '../preview/useResumeData';
import { useExportPDF } from '../preview/useExportPDF';
import { usePagination } from '../preview/usePagination';
import { usePreviewScale } from '../preview/usePreviewScale';

// UI Components
import { PreviewContent } from '../preview/PreviewContent';

const logger = createComponentLogger('ResumePreview');

interface ResumePreviewProps {
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
  /** Custom header actions */
  headerActions?: React.ReactNode;
  /** Custom header title */
  headerTitle?: React.ReactNode;
  /** Disable automatic scaling */
  disableScaling?: boolean;
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
  headerActions,
  headerTitle,
  disableScaling = false,
}: Readonly<ResumePreviewProps>) {
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

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
      fileName: resume.basics?.name ? `${resume.basics.name.replaceAll(' ', '_')}_Resume.pdf` : 'resume.pdf',
    });
  };

  // HTML content rendering logic
  const { htmlContent: fetchedHtmlContent, template, isLoading, error } = useTemplatePreview({
    templateId: templateHtml ? null : selectedTemplateId,
    resumeData: resume,
  });

  const customHtmlContent = useMemo(() => {
    if (!templateHtml) return null;
    try {
      return renderTemplateClientSide({
        htmlTemplate: templateHtml,
        resumeData: resume,
      });
    } catch (err) {
      logger.error('Error rendering custom template', err);
      return null;
    }
  }, [templateHtml, resume]);

  const htmlContent = customHtmlContent || fetchedHtmlContent;

  // Pagination hooks
  const {
    isFullscreen,
    toggleFullscreen,
    currentPage,
    totalPages,
    handlePageChange
  } = usePagination({
    iframeRef,
    htmlContent,
  });

  const {
    currentPage: fullscreenCurrentPage,
    totalPages: fullscreenTotalPages,
    handlePageChange: handleFullscreenPageChange
  } = usePagination({
    iframeRef: fullscreenIframeRef,
    htmlContent,
  });

  // Scaling hooks
  const { scale } = usePreviewScale({
    containerRef,
    isFullscreen: false,
    disabled: disableScaling,
  });

  const { scale: fullscreenScale } = usePreviewScale({
    containerRef: fullscreenContainerRef,
    isFullscreen: true,
    disabled: disableScaling,
  });

  // Sync pagination state when fullscreen opens
  // (Optional: handle sync logic if needed)

  return (
    <>
      {showCard ? (
        <Card className={className}>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>See how your resume looks with different templates</CardDescription>
          </CardHeader>
          <CardContent>
            <PreviewContent
              showTemplateSelector={showTemplateSelector}
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={onTemplateSelect}
              resumeId={resumeId}
              template={template}
              templateHtml={templateHtml}
              isExportingPDF={isExportingPDF}
              onExportPDF={handleExport}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              error={error}
              htmlContent={htmlContent}
              scale={scale}
              iframeRef={iframeRef}
              containerRef={containerRef}
              headerActions={headerActions}
              headerTitle={headerTitle}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </CardContent>
        </Card>
      ) : (
        <PreviewContent
          showTemplateSelector={showTemplateSelector}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={onTemplateSelect}
          resumeId={resumeId}
          template={template}
          templateHtml={templateHtml}
          isExportingPDF={isExportingPDF}
          onExportPDF={handleExport}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          error={error}
          htmlContent={htmlContent}
          scale={scale}
          iframeRef={iframeRef}
          containerRef={containerRef}
          headerActions={headerActions}
          headerTitle={headerTitle}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Fullscreen Preview Dialog */}
      <Dialog open={isFullscreen} onOpenChange={toggleFullscreen}>
        <DialogContent showClose={false} className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden border-none rounded-[2rem] bg-background shadow-2xl">
          <div className="flex flex-col h-full">
            <PreviewContent
              showTemplateSelector={showTemplateSelector}
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={onTemplateSelect}
              resumeId={resumeId}
              template={template}
              templateHtml={templateHtml}
              isExportingPDF={isExportingPDF}
              onExportPDF={handleExport}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={true}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              error={error}
              htmlContent={htmlContent}
              scale={fullscreenScale}
              iframeRef={fullscreenIframeRef}
              containerRef={fullscreenContainerRef}
              headerActions={headerActions}
              headerTitle={headerTitle}
              currentPage={fullscreenCurrentPage}
              totalPages={fullscreenTotalPages}
              onPageChange={handleFullscreenPageChange}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
