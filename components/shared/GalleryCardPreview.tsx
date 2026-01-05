/**
 * Gallery Card Preview Component
 * Renders a tiny thumbnail preview of rendered HTML content
 * Uses ScaledIframePreview for consistent scaling behavior
 */

'use client';

import { ScaledIframePreview } from './ScaledIframePreview';
import { Spinner } from '@/components/shared/Spinner';
import { memo } from 'react';

interface GalleryCardPreviewProps {
  /** HTML content to preview */
  htmlContent?: string;
  /** Fallback icon when no content */
  fallbackIcon?: React.ReactNode;
  /** Alt text for accessibility */
  altText?: string;
  /** Loading state */
  isLoading?: boolean;
}

export const GalleryCardPreview = memo(function GalleryCardPreview({
  htmlContent,
  fallbackIcon,
  altText = 'Preview',
  isLoading = false,
}: Readonly<GalleryCardPreviewProps>) {
  if (isLoading) {
    return (
      <div className="w-full h-full bg-linear-to-br from-muted/50 to-muted flex items-center justify-center">
        <Spinner size="md" label="Loading..." />
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="w-full h-full bg-linear-to-br from-muted/50 to-muted flex items-center justify-center">
        <div className="text-center">
          {fallbackIcon || (
            <>
              <div className="text-6xl mb-2">📄</div>
              <p className="text-sm text-muted-foreground">{altText}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <ScaledIframePreview
      htmlContent={htmlContent}
      altText={altText}
    />
  );
});
