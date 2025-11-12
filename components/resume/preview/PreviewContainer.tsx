/**
 * Preview Container Component
 * Responsible for displaying the iframe with pagination
 * Single Responsibility: Container for preview with pagination controls
 */

'use client';

import { forwardRef } from 'react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { PreviewIframe } from './PreviewIframe';
import { PreviewState } from './PreviewState';

interface PreviewContainerProps {
  /** HTML content to display */
  htmlContent: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Current page number */
  currentPage: number;
  /** Total pages */
  totalPages: number;
  /** Scale factor */
  scale: number;
  /** Page change callback */
  onPageChange: (page: number) => void;
  /** Container ref for scale calculation */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const PreviewContainer = forwardRef<
  HTMLIFrameElement,
  PreviewContainerProps
>(
  (
    {
      htmlContent,
      isLoading,
      error,
      currentPage,
      totalPages,
      scale,
      onPageChange,
      containerRef,
    },
    iframeRef
  ) => {
    const renderContent = () => {
      if (isLoading) {
        return <PreviewState type="loading" />;
      }

      if (error) {
        return <PreviewState type="error" message={error} />;
      }

      if (htmlContent) {
        return (
          <>
            <PreviewIframe
              ref={iframeRef}
              htmlContent={htmlContent}
              scale={scale}
            />
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
            />
          </>
        );
      }

      return <PreviewState type="empty" />;
    };

    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[600px]">
        <div
          ref={containerRef}
          className="relative bg-white rounded-lg shadow-lg w-full"
          style={{
            aspectRatio: '210/297',
            maxWidth: '794px',
          }}
        >
          {renderContent()}
        </div>
      </div>
    );
  }
);

PreviewContainer.displayName = 'PreviewContainer';
