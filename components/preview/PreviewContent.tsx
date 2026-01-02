/**
 * Preview Content Component
 * Single Responsibility: Display the main preview content
 */

'use client';

import { RefObject } from 'react';

// UI Components
import { PreviewHeader } from './PreviewHeader';
import { PreviewState } from './PreviewState';
import { PaginationControls } from '@/components/ui/pagination-controls';
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
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PreviewContent(props: Readonly<PreviewContentProps>) {
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
    currentPage,
    totalPages,
    onPageChange,
  } = props;
  return (
    <div className="flex flex-col h-full relative group">
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

      <div className="flex-1 min-h-0 flex flex-col items-center w-full overflow-hidden bg-muted/5 relative">
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <PreviewState
            isLoading={isLoading}
            error={error}
            htmlContent={htmlContent}
            scale={scale}
            iframeRef={iframeRef}
            containerRef={containerRef}
          />
        </div>

        {totalPages > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}