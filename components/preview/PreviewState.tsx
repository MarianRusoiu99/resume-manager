/**
 * Preview State Component
 * Single Responsibility: Display different preview states (loading, error, content)
 */

'use client';

import { RefObject, useState, useEffect } from 'react';
import { A4_WIDTH, A4_HEIGHT } from '@/lib/utils/pagination';

interface PreviewStateProps {
  isLoading: boolean;
  error: string | null;
  htmlContent: string | null;
  scale: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Wrapper div used consistently for all placeholder states
 * to avoid hydration mismatches between server and client
 */
function PlaceholderState({ children, className = 'text-muted-foreground' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
}

export function PreviewState({
  isLoading,
  error,
  htmlContent,
  scale,
  iframeRef,
  containerRef,
}: Readonly<PreviewStateProps>) {
  // Track if component has mounted to avoid hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // During SSR and initial client render, show consistent loading state
  // This ensures server HTML matches initial client render
  if (!hasMounted) {
    return <PlaceholderState>Loading template...</PlaceholderState>;
  }

  if (isLoading) {
    return <PlaceholderState>Loading template...</PlaceholderState>;
  }

  if (error) {
    return <PlaceholderState className="text-destructive">{error}</PlaceholderState>;
  }

  if (!htmlContent) {
    return <PlaceholderState>No preview available</PlaceholderState>;
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
