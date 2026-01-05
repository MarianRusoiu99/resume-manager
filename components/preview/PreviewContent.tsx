/**
 * Preview Content Component
 * Single Responsibility: Display the main preview content
 */

'use client';

import { RefObject, memo } from 'react';

// UI Components
import { PreviewHeader } from './PreviewHeader';
import { PreviewState } from './PreviewState';
import type { Template } from '@/lib/types/template';

interface PreviewContentProps {
  showTemplateSelector: boolean;
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
  resumeId?: string;
  template?: Template | null;
  templateHtml?: string;
  isExportingPDF: boolean;
  onExportPDF: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  error: string | null;
  htmlContent: string | null;
  scale: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  headerActions?: React.ReactNode;
  headerTitle?: React.ReactNode;
}

export const PreviewContent = memo(function PreviewContent(props: Readonly<PreviewContentProps>) {
  const {
    showTemplateSelector,
    selectedTemplateId,
    onTemplateChange,
    template,
    templateHtml,
    isExportingPDF,
    onExportPDF,
    onToggleFullscreen,
    isFullscreen,
    isLoading,
    error,
    htmlContent,
    scale,
    iframeRef,
    containerRef,
    headerActions,
    headerTitle,
  } = props;

  return (
    <div className="flex flex-col h-full w-full relative group min-h-0">
      <PreviewHeader
        showTemplateSelector={showTemplateSelector}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={onTemplateChange}
        template={template}
        templateHtml={templateHtml}
        isExportingPDF={isExportingPDF}
        onExportPDF={onExportPDF}
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
        actions={headerActions}
        title={headerTitle}
      />

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center w-full overflow-hidden bg-muted/30 relative">
        <PreviewState
          isLoading={isLoading}
          error={error}
          htmlContent={htmlContent}
          scale={scale}
          iframeRef={iframeRef}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
});
