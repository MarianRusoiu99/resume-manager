'use client';

/**
 * Side-by-Side Comparison Layout Component
 * 
 * A reusable component for displaying original vs enhanced content
 * side by side. Works with any content type (text, resume preview, template).
 */

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SideBySideComparisonProps {
  /** Label for the original panel */
  originalLabel?: string;
  /** Label for the enhanced panel */
  enhancedLabel?: string;
  /** Content to render in the original panel */
  originalContent: ReactNode;
  /** Content to render in the enhanced panel */
  enhancedContent: ReactNode;
  /** Show loading indicator in enhanced panel */
  isLoading?: boolean;
  /** Additional class name */
  className?: string;
  /** Whether to show card styling */
  showCards?: boolean;
}

/**
 * Side-by-Side Comparison Layout
 * 
 * Renders two panels side by side with consistent styling.
 * Used for comparing original vs enhanced content.
 */
export function SideBySideComparison({
  originalLabel = 'Original',
  enhancedLabel = 'Enhanced',
  originalContent,
  enhancedContent,
  isLoading = false,
  className,
  showCards = true,
}: Readonly<SideBySideComparisonProps>) {
  const PanelWrapper = showCards ? Card : 'div';
  const ContentWrapper = showCards ? CardContent : 'div';

  return (
    <div className={cn('grid grid-cols-2 gap-4 h-full min-h-0', className)}>
      {/* Original Panel */}
      <PanelWrapper className="flex flex-col overflow-hidden border rounded-lg">
        <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0">
          <Label className="text-sm font-medium text-muted-foreground">
            {originalLabel}
          </Label>
        </div>
        <ContentWrapper className={cn('flex-1 overflow-hidden', showCards && 'p-0')}>
          {originalContent}
        </ContentWrapper>
      </PanelWrapper>

      {/* Enhanced Panel */}
      <PanelWrapper className="flex flex-col overflow-hidden border rounded-lg">
        <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0 flex items-center justify-between">
          <Label className="text-sm font-medium text-muted-foreground">
            {enhancedLabel}
          </Label>
          {isLoading && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] animate-pulse">Analyzing...</span>
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <ContentWrapper className={cn('flex-1 overflow-hidden', showCards && 'p-0')}>
          {enhancedContent}
        </ContentWrapper>
      </PanelWrapper>
    </div>
  );
}

/**
 * Empty state component for panels
 */
export function EmptyPanelContent({
  message = 'No content available',
  isLoading = false,
}: Readonly<{
  message?: string;
  isLoading?: boolean;
}>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground italic">
      {message}
    </div>
  );
}

/**
 * Iframe preview component for templates/resumes
 */
export function PreviewIframe({
  htmlContent,
  isLoading = false,
  title = 'Preview',
  emptyMessage = 'No preview available',
}: Readonly<{
  htmlContent: string | null;
  isLoading?: boolean;
  title?: string;
  emptyMessage?: string;
}>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={htmlContent}
      className="w-full h-full bg-white"
      title={title}
      sandbox="allow-same-origin"
    />
  );
}
