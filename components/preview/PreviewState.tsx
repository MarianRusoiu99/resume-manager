/**
 * Preview State Component
 * Single Responsibility: Display different preview states (loading, error, content)
 */

'use client';

import { RefObject } from 'react';
import { A4_WIDTH, A4_HEIGHT } from '@/lib/utils/pagination';

interface PreviewStateProps {
  isLoading: boolean;
  error: string | null;
  htmlContent: string | null;
  scale: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
}

export function PreviewState({
  isLoading,
  error,
  htmlContent,
  scale,
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
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-auto p-4 md:p-8"
    >
      <div
        style={{
          width: `${A4_WIDTH * scale}px`,
          height: `${A4_HEIGHT * scale}px`,
          transition: 'width 0.2s ease-out, height 0.2s ease-out',
        }}
        className="relative shrink-0 shadow-2xl origin-center mb-auto mt-auto"
      >
        <div
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          className="bg-white overflow-hidden rounded-sm"
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
              pointerEvents: 'auto',
            }}
          />
        </div>
      </div>
    </div>
  );
}
