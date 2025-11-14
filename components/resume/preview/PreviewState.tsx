/**
 * Preview State Component
 * Single Responsibility: Display different preview states (loading, error, content)
 */

'use client';

import { RefObject } from 'react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { A4_WIDTH, A4_HEIGHT } from '@/lib/utils/pagination';

interface PreviewStateProps {
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

export function PreviewState({
  isLoading,
  error,
  htmlContent,
  scale,
  currentPage,
  totalPages,
  onPageChange,
  iframeRef,
  containerRef,
}: Readonly<PreviewStateProps>) {
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        Loading template...
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        No preview available
      </div>
    );
  }

  return (
    <>
      <div 
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="relative"
        >
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            className="w-full h-full border-0"
            title="Template Preview"
            sandbox="allow-same-origin"
            style={{
              width: `${A4_WIDTH}px`,
              height: `${A4_HEIGHT}px`,
              overflow: 'hidden',
            }}
          />
        </div>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
      />
    </>
  );
}
