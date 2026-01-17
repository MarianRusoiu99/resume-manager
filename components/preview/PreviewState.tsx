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
  if (!hasMounted) {
    return <PlaceholderState>Initializing preview...</PlaceholderState>;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-start overflow-auto relative"
    >
      {/* Persistent A4 Container to prevent layout shifts */}
      <div
        style={{
          width: `${A4_WIDTH * scale}px`,
          height: `${A4_HEIGHT * scale}px`,
          transition: 'width 0.2s ease-out, height 0.2s ease-out',
        }}
        className="relative shrink-0 shadow-2xl origin-top mb-8 bg-white transition-opacity duration-300"
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
          {htmlContent ? (
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
              title="Template Preview"
              sandbox="allow-same-origin"
              style={{
                width: `${A4_WIDTH}px`,
                height: `${A4_HEIGHT}px`,
                pointerEvents: 'auto',
              }}
            />
          ) : !isLoading && !error ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/5">
              No preview available
            </div>
          ) : null}
        </div>

        {/* Loading Overlay - Shown on top of content to avoid jumps */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/20 backdrop-blur-[1px] transition-opacity duration-300">
            <div className="flex flex-col items-center gap-2 px-4 py-2 rounded-full bg-background/80 shadow-lg border animate-in fade-in zoom-in duration-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs font-medium text-foreground">Updating...</span>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-destructive/5 backdrop-blur-[2px]">
            <div className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium shadow-lg animate-in shake-1">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
