/**
 * Preview Content Component
 * Single Responsibility: Display the main preview content
 */

'use client';

import { RefObject } from 'react';

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
  iframeRef,
  containerRef,
}: Readonly<PreviewContentProps>) {
  return (
    <>
      <PreviewHeader
        showTemplateSelector={showTemplateSelector}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={onTemplateChange}
        templateHtml={templateHtml}
        isExportingPDF={isExportingPDF}
        onExportPDF={onExportPDF}
      />

      <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden">
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
      </div>
    </>
  );
}