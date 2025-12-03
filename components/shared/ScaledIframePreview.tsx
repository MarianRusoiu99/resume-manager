/**
 * Scaled Iframe Preview Component
 * Reusable component for rendering HTML content in a scaled iframe
 * Used by both GalleryCard and ResumePreview for consistent scaling
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface ScaledIframePreviewProps {
  /** HTML content to render in iframe */
  htmlContent: string;
  /** Alt text for accessibility */
  altText?: string;
  /** Width of the content (e.g., A4 width = 794px) */
  contentWidth?: number;
  /** Height of the content (e.g., A4 height = 1123px) */
  contentHeight?: number;
  /** Custom class for the container */
  className?: string;
  /** Callback when iframe loads */
  onLoad?: () => void;
}

// A4 dimensions in pixels at 96 DPI
const DEFAULT_CONTENT_WIDTH = 794;
const DEFAULT_CONTENT_HEIGHT = 1123;

export function ScaledIframePreview({
  htmlContent,
  altText = 'Preview',
  contentWidth = DEFAULT_CONTENT_WIDTH,
  contentHeight = DEFAULT_CONTENT_HEIGHT,
  className = '',
  onLoad,
}: Readonly<ScaledIframePreviewProps>) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate scale to fit container while maintaining aspect ratio
  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale based on both dimensions
        const scaleWidth = containerWidth / contentWidth;
        const scaleHeight = containerHeight / contentHeight;

        // Use the smaller scale to ensure content fits
        const finalScale = Math.min(scaleWidth, scaleHeight);
        setScale(finalScale);
      }
    };

    calculateScale();

    // Use ResizeObserver to recalculate on container resize
    const resizeObserver = new ResizeObserver(calculateScale);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [contentWidth, contentHeight]);

  // Handle iframe load event
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && onLoad) {
      const handleLoad = () => {
        onLoad();
      };
      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [onLoad]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-linear-to-br from-muted/50 to-muted flex items-center justify-center ${className}`}
    >
      <div
        style={{
          width: `${contentWidth}px`,
          height: `${contentHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
        className="relative"
      >
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full h-full border-0 pointer-events-none bg-white shadow-lg"
          title={altText}
          sandbox="allow-same-origin"
          style={{
            width: `${contentWidth}px`,
            height: `${contentHeight}px`,
          }}
        />
      </div>
    </div>
  );
}
