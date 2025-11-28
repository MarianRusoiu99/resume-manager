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
      className="flex items-center justify-center w-full h-full"
    >
      <div
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
        className="relative bg-white"
      >
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full border-0 bg-white"
          title="Template Preview"
          sandbox="allow-same-origin"
          style={{
            width: `${A4_WIDTH}px`,
            minHeight: `${A4_HEIGHT}px`,
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
}
