/**
 * Preview Content Component
 * Single Responsibility: Display the main preview content
 */

'use client';

import { RefObject } from 'react';
import { A4_WIDTH } from '@/lib/utils/pagination';

// UI Components
import { PreviewHeader } from './PreviewHeader';
import { PreviewState } from './PreviewState';

interface PreviewContentProps {
  showTemplateSelector: boolean;
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
  resumeId?: string;
  templateHtml?: string;
  isExportingPDF: boolean;
  onExportPDF: () => void;
  onToggleFullscreen: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  error: string | null;
  htmlContent: string | null;
  scale: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
}

export function PreviewContent({
  showTemplateSelector,
  selectedTemplateId,
  onTemplateChange,
  resumeId,
  templateHtml,
  isExportingPDF,
  onExportPDF,
  onToggleFullscreen,
  onRefresh,
  isLoading,
  error,
  htmlContent,
  scale,
  currentPage,
  totalPages,
  onPageChange,
  iframeRef,
  containerRef,
}: Readonly<PreviewContentProps>) {
  return (
    <>
      <PreviewHeader
        showTemplateSelector={showTemplateSelector}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={onTemplateChange}
        resumeId={resumeId}
        templateHtml={templateHtml}
        isExportingPDF={isExportingPDF}
        onExportPDF={onExportPDF}
        onToggleFullscreen={onToggleFullscreen}
        onRefresh={onRefresh}
      />

      <div className="flex flex-col items-center justify-center w-full min-h-[600px]">
        <div 
          className="relative bg-white rounded-lg shadow-lg w-full"
          style={{ 
            aspectRatio: '210/297',
            maxWidth: `${A4_WIDTH}px`,
          }}
        >
          <PreviewState
            isLoading={isLoading}
            error={error}
            htmlContent={htmlContent}
            scale={scale}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            iframeRef={iframeRef}
            containerRef={containerRef}
          />
        </div>
      </div>
    </>
  );
}