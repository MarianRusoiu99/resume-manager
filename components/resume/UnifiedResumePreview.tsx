/**
 * Unified Resume Preview Component (Refactored)
 * Orchestrates preview components and hooks following SOLID principles
 * Single Responsibility: Coordinate preview display and interactions
 */

'use client';

import { useState, useRef } from 'react';
import { useTemplatePreview } from '@/lib/hooks/useTemplatePreview';
import type { Resume } from '@/lib/validations/jsonresume';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

// Custom hooks (Single Responsibility Principle)
import { useResumeData } from './preview/useResumeData';
import { usePagination } from './preview/usePagination';
import { usePreviewScale } from './preview/usePreviewScale';
import { useExportPDF } from './preview/useExportPDF';

// Components (Single Responsibility Principle)
import { PreviewControls } from './preview/PreviewControls';
import { PreviewContainer } from './preview/PreviewContainer';
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
}

export function UnifiedResumePreview({
  resumeData,
  resumeId,
  onTemplateChange,
  showTemplateSelector = true,
  showCard = true,
  previewKey = 0,
  className = '',
}: Readonly<UnifiedResumePreviewProps>) {
  const [localPreviewKey, setLocalPreviewKey] = useState(previewKey);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom hooks for separation of concerns
  const { resume, selectedTemplateId, handleTemplateChange } = useResumeData({
    initialData: resumeData,
    resumeId,
    previewKey: localPreviewKey,
  });

  const { htmlContent, isLoading, error } = useTemplatePreview({
    templateId: selectedTemplateId,
    resumeData: resume,
  });

  const { currentPage, totalPages, iframeRef, setCurrentPage } = usePagination({
    htmlContent,
  });

  const scale = usePreviewScale({ containerRef, isFullscreen });

  const { exportPDF, isExporting } = useExportPDF({
    resume,
    selectedTemplateId,
    resumeId,
  });

  // Event handlers
  const handleRefresh = () => {
    setLocalPreviewKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const onTemplateChangeWrapper = (templateId: string | null) => {
    handleTemplateChange(templateId, onTemplateChange);
  };

  // Preview content (with or without card wrapper)
  const previewContent = (
    <>
      <PreviewControls
        showTemplateSelector={showTemplateSelector}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={onTemplateChangeWrapper}
        onExportPDF={exportPDF}
        onToggleFullscreen={toggleFullscreen}
        onRefresh={handleRefresh}
        isExporting={isExporting}
      />

      <PreviewContainer
        ref={iframeRef}
        htmlContent={htmlContent}
        isLoading={isLoading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onPageChange={setCurrentPage}
        containerRef={containerRef}
      />
    </>
  );

  return (
    <>
      {showCard ? (
        <Card className={className}>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              See how your resume looks with different templates
            </CardDescription>
          </CardHeader>
          <CardContent>{previewContent}</CardContent>
        </Card>
      ) : (
        <div className={className}>{previewContent}</div>
      )}

      {/* Fullscreen Modal */}
      <FullscreenModal
        ref={iframeRef}
        isOpen={isFullscreen}
        onClose={toggleFullscreen}
        htmlContent={htmlContent}
        isLoading={isLoading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
