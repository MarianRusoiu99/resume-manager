'use client';

/**
 * Content Preview Component
 * 
 * Displays text content with optional loading and empty states.
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ContentType } from '@/lib/validations/settings';

interface ContentPreviewProps {
  content: string;
  contentType?: ContentType;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  maxHeight?: string;
}

export function ContentPreview({
  content,
  contentType = 'text',
  isLoading = false,
  emptyMessage = 'No content',
  className,
  maxHeight = '350px',
}: Readonly<ContentPreviewProps>) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2 p-3', className)}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-[75%]" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className={cn('flex items-center justify-center p-6', className)}>
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ScrollArea className={className} style={{ maxHeight }}>
      <pre
        className={cn(
          'p-3 text-sm whitespace-pre-wrap break-words',
          contentType === 'text' ? 'font-sans' : 'font-mono'
        )}
      >
        {content}
      </pre>
    </ScrollArea>
  );
}
