/**
 * Gallery Card Preview Component
 * Renders a tiny thumbnail preview of rendered HTML content
 * Uses ScaledIframePreview for consistent scaling behavior
 */

'use client';

import { ScaledIframePreview } from './ScaledIframePreview';

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

export function GalleryCardPreview({
  htmlContent,
  fallbackIcon,
  altText = 'Preview',
  isLoading = false,
}: Readonly<GalleryCardPreviewProps>) {
  if (isLoading) {
    return (
      <div className="w-full h-full bg-linear-to-br from-muted/50 to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
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
}
